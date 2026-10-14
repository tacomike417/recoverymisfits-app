# Sober House: source files

The live game is `games/sober-house/v6/index.html` (URL: recoverymisfits.org/games/sober-house/; the old root page just forwards to v6).
**Don't edit v6/index.html by hand.** Edit the files here and rebuild.

| File | What it is |
|---|---|
| `template.html` | The whole game: HTML, CSS and JS in one file, with 4 placeholders (`__DECK__`, `__TEXT__`, `__ART__`, `__BASE__`) |
| `deck.json` | Every card (106 in the deck): id, title, kind (green/red/pink/gold), and what it does (cash, beds, skip, react, hit, self, rare, ...) |
| `cardtext.py` | Plain-English lines: `T[title] = (what you read when you play it, what the other player reads)`; `{O}` = the other player |
| `build.py` | Fills the placeholders and writes `../v6/index.html` |
| `sim.py` | Headless balance check: plays N full games of You vs Big Ray in a real browser and prints win rates |

## Rebuild
```
cd ~/Projects/recoverymisfits-app/games/sober-house/src && python3 build.py
```

## Balance check (needs Python Playwright + Chromium)
```
python3 sim.py ../v6/index.html 200 greedy
```

## Where things live in the game folder
- `v6/cards/sh-NNN.webp`: new card art (600x840), 71 cards. Cards without new art fall back to `../cards/` (old green art).
- `v6/ui/`: backgrounds, Ray's face, payday/bills pictures, button and hand-row art.
- `../sfx/`: sound effects.

## Rules for changes
- **Bump the version pill** (`<span class="pill">vNN</span>`, 2 places in template.html) on every change. Mike checks it on his phone.
- **Phone wins.** Check at 390 and 360 wide.
- **Use unique CSS class names.** `.stamp`, `.big` and `.sm` are already taken by card-art styles, and reusing them broke layouts twice.
