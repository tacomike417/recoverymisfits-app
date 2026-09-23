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
    if stem in ('0', '00'):
        return '000'
    return stem


def build_art(folder):
    os.makedirs(ART, exist_ok=True)
    done = []
    for f in sorted(glob.glob(os.path.join(folder, '*'))):
        if not f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            continue
        key = art_key(f)
        if key.endswith('preview'):
            continue
        im = Image.open(f).convert('RGB')
        big = im.resize((750, round(750 * im.height / im.width)), Image.LANCZOS)
        big.save(os.path.join(ART, key + '.webp'), 'WEBP', quality=86, method=6)
        big.resize((240, round(240 * big.height / big.width)), Image.LANCZOS) \
           .save(os.path.join(ART, key + '-thumb.webp'), 'WEBP', quality=80, method=6)
        done.append(key)
    return done


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
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump({'note': 'GENERATED by scripts/pile_cards.py from survival-pile-cards.xlsx. '
                           'Edit the spreadsheet, not this file.',
                   'cards': cards}, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('data/survival-pile.json: %d cards, %d with art.'
          % (len(cards), sum(1 for c in cards if c['art'])))


if __name__ == '__main__':
    main()
