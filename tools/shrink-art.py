#!/usr/bin/env python3
"""
shrink-art.py -- resize the game's oversized PNGs in place, carefully.

WHY THIS EXISTS

The game canvas is 390x780 logical, 780x1560 on a retina phone. A lot of
the art is far larger than it can ever be shown at -- the treatment tiles
are 1448x1086 for a slot about 170x110 -- and that costs three ways:
download size, decoded memory on the phone, and per-frame resampling.

It measured as single frames taking 143ms while the game's own drawing
took 0.7ms.

HOW IT BEHAVES

  * IT DOES NOTHING BY DEFAULT. Run it and it only tells you what it
    would do. Nothing is written without --apply.
  * Every file it touches is copied to a timestamped backup folder first.
  * It only shrinks. An image already smaller than its cap is skipped.
  * It re-opens every file it writes and checks the result is valid and
    the size it expected, and it will say so loudly if not.
  * Transparency is preserved.

USAGE

    python3 tools/shrink-art.py                      # dry run, everything
    python3 tools/shrink-art.py --only treatment     # dry run, one folder
    python3 tools/shrink-art.py --only treatment --apply
    python3 tools/shrink-art.py --apply              # the lot

Backups land in  assets/_art-backup-<timestamp>/  keeping folder structure.
To undo, copy that folder's contents back over assets/.
"""

import argparse
import os
import shutil
import sys
import time

try:
    from PIL import Image
except ImportError:
    sys.exit(
        "Pillow is not installed. Run:\n\n"
        "    pip3 install --user Pillow\n"
    )

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(REPO, "assets")

# Longest-side cap per folder. Anything not listed uses DEFAULT_CAP.
# These are deliberately generous -- roughly double what the canvas can
# show -- so nothing softens visibly.
# Longest-side cap per folder.
#
# CHOSEN BY MEASURING, not guessing. The canvas is 390x780 logical and
# 780x1560 on a retina phone, and full-screen art is drawn to COVER, so
# the scale is max(780/w, 1560/h).
#
# The cards and character art are 1536x1024 -- LANDSCAPE on a PORTRAIT
# canvas -- which means cover already scales them UP by about 1.5x. They
# are not oversized at all; they are under-sized for the way they are
# used, and shrinking them would visibly soften them. Same for
# chapter5-background.png at 887x1774.
#
# So only the genuinely small stuff gets a small cap: things drawn into
# little slots, where the source is many times larger than the space.
# Everything else is capped at 1800, which is above what anything here
# actually is -- it is a safety net against some future 4000px import,
# not a resize of what exists today.
#
# The real win on the big files is not their dimensions, it is that they
# are PNGs of photographic art. That is a separate job -- see the note
# printed at the end of a dry run.
CAPS = {
    "treatment":   500,    # drawn into ~170x110 slots
    "collectibles": 600,   # small pickups
    "obstacles":   700,    # sprites
}
DEFAULT_CAP = 1800

SKIP_DIRS = {"fonts", "sounds", "audio", "pages"}   # not game art


def cap_for(rel_path):
    parts = rel_path.split(os.sep)
    for part in parts:
        if part in CAPS:
            return CAPS[part]
    return DEFAULT_CAP


def human(n):
    return f"{n/1024/1024:.2f} MB" if n >= 1024*1024 else f"{n/1024:.0f} KB"


