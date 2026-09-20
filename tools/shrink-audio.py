#!/usr/bin/env python3
"""
shrink-audio.py -- re-encode the game's audio smaller, carefully.

WHY

Music is the heaviest thing in this repo after the art. A phone speaker is
mono, so stereo doubles both the download and the decode work for nothing
anyone can hear, and background music under sound effects does not need a
high bitrate.

Decode cost scales with DURATION, not just file size, so this also prints
how long every track is -- if something is four minutes and merely loops,
shortening it beats any bitrate change and this script will not do that
for you. Look at the durations in the dry run.

HOW IT BEHAVES

  * IT DOES NOTHING BY DEFAULT. Nothing is written without --apply.
  * Every file is copied to a timestamped backup folder before it changes.
  * Tiny files are skipped -- the sound effects are already a few KB and
    re-encoding short percussive sounds only risks making them worse.
  * Every output is probed after writing: it must exist, be readable, and
    have the same duration as the original. Anything that fails is
    restored from its backup and reported at the end.
  * Originals are never deleted.

USAGE

    python3 tools/shrink-audio.py                 # dry run, whole repo
    python3 tools/shrink-audio.py --only music    # dry run, one folder
    python3 tools/shrink-audio.py --apply
    python3 tools/shrink-audio.py --bitrate 128 --apply
    python3 tools/shrink-audio.py --stereo --apply # keep stereo

Needs ffmpeg:   sudo apt install ffmpeg
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_EXT = (".mp3", ".ogg", ".m4a", ".wav", ".aac")
MIN_BYTES = 200 * 1024          # leave the little sound effects alone
SKIP_PARTS = {"node_modules", ".git", "backups"}


def have(tool):
    return shutil.which(tool) is not None


def probe(path):
    """(duration_seconds, channels, bitrate) or (None, None, None)."""
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_format", "-show_streams", path],
            capture_output=True, text=True, timeout=60
        ).stdout
        d = json.loads(out)
        dur = float(d.get("format", {}).get("duration") or 0)
        ch = None
        for st in d.get("streams", []):
            if st.get("codec_type") == "audio":
                ch = st.get("channels")
                break
        br = int(d.get("format", {}).get("bit_rate") or 0) // 1000
        return dur, ch, br
    except Exception:
        return None, None, None


def human(n):
    return f"{n/1024/1024:.2f} MB" if n >= 1024*1024 else f"{n/1024:.0f} KB"


def mmss(sec):
    if not sec:
        return "?"
    return f"{int(sec//60)}:{int(sec%60):02d}"


def collect(only):
    out = []
    for root, dirs, files in os.walk(REPO):
        dirs[:] = [d for d in dirs
                   if d not in SKIP_PARTS and not d.startswith("_audio-backup-")]
        for f in files:
            if not f.lower().endswith(AUDIO_EXT):
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, REPO)
            if only and only not in rel.split(os.sep):
                continue
            out.append((full, rel))
    return sorted(out, key=lambda x: x[1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--only", metavar="FOLDER")
    ap.add_argument("--bitrate", type=int, default=96,
                    help="kbps, default 96")
    ap.add_argument("--stereo", action="store_true",
                    help="keep stereo (default is mono)")
    ap.add_argument("--min-kb", type=int, default=MIN_BYTES // 1024,
                    help="skip files smaller than this, default 200")
    args = ap.parse_args()

    if not have("ffmpeg") or not have("ffprobe"):
        sys.exit("ffmpeg / ffprobe not found. Install with:\n\n"
                 "    sudo apt install ffmpeg\n")

    items = collect(args.only)
    if not items:
        sys.exit("No audio files matched.")

    stamp = time.strftime("%Y%m%d-%H%M%S")
    backup_root = os.path.join(REPO, f"_audio-backup-{stamp}")
    channels = 2 if args.stereo else 1

    print("DRY RUN -- nothing will be written" if not args.apply else "APPLYING")
    print(f"target: {args.bitrate} kbps, {'stereo' if args.stereo else 'mono'}")
    print(f"{len(items)} audio files\n")

    before = after = 0
    changed = skipped = failed = 0
    problems = []
    long_ones = []

    for full, rel in items:
        size_before = os.path.getsize(full)
        before += size_before

        if size_before < args.min_kb * 1024:
            skipped += 1
            after += size_before
            continue

        dur, ch, br = probe(full)
        if dur is None:
            print(f"  !! could not read {rel}")
            failed += 1
            after += size_before
            continue

        if dur > 120:
            long_ones.append((rel, dur))

        print(f"  {rel}")
        print(f"      {mmss(dur)}  {ch or '?'}ch  {br or '?'}kbps  "
              f"{human(size_before)}", end="")

        # nothing to gain
        if (br and br <= args.bitrate) and (ch == channels):
            print("   already smaller -- skipped")
            skipped += 1
            after += size_before
            continue

        if not args.apply:
            est = int(dur * args.bitrate * 1000 / 8)
            after += est
            changed += 1
            print(f"   -> about {human(est)}")
            continue

        bpath = os.path.join(backup_root, rel)
        os.makedirs(os.path.dirname(bpath), exist_ok=True)
        shutil.copy2(full, bpath)

        tmp = full + ".tmp.mp3" if full.lower().endswith(".mp3") else full + ".tmp"
        try:
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", bpath,
                 "-ac", str(channels), "-b:a", f"{args.bitrate}k", tmp],
                check=True, capture_output=True, timeout=600
            )
            # verify BEFORE replacing the original
            ndur, nch, nbr = probe(tmp)
            if ndur is None:
                raise ValueError("output unreadable")
            if abs(ndur - dur) > 0.35:
                raise ValueError(f"duration changed {mmss(dur)} -> {mmss(ndur)}")
            os.replace(tmp, full)
        except Exception as e:
            if os.path.exists(tmp):
                try: os.remove(tmp)
                except Exception: pass
            shutil.copy2(bpath, full)
            print(f"   FAILED ({e}) -- original kept")
            problems.append(rel)
            failed += 1
            after += size_before
            continue

        size_after = os.path.getsize(full)
        after += size_after
        changed += 1
        print(f"   -> {human(size_after)}  ok")

    print()
    print("=" * 60)
    print(f"  re-encoded : {changed}")
    print(f"  skipped    : {skipped}")
    print(f"  failed     : {failed}")
    print(f"  before     : {human(before)}")
    print(f"  after      : {human(after)}{'  (estimated)' if not args.apply else ''}")
    if before:
        print(f"  saved      : {100*(1-after/before):.0f}%")
    if args.apply:
        print(f"\n  backups    : {backup_root}")
        print( "  to undo    : cp -r '<that folder>'/* .")
    else:
        print("\n  Nothing was written. Add --apply to do it for real.")

    if long_ones:
        print("\n  OVER TWO MINUTES -- if these just loop, shortening them")
        print("  saves more than any bitrate change:")
        for rel, dur in sorted(long_ones, key=lambda x: -x[1]):
            print(f"   {mmss(dur):>6}  {rel}")

    if problems:
        print("\n  PROBLEM FILES (originals kept):")
        for p in problems:
            print("   -", p)
    print("=" * 60)


if __name__ == "__main__":
    main()
