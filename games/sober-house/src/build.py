# Builds games/sober-house/v6/index.html from the files in this folder.
#   template.html  the whole game (HTML + CSS + JS) with 4 placeholders filled in below
#   deck.json      every card: id, title, color (kind), what it does
#   cardtext.py    the plain-English lines players read (T[title] = (when you play it, when it's played on you))
# Card art: new art lives in ../v6/cards/sh-NNN.webp (600x840). Cards without it fall back to ../cards/.
# Run:  cd ~/Projects/recoverymisfits-app/games/sober-house/src && python3 build.py
import json, os, glob, sys
sys.dont_write_bytecode = True
from cardtext import T
here = os.path.dirname(os.path.abspath(__file__))
game = os.path.join(here, '..', 'v6')
art = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(game, 'cards', 'sh-*.webp')))
t = open(os.path.join(here, 'template.html')).read(); d = json.load(open(os.path.join(here, 'deck.json')))
t = (t.replace('__DECK__', json.dumps(d, separators=(',', ':'), ensure_ascii=False))
      .replace('__BASE__', '../')
      .replace('__TEXT__', json.dumps({k: list(v) for k, v in T.items()}, ensure_ascii=False))
      .replace('__ART__', json.dumps(art)))
open(os.path.join(game, 'index.html'), 'w').write(t); print(len(t), 'bytes written to v6/index.html; new art for', len(art), 'cards')
