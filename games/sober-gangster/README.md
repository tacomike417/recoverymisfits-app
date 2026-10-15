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

Sound (v1.1): assets/sfx/. Music = "EPIC West Coast G Funk Type Beat 'Shake'" by 5XBeatz (Pixabay), first 20 seconds trimmed.
Effects from Pixabay: cash register (buy), aerosol spray (a move), DJ air horn (level up), police siren (locked up), record scratch (night).
All under the Pixabay Content License (free in a game, no credit required). Music starts on the first tap; the speaker in the top bar mutes everything.

v2.0 — THE SKIN: the screens now use ChatGPT's own finished mockups (assets/skin/), with only the changing parts erased
(numbers, figure, room, items, version pill). index.html lays the live game on top at the same spots, measured in the
mockup's own pixels (853 wide; see U()/at() in index.html). Title, Today, the level-up and locked-up pop-ups are the
full mockups; the shop and pick screens reuse the mockup's own card tiles so they can hold any number of items.

v3.0 — THE DAY, SIMPLE (Mike, 14 Oct 2026): every morning a "Life on Life's Terms" card (what happened while you slept;
more likely to be bad if you skipped the sober stuff) sets your heat, then a scenario lands. Your 3 moves deal with it:
each move button shows what it does to the scenario (✔ = ends it), and every choice costs something. Ignore it and it
adds heat every night until it ends badly. Cards are in cards.js (written by ChatGPT in Mike's voice, approved by Mike).
sim.cjs is the test player; test.cjs checks that about 1 in 3 smart players reach Moved Out.

## NEXT (Mike, 15 Oct 2026) — FELLOWSHIP: working a program is how you survive
Save this for when it's time. Today "Sober support" is one generic move. Next it opens up into real fellowship
actions, and a homie who actively works a program gets their survival odds up to about 75% (vs ~1 in 3 now).
- Things to do: grab coffee with people, make a meeting, volunteer to read, get a sponsor (later: sponsor someone),
  give rides once you have a car, pray, meditate, volunteer, start a meeting that fits your schedule, etc.
- They build on each other (a sponsor, a home group, service) and keep paying off: less heat, better night cards,
  scenarios get cheaper to handle, relapse pull gets weaker.
- Tuning target: a player who works the program ~75% reach Moved Out; one who skips it stays ~1 in 3 or worse.
  Check it with sim.cjs (add a "works the program" test player) before shipping.
