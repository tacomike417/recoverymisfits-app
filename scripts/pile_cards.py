#!/usr/bin/env python3
"""Turn the Survival Pile spreadsheet and card art into what the app reads.

    python3 scripts/pile_cards.py ~/Downloads/survival-pile-cards.xlsx ~/Downloads/survival-pile

1. The spreadsheet (survival-pile-cards.xlsx) is the ONE place card wording
   lives: Name, Tagline, and "Back of Card" -- what the Survival Pile page
   says when somebody taps a card. Edit it there, never in the JSON.
2. The folder is where the card art lands from ChatGPT. Each file is named
   by its card: 000.png, 69.png, 10000.png, new-years.png, misfitversary.png
   (a leading-zero-free "0.png" is taken as 000).

Writes:
    data/survival-pile.json                 every card, its rule and its words
    assets/survival-pile/cards/<code>.webp       750 wide, for the big view and sharing
    assets/survival-pile/cards/<code>-thumb.webp 240 wide, for the grid
    assets/survival-pile/og/<code>.jpg           1200x630 link preview (Facebook)
    pile/<code>/index.html                       the card's own public page --
                                                 the link the Share buttons send

HOW A CARD'S RULE IS WORKED OUT, so nobody has to type it:
    000                 -> start       (the night before the sober date)
    "First 90 Days", "99 & 100", "Big Numbers"
                        -> days        (that many days sober)
    "Years-Months-Days" -> ymd         (111 = 1 year, 1 month, 1 day; 123 = 1, 2, 3)
    "Holidays..."       -> holiday     (the card code IS the holiday key)
    misfitversary       -> misfitversary

Run it any time the sheet changes or new art arrives, then commit what it made.
Needs openpyxl and Pillow.
"""
import os
import re
import sys
import json
import glob

from openpyxl import load_workbook
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_JSON = os.path.join(ROOT, 'data', 'survival-pile.json')
ART = os.path.join(ROOT, 'assets', 'survival-pile', 'cards')

HOLIDAYS = {
    'new-years', 'super-bowl', 'valentines', 'st-patricks', 'big-book',
    'memorial-day', 'founders-day', 'july-4', 'dr-bob', 'labor-day',
    'halloween', 'thanksgiving', 'christmas-eve', 'christmas',
}


