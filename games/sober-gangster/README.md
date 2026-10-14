# Sober Gangster (Locked Up, Covered Up, or Sobered Up)
A Recovery Misfits game. Phone first (390 wide). Buildless: index.html + engine.js + assets/.
Replaces the old "Sobered Up" (games/sobered-up stays as it was, untouched).

- `engine.js` — all rules, the 43 life cards, the levels and the 8 figures. Every tunable number is in CFG / LEVELS at the top.
- `index.html` — the screens: title, pick your homie, today, shop, progress (your story), settings, level up, locked up.
- `test.cjs` — `node test.cjs` runs 900 seeded runs plus regression checks (levels, shop gating, lock-up reset).
- `assets/fig/<figure>-<level>.webp` — 8 figures x 4 levels, cut out. `assets/room/1-4 + jail` — the room for each level.
  `assets/item/<shop id>.webp` — one picture per shop item. `assets/ui/` — wall, logo, icons, paper textures.

Levels: a balanced day = you go to bed with stress under 70, connection 30+, heat 45 or less.
L2 Working: 5 balanced days + dishwasher. L3 Stacking money: 11 + stock crew + $150. L4 Moved out: 18 + maintenance + $300 + rent paid.
Getting locked up = start over at level 1 with the same figure. Shop items unlock by level (minLevel in the shop list).
Art made in ChatGPT (Oct 2026). Original characters.
