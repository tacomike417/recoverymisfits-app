#!/usr/bin/env python3
"""Add a batch of new memes to the Meme of the Day rotation.

    python3 scripts/add_memes.py

1. Put the new memes in assets/memes/new/ -- loose images (.png, .jpg,
   .jpeg, .webp) or the .zip they came in, or both.
2. Run this.
3. Commit and push.

WHAT IT DOES
  * unzips any .zip in there (the zip itself is moved to new/_added/ so it
    is never added twice);
  * turns every image into a 1080-wide .jpg in assets/memes/, named with the
    next number up (a file already called 051.png keeps 051 if it is free);
  * SHUFFLES THE BATCH before adding it, so a batch made as one series does
    not run as a series;
  * adds them to the END of data/memes.json, starting tomorrow. That is what
    keeps today and every day before it exactly as they were -- a new meme
    can never land on a day somebody has already seen;
  * builds the thumbnails and the Facebook preview cards
    (scripts/make_meme_thumbs.py).

Anything in new/ that is not an image -- a README, notes -- is left right
where it is.

WHEN THEY RUN. The deploy works out the days (scripts/build_pages.py): new
memes go in every other day, mixed in with older ones, until they have all
had a turn. Nothing here needs a date picked by hand.

Needs Pillow, same as make_meme_thumbs.py.
"""
import os
import re
import sys
import json
import glob
import random
import shutil
import zipfile
import datetime

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MEMES = os.path.join(ROOT, 'assets', 'memes')
INBOX = os.path.join(MEMES, 'new')
DONE = os.path.join(INBOX, '_added')
DATA = os.path.join(ROOT, 'data', 'memes.json')

IMAGE_EXT = ('.png', '.jpg', '.jpeg', '.webp')
WIDTH = 1080


def tomorrow():
    try:
        from zoneinfo import ZoneInfo
        today = datetime.datetime.now(ZoneInfo('America/New_York')).date()
    except Exception:
        today = datetime.date.today()
    return (today + datetime.timedelta(days=1)).isoformat()


def unzip_all():
    for z in sorted(glob.glob(os.path.join(INBOX, '*.zip'))):
        name = os.path.splitext(os.path.basename(z))[0]
        dest = os.path.join(INBOX, name)
        with zipfile.ZipFile(z) as zf:
            for member in zf.namelist():
                if member.endswith('/') or '__MACOSX' in member:
                    continue
                # Flatten, and keep everything -- READMEs included -- so
                # nothing he packed in the zip goes missing.
                target = os.path.join(dest, os.path.basename(member))
                os.makedirs(dest, exist_ok=True)
                with zf.open(member) as src, open(target, 'wb') as out:
                    shutil.copyfileobj(src, out)
        os.makedirs(DONE, exist_ok=True)
        shutil.move(z, os.path.join(DONE, os.path.basename(z)))
        print('Unzipped %s' % os.path.basename(z))


def find_images():
    found = []
    for dirpath, dirnames, filenames in os.walk(INBOX):
        dirnames[:] = [d for d in dirnames if d != '_added']
        for f in filenames:
            if not f.lower().endswith(IMAGE_EXT) or f.startswith('.'):
                continue
            # CONTACT SHEETS ARE NOT MEMES. The ChatGPT zips carry a
            # CONTACT-SHEET.jpg of the whole set, and one of them went into
            # the rotation as meme 075 (caught 25 Sep 2026 before it ran).
            if 'contact' in f.lower():
                continue
            full = os.path.join(dirpath, f)
            # A BROKEN FILE STAYS OUT TOO. Five PNGs in the 061-126 zips were
            # cut off partway (bottom of the picture missing). Anything that
            # does not load completely is reported and left in new/.
            try:
                with Image.open(full) as test:
                    test.load()
            except Exception:
                print('  ! skipped %s -- the file is damaged (cut off). Get a fresh copy.'
                      % os.path.relpath(full, INBOX))
                continue
            found.append(full)
    return sorted(found)


def main():
    if not os.path.isdir(INBOX):
        os.makedirs(INBOX)
        print('Made assets/memes/new/ -- put the new memes in there and run this again.')
        return

    with open(DATA, encoding='utf-8') as f:
        data = json.load(f)
    memes = data.setdefault('memes', [])

    unzip_all()
    images = find_images()
    if not images:
        print('Nothing to add -- assets/memes/new/ has no images in it.')
        return

    taken = {os.path.splitext(os.path.basename(p))[0]
             for p in glob.glob(os.path.join(MEMES, '*.jpg'))}
    taken |= {os.path.splitext(m['file'])[0] for m in memes}
    nums = [int(t) for t in taken if t.isdigit()]
    nxt = (max(nums) if nums else 0) + 1

    # Files that already carry a free number keep it, and claim it BEFORE
    # any unnumbered file is handed one -- otherwise "Meme 1.png" could take
    # 051 out from under the 051.png sitting right next to it.
    names = {}
    for path in images:
        stem = os.path.splitext(os.path.basename(path))[0]
        if re.fullmatch(r'\d{3,4}', stem) and stem not in taken:
            names[path] = stem
            taken.add(stem)
    for path in images:
        if path in names:
            continue
        while ('%03d' % nxt) in taken:
            nxt += 1
        names[path] = '%03d' % nxt
        taken.add(names[path])

    batch = []
    for path in images:
        mid = names[path]

        im = Image.open(path)
        im = im.convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        out = os.path.join(MEMES, mid + '.jpg')
        im.save(out, 'JPEG', quality=88, optimize=True, progressive=True)
        os.remove(path)
        batch.append(mid + '.jpg')
        print('  %s  <-  %s' % (mid + '.jpg', os.path.relpath(path, INBOX)))

    random.Random(datetime.date.today().isoformat()).shuffle(batch)
    start = tomorrow()
    for f in batch:
        memes.append({'file': f, 'added': start})

    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1)
        f.write('\n')

    # Empty folders left behind by an unzip go; anything still in them stays.
    for dirpath, dirnames, filenames in sorted(os.walk(INBOX), reverse=True):
        if dirpath != INBOX and '_added' not in dirpath and not os.listdir(dirpath):
            os.rmdir(dirpath)

    print('Added %d memes (shuffled), in rotation from %s. %d in rotation now.'
          % (len(batch), start, len(memes)))

    sys.path.insert(0, HERE)
    import make_meme_thumbs
    make_meme_thumbs.main()


if __name__ == '__main__':
    main()