def clean(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v is not None else ''


def rule_for(code, series):
    s = series.lower()
    if code == '000':
        return {'kind': 'start'}
    if code == 'misfitversary':
        return {'kind': 'misfitversary'}
    if code in HOLIDAYS or s.startswith('holiday'):
        return {'kind': 'holiday', 'holiday': code}
    if s.startswith('years-months-days'):
        return {'kind': 'ymd', 'ymd': [int(ch) for ch in code]}
    if code.isdigit():
        return {'kind': 'days', 'n': int(code)}
    raise ValueError('cannot tell how card %r unlocks (series %r)' % (code, series))


def read_sheet(path):
    wb = load_workbook(path, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    head = [clean(h).lower() for h in rows[0]]

    def col(*names):
        for n in names:
            if n in head:
                return head.index(n)
        return None

    ci = {k: col(*v) for k, v in {
        'card': ('card',), 'series': ('series',), 'unlocks': ('unlocks',),
        'name': ('name',), 'tagline': ('tagline',),
        'back': ('back of card', 'back', 'back of the card'),
    }.items()}
    cards = []
    for r in rows[1:]:
        if not r or r[ci['card']] in (None, ''):
            continue
        code = clean(r[ci['card']])
        if code.isdigit() and len(code) < 3 and code == '0':
            code = '000'
        card = {
            'code': code,
            'series': clean(r[ci['series']]),
            'unlocks': clean(r[ci['unlocks']]),
            'name': clean(r[ci['name']]),
            'tagline': clean(r[ci['tagline']]),
            'back': clean(r[ci['back']]) if ci['back'] is not None else '',
        }
        card.update(rule_for(code, card['series']))
        cards.append(card)
    return cards


def art_key(filename):
    stem = os.path.splitext(os.path.basename(filename))[0].lower()
    # "066-Route-66.png" -> 066, "Survival-Pile-1000.png" -> 1000:
    # the first part of the name that is all digits is the card number.
    m = re.search(r'(?:^|-)(\d+)(?=-|$)', stem)
    if m:
        stem = m.group(1)
    if stem.isdigit():                      # 0.png / 000.png -> 000; 002.png -> 2
        return stem.lstrip('0') or '000'
    return stem


def build_art(folder):
    os.makedirs(ART, exist_ok=True)
    done = []
    for f in sorted(glob.glob(os.path.join(folder, '*'))):
        if not f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            continue
        if 'preview' in os.path.basename(f).lower():   # 000-share-preview.png is not a card
            continue
        key = art_key(f)
        im = Image.open(f).convert('RGB')
        big = im.resize((750, round(750 * im.height / im.width)), Image.LANCZOS)
        big.save(os.path.join(ART, key + '.webp'), 'WEBP', quality=86, method=6)
        big.resize((240, round(240 * big.height / big.width)), Image.LANCZOS) \
           .save(os.path.join(ART, key + '-thumb.webp'), 'WEBP', quality=80, method=6)
        done.append(key)
    return done


# ---- THE CARD'S OWN PAGE ---------------------------------------------------
# /pile/<code>/ is what "Share the link" and "Post to Facebook" send. It is
# the same for everybody who has the card: no date, no name, nothing
# personal -- just the card, and a way into the app. Facebook reads the
# og:image off it, so the preview IS the card, presented by the Misfits.
SITE = 'https://recoverymisfits.org'
OG_W, OG_H = 1200, 630
SLOT = (304, 174, 472, 664, 18)          # x, y, w, h, radius -- share-bg.json


def presented(code):
    """The card laid into the Misfits share background -- the same square
    picture the app builds when somebody taps Share this card."""
    from PIL import ImageDraw
    bg = Image.open(os.path.join(ROOT, 'assets', 'survival-pile', 'share-bg.jpg')).convert('RGB')
    bg = bg.resize((1080, 1080), Image.LANCZOS)
    card = Image.open(os.path.join(ART, code + '.webp')).convert('RGB')
    x, y, w, h, r = SLOT
    ch = round(w * card.height / card.width)
    card = card.resize((w, ch), Image.LANCZOS)
    mask = Image.new('L', (w, ch), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, ch - 1], radius=r, fill=255)
    bg.paste(card, (x, y + (h - ch) // 2), mask)
    return bg


def og_card(code):
    """1200x630: Facebook crops a square to a wide strip, so the square goes
    in the middle of the app's black, whole, with the gold hairline."""
    from PIL import ImageDraw
    sq = presented(code)
    side = OG_H - 40
    sq = sq.resize((side, side), Image.LANCZOS)
    out = Image.new('RGB', (OG_W, OG_H), (14, 14, 13))
    x, y = (OG_W - side) // 2, 20
    out.paste(sq, (x, y))
    ImageDraw.Draw(out).rectangle([x - 2, y - 2, x + side + 1, y + side + 1], outline=(150, 126, 64), width=2)
    d = os.path.join(ROOT, 'assets', 'survival-pile', 'og')
    os.makedirs(d, exist_ok=True)
    out.save(os.path.join(d, code + '.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} — The Survival Pile — Recovery Misfits</title>
<meta name="theme-color" content="#0e0e0d">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<!-- GENERATED by scripts/pile_cards.py -- edit the script, not this file. -->
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Recovery Misfits">
<meta property="og:title" content="{title} — The Survival Pile">
<meta property="og:description" content="{tag} Little milestones between the big coins, in the free Recovery Misfits app.">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/assets/survival-pile/og/{code}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Survival Pile card: {title}">
<meta name="twitter:card" content="summary_large_image">
<style>html{{background:#0e0e0d}}body{{background:#0e0e0d;color:#eee6d5;margin:0}}</style>
<link rel="stylesheet" href="/assets/daily-reading.css">
<style>
.wrap{{max-width:440px;margin:0 auto;padding:20px 20px 0;text-align:center}}
.kick{{margin:0;font-family:var(--ui);font-weight:800;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:var(--gold)}}
.pcard{{display:block;width:78%;height:auto;margin:14px auto 0;aspect-ratio:5/7;object-fit:cover;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.7)}}
h1{{margin:18px 0 0;font-family:var(--display);font-weight:600;text-transform:uppercase;font-size:26px;line-height:1.05;color:var(--ivory)}}
.tag{{margin:6px 0 0;font-family:var(--ui);font-style:italic;font-size:14px;color:var(--muted)}}
.what{{margin:18px 0 0;font-family:var(--ui);font-size:15px;line-height:1.55;color:#ece2cb}}
.go{{display:block;margin:18px 0 0;padding:16px;border-radius:999px;background:var(--gold);color:#17130b;text-decoration:none;
  font-family:var(--ui);font-weight:800;font-size:14.5px;letter-spacing:1.4px;text-transform:uppercase}}
</style>
</head>
<body data-rm-nav="index.html">
<div id="rm-topbar"></div>
<script src="/topbar.js" defer></script>
<div class="wrap">
  <p class="kick">The Survival Pile &middot; No. {code}</p>
  <img class="pcard" src="/assets/survival-pile/cards/{code}.webp" alt="{title}" width="750" height="1050">
  <h1>{title}</h1>
  <p class="tag">{tag}</p>
  <p class="what">Somebody in recovery just earned this one. The Survival Pile is little milestones between the big coins &mdash; cards you pick up along the way in the free Recovery Misfits app.</p>
  <a class="go" href="/sober-date.html">Start your own pile</a>
</div>
<div class="tailroom"></div>
<div id="rm-bottom-nav"></div>
<script src="/nav.js" defer></script>
</body>
</html>
"""


def build_pages(cards):
    import html
    import shutil
    root = os.path.join(ROOT, 'pile')
    if os.path.isdir(root):
        shutil.rmtree(root)
    n = 0
    for c in cards:
        if not c['art']:
            continue
        og_card(c['code'])
        d = os.path.join(root, c['code'])
        os.makedirs(d, exist_ok=True)
        e = lambda v: html.escape(v or '', quote=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(PAGE.format(site=SITE, url='%s/pile/%s/' % (SITE, c['code']),
                                code=e(c['code']), title=e(c['name'] or c['code']),
                                tag=e(c['tagline'])))
        n += 1
    return n


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cards = read_sheet(os.path.expanduser(sys.argv[1]))
    if len(sys.argv) > 2:
        made = build_art(os.path.expanduser(sys.argv[2]))
        print('Card art: %d converted (%s)' % (len(made), ', '.join(made) or 'none'))
    have = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ART, '*.webp'))
            if not p.endswith('-thumb.webp')}
    for c in cards:
        c['art'] = c['code'] in have
    # THE ON/OFF SWITCH. "live": false means nobody is awarded anything --
    # the page says "coming soon" to everyone but a preview. This script
    # carries the switch over untouched and NEVER turns it on by itself;
    # flipping it is a decision, made by editing this one word in the JSON.
    live = False
    if os.path.exists(OUT_JSON):
        try:
            with open(OUT_JSON, encoding='utf-8') as f:
                live = bool(json.load(f).get('live', False))
        except Exception:
            pass
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump({'note': 'GENERATED by scripts/pile_cards.py from survival-pile-cards.xlsx. '
                           'Edit the spreadsheet, not this file -- except "live", the '
                           'on/off switch, which is only ever changed by hand.',
                   'live': live,
                   'cards': cards}, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('Card pages: %d written under /pile/.' % build_pages(cards))
    print('data/survival-pile.json: %d cards, %d with art. Awarding is %s.'
          % (len(cards), sum(1 for c in cards if c['art']), 'ON' if live else 'OFF'))


if __name__ == '__main__':
    main()
