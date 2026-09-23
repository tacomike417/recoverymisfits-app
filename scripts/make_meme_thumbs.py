#!/usr/bin/env python3
"""Build the thumbnails the Meme of the Day rail is drawn from, AND the wide
link-preview card for each meme (assets/memes/og/<name>.jpg).

    python3 scripts/make_meme_thumbs.py

Reads every assets/memes/*.jpg and writes assets/memes/thumbs/<name>.webp at
320 square. Run it after adding memes; the results are committed.

WHY THERE ARE THUMBNAILS AT ALL. The rail on meme.html shows eleven days at
once. Eleven of the real files is about 3.6MB fetched before anybody has
pressed anything, on the page of an app whose whole argument is that it works
on a bad signal in a church basement. These come in around 28KB apiece, so
the rail costs roughly a tenth of one meme. The full-size file is only ever
fetched for the one somebody actually taps.

320 SQUARE, NOT 104. The rail draws them at 104px CSS; 320 covers a 3x screen
with room to spare. Smaller is tempting until you remember these are pictures
made almost entirely of words -- a meme whose caption has gone to mush is not
a thumbnail of anything.

THE PREVIEW CARDS. When somebody shares a /meme/MM-DD/ link, Facebook and
texts draw this 1200x630 card as the preview. It is the whole meme centered
on the app's black, because Facebook crops a plain square to a wide strip and
cuts off the top line and the punchline. build_pages.py points each meme page
at its card.

Needs Pillow. The deploy workflow does not run this and does not need to --
run it after adding memes and commit what it makes.
"""
import os
import sys
import glob
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_pages import meme_card  # one drawing of the card, not two

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'memes')
OUT = os.path.join(SRC, 'thumbs')
OG = os.path.join(SRC, 'og')

SIZE = 320
QUALITY = 74


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(OG, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, '*.jpg')))
    if not files:
        print('No memes found in %s' % SRC)
        return

    total_in = total_out = 0
    for path in files:
        name = os.path.basename(path)
        out = os.path.join(OUT, os.path.splitext(name)[0] + '.webp')
        im = Image.open(path).convert('RGB')
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        im.save(out, 'WEBP', quality=QUALITY, method=6)
        total_in += os.path.getsize(path)
        total_out += os.path.getsize(out)
        meme_card(path, os.path.join(OG, name))

    print('%d thumbnails written to assets/memes/thumbs/' % len(files))
    print('%d preview cards written to assets/memes/og/' % len(files))
    print('  %.1f MB of originals -> %.0f KB of thumbnails (%.1f KB each)'
          % (total_in / 1e6, total_out / 1e3, total_out / 1e3 / len(files)))

    # A thumbnail left behind by a meme that has since been removed is a file
    # the rail will happily ask for and get a 404 on.
    keep = {os.path.splitext(os.path.basename(f))[0] for f in files}
    for stray in glob.glob(os.path.join(OUT, '*.webp')) + glob.glob(os.path.join(OG, '*.jpg')):
        if os.path.splitext(os.path.basename(stray))[0] not in keep:
            os.remove(stray)
            print('  removed orphan %s' % os.path.basename(stray))


if __name__ == '__main__':
    main()
