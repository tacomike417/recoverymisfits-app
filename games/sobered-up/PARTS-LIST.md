# Sobered Up — paper-doll parts list (for the real art)

The game draws the character in layers, like a paper doll. Right now every layer is a simple
SVG stand-in drawn in `doll.js`. To replace them with real art, make ONE transparent PNG per
part below, all on the same 200×300 canvas, so they stack without lining up by hand.

**Canvas:** 200 wide × 300 tall, transparent background. The character stands centered, feet at
the bottom (y≈285), head top at y≈25. Export at 2× (400×600) for crisp phones.

**Style:** flat, cartoonish, simple, thick dark outline (#292720), no shading or gradients. Nothing
that looks real. Present-day person. Think board-game token, not portrait.

**Stack order** (back → front): hood · hair-back · body · tattoo · pants · shirt · shoes · watch ·
chain · beard · face · hair-front · shades · hat · phone

## Body (one per skin tone, both sexes) — 8 files
`body-guy-1..4.png`, `body-girl-1..4.png` — head, neck, arms, hands, legs. No clothes. Neutral
face (eyes + brows only, no mouth — the mouth is its own layer so it can change).
Skin tones: light (#f1c9a5), tan (#d9a06f), brown (#b07248), dark (#6f4a30).
Builds: slim / average / solid / chunky — the game scales width for now; if you want real chunky art, add `body-guy-chunky-1..4.png`. Height (short / average / tall) is a scale — no extra files.

## Faces — 3 files
`mouth-ok.png` (small smile), `mouth-flat.png` (stress 70+), `mouth-down.png` (stress 90+).
`sweat.png` — one drop by the temple, shows when heat is 80+.

## Hair — 4 styles × 2 sexes × 4 colors = 32 files (or 8 files + we recolor)
Guy: `hair-guy-buzz`, `hair-guy-short`, `hair-guy-curly`, `hair-guy-pulledback` (this one has a bun → needs a `-back` file too)
Girl: `hair-girl-bob`, `hair-girl-ponytail` (needs `-back`), `hair-girl-long` (needs `-back`), `hair-girl-bigcurls`
Colors: black (#1d1a16), brown (#5a3a22), blonde (#c9a04a), gray (#8a8a8a).
`cut-line.png` — the sharp lineup edge that shows after buying "Fresh cut" (sits on the hair front).

## Facial hair (guys) — 5 files
`beard-stubble.png`, `beard-goatee.png`, `beard-mustache.png`, `beard-full.png`, `beard-trimmed.png` (full beard after "Beard trim"). Per hair color if you want them to match; otherwise dark only.

## Clothes
Shirts: `shirt-tank.png` (start), `shirt-tee.png`, `shirt-hoodie.png` + `hoodie-hood-back.png` (the hood behind the head)
Pants: `pants-shorts.png` (start), `pants-jeans.png`
Shoes: `shoes-slides.png` (start), `shoes-boots.png` (Work boots), `shoes-dunks.png`

## Stuff on you
`hat-flatbill.png` · `shades.png` · `chain-fake.png` (gray) · `chain-real.png` (gold, thicker, pendant)
`ink-start.png` (left forearm, the "already inked" start option) · `tattoo-small.png` (right forearm) · `tattoo-sleeve.png` (whole right arm) · `watch.png` (left wrist)
`phone-cracked.png` · `phone-new.png` · `phone-newest.png` (held in the right hand, down by the hip)

## The room (440×220, separate canvas) — later
Room pieces are drawn in `roomSVG` and can stay as SVG longer. When ready: `room-bed`, `room-garbage-bag`,
`room-dresser`, `room-tv`, `room-couch`, `room-bike`, `room-dog`, `window-car-beater`, `window-car-nice`.

## Prompt starter for the art
"Flat cartoon paper-doll game part, thick dark outline, no shading, transparent background, 400×600 px,
the character is centered and standing, feet at the bottom. Draw ONLY: [part]. Match this body: [attach body-guy-2.png]."
Generate the body first, then every other part on top of that same body so they line up.
