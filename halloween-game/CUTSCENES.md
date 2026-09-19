# Halloween Game — The Meeting Cutscenes

**Decided 19 Sep 2026.** The inside-the-meeting gameplay is GONE. No candy
search, no tapping, no dialogue trees. Each meeting is one short Runway clip
and nothing else.

---

## The rule that makes it work

The gag gets **shorter every time**, not the same length. Long setup, then
faster, then fastest — and the last one goes long again for the turn. That is
why "NO DAMN CHOCOLATE" lands five times instead of dying on the third.

And the best joke is already in the premise: **Bob is the doctor.** He is the
one citing the doctor's orders. Lean on it.

---

## CS1 — AA, the recognition  (~8s)

They walk up beaming, 1930s suits, genuinely happy to be back.

> **BILL:** Dear friend. After all these years.
> **BOB:** Let's see if they kept the place up.

Door opens. Beat.

> **CROWD:** *...HOLY SHIT, IT'S THE GUYS.*

Chairs scrape. A coffee pot hits the floor. A chip rolls across the linoleum.

> **SOMEBODY:** I think I'm going to throw up.
> **BILL** *(still smiling, not moving):* We could go.
> **BOB:** We could go now.

## CS2 — Fresh Threads  (~6s)

Curtain. They step out in full 2026 disaster — chains, shades at night,
bucket hat.

> **BILL:** I believe we are big pimpin.
> **BOB:** Do not say that again.
> **BILL:** Fo' shizzle.
> **BOB:** ...What's a shizzle?
> **BILL:** No idea. It tested well.

## CS3 — CA, the first one  (~7s)

Nobody looks twice. Bill is delighted. Bob is already lifting a napkin like a
crime scene.

> **BILL:** They have no idea.
> **BOB:** Coffee. Creamer. Napkins. *Where are the damn candy bars?*
> **BILL:** Bob.
> **BOB:** The doctor said keep chocolate around. THE DOCTOR SAID.
> **BILL:** You're the doctor.
> **BOB:** I KNOW WHAT I SAID.

## CS4 — GA  (~4s) — faster

Smash cut. Bob is already mid-sentence, barely through the door.

> **BOB:** NO CHOCOLATE.
> **BILL** *(warmly, to a stranger):* He's working a program.

## CS5 — EA  (~4s) — fastest, no dialogue from Bob

He walks in. Looks at the table. Turns around. Walks out.

> **BILL:** We just got here.
> **BOB** *(offscreen):* I SAW THE TABLE.

## CS6 — Harrison Corner, the turn  (~10s)

Canton. Older room. They're tired, costumes rumpled. Bob is quiet for the
first time.

> **BOB:** Five meetings. Two cities.
> **BILL:** Not one bar.

Bill notices a kid's paper pumpkin taped to the wall.

> **BILL:** Bob. What's today?
> **BOB:** ...It's Halloween.
> **BILL:** They gave us one day back.
> **BOB:** On the one day the whole world is handing out candy.
> **BILL:** That's not a coincidence.
> **BOB:** That's an assignment.

**GET THE CHOCOLATE BACK.**

---

## Runway constraints — read before burning credits

- **It cannot do reliable lip-synced dialogue. Do not try to make it talk.**
  Generate the PHYSICAL comedy — the room turning, the pot dropping, Bob's
  face at the snack table, the walk-out. Every line above gets delivered
  through the game's existing speech-bubble system or a voiceover.
- **9:16 vertical.** The game canvas is a fixed 390x780 phone frame. A 16:9
  clip letterboxes into a strip.
- **3-6 seconds, 540p or 720p, H.264.** A few hundred KB each. The game
  already carries ~44 MB of audio and 1.7-3.3 MB background PNGs; full-quality
  clips would double the download on a phone.
- **One shot per clip.** No cuts inside a generation — Runway drifts.

## Build side, not started yet

- `engine/cutscene.js` is an empty 0-byte file already sitting there for this.
- iOS will not autoplay video with sound without a user gesture. The game
  already has `unlockAudioFromUserGesture`; a cutscene could either start from
  a tap or begin muted.
- The candy-search code added 19 Sep (MEETING_SEARCH_SPOTS, the `search` step,
  drawSearchHotspots) is now superseded and could come back out of
  chapter1-gameplay.js.
- What SURVIVES from that work and matters: the `script.js` parser fix. Every
  section header had a stray space after the slashes, so the whole game's
  dialogue was collapsing into the AA meeting as four enormous blocks. Headers
  are now matched by shape (`Name-levelN`), space or no space.

## Monday, first thing

Turn CS1-CS6 into six Runway prompts, 9:16, one shot each.