def collect(only):
    out = []
    for root, dirs, files in os.walk(ASSETS):
        dirs[:] = [d for d in dirs
                   if d not in SKIP_DIRS and not d.startswith("_art-backup-")]
        for f in files:
            if not f.lower().endswith(".png"):
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, ASSETS)
            if only and only not in rel.split(os.sep):
                continue
            out.append((full, rel))
    return sorted(out, key=lambda x: x[1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="actually write files (default is a dry run)")
    ap.add_argument("--only", metavar="FOLDER",
                    help="limit to one folder under assets/, e.g. treatment")
    args = ap.parse_args()

    if not os.path.isdir(ASSETS):
        sys.exit(f"Could not find {ASSETS}")

    items = collect(args.only)
    if not items:
        sys.exit("No PNGs matched.")

    stamp = time.strftime("%Y%m%d-%H%M%S")
    backup_root = os.path.join(ASSETS, f"_art-backup-{stamp}")

    print(f"{'DRY RUN -- nothing will be written' if not args.apply else 'APPLYING'}")
    print(f"{len(items)} PNG files under assets/"
          f"{'' if not args.only else args.only + '/'}\n")

    before_total = after_total = 0
    changed = skipped = failed = 0
    problems = []

    for full, rel in items:
        size_before = os.path.getsize(full)
        before_total += size_before

        try:
            with Image.open(full) as im:
                w, h = im.size
                mode = im.mode
        except Exception as e:
            print(f"  !! could not read {rel}: {e}")
            failed += 1
            after_total += size_before
            continue

        cap = cap_for(rel)
        longest = max(w, h)

        if longest <= cap:
            skipped += 1
            after_total += size_before
            continue

        scale = cap / longest
        nw, nh = max(1, round(w * scale)), max(1, round(h * scale))

        print(f"  {rel}")
        print(f"      {w}x{h} -> {nw}x{nh}   {human(size_before)}", end="")

        if not args.apply:
            print("   (would shrink)")
            changed += 1
            after_total += int(size_before * scale * scale)   # rough estimate
            continue

        # ---- back it up before touching anything ----
        bpath = os.path.join(backup_root, rel)
        os.makedirs(os.path.dirname(bpath), exist_ok=True)
        shutil.copy2(full, bpath)

        try:
            with Image.open(full) as im:
                if im.mode not in ("RGBA", "RGB", "LA", "L", "P"):
                    im = im.convert("RGBA")
                if im.mode == "P":
                    im = im.convert("RGBA")
                out = im.resize((nw, nh), Image.LANCZOS)
                out.save(full, "PNG", optimize=True)
        except Exception as e:
            shutil.copy2(bpath, full)          # put the original back
            print(f"   FAILED ({e}) -- restored from backup")
            problems.append(rel)
            failed += 1
            after_total += size_before
            continue

        # ---- verify what we just wrote ----
        try:
            with Image.open(full) as check:
                cw, ch = check.size
                check.load()
            if (cw, ch) != (nw, nh):
                raise ValueError(f"expected {nw}x{nh}, got {cw}x{ch}")
        except Exception as e:
            shutil.copy2(bpath, full)
            print(f"   VERIFY FAILED ({e}) -- restored from backup")
            problems.append(rel)
            failed += 1
            after_total += size_before
            continue

        size_after = os.path.getsize(full)
        after_total += size_after
        changed += 1
        print(f" -> {human(size_after)}   ok")

    print()
    print("=" * 58)
    print(f"  shrunk   : {changed}")
    print(f"  untouched: {skipped}  (already within their cap)")
    print(f"  failed   : {failed}")
    print(f"  before   : {human(before_total)}")
    print(f"  after    : {human(after_total)}"
          f"{'  (estimated)' if not args.apply else ''}")
    if before_total:
        print(f"  saved    : {100*(1-after_total/before_total):.0f}%")
    if args.apply:
        print(f"\n  backups  : {backup_root}")
        print( "  to undo  : cp -r '<that folder>'/* assets/")
    else:
        print("\n  Nothing was written. Add --apply to do it for real.")
    # Point at the files where resizing is the wrong tool.
    big = []
    for full, rel in items:
        sz = os.path.getsize(full)
        if sz > 1_000_000:
            try:
                with Image.open(full) as im:
                    w, h = im.size
                if max(w, h) <= cap_for(rel):
                    big.append((rel, sz, w, h))
            except Exception:
                pass
    if big:
        big.sort(key=lambda x: -x[1])
        total = sum(x[1] for x in big)
        print(f"\n  {len(big)} files over 1MB are already the right DIMENSIONS")
        print(f"  ({human(total)} total). Resizing cannot help these -- they are")
        print( "  big because they are PNGs of painted art. Converting them to")
        print( "  JPEG or WebP, or running pngquant, is the job for these:")
        for rel, sz, w, h in big[:8]:
            print(f"   {human(sz):>9}  {w}x{h}  {rel}")
        if len(big) > 8:
            print(f"   ... and {len(big)-8} more")

    if problems:
        print("\n  PROBLEM FILES (restored from backup):")
        for p in problems:
            print("   -", p)
    print("=" * 58)


if __name__ == "__main__":
    main()
