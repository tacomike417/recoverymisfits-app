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

## PARKED — 21 Sep 2026

Tried Runway for real. Got ONE usable clip out of about two hours and 550
credits, then killed the subscription. The six-scene script above is good and
stays exactly as written. What follows is what the tool actually did, so
nobody relearns it from scratch.

**What survives:** `cs1-bill-recognized.mp4` — five seconds, 720x1280, Bill
alone in the doorway, grin drops, eyes go wide, eyes close. That is CS1's
whole beat and it works. Start frame was made in ChatGPT, not Runway.

---

## What Runway can and cannot do

**The one that killed us: two similar characters in one frame will merge.**
Bill and Bob standing shoulder to shoulder, Bill walks, and Bill leaves a
duplicate of himself behind wearing Bob's clothes. It is not a prompt problem.
The model cannot tell where one man ends and the other begins once either of
them moves. ONE character per shot, or nobody moves at all.

**Undrawn background figures become copies of your hero.** The crowd in the
start frame was dark faceless shapes. Told to stand up, the model had to
invent people, and it reached for the only fully-drawn human it had — a
front-row silhouette grew a fedora and a brown suit. If a background figure
has to move, it has to already be drawn as a person in the start frame.

**One motion per clip. It picks its favorite and drops the rest.** "Camera
pushes in, heads turn, one man half rises" produced only the man rising —
who then walked into the middle of the shot and blocked the lead. Write like
a camera operator, not a screenwriter.

**Text in frame garbles.** EXIT came back as EXIF, EXST DAO, EXT. Ask for no
lettering anywhere and pick the generations that have none.

**An unused reference still bleeds.** Bob's reference sat loaded but
unmentioned in the prompt, and Bill came out with Bob's glasses. Only load
the references that shot needs. (And check which tile you are deleting —
removed Bill by accident, got four stills of Bob in a fedora.)

**Text-to-video is 16:9 only.** Vertical 9:16 exists only on image-to-video,
and every Gen-4 video generation needs an input image anyway. So the real
unit of work is a START FRAME plus a motion prompt — never a prompt alone.

**The frame does the heavy lifting.** Runway's own guidance: once you hand it
a frame, the prompt should be almost entirely motion. Restating the look is
what makes it drift.

**Make the frames somewhere else.** ChatGPT made visibly better panels than
Gen-4 Image, and Runway will animate any uploaded picture. Frames there,
motion here.

**There is no continuity between clips.** Every generation is a fresh roll.
Bill is a slightly different Bill in every one — height, face, room. Six clips
will not cut together like a cartoon. Do not plan as if they will.

---

## The shot that works

One fully-drawn character. One small motion. Everything else dead still.

Face acting is the sweet spot: a grin dropping reads better than a room full
of people reacting, costs the same, and cannot melt. The room going quiet is
something a speech bubble and a sound cue sell better than five seconds of
generated motion ever will.

## Costs, for planning

- Gen-4 Image: 8 credits at 1080p, 5 at 720p
- Gen-4 Turbo video: 5 credits/second — draft everything here
- Gen-4 / Gen-4.5 video: 12 credits/second — only for keepers
- Real-world: ~550 credits and two hours for one usable 5-second clip

## If this restarts

The structure that survived contact with reality, for CS1:

1. Bill alone, gets recognized — Runway clip (DONE)
2. Cut to black, door slam — game audio, no video needed
3. "HOLY SHIT IT'S THE GUYS" — game speech bubbles
4. Outside, Bill and Bob decide to go change — one held two-shot, almost no
   motion, bubbles carry it

Character reference art cut for this is in `halloween-game/runway-refs/`.
