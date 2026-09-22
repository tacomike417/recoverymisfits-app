# -*- coding: utf-8 -*-
"""Artwork for YOUR CORNER, generated to match the approved mockup.

RUN BY HAND, NOT BY THE BUILD:  python3 scripts/make_corner_art.py
It writes into assets/pages/ and the results are committed, because the seed
is fixed and re-running it should produce the same three files. Needs numpy
and Pillow, which the deploy workflow does not have and does not need.

Three pieces, all transparent webp, all drawn rather than photographed:

  c-tear.webp      the torn paper strip that separates the section
  c-wordmark.webp  YOUR CORNER, distressed, in the page's display face
  c-rule.webp      the worn gold brush stroke under it

The rest of this page's chrome is artwork -- the READINGS wordmark, the
rules, the marginalia -- so live text with a CSS gradient under it read as a
different screen. These are built the same way those were.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "assets", "pages")
FONT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "assets", "fonts", "Anton-Regular.ttf")
rng = np.random.default_rng(20260922)


def smooth_noise(n, scale, octaves=4):
    """Layered 1-D value noise in [0,1]. Cheap, and paper edges are not
    picky about which noise they were torn with."""
    out = np.zeros(n)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        pts = max(3, int(n / (scale / (2 ** o))))
        base = rng.random(pts)
        x = np.linspace(0, pts - 1, n)
        out += amp * np.interp(x, np.arange(pts), base)
        total += amp
        amp *= 0.5
    return out / total


def grain(h, w, strength):
    g = rng.normal(0, strength, (h, w))
    return Image.fromarray(np.clip(128 + g, 0, 255).astype(np.uint8), "L") \
                .filter(ImageFilter.GaussianBlur(0.4))


# ---------------------------------------------------------------- the tear
def tear(path, W=1500, H=52):
    """A torn edge, not a zigzag.

    The mockup's divider is a strip of paper someone ripped: a few pixels
    thick, wandering, with fibres standing off it and the thickness changing
    every inch. A polygon with regular teeth reads as a graphic. So the two
    edges are separate noise walks and the fibre is painted on top."""
    a = np.zeros((H, W), np.float32)          # alpha
    v = np.zeros((H, W), np.float32)          # value/brightness

    mid = H / 2 + (smooth_noise(W, 380) - .5) * 9          # the wander
    thick = 3.0 + smooth_noise(W, 70, 5) ** 1.5 * 15       # the rip
    thick *= 0.6 + smooth_noise(W, 520, 2) * 0.95          # thin/fat stretches
    # Clumps: every few inches the paper tears off a lump rather than a line.
    thick += np.clip((smooth_noise(W, 150, 3) - .62) * 26, 0, None)

    ys = np.arange(H)[:, None]
    top = mid - thick / 2
    bot = mid + thick / 2
    body = (ys >= top) & (ys <= bot)
    a[body] = 1.0

    # Feathered fibre above and below, thicker where the rip is thicker.
    for sign, reach in ((-1, 1.15), (1, 0.85)):
        f = smooth_noise(W, 18, 5) * thick * reach * 1.15
        edge = mid + sign * (thick / 2)
        d = (ys - edge) * sign
        # ** 2.2 rather than a straight ramp: paper fibre ends in a point and
        # a linear falloff reads as airbrush, which is what the first pass of
        # this looked like -- a soft grey smear instead of a torn edge.
        fib = np.clip(1 - d / np.maximum(f, .3), 0, 1) ** 2.2 * (d > 0)
        a = np.maximum(a, fib * (0.45 + smooth_noise(W, 9, 5) * 0.75))

        # Loose fibre: the odd speck standing off the rip on its own.
        flo = (rng.random((H, W)) > 0.9975) & (d > 0) & (d < f * 2.4)
        a = np.maximum(a, flo * 0.8)

    # Paper is lit from above: the top edge catches, the underside shades.
    lift = np.clip((mid - ys) / np.maximum(thick, 1) + .5, 0, 1)
    v = 0.72 + lift * 0.33
    v *= 0.88 + smooth_noise(W, 45, 5) * 0.24

    # A few torn-away gaps, because a rip is never continuous.
    gaps = smooth_noise(W, 110, 3)
    a *= np.clip((gaps - .13) * 11, 0.3, 1)

    base = np.array([216, 204, 178], np.float32)           # #d8ccb2
    rgb = np.clip(base[None, None, :] * v[:, :, None], 0, 255)
    img = np.dstack([rgb, np.clip(a * 235, 0, 255)]).astype(np.uint8)
    # Barely any blur. At 0.35 the whole strip went soft and stopped reading
    # as paper; it is drawn at 1500px and shown at about 400, so the downscale
    # does all the smoothing this needs.
    im = Image.fromarray(img, "RGBA").filter(ImageFilter.GaussianBlur(0.12))
    im.save(path, "WEBP", lossless=True, quality=95)
    print(path, im.size)


# ------------------------------------------------------------ the wordmark
def distress(mask, W, H, amount=1.0):
    """Knock speckles and hairline scratches out of a solid shape."""
    # Speckle. WORN, NOT SHREDDED: the mockup's letters are solid cream with
    # a scatter of small light-coloured pits in them, which is what a printed
    # letter looks like after a photocopier and a hard life. The first pass of
    # this ate about half the ink and read as camouflage. High threshold, fine
    # grain, and only a fraction of the ink taken where it does bite.
    n = np.array(grain(H, W, 60).filter(ImageFilter.GaussianBlur(0.55)), np.float32)
    n = (n - n.min()) / max(1e-6, (n.max() - n.min()))
    holes = np.clip((n - 0.78) * 10, 0, 1)
    m = np.array(mask, np.float32) / 255.0
    m = m * (1 - holes * 0.75 * amount)

    # Scratches: a handful of near-horizontal wipes across the letters
    sc = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(sc)
    for _ in range(int(6 * amount)):
        y = rng.integers(0, H)
        x0 = rng.integers(0, W)
        ln = rng.integers(W // 16, W // 5)
        d.line([(x0, y), (x0 + ln, y + rng.integers(-1, 2))],
               fill=int(rng.integers(70, 150)), width=1)
    sc = sc.filter(ImageFilter.GaussianBlur(0.6))
    m = m * (1 - np.array(sc, np.float32) / 255.0 * 0.55)

    # Nibble the outline so the edges are not machine-cut
    e = np.array(grain(H, W, 70).filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255.0
    m = np.clip(m - np.clip((e - .74) * 4.5, 0, 1) * 0.35, 0, 1)
    return (m * 255).astype(np.uint8)


def wordmark(path, text="YOUR CORNER", size=190, color=(242, 234, 217)):
    f = ImageFont.truetype(FONT, size)
    tmp = Image.new("L", (10, 10))
    box = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=f)
    W, H = box[2] - box[0] + 24, box[3] - box[1] + 24
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).text((12 - box[0], 12 - box[1]), text, font=f, fill=255)
    a = distress(m, W, H, 1.0)
    rgb = np.zeros((H, W, 3), np.uint8)
    rgb[:, :] = color
    # A touch of unevenness in the ink itself, not just holes in it
    shade = np.array(grain(H, W, 26).filter(ImageFilter.GaussianBlur(2.0)), np.float32) / 255.0
    rgb = np.clip(rgb.astype(np.float32) * (0.86 + shade * 0.3)[:, :, None], 0, 255).astype(np.uint8)
    im = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    im.save(path, "WEBP", lossless=True, quality=95)
    print(path, im.size)


# ----------------------------------------------------------- the gold rule
def rule(path, W=900, H=32):
    """One pass of a loaded brush: fattest a third of the way along, dragged
    out to nothing at the right."""
    a = np.zeros((H, W), np.float32)
    x = np.linspace(0, 1, W)
    thick = (np.exp(-((x - 0.32) ** 2) / 0.19) * 10.5 + 1.4) * (1 - x * 0.74)
    thick *= 0.75 + smooth_noise(W, 60, 4) * 0.5
    mid = H / 2 + (smooth_noise(W, 300, 3) - .5) * 4
    ys = np.arange(H)[:, None]
    d = np.abs(ys - mid)
    a = np.clip(1 - (d - thick / 2) / 1.6, 0, 1)
    # Dry-brush skips. FINE AND SHALLOW: at a coarser scale with a low floor
    # the stroke broke into four separate dashes and read as a dotted rule
    # rather than one drag of a brush.
    a *= np.clip((smooth_noise(W, 14, 5) - .04) * 5, 0.66, 1)

    g = np.zeros((H, W, 3), np.float32)
    lift = np.clip((mid - ys) / np.maximum(thick, 1) + .5, 0, 1)
    g[:, :, 0] = 150 + lift * 105
    g[:, :, 1] = 112 + lift * 95
    g[:, :, 2] = 44 + lift * 60
    im = Image.fromarray(np.dstack([g, a * 255]).astype(np.uint8), "RGBA") \
              .filter(ImageFilter.GaussianBlur(0.3))
    im.save(path, "WEBP", lossless=True, quality=95)
    print(path, im.size)


tear(OUT + "/c-tear.webp")
wordmark(OUT + "/c-wordmark.webp")
rule(OUT + "/c-rule.webp")
