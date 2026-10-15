# Spiritual Gangster (Locked Up, Covered Up, or Sobered Up)
Renamed from Sober Gangster on 15 Oct 2026 (Mike). Folder moved to games/spiritual-gangster. The save key stays sober-gangster-v5 so saves carry over.

v6.0 (15 Oct 2026): six rows of moves, top to bottom: LIFE, PEOPLE (old crew, the ex, Ghost), PLACES (the old block, the bar, a party),
THINGS (the fresh look, car stack $900, move-out stack), WORK, SPIRITUAL. People and places = real fun now (big stress relief), riskier
night (riskToday + wildBoost feed the overnight wild cards). Things = goals: jars in s.jar, and the love interest (Jaz for guys, Marc for
girls, trust 'love'; 8 = together, 2 = it's over). 3 love situations in chapter 2. move_<id> text threads show the first time you do a move.
Faces: assets/people/love-girl.webp, love-guy.webp. Icons: assets/ui/mv/<move>.webp.

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

v4.0 — THE RPG (Mike, 15 Oct 2026). engine.js has the rules, situations.js the 18 situations (chapters 1-3, written by
ChatGPT, approved by Mike), cards.js the night cards. Story bible: Pops, Big Ray, Darlene, Mom, Shorty, Ghost.
- 3 moves a day, 10 buttons in 3 rows. SPIRITUAL (meeting, call sober support, help someone, rest, + give rides once you
  have a car) always helps. WORK (go to work, better job, quit) adds heat unless a spiritual move came first that day.
  LIFE (argue, ignore, say f**k it) = quick stress relief, lots of heat, and a receipt that comes back days later.
- Every move moves somebody's trust. Streaks: 3 meetings in a row = Pops offers to sponsor; a week employed = the raise
  ($100 a shift); a car = Give rides; 14 and 30 days standing.
- Start $12. Food $12 a night. Rent every 7 days: $100, $140, $175, $250 by chapter. Owe two weeks = lose the bed.
  No job = +8 stress every morning. 3 job leads (better job) = an interview.
- Chapters: 1 The Bottom Bunk, 2 Clock In or Clock Out, 3 Wheels and Wisdom, 4 Keys to Your Own Place -> SOBERED UP.
- Heat: no numbers on screen, a flame meter. Life on life's terms adds 12 every night (CFG.heat.street).
  Tuned with sim.cjs: a smart person (the 'human' bot) wins about 1 in 3, around day 33.
- First 2 days: the next thing to tap wiggles (nudge() in index.html).
- TODO: chapter 4 situations (ChatGPT went blank 15 Oct; chapter 4 reuses chapter 2-3 situations for now),
  ChatGPT art for the envelope, flames and the 7 new move icons (hand-drawn SVG stand-ins in index.html).

v4.1 — REAL MONEY + GAME FEEL (Mike, 15 Oct 2026).
- Money scaled to Ohio: a shift takes 2 of your 3 moves and pays $72 take-home ($96 after the raise). Warehouse
  runs Mon-Sat, closed Sunday. Every Sunday night: rent (100/140/150/175) + bus $20 + court/probation fees $25 (+$15 phone).
  Shop prices up (kicks $110, phone $120, car $1,200). Shorty's Honda is the deal: $400. Move-in $350.
  Tuned: careful player wins ~3 in 4 around day 33; a player who slips wins ~1 in 3 around day 50.
- Faces: assets/people/<id>.webp (ChatGPT). Situations and receipts arrive as texts on a cracked phone.
- Your homie talks: a speech bubble every morning (homieSays()).
- Moves in your words: words.js (ChatGPT), per situation, shown on the buttons.
- Night recap "How he made out" + sobriety chips (24 hours, 7, 14, 30 days) on the story page.
- Icons, envelope and flames: assets/ui/mv/ (ChatGPT).

v5.0 — HE HAS A MIND OF HIS OWN (Mike's brief, 15 Oct 2026).
- Spiritual energy (0-100): meetings +12, calls +8, help +10, rest +5, rides +10; life moves -12; -12 every night.
- Sober days (s.sober) drive the chips and the win (30 days sober). Relapse = sober back to 0, money/trust hit,
  chips re-earnable, chapter/job/people kept. Locked up still = back to chapter 1.
- Evening cinematic after the moves: how the day went, TONIGHT'S PLAN, meters, warning. LIGHTS OUT.
- Real time: the night resolves at the next 6 AM local, exactly once (s.asleep.wake). Missed days = one night.
  Refresh can't reroll (the night is resolved and saved before it's shown). Add ?dev to the URL for a skip button.
- Overnight wild cards (engine WILD): craving, ex, cop, Ghost, newcomer call, paycheck, Mom, the ceiling, or a quiet
  night (the old dream cards). Outcome tier from FOUNDATION (spirit, sober time, people, sponsor) vs RISK (heat,
  stress, life moves today, Ghost, alone, broke). Worst outcomes (relapse, locked up, missing) need RISK >= 40;
  a cop lockup needs heat 60+. Missing = he's gone in the morning, comes back at 4:52 PM; 1 move that day.
- Morning cinematic reveal: time, scene, last night, his words (grow with sober time), STATUS.
- Tuned (NIGHT in engine.js): careful players win ~6 in 10 around day 38, a player who slips ~4 in 10.

v5.2 — REAL TEXTS (Mike, 15 Oct 2026): every situation, receipt and overnight wild card is a real text thread
(convos.js, 51 threads written by ChatGPT). Blue bubbles = your homie, gray = them, group chats like SOBER HOUSE 🏠,
typing dots, Read/Delivered. Messages play in one at a time; tap the phone to show them all.
