/* ==========================================================================
   chapter1-gameplay.js

   Level 1 -- "Walking to Meetings" prototype.

   One-thumb, guided side-scroller. No candy, no combat, no score.

   PERMANENT CONTROL SCHEME:
       A single ACTION button, docked near the bottom of the screen, is
       the player's one control.
           PRESS         = GO      (start walking)
           DOUBLE PRESS  = ACTION  (contextual -- the game decides: JUMP,
                                    SMASH, or KICK based on the next
                                    obstacle's configured type, or a
                                    plain hustle/dash if nothing is close)
       The meeting doorway remains a direct tap on the doorway itself --
       the button doesn't replace that.

   Level 1 has exactly five obstacle moments (LEVEL1_OBSTACLES below),
   each requiring one of three contextual actions. Missing one costs a
   life; Level 1 starts with five. Reaching zero stops gameplay and shows
   a temporary retry screen -- see STATE.OUT_OF_LIVES.

   At each of the five meetings the game takes over pacing and stops them
   at the doorway for a tap to enter. Once inside, a short placeholder
   scene plays (with room for dialogue) before they head back out to the
   next meeting.

   The top HUD has three fixed sections: LIVES (left), a fictional "TIME
   LEFT ON EARTH" story clock (center -- purely visual, no gameplay
   authority; see CONFIG.storyClockSpeed / getScriptClockSeconds), and a
   Level 1 progress bar (right).

   ENTRY POINT (already wired from chapter1-story.js):
       window.HalloweenGame.chapter1Gameplay.start();

   EXIT POINT (centralized, safe if nothing is connected yet):
       window.HalloweenGame.chapter1Gameplay.finish();

   This is an ugly-but-playable prototype. All visuals are placeholder
   shapes so gameplay can be tested before final art exists.
   ========================================================================== */

(function () {
    "use strict";

    window.HalloweenGame = window.HalloweenGame || {};

    /* ======================================================================
       GAME FRAME -- shared 390x780 canonical portrait stage, identical
       block in chapter0-intro.js/chapter1-story.js/chapter1-gameplay.js
       (guarded so it only actually runs once no matter how many of those
       three include it). Locks the #game element itself to a fixed
       390x780 CSS box, then scales that whole box up/down as one rigid
       unit (a single centered CSS transform) to fit whatever the real
       window/device is -- so every chapter composes against the exact
       same logical stage, and a wider screen just shows the same
       composition bigger instead of revealing more world. See
       GAME_STAGE_WIDTH/GAME_STAGE_HEIGHT below and resizeCanvas() for the
       other half of this (locking the CANVAS's own internal drawing
       resolution to match, instead of the old container-relative sizing).
       ====================================================================== */
    const GAME_STAGE_WIDTH = 390;
    const GAME_STAGE_HEIGHT = 780;
    if (!window.HalloweenGame.gameFrameReady) {
        window.HalloweenGame.gameFrameReady = true;
        (function () {
            function applyGameFrame() {
                const game = document.getElementById("game");
                if (!game) return;
                const scale = Math.min(window.innerWidth / GAME_STAGE_WIDTH, window.innerHeight / GAME_STAGE_HEIGHT);
                game.style.position = "fixed";
                game.style.left = "50%";
                game.style.top = "50%";
                game.style.width = GAME_STAGE_WIDTH + "px";
                game.style.height = GAME_STAGE_HEIGHT + "px";
                game.style.transformOrigin = "center center";
                game.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
                game.style.overflow = "hidden";
                game.style.background = "#000";
            }
            applyGameFrame();
            window.addEventListener("resize", applyGameFrame);
            window.addEventListener("orientationchange", applyGameFrame);
        })();
    }

    /* ======================================================================
       CONFIG -- all gameplay tuning values live here
       ====================================================================== */
    const CONFIG = {
        // movement
        // walkSpeed/billOutdoorStrollFPS/bobOutdoorStrollFPS are getters,
        // not plain numbers, so that every EXISTING read of them (there
        // are many, scattered through the normal walk/dash/obstacle/
        // approach code, all completely untouched) automatically scales
        // with repeated FASTER presses -- see fasterSpeedLevel/
        // getFasterSpeedMultiplier below. dashSpeed is deliberately left
        // a plain number: dash is already its own separate speed burst,
        // not something FASTER should compound.
        //
        // Safety against overshooting a scripted stop: dt is hard-capped
        // at 0.05s (see the `dt = Math.min(0.05, ...)` line in the main
        // loop), and every scripted-stop check in the file already works
        // by comparing a remaining-distance gap against a threshold and
        // SNAPPING exactly to it the frame that gap is crossed (e.g.
        // updateApproach's `if (distanceToBuilding <= stopDistance) {
        // ... setDistanceTraveled(exact target) }`) -- that kind of check
        // is correct at ANY speed, it just catches the crossing a frame
        // later at higher speed, never overshoots. The smallest such gap
        // in the game is CONFIG.meetingSlowDistance (480px); even at
        // fasterSpeedMaxLevel, one frame's worst-case travel
        // (walkSpeed * dtMax) stays a small fraction of that, so this is
        // comfortably safe -- see fasterSpeedMaxLevel/
        // fasterSpeedLevelIncrement below for the actual cap.
        get walkSpeed() { return 140 * getFasterSpeedMultiplier(); }, // px/sec the world scrolls at while walking -- base value, see note above
        dashSpeed: 320,             // px/sec while dashing -- NOT scaled by FASTER, dash is its own separate boost
        dashDuration: 0.6,          // seconds a dash burst lasts
        dashCooldown: 0.35,         // seconds before another action can trigger
        doubleTapWindow: 300,       // ms between presses to count as a double press
        facingSpeedEpsilon: 1,      // px/sec -- outdoor currentSpeed below this counts as "stopped" for facing purposes (see updateCharacterFacing), so tiny float noise never reads as walking

        // FASTER button speed progression -- every tap while the button
        // reads FASTER (not just the existing double-press dash, which
        // is untouched) bumps fasterSpeedLevel by one, up to
        // fasterSpeedMaxLevel, permanently raising CONFIG.walkSpeed (and
        // the outdoor run-cycle FPS below, so the animation itself reads
        // faster too) for the rest of the level. Resets to 0 only on
        // retry/game-over -- see resetRuntimeState. 5 levels * 0.3 =
        // 2.5x top speed, comfortably inside the safety margin described
        // above.
        fasterSpeedMaxLevel: 5,
        fasterSpeedLevelIncrement: 0.3,

        // the three contextual obstacle actions. DOUBLE PRESS always
        // means the same thing to the player; the game picks which of
        // these actually happens based on the nearest obstacle's
        // requiredAction (see LEVEL1_OBSTACLES below).
        actionTriggerDistance: 150, // how far ahead the next obstacle can be for a double press to act on it instead of just hustling

        // Level 1's physical obstacle system (LEVEL1_OBSTACLES below) is
        // OFF. Guarded here rather than deleted -- see the guard in
        // loadObstaclesForSection/updateObstacles/
        // findNearestUnresolvedObstacle/drawStreetObstacles -- so a
        // future level (or Level 1 again, later) can turn it back on by
        // flipping this one flag, with LEVEL1_OBSTACLES's five fully
        // designed entries still intact below. DOUBLE PRESS still works
        // as a plain hustle/dash with this off -- see performAction(),
        // which already falls back to startDash() whenever no obstacle
        // is found nearby.
        obstaclesEnabled: false,

        jumpDuration: 0.45,         // seconds the jump arc takes, start to landing
        jumpHeight: 30,             // px of visual lift at the peak of the jump

        smashDuration: 0.5,         // seconds the smash-through motion takes
        smashLungeDistance: 18,     // px of forward lean at the peak of the smash

        kickDuration: 0.4,          // seconds the kick motion takes
        kickLegLength: 24,          // px the placeholder kick leg extends

        impactEffectDuration: 0.35, // seconds a smash/kick impact burst stays on screen

        // obstacle-specific placeholder behavior: the kicked skateboard
        // rolls away afterward rather than just vanishing (see the
        // "rollAway" flag on its entry in LEVEL1_OBSTACLES)
        obstacleRollAwayDuration: 0.6,  // seconds the roll-away animation takes
        obstacleRollAwayDistance: 70,   // px it travels (and fades) over that time

        // obstacles
        lives: 5,                   // starting lives for Level 1
        lifeLostFlashDuration: 0.35,// seconds the lives HUD flashes after losing one
        stumbleDuration: 0.6,       // seconds a missed obstacle briefly slows you
        stumbleSlowFactor: 0.35,    // walk speed multiplier while stumbling
        obstacleWidth: 46,          // logical width used for pass/miss checks

        // ambient scenery (cats/trash/leaves) -- see AMBIENT_EVENTS. Pure
        // atmosphere, no gameplay effect of any kind.
        ambientCatWalkDuration: 4.5,   // seconds a walking cat takes to cross the screen
        ambientCatRunDuration: 1.1,    // seconds a running/darting cat takes -- quick
        ambientDebrisDuration: 4.0,    // seconds trash/leaves take to drift across
        ambientCatDisplayHeight: 46,   // px -- small relative to Bill/Bob (~170px outdoors)
        ambientDebrisDisplayHeight: 22,// px -- smaller still
        ambientFrameDuration: 0.12,    // seconds per animation frame (5-frame cycle)
        ambientRunFrameDuration: 0.07, // faster cycle for the running cat specifically
        ambientDebrisWobbleAmplitude: 7,  // px of gentle vertical drift for trash/leaves
        ambientDebrisWobbleFrequency: 3,  // radians/sec for that drift
        ambientOffscreenMargin: 50,    // px past each screen edge an ambient object spawns/despawns at

        // meeting approach
        meetingSlowDistance: 480,   // distance from building where auto-slowdown begins
        meetingStopDistance: 70,    // distance from building where they stop (doorway)
        meetingApproachMinSpeedFactor: 0.18, // slowest fraction of walkSpeed during approach
        doorwaySlideSpeedMultiplier: 1.45, // ONLY applied during the APPROACHING_MEETING slide-into-the-doorway movement above -- ~45% faster, normal walkSpeed/dashSpeed themselves are untouched
        doorwayDustSpawnInterval: 0.08,    // seconds between dust puff CLUSTERS while sliding into the doorway (was 0.15 for a single puff -- more frequent AND each tick is now a cluster, see doorwayDustPuffsPerSpawn)
        doorwayDustLifeSeconds: 0.5,       // how long each zip puff lives before fully fading (was 0.32) -- still reads as a quick "zip," just big enough now to actually see
        doorwayDustPuffsPerSpawn: 4,       // puffs spawned per character per spawn tick, each with randomized size/offset/rotation -- see spawnDoorwayDustPuff

        // Big one-time dust burst the instant Bill/Bob actually come to a
        // stop (any scripted stop, not just the doorway slide above) --
        // purely a visual reaction to the EXISTING currentSpeed hitting 0,
        // see checkSkidDustBurst/spawnSkidDustBurst. Never changes when or
        // where they stop, only what's drawn when they do.
        skidDustBurstMinSpeed: 40,         // px/sec -- must have been going at least this fast for stopping to kick up a burst at all (a near-standstill shouldn't spawn a cloud)
        skidDustBurstBasePuffCount: 8,     // burst size at base walkSpeed
        skidDustBurstMaxPuffCount: 22,     // burst size at walkSpeed scaled all the way up by FASTER (fasterSpeedMaxLevel) -- "BIG ridiculous skid cloud" at max speed
        skidDustBurstLifeSeconds: 0.55,    // a bit longer than a zip puff so the big burst has time to actually read before fading

        // the meeting doorway -- must match between rendering (drawBuilding)
        // and hit-testing (getDoorwayScreenRect) so the tappable area is
        // always exactly where the doorway is drawn
        doorwayWidth: 34,
        doorwayHeight: 54,
        doorwayHitPadding: 28,          // extra thumb-friendly margin around the visible doorway, in every direction
        doorwayHintDelayFirst: 2.5,     // seconds to wait before showing the pointer hint, the first time
        doorwayHintDelayLearned: 4.0,   // seconds to wait on later meetings, once the player has already used a doorway once
        doorwayArrowBlinkSpeed: 8,      // was 4 (the old bob-motion frequency) -- doubled per visual-review request for more urgency, still readable

        // follower ("invisible leash")
        followerDistance: 70,           // comfortable distance behind primary
        followerCatchupDistance: 170,   // leash distance that triggers a hustle catch-up
        followerCatchupSpeed: 260,      // px/sec follower moves at while catching up
        followerWaitChance: 0.15,       // chance per lag-check to pause briefly (personality)
        followerDriftAmount: 10,        // small vertical drift range, purely cosmetic

        // transitions
        transitionDuration: 0.8,    // seconds for the fade between meetings
        finishFadeDuration: 1.1,    // seconds for the final fade out of Level 1

        // visible continuity beat after each meeting:
        // reveal the SAME building/door they entered, have both guys emerge,
        // then visibly walk away before the next section begins.
        exitMeetingDuration: 1.65,
        exitDoorStepDuration: 0.50,
        exitRevealDuration: 0.45,

        // inside-the-meeting sequence (walk in -> short scene -> walk back out)
        insideFadeDuration: 0.7,        // seconds to fade in/out crossing the doorway
        insideMeetingMinDuration: 3.0,  // minimum seconds spent inside, even with no dialogue yet
        insideMeetingMaxDuration: 20.0, // safety cap so a dialogue-timing mistake can't soft-lock the level

        // dialogue
     // dialogue
dialogueDefaultDelay: 0.6,
dialogueDisplayDuration: 2.5,

// pause after a meeting dialogue point finishes
interiorPostDialoguePause: 0.5,

        // CHANGING STORE STORY EVENT (building6.png) -- see
        // updateChangingStoreEvent for the phase-by-phase choreography.
        // Approach/stop distances and the doorway zip speed reuse the
        // existing meetingSlowDistance/meetingStopDistance/
        // doorwaySlideSpeedMultiplier values above so this event feels
        // identical to a real meeting doorway; only these are new.
        changingStoreTransformDelay: 1.75,      // seconds Bill and Bob stay hidden inside while their sprites swap (spec: ~1.5-2s)
        changingStoreFadeDuration: 0.2,         // seconds for the quick comic-panel fade-to-black/fade-back-in bracketing that same hidden window (see drawTransitionOverlay) -- purely visual, does NOT change changingStoreTransformDelay itself
        changingStoreEmergeStepDuration: 0.5,   // seconds easing back out from the doorway to their normal standing spot (mirrors exitDoorStepDuration)
        changingStoreRevealWalkDuration: 0.6,   // seconds walking a short distance from the door afterward so both new costumes are clearly visible, not overlapping
        changingStoreCostumeRevealPause: 0.8,   // brief comedic pause after the costume reveal, before ChangingStore-level1/pt2 plays

        // story clock (atmosphere only -- see STORY_TIMES below for the
        // actual locked milestones)
        clockMinutesPerRealSecond: 6.5, // how fast the displayed clock ticks forward while walking outside
        clockApproachBuffer: 3,         // game-minutes the clock holds back from the next locked milestone until the story actually reaches it

        // HUD "TIME LEFT ON EARTH" fictional STORY CLOCK -- purely a visual
        // storytelling device, no gameplay authority whatsoever: nothing
        // reads this to end the level, end a scene, move Bill/Bob, or
        // change lives/progress/buildings/timing. script.js's own
        // "clock: HH:MM:SS" lines (see getScriptClockSeconds) are the ONLY
        // thing that ever sets/re-anchors its value; between anchors it
        // just visually ticks down on its own at storyClockSpeed. Kept as
        // exactly these two named values (per the spec) rather than
        // scattering the multiplier/default anywhere else in the code.
        storyClockSpeed: 5,                    // STORY_CLOCK_SPEED -- fictional seconds that pass per real second (5 = 5x)
        storyClockDefaultSeconds: 24 * 60 * 60, // 24:00:00 -- used only if script.js has no "clock:" value yet for the current section

        // the permanent bottom control button's label/appearance/behavior
        // all change with game state (START / FASTER / ENTER / IN MEETING /
        // "..." / CONTINUE) -- fully centralized in getActionButtonState()
        // (see the ACTION BUTTON section below), applied every frame from
        // updateHud().
        actionButtonWhooshDuration: 0.2, // seconds the "WHOOSH!" comic effect stays visible after a successful FASTER press (spec: 150-250ms)

        // neighborhood scenery -- the repeating tile is scaled by HEIGHT
        // ONLY (aspect ratio preserved) to fill the entire sky-to-ground
        // band, from y=0 down to groundY, the same ground line the
        // gameplay plane uses, then repeated horizontally with no gaps.
        // Houses and lamps are separate objects layered on top, each
        // scaled by height only so nothing ever stretches or squashes.
        houseBaseDisplayHeight: 118,     // px -- decorative houses are background architecture, not character-scale foreground objects
        streetLampDisplayHeight: 92,     // px -- sidewalk-scale decorative lamp; kept behind the characters

        // section length -- logical distance the player must cross to reach
        // each meeting building from the start of that section
        sectionDistance: 1800,

        // BILL SPRITE (basic-level1-bill.png) -- all easy-to-tune-visually
        // values live here, per the integration brief. None of these
        // affect movement speed, collision, or any other gameplay value;
        // see drawBillCharacter.
        billScale: 2.025,            // one central knob for Bill's on-screen size -- tune this, not scattered values (was 1.35; x1.5 per visual review, feet stay grounded via bottom-anchored render)
        billBaseDisplayHeight: 84,   // px -- starting point matched to the previous placeholder character's visual height; billScale multiplies this
        billStrollFPS: 6,            // the walk cycle (see BILL_STROLL_FRAMES) -- tune independently of walkSpeed/dashSpeed, travel speed is unaffected. Used INSIDE meetings only (see billOutdoorStrollFPS for the outdoor street level).
        get billOutdoorStrollFPS() { return 7 * getFasterSpeedMultiplier(); },     // OUTDOOR ONLY -- 4 * 1.25 base, now also scales with FASTER (see CONFIG.walkSpeed above) so the run cycle visibly quickens along with actual travel speed. Bill's actual travel speed (walkSpeed/dashSpeed) is a completely separate value, this only affects the animation.
        billRenderOffsetX: 0,        // px -- nudge sprite left/right without touching gameplay x
        billRenderOffsetY: 0,        // px -- nudge sprite up/down without touching gameplay/ground y

        billFlossFPS: 6,              // the 5-frame floss cycle within each FLOSS window -- slowed from the original continuous-loop version so it reads clearly instead of frantic; see billFlossOnDuration/billFlossOffDuration
        billFlossOnDuration: 1.4,     // seconds Bill spends flossing per cycle
        billFlossOffDuration: 1.1,    // seconds Bill spends back in his normal costume2 idle pose per cycle, before flossing again
        changingStoreArmsCrossedDuration: 1.3, // seconds for the whole end-of-Fresh-Threads punctuation beat (Row 2 transition + hold), see isBillArmsCrossedActive
        billArmsCrossedFPS: 6,        // plays the 5 Row 2 transition frames in ~0.83s, leaving the rest of changingStoreArmsCrossedDuration as a held final pose
        billIdleBlipMinInterval: 4,  // seconds -- soonest an occasional idle variation (1->2->1 or 1->4->1) can happen after the last one
        billIdleBlipMaxInterval: 9,  // seconds -- latest it can happen; actual gap is randomized between these each time
        billIdleBlipHoldSeconds: 0.35, // how long frame 2/4 shows mid-blip before returning to the resting frame 1
        billDoorwaySequenceFPS: 4,   // pace of the one-shot doorway reaction (1->2->3[->20]); holds on the final frame, never loops
        billUseExtendedDoorwaySequence: true, // true: 1->2->3->20 (hold on 20); false: 1->2->3 (hold on 3)

        // BOB SPRITE (basic-level1-bob.png) -- mirrors the Bill knobs
        // above, kept fully separate so either character can be tuned
        // independently. Starts at the same visual scale as Bill per
        // the integration brief ("approximately the same visual
        // character scale as Bill currently appears").
        bobScale: 2.025,             // x1.5 per visual review, feet stay grounded via bottom-anchored render (matches billScale)
        bobBaseDisplayHeight: 84,
        bobStrollFPS: 6,              // the 6-frame walk cycle (see BOB_WALK_FRAMES). Used INSIDE meetings only (see bobOutdoorStrollFPS for the outdoor street level).
        get bobOutdoorStrollFPS() { return 7 * getFasterSpeedMultiplier(); },       // OUTDOOR ONLY -- 4 * 1.25 base, same FASTER scaling as billOutdoorStrollFPS above. Bob's actual travel/follow speed is a completely separate value, this only affects the animation.
        bobRenderOffsetX: 0,
        // Isolated positioning fix: Bob was rendering too low, clipping his
        // feet at the bottom of the sprite and pushing his head down into
        // the zone where the unwanted adjacent sprite-sheet content above
        // his head was becoming visible. Purely a draw-position nudge --
        // does not touch bobScale, frame mapping, animation timing, ground
        // line, or gameplay x/y (see destY in drawBobCharacter). Negative
        // moves him up. Starting at -24px per request; if feet still clip
        // or the artifact is still visible, nudge further (try -30 to -36)
        // before touching anything else.
        bobRenderOffsetY: -24,

        // Separate, independently-tunable vertical correction for the
        // FUNNY sheet only (coffee/donut/book/headScratch) -- never
        // applied to bob2, never shared with bobRenderOffsetY above.
        // Measured/confirmed via the [BOB FRAME DEBUG] console tool:
        // bob2 idle destY sits ~358-361, funny-sheet frames sat ~380-386
        // with zero correction -- a real, sustained ~20-25px "feet sink
        // into the ground" for as long as the ambient action plays, not
        // a one-frame flicker. -24 closes that measured gap. If feet
        // still look low (or now look high), nudge this value alone --
        // it can never affect bob2's own rendering.
        bobFunnyRenderOffsetY: -24,

        bobCoffeeFPS: 3.5,           // frame rate through BOB_COFFEE_FRAMES (holds the sip cell an extra tick) -- Fresh-Threads-eligible meetings only, ~1.5-2s total, see BOB_AMBIENT_ELIGIBLE_MEETINGS
        bobDonutFPS: 3.5,            // BOB_DONUT_FRAMES -- ~1.5-2s, same hold-the-bite pacing as coffee's hold-the-sip
        bobBookFPS: 2,               // BOB_BOOK_FRAMES -- deliberately slower/longer (~3-5s), the reading pose holds well past the transition frames
        bobHeadScratchFPS: 3,        // BOB_HEADSCRATCH_FRAMES -- quick, ~1.5-2s, no held frame
        bobAmbientTriggerChance: 0.5, // odds Bob's TWO selected ambient actions get a look-in at any one eligible idle stop -- keeps plain idle the common case, per spec
        bobAmbientCooldown: 2,        // seconds after one ambient action ends before another can start -- avoids obvious back-to-back repetition

        // TEMPORARY DEBUG AID -- the destination-box rectangle described
        // in drawBillDebugOverlay (a cyan box + red crosshair drawn
        // around/at Bob's actual render target every frame). Flip to
        // true again if this ever needs re-checking; confirmed clean and
        // switched back off after the feet-clipping fix.
        debugShowBobBounds: false,
        bobIdleBlipMinInterval: 4,
        bobIdleBlipMaxInterval: 9,
        bobIdleBlipHoldSeconds: 0.35,
        bobDoorwaySequenceFPS: 4,     // pace of the one-shot 19->6 doorway reaction; holds on 6, never loops

        // Small fixed gap (px) kept between a speech bubble's tail and the
        // actual top of each character's rendered sprite -- see
        // drawSpeechBubbles, which anchors off the character's real
        // returned bounding box (already correct for outdoor vs interior
        // scale, camera scroll, and facing), so this margin itself does
        // NOT need separate outdoor/interior values. Kept as two
        // independent knobs since Bill and Bob's head shapes can differ.
        billBubbleMargin: 14,
        bobBubbleMargin: 14,

        // BUILDING SPEECH BUBBLES ("building-dialogue:" lines in script.js,
        // see parseScriptText/getActiveBuildingBubbleAnchor). Same small-gap
        // idea as billBubbleMargin/bobBubbleMargin above, plus a floor so
        // the bubble never creeps up under the top HUD strip even for a
        // tall building (e.g. the AA church).
        buildingBubbleMargin: 14,
        buildingBubbleMinYFrac: 0.14, // fraction of canvas height -- bubble anchor never goes above this line

        // MEETING INTERIOR CINEMATIC -- see the "MEETING INTERIOR CINEMATIC"
        // block further down (buildInteriorSequence/updateInteriorSequence)
        // for the reusable choreography system these values drive. None of
        // this touches billScale/bobScale or anything about the outdoor
        // scene -- interiorCharacterScale is an on-top multiplier applied
        // only while state === STATE.INSIDE_MEETING (or LEAVING_MEETING,
        // which just renders the frozen final interior frame).
        interiorCharacterScale: 1.875,   // characters render at this multiple of their CURRENT outdoor size while inside a meeting (was 2.5; x0.75 per visual review to shrink Bill/Bob inside meetings only -- outdoor billScale/bobScale untouched)
        interiorGroundYFrac: 0.90,       // fraction of canvas height used as the interior floor line (bigger characters need a lower line so heads don't clip)
        interiorWalkSpeedFrac: 0.09,     // fraction of the full background width crossed per second while walking inside -- resolution-independent
        interiorBobGapFrac: 0.075,       // Bob's trailing gap behind Bill while on the move, as a fraction of the full background width -- always on the side Bill is FACING FROM, never in front of him
        interiorBobRestGapFrac: 0.11,    // Bob's wider resting gap once they've stopped (pauses, holdForScene/dialogue moments) -- keeps both sprites clearly separate at the large interior scale
        interiorBobLerpSpeed: 2.2,       // how quickly Bob eases toward his spot each second (higher = snappier, lower = lazier/more casual)
        interiorTurnDuration: 0.35,      // seconds either character pauses, already facing the new direction, before actually walking that way -- a deliberate turn beat instead of an instant bounce
        interiorCameraDeadzoneMin: 0.35, // Bill can roam this far left of center-screen (as a fraction of the viewport) before the camera starts following
        interiorCameraDeadzoneMax: 0.65, // ...and this far right
        interiorCameraEaseSpeed: 3.0,    // how quickly the camera eases toward the edge of the deadzone once Bill leaves it
        interiorEntranceFrac: 0.08,      // default spawn/exit position, as a fraction of the full background width -- same spot doubles as the exit
        interiorMidFrac: 0.32,           // default first stop, partway into the room
        interiorFarFrac: 0.90,           // default far stop, near the opposite side -- proves the camera can reach the far edge
        interiorPauseEntrance: 0.8,      // seconds paused just after entering, before wandering farther in
        interiorPauseMid: 1.6,           // seconds paused at the first stop
        interiorPauseFar: 1.2,           // seconds paused at the far stop before settling into the scene
        interiorPauseBeforeExit: 0.4,    // seconds paused back at the entrance before actually leaving

        // ====================================================================
        // VISUAL POLISH PASS 2 -- 80s arcade + comic-book "juice" pass.
        // Everything below is purely additive/decorative: speed lines,
        // running foot dust, the bigger directional skid explosion, the
        // SKRRRT lettering, the tiny max-speed camera bump, and the clock
        // alert-state framework. None of it reads or writes
        // distanceTraveled, currentSpeed's role in movement, doorway
        // hitboxes, or any scripted stop position -- see the functions
        // themselves (drawSpeedLines, updateRunningDust, spawnSkidDustBurst,
        // updateEffectsTimers) for how each stays purely additive.
        // ====================================================================

        // RUNNING SPEED LINES -- comic streaks trailing behind Bill/Bob
        // while they're actually walking/dashing outdoors at an elevated
        // FASTER level. Drawn fresh every frame from fasterSpeedLevel/
        // currentSpeed directly (see drawSpeedLines) -- no particle
        // array, so they vanish the instant Bill/Bob stop, automatically.
        speedLineMinLevel: 1,        // fasterSpeedLevel must be at least this for any lines to show at all
        speedLineMaxCount: 5,        // how many streaks at fasterSpeedMaxLevel
        speedLineBaseLength: 14,     // px at the lowest visible level
        speedLineMaxLength: 46,      // px at fasterSpeedMaxLevel
        speedLineBaseOpacity: 0.18,
        speedLineMaxOpacity: 0.5,

        // RUNNING FOOT DUST -- small continuous puffs while walking/dashing
        // at an elevated FASTER level, much smaller than the skid-stop
        // burst below. Purely decorative -- see updateRunningDust/
        // spawnRunningDustPuff/drawDust.
        runningDustMinLevel: 2,          // fasterSpeedLevel must be at least this before any foot dust kicks up
        runningDustSpawnInterval: 0.16,  // seconds between spawn ticks per character at runningDustMinLevel
        runningDustMinSpawnInterval: 0.07, // fastest spawn tick, at fasterSpeedMaxLevel
        runningDustLifeSeconds: 0.3,
        runningDustPuffChance: 0.6,      // each tick only sometimes actually spawns a puff, so it reads as occasional kicks, not a constant stream

        // MASSIVE DIRECTIONAL SKID CLOUD -- on top of the existing
        // skidDustBurst* sizing above, these push the MAX-speed stop into
        // "absurd cartoon smoke explosion" territory and bias most of the
        // cloud backward (behind the direction of travel -- Bill/Bob
        // always run screen-right, so "behind" is negative x, same
        // convention spawnSkidDustBurst already used) with only a few
        // puffs landing forward around their feet. See spawnSkidDustBurst.
        skidCloudBackwardBias: 0.75,     // fraction of puffs that land behind (vs. in front of) their feet
        skidCloudMaxSizeBoost: 1.9,      // extra radius multiplier blended in ONLY at the very top of the speed range, on top of the existing sizeScale growth
        skidCloudHighSpeedThreshold: 0.72, // speedFrac (0..1) above which a stop counts as "high/max speed" for SKRRRT + camera bump purposes below

        // Optional comic "SKRRRT!" lettering -- only ever considered on a
        // high/max-speed stop (see skidCloudHighSpeedThreshold above), and
        // even then only sometimes, so it stays a fun surprise rather than
        // firing on every single stop. See spawnSkidDustBurst/drawSkrrrtEffect.
        skrrrtChance: 0.4,
        skrrrtLifeSeconds: 0.6,

        // Tiny non-positional "camera" bump on the very biggest stops --
        // a couple of frames of a small canvas-element transform that's
        // immediately eased back to nothing. NEVER touches world
        // coordinates, Bill/Bob's x/y, or the canvas's internal drawing
        // space -- see updateEffectsTimers/applyCameraBumpTransform. Only
        // ever triggered from the same high-speed stop branch that can
        // trigger SKRRRT, above.
        cameraBumpDuration: 0.09,    // seconds the whole bump+recovery takes -- deliberately just a couple of frames
        cameraBumpMaxOffsetPx: 4,    // peak px offset, small and screen-resolution-independent

        // CLOCK VISUAL-STATE FRAMEWORK -- see CLOCK_VISUAL_STATES and
        // setClockVisualState() near the fictional-clock code below. The
        // level starts and stays in "normal" (plain neon green) this pass;
        // nothing here auto-advances based on elapsed time. It exists so a
        // later pass can call setClockVisualState("warning") etc. from the
        // story/script side without touching any clock math.
        clockVisualStateDefault: "normal",

        // ====================================================================
        // VISUAL POLISH PASS 3 -- chevron doorway control, real particle
        // fire, meeting-interior "feels alive" choreography (chatter
        // placement/overlap, Bill/Bob reaction beats, per-meeting pacing),
        // and subtle interior ambience. Everything below is additive/
        // decorative only -- no new sprite sheets, no changes to
        // destination coordinates, doorway hitboxes, scripted stops, or
        // story flow. See the functions referenced in each comment.
        // ====================================================================

        // ANIMATED CHEVRON DOORWAY CONTROL -- replaces the "ENTER" text
        // label (only while getActionButtonState() === BUTTON_STATE.ENTER)
        // with three stacked chevrons doing a continuous upward chase. See
        // buildDom's chevron creation block and updateActionButtonHud/
        // applyActionButtonVisualState for how the swap happens. Purely
        // presentational -- getActionButtonState() and the press handler
        // (onActionButtonPointerDown -> enterMeeting()) are completely
        // unchanged; this only changes what's rendered while that state
        // is active.
        chevronChaseCycleSeconds: 1.1,     // one full up-the-stack cycle -- overridden right after CONFIG closes to derive from doorwayArrowBlinkSpeed instead, so the two stay visually connected; left here only as the fallback shape/default
        chevronBumpIntervalSeconds: 2.2,   // how often the whole button gives a small upward bump while chevrons are showing

        // REAL PARTICLE FIRE (FASTER button) -- replaces the old static
        // flame shapes with small DOM particles spawned above the button,
        // driven every frame from updateActionButtonFireParticles. See
        // that function plus spawnFireParticle. Base "just a glow, no
        // flames yet" behavior for low levels is unchanged (still the
        // boxShadow color ramp in updateActionButtonFireVisual).
        fireParticleMinLevel: 2,       // fasterSpeedLevel must be at least this before any flame particles spawn (matches the old flameStartLevel cutoff)
        fireParticleEmberMinLevel: 4,  // embers only start appearing at this level and up
        fireParticleSpawnIntervalBase: 0.09,  // seconds between spawn ticks at fireParticleMinLevel
        fireParticleSpawnIntervalMax: 0.03,   // fastest spawn tick, at fasterSpeedMaxLevel
        fireParticleLifeSeconds: 0.55,
        fireEmberLifeSeconds: 0.85,        // embers live a bit longer and travel farther, per spec
        fireParticleFastFadeMultiplier: 5, // once the button leaves FASTER/active, existing particles decay this much faster so they clear almost immediately instead of lingering
        fireParticleMaxAlive: 26,          // hard cap so a long FASTER hold can never accumulate unbounded DOM nodes
        fireEmberChancePerSpawn: 0.35,      // at fireParticleEmberMinLevel+, this fraction of spawn ticks add an ember on top of the normal particle

        // WORLD CHATTER: OVERLAP -- see updateDialogue's fadingWorldBubble
        // handling and drawSpeechBubbles. Only ever considered between two
        // consecutive "crowd" lines (crowd is meeting-interior-only, see
        // script.js's own comment on that speaker), so Bill/Bob's own
        // dialogue timing/order is never touched. Per-meeting chance lives
        // in MEETING_INTERIOR_CONFIG (personality knob); this is just the
        // fallback if a meeting has no override.
        worldChatterOverlapBaseChance: 0.2,
        worldChatterOverlapFadeSeconds: 0.9, // how long the OLD bubble lingers, fading out, once the new one has already appeared

        // BILL/BOB REACTION BEATS -- reuses the EXISTING idle-blip pose
        // system (billIdleBlipCol/BILL_IDLE_VARIANT_COLS etc., already in
        // the file) rather than any new artwork/animation. See
        // maybeTriggerReactionBlip, called from updateDialogue whenever a
        // new "crowd" line starts. Per-meeting chance lives in
        // MEETING_INTERIOR_CONFIG; this is the fallback.
        reactionBlipBaseChance: 0.25,

        // SUBTLE INTERIOR AMBIENCE -- dust motes + a very soft breathing
        // warm-light vignette, both fully generic (no per-background
        // anchor point needed, so they're safe to enable everywhere) --
        // see drawInteriorAmbientMotes/drawInteriorLampBreathing. Coffee
        // steam was considered but deliberately left out: it needs a
        // real per-meeting anchor point on each interior background that
        // isn't available to verify from code alone, and guessing one
        // risks steam rising out of a wall -- see the note above
        // drawInteriorAmbientMotes.
        interiorDustMoteCount: 5,
        interiorDustMoteDriftSpeed: 6,      // px/sec upward drift
        interiorLampBreatheSpeed: 0.6,      // cycles/sec, very slow
        interiorLampBreatheAlpha: 0.05,     // peak extra alpha -- deliberately tiny

        // HALLOWEEN ATMOSPHERE RAMP -- a barely-there extra warm/orange
        // vignette that increases slightly with meetingIndex (later
        // meetings = a little more atmosphere), reusing the interior
        // lamp-breathing draw call rather than any new art. See
        // getHalloweenAtmosphereFrac.
        interiorHalloweenMaxExtraAlpha: 0.05 // on top of interiorLampBreatheAlpha, only at the very last meeting
    };

    // Chevron chase cadence -- still derived from CONFIG.doorwayArrowBlinkSpeed
    // (a presentation timing constant only) purely to keep the same
    // rhythm the doorway visuals used to share, now that the arrow/glow
    // themselves have been removed (per the "controller-style, chevrons-
    // only" pass) and the chevrons are the sole doorway cue.
    CONFIG.chevronChaseCycleSeconds = (Math.PI * 2) / CONFIG.doorwayArrowBlinkSpeed;

    /* ======================================================================
       ENVIRONMENT_STATES -- the neighborhood's visual progression from
       late October afternoon into Halloween night.

       This is visual storytelling, not a gameplay mechanic: purely
       placeholder styling (sky colors, whether lamps/pumpkins are lit,
       how many background trick-or-treaters appear) standing in for real
       background art later. One state is active at a time, chosen by
       getCurrentEnvironment() below -- nothing here is duplicated per
       meeting; the same outdoor scene just reads different values.
       ====================================================================== */
    const ENVIRONMENT_STATES = {
        lateAfternoon: {
            skyTop: "#7a5230", skyBottom: "#c98a4b",
            lampsLit: false, pumpkinsLit: 0, figureCount: 1, figureOpacity: 0.45
        },
        dusk: {
            skyTop: "#3a2b52", skyBottom: "#a8623f",
            lampsLit: true, pumpkinsLit: 2, figureCount: 3, figureOpacity: 0.6
        },
        evening: {
            skyTop: "#1c1f3d", skyBottom: "#4a3350",
            lampsLit: true, pumpkinsLit: 4, figureCount: 5, figureOpacity: 0.7
        },
        peakHalloween: {
            skyTop: "#10122a", skyBottom: "#2c1f3a",
            lampsLit: true, pumpkinsLit: 6, figureCount: 7, figureOpacity: 0.85
        },
        windingDown: {
            skyTop: "#0b0f2b", skyBottom: "#1c2440",
            lampsLit: true, pumpkinsLit: 3, figureCount: 2, figureOpacity: 0.5
        }
    };

    // Indexed to match MEETINGS (aa, ca, ga, ea, cma) -- "the environment
    // while walking toward meeting[i]." windingDown isn't in this list:
    // it's the environment during the final fade after EA (see
    // getCurrentEnvironment below), since there's no walking section
    // after the last meeting.
    const ENVIRONMENT_SEQUENCE = ["lateAfternoon", "dusk", "evening", "peakHalloween", "windingDown"];

    /* ======================================================================
       STORY_TIMES -- locked story clock milestones.

       This is atmosphere, not a countdown mechanic: there's no clock-based
       failure state. The displayed clock advances quickly while walking
       outside for a sense of travel, but it's the STORY that ultimately
       sets the time -- it snaps to the correct locked value the moment
       Bill and Bob actually leave each meeting, and never overshoots a
       milestone before that happens.
       ====================================================================== */
    const STORY_TIMES = {
        levelStart: "4:17 PM",
        afterAA: "5:55 PM",
        afterCA: "6:35 PM",
        afterGA: "7:45 PM",
        afterEA: "8:55 PM",
        afterCMA: "10:05 PM"
    };

    // Indexed to match MEETINGS below (aa, ca, ga, ea, cma) -- "the time it
    // becomes once they leave meeting[i]."
    const STORY_TIMES_AFTER_MEETING = [
        STORY_TIMES.afterAA,
        STORY_TIMES.afterCA,
        STORY_TIMES.afterGA,
        STORY_TIMES.afterEA,
        STORY_TIMES.afterCMA
    ];

    /* ======================================================================
       ASSETS -- centralized paths. Missing files fall back to placeholders
       and never crash the game.
       ====================================================================== */
    // DEBUG ONLY -- flip to true locally to see Bill's gameplay baseline
    // (x, groundY) and the drawn sprite frame's bounds while tuning
    // billScale/billRenderOffsetX/billRenderOffsetY. Always false by
    // default; never enable this for normal play.
    const DEBUG_BILL_SPRITE = false;

    /* ======================================================================
       ANCHOR JUMP DEBUGGER -- a permanent dev tool, kept in the codebase
       for whenever the next costume/sprite change needs the same kind of
       investigation (this is exactly what caught the idle-blip jump on
       both Bill and Bob -- see the big comment above getAutoFrameOffsetX).

       Hidden by default so it's never in the way during normal play or
       design review. Press Ctrl+D (Cmd+D on Mac) anywhere in the game to
       reveal the "ANCHOR DEBUG" toggle button in the bottom-right corner
       -- see the keydown listener in attachInput. The hotkey only shows
       the BUTTON; tap the button itself to actually turn tracking on/off
       (window.DEBUG_ANCHOR), so it's still a deliberate two-step action,
       not something that can start logging by accident.

       Once turned on, every pose change for Bill/Bob is checked against
       the SAME anchor math the renderer itself uses (destX +
       displayWidth/2, which should equal the character's logical x every
       frame when a pose's offset is correct -- see the derivation in the
       comments above billOffsetX/bobOffsetXRaw). Any unexplained shift
       prints straight to the console, naming the exact pose transition
       and pixel size:

           [ANCHOR JUMP] bill: 0,0,normal,false -> 0,1,normal,false  jump=12.0px  (logical x 131.8->131.8)

       It also draws a thin magenta vertical line at each character's
       logical x every frame, so a drift is visible on screen too, not
       just in the console.
       ====================================================================== */
    const anchorDebugState = { bill: null, bob: null };
    function debugTrackAnchor(who, row, col, appearance, facingLeft, x, destX, displayWidth) {
        const visualAnchorX = destX + displayWidth / 2; // see billOffsetX/bobOffsetXRaw comments -- this equals x exactly when a pose's offset is correct, mirrored or not
        const poseKey = row + "," + col + "," + appearance + "," + facingLeft;
        const prev = anchorDebugState[who];
        if (prev) {
            const expectedShift = x - prev.x; // legitimate movement since last frame -- not a bug
            const jump = (visualAnchorX - prev.visualAnchorX) - expectedShift;
            if (prev.poseKey !== poseKey && Math.abs(jump) > 1.5) {
                console.warn(
                    "[ANCHOR JUMP] " + who + ": " + prev.poseKey + " -> " + poseKey +
                    "  jump=" + jump.toFixed(1) + "px" +
                    "  (logical x " + prev.x.toFixed(1) + "->" + x.toFixed(1) + ")"
                );
            }
        }
        anchorDebugState[who] = { poseKey, visualAnchorX, x };
    }
    function debugDrawAnchorLine(x, groundY) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 255, 0.9)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, groundY - 260);
        ctx.lineTo(x, groundY + 4);
        ctx.stroke();
        ctx.restore();
    }

    /* ----------------------------------------------------------------------
       TEMPORARY -- Bob supplemental-sheet vertical diagnostic.

       Extends the SAME window.DEBUG_ANCHOR toggle above (Ctrl+D reveals the
       button, tap it to turn on) rather than adding a separate debug
       switch. The existing anchor debugger above only ever tracked
       HORIZONTAL drift (visualAnchorX vs logical x) -- it has no vertical
       information at all, so on its own it cannot diagnose "Bob drops
       vertically when switching to a supplemental animation". This adds
       exactly that, and only that, for Bob:

       1. A full geometry dump to console.log, but only on an actual
          identity change (sheet+action/appearance+row+col) -- not every
          frame -- so switching normal -> coffee -> normal produces
          exactly three log lines to compare side by side, not a flood.
       2. A vertical alpha-bounds measurement of the CURRENT 256x256 source
          cell (same offscreen-canvas alpha-scan technique
          measureFrameAlphaCenterX already uses for horizontal centering,
          just scanning top-to-bottom instead of left-to-right) -- this
          directly answers "does the character artwork sit at a different
          vertical position inside this cell than bob2's cells do", which
          is a question about the ART ASSET, not the renderer, and no
          amount of destX/destY math can answer it on its own.
       3. The existing destination-box overlay (drawBillDebugOverlay,
          already used elsewhere in this file) gets drawn for Bob too,
          under this same toggle, so the box is visible without editing
          CONFIG.debugShowBobBounds in code.

       Delete this whole block (and the two call sites in drawBobCharacter)
       once the supplemental-sheet vertical issue is confirmed diagnosed
       and fixed -- it is not meant to be permanent.
       ---------------------------------------------------------------------- */
    let bobFrameDebugLastIdentity = null;
    function debugLogBobFrameGeometry(params) {
        const identity = params.sheetLabel + "|" + params.animName + "|" + params.row + "," + params.col;
        if (bobFrameDebugLastIdentity === identity) return; // only log on an actual change, not every frame
        bobFrameDebugLastIdentity = identity;

        const vBounds = measureFrameAlphaVerticalBounds(params.image, params.srcX, params.srcY, params.cellW, params.cellH);
        const alphaTopFracInCell = vBounds ? Number(vBounds.topFrac.toFixed(3)) : "n/a";
        const alphaBottomFracInCell = vBounds ? Number(vBounds.bottomFrac.toFixed(3)) : "n/a";

        // Flags whether the funny sheet's actual decoded pixel dimensions
        // are exactly a clean 5x4 grid of whole-number cells. If not, srcY
        // = row * cellH silently drifts by a fractional amount that
        // MULTIPLIES with row index -- row 0 (srcY=0) can never show it,
        // row 3 shows 3x whatever the per-row error is. That would explain
        // a symptom that's absent on row 0 (coffee) but visible on lower
        // rows (donut/book/headScratch): a sliver of the row above
        // bleeding into frame, worse the further down the sheet you go.
        const gridExact = (params.sheetLabel === "funny")
            ? (Number.isInteger(params.image.naturalWidth / BOB_FUNNY_SPRITE_COLS) && Number.isInteger(params.image.naturalHeight / BOB_FUNNY_SPRITE_ROWS))
            : "n/a";

        // The critical values are printed directly in the message STRING
        // (not just the object argument below) because Chrome/most
        // consoles collapse a logged object by default -- "▶ {sheet:
        // ..., ...}" -- so anything only inside that object is invisible
        // until you click to expand every single line by hand. Putting
        // destY and the alpha-bounds measurement in the string itself
        // means they're readable straight off the console with no
        // clicking, which is the whole point of this pass.
        console.log(
            "[BOB FRAME DEBUG] " + identity +
            "  srcXY=(" + params.srcX + "," + params.srcY + ")" +
            "  cellWH=" + params.cellW.toFixed(2) + "x" + params.cellH.toFixed(2) +
            "  naturalWH=" + params.image.naturalWidth + "x" + params.image.naturalHeight +
            "  gridExact=" + gridExact +
            "  destY=" + params.destY.toFixed(1) +
            "  destH=" + params.destH.toFixed(1) +
            "  groundY=" + params.groundY.toFixed(1) +
            "  bob2OffsetYApplied=" + params.bob2OffsetYApplied +
            "  alphaTopFrac=" + alphaTopFracInCell +
            "  alphaBottomFrac=" + alphaBottomFracInCell +
            "  isolatedCanvas=" + params.usingIsolatedCanvas,
        {
            sheet: params.sheetLabel,
            animation: params.animName,
            row: params.row,
            col: params.col,
            srcX: params.srcX, srcY: params.srcY, srcW: params.cellW, srcH: params.cellH,
            destX: Number(params.destX.toFixed(1)), destY: Number(params.destY.toFixed(1)),
            destW: Number(params.destW.toFixed(1)), destH: Number(params.destH.toFixed(1)),
            worldX: Number(params.worldX.toFixed(1)), groundY: Number(params.groundY.toFixed(1)),
            meetingScaleMultiplier: params.scaleMultiplier,
            finalDisplayHeight: Number(params.destH.toFixed(1)),
            verticalOffsetParam: params.verticalOffset,
            frameSpecificYOffsetPx: params.offsetYDisplay,
            bob2RenderOffsetYApplied: params.bob2OffsetYApplied,
            cropInsetApplied: params.cropInsetLabel,
            usingIsolatedFrameCanvas: params.usingIsolatedCanvas,
            naturalWidth: params.image.naturalWidth,
            naturalHeight: params.image.naturalHeight,
            // The key diagnostic: where the character's actual opaque
            // pixels sit WITHIN this 256x256 source cell, as a fraction of
            // cell height (0 = very top of cell, 1 = very bottom). If this
            // differs meaningfully between bob2 idle and a funny-sheet
            // action, the art itself is positioned differently inside the
            // cell -- not a renderer bug.
            alphaTopFracInCell: alphaTopFracInCell,
            alphaBottomFracInCell: alphaBottomFracInCell
        });
    }

    const ASSETS = {
        bill: "assets/players/chapter1-bill.png",
        bob: "assets/players/chapter1-bob.png",

        // First real gameplay sprite sheet for Bill (outdoor + current
        // in-meeting placeholder use -- see BILL_SPRITE_* below and
        // drawBillCharacter). Distinct from the reserved "bill" key
        // above, which is left alone for whatever final art eventually
        // replaces this basic pass. A missing/failed file here falls
        // back to the original flat-shape placeholder character exactly
        // as before -- see drawBillCharacter.
        billSpriteBasicLevel1: "assets/players/basic-level1-bill.png",

        // First real gameplay sprite sheet for Bob (follower) -- same
        // pattern as billSpriteBasicLevel1 above. Distinct from the
        // reserved "bob" key above, left alone for whatever final art
        // eventually replaces this basic pass. A missing/failed file
        // here falls back to the original flat-shape placeholder
        // follower exactly as before -- see drawBobCharacter.
        bobSpriteBasicLevel1: "assets/players/basic-level1-bob.png",

        // COSTUME 2 -- post-changing-store sprite sheets. Built to match
        // the SAME grid layout and frame mappings as the sheets above
        // (see billAppearance/bobAppearance and drawBillCharacter/
        // drawBobCharacter), just a different outfit. A missing/failed
        // file here falls back to staying on the normal-appearance sheet
        // -- see the usingSprite checks in drawBillCharacter/drawBobCharacter.
        billSpriteBasicLevel1Costume2: "assets/players/basic-level1-bill2.png",
        bobSpriteBasicLevel1Costume2: "assets/players/basic-level1-bob2.png",

        // SUPPLEMENTAL "funny" sheet -- Bill only, comedy animations (floss
        // for now; more later, not integrated yet). Does NOT replace
        // billSpriteBasicLevel1Costume2 above, which stays Bill's normal
        // post-Fresh-Threads movement sheet, untouched. Already normalized
        // to a clean 1280x1024, 5 cols x 4 rows, 256x256-per-cell grid --
        // see BILL_FUNNY_SPRITE_COLS/ROWS and BILL_FLOSS_FRAMES above. A
        // missing/failed file here just means the floss never plays --
        // drawBillCharacter falls back to Bill's normal costume2 sprite,
        // see the usingFunnySheet check there.
        billSpriteFunny: "assets/players/basic-level1-bill-funny-1280x1024.png",

        // SUPPLEMENTAL "funny" sheet -- Bob only, ambient meeting animations
        // (coffee for now; donut/book/head-scratch reserved for later, not
        // integrated yet). Does NOT replace bobSpriteBasicLevel1Costume2
        // above, which stays Bob's normal movement sheet, untouched. Same
        // normalized 1280x1024, 5 cols x 4 rows, 256x256-per-cell grid as
        // Bill's funny sheet -- see BOB_FUNNY_SPRITE_COLS/ROWS and
        // BOB_COFFEE_FRAMES below. A missing/failed file here just means
        // the coffee animation never plays -- drawBobCharacter falls back
        // to Bob's normal idle rendering, see the usingFunnySheet check.
        bobSpriteFunny: "assets/players/basic-level1-bob-funny-1280x1024.png",

        // Optional final-art overrides for the five interactive buildings.
        // If any of these files are missing, drawBuilding() automatically
        // keeps the existing programmer-art building as the fallback.
        // Final meeting-building placement:
        // building1.png = AA
        // building2.png = CA
        // building3.png = Gamblers Anonymous
        // building4.png = Emotions Anonymous
        // building5.png = Harrison Corner / CMA (Canton)
        aaBuilding: "assets/backgrounds/building1.png",
        caBuilding: "assets/backgrounds/building2.png",
        gaBuilding: "assets/backgrounds/building3.png",
        eaBuilding: "assets/backgrounds/building4.png",
        cmaBuilding: "assets/backgrounds/building5.png",

        // The changing/clothing store -- a "Superman phone booth" story
        // beat, not a meeting. See the CHANGING_STORE data object and
        // updateChangingStoreEvent below.
        changingStoreBuilding: "assets/backgrounds/building6.png",

        background: "assets/level1/akron-night.png",

        // Ambient scenery sheet -- see AMBIENT_EVENTS/AMBIENT_ROW below.
        // Strict 5-col x 4-row grid, 256x256 per cell, transparent bg.
        // Lives under assets/players/, not assets/level1/ or
        // assets/backgrounds/ -- corrected per explicit path confirmation.
        level1Visuals: "assets/players/level1-visuals.png",

        music: "assets/audio/chapter1-gameplay-music.mp3", // beforeFreshThreads gameplay track -- retired for good once Fresh Threads' clothing-change sequence begins, see beginFreshThreadsMusicFadeOut()
        musicAfterFresh: "assets/audio/chapter1-gameplay-music-fresh-to-meeting.mp3", // afterFreshThreads gameplay track -- becomes "the" gameplay music permanently partway through fresh.mp3, see startFreshToMeetingTrack()
        // Meeting-interior foreground chatter, and the Fresh Threads
        // costume-reveal-exit music sting -- see the AUDIO section near
        // the bottom of the file (setAudioMode/startMeetingChatter/
        // startFreshThreadsSting/startFreshToMeetingTrack) for how these
        // tracks are coordinated so they never overlap incorrectly.
        meetingChatter: "assets/audio/meeting-chatter.mp3",
        freshThreadsSting: "assets/audio/fresh.mp3",
        uiClick: "assets/audio/click.mp3",   // intro/story-card/menu-style UI navigation only -- see playUiClickSound()

        // Post-meeting travel-music progression for the back half of
        // Level 1 -- see MEETING_EXIT_TRAVEL_ASSET/switchTravelTrack near
        // the AUDIO section. Same "assets/audio/<name>.mp3" convention as
        // every other track above; update these three paths if the actual
        // project location differs.
        grunge1: "assets/audio/grunge1.mp3", // travel music: CA -> GA
        grunge2: "assets/audio/grunge2.mp3", // travel music: GA -> EA
        grunge3: "assets/audio/grunge3.mp3", // travel music: EA -> CMA
        grunge4: "assets/audio/grunge4.mp3"  // final Level 1 travel/end music, after CMA
    };

    /* ======================================================================
       DIALOGUE FONTS -- loaded ONCE via the FontFace API (not per-level
       start/retry -- there's nothing to redo on retry, so this runs
       exactly once when the script itself first loads), from local
       files only:
           assets/fonts/ComicNeue-Bold.ttf  -- ALL speech-bubble dialogue
               (Bill, Bob, meeting/crowd chatter, building chatter)
           assets/fonts/Bangers-Regular.ttf -- comic sound-effect/
               exclamation lettering only (currently just "SKRRRT!")
       No Google Fonts, no external URL, no @font-face pointed at
       someone else's server -- both are local files bundled with the
       game.

       BASE-URL RESOLUTION: every other asset in this file (images via
       `img.src = "assets/backgrounds/building1.png"`, audio via
       `new Audio("assets/audio/...")`) is a plain relative string,
       which the browser resolves against the DOCUMENT's own base URL
       (document.baseURI) -- that's the proven-working convention here,
       confirmed by the images actually loading. FontFace()'s url()
       string is CSS syntax and, in this test setup, was NOT resolving
       against that same document base (two straight rounds of 404s on
       a plain relative path proved that empirically -- guessing another
       relative string was not going to fix it). resolveAssetUrl() below
       sidesteps the ambiguity entirely: it builds the exact same
       absolute URL the browser would compute for `img.src = path`
       (new URL(path, document.baseURI)), so the font -- and the music
       Audio() call, which uses the same helper below for consistency --
       resolve through the identical, already-proven-correct base as
       every working image/background asset, not a second guessed path.
       ====================================================================== */
    function resolveAssetUrl(relativePath) {
        try {
            return new URL(relativePath, document.baseURI).href;
        } catch (e) {
            return relativePath; // extremely old browser without the URL constructor -- fall back to the plain relative string
        }
    }

    let comicNeueFontLoaded = false;
    let bangersFontLoaded = false;

    function loadDialogueFonts() {
        if (typeof FontFace === "undefined" || !document.fonts) {
            // Very old browser without the FontFace API -- fall back to
            // the system comic-lettering stack rather than blocking
            // dialogue forever. See isComicNeueReady()/isBangersReady().
            comicNeueFontLoaded = "unsupported";
            bangersFontLoaded = "unsupported";
            return;
        }

        const comicNeueUrl = resolveAssetUrl("assets/fonts/ComicNeue-Bold.ttf");
        const comicNeue = new FontFace("ComicNeueBold", "url('" + comicNeueUrl + "')", { weight: "700", style: "normal" });
        comicNeue.load().then(function (loadedFace) {
            document.fonts.add(loadedFace);
            comicNeueFontLoaded = true;
        }).catch(function (err) {
            comicNeueFontLoaded = "unsupported"; // missing/failed load -- fall back rather than block dialogue forever
            console.warn("chapter1-gameplay: ComicNeue-Bold failed to load from " + comicNeueUrl + " -- falling back to system font.", err);
        });

        const bangersUrl = resolveAssetUrl("assets/fonts/Bangers-Regular.ttf");
        const bangers = new FontFace("BangersRegular", "url('" + bangersUrl + "')", { weight: "400", style: "normal" });
        bangers.load().then(function (loadedFace) {
            document.fonts.add(loadedFace);
            bangersFontLoaded = true;
        }).catch(function (err) {
            bangersFontLoaded = "unsupported";
            console.warn("chapter1-gameplay: Bangers-Regular failed to load from " + bangersUrl + " -- falling back to system font.", err);
        });
    }
    loadDialogueFonts();

    // Resolved CSS font-family value for dialogue/SKRRRT text -- ready
    // (true) uses the real local font; "unsupported" (load failed or no
    // FontFace API) uses the closest system comic-lettering fallback so
    // the game never blocks dialogue forever over a missing font file.
    function getDialogueFontFamily() {
        if (comicNeueFontLoaded === "unsupported") return "'Comic Sans MS', 'Trebuchet MS', sans-serif";
        return "'ComicNeueBold'";
    }
    function getSkrrrtFontFamily() {
        if (bangersFontLoaded === "unsupported") return "'Comic Sans MS', 'Trebuchet MS', sans-serif";
        return "'BangersRegular'";
    }
    function isDialogueFontReady() {
        return comicNeueFontLoaded === true || comicNeueFontLoaded === "unsupported";
    }
    function isSkrrrtFontReady() {
        return bangersFontLoaded === true || bangersFontLoaded === "unsupported";
    }

    /* ======================================================================
       MODULAR NEIGHBORHOOD SCENERY SYSTEM

       Replaces the earlier multi-image background-sequence test with a
       simpler, more flexible setup:

         - ONE repeating tile (level1-bg1.png) as the base sky/road/
           sidewalk layer, tiled horizontally for as long as a section
           needs to be. See drawTiledBackground.
         - Standalone house sprites (house1/house2/house3.png), placed by
           data in LEVEL1_HOUSES below -- not baked into the tile -- so
           the neighborhood can be rearranged, extended, or restocked
           with more houses later without touching the tile image.
         - Standalone street lamps, placed by data in
           LEVEL1_STREET_LAMPS the same way.
         - Optional PNG overrides for the five interactive meeting
           buildings (AA/CA/GA/EA/CMA) -- see loadBuildingOverrideImages and
           drawBuilding. A missing/failed building PNG always falls back
           to the existing programmer-art building exactly as before.

       Houses and lamps are placed per meeting-section using the same
       "section" + "distance" shape LEVEL1_OBSTACLES already uses, so
       they stay consistent with a section's own 0..CONFIG.sectionDistance
       walk. Every building always sits at CONFIG.sectionDistance, so
       placements below are kept comfortably short of that with real
       gaps -- nothing overlaps a building's doorway/interaction zone.

       Scenery only: houses and lamps have no interaction trigger and no
       effect on gameplay. Bill and Bob simply pass in front of them.
       Interaction logic (doorway hit-testing, obstacle actions, etc.)
       lives entirely elsewhere and never reads any of this art data --
       see getDoorwayScreenRect and LEVEL1_OBSTACLES.
       ====================================================================== */
    const BACKGROUND_TILE_ASSET = "assets/backgrounds/level1-bg1.png"; // repeating sky/road/sidewalk strip

    const HOUSE_ASSET_SOURCES = {
        house1: "assets/backgrounds/house1.png",
        house2: "assets/backgrounds/house2.png",
        house3: "assets/backgrounds/house3.png",
        house4: "assets/backgrounds/house4.png",
        house5: "assets/backgrounds/house5.png",
        house6: "assets/backgrounds/house6.png"
    };

    const STREET_LAMP_ASSET_SOURCE = "assets/backgrounds/level1-street-lamp.png"; // transparent, decorative only -- no collision

    // Decorative landmark buildings are scenery only. They never stop the
    // characters, never receive doorway hit-tests, and never trigger dialogue.
    const DECORATIVE_BUILDING_ASSET_SOURCES = {
        noEntry1: "assets/backgrounds/building-no-entry1.png",
        noEntry2: "assets/backgrounds/building-no-entry2.png"
    };

    // Finished interior background art for each meeting, keyed to
    // MEETINGS[].id. Loaded the same way as every other scenery asset
    // (see loadTrackedImage/loadEnvironmentAssets) and drawn cover-fit
    // in renderInsideMeeting(). A missing/failed file falls back to the
    // existing placeholder interior exactly as before -- no gameplay
    // change either way.
    const MEETING_INTERIOR_ASSET_SOURCES = {
        aa: "assets/backgrounds/bg-aa-meeting.png",
        ca: "assets/backgrounds/bg-ca-meeting.png",
        ga: "assets/backgrounds/bg-ga-meeting.png",
        ea: "assets/backgrounds/bg-ea-meeting.png",
        cma: "assets/backgrounds/bg-cma-meeting.png"
    };

    /* ======================================================================
       MEETING INTERIOR CINEMATIC -- per-meeting choreography overrides.

       Every meeting automatically gets the same default cutscene (see
       buildInteriorSequence/getInteriorConfig below) because everything
       is expressed as a FRACTION of that meeting's own interior
       background width, not a pixel value. A specific meeting only
       needs an entry here if it wants different pacing/positions than
       the shared default -- e.g.:

           aa: { midFrac: 0.28, farFrac: 0.85 }

       Leave a meeting out entirely to just use the defaults from CONFIG
       (interiorEntranceFrac/interiorMidFrac/interiorFarFrac).

       PERSONALITY KNOBS (added for the "meetings feel less passive" pass)
       -- pauseMultiplier scales the existing wait-step durations
       (interiorPauseEntrance/interiorPostDialoguePause/
       interiorPauseBeforeExit), walkSpeedMultiplier scales
       interiorWalkSpeedFrac, chatterOverlapChance/reactionChance feed
       updateDialogue's world-chatter-overlap and reaction-blip rolls.
       None of these touch entrance/mid/far positions, dialogue content,
       scene-timer caps, or story order -- purely rhythm. See
       getInteriorConfig for how a missing knob falls back to CONFIG's
       shared default.
       ====================================================================== */
    const MEETING_INTERIOR_CONFIG = {
        // AA -- calm but social: a bit more lingering, occasional chatter overlap.
        aa: { pauseMultiplier: 1.25, walkSpeedMultiplier: 0.9, chatterOverlapChance: 0.28, reactionChance: 0.28 },
        // CA -- slightly more energetic: faster cadence, a little more movement.
        ca: { pauseMultiplier: 0.8, walkSpeedMultiplier: 1.25, chatterOverlapChance: 0.15, reactionChance: 0.22 },
        // GA -- a little awkward/nervous: longer pauses, more reactive glances, less overlap.
        ga: { pauseMultiplier: 1.4, walkSpeedMultiplier: 0.85, chatterOverlapChance: 0.08, reactionChance: 0.4 },
        // EA -- noticeably calmer: longest rests, quietest room, least overlap.
        ea: { pauseMultiplier: 1.55, walkSpeedMultiplier: 0.8, chatterOverlapChance: 0.05, reactionChance: 0.15 },
        // CMA/Harrison Corner -- most lively of the later meetings.
        cma: { pauseMultiplier: 0.75, walkSpeedMultiplier: 1.3, chatterOverlapChance: 0.32, reactionChance: 0.32 }
    };

    // BILL SPRITE SHEET LAYOUT -- basic-level1-bill.png, verified against
    // the actual file on disk (1536x1024 -> exactly 6 cols x 4 rows of
    // 256x256 cells; cell size is still derived from the loaded image's
    // own naturalWidth/naturalHeight at runtime rather than hardcoded, in
    // case the art is regenerated at a different resolution later).
    //
    // Animation is driven directly by the actual game `state`, not by
    // Bill's on-screen position -- his screen x barely moves during
    // ordinary walking in this scroll-camera game (the world moves under
    // him), so position-delta detection doesn't reliably distinguish
    // walking from standing still. See drawBillCharacter.
    //
    // Three states only, using 1-indexed grid-cell numbering (row-major,
    // left-to-right/top-to-bottom over the 6x4 grid) to match how these
    // were specified:
    //   - IDLE: rests on cell 1 (row 0, col 0) almost all the time.
    //     Occasionally (every ~4-9s) plays a brief 1->2->1 or 1->4->1
    //     blip (cell 2 = row0 col1, cell 4 = row0 col3) and returns to
    //     resting. Never continuously cycles.
    //   - WALK: loops cells 7->8->9->10->11 (row 1, cols 0-4). Cell 12
    //     (row1 col5) is intentionally excluded.
    //   - DOORWAY: one-shot reaction when approaching/waiting at a
    //     meeting door -- cells 1->2->3 (row0 cols 0-2), optionally
    //     continuing to cell 20 (row3 col1) per
    //     CONFIG.billUseExtendedDoorwaySequence. Plays once and holds on
    //     the final frame; never loops.
    // Row 2 (walk LEFT) and the rest of row 3 (excited) are not read at
    // all this pass.
    // Tiny inset (px, in the sprite sheet's own native pixel space) kept
    // just inside every cell's source rect when drawing Bill or Bob, so
    // sampling can never pick up a pixel from the neighboring cell --
    // see the SPRITE_BLEED_INSET note in drawBillCharacter/
    // drawBobCharacter. The original sheets (basic-level1-bill.png /
    // basic-level1-bob.png) use plenty of transparent padding around the
    // actual artwork in every used frame, so a tiny uniform inset is
    // invisible there.
    //
    // basic-level1-bill2.png / basic-level1-bob2.png are DIFFERENT: pixel
    // analysis of the actual files shows several poses genuinely extend
    // past their nominal 256px cell into the row above or below, and the
    // depth differs at every boundary and isn't symmetric (row0 bleeding
    // down into row1 is a separate fact from row1 bleeding up into row0
    // -- confirmed independently for each by a real hard drop to near-
    // zero alpha coverage at a specific offset, not just a smaller
    // number). A single flat top/bottom margin can only ever be right
    // for one boundary/direction and wrong for the rest -- either still
    // bleeding, or clipping real content (feet, hat tops) that was never
    // the problem at that boundary. See the equivalent, more detailed
    // note above BOB_CROP_INSET below for the full methodology and an
    // example of getting this wrong (a smooth silhouette taper looks
    // superficially similar to bleed fading out, but only a real zero-
    // crossing means "this is actually a different piece of artwork").
    // Re-measure and update this table if the art is ever regenerated --
    // these numbers describe THIS file's actual pixel layout, not a
    // general rule.
    const SPRITE_INSET = {
        normal: { top: 1, bottom: 1, left: 1, right: 1 }, // basic-level1-bill.png -- unchanged, already clean
        costume2: {
            byRow: [
                { top: 2, bottom: 5, left: 2, right: 2 },   // row0 (idle)
                { top: 8, bottom: 8, left: 2, right: 2 },   // row1 (walk)
                { top: 5, bottom: 17, left: 2, right: 2 },  // row2 (run)
                { top: 5, bottom: 2, left: 2, right: 2 }    // row3 (excited/doorway)
            ]
        }
    };
    function spriteInsetFor(appearance, row) {
        if (appearance === "costume2") return SPRITE_INSET.costume2.byRow[row] || SPRITE_INSET.costume2.byRow[0];
        return SPRITE_INSET.normal;
    }

    // BOB SPRITE ISOLATION CACHE -- the actual fix for Bob's persistent
    // neighboring-frame bleed (see getBobFrameCanvas/drawBobCharacter).
    //
    // The previous pass only insetted Bob's SOURCE RECT on the big shared
    // spritesheet Image and relied on imageSmoothingEnabled=false. That
    // still bled at the large interior scale because the browser is
    // scaling directly out of the ORIGINAL 1536x1024 image -- at a big
    // enough scale-up factor, some browsers' canvas rasterizers sample a
    // sliver past a source rect's edge regardless of the smoothing flag
    // (this shows up specifically at large scale, matching what was
    // reported: worse inside meetings than outdoors). The smoothing flag
    // and a 1px inset reduce that, but don't structurally prevent it,
    // because the thing being scaled still physically contains the
    // neighboring cells' pixels right next to the sampled edge.
    //
    // The real fix: for each Bob pose actually used, crop it ONCE, at
    // native 1:1 resolution (no scaling, so nothing to bleed from a
    // neighbor during the crop itself), into its own small offscreen
    // canvas -- see getBobFrameCanvas. From then on, drawBobCharacter
    // scales THAT small canvas up for display, never the original sheet.
    // A cropped canvas containing only cell (row,col)'s own pixels has no
    // neighboring-cell data left anywhere inside it, so no scale factor,
    // browser, or filtering mode can bleed one into it -- the failure
    // mode is eliminated structurally, not just reduced. Each cell is
    // only ever cropped once (cached in bobFrameCanvasCache), so this
    // costs nothing per frame after the first time each pose is used.
    //
    // BOB_CROP_INSET is a small safety margin trimmed from every edge
    // during that one-time crop, in case a neighboring pose's artwork
    // physically extends a little past the nominal cell boundary in the
    // source PNG itself (which no amount of source-rect math alone can
    // fix, since it isn't a sampling bug at that point -- it's actually
    // there). BOB_CROP_INSET_OVERRIDES lets a specific cell get a bigger
    // (or smaller) margin than the row default, without touching this
    // code again, if one particular frame still needs tuning after a
    // look at the DEBUG_BOB_SPRITE console output.
    //
    // basic-level1-bob2.png was measured directly (pixel alpha-channel
    // analysis of the actual file). The real signature of genuine bleed
    // is a hard drop to (near) zero alpha coverage at a specific offset
    // -- that's an actual gap between two separate pieces of artwork. A
    // SMOOTH, monotonic taper with no zero crossing (e.g. 95,94,93...,56)
    // is just the character's own silhouette narrowing -- a foot
    // narrowing into an ankle -- and is NOT bleed; inserting a margin
    // there only clips real content. (An earlier pass at this measurement
    // conflated the two and put a 24px bottom margin on row0/row1 that
    // was cutting into Bob's own feet -- that's what the "feet cut off"
    // regression was.) Re-checked with a strict zero-crossing test, the
    // ACTUAL bleed only runs one direction at each boundary:
    //   row0's idle poses bleed ~17px down past y=256 into row1's own
    //     top (real zero-crossing found) -- this is the stray-shoe-
    //     above-the-head bug; row1 does NOT bleed back up into row0
    //   row1 bleeds ~10-13px down past y=512 into row2's top; row2 does
    //     NOT bleed back up into row1
    //   row3 bleeds ~8-10px up past y=768 into row2's bottom; row2 does
    //     NOT bleed down into row3
    // Margins below are (measured zero-crossing offset + ~3px safety) on
    // the side where bleed was actually confirmed, and a small default
    // (3-4px, matching the clean original sheet) everywhere else.
    // Re-measure and update this table if the art is ever regenerated.
    const bobFrameCanvasCache = {};
    const BOB_CROP_INSET = {
        normal: { top: 2, bottom: 2, left: 2, right: 2 },
        costume2: {
            byRow: [
                // row0 (idle) -- bottom is NEGATIVE on purpose: row0's own
                // feet are drawn all the way to y=255 with zero natural
                // padding and keep going for another ~17px into what's
                // nominally row1's cell before hitting the real gap (a
                // genuine zero-alpha crossing, confirmed by direct pixel
                // measurement) -- that's Bob's own foot, not row1 bleeding
                // "backward". A positive/zero bottom inset can only ever
                // crop that missing piece away; it has to extend past the
                // nominal boundary to actually reach it. Row1's own top
                // inset (below) independently excludes this exact same
                // pixel range when row1 itself is drawn, so it never
                // reappears as a floating fragment above Bob's head there.
                { top: 2, bottom: -16, left: 3, right: 3 },
                // row1 (walk) -- same reasoning: its own foot extends
                // ~11px past y=511 into row2's cell before the real gap.
                { top: 20, bottom: -11, left: 3, right: 3 },
                { top: 16, bottom: 13, left: 3, right: 3 }, // row2 (run) -- contained within its own cell, no extension needed (measured)
                { top: 5, bottom: 3, left: 3, right: 3 }    // row3 (excited/doorway)
            ]
        }
    };
    const BOB_CROP_INSET_OVERRIDES = {
        // "normal:0,0": { top: 4 }   -- example: give normal-sheet cell 1 a bigger top margin if needed
    };
    function bobCropInset(appearanceKey, row, col) {
        const overrideKey = appearanceKey + ":" + row + "," + col;
        const base = appearanceKey === "costume2"
            ? (BOB_CROP_INSET.costume2.byRow[row] || BOB_CROP_INSET.costume2.byRow[0])
            : BOB_CROP_INSET.normal;
        const override = BOB_CROP_INSET_OVERRIDES[overrideKey];
        return override ? Object.assign({}, base, override) : base;
    }

    /* ------------------------------------------------------------------
       AUTO-MEASURED HORIZONTAL RECENTERING -- the single anchor system
       for every Bill/Bob frame, both costumes.

       This used to only cover costume2 (which had no hand-measured
       table at all -- a flat 0, no correction). The in-game
       [ANCHOR JUMP] debugger (Ctrl+D to reveal its toggle button --
       see debugTrackAnchor/onDebugHotkeyDown) then caught the SAME kind
       of jump happening on the NORMAL costume too, on the idle
       "resting" <-> idle "blip" transition specifically:

           bill: 0,0 -> 0,1  jump=12.0px   (BILL_FRAME_OFFSET_X: -18.5 vs -0.5)
           bob:  0,0 -> 0,1  jump=37.2px   (BOB_FRAME_OFFSET_X:  -49.5 vs +6.5)

       Both of those hand-measured numbers were individually "correct"
       in the sense that they really do center each cell's FULL alpha
       silhouette. The bug is that methodology itself: the idle blip
       frame raises a hand/tilts the head, which shifts the whole-
       silhouette bounding box even though the character's feet never
       actually move -- so "recenter the full silhouette" makes the
       body visibly hop every time the gesture changes, exactly the
       jump reported. A frame's POSE is allowed to change; its
       body anchor is not.

       First attempt at a fix measured a LOWER band (feet/shoes) instead
       of the whole silhouette, on the theory that feet stay planted
       across a pose change. That fixed the idle blip, but the SAME
       debugger then caught much BIGGER jumps during ordinary WALKING --
       bob 1,0->1,1 jump=-23.0px, bill 1,1->1,2 jump=18.1px, both
       perfectly repeatable every cycle. The feet band was the wrong
       target for a walk cycle specifically: legs are SUPPOSED to swing
       side to side mid-stride, that's what makes it read as walking, so
       recentering on a moving foot fights the animation instead of
       fixing it -- of course it jumps every frame, the foot is meant to
       be somewhere different each frame.

       The fix: measure a MID band instead (TORSO_REGION_* below) --
       roughly chest-to-waist -- which stays still in BOTH situations:
       arms swing above it during idle gestures, legs swing below it
       during a walk cycle, but a character's torso doesn't lurch
       sideways for either one. That gives one consistent body anchor
       across every pose without needing separate hand-measured tables
       per costume, so this now replaces BILL_FRAME_OFFSET_X/
       BOB_FRAME_OFFSET_X entirely (both left in place above, unused, as
       a record of the old numbers). Each cell is measured once and
       cached -- costs nothing per frame after a pose's first use -- and
       works for any future costume automatically, no new table to
       hand-measure.
       ------------------------------------------------------------------ */
    // Bottom-band history, for whoever tunes this next:
    //   - bottom 45% (legs+feet): idle blip jump shrank but didn't zero
    //     out (bob ~21px, bill ~7px) -- still catching a hand/arm.
    //   - bottom 15% (shoes only): idle blip fixed, but walking then
    //     showed even BIGGER jumps (up to ~40px) -- shoes genuinely move
    //     during a walk cycle, so anchoring there fights the animation.
    // Chest-to-waist is stable across both idle gestures and a walking
    // gait, which is why this replaced the feet band rather than just
    // narrowing it further. If a future costume's jump doesn't resolve
    // to ~0, adjust these two fractions -- watch the console with
    // Ctrl+D's debug button on to see the exact before/after per pose.
    const TORSO_REGION_Y_START_FRAC = 0.35;
    const TORSO_REGION_Y_END_FRAC = 0.62;
    const autoFrameOffsetXCache = {};
    function measureFrameAlphaCenterX(image, srcX, srcY, cellW, cellH, yStartFrac, yEndFrac) {
        const w = Math.max(1, Math.round(cellW));
        const h = Math.max(1, Math.round(cellH));
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const offCtx = off.getContext("2d");
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(image, srcX, srcY, cellW, cellH, 0, 0, w, h);

        let pixels;
        try {
            pixels = offCtx.getImageData(0, 0, w, h).data;
        } catch (e) {
            // Cross-origin or otherwise unreadable canvas -- fall back to
            // "already centered" (no correction) rather than throwing.
            // Same fail-safe the rest of this feature relies on below.
            return null;
        }

        const rowStartPx = Math.floor(h * (yStartFrac === undefined ? 0 : yStartFrac));
        const rowEndPx = Math.ceil(h * (yEndFrac === undefined ? 1 : yEndFrac));
        let minX = null, maxX = null;
        const ALPHA_THRESHOLD = 8; // ignore near-invisible anti-aliasing dust at the silhouette edge
        for (let py = rowStartPx; py < rowEndPx && py < h; py++) {
            const rowStart = py * w;
            for (let px = 0; px < w; px++) {
                const alpha = pixels[(rowStart + px) * 4 + 3];
                if (alpha > ALPHA_THRESHOLD) {
                    if (minX === null || px < minX) minX = px;
                    if (maxX === null || px > maxX) maxX = px;
                }
            }
        }
        if (minX === null) return null; // nothing found in this band -- e.g. a cell with no legs visible
        return (minX + maxX) / 2;
    }

    // TEMPORARY -- Bob supplemental-sheet diagnostic (see debugLogBobFrameGeometry).
    // Same offscreen-canvas alpha-scan as measureFrameAlphaCenterX above,
    // just scanning top-to-bottom instead of left-to-right, over the FULL
    // width of the cell. Returns where a frame's opaque pixels actually
    // sit vertically WITHIN its own 256x256 source cell, as a fraction of
    // cell height (topFrac near 0 = starts near the top of the cell;
    // bottomFrac near 1 = extends to the very bottom of the cell). This is
    // purely a measurement of the ART inside the cell -- it never touches
    // gameplay position, groundY, or any renderer offset.
    function measureFrameAlphaVerticalBounds(image, srcX, srcY, cellW, cellH) {
        const w = Math.max(1, Math.round(cellW));
        const h = Math.max(1, Math.round(cellH));
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const offCtx = off.getContext("2d");
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(image, srcX, srcY, cellW, cellH, 0, 0, w, h);

        let pixels;
        try {
            pixels = offCtx.getImageData(0, 0, w, h).data;
        } catch (e) {
            return null; // cross-origin or otherwise unreadable -- same fail-safe as measureFrameAlphaCenterX
        }

        let minY = null, maxY = null;
        const ALPHA_THRESHOLD = 8;
        for (let py = 0; py < h; py++) {
            const rowStart = py * w;
            for (let px = 0; px < w; px++) {
                const alpha = pixels[(rowStart + px) * 4 + 3];
                if (alpha > ALPHA_THRESHOLD) {
                    if (minY === null) minY = py;
                    maxY = py;
                }
            }
        }
        if (minY === null) return null; // fully transparent cell
        return { topPx: minY, bottomPx: maxY, topFrac: minY / h, bottomFrac: maxY / h };
    }

    // Returns how far (in native cell px) to shift the draw position so
    // this cell's TORSO lands on the same horizontal anchor every other
    // frame uses -- the single replacement for what
    // BILL_FRAME_OFFSET_X/BOB_FRAME_OFFSET_X used to hand-measure via
    // the whole silhouette. cacheKey should be unique per sheet/
    // character (e.g. "bill-normal", "bill-costume2") so caches never
    // collide.
    function getAutoFrameOffsetX(cacheKey, image, row, col, cellW, cellH, srcX, srcY) {
        const key = cacheKey + "," + row + "," + col;
        if (Object.prototype.hasOwnProperty.call(autoFrameOffsetXCache, key)) {
            return autoFrameOffsetXCache[key];
        }
        let centerX = measureFrameAlphaCenterX(image, srcX, srcY, cellW, cellH, TORSO_REGION_Y_START_FRAC, TORSO_REGION_Y_END_FRAC);
        if (centerX === null) {
            // No content in the torso band (shouldn't normally happen for
            // a standing character cell) -- fall back to the full-cell
            // measurement rather than leaving this pose uncorrected.
            centerX = measureFrameAlphaCenterX(image, srcX, srcY, cellW, cellH);
        }
        const offset = (centerX === null) ? 0 : (cellW / 2) - centerX;
        autoFrameOffsetXCache[key] = offset;
        return offset;
    }

    // appearanceKey/sourceImage let this same cache/crop system serve BOTH
    // basic-level1-bob.png and the costume2 sheet -- keying purely on
    // row/col would silently hand back a costume2 draw call the NORMAL
    // sheet's cropped pixels (or vice versa) the first time appearance
    // switches, since both share the same cell grid. Keying on
    // "appearance,row,col" keeps every sheet's crops fully separate.
    function getBobFrameCanvas(appearanceKey, sourceImage, row, col, cellW, cellH, srcX, srcY) {
        const key = appearanceKey + "," + row + "," + col;
        const cached = bobFrameCanvasCache[key];
        if (cached) return cached;

        const inset = bobCropInset(appearanceKey, row, col);
        const cropW = Math.max(1, cellW - inset.left - inset.right);
        const cropH = Math.max(1, cellH - inset.top - inset.bottom);

        const off = document.createElement("canvas");
        off.width = Math.ceil(cropW);
        off.height = Math.ceil(cropH);
        const offCtx = off.getContext("2d");
        offCtx.imageSmoothingEnabled = false;
        // 1:1 pixel copy -- no scaling here, so there is nothing for the
        // browser to interpolate/bleed between at crop time either.
        offCtx.drawImage(sourceImage, srcX + inset.left, srcY + inset.top, cropW, cropH, 0, 0, off.width, off.height);

        const entry = { canvas: off, width: off.width, height: off.height };
        bobFrameCanvasCache[key] = entry;

        if (DEBUG_BOB_SPRITE) {
            console.log("[Bob sprite crop] row=" + row + " col=" + col +
                " cell=" + cellW + "x" + cellH +
                " nominalSrc=(" + srcX + "," + srcY + ")" +

                " croppedFrom=(" + (srcX + inset.left) + "," + (srcY + inset.top) + ") size=" + cropW + "x" + cropH +
                " -> isolated canvas " + off.width + "x" + off.height);
        }

        return entry;
    }

    // BOB FUNNY-SHEET ISOLATION CACHE -- same structural fix as
    // getBobFrameCanvas/bobFrameCanvasCache above, applied to
    // basic-level1-bob-funny-1280x1024.png instead of the normal sheet.
    //
    // The funny sheet used to be drawn straight from the shared
    // 1280x1024 Image (see the old bobAmbientFrameActive branch in
    // drawBobCharacter) on the assumption that it was already a clean,
    // pre-normalized grid with nothing to crop. [BOB FRAME DEBUG]'s
    // alphaTopFrac/alphaBottomFrac output is what actually decides that,
    // not this comment -- if a cell's opaque pixels come nowhere near
    // 0.0/1.0, there's nothing to isolate away and the 0-margin default
    // below is correct as-is. But drawing directly from the big shared
    // Image at a large scale-up factor is exactly the failure mode
    // getBobFrameCanvas's own long comment documents for the normal
    // sheet (some browsers' rasterizers can sample a sliver past a
    // source rect's edge at large scale regardless of the smoothing
    // flag) -- so the funny sheet gets the same one-time-crop-into-its-
    // own-canvas treatment structurally, whether or not this particular
    // art asset turns out to need a nonzero inset.
    //
    // Deliberately its own cache/table, NOT shared with
    // bobFrameCanvasCache/BOB_CROP_INSET -- this is a different image,
    // its own independent 5x4 grid, and any bleed direction/margin it
    // turns out to have has nothing to do with bob2's measured margins.
    // Keyed by animName (not appearance) since coffee/donut/book/
    // headScratch are four different rows of the SAME sheet -- keying
    // purely on row/col would still be safe here (they don't collide),
    // but matching getBobFrameCanvas's "key everything that could ever
    // matter" approach costs nothing and avoids ever having to revisit
    // this if the funny sheet grows a second image later.
    //
    // Starts at a full, uninset 256x256 crop for every cell (0 margin on
    // all sides) -- EXCEPT the four rows below, which are measured
    // directly from the actual basic-level1-bob-funny-1280x1024.png file
    // (pixel alpha-channel analysis, not a guess and not scaled/rendered
    // -- the raw source PNG itself). Real, confirmed bleed: each row's
    // OWN shoes (feet) extend past its nominal 256px bottom edge into
    // the next row's cell -- exactly the same failure mode BOB_CROP_INSET
    // already documents and corrects for bob2 above, just on a different
    // sheet.
    //
    // IMPORTANT, learned the hard way: unlike bob2's own margins, this
    // sheet's shoe-bleed does NOT end in a clean drop to zero alpha
    // before the next row's real content (its cap) begins -- opaque
    // pixel coverage just dips to a low point and rises again, so the
    // last few rows of "shoe" and the first few rows of "cap" overlap
    // rather than being cleanly separated. An earlier pass here cropped
    // at each column's worst-case (latest) trough, which reliably
    // removed all the shoe bleed but ALSO clipped a couple of rows of
    // real cap content on headScratch specifically -- confirmed directly
    // against gameplay screenshots (his hat looked flat-topped/cut).
    // These margins instead use the EARLIEST trough across all 5
    // columns, minus 1px -- biased toward NEVER touching Bob's own art,
    // even if that leaves a faint sliver of shoe-bleed visible on
    // whichever column's trough happens to be a row or two later than
    // the others. A little residual bleed is far less noticeable than a
    // visibly clipped hat.
    //   row1 (donut):       per-column troughs 20-22px -> using 19px
    //   row2 (book):        per-column troughs 24-25px -> using 23px
    //   row3 (headScratch): per-column troughs 21-23px -> using 20px
    //   row0 (coffee): no row above it -- measured clean, 0px, confirmed
    // Re-measure and update this table if the funny sheet art is ever
    // regenerated.
    const BOB_FUNNY_CROP_INSET_BY_ROW = [
        { top: 0, bottom: 0, left: 0, right: 0 },  // row0 -- coffee, no neighbor above, clean
        { top: 19, bottom: 0, left: 0, right: 0 }, // row1 -- donut, row0's shoes bleed in
        { top: 23, bottom: 0, left: 0, right: 0 }, // row2 -- book, row1's shoes bleed in
        { top: 20, bottom: 0, left: 0, right: 0 }  // row3 -- headScratch, row2's shoes bleed in
    ];
    const bobFunnyFrameCanvasCache = {};
    const BOB_FUNNY_CROP_INSET_OVERRIDES = {
        // "coffee:0,0": { top: 6 } -- example only. Add a real entry
        // here only if a SPECIFIC cell still needs more than its row's
        // default above, once the debug alpha scan/HUD proves it.
    };
    function bobFunnyCropInset(animName, row, col) {
        const base = BOB_FUNNY_CROP_INSET_BY_ROW[row] || { top: 0, bottom: 0, left: 0, right: 0 };
        const override = BOB_FUNNY_CROP_INSET_OVERRIDES[animName + ":" + row + "," + col];
        return override ? Object.assign({}, base, override) : base;
    }

    // appearanceKey here is the active ambient action name ("coffee",
    // "donut", "book", "headScratch") -- see the key-collision note
    // above. Structurally identical to getBobFrameCanvas otherwise: one
    // 1:1 (no scaling) copy of exactly this cell into its own offscreen
    // canvas, cached, so every subsequent draw of this (anim,row,col)
    // scales ONLY that isolated canvas -- never the shared 1280x1024
    // sheet -- and has no neighboring-cell pixels left anywhere inside
    // it to bleed in at any scale factor.
    function getBobFunnyFrameCanvas(animName, sourceImage, row, col, cellW, cellH, srcX, srcY) {
        const key = animName + "," + row + "," + col;
        const cached = bobFunnyFrameCanvasCache[key];
        if (cached) return cached;

        const inset = bobFunnyCropInset(animName, row, col);
        const cropW = Math.max(1, cellW - inset.left - inset.right);
        const cropH = Math.max(1, cellH - inset.top - inset.bottom);

        const off = document.createElement("canvas");
        off.width = Math.ceil(cropW);
        off.height = Math.ceil(cropH);
        const offCtx = off.getContext("2d");
        offCtx.imageSmoothingEnabled = false;
        // 1:1 pixel copy -- no scaling here, so there is nothing for the
        // browser to interpolate/bleed between at crop time either.
        offCtx.drawImage(sourceImage, srcX + inset.left, srcY + inset.top, cropW, cropH, 0, 0, off.width, off.height);

        const entry = { canvas: off, width: off.width, height: off.height };
        bobFunnyFrameCanvasCache[key] = entry;

        if (DEBUG_BOB_SPRITE) {
            console.log("[Bob funny sprite crop] anim=" + animName + " row=" + row + " col=" + col +
                " cell=" + cellW + "x" + cellH +
                " nominalSrc=(" + srcX + "," + srcY + ")" +
                " croppedFrom=(" + (srcX + inset.left) + "," + (srcY + inset.top) + ") size=" + cropW + "x" + cropH +
                " -> isolated canvas " + off.width + "x" + off.height);
        }

        return entry;
    }

    const BILL_SPRITE_COLS = 6;
    const BILL_SPRITE_ROWS = 4;
    const BILL_ROW_IDLE = 0;
    const BILL_ROW_RIGHT = 1;
    const BILL_ROW_EXCITED = 3;
    const BILL_IDLE_FRAME_COL = 0;          // cell 1 -- relaxed, hands in pockets
    const BILL_IDLE_VARIANT_COLS = [1, 3];  // cell 2, cell 4 -- occasional idle blips
    const BILL_STROLL_FRAMES = [0, 1, 2, 3, 4]; // cells 7-11 (row1 cols 0-4) -- cell 12 (col5) excluded
    const BILL_DOORWAY_SEQUENCE = CONFIG.billUseExtendedDoorwaySequence
        ? [{ row: BILL_ROW_IDLE, col: 0 }, { row: BILL_ROW_IDLE, col: 1 }, { row: BILL_ROW_IDLE, col: 2 }, { row: BILL_ROW_EXCITED, col: 1 }] // 1 -> 2 -> 3 -> 20
        : [{ row: BILL_ROW_IDLE, col: 0 }, { row: BILL_ROW_IDLE, col: 1 }, { row: BILL_ROW_IDLE, col: 2 }]; // 1 -> 2 -> 3

    // SUPPLEMENTAL "funny" sheet grid -- basic-level1-bill-funny-1280x1024.png.
    // Completely independent grid from BILL_SPRITE_COLS/ROWS above (that's
    // still the normal walk/idle/doorway sheet, untouched). This sheet is a
    // clean, pre-normalized 1280x1024 image, 5 cols x 4 rows, exactly
    // 256x256 per cell -- no inset/crop table needed, see the funny-sheet
    // branch in drawBillCharacter, which reads cells directly.
    const BILL_FUNNY_SPRITE_COLS = 5;
    const BILL_FUNNY_SPRITE_ROWS = 4;
    const BILL_FUNNY_ROW_FLOSS = 0; // row 0 = floss
    const BILL_FLOSS_FRAMES = [0, 1, 2, 3, 4]; // all 5 cells of row 0, in order, looping
    const BILL_FUNNY_ROW_ARMSCROSSED = 2; // row 2 = old-school arms-crossed pose. Row 1 (smoking) and row 3 (old-guy shuffle) remain reserved for later, not integrated yet.
    const BILL_ARMSCROSSED_FRAMES = [0, 1, 2, 3, 4]; // played once, in order, then held on the last frame -- see isBillArmsCrossedActive

    // Per-frame horizontal recentering, measured directly from the actual
    // PNG's alpha bounds (native 256px cell space, before scaling). Every
    // frame's FEET already sit flush with its cell's bottom edge (verified
    // separately -- no vertical correction is needed); horizontally, a few
    // frames aren't centered in their own cell, which reads as a visible
    // sideways hop once scaled up if left uncorrected. Keyed "row,col";
    // any frame not listed needs no correction (0). See drawBillCharacter.
    const BILL_FRAME_OFFSET_X = {
        "0,0": -18.5, "0,1": -0.5, "0,2": -0.5, "0,3": 0.0, // idle row: cells 1,2,3,4
        "1,0": 0.0, "1,1": -0.5, "1,2": -0.5, "1,3": 0.0, "1,4": 0.0, // walk row: cells 7-11
        "3,1": -1.5 // cell 20 (extended doorway hold frame)
    };
    function billFrameOffsetX(row, col) {
        const key = row + "," + col;
        return Object.prototype.hasOwnProperty.call(BILL_FRAME_OFFSET_X, key) ? BILL_FRAME_OFFSET_X[key] : 0;
    }

    // BOB SPRITE SHEET LAYOUT -- basic-level1-bob.png, verified against
    // the actual file on disk (1536x1024 -> exactly 6 cols x 4 rows of
    // 256x256 cells, same as Bill's sheet). Fully independent of the
    // BILL_* constants above -- Bob's poses live at different grid cells
    // and needed their own alpha-bounds measurements (see BOB_FRAME_OFFSET_X/Y).
    //
    // Uses the same 1-indexed grid-cell numbering (row-major, left-to-
    // right/top-to-bottom) the poses were specified with:
    //   - IDLE: rests on cell 1 (row0 col0) almost all the time.
    //     Occasionally plays a brief 1->2->1 blip (cell 2 = row0 col1)
    //     and returns to resting. Never continuously cycles.
    //   - WALK: loops cells 7->8->9->10->11->12 (row1, all six cols).
    //   - DOORWAY: one-shot reaction when Bob has caught up and Bill is
    //     approaching/waiting at a meeting door -- cell 19 (row3 col0)
    //     then cell 6 (row0 col5). Plays once and holds on cell 6;
    //     never loops.
    // All other cells (3-5, 13-18, 20-24) are not read this pass.
    const BOB_SPRITE_COLS = 6;
    const BOB_SPRITE_ROWS = 4;
    const BOB_ROW_A = 0; // holds cells 1, 2, and 6
    const BOB_ROW_WALK = 1; // holds cells 7-12
    const BOB_ROW_D = 3; // holds cell 19
    const BOB_IDLE_FRAME_COL = 0;   // cell 1 -- relaxed, hands in pockets
    const BOB_IDLE_VARIANT_COL = 1; // cell 2 -- the one occasional idle blip
    const BOB_WALK_FRAMES = [0, 1, 2, 3, 4, 5]; // cells 7-12, all six columns of row 1
    const BOB_DOORWAY_SEQUENCE = [
        { row: BOB_ROW_D, col: 0 },  // cell 19
        { row: BOB_ROW_A, col: 5 }   // cell 6 -- held
    ];

    // SUPPLEMENTAL "funny" sheet grid -- basic-level1-bob-funny-1280x1024.png.
    // Completely independent grid from BOB_SPRITE_COLS/ROWS above (that's
    // still the normal walk/idle/doorway sheet, untouched). Same clean,
    // pre-normalized 1280x1024, 5 cols x 4 rows, 256x256-per-cell layout as
    // Bill's funny sheet -- no inset/crop table, no isolated-canvas crop
    // (see getBobFrameCanvas) needed, drawBobCharacter's coffee branch
    // reads cells directly.
    const BOB_FUNNY_SPRITE_COLS = 5;
    const BOB_FUNNY_SPRITE_ROWS = 4;
    const BOB_FUNNY_ROW_COFFEE = 0;      // row 0 = coffee
    const BOB_FUNNY_ROW_DONUT = 1;       // row 1 = donut
    const BOB_FUNNY_ROW_BOOK = 2;        // row 2 = reading blue recovery book
    const BOB_FUNNY_ROW_HEADSCRATCH = 3; // row 3 = scratching head
    const BOB_COFFEE_FRAMES = [0, 1, 2, 2, 3, 4]; // hold-raise-sip(x2)-lower-hold -- cell 2 (the sip) repeated once so it reads as a brief hold, not a rushed blip. Existing working timing, unchanged.
    const BOB_DONUT_FRAMES = [0, 1, 2, 2, 3, 4]; // hold-raise-bite-chew(x2)-lower -- same hold-the-middle-frame shape as coffee
    const BOB_BOOK_FRAMES = [0, 1, 2, 2, 2, 3, 2, 4]; // open-raise-settle into reading(held)-turn page-resume reading-lower/close -- deliberately the longest of the four, see CONFIG.bobBookFPS
    const BOB_HEADSCRATCH_FRAMES = [0, 1, 2, 3, 4]; // confused-hand up-scratch-confused-hand down, quick, no held frame

    // The four ambient actions Bob can be assigned for a given eligible
    // meeting -- see pickTwoRandomBobAmbientActions/updateBobAmbientAction.
    // Each entry's own frames/fps stays independently tunable (matching
    // each action's own spec'd pacing) without touching the others.
    const BOB_AMBIENT_ACTIONS = {
        coffee: { row: BOB_FUNNY_ROW_COFFEE, frames: BOB_COFFEE_FRAMES, fps: CONFIG.bobCoffeeFPS },
        donut: { row: BOB_FUNNY_ROW_DONUT, frames: BOB_DONUT_FRAMES, fps: CONFIG.bobDonutFPS },
        book: { row: BOB_FUNNY_ROW_BOOK, frames: BOB_BOOK_FRAMES, fps: CONFIG.bobBookFPS },
        headScratch: { row: BOB_FUNNY_ROW_HEADSCRATCH, frames: BOB_HEADSCRATCH_FRAMES, fps: CONFIG.bobHeadScratchFPS }
    };
    const BOB_AMBIENT_ACTION_NAMES = ["coffee", "donut", "book", "headScratch"];
    const BOB_AMBIENT_ELIGIBLE_MEETINGS = ["ca", "ga", "ea", "cma"]; // AA is explicitly excluded -- Bob hasn't changed into costume2 yet at that point

    // Per-frame recentering, measured directly from the actual PNG's
    // alpha bounds (native 256px cell space, before scaling). Unlike
    // Bill's sheet, a couple of Bob's used frames are noticeably
    // off-center horizontally (cell 1 especially, ~50px), and cell 19's
    // feet sit ~16px above its cell's bottom edge rather than flush like
    // every other used frame -- BOB_FRAME_OFFSET_Y corrects that one so
    // switching from cell 19 to cell 6 doesn't visibly hop. Keyed
    // "row,col"; anything not listed needs no correction.
    const BOB_FRAME_OFFSET_X = {
        "0,0": -49.5, // cell 1
        "0,1": 6.5,   // cell 2
        "0,5": 11.5,  // cell 6
        "1,0": -12.5, // cell 7
        "1,1": -4.5,  // cell 8
        "1,2": 0.0,   // cell 9
        "1,3": 0.0,   // cell 10
        "1,4": 0.0,   // cell 11
        "1,5": 9.0,   // cell 12
        "3,0": -9.5   // cell 19
    };
    const BOB_FRAME_OFFSET_Y = {
        "3,0": 16.0 // cell 19 -- feet sit ~16px above the cell's bottom edge; shift down to match the baseline every other used frame already sits on
    };
    function bobFrameOffsetX(row, col) {
        const key = row + "," + col;
        return Object.prototype.hasOwnProperty.call(BOB_FRAME_OFFSET_X, key) ? BOB_FRAME_OFFSET_X[key] : 0;
    }
    function bobFrameOffsetY(row, col) {
        const key = row + "," + col;
        return Object.prototype.hasOwnProperty.call(BOB_FRAME_OFFSET_Y, key) ? BOB_FRAME_OFFSET_Y[key] : 0;
    }

    const LEVEL1_DECORATIVE_BUILDINGS = [
        // AA section: Akron landmark, scenery only.
        { section: "aa", distance: 930, assetKey: "noEntry1", scale: 0.92, flip: false },

        // CA section: Dry Peoples Club. Large scenery-only landmark.
        // It appears well before the actual CA meeting, roughly five house-lots away.
        // No doorway, stop, dialogue trigger, or interaction is attached to it.
        { section: "ca", distance: 300, assetKey: "noEntry2", scale: 1.18, flip: false }
    ];

    const LEVEL1_HOUSES = [
        // Decorative houses only. These are intentionally spread apart so
        // they read as separate lots and leave a clean approach to the
        // interactive building at distance 1800 in every section --
        // except "ca", which now runs to 2200 to make room for the
        // changing store (see CHANGING_STORE and the "ca" MEETINGS entry).

        // AA section
        { section: "aa", distance: 120, assetKey: "house1", scale: 1.08, flip: false },
        { section: "aa", distance: 520, assetKey: "house4", scale: 0.82, flip: true },
        { section: "aa", distance: 1300, assetKey: "house2", scale: 0.88, flip: true },

        // CA section -- the fourth house (was at 1420, crowding the
        // changing store) now sits AFTER it instead, continuing the
        // residential street naturally past Fresh Threads on the way to
        // CA. See CHANGING_STORE and the Fresh Threads layout note above
        // LEVEL1_HOUSES for why this section's houses are laid out this way.
        { section: "ca", distance: 680, assetKey: "house5", scale: 0.92, flip: true },
        { section: "ca", distance: 900, assetKey: "house3", scale: 1.06, flip: false },
        { section: "ca", distance: 1160, assetKey: "house6", scale: 0.80, flip: false },
        { section: "ca", distance: 1980, assetKey: "house1", scale: 0.96, flip: true },

        // GA section
        { section: "ga", distance: 130, assetKey: "house2", scale: 0.84, flip: false },
        { section: "ga", distance: 550, assetKey: "house4", scale: 1.07, flip: true },
        { section: "ga", distance: 1000, assetKey: "house5", scale: 0.90, flip: false },
        { section: "ga", distance: 1360, assetKey: "house3", scale: 0.78, flip: true },

        // EA section
        { section: "ea", distance: 120, assetKey: "house6", scale: 1.04, flip: true },
        { section: "ea", distance: 540, assetKey: "house1", scale: 0.86, flip: false },
        { section: "ea", distance: 1040, assetKey: "house4", scale: 0.96, flip: true },
        { section: "ea", distance: 1360, assetKey: "house2", scale: 0.82, flip: false },

        // CMA / Canton section -- intentionally a long residential walk.
        // Ten houses sell the joke that they actually traveled all the way
        // to Harrison Corner in Canton looking for candy bars. Cycled
        // through all six house sprites so this long stretch doesn't
        // repeat a lot pattern.
        { section: "cma", distance: 180,  assetKey: "house5", scale: 1.02, flip: false },
        { section: "cma", distance: 520,  assetKey: "house3", scale: 0.86, flip: true },
        { section: "cma", distance: 860,  assetKey: "house6", scale: 0.94, flip: false },
        { section: "cma", distance: 1200, assetKey: "house1", scale: 0.88, flip: true },
        { section: "cma", distance: 1540, assetKey: "house4", scale: 1.00, flip: false },
        { section: "cma", distance: 1880, assetKey: "house2", scale: 0.90, flip: true },
        { section: "cma", distance: 2220, assetKey: "house5", scale: 0.96, flip: false },
        { section: "cma", distance: 2560, assetKey: "house6", scale: 0.84, flip: true },
        { section: "cma", distance: 2900, assetKey: "house3", scale: 1.04, flip: false },
        { section: "cma", distance: 3240, assetKey: "house4", scale: 0.90, flip: true }
    ];

    const LEVEL1_STREET_LAMPS = [
        { section: "aa", distance: 330 },
        { section: "aa", distance: 780 },
        { section: "aa", distance: 1480 },

        { section: "ca", distance: 350 },
        { section: "ca", distance: 800 },
        { section: "ca", distance: 1490 },

        { section: "ga", distance: 340 },
        { section: "ga", distance: 790 },
        { section: "ga", distance: 1490 },

        { section: "ea", distance: 330 },
        { section: "ea", distance: 800 },
        { section: "ea", distance: 1500 },

        { section: "cma", distance: 360 },
        { section: "cma", distance: 1050 },
        { section: "cma", distance: 1730 },
        { section: "cma", distance: 2410 },
        { section: "cma", distance: 3090 },
        { section: "cma", distance: 3500 }
    ];

    /* ======================================================================
       AMBIENT SCENERY EVENTS -- level1-visuals.png (5 cols x 4 rows, 256x256
       cells, transparent background). Pure atmosphere: a cat, blowing
       trash, or tumbling leaves crossing the scene while Bill and Bob walk
       outside. NOT obstacles -- no collision, no hitboxes, no player
       interaction, no effect on movement or progression whatsoever. See
       checkAmbientEvents/updateAmbientEvents/drawAmbientEvents below.

       Same "predetermined world-distance trigger point" pattern
       LEVEL1_OBSTACLES already used, deliberately -- one entry fires once
       when distanceTraveled reaches it (see loadAmbientEventsForSection,
       which resets the "fired" flags every section like
       loadObstaclesForSection did).

       type    "walkingCat" | "runningCat" | "trash" | "leaves" -- selects
               the sprite sheet row (see AMBIENT_ROW below)
       direction "rightToLeft" | "leftToRight" -- which way it crosses
               the screen; sprite is mirrored for "leftToRight" rather
               than needing a second animation set

       ~2-3 per outdoor section, placed in the open stretches between
       meeting doorways, Fresh Threads, and the Dry People's Club stop --
       never inside the last ~480px approach to a meeting (that's
       CONFIG.meetingSlowDistance -- see checkMeetingApproach) or inside
       the Dry People's Club (~230-300) / changing store approach
       (~1200-1780 in "ca" specifically) windows.
       ====================================================================== */
    const AMBIENT_EVENTS = [
        { section: "aa", distance: 300, type: "walkingCat", direction: "leftToRight" },
        { section: "aa", distance: 700, type: "leaves", direction: "rightToLeft" },
        { section: "aa", distance: 1100, type: "trash", direction: "rightToLeft" },

        // "ca" is the tightest section to place these in -- see the
        // note above. Kept inside the one open stretch between the Dry
        // People's Club stop (~300) and the changing store's own
        // approach taper beginning (~1200).
        { section: "ca", distance: 450, type: "runningCat", direction: "rightToLeft" },
        { section: "ca", distance: 750, type: "leaves", direction: "rightToLeft" },
        { section: "ca", distance: 1050, type: "trash", direction: "leftToRight" },

        { section: "ga", distance: 300, type: "leaves", direction: "rightToLeft" },
        { section: "ga", distance: 750, type: "walkingCat", direction: "rightToLeft" },
        { section: "ga", distance: 1150, type: "runningCat", direction: "leftToRight" },

        { section: "ea", distance: 300, type: "trash", direction: "rightToLeft" },
        { section: "ea", distance: 750, type: "leaves", direction: "leftToRight" },
        { section: "ea", distance: 1150, type: "walkingCat", direction: "leftToRight" },

        // "cma" (Harrison Corner) is a much longer section -- still just
        // 3 events, spread further apart, per "simple is the priority."
        { section: "cma", distance: 400, type: "walkingCat", direction: "rightToLeft" },
        { section: "cma", distance: 1700, type: "leaves", direction: "rightToLeft" },
        { section: "cma", distance: 3000, type: "runningCat", direction: "leftToRight" }
    ];

    /* ======================================================================
       MEETING DATA -- one source of truth, walked through in order.
       Obstacles now live separately, in LEVEL1_OBSTACLES below.

       DOORWAY ALIGNMENT (per-building, data-driven):
       Each entry may include an optional "doorway" block that positions
       the interactive doorway against THAT building's own art, instead
       of generic building-center math. All values are normalized
       (0..1) percentages of the building's own DISPLAYED size, so they
       stay correct at any screen size:

         xPercent       horizontal center of the doorway, as a fraction
                         of the image's displayed width (0 = image's
                         left edge, 1 = image's right edge, 0.5 = center)
         bottomPercent  vertical position of the doorway's bottom edge,
                         as a fraction of the image's displayed height
                         measured from the TOP of the image (1.0 = flush
                         with the bottom/ground edge of the image, which
                         is where a real ground-level doorway usually is)
         widthPercent   doorway width as a fraction of the image's
                         displayed width
         heightPercent  doorway height as a fraction of the image's
                         displayed height
         exitOffsetX    optional extra px nudge (screen space) applied
                         only to where Bill and Bob visually step out to
                         when leaving -- almost never needed; only set
                         this if the exit walk needs to start slightly
                         off from the tap-target center for a specific
                         building's art

       Any field left out falls back to a sane default (see
       getMeetingDoorwayConfig) -- a doorway centered horizontally and
       flush with the ground, sized as a modest fraction of the
       building. Buildings with no "doorway" block at all (or still
       using placeholder art) use those defaults automatically, so this
       is fully backward compatible.

       These starting values are reasonable placeholders, not measured
       against the final PNGs -- see the note at the end of this file
       for exactly which values to hand-tune once the real doorway
       position in each building1.png..building5.png is known.
       ====================================================================== */
    const MEETINGS = [
        {
            id: "aa",
            label: "AA",
            buildingAsset: ASSETS.aaBuilding,
            buildingStyle: "church",
            // Measured against building1.png: door centered, roughly
            // 46-55% of width, top ~62% down to the ground.
            doorway: { xPercent: 0.50, bottomPercent: 1.0, widthPercent: 0.10, heightPercent: 0.30 }
        },
        {
            id: "ca",
            label: "CA",
            buildingAsset: ASSETS.caBuilding,
            buildingStyle: "community",
            // Measured against building2.png: door center sits slightly
            // right of true center (~53%), top ~58% down to the ground.
            doorway: { xPercent: 0.53, bottomPercent: 1.0, widthPercent: 0.11, heightPercent: 0.34 },
            // Extended past the default CONFIG.sectionDistance (only for
            // this section -- every other section is untouched) so the
            // changing store (building6, "Fresh Threads") has enough
            // clearance on the far side to read as its own storefront
            // instead of the CA building crowding in right next to it.
            // See CHANGING_STORE below and the Fresh Threads layout note
            // above LEVEL1_HOUSES.
            sectionDistance: 2200
        },
        {
            id: "ga",
            label: "GA",
            buildingAsset: ASSETS.gaBuilding,
            buildingStyle: "office",
            // Measured against building3.png (Arid Club storefront): door
            // centered, top ~44% down to the ground -- taller than a
            // typical house door since it's a full storefront entry.
            doorway: { xPercent: 0.50, bottomPercent: 1.0, widthPercent: 0.13, heightPercent: 0.44 }
        },
        {
            id: "ea",
            label: "EA",
            buildingAsset: ASSETS.eaBuilding,
            buildingStyle: "hall",
            // Measured against building4.png: this door sits well left of
            // center (~34%, under the porch roof), not centered like the
            // generic default assumed -- top ~38% down to the ground.
            doorway: { xPercent: 0.34, bottomPercent: 1.0, widthPercent: 0.14, heightPercent: 0.40 },
            // EA-ONLY fix: the door's large leftward offset from center
            // meant the generic fixed-distance-from-building-center stop
            // (CONFIG.meetingStopDistance) let Bill/Bob slide past the real
            // door before stopping. This opts EA into
            // getMeetingApproachStopDistance()'s doorway-aware stop
            // calculation instead -- see that function. Every other
            // meeting (including CMA, which has a similar offset but whose
            // stopping pose is intentionally being kept -- see
            // showTapDoorHint below) is untouched by this flag.
            alignStopToDoorway: true
        },
        {
            id: "cma",
            label: "CMA",
            buildingAsset: ASSETS.cmaBuilding,
            buildingStyle: "largeHall",
            sectionDistance: 3800,
            // Measured against building5.png (Harrison Corner): the actual
            // "CMA / COME AS YOU ARE" door sits left of center (~35%),
            // under the main sign -- not centered like the generic
            // default assumed. Top ~52% down to the ground.
            doorway: { xPercent: 0.35, bottomPercent: 1.0, widthPercent: 0.11, heightPercent: 0.30 },
            // CMA/Harrison Corner is Level 1's final destination, so
            // arriving there should read as deliberate -- the old plain
            // CONFIG.meetingStopDistance stop (Bill/Bob's old "off to the
            // side, pointing at the sign" pose) left the building well off
            // to one side of the viewport rather than framed. centerInViewport
            // opts CMA into getLandmarkCenterStopOffset() instead (see
            // getMeetingApproachStopDistance) -- the building's own
            // horizontal CENTER lands at screen-center when they stop, no
            // change to its world position or to the approach/deceleration
            // logic itself, which is shared with every other meeting.
            // Note: the "TAP DOOR" label that used to disambiguate the old
            // off-center pose was removed along with the doorway arrow/glow
            // (per the controller-style pass) -- the chevron control is now
            // the only doorway cue anywhere, including here. showTapDoorHint
            // is left set (still inert/unused) rather than pulled out of
            // this data, in case a future pass wants a different way to
            // flag this meeting.
            showTapDoorHint: true,
            centerInViewport: true
        }
    ];

    /* ======================================================================
       CHANGING STORE -- building6.png ("Fresh Threads"), the Bill/Bob
       costume-swap story event ("Superman phone booth"). Deliberately NOT
       a MEETINGS entry: it never invokes the meeting interior cinematic,
       never fades to an interior, and the player never taps a doorway for
       it -- the whole thing is automatic (see checkChangingStoreApproach/
       updateChangingStoreEvent). It's shaped like a tiny meeting-like
       object (id/buildingStyle/buildingAsset/doorway) purely so it can
       reuse getBuildingRenderGeometry/drawBuilding/
       computeDoorwayRectFromGeometry unchanged -- those functions only
       ever read those four fields.

       "section" + "distance" place it the same way houses/decorative
       buildings are placed: a local distance within that meeting's own
       outdoor section. LAYOUT NOTE (visual polish pass): this used to sit
       at distance 1620 with the default "ca" sectionDistance of 1800 --
       only 180px of clearance before the CA meeting building, which was
       close enough that the CA building itself was already scrolling into
       view right next to Fresh Threads, crowding it. "ca" now gets its
       own extended sectionDistance (2200, see the "ca" MEETINGS entry
       above -- every other section is untouched) and the store sits at
       1680: ~520px clear of the last house before it (house6 at 1160,
       see LEVEL1_HOUSES) and ~520px clear of the CA building on the far
       side, so neither neighbor is ever visible on screen at the same
       time as the store. The fourth "ca" house (was at 1420, right next
       to the old store position) now continues the street at 1980,
       AFTER the store, instead of crowding it.

       doorway.xPercent is shifted well left of the generic 0.50 center
       default to line up with Fresh Threads' actual door (a narrow door
       with a round window, near the hanging shirt sign) rather than the
       middle of the whole building image. Like every other building's
       doorway values in this file, this is a best estimate from visual
       reference (video), not a pixel-measured value against the source
       PNG -- hand-tune xPercent/widthPercent/heightPercent further once
       you can see it rendered against the real art.
       ====================================================================== */
    const CHANGING_STORE = {
        id: "changingStore",
        label: "",
        section: "ca",
        distance: 1680,
        buildingAsset: ASSETS.changingStoreBuilding,
        buildingStyle: "store",
        // Shifted left of the door -- see the layout note above. Fresh
        // Threads' real door reads as a single narrow doorway near the
        // hanging shirt sign, not a wide centered entrance, so
        // widthPercent/heightPercent came down a little from the old
        // placeholder guess too.
        doorway: { xPercent: 0.22, bottomPercent: 1.0, widthPercent: 0.10, heightPercent: 0.30 }
    };

    /* ======================================================================
       DRY PEOPLE'S CLUB -- a small scripted dialogue stop at the existing
       decorative landmark (noEntry2, see LEVEL1_DECORATIVE_BUILDINGS
       above -- same section/distance, reused as-is, not duplicated).
       No doorway, no interior, no costume change -- just: approach, stop,
       play DryPeoplesClub-level1/pt1 (see script.js), resume. Modeled on
       CHANGING_STORE/checkChangingStoreApproach but deliberately smaller
       since there's no doorway/entry business to reuse here.
       ====================================================================== */
    const DRY_CLUB_STOP = {
        section: "ca",
        distance: 300 // matches LEVEL1_DECORATIVE_BUILDINGS' noEntry2 entry -- stop right in front of it
    };

    /* ======================================================================
       LEVEL1_OBSTACLES -- the five real obstacle moments for Level 1.

       These are the finalized obstacle concepts, in order:
         1. BMX Kid                          -- JUMP
         2. Giant Leaf Pile                  -- SMASH
         3. Rolling Skateboard                -- KICK
         4. Red Wagon                        -- JUMP
         5. Homemade Cardboard Halloween
            Decoration                       -- SMASH

       One centralized list, not scattered per-function. Each entry:

         id             unique string
         section        which meeting's walking section it appears in
                         (must match a MEETINGS[].id)
         distance       logical distance into that section
         requiredAction "jump" | "smash" | "kick" -- which contextual
                         action clears it. The player never chooses this;
                         DOUBLE PRESS near the obstacle triggers it
                         automatically.
         label          placeholder on-screen text so it's obvious which
                         obstacle is which during testing
         rollAway       optional -- if true, a successfully-cleared
                         obstacle animates rolling/fading away afterward
                         instead of just vanishing (used for the
                         skateboard; see resolveObstacleSuccess)

       Tone note: these are ordinary, innocent 1980s-neighborhood
       Halloween moments -- not hazards or enemies. Missing one is a
       harmless stumble for Bill, never anything happening to a kid, a
       pet, or someone's belongings.

       VISUALS ARE TEMPORARY. These render as simple labeled placeholder
       boxes until real art exists. Each entry has an optional "sprite"
       block reserved for later: when a real sprite sheet or static image
       exists, fill in assetPath/frameCount/frameWidth/frameHeight/
       frameDuration and the renderer will slice and animate it instead
       of drawing the placeholder -- no obstacle logic needs to change.
       ====================================================================== */
    const LEVEL1_OBSTACLES = [
        {
            id: "bmxKid",
            section: "aa",
            distance: 500,
            requiredAction: "jump",
            label: "BMX KID",
            // Planned final art: one sprite sheet, ~3 horizontal frames
            sprite: null // e.g. { assetPath: "assets/level1/bmx-kid.png", frameCount: 3, frameWidth: 64, frameHeight: 64, frameDuration: 0.12 }
        },
        {
            id: "leafPile",
            section: "ca",
            distance: 500,
            requiredAction: "smash",
            label: "LEAF PILE",
            // Planned final art: one static pile image, possibly a
            // separate scatter/impact image (see the impact-effect system)
            sprite: null
        },
        {
            id: "skateboard",
            section: "ga",
            distance: 550,
            requiredAction: "kick",
            label: "SKATEBOARD",
            rollAway: true, // rolls/fades away after a successful kick -- see obstacleRollAwayDuration/Distance
            // Planned final art: one static transparent image; the
            // roll-away motion is handled entirely in code, not the art
            sprite: null
        },
        {
            id: "redWagon",
            section: "ea",
            distance: 450,
            requiredAction: "jump",
            label: "RED WAGON",
            // Planned final art: one static transparent image
            sprite: null
        },
        {
            id: "cardboardDecoration",
            section: "ea",
            distance: 900,
            requiredAction: "smash",
            label: "DECORATION",
            // Planned final art: one intact image, possibly one
            // broken/debris state
            sprite: null
        }
    ];

    /* ======================================================================
       STATES
       ====================================================================== */
    const STATE = {
        WAITING_TO_START: "WAITING_TO_START",
        WALKING: "WALKING",
        DASHING: "DASHING",
        JUMPING: "JUMPING",
        SMASHING: "SMASHING",
        KICKING: "KICKING",
        APPROACHING_MEETING: "APPROACHING_MEETING",
        WAITING_AT_DOOR: "WAITING_AT_DOOR",
        ENTERING_MEETING: "ENTERING_MEETING",
        INSIDE_MEETING: "INSIDE_MEETING",
        LEAVING_MEETING: "LEAVING_MEETING",
        EXITING_MEETING: "EXITING_MEETING",
        CHANGING_STORE_EVENT: "CHANGING_STORE_EVENT",
        DRY_CLUB_DIALOGUE: "DRY_CLUB_DIALOGUE",
        TRANSITIONING: "TRANSITIONING",
        OUT_OF_LIVES: "OUT_OF_LIVES",
        FINISHED: "FINISHED"
    };

    const FOLLOWER_STATE = {
        FOLLOWING: "following",
        LAGGING: "lagging",
        CATCHING_UP: "catchingUp",
        WAITING: "waiting"
    };

    /* ======================================================================
       MODULE-LEVEL RUNTIME STATE
       All of this gets reset in start() so the level is safe to re-launch
       during development.
       ====================================================================== */
    let container = null;
    let canvas = null;
    let ctx = null;
    let livesDisplay = null;
    let livesHeartsEl = null;       // hearts-only child of livesDisplay -- see buildDom's LIVES panel and updateHud (kept separate from livesDisplay itself so the new "LIVES" caption underneath isn't wiped every time updateHud rewrites the hearts)
    let clockDisplay = null;
    let countdownDigitsEl = null;   // flex row wrapper holding countdownMainEl + countdownSecEl -- see buildDom's clock block
    let countdownMainEl = null;     // dominant "HH:MM" piece, state-colored -- see setClockVisualState
    let countdownSecEl = null;      // small warm-white ":SS" piece -- deliberately NOT state-colored (see updateHud/setClockVisualState), so the constantly-changing seconds never visually dominate the display
    let countdownCaptionEl = null;  // "TIME LEFT ON EARTH" caption under the digits
    let progressLabelEl = null;     // small "PROGRESS" caption above the segmented meter
    let progressSegmentEls = [];    // the segmented arcade-meter blocks -- see buildDom's PROGRESS panel and updateHud
    let startPrompt = null;
    let actionButton = null;           // outer element: position/size/touch-target only -- deliberately kept larger than the visible housing for a comfortable phone tap target, and never itself styled with a border/background/glow
    let actionButtonHousing = null;    // inner compact "arcade housing" -- the actual visible black/bevel/rivet box, centered inside actionButton; all border/background/boxShadow/press-transform/pop-animation styling targets THIS element now, not actionButton
    let actionButtonPlayEl = null;     // solid CSS triangle -- shown only for BUTTON_STATE.START
    let actionButtonBoltEl = null;     // lightning-bolt clip-path shape -- shown only for BUTTON_STATE.FASTER, color-ramped by fasterSpeedLevel same as the old text glow was
    let actionButtonWhooshEl = null;   // one-shot "WHOOSH!" comic effect on a successful FASTER press -- not dialogue, not a speech bubble
    let actionButtonFireContainer = null; // houses the dynamic fire particle divs -- see spawnFireParticle/updateActionButtonFireParticles
    let fireParticles = [];            // { el, x, y, vx, vy, life, maxLife, isEmber } -- see spawnFireParticle/updateActionButtonFireParticles
    let fireSpawnTimer = 0;
    let actionButtonChevronEls = [];   // 3 chevron divs shown instead of "ENTER" -- see buildDom's chevron creation block and updateActionButtonHud
    let actionButtonChevronWrap = null; // their shared positioned container -- toggled visible only for BUTTON_STATE.ENTER, see applyActionButtonVisualState
    let actionButtonChapter2Wrap = null; // "» CHAPTER 2 »" chevron+label group -- toggled visible only for BUTTON_STATE.CONTINUE, see applyActionButtonVisualState
    let chevronBumpTimer = 0;          // seconds until the next small upward bump while chevrons are showing -- see updateChevronBump
    let lastActionButtonState = null;  // previous frame's button state, so updateHud() can fire a one-time pop only on an actual transition
    let retryOverlay = null;
    let retryButton = null;
    let debugAnchorButton = null; // small in-game toggle for the anchor-jump debugger -- hidden by default, revealed with Ctrl+D (see attachInput's keydown listener)

    let rafId = null;
    let lastFrameTime = 0;

    let state = STATE.WAITING_TO_START;
    let meetingIndex = 0;
    let exitedMeetingIndex = null;   // index of the meeting just left, if its building is still receding into view -- see advanceToNextSection() and the "EXITED BUILDING" block in renderOutdoorScene()

    let distanceTraveled = 0;       // logical distance covered in the CURRENT section only (0..sectionDistance) -- resets to 0 every time advanceToNextSection() runs. All section-boundary/gameplay-logic checks (approach, obstacles, doorway) use this, unchanged.
    let worldScrollDistance = 0;    // continuous logical distance covered since Level 1 started -- NEVER reset at a section boundary. Purely for rendering continuity (tiled background scroll phase, atmosphere parallax) -- see advanceDistance()/setDistanceTraveled() below and the note above advanceToNextSection().
    let currentSpeed = 0;           // current px/sec of the primary character
    let fasterSpeedLevel = 0;       // 0..CONFIG.fasterSpeedMaxLevel -- see getFasterSpeedMultiplier, bumped by onActionButtonPointerDown's FASTER case, reset in resetRuntimeState

    let dashTimeRemaining = 0;
    let dashCooldownRemaining = 0;
    let stumbleTimeRemaining = 0;
    let jumpTimeRemaining = 0;
    let smashTimeRemaining = 0;
    let kickTimeRemaining = 0;
    let impactEffects = [];   // brief placeholder smash/kick impact visuals: { distance, timeRemaining, kind }

    let lives = CONFIG.lives;
    let livesFlashTimer = 0;

    let follower = {
        offset: CONFIG.followerDistance, // how far behind primary, in logical px
        state: FOLLOWER_STATE.FOLLOWING,
        waitTimer: 0,
        driftPhase: Math.random() * Math.PI * 2
    };

    let obstacles = [];   // active obstacles for the current section, with runtime flags

    // meeting doorway -- see getDoorwayScreenRect / isPointOnDoorway
    let doorwayWaitTimer = 0;      // seconds spent waiting at the current doorway, unpressed -- still drives the serenity-prayer bubble's pop-in timing and CONFIG.chevronChaseCycleSeconds's cadence
    let hasLearnedDoorway = false; // no longer affects anything visual (the doorway hint arrow it used to gate was removed) -- left set for potential future use rather than ripped out

    // CHANGING STORE EVENT -- see CHANGING_STORE / checkChangingStoreApproach /
    // updateChangingStoreEvent. changingStorePhase is only meaningful while
    // state === STATE.CHANGING_STORE_EVENT.
    let changingStorePhase = null;    // null | "approach" | "dialogue1" | "entering" | "hidden" | "emerging" | "reveal" | "pauseBeforeDialogue2" | "dialogue2" | "armsCrossedPose"
    let changingStoreTimer = 0;       // generic countdown/elapsed timer, meaning depends on changingStorePhase
    let changingStoreCompleted = false; // true once the whole event has played out once -- the store then behaves like ordinary scenery, see checkChangingStoreApproach

    // DRY PEOPLE'S CLUB DIALOGUE STOP -- see DRY_CLUB_STOP /
    // checkDryClubApproach / updateDryClubDialogue. Much smaller than the
    // changing store event: just approach, stop, play one dialogue point,
    // resume -- no doorway, no costume change.
    let dryClubPhase = null;         // null | "approach" | "dialogue"
    let dryClubCompleted = false;    // true once played -- the club then behaves like ordinary scenery, see checkDryClubApproach

    // CURRENT APPEARANCE STATE -- read by drawBillCharacter/drawBobCharacter
    // (both outdoors AND inside meetings, since both call the same two
    // functions), so a costume change made here automatically persists
    // everywhere without any other code needing to know about it.
    let billAppearance = "normal"; // "normal" | "costume2"
    let bobAppearance = "normal";  // "normal" | "costume2"

    let dialogueQueue = [];      // remaining scheduled entries for current section
    let dialogueTimer = 0;       // seconds until next queued entry fires
    let activeBubble = null;     // { speaker, text, timeRemaining, crowdPos } -- only one shown at a time. crowdPos is only set when speaker === "crowd", see CROWD_BUBBLE_PRESETS.
    let crowdBubblePresetIndex = 0; // rotates through CROWD_BUBBLE_PRESETS so consecutive crowd lines don't reuse the same spot -- see pickCrowdBubblePreset()

    let musicEl = null;
    let musicFading = false; // drives the existing full fade-to-stop (fadeOutMusic/stopMusic) used on finish/out-of-lives -- unrelated to the meeting-duck/Fresh-sting system below, which uses its own audioMode state

    // See the AUDIO section near the bottom of the file for
    // setAudioMode() -- the single entry point that moves between
    // "outside"/"meeting"/"freshSting" -- these variables are that
    // system's entire state, kept together so it's obvious at a glance
    // that only one "extra" track (chatter OR sting) can ever be active
    // at once.
    let meetingChatterEl = null;   // singleton -- always stopped/replaced, never stacked, see startMeetingChatter()
    let freshStingEl = null;       // singleton -- same idea, see startFreshThreadsSting()
    let audioMode = "outside";     // "outside" | "meeting" | "freshSting" -- see setAudioMode()
    let musicFadeIntervalId = null; // single active volume-fade timer on musicEl at a time -- starting a new one always clears this first, so duck/restore/pause calls firing in quick succession can never fight each other

    // Which gameplay background track counts as "the" current one --
    // meeting enter/exit (setAudioMode) always operates on whatever
    // musicEl currently points at, so this flag is bookkeeping only
    // (never resolved back into an asset path once set); it flips
    // permanently, once, at the Fresh Threads music handoff -- see
    // startFreshToMeetingTrack(). Reset on every retry, see resetRuntimeState().
    let currentGameplayTrack = "beforeFreshThreads"; // "beforeFreshThreads" | "afterFreshThreads"
    let freshThreadsHalfwaySwapped = false; // guards the fresh.mp3-halfway handoff from firing more than once per playback, see startFreshThreadsSting()

    let uiClickEl = null;          // reused instance for click.mp3 -- see playUiClickSound()

    let transitionTimer = 0;
    let transitionPhase = null;  // "in" | "finishing"
    let finishTimer = 0;

    // inside-the-meeting sequence
    let insideElapsed = 0;
    let insideMeetingMaxDurationActive = CONFIG.insideMeetingMaxDuration; // this meeting's resolved cap (script.js scene-timer if set, else CONFIG.insideMeetingMaxDuration) -- reset fresh by enterInsideMeeting() every time a meeting is entered
    let insideFadeTimer = 0;
    let leaveFadeTimer = 0;
    let exitMeetingTimer = 0;

    // meeting interior cinematic (choreographed movement while INSIDE_MEETING)
    // -- see the "MEETING INTERIOR CINEMATIC" block below for the system
    // that drives these. All positions are fractions (0..1) of that
    // meeting's own interior background width, so the same state shape
    // works for every meeting regardless of its background image's
    // actual pixel dimensions.
    let billInteriorFrac = 0;       // Bill's current position inside the room
    let bobInteriorFrac = 0;        // Bob's current position inside the room -- eases toward Bill, not rigidly attached
    let interiorCameraFrac = 0;     // left edge of the camera viewport, as a fraction of the full background width
    let interiorSequence = [];      // this meeting's choreographed step list, built fresh by enterInsideMeeting()
    let interiorStepIndex = 0;
    let interiorStepTimer = 0;
    let billInteriorWalking = false; // this-frame movement flags, purely for picking Bill/Bob's walk vs idle animation
    let bobInteriorWalking = false;
    let billInteriorMoveDir = 1;    // which way Bill is walking/about to walk during a "walk" step (1 = right, -1 = left) -- movement bookkeeping ONLY, not a facing decision. See updateCharacterFacing for the single place facing is actually decided.
    let billInteriorTurning = false; // true during Bill's brief pre-walk "stop and turn" pause (see the "walk" case in updateInteriorSequence)
    let bobInteriorMoveDir = 1;     // same idea as billInteriorMoveDir, for Bob's trailing motion
    let bobInteriorTurning = false;
    let bobInteriorTurnTimer = 0;       // brief "stop and turn" beat before Bob reverses, mirrors the walk-step turn beat below

    // ------------------------------------------------------------------
    // GLOBAL CHARACTER FACING -- the ONLY two variables anything should
    // read to decide which way Bill/Bob are drawn, indoors or out. Set
    // exclusively by updateCharacterFacing() once per frame; nothing
    // else in the file should assign to these directly. See
    // updateCharacterFacing for the full priority order.
    // ------------------------------------------------------------------
    let billFacingLeft = false;
    let bobFacingLeft = false;

    // story clock (atmosphere only)
    let clockMinutes = 0;
    let storyClockSecondsRemaining = 0; // HUD "TIME LEFT ON EARTH" -- fictional seconds left, purely visual (see CONFIG.storyClockSpeed / updateFictionalClock). NOT gameplay time.

    // neighborhood scenery system -- see BACKGROUND_TILE_ASSET / HOUSE_ASSET_SOURCES / LEVEL1_HOUSES / LEVEL1_STREET_LAMPS above
    let tileImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let houseImages = {};           // assetKey -> { image, loaded, naturalWidth, naturalHeight }
    let streetLampImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let decorativeBuildingImages = {}; // assetKey -> decorative scenery image; no interaction logic
    let buildingImages = {};        // meeting id -> { image, loaded, naturalWidth, naturalHeight } -- optional PNG override, see drawBuilding
    let interiorImages = {};        // meeting id -> interior background image, see renderInsideMeeting
    let billSpriteImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let billSpriteImage2 = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // costume2 -- see billAppearance
    let billSpriteImageFunny = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // supplemental "funny" sheet (floss, etc) -- see ASSETS.billSpriteFunny
    let billFlossCyclePrevActive = false; // was isBillFlossActive() true last frame -- detects the entry edge so the FLOSS/IDLE cycle always restarts on FLOSS, see drawBillCharacter
    let billFlossCycleStartAt = null;     // billAnimElapsed timestamp the current FLOSS/IDLE cycle window began
    let billAnimElapsed = 0;        // seconds, free-running animation clock -- never resets on state change, see drawBillCharacter
    let billIdleNextBlipAt = null;  // billAnimElapsed timestamp for the next occasional idle variation (1->2->1 or 1->4->1)
    let billIdleBlipEndAt = null;   // if an idle blip is currently showing, when it ends and Bill returns to resting on frame 1
    let billIdleBlipCol = null;     // which variation column (1 or 3) the current/last blip used
    let billDoorwaySequenceStartAt = null; // billAnimElapsed timestamp the one-shot doorway reaction sequence began
    let billWasInDoorwayState = false;     // tracks entry into APPROACHING_MEETING/WAITING_AT_DOOR so the sequence starts fresh exactly once
    let doorwayDustPuffs = [];             // dust puffs during the faster doorway slide -- see updateApproach/drawDust
    let doorwayDustSpawnTimer = 0;
    let skidDustPuffs = [];                // big one-time burst puffs on an abrupt stop, anywhere in the game -- see checkSkidDustBurst/spawnSkidDustBurst/drawDust
    let prevOutdoorSpeedForSkid = 0;       // last frame's currentSpeed, purely to detect a moving->stopped transition -- see checkSkidDustBurst

    // VISUAL POLISH PASS 2 -- see the CONFIG block above for all the
    // tuning knobs these read from.
    let runningDustPuffs = [];             // small continuous puffs while running at an elevated FASTER level -- see updateRunningDust/spawnRunningDustPuff/drawDust
    let runningDustSpawnTimer = { bill: 0, bob: 0 };
    let skrrrtEffect = null;               // { life, maxLife, x, y } | null -- one-shot comic "SKRRRT!" lettering, see spawnSkidDustBurst/drawSkrrrtEffect
    let cameraBumpTimer = 0;               // seconds remaining on the current tiny camera bump, see spawnSkidDustBurst/updateEffectsTimers/applyCameraBumpTransform
    let clockVisualState = CONFIG.clockVisualStateDefault; // "normal" | "alert" | "warning" | "danger" | "critical" -- see setClockVisualState
    let activeInteriorConfig = null;       // this meeting's resolved getInteriorConfig() result, set fresh by enterInsideMeeting() -- see buildInteriorSequence/updateInteriorSequence's "walk" case/updateDialogue for where pauseMultiplier/walkSpeedMultiplier/chatterOverlapChance/reactionChance are actually used
    let fadingWorldBubble = null;          // { speaker, text, crowdPos, life, maxLife } | null -- the previous world-chatter bubble, briefly still fading out while a new one has already appeared, see updateDialogue/drawSpeechBubbles

    let bobSpriteImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let bobSpriteImage2 = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // costume2 -- see bobAppearance
    let bobSpriteImageFunny = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // supplemental "funny" sheet (coffee, etc) -- see ASSETS.bobSpriteFunny
    let level1VisualsImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // ambient scenery sheet -- see AMBIENT_EVENTS
    let bobAnimElapsed = 0;         // seconds, free-running -- independent of billAnimElapsed
    let bobIdleNextBlipAt = null;   // billAnimElapsed-style timestamp (on bobAnimElapsed) for the next occasional 1->2->1 blip
    let bobIdleBlipEndAt = null;    // if the blip is currently showing, when it ends and Bob returns to resting on cell 1
    let bobDoorwaySequenceStartAt = null; // timestamp the one-shot 19->6 doorway reaction began
    let bobWasInDoorwayState = false;     // tracks entry into "Bob has caught up and Bill is at the doorway" so the sequence starts fresh exactly once
    let bobAmbientSelectedActions = []; // the TWO action names locked in for the current eligible meeting -- see pickTwoRandomBobAmbientActions/enterInsideMeeting
    let bobAmbientActiveAction = null;  // null | one of BOB_AMBIENT_ACTION_NAMES -- which ambient action is actually playing right now, if any
    let bobAmbientElapsed = 0;          // seconds since bobAmbientActiveAction began, dt-accumulated so a mid-action cancel never leaves a stray offset
    let bobAmbientLastAction = null;    // the most recently COMPLETED action -- used to avoid picking the exact same one immediately back-to-back
    let bobAmbientCooldownRemaining = 0; // seconds until another ambient action is allowed to start -- see CONFIG.bobAmbientCooldown
    let sectionHouses = [];         // runtime house placements for the current meeting section
    let sectionDecorativeBuildings = []; // visual-only landmark placements for the current section
    let sectionStreetLamps = [];    // runtime lamp placements for the current meeting section
    let sectionAmbientEvents = [];  // this section's AMBIENT_EVENTS entries + a "fired" flag each -- see loadAmbientEventsForSection/checkAmbientEvents
    let activeAmbientEvents = [];   // currently-animating ambient scenery instances (cats/trash/leaves) -- see updateAmbientEvents/drawAmbientEvents

    // input tracking -- double-press timing for the ACTION button
    let lastTapTime = 0;
    let pointerListenersAttached = false;

    // resize handling
    let resizeHandler = null;

    /* ======================================================================
       INITIALIZATION
       ====================================================================== */
    function start() {
        cleanup(); // safe even on first run

        container = document.getElementById("game");
        if (!container) {
            console.error("chapter1-gameplay: #game container not found");
            return;
        }

        buildDom();
        resetRuntimeState();
        loadEnvironmentAssets();
        attachInput();
        attachResize();
        resizeCanvas();
        startMusic();

        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(tick);
    }

    function buildDom() {
        container.innerHTML = "";

        canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.touchAction = "none";
        canvas.style.userSelect = "none";
        canvas.style.webkitUserSelect = "none";
        container.appendChild(canvas);
        ctx = canvas.getContext("2d");

        // ------------------------------------------------------------
        // TOP HUD -- 80s digital-alarm-clock styling. Same three fixed
        // sections as before (LIVES left / TIME LEFT ON EARTH center /
        // PROGRESS right); only the presentation changed here -- lives
        // math, the story clock's own internal tracking, and progress
        // calculation are all untouched (see updateHud/computeLevelProgress).
        // Sizes use clamp(px, vw, px) instead of fixed px so the three
        // sections stay clear of each other and inside the viewport
        // across the game's actual phone-width range, not just one
        // reference screen size.
        // ------------------------------------------------------------
        // ------------------------------------------------------------
        // UNIFIED 80s ARCADE HUD PANEL -- a single shared "instrument
        // panel" backdrop the three existing sections (lives/clock/
        // progress) sit on top of, so the whole HUD strip reads as one
        // physical piece of arcade hardware bolted to the top of the
        // screen instead of three separate floating widgets. Purely a
        // background layer, added purely via DOM paint order (appended
        // first, so everything else naturally draws on top) -- none of
        // the three sections' own math, content, or positioning below
        // changes at all.
        // ------------------------------------------------------------
        const hudPanel = document.createElement("div");
        hudPanel.style.position = "absolute";
        hudPanel.style.top = "0";
        hudPanel.style.left = "0";
        hudPanel.style.width = "100%";
        hudPanel.style.height = "clamp(68px, 18vw, 92px)";
        hudPanel.style.background = "linear-gradient(#332f2c, #181615 55%, #0c0b0a)";
        hudPanel.style.borderBottom = "3px solid #6b4a1f"; // thicker gold hairline trim
        hudPanel.style.boxShadow = "inset 0 -3px 0 rgba(255,255,255,0.05), inset 0 3px 0 rgba(255,255,255,0.07), inset 0 0 0 3px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.55), 0 3px 0 #0a0a0a";
        hudPanel.style.pointerEvents = "none";
        container.appendChild(hudPanel);

        // Small "rivets" at the outer corners AND at the two internal
        // section boundaries (roughly where LIVES meets the clock, and
        // where the clock meets PROGRESS) -- purely decorative, matching
        // the reference's hardware-bolt look without adding a full
        // separate panel background per section (which risked fighting
        // the three sections' own existing clamp()-based positioning).
        ["6px", "33%", "67%", "calc(100% - 11px)"].forEach(function (leftPos) {
            const screw = document.createElement("div");
            screw.style.position = "absolute";
            screw.style.left = leftPos;
            screw.style.top = "6px";
            screw.style.width = "5px";
            screw.style.height = "5px";
            screw.style.borderRadius = "50%";
            screw.style.background = "radial-gradient(circle at 35% 35%, #6a6a6a, #1a1a1a 70%)";
            screw.style.boxShadow = "0 0.5px 0.5px rgba(255,255,255,0.15)";
            hudPanel.appendChild(screw);
        });

        // LEFT -- LIVES. Hearts math/opacity-flash logic is completely
        // unchanged (see updateHud) -- only the housing changed: a
        // recessed sub-panel with its own bevel, plus a small "LIVES"
        // caption underneath, matching the reference. livesHeartsEl is a
        // separate child so updateHud rewriting the hearts each frame
        // never wipes the caption. min-width is a PROTECTED reservation
        // -- the center clock module is explicitly capped (see
        // clockDisplay.style.maxWidth below) so it can never grow into
        // this space, no matter how long the digit string gets.
        livesDisplay = document.createElement("div");
        livesDisplay.style.position = "absolute";
        livesDisplay.style.top = "10px";
        livesDisplay.style.left = "10px";
        livesDisplay.style.display = "flex";
        livesDisplay.style.flexDirection = "column";
        livesDisplay.style.alignItems = "center";
        livesDisplay.style.minWidth = "clamp(88px, 24vw, 108px)";
        livesDisplay.style.padding = "8px 12px 6px";
        livesDisplay.style.boxSizing = "border-box";
        livesDisplay.style.borderRadius = "8px";
        livesDisplay.style.background = "linear-gradient(#242021, #121010)";
        livesDisplay.style.border = "3px solid #3a3634";
        livesDisplay.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.06), inset 0 0 0 1px #0a0a0a";
        livesDisplay.style.pointerEvents = "none";
        container.appendChild(livesDisplay);

        livesHeartsEl = document.createElement("div");
        livesHeartsEl.style.color = "#ff3b30";
        livesHeartsEl.style.font = "bold clamp(16px, 4.6vw, 23px) monospace";
        livesHeartsEl.style.letterSpacing = "2px";
        livesHeartsEl.style.textShadow = "0 0 6px rgba(255,59,48,0.55)";
        livesHeartsEl.style.whiteSpace = "nowrap";
        livesDisplay.appendChild(livesHeartsEl);

        const livesLabelEl = document.createElement("div");
        livesLabelEl.textContent = "LIVES";
        livesLabelEl.style.font = "bold clamp(8px, 2.3vw, 11px) sans-serif";
        livesLabelEl.style.color = "#e8a33d";
        livesLabelEl.style.letterSpacing = "1.5px";
        livesLabelEl.style.marginTop = "2px";
        livesLabelEl.style.whiteSpace = "nowrap";
        livesDisplay.appendChild(livesLabelEl);

        // Center: "TIME LEFT ON EARTH" fictional story clock, styled like
        // an old black-plastic digital alarm clock -- dark housing, green
        // LED/VFD-style digits, small caption underneath. See
        // updateFictionalClock/formatFictionalClockParts for the actual
        // (purely visual, no gameplay authority) clock logic; this block
        // is presentation only. maxWidth is the hard collision guard
        // against LIVES/PROGRESS -- reserves roughly their combined
        // footprint on each side so the clock module can genuinely never
        // grow into either, regardless of viewport width or how many
        // digits are showing.
        clockDisplay = document.createElement("div");
        clockDisplay.style.position = "absolute";
        clockDisplay.style.top = "10px";
        clockDisplay.style.left = "50%";
        clockDisplay.style.transform = "translateX(-50%)";
        clockDisplay.style.display = "flex";
        clockDisplay.style.flexDirection = "column";
        clockDisplay.style.alignItems = "center";
        clockDisplay.style.maxWidth = "calc(100% - 228px)";
        clockDisplay.style.padding = "7px 16px 9px";
        clockDisplay.style.boxSizing = "border-box";
        clockDisplay.style.borderRadius = "9px";
        clockDisplay.style.background = "linear-gradient(#1c1a1a, #0a0909)";
        clockDisplay.style.border = "4px solid #3a3634";
        clockDisplay.style.boxShadow = "inset 0 0 6px rgba(0,0,0,0.75), inset 0 2px 0 rgba(255,255,255,0.06), inset 0 0 0 1px #0a0a0a";
        clockDisplay.style.pointerEvents = "none";
        container.appendChild(clockDisplay);

        // Split digit row: dominant "HH:MM" + a much smaller trailing
        // ":SS". The constantly-ticking seconds no longer dominate the
        // display or the module's own width -- see
        // formatFictionalClockParts/updateHud.
        countdownDigitsEl = document.createElement("div");
        countdownDigitsEl.style.display = "flex";
        countdownDigitsEl.style.alignItems = "baseline";
        countdownDigitsEl.style.whiteSpace = "nowrap";
        clockDisplay.appendChild(countdownDigitsEl);

        countdownMainEl = document.createElement("span");
        countdownMainEl.style.font = "bold clamp(21px, 6.8vw, 31px) 'Courier New', monospace";
        countdownMainEl.style.letterSpacing = "1px";
        countdownMainEl.style.lineHeight = "1";
        countdownDigitsEl.appendChild(countdownMainEl);
        setClockVisualState(clockVisualState); // applies color/glow/animation to countdownMainEl for the current state (normal, by default) now that it exists

        countdownSecEl = document.createElement("span");
        // ~30% of the main digit height, per spec -- deliberately NOT
        // run through setClockVisualState/CLOCK_VISUAL_STATES: seconds
        // stay a plain warm-white regardless of clock state, so they
        // never compete with the state color for attention either.
        countdownSecEl.style.font = "bold clamp(7px, 2.2vw, 10px) 'Courier New', monospace";
        countdownSecEl.style.color = "#f0e6d2";
        countdownSecEl.style.marginLeft = "3px";
        countdownSecEl.style.lineHeight = "1";
        countdownDigitsEl.appendChild(countdownSecEl);

        countdownCaptionEl = document.createElement("div");
        countdownCaptionEl.textContent = "TIME LEFT ON EARTH";
        countdownCaptionEl.style.font = "bold clamp(7px, 2vw, 9px) sans-serif";
        countdownCaptionEl.style.color = "#e8a33d";
        countdownCaptionEl.style.letterSpacing = "1px";
        countdownCaptionEl.style.marginTop = "2px";
        countdownCaptionEl.style.whiteSpace = "nowrap";
        clockDisplay.appendChild(countdownCaptionEl);

        // RIGHT -- PROGRESS. Same computeLevelProgress() value as before
        // (see updateHud) -- only the presentation changed, from a smooth
        // fill bar to a segmented arcade-meter (a fixed row of blocks,
        // lit up left-to-right as the fraction rises), matching the
        // reference. The underlying percentage is identical either way;
        // this only changes how many of the fixed segments currently
        // read as "lit."
        const progressWrap = document.createElement("div");
        progressWrap.style.position = "absolute";
        progressWrap.style.top = "12px";
        progressWrap.style.right = "12px";
        progressWrap.style.display = "flex";
        progressWrap.style.flexDirection = "column";
        progressWrap.style.alignItems = "flex-end";
        progressWrap.style.pointerEvents = "none";
        container.appendChild(progressWrap);

        progressLabelEl = document.createElement("div");
        progressLabelEl.textContent = "PROGRESS";
        progressLabelEl.style.font = "bold clamp(8px, 2.3vw, 10px) sans-serif";
        progressLabelEl.style.color = "#e8a33d";
        progressLabelEl.style.letterSpacing = "1px";
        progressLabelEl.style.marginBottom = "4px";
        progressLabelEl.style.whiteSpace = "nowrap";
        progressWrap.appendChild(progressLabelEl);

        const progressTrack = document.createElement("div");
        progressTrack.style.display = "flex";
        progressTrack.style.gap = "3px";
        progressTrack.style.width = "clamp(84px, 24vw, 124px)";
        progressTrack.style.height = "22px";
        progressTrack.style.padding = "3px";
        progressTrack.style.boxSizing = "border-box";
        progressTrack.style.borderRadius = "6px";
        progressTrack.style.background = "linear-gradient(#1c1a1a, #0a0909)";
        progressTrack.style.border = "3px solid #3a3634";
        progressTrack.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.7), inset 0 0 0 1px #0a0a0a";
        progressWrap.appendChild(progressTrack);

        const PROGRESS_SEGMENT_COUNT = 9;
        progressSegmentEls = [];
        for (let i = 0; i < PROGRESS_SEGMENT_COUNT; i++) {
            const segment = document.createElement("div");
            segment.style.flex = "1";
            segment.style.height = "100%";
            segment.style.borderRadius = "1px";
            segment.style.background = "#241f1d"; // unlit -- updateHud lights it up left-to-right as progress rises
            progressTrack.appendChild(segment);
            progressSegmentEls.push(segment);
        }

        // One-shot CSS animations for the button (a comic "pop" on ENTER/
        // CONTINUE, a smaller "snap" on START->FASTER, on every FASTER
        // speed-level bump, and reused for the periodic chevron bump --
        // see updateChevronBump -- and the WHOOSH fade-away burst on a
        // successful FASTER double-press dash), plus the clock-state and
        // chevron-chase keyframes below. Injected once per buildDom() as
        // a child of `container`, so it's wiped and recreated cleanly by
        // container.innerHTML="" on every start()/retry() -- never
        // accumulates across replays. (The old hgFlameFlicker keyframe
        // that used to live here was removed along with the static flame
        // shapes it drove -- see spawnFireParticle/
        // updateActionButtonFireParticles for the real particle system
        // that replaced them.)
        const buttonAnimStyle = document.createElement("style");
        buttonAnimStyle.textContent =
            // These three now animate actionButtonHousing (centered via
            // translate(-50%, -50%), not actionButton's old
            // translateX(-50%)-only positioning) -- see
            // updateActionButtonHud/updateChevronBump/bumpFasterSpeedLevel.
            "@keyframes hgButtonPop {" +
            "0% { transform: translate(-50%, -50%) scale(1); }" +
            "40% { transform: translate(-50%, -50%) scale(1.16); }" +
            "70% { transform: translate(-50%, -50%) scale(0.96); }" +
            "100% { transform: translate(-50%, -50%) scale(1); } }" +
            "@keyframes hgButtonPopBig {" +
            "0% { transform: translate(-50%, -50%) scale(1); }" +
            "40% { transform: translate(-50%, -50%) scale(1.3); }" +
            "70% { transform: translate(-50%, -50%) scale(0.9); }" +
            "100% { transform: translate(-50%, -50%) scale(1); } }" +
            "@keyframes hgButtonSnap {" +
            "0% { transform: translate(-50%, -50%) scale(1); }" +
            "50% { transform: translate(-50%, -50%) scale(1.08); }" +
            "100% { transform: translate(-50%, -50%) scale(1); } }" +
            "@keyframes hgWhooshFade {" +
            "0% { opacity: 1; transform: translate(-50%, 0); }" +
            "100% { opacity: 0; transform: translate(-50%, -16px); } }" +
            // CLOCK VISUAL-STATE keyframes -- see CLOCK_VISUAL_STATES/
            // setClockVisualState. Unused (clock stays "normal" this
            // pass, animation:none) until a later pass calls
            // setClockVisualState with one of these names.
            "@keyframes hgClockPulse {" +
            "0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }" +
            "@keyframes hgClockFlicker {" +
            "0%, 92%, 100% { opacity: 1; } 94% { opacity: 0.3; } 96% { opacity: 1; } 98% { opacity: 0.5; } }" +
            "@keyframes hgClockCriticalPulse {" +
            "0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.04); } }" +
            // Shared chase animation for the 3 doorway chevrons -- see
            // buildDom's chevron creation block. Each of the 3 chevrons
            // uses this SAME keyframe at a staggered animation-delay
            // (1/3 cycle apart), which is what makes them brighten/rise
            // in sequence bottom->middle->top rather than all together.
            "@keyframes hgChevronChase {" +
            "0% { opacity: 0.25; transform: translateX(-50%) translateY(4px); }" +
            "30% { opacity: 1; transform: translateX(-50%) translateY(0px); }" +
            "60% { opacity: 1; transform: translateX(-50%) translateY(-2px); }" +
            "100% { opacity: 0.15; transform: translateX(-50%) translateY(-7px); } }" +
            // Gentle idle "looks pressable" breathing for the PLAY
            // triangle and the FASTER lightning bolt -- opacity/scale
            // only, small enough it never reads as jittery. Chevrons
            // already have their own chase animation and don't need this.
            "@keyframes hgSymbolIdlePulse {" +
            "0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }" +
            "50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); } }";
        container.appendChild(buttonAnimStyle);

        // The one permanent control -- now a compact "controller button"
        // instead of a labeled UI button: a small black arcade housing
        // holding just a symbol, sitting inside a LARGER invisible tap
        // target (actionButton itself) so the visible control can shrink
        // without shrinking the actual touchable area. PRESS = GO
        // (context-sensitive: START / FASTER / ENTER / CONTINUE
        // depending on state; disabled and inert while IN MEETING or
        // during an automatic transition), DOUBLE PRESS = ACTION (dash/
        // hustle, unchanged, only while the control is in its FASTER/
        // lightning-bolt state). State (symbol + visual + animation) is
        // fully centralized in getActionButtonState()/updateActionButtonHud()
        // below -- see that comment block for the full state table.
        //
        // actionButton (this element): position, size, and touch
        // handling ONLY -- deliberately larger than the visible housing
        // for a comfortable phone tap target, and never itself carries a
        // border/background/glow. All of that lives on actionButtonHousing.
        actionButton = document.createElement("div");
        actionButton.style.position = "absolute";
        actionButton.style.left = "50%";
        actionButton.style.bottom = "14px";
        actionButton.style.transform = "translateX(-50%)";
        actionButton.style.width = "clamp(64px, 17vw, 76px)";
        actionButton.style.height = "clamp(64px, 17vw, 76px)";
        actionButton.style.touchAction = "none";
        actionButton.style.userSelect = "none";
        actionButton.style.webkitUserSelect = "none";
        container.appendChild(actionButton);

        // actionButtonHousing: the actual VISIBLE compact arcade
        // housing -- black/metal, beveled, a few hardware rivets,
        // centered inside the larger invisible tap target above. This is
        // what applyActionButtonVisualState/updateActionButtonFireVisual/
        // setActionButtonPressed/bumpFasterSpeedLevel/updateChevronBump
        // all style (border, background, boxShadow, press-transform,
        // pop-animations) -- actionButton itself is never touched by any
        // of that.
        actionButtonHousing = document.createElement("div");
        actionButtonHousing.style.position = "absolute";
        actionButtonHousing.style.left = "50%";
        actionButtonHousing.style.top = "50%";
        actionButtonHousing.style.transform = "translate(-50%, -50%)";
        actionButtonHousing.style.width = "56px";
        actionButtonHousing.style.height = "56px";
        actionButtonHousing.style.boxSizing = "border-box";
        actionButtonHousing.style.borderRadius = "10px 14px 11px 15px"; // slightly uneven -- reads as hand-cut, not a clean UI rect
        actionButtonHousing.style.pointerEvents = "none"; // actionButton (larger, behind it in z-order via DOM position) owns all touch handling
        actionButton.appendChild(actionButtonHousing);

        // Corner "rivets," matching the top HUD panel's hardware
        // language -- scaled down for the now-compact housing. Purely
        // decorative, pointer-events:none (inherited).
        [["2px", "2px"], ["calc(100% - 6px)", "2px"], ["2px", "calc(100% - 6px)"], ["calc(100% - 6px)", "calc(100% - 6px)"]].forEach(function (pos) {
            const rivet = document.createElement("div");
            rivet.style.position = "absolute";
            rivet.style.left = pos[0];
            rivet.style.top = pos[1];
            rivet.style.width = "4px";
            rivet.style.height = "4px";
            rivet.style.borderRadius = "50%";
            rivet.style.background = "radial-gradient(circle at 35% 35%, #6a6a6a, #1a1a1a 70%)";
            rivet.style.boxShadow = "0 0.5px 0.5px rgba(255,255,255,0.15)";
            actionButtonHousing.appendChild(rivet);
        });

        // PLAY (START state) -- a solid CSS triangle (border trick, not
        // an emoji glyph), large enough to dominate the compact housing.
        // Shown/hidden per state in applyActionButtonVisualState.
        actionButtonPlayEl = document.createElement("div");
        actionButtonPlayEl.style.position = "absolute";
        actionButtonPlayEl.style.left = "58%";
        actionButtonPlayEl.style.top = "50%";
        actionButtonPlayEl.style.transform = "translate(-50%, -50%)";
        actionButtonPlayEl.style.width = "0";
        actionButtonPlayEl.style.height = "0";
        actionButtonPlayEl.style.borderTop = "14px solid transparent";
        actionButtonPlayEl.style.borderBottom = "14px solid transparent";
        actionButtonPlayEl.style.borderLeft = "22px solid #39ff14";
        actionButtonPlayEl.style.filter = "drop-shadow(0 0 6px rgba(57,255,20,0.75))";
        actionButtonPlayEl.style.animation = "hgSymbolIdlePulse 1.8s ease-in-out infinite";
        actionButtonPlayEl.style.display = "none"; // toggled by applyActionButtonVisualState
        actionButtonHousing.appendChild(actionButtonPlayEl);

        // FASTER -- a lightning-bolt shape built from clip-path (not an
        // emoji glyph either), same idea: dominate the housing, subtle
        // idle pulse. Its fill color is updated by updateActionButtonFireVisual
        // (green -> hotter yellow/white as fasterSpeedLevel rises) --
        // see that function -- exactly the same color ramp the old text
        // glow used to follow.
        actionButtonBoltEl = document.createElement("div");
        actionButtonBoltEl.style.position = "absolute";
        actionButtonBoltEl.style.left = "50%";
        actionButtonBoltEl.style.top = "50%";
        actionButtonBoltEl.style.transform = "translate(-50%, -50%)";
        actionButtonBoltEl.style.width = "26px";
        actionButtonBoltEl.style.height = "38px";
        actionButtonBoltEl.style.background = "#39ff14";
        actionButtonBoltEl.style.clipPath = "polygon(58% 0%, 8% 58%, 42% 58%, 32% 100%, 92% 38%, 52% 38%)";
        actionButtonBoltEl.style.filter = "drop-shadow(0 0 6px rgba(57,255,20,0.75))";
        actionButtonBoltEl.style.animation = "hgSymbolIdlePulse 1.8s ease-in-out infinite";
        actionButtonBoltEl.style.display = "none"; // toggled by applyActionButtonVisualState
        actionButtonHousing.appendChild(actionButtonBoltEl);

        // ANIMATED CHEVRON DOORWAY CONTROL -- shown ONLY while
        // getActionButtonState() === BUTTON_STATE.ENTER. A recessed
        // "screen" panel (dark fill, glowing green border) housing three
        // stacked CSS-triangle chevrons -- sized to fill most of the
        // compact housing -- that share one "chase" keyframe
        // (hgChevronChase, staggered by 1/3 cycle each) so energy reads
        // as continuously pushing upward through the stack toward the
        // doorway. This is now the ONLY visual doorway cue anywhere (the
        // old floating arrow and the yellow doorway highlight were both
        // removed -- see drawBuilding/renderOutdoorScene). Purely
        // presentational either way -- enterMeeting()/doorway trigger
        // logic are completely untouched.
        actionButtonChevronWrap = document.createElement("div");
        actionButtonChevronWrap.style.position = "absolute";
        actionButtonChevronWrap.style.left = "50%";
        actionButtonChevronWrap.style.top = "50%";
        actionButtonChevronWrap.style.transform = "translate(-50%, -50%)";
        actionButtonChevronWrap.style.width = "44px";
        actionButtonChevronWrap.style.height = "46px";
        actionButtonChevronWrap.style.boxSizing = "border-box";
        actionButtonChevronWrap.style.borderRadius = "6px";
        actionButtonChevronWrap.style.background = "radial-gradient(circle at 50% 40%, #0f2a0f, #081208)";
        actionButtonChevronWrap.style.border = "2px solid #39ff14";
        actionButtonChevronWrap.style.boxShadow = "0 0 10px rgba(57,255,20,0.6), inset 0 0 6px rgba(0,0,0,0.6)";
        actionButtonChevronWrap.style.display = "none"; // toggled by applyActionButtonVisualState
        actionButtonHousing.appendChild(actionButtonChevronWrap);

        actionButtonChevronEls = [];
        [30, 15, 1].forEach(function (bottomPx, i) { // bottom, middle, top chevron
            const chevron = document.createElement("div");
            chevron.style.position = "absolute";
            chevron.style.left = "50%";
            chevron.style.bottom = bottomPx + "px";
            chevron.style.width = "0";
            chevron.style.height = "0";
            chevron.style.borderLeft = "10px solid transparent";
            chevron.style.borderRight = "10px solid transparent";
            chevron.style.borderBottom = "13px solid #39ff14";
            chevron.style.filter = "drop-shadow(0 0 4px rgba(57,255,20,0.9))";
            chevron.style.transform = "translateX(-50%)";
            chevron.style.animation = "hgChevronChase " + CONFIG.chevronChaseCycleSeconds + "s ease-in-out infinite";
            chevron.style.animationDelay = (i * (CONFIG.chevronChaseCycleSeconds / 3)) + "s";
            actionButtonChevronWrap.appendChild(chevron);
            actionButtonChevronEls.push(chevron);
        });

        // "» CHAPTER 2 »" CONTROL -- shown ONLY for BUTTON_STATE.CONTINUE,
        // once Level 1 (through CMA) is actually finished. Real CSS
        // chevrons (a rotated border-corner, same "no image/glyph"
        // philosophy as the PLAY triangle/FASTER bolt above -- NOT the
        // keyboard ">" character) flank a Courier-New digital-HUD label,
        // matching the countdown clock's font so it reads as the same
        // 1980s-arcade instrument panel rather than a generic web button.
        // actionButton/actionButtonHousing are both widened specifically
        // for this state (see applyActionButtonVisualState) since the
        // compact 56px square used by every other state has no room for
        // the label -- everything else about the housing (position,
        // rivets, bevel, press feedback) is unchanged.
        actionButtonChapter2Wrap = document.createElement("div");
        actionButtonChapter2Wrap.style.position = "absolute";
        actionButtonChapter2Wrap.style.left = "50%";
        actionButtonChapter2Wrap.style.top = "50%";
        actionButtonChapter2Wrap.style.transform = "translate(-50%, -50%)";
        actionButtonChapter2Wrap.style.display = "none"; // toggled by applyActionButtonVisualState
        actionButtonChapter2Wrap.style.alignItems = "center";
        actionButtonChapter2Wrap.style.justifyContent = "center";
        actionButtonChapter2Wrap.style.gap = "10px";
        actionButtonChapter2Wrap.style.whiteSpace = "nowrap";
        actionButtonHousing.appendChild(actionButtonChapter2Wrap);

        function buildChapter2Triangle(direction) {
            // Solid filled triangle -- "play/skip"-style arrow, same
            // border-trick shape language as the START button's PLAY
            // triangle elsewhere in this file, not a font glyph. Points
            // INWARD toward the CHAPTER 2 label: the left-side triangle
            // points right (▶), the right-side triangle points left (◀).
            // Same neon-green + drop-shadow-glow language as every other
            // active-state icon (PLAY triangle, FASTER bolt, ENTER
            // chevrons) so this reads as part of the same instrument-
            // panel family, just swapped from the old double-chevron
            // mark to a single bold retro arcade arrow.
            const tri = document.createElement("div");
            tri.style.width = "0";
            tri.style.height = "0";
            tri.style.borderTop = "9px solid transparent";
            tri.style.borderBottom = "9px solid transparent";
            if (direction === "right") {
                tri.style.borderLeft = "14px solid #39ff14";
            } else {
                tri.style.borderRight = "14px solid #39ff14";
            }
            tri.style.filter = "drop-shadow(0 0 4px rgba(57,255,20,0.9))";
            // Subtle pulse -- same idle-pulse timing already used for
            // every other button-family icon, just reused here.
            tri.style.animation = "hgSymbolIdlePulse 1.8s ease-in-out infinite";
            return tri;
        }

        const chapter2Label = document.createElement("div");
        chapter2Label.textContent = "CHAPTER 2";
        chapter2Label.style.font = "bold 17px 'Courier New', monospace"; // matches the HUD countdown clock's digital-LED font
        chapter2Label.style.color = "#39ff14";
        chapter2Label.style.letterSpacing = "2px";
        chapter2Label.style.textShadow = "0 0 6px rgba(57,255,20,0.85), 0 0 14px rgba(57,255,20,0.5)";

        actionButtonChapter2Wrap.appendChild(buildChapter2Triangle("right"));
        actionButtonChapter2Wrap.appendChild(chapter2Label);
        actionButtonChapter2Wrap.appendChild(buildChapter2Triangle("left"));

        // REAL PARTICLE FIRE (FASTER state) -- just an empty positioned
        // container here; actual particle divs are created/destroyed
        // dynamically by spawnFireParticle/updateActionButtonFireParticles
        // as fasterSpeedLevel changes, never a fixed set of shapes. See
        // those functions for the organic rise/drift/shrink/fade
        // behavior. Now a child of the compact HOUSING (not the larger
        // invisible tap target) so particles originate from the visible
        // control's actual edges regardless of how much bigger the tap
        // target is. overflow:visible + tall parent-independent particle
        // positioning still lets flames rise well above the housing at
        // max level without being clipped.
        actionButtonFireContainer = document.createElement("div");
        actionButtonFireContainer.style.position = "absolute";
        actionButtonFireContainer.style.left = "0";
        actionButtonFireContainer.style.bottom = "0";
        actionButtonFireContainer.style.width = "100%";
        actionButtonFireContainer.style.height = "1px"; // particles themselves are absolutely positioned within this; height only matters as an overflow-visible anchor
        actionButtonFireContainer.style.overflow = "visible";
        actionButtonFireContainer.style.pointerEvents = "none";
        actionButtonHousing.appendChild(actionButtonFireContainer);
        fireParticles = [];
        fireSpawnTimer = 0;

        // Apply correct visual state immediately (state is always
        // WAITING_TO_START here) rather than leaving the button unstyled
        // for a frame until updateHud() first runs. Also resets
        // lastActionButtonState so THIS build's first real updateHud()
        // call correctly sees "no change yet" and doesn't fire a spurious
        // pop animation on load -- important on retryLevel(), which
        // rebuilds these elements from scratch but doesn't otherwise touch
        // that module-level variable.
        lastActionButtonState = BUTTON_STATE.START;
        applyActionButtonVisualState(BUTTON_STATE.START);

        // Tiny comic action-effect burst on a successful FASTER press
        // (see playActionButtonWhoosh) -- NOT dialogue, not a speech
        // bubble, just a one-shot label that fades/slides away over
        // CONFIG.actionButtonWhooshDuration. Sits just above the button,
        // starts invisible.
        actionButtonWhooshEl = document.createElement("div");
        actionButtonWhooshEl.textContent = "WHOOSH!";
        actionButtonWhooshEl.style.position = "absolute";
        actionButtonWhooshEl.style.left = "50%";
        actionButtonWhooshEl.style.bottom = "98px";
        actionButtonWhooshEl.style.transform = "translate(-50%, 0)";
        actionButtonWhooshEl.style.font = "bold 15px 'Comic Sans MS', 'Trebuchet MS', sans-serif";
        actionButtonWhooshEl.style.color = "#39ff14";
        actionButtonWhooshEl.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";
        actionButtonWhooshEl.style.letterSpacing = "1px";
        actionButtonWhooshEl.style.opacity = "0";
        actionButtonWhooshEl.style.pointerEvents = "none";
        container.appendChild(actionButtonWhooshEl);

        // Small instruction that sits above the button until the player's
        // first press, then disappears for good.
        startPrompt = document.createElement("div");
        startPrompt.textContent = "PRESS TO START";
        startPrompt.style.position = "absolute";
        startPrompt.style.left = "50%";
        startPrompt.style.bottom = "118px";
        startPrompt.style.transform = "translateX(-50%)";
        startPrompt.style.padding = "5px 12px";
        startPrompt.style.borderRadius = "14px";
        startPrompt.style.background = "rgba(0,0,0,0.45)";
        startPrompt.style.color = "#fff";
        startPrompt.style.font = "12px sans-serif";
        startPrompt.style.letterSpacing = "1px";
        startPrompt.style.whiteSpace = "nowrap";
        startPrompt.style.pointerEvents = "none";
        container.appendChild(startPrompt);

        // Temporary development-only "out of lives" screen. Hidden until
        // triggerOutOfLives() shows it; centralized here so the eventual
        // real game-over presentation only needs to replace this block.
        retryOverlay = document.createElement("div");
        retryOverlay.style.position = "absolute";
        retryOverlay.style.top = "0";
        retryOverlay.style.left = "0";
        retryOverlay.style.width = "100%";
        retryOverlay.style.height = "100%";
        retryOverlay.style.display = "none";
        retryOverlay.style.flexDirection = "column";
        retryOverlay.style.alignItems = "center";
        retryOverlay.style.justifyContent = "center";
        retryOverlay.style.background = "rgba(0,0,0,0.75)";
        retryOverlay.style.zIndex = "10";

        const retryLabel = document.createElement("div");
        retryLabel.textContent = "OUT OF LIVES";
        retryLabel.style.color = "#ded0ae";
        retryLabel.style.font = "bold 20px sans-serif";
        retryLabel.style.letterSpacing = "3px";
        retryLabel.style.marginBottom = "18px";
        retryOverlay.appendChild(retryLabel);

        retryButton = document.createElement("div");
        retryButton.textContent = "RETRY LEVEL";
        retryButton.style.padding = "12px 22px";
        retryButton.style.borderRadius = "10px";
        retryButton.style.border = "2px solid #ded0ae";
        retryButton.style.background = "#1c1712";
        retryButton.style.color = "#ded0ae";
        retryButton.style.font = "bold 15px sans-serif";
        retryButton.style.letterSpacing = "2px";
        retryButton.style.cursor = "pointer";
        retryButton.style.touchAction = "none";
        retryButton.style.userSelect = "none";
        retryButton.style.webkitUserSelect = "none";
        retryOverlay.appendChild(retryButton);

        container.appendChild(retryOverlay);

        // ------------------------------------------------------------
        // DEBUG: anchor-jump toggle. HIDDEN by default (display:none) --
        // press Ctrl+D / Cmd+D anywhere in the game to reveal it (see the
        // keydown listener in attachInput), then tap it to actually turn
        // window.DEBUG_ANCHOR on/off. Tucked in the bottom-right corner
        // when visible, well clear of the centered action button and the
        // top HUD.
        // ------------------------------------------------------------
        debugAnchorButton = document.createElement("div");
        debugAnchorButton.style.position = "absolute";
        debugAnchorButton.style.right = "10px";
        debugAnchorButton.style.bottom = "10px";
        debugAnchorButton.style.padding = "6px 10px";
        debugAnchorButton.style.borderRadius = "8px";
        debugAnchorButton.style.border = "1px solid rgba(255,255,255,0.4)";
        debugAnchorButton.style.font = "bold 11px sans-serif";
        debugAnchorButton.style.letterSpacing = "1px";
        debugAnchorButton.style.cursor = "pointer";
        debugAnchorButton.style.touchAction = "none";
        debugAnchorButton.style.userSelect = "none";
        debugAnchorButton.style.webkitUserSelect = "none";
        debugAnchorButton.style.zIndex = "20";
        debugAnchorButton.style.display = "none"; // revealed only via the Ctrl+D hotkey
        container.appendChild(debugAnchorButton);
        updateDebugAnchorButtonVisual();

        // ------------------------------------------------------------
        // SUBTLE RETRO SCREEN TREATMENT -- extremely light scanlines +
        // a soft edge vignette, meant to be felt more than consciously
        // noticed. Pure CSS, one static layer (no per-frame cost), sits
        // above everything (including the HUD panel) but is deliberately
        // faint enough that it never fights the artwork or HUD
        // readability. z-index 5 keeps it below the debug button (20)
        // and the out-of-lives overlay (10).
        // ------------------------------------------------------------
        const crtOverlay = document.createElement("div");
        crtOverlay.style.position = "absolute";
        crtOverlay.style.top = "0";
        crtOverlay.style.left = "0";
        crtOverlay.style.width = "100%";
        crtOverlay.style.height = "100%";
        crtOverlay.style.pointerEvents = "none";
        crtOverlay.style.zIndex = "5";
        crtOverlay.style.mixBlendMode = "multiply"; // darkens slightly rather than flattening the art's own colors
        crtOverlay.style.background =
            "repeating-linear-gradient(rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0) 4px)," +
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.15) 100%)";
        container.appendChild(crtOverlay);

        if (getComputedStyle(container).position === "static") {
            container.style.position = "relative";
        }
        container.style.overflow = "hidden";
    }

    // Reflects window.DEBUG_ANCHOR's current on/off state on the button
    // itself, so it's obvious at a glance whether it's active -- called
    // once when the button is built and again every time it's tapped.
    function updateDebugAnchorButtonVisual() {
        if (!debugAnchorButton) return;
        const on = typeof window !== "undefined" && !!window.DEBUG_ANCHOR;
        debugAnchorButton.textContent = on ? "ANCHOR DEBUG: ON" : "ANCHOR DEBUG";
        debugAnchorButton.style.background = on ? "#c0392b" : "rgba(0,0,0,0.45)";
        debugAnchorButton.style.color = on ? "#fff" : "rgba(255,255,255,0.75)";
    }

    function onDebugAnchorButtonPointerDown(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window === "undefined") return;
        window.DEBUG_ANCHOR = !window.DEBUG_ANCHOR;
        updateDebugAnchorButtonVisual();
        console.log("[ANCHOR DEBUG] " + (window.DEBUG_ANCHOR ? "ON -- watch the console for jump warnings, and look for the magenta guide line under each character." : "OFF"));
    }

    // Ctrl+D / Cmd+D reveals (or re-hides) the debug button itself --
    // this does NOT turn tracking on, just makes the button visible/
    // tappable, so accidentally hitting this combo never starts logging
    // on its own. preventDefault stops the browser's own "bookmark this
    // page" shortcut from firing.
    function onDebugHotkeyDown(e) {
        const key = (e.key || "").toLowerCase();
        if (key !== "d" || !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        if (!debugAnchorButton) return;
        const nowVisible = debugAnchorButton.style.display === "none";
        debugAnchorButton.style.display = nowVisible ? "block" : "none";
        console.log("[ANCHOR DEBUG] button " + (nowVisible ? "shown" : "hidden") + " (Ctrl+D/Cmd+D to toggle)");
    }

    function resetRuntimeState() {
        state = STATE.WAITING_TO_START;
        meetingIndex = 0;
        exitedMeetingIndex = null;

        distanceTraveled = 0;
        worldScrollDistance = 0;
        currentSpeed = 0;
        fasterSpeedLevel = 0;

        dashTimeRemaining = 0;
        dashCooldownRemaining = 0;
        stumbleTimeRemaining = 0;
        jumpTimeRemaining = 0;
        smashTimeRemaining = 0;
        kickTimeRemaining = 0;
        impactEffects = [];

        lives = CONFIG.lives;
        livesFlashTimer = 0;

        follower = {
            offset: CONFIG.followerDistance,
            state: FOLLOWER_STATE.FOLLOWING,
            waitTimer: 0,
            driftPhase: Math.random() * Math.PI * 2
        };

        doorwayWaitTimer = 0;
        hasLearnedDoorway = false;
        changingStorePhase = null;
        changingStoreTimer = 0;
        changingStoreCompleted = false;
        currentGameplayTrack = "beforeFreshThreads";
        freshThreadsHalfwaySwapped = false;
        dryClubPhase = null;
        dryClubCompleted = false;
        crowdBubblePresetIndex = 0;
        billAppearance = "normal";
        bobAppearance = "normal";
        billAnimElapsed = 0;
        billIdleNextBlipAt = null;
        billIdleBlipEndAt = null;
        billIdleBlipCol = null;
        billDoorwaySequenceStartAt = null;
        billWasInDoorwayState = false;
        billFlossCyclePrevActive = false;
        billFlossCycleStartAt = null;
        doorwayDustPuffs = [];
        doorwayDustSpawnTimer = 0;
        skidDustPuffs = [];
        prevOutdoorSpeedForSkid = 0;
        runningDustPuffs = [];
        runningDustSpawnTimer = { bill: 0, bob: 0 };
        skrrrtEffect = null;
        cameraBumpTimer = 0;
        setClockVisualState(CONFIG.clockVisualStateDefault);
        activeInteriorConfig = null;
        fadingWorldBubble = null;
        fireParticles = [];
        fireSpawnTimer = 0;
        bobAnimElapsed = 0;
        bobIdleNextBlipAt = null;
        bobIdleBlipEndAt = null;
        bobDoorwaySequenceStartAt = null;
        bobWasInDoorwayState = false;
        transitionTimer = 0;
        transitionPhase = null;
        finishTimer = 0;

        insideElapsed = 0;
        insideFadeTimer = 0;
        leaveFadeTimer = 0;
        exitMeetingTimer = 0;

        billInteriorFrac = 0;
        bobInteriorFrac = 0;
        interiorCameraFrac = 0;
        interiorSequence = [];
        interiorStepIndex = 0;
        interiorStepTimer = 0;
        billInteriorWalking = false;
        bobInteriorWalking = false;
        billInteriorMoveDir = 1;
        billInteriorTurning = false;
        bobInteriorMoveDir = 1;
        bobInteriorTurning = false;
        bobInteriorTurnTimer = 0;
        billFacingLeft = false;
        bobFacingLeft = false;

        clockMinutes = parseStoryTime(STORY_TIMES.levelStart);

        // Fictional HUD story clock -- anchor to script.js's "clock:" value
        // for the opening outdoor section if one is set, else the default
        // 24:00:00. Purely cosmetic; see CONFIG.storyClockDefaultSeconds.
        const openingClock = getScriptClockSeconds("Outside-level1");
        storyClockSecondsRemaining = (typeof openingClock === "number") ? openingClock : CONFIG.storyClockDefaultSeconds;

        loadObstaclesForSection();
        loadHousesForSection();
        loadDecorativeBuildingsForSection();
        loadStreetLampsForSection();
        loadAmbientEventsForSection();
        loadDialogueForSection();
    }

    function loadObstaclesForSection() {
        // Level 1's obstacle system is disabled -- see CONFIG.obstaclesEnabled.
        // LEVEL1_OBSTACLES itself is left fully intact below (not deleted)
        // so this is a one-flag re-enable if ever needed.
        if (!CONFIG.obstaclesEnabled) {
            obstacles = [];
            return;
        }
        const meeting = MEETINGS[meetingIndex];
        obstacles = LEVEL1_OBSTACLES
            .filter(function (o) { return o.section === meeting.id; })
            .map(function (o) {
                const runtime = {
                    id: o.id,
                    distance: o.distance,
                    requiredAction: o.requiredAction,
                    label: o.label,
                    resolved: false,   // player has passed it (correct action, or missed)
                    stumbled: false,   // true only if missed
                    rollAway: !!o.rollAway,
                    rolling: false,        // true while the roll-away animation is playing
                    rollAwayTimer: 0,
                    spriteConfig: o.sprite || null,
                    spriteImage: null,
                    spriteLoaded: false,
                    spriteElapsed: 0
                };
                loadObstacleSprite(runtime);
                return runtime;
            });
    }

    /* ------------------------------------------------------------------
       loadHousesForSection / loadDecorativeBuildingsForSection /
       loadStreetLampsForSection

       Same pattern as loadObstaclesForSection: filter the centralized
       data down to relevant entries and keep it as simple runtime
       placement data. No image loading happens here -- scenery is pure
       decoration pulled from the already-loaded image caches at draw
       time (see loadEnvironmentAssets), so switching sections never
       re-fetches anything.

       Each of these loads the CURRENT section's items AND the NEXT
       section's items (if any) together. That's deliberate -- see the
       big comment above getSectionWorldStart(): scenery is now
       positioned on a continuous world line, so the next section's
       landmarks/houses/lamps can already be rendering (correctly
       positioned, still off-screen) before advanceToNextSection() ever
       runs, instead of only existing -- and therefore only appearing --
       the instant the section officially switches.
       ------------------------------------------------------------------ */
    function loadHousesForSection() {
        const currentId = MEETINGS[meetingIndex].id;
        const nextMeeting = MEETINGS[meetingIndex + 1];
        const nextId = nextMeeting ? nextMeeting.id : null;
        sectionHouses = LEVEL1_HOUSES.filter(function (h) { return h.section === currentId || h.section === nextId; });
    }

    function loadDecorativeBuildingsForSection() {
        const currentId = MEETINGS[meetingIndex].id;
        const nextMeeting = MEETINGS[meetingIndex + 1];
        const nextId = nextMeeting ? nextMeeting.id : null;
        sectionDecorativeBuildings = LEVEL1_DECORATIVE_BUILDINGS.filter(function (b) { return b.section === currentId || b.section === nextId; });
    }

    function loadStreetLampsForSection() {
        const currentId = MEETINGS[meetingIndex].id;
        const nextMeeting = MEETINGS[meetingIndex + 1];
        const nextId = nextMeeting ? nextMeeting.id : null;
        sectionStreetLamps = LEVEL1_STREET_LAMPS.filter(function (l) { return l.section === currentId || l.section === nextId; });
    }

    // Same pattern as loadObstaclesForSection: filter the centralized
    // AMBIENT_EVENTS table down to the CURRENT section only (not the next
    // one too -- unlike scenery, these are one-shot triggers keyed to
    // distanceTraveled, which resets at the section boundary, so there's
    // nothing to pre-stage) and reset each entry's "fired" flag fresh.
    // Also clears any still-animating ambient objects from the section
    // just left, so nothing carries over mid-animation into a meeting
    // interior or the next section's opening frames.
    function loadAmbientEventsForSection() {
        const meeting = MEETINGS[meetingIndex];
        sectionAmbientEvents = AMBIENT_EVENTS
            .filter(function (e) { return e.section === meeting.id; })
            .map(function (e) { return { distance: e.distance, type: e.type, direction: e.direction, fired: false }; });
        activeAmbientEvents = [];
    }

    function loadObstacleSprite(runtimeObstacle) {
        // Reserved for future sprite-sheet art. Nothing to load yet for
        // any of the five placeholder obstacles (their sprite config is
        // null), and a bad/missing path here just falls back to the
        // placeholder box -- it never breaks gameplay.
        const cfg = runtimeObstacle.spriteConfig;
        if (!cfg || !cfg.assetPath) return;

        const img = new Image();
        img.onload = function () {
            runtimeObstacle.spriteLoaded = true;
        };
        img.onerror = function () {
            runtimeObstacle.spriteLoaded = false;
        };
        img.src = cfg.assetPath;
        runtimeObstacle.spriteImage = img;
    }

    /* ------------------------------------------------------------------
       ENVIRONMENT ASSET LOADING

       Loads once per level start/retry: the repeating tile, the three
       house sprites, the street lamp sprite, and one optional PNG
       override per interactive meeting building. Every load goes
       through the same small helper below, so the "missing/failed image
       -> fall back gracefully, log one clear warning, never crash or
       show a broken-image icon" behavior is identical everywhere.

       Building overrides are purely visual (see drawBuilding). The
       doorway hit-test (getDoorwayScreenRect), obstacle logic, dialogue,
       and every other gameplay system never read any of this -- an
       override PNG appearing or disappearing later requires zero
       gameplay changes, by design.
       ------------------------------------------------------------------ */
    function loadTrackedImage(path) {
        const entry = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
        const img = new Image();
        img.onload = function () {
            entry.loaded = true;
            entry.naturalWidth = img.naturalWidth;
            entry.naturalHeight = img.naturalHeight;
        };
        img.onerror = function () {
            entry.loaded = false;
            console.warn("chapter1-gameplay: image failed to load, falling back to existing programmer art -- " + path);
        };
        img.src = path;
        entry.image = img;
        return entry;
    }

    function loadEnvironmentAssets() {
        tileImage = loadTrackedImage(BACKGROUND_TILE_ASSET);

        houseImages = {};
        Object.keys(HOUSE_ASSET_SOURCES).forEach(function (key) {
            houseImages[key] = loadTrackedImage(HOUSE_ASSET_SOURCES[key]);
        });

        streetLampImage = loadTrackedImage(STREET_LAMP_ASSET_SOURCE);

        decorativeBuildingImages = {};
        Object.keys(DECORATIVE_BUILDING_ASSET_SOURCES).forEach(function (key) {
            decorativeBuildingImages[key] = loadTrackedImage(DECORATIVE_BUILDING_ASSET_SOURCES[key]);
        });

        loadBuildingOverrideImages();
        loadMeetingInteriorImages();
        billSpriteImage = loadTrackedImage(ASSETS.billSpriteBasicLevel1);
        bobSpriteImage = loadTrackedImage(ASSETS.bobSpriteBasicLevel1);
        billSpriteImage2 = loadTrackedImage(ASSETS.billSpriteBasicLevel1Costume2);
        bobSpriteImage2 = loadTrackedImage(ASSETS.bobSpriteBasicLevel1Costume2);
        billSpriteImageFunny = loadTrackedImage(ASSETS.billSpriteFunny);
        bobSpriteImageFunny = loadTrackedImage(ASSETS.bobSpriteFunny);
        level1VisualsImage = loadTrackedImage(ASSETS.level1Visuals);
    }

    function loadBuildingOverrideImages() {
        buildingImages = {};
        // CHANGING_STORE is included here (not just MEETINGS) so
        // buildingImages.changingStore is populated the same way every
        // meeting building is -- getBuildingRenderGeometry/drawBuilding
        // don't care which list a building-shaped object came from.
        MEETINGS.concat([CHANGING_STORE]).forEach(function (meeting) {
            if (!meeting.buildingAsset) return;
            buildingImages[meeting.id] = loadTrackedImage(meeting.buildingAsset);
        });
    }

    function loadMeetingInteriorImages() {
        interiorImages = {};
        Object.keys(MEETING_INTERIOR_ASSET_SOURCES).forEach(function (id) {
            interiorImages[id] = loadTrackedImage(MEETING_INTERIOR_ASSET_SOURCES[id]);
        });
    }

    /* ------------------------------------------------------------------
       EXTERNAL DIALOGUE SCRIPT (script.js)

       A plain-text file meant for hand-editing by a non-programmer --
       loaded and parsed as TEXT, never executed as JavaScript, so it
       never needs valid JS syntax (no quotes, commas, brackets, etc).
       Format:

           //SectionName

           //[pt1]
           bill: some line
           bob: a reply
           bill: bill can speak again right after himself

           //[pt2]
           ...

       - "//SectionName" starts a new section (e.g. "Outside-level1",
         later "AA-level1" etc for meetings).
       - "//[pt#]" starts a dialogue point within the current section.
         Any number of points, any names -- "pt1"/"pt2"/... is just this
         project's own convention, not something the parser requires.
       - "speaker: text" lines are matched case-insensitively on the
         speaker name ("bill"/"BILL"/"Bill" all resolve the same way);
         "bill", "bob", and "crowd" are the recognized speakers.
         "crowd" is an anonymous meeting-room voice -- not Bill, not Bob
         -- see drawSpeechBubbles/CROWD_BUBBLE_PRESETS for how it's
         rendered.
       - Lines can repeat the same speaker consecutively; the parser
         just plays lines in the exact order they appear.
       - Blank lines are ignored. A malformed line is skipped with a
         console warning rather than crashing anything.

       getScriptDialogue(section, point) is the only thing gameplay code
       calls -- it returns an array of { speaker, text } in order, or
       null if script.js hasn't loaded yet or has nothing for that
       section/point, so every call site has a clear "fall back to
       whatever dialogue this used before" case (see loadDialogueForSection).
       ------------------------------------------------------------------ */
    const SCRIPT_FILE_PATH = "script.js"; // where to fetch it from -- change this if the file moves
    const DIALOGUE_GAP = 2000;            // ms between consecutive script.js dialogue lines -- the one timing knob for this system

    let scriptDialogue = null;            // parsed { section: { point: [ {speaker, text} ] } }, or null until loaded/if loading failed
    let scriptSceneConfig = null;         // parsed { section: { sceneTimer: seconds } }, or null until loaded/if loading failed -- see "scene-timer:" in parseScriptText
    let scriptDialogueLoadAttempted = false;

    function parseScriptText(text) {
        const result = {};
        const sceneConfig = {};   // { sectionKey: { sceneTimer: seconds } } -- scene-level config, kept OUT of the dialogue tables in `result`
        let currentSection = null;
        let currentPointKey = null;

        String(text).split(/\r?\n/).forEach(function (rawLine, index) {
            const line = rawLine.trim();
            if (line.length === 0) return;

            // //[pt1] -- checked before the generic "//Section" match,
            // since both start with "//".
            const pointMatch = line.match(/^\/\/\s*\[\s*([^\]]+?)\s*\]\s*$/);
            if (pointMatch) {
                if (!currentSection) {
                    console.warn("script.js line " + (index + 1) + ": [" + pointMatch[1] + "] appears before any //SectionName -- ignoring.");
                    currentPointKey = null;
                    return;
                }
                currentPointKey = pointMatch[1].trim().toLowerCase();
                if (!result[currentSection][currentPointKey]) {
                    result[currentSection][currentPointKey] = [];
                }
                return;
            }

            // //SectionName -- starts a new section. Requires NO space
            // right after "//" (matches every section header the way
            // this project actually writes them, e.g. "//AA-level1"),
            // which is what tells a real section line apart from an
            // ordinary "// explanatory comment" -- those almost always
            // have a space after the slashes, and are handled by the
            // plain-comment check just below instead of being mistaken
            // for a (nonsense) section name.
            const sectionMatch = line.match(/^\/\/(\S.*)$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1].trim().toLowerCase();
                currentPointKey = null;
                if (!result[currentSection]) {
                    result[currentSection] = {};
                }
                return;
            }

            // Any other line starting with "//" (a header, an explanation,
            // a blank "//" separator) is just a plain comment -- skip it
            // quietly, no warning. Only lines that AREN'T a comment and
            // still fail to parse below get a console warning.
            if (line.indexOf("//") === 0) {
                return;
            }

            // scene-timer: <seconds> -- scene CONFIG for the current section,
            // not a dialogue line. Checked before the speaker match below so
            // it's never mistaken for (or warned about as) an unrecognized
            // speaker. Stored separately in `sceneConfig`, never pushed into
            // `result`, so nothing that reads dialogue points ever sees it.
            const sceneTimerMatch = line.match(/^scene-timer\s*:\s*([\d.]+)\s*$/i);
            if (sceneTimerMatch) {
                if (!currentSection) {
                    console.warn("script.js line " + (index + 1) + ": scene-timer appears before any //SectionName -- ignoring.");
                    return;
                }
                const seconds = parseFloat(sceneTimerMatch[1]);
                if (isNaN(seconds)) {
                    console.warn("script.js line " + (index + 1) + ": couldn't parse scene-timer value -- ignoring.");
                    return;
                }
                if (!sceneConfig[currentSection]) {
                    sceneConfig[currentSection] = {};
                }
                sceneConfig[currentSection].sceneTimer = seconds;
                return;
            }

            // clock: HH:MM:SS -- re-anchors the fictional HUD "TIME LEFT ON
            // EARTH" story clock for the current section. Also scene CONFIG,
            // not dialogue -- stored in `sceneConfig` right alongside
            // scene-timer but as its own independent key (clockSeconds), so
            // editing one never touches the other. See getScriptClockSeconds.
            const clockMatch = line.match(/^clock\s*:\s*(\d{1,3}):(\d{2}):(\d{2})\s*$/i);
            if (clockMatch) {
                if (!currentSection) {
                    console.warn("script.js line " + (index + 1) + ": clock appears before any //SectionName -- ignoring.");
                    return;
                }
                const hh = parseInt(clockMatch[1], 10);
                const mm = parseInt(clockMatch[2], 10);
                const ss = parseInt(clockMatch[3], 10);
                if (mm > 59 || ss > 59) {
                    console.warn("script.js line " + (index + 1) + ": clock minutes/seconds must be 00-59 -- ignoring.");
                    return;
                }
                if (!sceneConfig[currentSection]) {
                    sceneConfig[currentSection] = {};
                }
                sceneConfig[currentSection].clockSeconds = hh * 3600 + mm * 60 + ss;
                return;
            }

            // speaker: dialogue text -- speaker names may contain a hyphen
            // (needed for "building-dialogue"), hence [A-Za-z-]+ instead of
            // just [A-Za-z]+; still requires at least one plain letter so a
            // stray "--" or "-" alone can't accidentally match here.
            const speakerMatch = line.match(/^([A-Za-z][A-Za-z-]*)\s*:\s*(.*)$/);
            if (speakerMatch) {
                const rawSpeaker = speakerMatch[1].trim().toLowerCase();
                const dialogueText = speakerMatch[2].trim();
                if (rawSpeaker !== "bill" && rawSpeaker !== "bob" && rawSpeaker !== "crowd" && rawSpeaker !== "building-dialogue") {
                    console.warn("script.js line " + (index + 1) + ": unrecognized speaker \"" + speakerMatch[1] + "\" -- ignoring line.");
                    return;
                }
                if (!currentSection || !currentPointKey) {
                    console.warn("script.js line " + (index + 1) + ": dialogue line appears before any //SectionName / //[pt#] -- ignoring.");
                    return;
                }
                if (dialogueText.length === 0) return;
                // "building-dialogue" is authoring syntax, not a character --
                // it's stored internally as speaker "building" (see
                // drawSpeechBubbles), same ordered-array entry shape as
                // bill/bob/crowd, just anchored differently when drawn.
                const speaker = (rawSpeaker === "building-dialogue") ? "building" : rawSpeaker;
                result[currentSection][currentPointKey].push({ speaker: speaker, text: dialogueText });
                return;
            }

            console.warn("script.js line " + (index + 1) + ": couldn't parse \"" + rawLine.trim() + "\" -- ignoring.");
        });

        return { dialogue: result, sceneConfig: sceneConfig };
    }

    function loadScriptDialogue() {
        if (scriptDialogueLoadAttempted) return;
        scriptDialogueLoadAttempted = true;

        if (typeof fetch !== "function") return; // no fetch available -- scriptDialogue just stays null, existing dialogue keeps working

        fetch(SCRIPT_FILE_PATH)
            .then(function (response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.text();
            })
            .then(function (text) {
                const parsed = parseScriptText(text);
                scriptDialogue = parsed.dialogue;
                scriptSceneConfig = parsed.sceneConfig;
            })
            .catch(function (err) {
                console.warn("script.js could not be loaded (" + err.message + ") -- falling back to existing dialogue tables.");
                scriptDialogue = null;
                scriptSceneConfig = null;
            });
    }

    // The only function gameplay code calls into this system. Returns an
    // ordered array of { speaker, text }, or null if script.js isn't
    // loaded yet or has nothing for this section/point -- callers should
    // treat null exactly like "no script.js override, use whatever this
    // used before" (see loadDialogueForSection).
    function getScriptDialogue(sectionKey, pointKey) {
        if (!scriptDialogue) return null;
        const section = scriptDialogue[String(sectionKey).toLowerCase()];
        if (!section) return null;
        const entries = section[String(pointKey).toLowerCase()];
        return (entries && entries.length > 0) ? entries : null;
    }

    // Returns the "scene-timer: <seconds>" value script.js configured for
    // this section (e.g. "AA-level1"), or null if script.js hasn't loaded
    // yet or has no scene-timer for that section -- callers fall back to
    // CONFIG.insideMeetingMaxDuration in that case, same null-means-fallback
    // convention as getScriptDialogue above.
    function getSceneTimer(sectionKey) {
        if (!scriptSceneConfig) return null;
        const cfg = scriptSceneConfig[String(sectionKey).toLowerCase()];
        return (cfg && typeof cfg.sceneTimer === "number") ? cfg.sceneTimer : null;
    }

    // Returns the "clock: HH:MM:SS" value (as total seconds) script.js
    // configured for this section, or null if script.js hasn't loaded yet
    // or has no clock: for that section -- callers leave the fictional HUD
    // clock running untouched in that case (no re-anchor), same
    // null-means-"don't touch it" convention as getSceneTimer above.
    function getScriptClockSeconds(sectionKey) {
        if (!scriptSceneConfig) return null;
        const cfg = scriptSceneConfig[String(sectionKey).toLowerCase()];
        return (cfg && typeof cfg.clockSeconds === "number") ? cfg.clockSeconds : null;
    }

    // Fires immediately as soon as this file itself loads/parses -- well
    // before start() runs -- so script.js (a small text file) has the
    // best possible head start to finish loading before the very first
    // loadDialogueForSection() call needs it. If it hasn't finished in
    // time for that first call, that one call simply falls back to the
    // existing dialogue table, same as any other section/point script.js
    // doesn't (yet) cover.
    loadScriptDialogue();

    /* ------------------------------------------------------------------
       DIALOGUE LOADING

       level1-dialogue.js exports one table per meeting, each with a
       "walking" array (plays outside, approaching the building) and an
       "inside" array (plays once they've entered). Both use the exact
       same entry shape, so both load through this one helper.

       Both outdoor ("walking") and meeting ("inside") dialogue check
       script.js FIRST -- section "Outside-level1" (points pt1, pt2, ...
       one per outdoor section) for outdoor, and "<LABEL>-level1" / "pt1"
       (e.g. "AA-level1") for each meeting's interior. If script.js
       hasn't loaded yet, or has nothing for that section/point, this
       falls straight back to the existing level1-dialogue.js table,
       completely unchanged.
       ------------------------------------------------------------------ */
    function loadDialogueForSection() {
        const scriptEntries = getScriptDialogue("Outside-level1", "pt" + (meetingIndex + 1));
        if (scriptEntries) {
            loadDialogueQueueFromScriptEntries(scriptEntries);
            return;
        }
        loadDialogueQueue("walking");
    }

    // Superseded by loadInteriorDialoguePoint (called per dialogue-point
    // step from buildInteriorSequence/updateInteriorSequence) -- kept
    // only as the pt1-specific fallback that function still calls when
    // script.js has nothing for a meeting's pt1 yet. Not called directly
    // anywhere else anymore.
    function loadInsideDialogueForSection() {
        const meeting = MEETINGS[meetingIndex];
        const scriptEntries = getScriptDialogue(meeting.label + "-level1", "pt1");
        if (scriptEntries) {
            loadDialogueQueueFromScriptEntries(scriptEntries);
            return;
        }
        loadDialogueQueue("inside");
    }

    function loadDialogueQueue(sectionKey) {
        activeBubble = null;
        dialogueTimer = 0;

        const meeting = MEETINGS[meetingIndex];
        const meetingTable = window.HalloweenGame.level1Dialogue &&
            window.HalloweenGame.level1Dialogue[meeting.id];
        const table = (meetingTable && meetingTable[sectionKey]) || [];

        // Copy so we can safely shift() through it without mutating source data
        dialogueQueue = table.map(function (entry) {
            return {
                speaker: entry.speaker,
                text: entry.text,
                delay: (typeof entry.delay === "number") ? entry.delay : CONFIG.dialogueDefaultDelay
            };
        });

        if (dialogueQueue.length > 0) {
            dialogueTimer = dialogueQueue[0].delay;
        }
    }

    // Same queue shape as loadDialogueQueue, but from script.js entries
    // (already just { speaker, text } pairs -- script.js has no per-line
    // delay concept, so every line uses the single DIALOGUE_GAP value).
    function loadDialogueQueueFromScriptEntries(entries) {
        activeBubble = null;
        dialogueTimer = 0;

        const gapSeconds = DIALOGUE_GAP / 1000;
        dialogueQueue = entries.map(function (entry) {
            return { speaker: entry.speaker, text: entry.text, delay: gapSeconds };
        });

        if (dialogueQueue.length > 0) {
            dialogueTimer = dialogueQueue[0].delay;
        }
    }

    /* ======================================================================
       INPUT
       Pointer Events so touch / mouse / pen all work the same way.

       Three input surfaces, each with one job:
         - the ACTION button: PRESS = GO, DOUBLE PRESS = ACTION (jump,
           smash, or kick -- decided automatically -- or a hustle if
           nothing is close)
         - the canvas itself: ONLY listens for a tap directly on the
           meeting doorway when WAITING_AT_DOOR.
         - the retry button: only visible/interactive at STATE.OUT_OF_LIVES.
       ====================================================================== */
    function attachInput() {
        if (pointerListenersAttached) return;

        // Doorway tap only.
        canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: false });
        canvas.addEventListener("touchstart", preventDefaultTouch, { passive: false });

        // The permanent control.
        actionButton.addEventListener("pointerdown", onActionButtonPointerDown, { passive: false });
        actionButton.addEventListener("touchstart", preventDefaultTouch, { passive: false });
        actionButton.addEventListener("pointerup", onActionButtonPointerUp);
        actionButton.addEventListener("pointerleave", onActionButtonPointerUp);
        actionButton.addEventListener("pointercancel", onActionButtonPointerUp);

        // Temporary retry control (see STATE.OUT_OF_LIVES).
        retryButton.addEventListener("pointerdown", onRetryButtonPointerDown, { passive: false });
        retryButton.addEventListener("touchstart", preventDefaultTouch, { passive: false });

        // Debug anchor-jump toggle -- always wired up (not tied to any
        // particular game state), even though the button itself starts
        // hidden until Ctrl+D reveals it.
        debugAnchorButton.addEventListener("pointerdown", onDebugAnchorButtonPointerDown, { passive: false });
        debugAnchorButton.addEventListener("touchstart", preventDefaultTouch, { passive: false });
        document.addEventListener("keydown", onDebugHotkeyDown);

        pointerListenersAttached = true;
    }

    function detachInput() {
        if (!pointerListenersAttached) return;

        if (canvas) {
            canvas.removeEventListener("pointerdown", onCanvasPointerDown);
            canvas.removeEventListener("touchstart", preventDefaultTouch);
        }
        if (actionButton) {
            actionButton.removeEventListener("pointerdown", onActionButtonPointerDown);
            actionButton.removeEventListener("touchstart", preventDefaultTouch);
            actionButton.removeEventListener("pointerup", onActionButtonPointerUp);
            actionButton.removeEventListener("pointerleave", onActionButtonPointerUp);
            actionButton.removeEventListener("pointercancel", onActionButtonPointerUp);
        }
        if (retryButton) {
            retryButton.removeEventListener("pointerdown", onRetryButtonPointerDown);
            retryButton.removeEventListener("touchstart", preventDefaultTouch);
        }
        if (debugAnchorButton) {
            debugAnchorButton.removeEventListener("pointerdown", onDebugAnchorButtonPointerDown);
            debugAnchorButton.removeEventListener("touchstart", preventDefaultTouch);
        }
        document.removeEventListener("keydown", onDebugHotkeyDown);

        pointerListenersAttached = false;
    }

    function preventDefaultTouch(e) {
        e.preventDefault();
    }

    function onCanvasPointerDown(e) {
        if (state !== STATE.WAITING_AT_DOOR) return;
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        // Convert from the canvas's actual on-screen (CSS/visual) size --
        // which can now be scaled to any physical size by the GAME FRAME
        // transform -- back into the fixed 390x780 LOGICAL space every
        // render/geometry calculation uses (see resizeCanvas). A raw
        // clientX/clientY - rect.left is only correct when canvas.width
        // happens to equal rect.width, which is no longer guaranteed.
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = (e.clientX !== undefined) ? e.clientX : rect.left + rect.width * 0.8;
        const clientY = (e.clientY !== undefined) ? e.clientY : rect.top + rect.height * 0.8;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        if (isPointOnDoorway(x, y, canvas.width, canvas.height)) {
            enterMeeting();
        }
    }

    /* ------------------------------------------------------------------
       THE ACTUAL DOORWAY -- the live tap target.

       getBuildingRenderGeometry() is the ONE place that computes where a
       meeting building actually sits on screen and how big it is drawn
       (screen x, its own ground line, and its displayed width/height --
       image-override or placeholder, whichever is active). Both
       drawBuilding() (visuals) and getDoorwayScreenRect() (hit-testing)
       call this same function, so the tappable area can never drift out
       of sync with what's actually drawn -- previously the doorway rect
       used a different vertical baseline (outdoorArchitectureY) than
       the building was actually drawn on (outdoorGroundY /
       buildingImageGroundY), which is part of why the tap target didn't
       line up with the art.

       getMeetingDoorwayConfig() reads the per-building normalized
       doorway placement from MEETINGS[].doorway (see the big comment
       above the MEETINGS array) so each building's doorway can be
       aligned to its own PNG independently, with no change to any of
       this logic -- only the data changes.

       getDoorwayScreenRect() combines the two into the doorway's exact
       on-screen rectangle. isPointOnDoorway() then adds a thumb-friendly
       padding margin around that rect -- generous, but still spatially
       attached to the visible door, not some unrelated region of the
       screen.
       ------------------------------------------------------------------ */
    function getCurrentSectionDistance() {
        const meeting = MEETINGS[meetingIndex];
        return (meeting && meeting.sectionDistance) || CONFIG.sectionDistance;
    }

    /* ======================================================================
       CONTINUOUS SCENERY POSITIONING -- the second half of the blink/
       teleport fix.

       Splitting distanceTraveled (resets per section) from
       worldScrollDistance (never resets -- see advanceDistance() above)
       fixed the background-tile and atmosphere-parallax phase snap. But
       a landmark placed close to the START of a section -- e.g. the Dry
       Peoples Club at "ca" distance 300 -- has NO room to scroll into
       view: with distanceTraveled resetting to 0 the instant
       advanceToNextSection() runs, that landmark is already inside the
       render cutoff (sometimes already large and close) on the very
       first rendered frame of the new section, so it just pops into
       existence instead of visibly walking up to it. That's the actual
       teleport the player sees leaving a meeting.

       The fix: give scenery (houses, decorative landmarks, street
       lamps -- NOT the interactive meeting building/doorway/obstacles,
       which stay correctly section-gated for approach/hit-test logic)
       a position on the SAME continuous number line as
       worldScrollDistance, and load the upcoming section's scenery
       ALONGSIDE the current section's (see the load*ForSection
       functions below) so it's already rendering -- correctly
       positioned, still off-screen -- before the section officially
       advances. When advanceToNextSection() runs, nothing needs to pop
       in: it was already there, mid-scroll, the whole time.

       getSectionWorldStart(i) is each section's own start point on that
       continuous line. EXIT_WALK_OVERSHOOT accounts for the extra
       distance Bill and Bob visibly walk past a building during
       EXITING_MEETING (see updateExitingMeeting) before the section
       actually advances -- without it, this table would drift out of
       sync with worldScrollDistance by that amount every meeting.
       ------------------------------------------------------------------ */
    const EXIT_WALK_OVERSHOOT = Math.max(0,
        (CONFIG.exitMeetingDuration - CONFIG.exitDoorStepDuration) * CONFIG.walkSpeed - CONFIG.meetingStopDistance);

    let sectionWorldStartTable = null;

    function getSectionWorldStart(index) {
        if (!sectionWorldStartTable) {
            sectionWorldStartTable = [];
            let acc = 0;
            for (let i = 0; i < MEETINGS.length; i++) {
                sectionWorldStartTable[i] = acc;
                acc += (MEETINGS[i].sectionDistance || CONFIG.sectionDistance) + EXIT_WALK_OVERSHOOT;
            }
        }
        return (index >= 0 && index < sectionWorldStartTable.length) ? sectionWorldStartTable[index] : null;
    }

    function getMeetingIndexById(id) {
        for (let i = 0; i < MEETINGS.length; i++) {
            if (MEETINGS[i].id === id) return i;
        }
        return -1;
    }

    // Absolute, continuous position of a scenery item (defined with a
    // distance local to its own section) on the worldScrollDistance line.
    function getSceneryWorldPosition(sectionId, localDistance) {
        const start = getSectionWorldStart(getMeetingIndexById(sectionId));
        return (start === null) ? localDistance : start + localDistance;
    }

    // Screen x for a piece of scenery, using its continuous world
    // position rather than the current section's local distanceTraveled
    // -- see the big comment above. This is what lets next-section
    // scenery scroll in correctly before the section switch happens.
    function sceneryScreenX(sectionId, localDistance, primaryX) {
        return primaryX + (getSceneryWorldPosition(sectionId, localDistance) - worldScrollDistance);
    }

    function getMeetingDoorwayConfig(meeting) {
        const d = (meeting && meeting.doorway) || {};
        return {
            xPercent: (d.xPercent !== undefined) ? d.xPercent : 0.5,
            bottomPercent: (d.bottomPercent !== undefined) ? d.bottomPercent : 1.0,
            widthPercent: (d.widthPercent !== undefined) ? d.widthPercent : 0.16,
            heightPercent: (d.heightPercent !== undefined) ? d.heightPercent : 0.34,
            exitOffsetX: d.exitOffsetX || 0
        };
    }

    // x is passed in explicitly (rather than computed here) so the same
    // geometry function works for BOTH the current meeting's building
    // (approaching, section-local x) and a just-exited meeting's building
    // still receding into the distance on the continuous world line (see
    // exitedMeetingIndex / getSectionWorldStart) -- one function, two
    // possible sources for x, geometry math never duplicated between them.
    function getBuildingRenderGeometry(meeting, w, h, x) {
        const groundY = outdoorGroundY(h);

        const override = buildingImages[meeting.id];
        const usingOverride = !!(override && override.loaded && override.naturalHeight > 0);

        if (usingOverride) {
            // Same ground line drawBuilding() actually draws the image on
            // (see buildingImageGroundY there) -- kept in one place so the
            // two can never disagree.
            const imageGroundY = groundY - Math.max(2, h * 0.006);
            const displayHeight = getBuildingImageDisplayHeight(meeting.buildingStyle, h);
            const displayWidth = displayHeight * (override.naturalWidth / override.naturalHeight);
            return { x: x, groundY: imageGroundY, displayWidth: displayWidth, displayHeight: displayHeight, usingOverride: true };
        }

        const displayHeight = buildingStyleHeight(meeting.buildingStyle);
        return { x: x, groundY: groundY, displayWidth: 180, displayHeight: displayHeight, usingOverride: false };
    }

    // Shared "put this building's/landmark's horizontal CENTER at
    // screen-CENTER" stop offset -- used by CMA/Harrison Corner (see
    // MEETINGS' cma entry, centerInViewport) and the Dry People's Club
    // stop (see DRY_CLUB_STOP/checkDryClubApproach/updateDryClubDialogue).
    // Both real meeting buildings and decorative landmarks are drawn
    // CENTERED on their own "distance" value (see drawBuildingImage/
    // drawDecorativeBuildings), so putting that center at screen-center
    // (canvas.width * 0.5) just means solving for the gap between
    // outdoorPrimaryX (where Bill/Bob always stand, well left of center)
    // and that midpoint -- computed from the real canvas width, same
    // "measure it, don't hardcode a guess" approach
    // getMeetingApproachStopDistance already uses for EA below. Floors at
    // the ordinary CONFIG.meetingStopDistance so a very narrow viewport
    // never ends up with a near-zero (or negative) gap; falls back to
    // that same floor if canvas isn't ready yet. This never changes the
    // building's/landmark's actual world position (its "distance" value)
    // -- only where Bill/Bob stop relative to it.
    function getLandmarkCenterStopOffset() {
        if (!canvas) return CONFIG.meetingStopDistance;
        const w = canvas.width;
        return Math.max(CONFIG.meetingStopDistance, (w * 0.5) - outdoorPrimaryX(w));
    }

    // EA-ONLY doorway-aware approach stop (see the "alignStopToDoorway"
    // flag on EA's MEETINGS entry). The generic approach in updateApproach
    // stops Bill/Bob a fixed CONFIG.meetingStopDistance before the
    // building's own horizontal CENTER, which works fine for a centered
    // door but overshoots for a door that sits well left of center, like
    // EA's. This solves for the stop distance that instead keeps the
    // ACTUAL doorway (getMeetingDoorwayConfig's xPercent) the usual
    // CONFIG.meetingStopDistance in front of Bill -- using this building's
    // own real rendered width (via getBuildingRenderGeometry, so it's
    // correct at any canvas size, not a hardcoded guess) rather than
    // duplicating that geometry logic. CMA uses centerInViewport instead
    // (see getLandmarkCenterStopOffset above) -- every other meeting
    // without either flag returns the plain, unmodified
    // CONFIG.meetingStopDistance -- this never changes global approach
    // behavior.
    function getMeetingApproachStopDistance(meeting) {
        if (meeting.centerInViewport) return getLandmarkCenterStopOffset();
        if (!meeting.alignStopToDoorway || !canvas) return CONFIG.meetingStopDistance;
        const geo = getBuildingRenderGeometry(meeting, canvas.width, canvas.height, 0);
        const doorway = getMeetingDoorwayConfig(meeting);
        return CONFIG.meetingStopDistance + geo.displayWidth * (0.5 - doorway.xPercent);
    }

    // The doorway rectangle for a given building's already-computed
    // geometry -- factored out of getDoorwayScreenRect so a receding,
    // already-exited building (see drawBuilding's isCurrent=false path)
    // can also size/place its own placeholder doorway correctly without
    // reaching back into meetingIndex-based lookups that only make sense
    // for the CURRENT meeting.
    function computeDoorwayRectFromGeometry(meeting, geo) {
        const doorway = getMeetingDoorwayConfig(meeting);

        // Placeholder buildings keep the original fixed CONFIG-sized
        // doorway centered on the placeholder (see drawBuildingPlaceholder) --
        // there's no real doorway art to align to yet. Once a building's
        // final PNG is in place, its own normalized doorway percentages
        // take over automatically.
        if (!geo.usingOverride) {
            return {
                left: geo.x - CONFIG.doorwayWidth / 2,
                right: geo.x + CONFIG.doorwayWidth / 2,
                top: geo.groundY - CONFIG.doorwayHeight,
                bottom: geo.groundY,
                centerX: geo.x,
                exitOffsetX: 0
            };
        }

        const doorWidth = geo.displayWidth * doorway.widthPercent;
        const doorHeight = geo.displayHeight * doorway.heightPercent;
        const centerX = (geo.x - geo.displayWidth / 2) + geo.displayWidth * doorway.xPercent;
        const bottomY = (geo.groundY - geo.displayHeight) + geo.displayHeight * doorway.bottomPercent;

        return {
            left: centerX - doorWidth / 2,
            right: centerX + doorWidth / 2,
            top: bottomY - doorHeight,
            bottom: bottomY,
            centerX: centerX,
            exitOffsetX: doorway.exitOffsetX
        };
    }

    function getDoorwayScreenRect(w, h) {
        const meeting = MEETINGS[meetingIndex];
        const primaryX = outdoorPrimaryX(w);
        const x = worldToScreenX(getCurrentSectionDistance(), primaryX);
        const geo = getBuildingRenderGeometry(meeting, w, h, x);
        return computeDoorwayRectFromGeometry(meeting, geo);
    }

    function isPointOnDoorway(px, py, w, h) {
        const rect = getDoorwayScreenRect(w, h);
        const pad = CONFIG.doorwayHitPadding;
        return px >= rect.left - pad && px <= rect.right + pad &&
            py >= rect.top - pad && py <= rect.bottom + pad;
    }

    function onRetryButtonPointerDown(e) {
        if (state !== STATE.OUT_OF_LIVES) return;
        e.preventDefault();
        playUiClickSound(); // retry-screen navigation -- see spec section 1
        retryLevel();
    }

    function retryLevel() {
        // start() already does a full cleanup + rebuild + fresh
        // resetRuntimeState(), which is exactly "5 lives, meeting
        // progress reset, obstacles reset, clock reset, dialogue reset,
        // all gameplay state reset" -- reuse it rather than duplicating
        // that logic here.
        start();
    }


    /* ------------------------------------------------------------------
       THE ACTION BUTTON -- the player's one control, fully context-
       sensitive. getActionButtonState() below is the SINGLE source of
       truth: updateHud() reads it to set the label/subtitle/visual style
       and fire one-time transition animations, and
       onActionButtonPointerDown reads the SAME function to decide what a
       press actually does -- so the label and the behavior can never
       drift apart (see BUTTON_STATE / getActionButtonState).

         BUTTON_STATE.START             "START"       press begins the level (unchanged)
         BUTTON_STATE.FASTER            "FASTER"      double-press = dash/hustle (existing performAction, unchanged) + WHOOSH effect
         BUTTON_STATE.ENTER             "ENTER"       press = enterMeeting() -- the SAME function the doorway tap calls
         BUTTON_STATE.DISABLED_MEETING  "IN MEETING"  inert -- inside/entering/leaving a meeting
         BUTTON_STATE.DISABLED_TRANSITION "..."       inert -- any other automatic sequence (Fresh Threads, Dry Club, approaching a doorway, scene transitions) where a press already had no effect
         BUTTON_STATE.CONTINUE          "CONTINUE"    press hands off to the next chapter (see goToNextChapter)
       ------------------------------------------------------------------ */
    const BUTTON_STATE = {
        START: "START",
        FASTER: "FASTER",
        ENTER: "ENTER",
        DISABLED_MEETING: "DISABLED_MEETING",
        DISABLED_TRANSITION: "DISABLED_TRANSITION",
        CONTINUE: "CONTINUE"
    };

    function getActionButtonState() {
        if (state === STATE.WAITING_TO_START) return BUTTON_STATE.START;
        if (state === STATE.FINISHED) return BUTTON_STATE.CONTINUE;
        if (state === STATE.WAITING_AT_DOOR) return BUTTON_STATE.ENTER;
        if (state === STATE.ENTERING_MEETING || state === STATE.INSIDE_MEETING ||
            state === STATE.LEAVING_MEETING || state === STATE.EXITING_MEETING) {
            return BUTTON_STATE.DISABLED_MEETING;
        }
        if (state === STATE.WALKING || state === STATE.DASHING ||
            state === STATE.JUMPING || state === STATE.SMASHING || state === STATE.KICKING) {
            return BUTTON_STATE.FASTER;
        }
        // Everything else -- APPROACHING_MEETING (the automatic slide into
        // a doorway), CHANGING_STORE_EVENT, DRY_CLUB_DIALOGUE,
        // TRANSITIONING, OUT_OF_LIVES -- is an automatic sequence where a
        // press already has zero effect today; "..." says so honestly
        // instead of showing FASTER/GO and being wrong.
        return BUTTON_STATE.DISABLED_TRANSITION;
    }

    function onActionButtonPointerDown(e) {
        e.preventDefault();
        const buttonState = getActionButtonState();
        setActionButtonPressed(true);

        const now = performance.now();
        const isDoublePress = (now - lastTapTime) <= CONFIG.doubleTapWindow;
        lastTapTime = isDoublePress ? 0 : now; // consume so a triple-press isn't double-double

        switch (buttonState) {
            case BUTTON_STATE.START:
                playUiClickSound(); // game-entry press -- see spec section 1
                beginWalking();
                return;
            case BUTTON_STATE.ENTER:
                enterMeeting(); // same function the doorway tap calls -- see onCanvasPointerDown
                return;
            case BUTTON_STATE.CONTINUE:
                playUiClickSound(); // chapter-handoff press -- see spec section 1
                goToNextChapter();
                return;
            case BUTTON_STATE.FASTER:
                // NEW: every tap (single or double) while the button reads
                // FASTER permanently bumps the persistent speed level --
                // see fasterSpeedLevel/getFasterSpeedMultiplier and
                // bumpFasterSpeedLevel. This is layered on top of, and
                // completely separate from, the EXISTING double-press
                // dash/hustle below, which is unchanged.
                bumpFasterSpeedLevel();
                // Unchanged from before: only an actual DOUBLE press during
                // WALKING/DASHING triggers the existing dash/hustle -- the
                // button now just honestly explains that's what it does.
                if (isDoublePress && (state === STATE.WALKING || state === STATE.DASHING)) {
                    const triggered = performAction();
                    if (triggered) playActionButtonWhoosh();
                }
                return;
            default:
                // DISABLED_MEETING / DISABLED_TRANSITION -- absolutely
                // nothing, on purpose (see spec: "no speed boost, no
                // movement, no accidental actions").
                return;
        }
    }

    function onActionButtonPointerUp() {
        setActionButtonPressed(false);
    }

    function setActionButtonPressed(isPressed) {
        // Small press/depress "compress and spring back" response --
        // layered on top of whatever translate/scale a one-time state
        // animation is currently applying (see updateActionButtonHud),
        // since both are just transform values applied to the same
        // element at different moments, never simultaneously. Applied to
        // actionButtonHousing (the visible control) -- actionButton (the
        // larger invisible tap target) never moves or changes appearance.
        if (!actionButton || !actionButtonHousing) return;
        const disabled = (getActionButtonState() === BUTTON_STATE.DISABLED_MEETING ||
            getActionButtonState() === BUTTON_STATE.DISABLED_TRANSITION);
        if (disabled) return; // no press feedback on an inert button
        if (isPressed) {
            actionButtonHousing.style.transform = "translate(-50%, -50%) translateY(3px)";
            actionButtonHousing.style.boxShadow = "0 1px 0 #000, 0 2px 4px rgba(0,0,0,0.5)";
        } else {
            actionButtonHousing.style.transform = "translate(-50%, -50%)";
            actionButtonHousing.style.boxShadow = "0 3px 0 #000, 0 5px 8px rgba(0,0,0,0.5)";
        }
    }

    // THE CHAPTER-2 HANDOFF -- follows the SAME pattern every other
    // chapter handoff in this project already uses (chapter0-intro.js ->
    // window.HalloweenGame.chapter1Story.start(), chapter1-story.js ->
    // window.HalloweenGame.chapter1Gameplay.start()): each module exposes
    // itself on window.HalloweenGame under its own camelCase name, and
    // the module handing off calls that exact property directly -- there
    // is no generic "next chapter" indirection anywhere else in the
    // project. window.HalloweenGame.nextChapter (the old target here) was
    // never actually set by anything, which is exactly why CONTINUE did
    // nothing: this now points at window.HalloweenGame.chapter2Story,
    // matching chapter2-story.js's expected export name under that
    // convention. cleanup() runs first -- same full teardown start()/
    // retryLevel() already rely on (stops the rAF loop, detaches the
    // window resize listener, stops all Level 1 audio including grunge4,
    // clears the #game container) -- so nothing from Level 1 keeps
    // running or rendering behind Chapter 2, and Chapter 2 starts into a
    // clean container exactly the way chapter1-gameplay.js always did.
    function goToNextChapter() {
        const next = window.HalloweenGame.chapter2Story;
        if (next && typeof next.start === "function") {
            cleanup();
            next.start();
        } else {
            console.warn("CONTINUE pressed, but window.HalloweenGame.chapter2Story isn't set -- nothing to advance to yet. Make sure chapter2-story.js is loaded on the page and exposes itself as window.HalloweenGame.chapter2Story with a start() method, the same way chapter1-story.js does.");
        }
    }

    // One-shot "WHOOSH!" comic action-effect on a successful FASTER press
    // -- visual feedback only, NOT added to dialogueQueue, NOT a speech
    // bubble. Restarting the CSS animation on an element that's already
    // mid-animation requires the "set to none, force reflow, set to real
    // value" trick below, so rapid repeated presses each get their own
    // clean burst instead of the animation silently no-op'ing.
    function playActionButtonWhoosh() {
        if (!actionButtonWhooshEl) return;
        actionButtonWhooshEl.style.opacity = "1";
        actionButtonWhooshEl.style.animation = "none";
        void actionButtonWhooshEl.offsetWidth; // force reflow so the next line's animation restarts cleanly
        actionButtonWhooshEl.style.animation = "hgWhooshFade " + CONFIG.actionButtonWhooshDuration + "s ease-out forwards";
    }

    // How much faster than base Bill/Bob currently travel -- see
    // CONFIG.walkSpeed/billOutdoorStrollFPS/bobOutdoorStrollFPS getters
    // above, which read this on every access so nothing else needs to
    // poll it. 1.0 at fasterSpeedLevel 0 (unchanged from today), up to
    // 1 + fasterSpeedMaxLevel*fasterSpeedLevelIncrement at max.
    function getFasterSpeedMultiplier() {
        return 1 + fasterSpeedLevel * CONFIG.fasterSpeedLevelIncrement;
    }

    // Called on every FASTER press (see onActionButtonPointerDown) --
    // permanently raises fasterSpeedLevel by one, capped at
    // fasterSpeedMaxLevel, and refreshes the button's fire/glow visual
    // (see updateActionButtonFireVisual) plus a small pop so each press
    // feels like it landed even when already close to the cap. Does NOT
    // touch movement/stop logic at all -- it only changes what
    // CONFIG.walkSpeed reads as, which the existing movement code was
    // already reading fresh every frame.
    function bumpFasterSpeedLevel() {
        if (fasterSpeedLevel < CONFIG.fasterSpeedMaxLevel) {
            fasterSpeedLevel++;
        }
        updateActionButtonFireVisual();
        if (actionButtonHousing) {
            actionButtonHousing.style.animation = "none";
            void actionButtonHousing.offsetWidth; // force reflow so back-to-back presses each restart the pop cleanly
            actionButtonHousing.style.animation = "hgButtonSnap 0.32s ease-out";
        }
    }

    function beginWalking() {
        state = STATE.WALKING;
        currentSpeed = CONFIG.walkSpeed;
        if (startPrompt) startPrompt.style.display = "none";
    }

    /* ------------------------------------------------------------------
       DOUBLE PRESS = ACTION

       One input, three possible outcomes, chosen automatically from the
       nearest upcoming obstacle's configured requiredAction -- the
       player only decides WHEN to press, never WHICH action:
         - "jump"  -> startJump()
         - "smash" -> startSmash()
         - "kick"  -> startKick()
       If nothing is close enough, ACTION just means a normal hustle/dash.
       Returns true/false so callers (see onActionButtonPointerDown, which
       uses this to decide whether to fire the WHOOSH effect) can tell
       whether anything actually happened -- e.g. the dash cooldown can
       still silently block it, exactly as before.
       ------------------------------------------------------------------ */
    function performAction() {
        if (dashCooldownRemaining > 0) return false;

        const nearest = findNearestUnresolvedObstacle();
        if (nearest) {
            const gap = nearest.distance - distanceTraveled;
            if (gap <= CONFIG.actionTriggerDistance) {
                triggerObstacleAction(nearest);
                return true;
            }
        }

        startDash();
        return true;
    }

    function triggerObstacleAction(obstacle) {
        switch (obstacle.requiredAction) {
            case "jump":
                startJump(obstacle);
                break;
            case "smash":
                startSmash(obstacle);
                break;
            case "kick":
                startKick(obstacle);
                break;
            default:
                startDash();
        }
    }

    function findNearestUnresolvedObstacle() {
        if (!CONFIG.obstaclesEnabled) return null; // see CONFIG.obstaclesEnabled -- DOUBLE PRESS always falls through to startDash() below with this off
        let nearest = null;
        let nearestGap = Infinity;
        obstacles.forEach(function (o) {
            if (o.resolved) return;
            const gap = o.distance - distanceTraveled;
            if (gap < -CONFIG.obstacleWidth / 2) return; // already behind us
            if (gap < nearestGap) {
                nearest = o;
                nearestGap = gap;
            }
        });
        return nearest;
    }

    function startDash() {
        state = STATE.DASHING;
        dashTimeRemaining = CONFIG.dashDuration;
    }

    function startJump(obstacle) {
        state = STATE.JUMPING;
        jumpTimeRemaining = CONFIG.jumpDuration;
        resolveObstacleSuccess(obstacle);
    }

    function startSmash(obstacle) {
        state = STATE.SMASHING;
        smashTimeRemaining = CONFIG.smashDuration;
        resolveObstacleSuccess(obstacle);
        impactEffects.push({ distance: obstacle.distance, timeRemaining: CONFIG.impactEffectDuration, kind: "smash" });
    }

    function startKick(obstacle) {
        state = STATE.KICKING;
        kickTimeRemaining = CONFIG.kickDuration;
        resolveObstacleSuccess(obstacle);
        impactEffects.push({ distance: obstacle.distance, timeRemaining: CONFIG.impactEffectDuration, kind: "kick" });
    }

    function resolveObstacleSuccess(obstacle) {
        obstacle.resolved = true;
        obstacle.stumbled = false;

        if (obstacle.rollAway) {
            // Keep it visible a little longer, animating away, instead of
            // just disappearing (see drawStreetObstacles / updateRollingObstacles).
            obstacle.rolling = true;
            obstacle.rollAwayTimer = CONFIG.obstacleRollAwayDuration;
        }
    }

    /* ======================================================================
       MAIN LOOP
       ====================================================================== */
    function tick(now) {
        const dt = Math.min(0.05, (now - lastFrameTime) / 1000); // clamp for tab-switch jumps
        lastFrameTime = now;

        update(dt);
        render();

        if (state !== STATE.FINISHED) {
            rafId = requestAnimationFrame(tick);
        }
    }

    function update(dt) {
        billAnimElapsed += dt; // free-running; never tied to movement speed, see CONFIG.billStrollFPS
        bobAnimElapsed += dt;  // free-running; independent of billAnimElapsed, see CONFIG.bobStrollFPS
        if (dashCooldownRemaining > 0) dashCooldownRemaining -= dt;
        if (livesFlashTimer > 0) livesFlashTimer -= dt;

        switch (state) {
            case STATE.WAITING_TO_START:
                // nothing moves yet
                break;

            case STATE.WALKING:
            case STATE.DASHING:
                updateWalkingOrDashing(dt);
                updateObstacles(dt);
                checkMeetingApproach();
                checkChangingStoreApproach();
                checkDryClubApproach();
                checkAmbientEvents();
                break;

            case STATE.JUMPING:
                updateJumping(dt);
                updateObstacles(dt);
                checkMeetingApproach();
                checkChangingStoreApproach();
                checkDryClubApproach();
                break;

            case STATE.SMASHING:
                updateSmashing(dt);
                updateObstacles(dt);
                checkMeetingApproach();
                checkChangingStoreApproach();
                checkDryClubApproach();
                break;

            case STATE.KICKING:
                updateKicking(dt);
                updateObstacles(dt);
                checkMeetingApproach();
                checkChangingStoreApproach();
                checkDryClubApproach();
                break;

            case STATE.APPROACHING_MEETING:
                updateApproach(dt);
                break;

            case STATE.WAITING_AT_DOOR:
                updateDoorwayWait(dt);
                break;

            case STATE.ENTERING_MEETING:
                updateEnteringMeeting(dt);
                break;

            case STATE.INSIDE_MEETING:
                updateInsideMeeting(dt);
                break;

            case STATE.LEAVING_MEETING:
                updateLeavingMeeting(dt);
                break;

            case STATE.EXITING_MEETING:
                updateExitingMeeting(dt);
                break;

            case STATE.CHANGING_STORE_EVENT:
                updateChangingStoreEvent(dt);
                break;

            case STATE.DRY_CLUB_DIALOGUE:
                updateDryClubDialogue(dt);
                break;

            case STATE.TRANSITIONING:
                updateTransition(dt);
                break;

            case STATE.OUT_OF_LIVES:
                // frozen, waiting for a retry button press
                break;

            case STATE.FINISHED:
                break;
        }

        updateFollower(dt);
        updateDialogue(dt);
        updateCharacterFacing(dt);
        checkSkidDustBurst();
        updateSkidDust(dt);
        updateRunningDust(dt);
        updateEffectsTimers(dt);
        updateActionButtonFireParticles(dt);
        updateChevronBump(dt);
        updateStoryClock(dt);
        updateFictionalClock(dt);
        updateImpactEffects(dt);
        updateAmbientEvents(dt);
        updateRollingObstacles(dt);
    }

    /* ------------------------------------------------------------------
       DISTANCE HELPERS -- the single place that ever changes
       distanceTraveled, so worldScrollDistance can never drift out of
       sync with it.

       ROOT CAUSE OF THE OLD BLINK/TELEPORT, for reference:
       distanceTraveled was being used for two different jobs at once --
       (1) "how far into the CURRENT section have we walked" (needs to
       reset to 0 at each meeting so approach/obstacle/doorway math stays
       simple), and (2) "what scroll phase is the repeating background
       tile / atmosphere parallax at" (must NEVER reset, or the texture
       visibly snaps sideways). advanceToNextSection() reset distanceTraveled
       straight to 0 for job (1), which also yanked job (2) back to 0 in
       the same frame -- so the tiled background and the pumpkin/figure
       parallax both jumped to a different phase instantly, which is the
       actual blink the player saw (not a missing fade -- an actual
       discontinuity in the scroll math). Splitting the two jobs into
       distanceTraveled (resets per section, used by gameplay/section
       logic) and worldScrollDistance (continuous, used only by
       drawTiledBackground/drawEnvironmentAtmosphere) fixes it at the
       source -- see advanceToNextSection() below, which now resets only
       the former.
       ------------------------------------------------------------------ */
    function advanceDistance(delta) {
        distanceTraveled += delta;
        worldScrollDistance += delta;
    }

    function setDistanceTraveled(newValue) {
        worldScrollDistance += (newValue - distanceTraveled);
        distanceTraveled = newValue;
    }

    function updateWalkingOrDashing(dt) {
        if (state === STATE.DASHING) {
            currentSpeed = CONFIG.dashSpeed;
            dashTimeRemaining -= dt;
            if (dashTimeRemaining <= 0) {
                state = STATE.WALKING;
                dashCooldownRemaining = CONFIG.dashCooldown;
                currentSpeed = CONFIG.walkSpeed;
            }
        } else if (stumbleTimeRemaining > 0) {
            stumbleTimeRemaining -= dt;
            currentSpeed = CONFIG.walkSpeed * CONFIG.stumbleSlowFactor;
            if (stumbleTimeRemaining <= 0) {
                currentSpeed = CONFIG.walkSpeed;
            }
        } else {
            currentSpeed = CONFIG.walkSpeed;
        }

        advanceDistance(currentSpeed * dt);
    }

    function updateJumping(dt) {
        // Short, easy, automatic-forward arc. The player only timed the
        // action; the game handles the rest.
        currentSpeed = CONFIG.walkSpeed;
        advanceDistance(currentSpeed * dt);

        jumpTimeRemaining -= dt;
        if (jumpTimeRemaining <= 0) {
            state = STATE.WALKING;
            dashCooldownRemaining = CONFIG.dashCooldown;
            currentSpeed = CONFIG.walkSpeed;
        }
    }

    function updateSmashing(dt) {
        // Keeps walking forward through the obstacle -- the lunge is a
        // purely visual lean (see smashLeanOffset below), not an actual
        // speed change.
        currentSpeed = CONFIG.walkSpeed;
        advanceDistance(currentSpeed * dt);

        smashTimeRemaining -= dt;
        if (smashTimeRemaining <= 0) {
            state = STATE.WALKING;
            dashCooldownRemaining = CONFIG.dashCooldown;
            currentSpeed = CONFIG.walkSpeed;
        }
    }

    function updateKicking(dt) {
        currentSpeed = CONFIG.walkSpeed;
        advanceDistance(currentSpeed * dt);

        kickTimeRemaining -= dt;
        if (kickTimeRemaining <= 0) {
            state = STATE.WALKING;
            dashCooldownRemaining = CONFIG.dashCooldown;
            currentSpeed = CONFIG.walkSpeed;
        }
    }

    function jumpArcOffset() {
        // 0 at takeoff/landing, -jumpHeight at the peak. Negative is "up"
        // in canvas coordinates.
        if (state !== STATE.JUMPING) return 0;
        const progress = 1 - Math.max(0, jumpTimeRemaining / CONFIG.jumpDuration);
        return -Math.sin(progress * Math.PI) * CONFIG.jumpHeight;
    }

    function smashLeanOffset() {
        // 0 at start/end, +smashLungeDistance (forward) at the peak.
        if (state !== STATE.SMASHING) return 0;
        const progress = 1 - Math.max(0, smashTimeRemaining / CONFIG.smashDuration);
        return Math.sin(progress * Math.PI) * CONFIG.smashLungeDistance;
    }

    function kickLegExtension() {
        // 0 at start/end, +kickLegLength at the peak -- used to draw a
        // brief placeholder kicking leg.
        if (state !== STATE.KICKING) return 0;
        const progress = 1 - Math.max(0, kickTimeRemaining / CONFIG.kickDuration);
        return Math.sin(progress * Math.PI) * CONFIG.kickLegLength;
    }

    function updateImpactEffects(dt) {
        impactEffects = impactEffects.filter(function (fx) {
            fx.timeRemaining -= dt;
            return fx.timeRemaining > 0;
        });
    }

    function updateRollingObstacles(dt) {
        obstacles.forEach(function (o) {
            if (!o.rolling) return;
            o.rollAwayTimer -= dt;
            if (o.rollAwayTimer <= 0) {
                o.rolling = false;
            }
        });
    }

    function updateObstacles(dt) {
        if (!CONFIG.obstaclesEnabled) return; // see CONFIG.obstaclesEnabled -- obstacles array is already empty too, this is belt-and-suspenders
        obstacles.forEach(function (o) {
            if (o.spriteConfig) o.spriteElapsed += dt;

            if (o.resolved) return;

            const gap = o.distance - distanceTraveled;

            // Reached (or passed) the obstacle's position without a
            // successful action having already resolved it -- a miss.
            if (gap <= 0) {
                o.resolved = true;
                o.stumbled = true;
                stumbleTimeRemaining = CONFIG.stumbleDuration;
                loseLife();
            }
        });
    }

    function checkMeetingApproach() {
        const meeting = MEETINGS[meetingIndex];
        const distanceToBuilding = getCurrentSectionDistance() - distanceTraveled;
        if (distanceToBuilding <= CONFIG.meetingSlowDistance) {
            state = STATE.APPROACHING_MEETING;
            // TEMP DIAGNOSTIC -- confirms this build's doorway-slide code is
            // actually the one running. Safe to delete once confirmed; fires
            // once per meeting approach, not every frame.
            console.log("[doorway slide] entering APPROACHING_MEETING -- speed multiplier " + CONFIG.doorwaySlideSpeedMultiplier + "x active");
        }
    }

    function updateApproach(dt) {
        const meeting = MEETINGS[meetingIndex];
        const stopDistance = getMeetingApproachStopDistance(meeting);
        const distanceToBuilding = Math.max(0, getCurrentSectionDistance() - distanceTraveled);

        if (distanceToBuilding <= stopDistance) {
            currentSpeed = 0;
            setDistanceTraveled(getCurrentSectionDistance() - stopDistance);
            state = STATE.WAITING_AT_DOOR;
            doorwayWaitTimer = 0;
            // "They arrive" -- dust disappears completely right here,
            // exactly when the doorway slide ends.
            doorwayDustPuffs = [];
            return;
        }

        // Ease speed down as they approach -- simple linear taper, floor at a
        // minimum fraction of walk speed so it still feels like motion.
        // doorwaySlideSpeedMultiplier speeds up ONLY this taper (the visible
        // "slide into the doorway"); CONFIG.walkSpeed itself -- and every
        // other use of it (normal outdoor walking, EXITING_MEETING's own
        // separate ease, etc.) -- is completely untouched.
        const t = 1 - (distanceToBuilding / CONFIG.meetingSlowDistance);
        const minFactor = CONFIG.meetingApproachMinSpeedFactor;
        const factor = Math.max(minFactor, 1 - t);
        currentSpeed = CONFIG.walkSpeed * factor * CONFIG.doorwaySlideSpeedMultiplier;
        advanceDistance(currentSpeed * dt);

        updateDoorwayDust(dt);
    }

    // Dust puff clusters during the doorway slide -- see drawDust for the
    // actual rendering (shared with the skid-stop burst below). Spawn
    // timing/lifetime are tracked here in world/update time; each puff
    // only remembers WHICH character it belongs to plus a small random
    // jitter/size/rotation, and gets resolved to an actual screen
    // position at render time using that frame's real primaryDrawX/
    // followerX -- so the puffs always sit correctly at whichever
    // character's feet, every frame, with no separate position
    // bookkeeping to keep in sync.
    function updateDoorwayDust(dt) {
        doorwayDustSpawnTimer -= dt;
        if (doorwayDustSpawnTimer <= 0) {
            doorwayDustSpawnTimer = CONFIG.doorwayDustSpawnInterval;
            for (let i = 0; i < CONFIG.doorwayDustPuffsPerSpawn; i++) {
                spawnDoorwayDustPuff("bill");
                spawnDoorwayDustPuff("bob");
            }
        }

        for (let i = doorwayDustPuffs.length - 1; i >= 0; i--) {
            doorwayDustPuffs[i].life -= dt;
            if (doorwayDustPuffs[i].life <= 0) {
                doorwayDustPuffs.splice(i, 1);
            }
        }
    }

    function spawnDoorwayDustPuff(belongsTo) {
        doorwayDustPuffs.push({
            belongsTo: belongsTo,
            life: CONFIG.doorwayDustLifeSeconds,
            maxLife: CONFIG.doorwayDustLifeSeconds,
            // Behind the direction of travel (they're moving right, toward
            // the doorway, so "behind" is a negative x offset) and a
            // randomized vertical variance right at ground level, plus a
            // per-puff size/rotation so a cluster never looks like one
            // uniform stamped shape -- see drawDust.
            jitterX: -billRandomRange(6, 26),
            jitterY: billRandomRange(-3, 3),
            sizeScale: billRandomRange(0.8, 1.3),
            rotation: billRandomRange(0, Math.PI * 2)
        });
    }

    // Purely observational: watches currentSpeed every frame (outdoors
    // only) and, the instant it drops from a meaningful speed down to
    // effectively zero -- i.e. Bill/Bob actually coming to a stop,
    // whatever scripted trigger caused it -- fires one big one-time dust
    // burst. Does NOT read or change state/currentSpeed/distanceTraveled
    // itself, so it can never affect the EXISTING stop logic; it only
    // ever reacts a frame after the fact. Bigger burst the faster they
    // were going, which naturally scales with fasterSpeedLevel too since
    // that's what currentSpeed itself was already reading from (see
    // CONFIG.walkSpeed). Skipped while inside a meeting (currentSpeed
    // isn't meaningful there -- interior movement uses its own frac-based
    // system, see billInteriorWalking/bobInteriorWalking) and while the
    // doorway slide's own continuous puffs are already running, so the
    // two effects don't both fire directly on top of each other at a
    // doorway arrival -- the continuous puffs already made that moment
    // busy enough, and get cleared right at arrival (see updateApproach).
    function checkSkidDustBurst() {
        const wasMoving = prevOutdoorSpeedForSkid >= CONFIG.skidDustBurstMinSpeed;
        const nowStopped = currentSpeed <= 1;
        if (wasMoving && nowStopped && state !== STATE.INSIDE_MEETING &&
            state !== STATE.APPROACHING_MEETING && state !== STATE.WAITING_AT_DOOR) {
            spawnSkidDustBurst(prevOutdoorSpeedForSkid);
        }
        prevOutdoorSpeedForSkid = currentSpeed;
    }

    function spawnSkidDustBurst(speedAtStop) {
        // 0 at base walkSpeed, 1 at the fastest FASTER can ever make
        // walkSpeed -- scales both how many puffs spawn and how big each
        // one is, so "at maximum running speed I want a BIG ridiculous
        // skid cloud" scales smoothly rather than jumping straight to max.
        const baseWalkSpeed = 140; // matches CONFIG.walkSpeed's own base -- see that getter's comment
        const maxWalkSpeed = baseWalkSpeed * (1 + CONFIG.fasterSpeedMaxLevel * CONFIG.fasterSpeedLevelIncrement);
        const speedFrac = Math.max(0, Math.min(1, (speedAtStop - baseWalkSpeed) / (maxWalkSpeed - baseWalkSpeed)));
        const puffCount = Math.round(CONFIG.skidDustBurstBasePuffCount +
            speedFrac * (CONFIG.skidDustBurstMaxPuffCount - CONFIG.skidDustBurstBasePuffCount));

        // Extra size boost that only really kicks in near the very top of
        // the speed range, on top of the existing (1 + speedFrac*0.5)
        // growth below -- this is what pushes a genuinely max-speed stop
        // into "absurd cartoon smoke explosion, briefly waist/chest height"
        // territory without inflating ordinary mid-speed stops.
        const extraSizeBoost = 1 + Math.pow(speedFrac, 3) * (CONFIG.skidCloudMaxSizeBoost - 1);

        ["bill", "bob"].forEach(function (who) {
            for (let i = 0; i < puffCount; i++) {
                // DIRECTIONAL: most puffs explode backward (behind the
                // direction of travel -- Bill/Bob always run screen-right
                // in this level, so "behind" is negative x, same
                // convention as the doorway zip puffs), a minority land
                // forward around/in front of their feet. See
                // CONFIG.skidCloudBackwardBias.
                const goesBackward = Math.random() < CONFIG.skidCloudBackwardBias;
                const spread = billRandomRange(6, 30) * (1 + speedFrac * 0.6);
                const jitterX = goesBackward ? -spread : spread * 0.6; // forward puffs stay a bit tighter to the feet

                skidDustPuffs.push({
                    belongsTo: who,
                    life: CONFIG.skidDustBurstLifeSeconds,
                    maxLife: CONFIG.skidDustBurstLifeSeconds,
                    // Wider spread than a single zip puff, and puffs land
                    // on BOTH sides of the character (a real skid kicks up
                    // dust behind AND out to the sides), covering roughly
                    // their lower half rather than one spot at the feet.
                    jitterX: jitterX,
                    jitterY: billRandomRange(-14, 4),
                    sizeScale: billRandomRange(0.9, 1.6) * (1 + speedFrac * 0.5) * extraSizeBoost,
                    rotation: billRandomRange(0, Math.PI * 2),
                    isBurst: true // bigger draw formula than a zip puff -- see drawDust
                });
            }
        });

        // High/max-speed stop only: maybe a "SKRRRT!" comic pop, and
        // always a tiny non-positional camera bump -- see
        // CONFIG.skidCloudHighSpeedThreshold / skrrrtChance /
        // cameraBumpDuration. Both purely decorative, see
        // spawnSkrrrtEffect/applyCameraBumpTransform.
        if (speedFrac >= CONFIG.skidCloudHighSpeedThreshold) {
            if (Math.random() < CONFIG.skrrrtChance) {
                spawnSkrrrtEffect();
            }
            cameraBumpTimer = CONFIG.cameraBumpDuration;
        }
    }

    function updateSkidDust(dt) {
        for (let i = skidDustPuffs.length - 1; i >= 0; i--) {
            skidDustPuffs[i].life -= dt;
            if (skidDustPuffs[i].life <= 0) {
                skidDustPuffs.splice(i, 1);
            }
        }
    }

    // ------------------------------------------------------------------
    // RUNNING FOOT DUST -- small, occasional puffs kicked up behind
    // Bill/Bob's feet while they're actually covering ground outdoors at
    // an elevated FASTER level. Purely observational (reads state/
    // currentSpeed/fasterSpeedLevel, never sets them), so it can never
    // affect movement or stop position -- same guarantee as
    // checkSkidDustBurst above. Skipped entirely below
    // CONFIG.runningDustMinLevel so normal-speed walking stays exactly as
    // before (no dust at all, matching the previous behavior).
    // ------------------------------------------------------------------
    function updateRunningDust(dt) {
        const isRunningOutdoors = (state === STATE.WALKING || state === STATE.DASHING) &&
            fasterSpeedLevel >= CONFIG.runningDustMinLevel && currentSpeed > 1;

        if (isRunningOutdoors) {
            const levelFrac = fasterSpeedLevel / CONFIG.fasterSpeedMaxLevel;
            const interval = CONFIG.runningDustSpawnInterval -
                (CONFIG.runningDustSpawnInterval - CONFIG.runningDustMinSpawnInterval) * levelFrac;

            ["bill", "bob"].forEach(function (who) {
                runningDustSpawnTimer[who] -= dt;
                if (runningDustSpawnTimer[who] <= 0) {
                    runningDustSpawnTimer[who] = interval;
                    if (Math.random() < CONFIG.runningDustPuffChance) {
                        spawnRunningDustPuff(who);
                    }
                }
            });
        } else {
            runningDustSpawnTimer.bill = 0;
            runningDustSpawnTimer.bob = 0;
        }

        for (let i = runningDustPuffs.length - 1; i >= 0; i--) {
            runningDustPuffs[i].life -= dt;
            if (runningDustPuffs[i].life <= 0) {
                runningDustPuffs.splice(i, 1);
            }
        }
    }

    function spawnRunningDustPuff(belongsTo) {
        // Small and right at the trailing foot -- much smaller than a
        // skid-stop burst puff (see spawnSkidDustBurst), just enough to
        // visually connect the running character to the ground.
        runningDustPuffs.push({
            belongsTo: belongsTo,
            life: CONFIG.runningDustLifeSeconds,
            maxLife: CONFIG.runningDustLifeSeconds,
            jitterX: -billRandomRange(2, 12), // trails slightly behind -- same "behind = negative x" convention as the doorway/skid puffs
            jitterY: billRandomRange(-2, 2),
            sizeScale: billRandomRange(0.35, 0.55),
            rotation: billRandomRange(0, Math.PI * 2),
            isRunning: true // smallest draw formula in drawDust
        });
    }

    // ------------------------------------------------------------------
    // Comic-book horizontal speed streaks, drawn fresh every frame
    // directly from currentSpeed/fasterSpeedLevel -- no particle array,
    // so they're simply not drawn (not "faded out", just absent) the
    // instant Bill/Bob stop moving. Purely decorative, drawn behind the
    // characters (see renderOutdoorScene call order) so they never
    // obscure Bill/Bob or the environment. billX/bobX are the same
    // on-screen draw positions drawDust already uses.
    // ------------------------------------------------------------------
    function drawSpeedLines(billX, bobX, groundY) {
        if (!(state === STATE.WALKING || state === STATE.DASHING)) return;
        if (fasterSpeedLevel < CONFIG.speedLineMinLevel || currentSpeed <= 1) return;

        const levelFrac = Math.min(1, fasterSpeedLevel / CONFIG.fasterSpeedMaxLevel);
        const count = Math.round(1 + levelFrac * (CONFIG.speedLineMaxCount - 1));
        const length = CONFIG.speedLineBaseLength + levelFrac * (CONFIG.speedLineMaxLength - CONFIG.speedLineBaseLength);
        const opacity = CONFIG.speedLineBaseOpacity + levelFrac * (CONFIG.speedLineMaxOpacity - CONFIG.speedLineBaseOpacity);

        // A slow, free-running phase (not tied to a spawn/despawn array)
        // so the streaks gently drift rather than sitting perfectly
        // static -- purely cosmetic, has no bearing on anything else.
        const phase = billAnimElapsed * 6;

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255," + opacity.toFixed(2) + ")";
        ctx.lineCap = "round";

        [
            { x: billX, y: groundY - 46, seed: 0 },
            { x: billX, y: groundY - 30, seed: 1.7 },
            { x: bobX, y: groundY - 46, seed: 3.1 },
            { x: bobX, y: groundY - 30, seed: 4.6 }
        ].forEach(function (origin, oi) {
            for (let i = 0; i < count; i++) {
                const wobble = Math.sin(phase + origin.seed + i * 1.3) * 3;
                const lineLen = length * (0.7 + 0.3 * Math.sin(phase * 1.3 + i));
                const startX = origin.x - 14 - i * 10; // trailing behind (screen-left), never in front
                const y = origin.y + wobble + (oi % 2) * 2;
                ctx.lineWidth = 1.5 + levelFrac * 1.2;
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(startX - lineLen, y);
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    // ------------------------------------------------------------------
    // Optional one-shot comic "SKRRRT!" lettering + the tiny max-speed
    // camera bump -- both only ever considered from spawnSkidDustBurst
    // below, on an actual high/max-speed stop. See CONFIG.skrrrtChance /
    // skidCloudHighSpeedThreshold / cameraBumpDuration.
    // ------------------------------------------------------------------
    function spawnSkrrrtEffect() {
        skrrrtEffect = {
            life: CONFIG.skrrrtLifeSeconds,
            maxLife: CONFIG.skrrrtLifeSeconds
        };
    }

    // billX/bobX/groundY are the same actual on-screen draw positions
    // drawDust already receives that frame -- computed at draw time
    // (rather than stored at spawn time in update()) so the lettering
    // always tracks wherever Bill/Bob actually are, same as the dust
    // puffs it appears alongside.
    function drawSkrrrtEffect(billX, bobX, groundY) {
        if (!skrrrtEffect) return;
        // Same "don't measure/draw in a font that hasn't actually
        // loaded yet" rule as dialogue -- see isSkrrrtFontReady()/the
        // DIALOGUE FONTS block near the top of the file. SKRRRT! has no
        // wrapping/measuring step, but waiting keeps it visually
        // consistent with the rest of the comic lettering rather than
        // popping in Bangers a frame after everything else.
        if (!isSkrrrtFontReady()) return;
        const t = 1 - Math.max(0, skrrrtEffect.life / skrrrtEffect.maxLife);
        const alpha = 1 - t;
        if (alpha <= 0.02) return;
        const bounce = Math.sin(Math.min(1, t * 3) * Math.PI * 0.5); // quick pop in, then holds/fades
        const scale = 0.7 + bounce * 0.4;
        const x = (billX + bobX) / 2 - 10;
        const y = groundY - 60;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y - t * 10); // drifts up slightly as it fades, like comic lettering
        ctx.rotate(-0.08);
        ctx.scale(scale, scale);
        ctx.textAlign = "center";
        ctx.font = "bold 26px " + getSkrrrtFontFamily();
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#0a0a0a";
        ctx.strokeText("SKRRRT!", 0, 0);
        ctx.fillStyle = "#fff6c2";
        ctx.fillText("SKRRRT!", 0, 0);
        ctx.restore();
    }

    // Small canvas-element-only transform "thud" on the very biggest
    // stops -- 1-2 frames of a couple px offset that immediately eases
    // back to nothing. Applied to the CANVAS ELEMENT's own CSS transform,
    // never to anything inside the drawing space itself, so it cannot
    // touch world coordinates, Bill/Bob's x/y, or any hit-testing math
    // (all of which happen in logical/canvas space, not CSS space).
    function applyCameraBumpTransform() {
        if (!canvas) return;
        if (cameraBumpTimer <= 0) {
            canvas.style.transform = "";
            return;
        }
        const t = cameraBumpTimer / CONFIG.cameraBumpDuration; // 1 -> 0
        const offset = CONFIG.cameraBumpMaxOffsetPx * t;
        canvas.style.transform = "translate(0px, " + offset.toFixed(1) + "px)";
    }

    function updateEffectsTimers(dt) {
        if (skrrrtEffect) {
            skrrrtEffect.life -= dt;
            if (skrrrtEffect.life <= 0) skrrrtEffect = null;
        }
        if (cameraBumpTimer > 0) {
            cameraBumpTimer -= dt;
            if (cameraBumpTimer < 0) cameraBumpTimer = 0;
        }
        applyCameraBumpTransform();
    }

    /* ======================================================================
       CHANGING STORE STORY EVENT (building6.png)

       Automatic, non-meeting story beat: Bill and Bob walk up to the
       store, pause for ChangingStore-level1/pt1, zip inside (reusing the
       exact same doorway-slide + dust mechanics as a real meeting
       doorway), stay hidden a beat while their sprites swap, then emerge
       in their new outfits for ChangingStore-level1/pt2 before normal
       outdoor control resumes. See CHANGING_STORE for placement and
       CONFIG.changingStore* for all the timing knobs.

       Deliberately state-machine'd as ONE game STATE
       (STATE.CHANGING_STORE_EVENT) with its own internal
       changingStorePhase, rather than several new top-level STATEs, so
       none of the existing switch(state) call sites elsewhere in the
       file (meeting approach, doorway wait, obstacles, etc.) need to
       know anything about it.
       ------------------------------------------------------------------ */
    function checkChangingStoreApproach() {
        if (changingStoreCompleted) return;
        const meeting = MEETINGS[meetingIndex];
        if (!meeting || meeting.id !== CHANGING_STORE.section) return;
        const distanceToStore = CHANGING_STORE.distance - distanceTraveled;
        if (distanceToStore <= CONFIG.meetingSlowDistance) {
            state = STATE.CHANGING_STORE_EVENT;
            changingStorePhase = "approach";
        }
    }

    function loadChangingStoreDialogue(pointKey) {
        const scriptEntries = getScriptDialogue("ChangingStore-level1", pointKey);
        if (scriptEntries) {
            loadDialogueQueueFromScriptEntries(scriptEntries);
            return;
        }
        // No script.js content yet for this point -- proceed with an
        // empty queue rather than soft-locking the event waiting on
        // dialogue that will never arrive.
        dialogueQueue = [];
        activeBubble = null;
        dialogueTimer = 0;
    }

    function getChangingStoreDoorwayScreenRect(w, h, primaryX) {
        const x = worldToScreenX(CHANGING_STORE.distance, primaryX);
        const geo = getBuildingRenderGeometry(CHANGING_STORE, w, h, x);
        return computeDoorwayRectFromGeometry(CHANGING_STORE, geo);
    }

    function updateChangingStoreEvent(dt) {
        switch (changingStorePhase) {

            case "approach": {
                // Plain slow-and-stop -- NOT the sped-up doorway slide.
                // Per spec Bill and Bob stop and talk BEFORE the quick
                // zip happens, so this intentionally does not use
                // doorwaySlideSpeedMultiplier or spawn dust (compare
                // updateApproach, which does both for the meeting case).
                const distanceToStore = Math.max(0, CHANGING_STORE.distance - distanceTraveled);
                if (distanceToStore <= CONFIG.meetingStopDistance) {
                    currentSpeed = 0;
                    setDistanceTraveled(CHANGING_STORE.distance - CONFIG.meetingStopDistance);
                    follower.offset = CONFIG.followerDistance;
                    follower.state = FOLLOWER_STATE.FOLLOWING;
                    changingStorePhase = "dialogue1";
                    changingStoreTimer = -1; // post-dialogue pause hasn't started counting yet
                    loadChangingStoreDialogue("pt1");
                    break;
                }
                const t = 1 - (distanceToStore / CONFIG.meetingSlowDistance);
                const factor = Math.max(CONFIG.meetingApproachMinSpeedFactor, 1 - t);
                currentSpeed = CONFIG.walkSpeed * factor;
                advanceDistance(currentSpeed * dt);
                break;
            }

            case "dialogue1": {
                currentSpeed = 0;
                const dialogueDone = (dialogueQueue.length === 0 && !activeBubble);
                if (!dialogueDone) {
                    changingStoreTimer = -1;
                    break;
                }
                if (changingStoreTimer < 0) {
                    changingStoreTimer = CONFIG.interiorPostDialoguePause;
                    break;
                }
                changingStoreTimer -= dt;
                if (changingStoreTimer <= 0) {
                    changingStorePhase = "entering";
                    doorwayDustPuffs = [];
                    doorwayDustSpawnTimer = 0;
                }
                break;
            }

            case "entering": {
                // The quick "zip through the doorway" -- same mechanics as
                // a meeting's own doorway slide (elevated speed + dust),
                // just covering the short remaining gap down to the door.
                const distanceToStore = Math.max(0, CHANGING_STORE.distance - distanceTraveled);
                if (distanceToStore <= 2) {
                    currentSpeed = 0;
                    setDistanceTraveled(CHANGING_STORE.distance);
                    doorwayDustPuffs = [];
                    changingStorePhase = "hidden";
                    changingStoreTimer = CONFIG.changingStoreTransformDelay;
                    // The pause itself is the joke -- swap sprites the
                    // instant they're both fully hidden, not after.
                    billAppearance = "costume2";
                    bobAppearance = "costume2";
                    // The clothing-change sequence is now underway -- the
                    // beforeFreshThreads gameplay track fades out and is
                    // permanently retired here, per the Fresh Threads audio
                    // spec ("as soon as ... the clothing-change sequence
                    // begins"). See the AUDIO section near the bottom of
                    // the file.
                    beginFreshThreadsMusicFadeOut();
                    break;
                }
                const t = 1 - (distanceToStore / CONFIG.meetingStopDistance);
                const factor = Math.max(CONFIG.meetingApproachMinSpeedFactor, 1 - t);
                currentSpeed = CONFIG.walkSpeed * factor * CONFIG.doorwaySlideSpeedMultiplier;
                advanceDistance(currentSpeed * dt);
                updateDoorwayDust(dt);
                break;
            }

            case "hidden": {
                // No interior, no loading screen, no UI -- just an empty
                // beat outside the same exterior art. See renderOutdoorScene,
                // which skips drawing Bill/Bob entirely for this phase.
                currentSpeed = 0;
                changingStoreTimer -= dt;
                if (changingStoreTimer <= 0) {
                    changingStorePhase = "emerging";
                    changingStoreTimer = CONFIG.changingStoreEmergeStepDuration;
                    setAudioMode("freshSting"); // plays fresh.mp3 alone (beforeFreshThreads music is already gone for good, see beginFreshThreadsMusicFadeOut) -- afterFreshThreads music fades in partway through and carries on once the sting finishes, see the AUDIO section near the bottom of the file
                    // Reappear at the same spot they stood before entering
                    // -- render eases them visually out from the doorway
                    // from there (see the CHANGING_STORE_EVENT branch in
                    // renderOutdoorScene).
                    setDistanceTraveled(CHANGING_STORE.distance - CONFIG.meetingStopDistance);
                    follower.offset = CONFIG.followerDistance;
                    follower.state = FOLLOWER_STATE.FOLLOWING;
                }
                break;
            }

            case "emerging": {
                currentSpeed = 0; // the visual doorway-to-standing-spot ease happens in renderOutdoorScene
                changingStoreTimer -= dt;
                if (changingStoreTimer <= 0) {
                    changingStorePhase = "reveal";
                    changingStoreTimer = CONFIG.changingStoreRevealWalkDuration;
                }
                break;
            }

            case "reveal": {
                // A short walk clear of the door so both new costumes are
                // fully visible and Bill/Bob don't overlap.
                currentSpeed = CONFIG.walkSpeed;
                advanceDistance(currentSpeed * dt);
                changingStoreTimer -= dt;
                if (changingStoreTimer <= 0) {
                    currentSpeed = 0;
                    changingStorePhase = "pauseBeforeDialogue2";
                    changingStoreTimer = CONFIG.changingStoreCostumeRevealPause;
                }
                break;
            }

            case "pauseBeforeDialogue2": {
                currentSpeed = 0;
                changingStoreTimer -= dt;
                if (changingStoreTimer <= 0) {
                    changingStorePhase = "dialogue2";
                    loadChangingStoreDialogue("pt2");
                }
                break;
            }

            case "dialogue2": {
                currentSpeed = 0;
                if (dialogueQueue.length === 0 && !activeBubble) {
                    // Straight into the brief arms-crossed punctuation beat
                    // -- see isBillArmsCrossedActive/BILL_ARMSCROSSED_FRAMES
                    // in drawBillCharacter -- rather than completing the
                    // event outright. changingStoreCompleted/state/
                    // currentSpeed are only set once THAT beat finishes,
                    // below.
                    changingStorePhase = "armsCrossedPose";
                    changingStoreTimer = CONFIG.changingStoreArmsCrossedDuration;
                }
                break;
            }

            case "armsCrossedPose": {
                // Bill remains exactly where he's standing -- same spot as
                // the dialogue that just finished, world coordinates
                // untouched -- while drawBillCharacter plays the Row 2
                // arms-crossed transition and then holds the pose for the
                // remainder of this short beat. Purely a visual punctuation
                // mark on the Fresh Threads joke; nothing here can hold up
                // gameplay since it's a fixed short timer, not tied to
                // dialogue.
                currentSpeed = 0;
                changingStoreTimer -= dt;
                if (changingStoreTimer <= 0) {
                    changingStoreCompleted = true;
                    changingStorePhase = null;
                    state = STATE.WALKING;
                    currentSpeed = CONFIG.walkSpeed;
                }
                break;
            }

            default:
                // Safety net -- should never happen, but never soft-lock
                // gameplay on a bad/unknown phase.
                changingStoreCompleted = true;
                changingStorePhase = null;
                state = STATE.WALKING;
                currentSpeed = CONFIG.walkSpeed;
                break;
        }
    }

    /* ======================================================================
       DRY PEOPLE'S CLUB DIALOGUE STOP

       Small scripted beat at the existing decorative landmark: approach,
       slow gradually (same easing curve updateApproach() uses for real
       meeting doorways), stop with the club CENTERED in the viewport
       (see getLandmarkCenterStopOffset -- the club's own world position/
       DRY_CLUB_STOP.distance is untouched, only the stop point relative
       to it), play DryPeoplesClub-level1/pt1, resume normal control. See
       DRY_CLUB_STOP for placement.

       Two phases under one STATE.DRY_CLUB_DIALOGUE (dryClubPhase --
       "approach" then "dialogue"), the same "one state, an internal
       phase string" pattern CHANGING_STORE_EVENT/changingStorePhase
       already uses, rather than adding a whole new top-level STATE.

       Player input is blocked the same way it already is during every
       other non-WALKING/DASHING state: onCanvasPointerDown only acts
       during STATE.WAITING_AT_DOOR, and performAction()/startDash() are
       simply never called while state is anything other than one the
       button handler checks for walking -- see onActionButtonPointerDown.
       Being in STATE.DRY_CLUB_DIALOGUE is enough on its own; no separate
       "input enabled" flag exists anywhere else in the file to touch.
       ------------------------------------------------------------------ */
    function checkDryClubApproach() {
        if (dryClubCompleted) return;
        const meeting = MEETINGS[meetingIndex];
        if (!meeting || meeting.id !== DRY_CLUB_STOP.section) return;
        const distanceToStop = DRY_CLUB_STOP.distance - distanceTraveled;
        if (distanceToStop <= CONFIG.meetingSlowDistance) {
            state = STATE.DRY_CLUB_DIALOGUE;
            dryClubPhase = "approach";
        }
    }

    function loadDryClubDialogue(pointKey) {
        const scriptEntries = getScriptDialogue("DryPeoplesClub-level1", pointKey);
        if (scriptEntries) {
            loadDialogueQueueFromScriptEntries(scriptEntries);
            return;
        }
        // No script.js content yet -- proceed with an empty queue rather
        // than soft-locking on dialogue that will never arrive.
        dialogueQueue = [];
        activeBubble = null;
        dialogueTimer = 0;
    }

    function updateDryClubDialogue(dt) {
        if (dryClubPhase === "approach") {
            // Gradual slow-and-stop, same easing curve updateApproach()
            // uses for real meeting doorways (eased on distance to the
            // landmark's own anchor -- matches the existing EA/CMA
            // precedent, see getMeetingApproachStopDistance) -- instead of
            // the old instant full-speed halt. Stops with the club
            // CENTERED in the viewport (getLandmarkCenterStopOffset)
            // rather than the old fixed 70px-before-anchor gap, which put
            // Bill/Bob well past the club's visual center before the
            // conversation began.
            const distanceToClub = Math.max(0, DRY_CLUB_STOP.distance - distanceTraveled);
            const stopOffset = getLandmarkCenterStopOffset();
            if (distanceToClub <= stopOffset) {
                currentSpeed = 0;
                setDistanceTraveled(DRY_CLUB_STOP.distance - stopOffset);
                dryClubPhase = "dialogue";
                loadDryClubDialogue("pt1");
                return;
            }
            const t = 1 - (distanceToClub / CONFIG.meetingSlowDistance);
            const factor = Math.max(CONFIG.meetingApproachMinSpeedFactor, 1 - t);
            currentSpeed = CONFIG.walkSpeed * factor;
            advanceDistance(currentSpeed * dt);
            return;
        }

        // dryClubPhase === "dialogue"
        currentSpeed = 0;
        if (dialogueQueue.length === 0 && !activeBubble) {
            dryClubCompleted = true;
            dryClubPhase = null;
            state = STATE.WALKING;
            currentSpeed = CONFIG.walkSpeed;
        }
    }

    /* ======================================================================
       AMBIENT SCENERY -- cats/trash/leaves. See AMBIENT_EVENTS above for
       the placement data and the big comment there for why. Pure visual
       atmosphere: check-spawn-update-draw, no gameplay effect at all.
       ------------------------------------------------------------------ */
    // row = which row of level1-visuals.png; the rest are pulled from
    // CONFIG so all the timing/size knobs stay in one place.
    const AMBIENT_TYPE_CONFIG = {
        walkingCat: { row: 0, duration: CONFIG.ambientCatWalkDuration, frameDuration: CONFIG.ambientFrameDuration, displayHeight: CONFIG.ambientCatDisplayHeight, wobble: false },
        runningCat: { row: 1, duration: CONFIG.ambientCatRunDuration, frameDuration: CONFIG.ambientRunFrameDuration, displayHeight: CONFIG.ambientCatDisplayHeight, wobble: false },
        trash: { row: 2, duration: CONFIG.ambientDebrisDuration, frameDuration: CONFIG.ambientFrameDuration, displayHeight: CONFIG.ambientDebrisDisplayHeight, wobble: true },
        leaves: { row: 3, duration: CONFIG.ambientDebrisDuration * 1.1, frameDuration: CONFIG.ambientFrameDuration, displayHeight: CONFIG.ambientDebrisDisplayHeight, wobble: true }
    };
    const AMBIENT_SHEET_COLS = 5;
    const AMBIENT_SHEET_ROWS = 4;
    const AMBIENT_CELL = 256; // known uniform grid -- see the big comment on ASSETS.level1Visuals; deliberately NOT auto-detected

    // Only spawns NEW events while actually walking/dashing outdoors (see
    // the switch(state) call sites) -- never mid-approach, mid-dialogue,
    // inside a meeting, or during the changing store/Dry People's Club
    // beats, so an ambient object can never appear on top of one of
    // those. Already-active ones still animate to completion regardless
    // of state (see updateAmbientEvents), same "let it finish naturally"
    // approach as impact effects.
    function checkAmbientEvents() {
        sectionAmbientEvents.forEach(function (e) {
            if (e.fired) return;
            if (distanceTraveled >= e.distance) {
                e.fired = true;
                spawnAmbientEvent(e.type, e.direction);
            }
        });
    }

    function spawnAmbientEvent(type, direction) {
        const cfg = AMBIENT_TYPE_CONFIG[type];
        if (!cfg) return; // unknown type in the data table -- ignore rather than throw
        activeAmbientEvents.push({
            type: type,
            direction: direction, // "rightToLeft" | "leftToRight"
            elapsed: 0,
            duration: cfg.duration,
            frameDuration: cfg.frameDuration,
            displayHeight: cfg.displayHeight,
            wobble: cfg.wobble
        });
    }

    // Pure local-screen-space motion (off-screen edge to off-screen edge
    // over `duration`, linearly) -- deliberately NOT tied to
    // distanceTraveled/world-scroll like buildings/houses are. These are
    // ordinary walk/darting/drifting movements across the visible scene,
    // not scenery fixed at a world position, so this is simpler and
    // matches "no complicated particle physics."
    function updateAmbientEvents(dt) {
        activeAmbientEvents = activeAmbientEvents.filter(function (a) {
            a.elapsed += dt;
            return a.elapsed < a.duration; // fully crossed the screen -- deactivate/remove, never accumulates
        });
    }

    function drawAmbientEvents(w, h) {
        if (activeAmbientEvents.length === 0) return;
        const usingSheet = !!(level1VisualsImage && level1VisualsImage.loaded &&
            level1VisualsImage.naturalWidth > 0 && level1VisualsImage.naturalHeight > 0);
        if (!usingSheet) return; // no placeholder shape for these -- purely decorative, fine to just not draw until the art exists

        const groundY = outdoorGroundY(h);
        const cellW = level1VisualsImage.naturalWidth / AMBIENT_SHEET_COLS;
        const cellH = level1VisualsImage.naturalHeight / AMBIENT_SHEET_ROWS;
        const margin = CONFIG.ambientOffscreenMargin;

        activeAmbientEvents.forEach(function (a) {
            const cfg = AMBIENT_TYPE_CONFIG[a.type];
            const progress = Math.min(1, a.elapsed / a.duration);
            const startX = (a.direction === "rightToLeft") ? (w + margin) : -margin;
            const endX = (a.direction === "rightToLeft") ? -margin : (w + margin);
            const x = startX + (endX - startX) * progress;

            const displayHeight = a.displayHeight;
            const displayWidth = displayHeight * (cellW / cellH);
            const wobbleY = a.wobble ? Math.sin(a.elapsed * CONFIG.ambientDebrisWobbleFrequency) * CONFIG.ambientDebrisWobbleAmplitude : 0;
            const destY = groundY - displayHeight + wobbleY;
            const destX = x - displayWidth / 2;

            const frame = Math.floor(a.elapsed / a.frameDuration) % AMBIENT_SHEET_COLS;
            const srcX = frame * AMBIENT_CELL;
            const srcY = cfg.row * AMBIENT_CELL;

            ctx.save();
            const wasSmoothing = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = false;
            // Mirror for leftToRight rather than needing a second
            // animation set -- same technique already used for Bill/Bob
            // facing left (see drawBillCharacter).
            if (a.direction === "leftToRight") {
                ctx.translate(destX + displayWidth, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(level1VisualsImage.image, srcX, srcY, AMBIENT_CELL, AMBIENT_CELL, 0, destY, displayWidth, displayHeight);
            } else {
                ctx.drawImage(level1VisualsImage.image, srcX, srcY, AMBIENT_CELL, AMBIENT_CELL, destX, destY, displayWidth, displayHeight);
            }
            ctx.imageSmoothingEnabled = wasSmoothing;
            ctx.restore();
        });
    }

    function updateDoorwayWait(dt) {
        // Just accumulates time so shouldShowDoorwayHint() knows when to
        // reveal the pointer. Nothing else happens here -- the player is
        // free to tap the doorway at any point, hint or not.
        doorwayWaitTimer += dt;
    }

    function shouldShowDoorwayHint() {
        const delay = hasLearnedDoorway ? CONFIG.doorwayHintDelayLearned : CONFIG.doorwayHintDelayFirst;
        return doorwayWaitTimer >= delay;
    }

    function enterMeeting() {
        if (state !== STATE.WAITING_AT_DOOR) return;
        hasLearnedDoorway = true;
        state = STATE.ENTERING_MEETING;
        finishTimer = CONFIG.transitionDuration;
    }

    function updateEnteringMeeting(dt) {
        // Screen fades to black as they step through the doorway. Once it's
        // fully faded, they're "inside" -- hand off to the inside-meeting
        // sequence rather than immediately jumping to the next section.
        finishTimer -= dt;
        if (finishTimer <= 0) {
            enterInsideMeeting();
        }
    }

    function enterInsideMeeting() {
        state = STATE.INSIDE_MEETING;
        insideElapsed = 0;
        insideFadeTimer = CONFIG.insideFadeDuration;
        setAudioMode("meeting"); // ducks gameplay music, starts meeting-chatter.mp3 -- see the AUDIO section near the bottom of the file
        // Dialogue is no longer loaded up-front here -- each "dialoguePoint"
        // step in the interior sequence below loads its own point (pt1,
        // pt2, pt3...) exactly when Bill and Bob actually stop at that
        // waypoint, so lines fire in sync with the choreography instead of
        // all queuing up the instant the meeting starts.
        activeBubble = null;
        dialogueQueue = [];
        dialogueTimer = 0;

        // Spawn Bill and Bob near the entrance and hand off to the
        // choreographed cinematic -- see updateInteriorSequence.
        const meetingId = MEETINGS[meetingIndex].id;
        // scene-timer: <seconds> from script.js (see parseScriptText) drives
        // how long this meeting scene is allowed to run before the safety-net
        // exit kicks in -- falls back to CONFIG.insideMeetingMaxDuration if
        // this section has no scene-timer configured yet.
        const configuredSceneTimer = getSceneTimer(getMeetingLabelById(meetingId) + "-level1");
        insideMeetingMaxDurationActive = (typeof configuredSceneTimer === "number")
            ? configuredSceneTimer
            : CONFIG.insideMeetingMaxDuration;

        // Fictional HUD story clock: re-anchor to this meeting's script.js
        // "clock:" value if one is set, completely independent of
        // scene-timer above -- changing one never affects the other. If
        // this section has no clock: yet, leave the clock exactly where it
        // already is and let it keep counting down (no reset).
        const configuredClockSeconds = getScriptClockSeconds(getMeetingLabelById(meetingId) + "-level1");
        if (typeof configuredClockSeconds === "number") {
            storyClockSecondsRemaining = configuredClockSeconds;
        }
        const cfg = getInteriorConfig(meetingId);
        activeInteriorConfig = cfg; // resolved once per meeting entry -- read by the "walk" step (walkSpeedMultiplier) and updateDialogue (chatterOverlapChance/reactionChance)
        billInteriorFrac = cfg.entranceFrac;
        billInteriorMoveDir = 1; // spawns facing right, into the room
        billInteriorTurning = false;
        bobInteriorFrac = Math.max(0, cfg.entranceFrac - CONFIG.interiorBobRestGapFrac);
        bobInteriorMoveDir = 1;
        bobInteriorTurning = false;
        bobInteriorTurnTimer = 0;
        billFacingLeft = false;
        bobFacingLeft = false;
        interiorCameraFrac = 0;
        interiorSequence = buildInteriorSequence(meetingId);
        interiorStepIndex = 0;
        interiorStepTimer = 0;
        billInteriorWalking = false;
        bobInteriorWalking = false;
        bobAmbientActiveAction = null;
        bobAmbientElapsed = 0;
        bobAmbientLastAction = null;
        bobAmbientCooldownRemaining = 0;
        // Locked in once, right here, for the whole meeting -- see
        // pickTwoRandomBobAmbientActions/updateBobAmbientAction. Empty for
        // AA (and any other non-eligible meeting), which is what keeps
        // Bob's supplemental actions out of AA entirely.
        bobAmbientSelectedActions = BOB_AMBIENT_ELIGIBLE_MEETINGS.indexOf(meetingId) !== -1
            ? pickTwoRandomBobAmbientActions()
            : [];
    }

    function updateInsideMeeting(dt) {
        if (insideFadeTimer > 0) {
            insideFadeTimer -= dt;
        }
        insideElapsed += dt;

        // Absolute safety net -- unchanged in spirit from before, except the
        // cap itself now comes from this meeting's script.js scene-timer
        // when one is set (see insideMeetingMaxDurationActive, resolved once
        // in enterInsideMeeting), falling back to CONFIG.insideMeetingMaxDuration
        // otherwise. If the choreographed scene or a dialogue entry is ever
        // misconfigured badly enough that we're still here after that cap,
        // leave immediately rather than soft-locking, wherever the
        // cinematic sequence currently happens to be.
        if (insideElapsed >= insideMeetingMaxDurationActive) {
            beginLeavingMeeting();
            return;
        }

        updateInteriorSequence(dt);
    }

    /* ======================================================================
       MEETING INTERIOR CINEMATIC ENGINE

       Reusable "SNES cutscene" system that drives Bill and Bob while
       state === STATE.INSIDE_MEETING. A meeting's own choreography is
       just a list of steps (see buildInteriorSequence); this engine
       walks through them, moving Bill, easing Bob along behind/near him,
       and keeping the camera framed with a soft deadzone follow -- the
       same code runs for every meeting because every position is a
       fraction of that meeting's own background width (see
       getInteriorBackgroundScaledWidth), not a hardcoded pixel value.

       This never touches outdoor Bill/Bob position, outdoor scale,
       outdoor camera, movement, collision, or the existing dialogue
       system -- the "holdForScene" step below simply waits on the exact
       same dialogueFullyPlayed/insideMeetingMinDuration condition the
       game already used to decide when to leave a meeting, so any
       dialogue already configured for a meeting keeps working exactly
       as it did before this system existed.
       ====================================================================== */
    function getInteriorConfig(meetingId) {
        const overrides = MEETING_INTERIOR_CONFIG[meetingId] || {};
        return {
            entranceFrac: overrides.entranceFrac !== undefined ? overrides.entranceFrac : CONFIG.interiorEntranceFrac,
            midFrac: overrides.midFrac !== undefined ? overrides.midFrac : CONFIG.interiorMidFrac,
            farFrac: overrides.farFrac !== undefined ? overrides.farFrac : CONFIG.interiorFarFrac,
            pauseMultiplier: overrides.pauseMultiplier !== undefined ? overrides.pauseMultiplier : 1,
            walkSpeedMultiplier: overrides.walkSpeedMultiplier !== undefined ? overrides.walkSpeedMultiplier : 1,
            chatterOverlapChance: overrides.chatterOverlapChance !== undefined ? overrides.chatterOverlapChance : CONFIG.worldChatterOverlapBaseChance,
            reactionChance: overrides.reactionChance !== undefined ? overrides.reactionChance : CONFIG.reactionBlipBaseChance
        };
    }

    // Dynamic per-meeting choreography: pause near the entrance, then walk
    // to a stop / hold for that point's dialogue / brief pause, once per
    // dialogue point script.js actually has for this meeting (pt1, pt2,
    // pt3, ...) -- see getMeetingDialoguePointCount, which also makes a
    // future pt4 "just work" without any code change, matching the same
    // promise script.js's own parser already makes. Falls back to 3
    // points (matching this project's current placeholder content) if
    // script.js hasn't loaded anything for this meeting yet. Finally
    // walks back to the entrance and leaves.
    function buildInteriorSequence(meetingId) {
        const cfg = getInteriorConfig(meetingId);
        const label = getMeetingLabelById(meetingId);
        const pointCount = getMeetingDialoguePointCount(label);
        const waypointFracs = buildInteriorWaypointFracs(cfg, pointCount);

        const steps = [
            { type: "wait", duration: CONFIG.interiorPauseEntrance * cfg.pauseMultiplier }
        ];

        waypointFracs.forEach(function (frac, i) {
            steps.push({ type: "walk", to: frac });
            steps.push({ type: "dialoguePoint", point: "pt" + (i + 1) });
            steps.push({ type: "wait", duration: CONFIG.interiorPostDialoguePause * cfg.pauseMultiplier });
        });

        steps.push({ type: "waitMin" });
        steps.push({ type: "walk", to: cfg.entranceFrac });
        steps.push({ type: "wait", duration: CONFIG.interiorPauseBeforeExit * cfg.pauseMultiplier });
        steps.push({ type: "exit" });

        return steps;
    }

    function getMeetingLabelById(meetingId) {
        const meeting = MEETINGS.filter(function (m) { return m.id === meetingId; })[0];
        return meeting ? meeting.label : meetingId;
    }

    // Counts how many "ptN" dialogue points script.js actually has for
    // this meeting's "<LABEL>-level1" section (uses the HIGHEST N found,
    // not just the count, so a gap like pt1+pt3-with-no-pt2 still walks
    // through 3 waypoints rather than silently collapsing to 2). Falls
    // back to 3 -- this project's current placeholder point count -- if
    // script.js hasn't loaded, or has nothing for this meeting yet.
    function getMeetingDialoguePointCount(label) {
        const sectionKey = (label + "-level1").toLowerCase();
        let maxN = 0;
        if (scriptDialogue && scriptDialogue[sectionKey]) {
            Object.keys(scriptDialogue[sectionKey]).forEach(function (key) {
                const m = key.match(/^pt(\d+)$/);
                if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
            });
        }
        return maxN > 0 ? maxN : 3;
    }

    // Turns a point count into a list of stop fractions for Bill to walk
    // to, one per dialogue point. The first two reuse this meeting's own
    // configured mid/far stops (matching the original two-stop
    // prototype exactly when a meeting only has 1-2 points); any point
    // beyond that bounces back and forth between them with a growing
    // nudge each time, so it reads as "wander/reposition" rather than
    // retracing the same spot -- see the spec's "wander/reposition ->
    // stop -> pt3" beat.
    function buildInteriorWaypointFracs(cfg, count) {
        const fracs = [];
        const span = cfg.farFrac - cfg.midFrac;
        for (let i = 0; i < count; i++) {
            if (i === 0) {
                fracs.push(cfg.midFrac);
            } else if (i === 1) {
                fracs.push(cfg.farFrac);
            } else {
                const towardMid = (i % 2 === 0);
                const nudge = Math.min(0.9, 0.3 + (i - 2) * 0.15);
                const frac = towardMid
                    ? Math.max(cfg.midFrac, cfg.farFrac - span * nudge)
                    : Math.min(cfg.farFrac, cfg.midFrac + span * (1 - nudge));
                fracs.push(frac);
            }
        }
        return fracs;
    }

    // Loads ONE dialogue point (pt1, pt2, pt3, ...) for the current
    // meeting's script.js section, same lookup convention as
    // loadDialogueForSection uses for the outdoor "Outside-level1"
    // section. pt1 additionally falls back to the original
    // level1-dialogue.js "inside" table if script.js has nothing yet, so
    // any meeting that hasn't been given script.js content still plays
    // its original placeholder pt1 line exactly as before. pt2+ simply
    // proceed with no dialogue (a brief pass-through pause) if script.js
    // doesn't have that point yet, rather than soft-locking the meeting
    // waiting on lines that will never arrive.
    function loadInteriorDialoguePoint(pointKey) {
        const meeting = MEETINGS[meetingIndex];
        const scriptEntries = getScriptDialogue(meeting.label + "-level1", pointKey);
        if (scriptEntries) {
            loadDialogueQueueFromScriptEntries(scriptEntries);
            return;
        }
        if (pointKey === "pt1") {
            loadDialogueQueue("inside");
            return;
        }
        dialogueQueue = [];
        activeBubble = null;
        dialogueTimer = 0;
    }

    function advanceInteriorStep() {
        interiorStepIndex += 1;
        interiorStepTimer = 0;
    }

    function updateInteriorSequence(dt) {
        const step = interiorSequence[interiorStepIndex];
        if (!step) {
            // Sequence exhausted without an explicit exit step -- treat as done.
            beginLeavingMeeting();
            return;
        }

        switch (step.type) {
            case "wait": {
                billInteriorWalking = false;
                interiorStepTimer += dt;
                if (interiorStepTimer >= step.duration) {
                    advanceInteriorStep();
                }
                break;
            }
            case "walk": {
                const dir = step.to >= billInteriorFrac ? 1 : -1;

                // Deliberate stop-turn-go beat: if this walk needs Bill to
                // reverse from his current direction, turn him first (idle
                // pose, already mirrored via billInteriorMoveDir/billInteriorTurning
                // -- see updateCharacterFacing, the single place that turns
                // this into an actual facingLeft) and hold briefly before
                // any actual movement starts, rather than an instant bounce.
                if (dir !== billInteriorMoveDir && !step._turned) {
                    billInteriorMoveDir = dir;
                    billInteriorTurning = true;
                    billInteriorWalking = false;
                    interiorStepTimer += dt;
                    if (interiorStepTimer >= CONFIG.interiorTurnDuration) {
                        step._turned = true;
                        interiorStepTimer = 0;
                        billInteriorTurning = false;
                    }
                    break;
                }
                billInteriorTurning = false;

                const speed = CONFIG.interiorWalkSpeedFrac * (activeInteriorConfig ? activeInteriorConfig.walkSpeedMultiplier : 1);
                billInteriorWalking = true;
                billInteriorMoveDir = dir;
                billInteriorFrac += dir * speed * dt;
                if ((dir > 0 && billInteriorFrac >= step.to) || (dir < 0 && billInteriorFrac <= step.to)) {
                    billInteriorFrac = step.to;
                    billInteriorWalking = false;
                    advanceInteriorStep();
                }
                break;
            }
            case "holdForScene": {
                billInteriorWalking = false;
                // Exactly the same condition this game already used to
                // decide when a meeting was over, before this cinematic
                // system existed -- see the old updateInsideMeeting.
                const dialogueFullyPlayed = (dialogueQueue.length === 0 && !activeBubble);
                const minTimeMet = insideElapsed >= CONFIG.insideMeetingMinDuration;
                if (dialogueFullyPlayed && minTimeMet) {
                    advanceInteriorStep();
                }
                break;
            }
            case "dialoguePoint": {
                // Bill and Bob have already stopped (this step only ever
                // follows a completed "walk" step) -- load THIS point's
                // script.js dialogue the first time we see it, then just
                // wait for the whole point to finish playing. Per spec,
                // they hold here; the cinematic never keeps moving
                // underneath an active conversation.
                billInteriorWalking = false;
                if (!step._started) {
                    step._started = true;
                    loadInteriorDialoguePoint(step.point);
                }
                const dialogueFullyPlayed = (dialogueQueue.length === 0 && !activeBubble);
                if (dialogueFullyPlayed) {
                    advanceInteriorStep();
                }
                break;
            }
            case "waitMin": {
                // Preserves the original insideMeetingMinDuration floor
                // (a meeting never resolves unnaturally fast) now that
                // holdForScene is no longer the only path through a
                // meeting's dialogue.
                billInteriorWalking = false;
                if (insideElapsed >= CONFIG.insideMeetingMinDuration) {
                    advanceInteriorStep();
                }
                break;
            }
            case "exit": {
                billInteriorWalking = false;
                beginLeavingMeeting();
                break;
            }
        }

        // Standing/dialogue moments (wait, holdForScene, dialoguePoint,
        // waitMin) get a wider, clearly-separated resting spot; mid-walk
        // gets a closer but still visibly separate trailing gap. Either
        // way the target is BEHIND Bill relative to the direction he's
        // actually walking/facing, so Bob never ends up leading or
        // overlapping Bill when they turn around together. Facing itself
        // is decided later, once per frame, by updateCharacterFacing --
        // this only drives Bob's position.
        const isResting = (step.type === "wait" || step.type === "holdForScene" ||
            step.type === "dialoguePoint" || step.type === "waitMin");
        updateInteriorBob(dt, isResting);
        updateBobAmbientAction(dt, step);
        updateInteriorCamera(dt);
    }

    // Picks Bob's two locked-in ambient actions for an eligible meeting --
    // a simple partial Fisher-Yates shuffle of the 4-name pool, keeping
    // just the first two. Guarantees both are different since the pool
    // itself has no duplicates.
    function pickTwoRandomBobAmbientActions() {
        const pool = BOB_AMBIENT_ACTION_NAMES.slice();
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = pool[i];
            pool[i] = pool[j];
            pool[j] = tmp;
        }
        return pool.slice(0, 2);
    }

    // Ambient "Bob does one of his two selected meeting behaviors" one-shot
    // -- see BOB_AMBIENT_ACTIONS and the ambient branch in drawBobCharacter.
    // Extends the original single-action coffee implementation rather than
    // replacing it: same "only during a settled dialoguePoint stop, never
    // during entrance/exit/doorway/walking" gating, same NORMAL-GAMEPLAY-
    // WINS cancel-on-any-frame-it-breaks behavior. What's new is that it
    // can fire more than once per meeting (bobAmbientSelectedActions can
    // both play out over the course of the meeting), each time rolling
    // CONFIG.bobAmbientTriggerChance so plain idle stays the common case,
    // preferring whichever of the two selections DIDN'T just play
    // (bobAmbientLastAction) so it doesn't obviously repeat, and only ever
    // rolling once per idle stop (step._ambientRolled) so a long dialogue
    // doesn't get multiple chances at the same stop.
    function updateBobAmbientAction(dt, step) {
        if (bobAmbientCooldownRemaining > 0) {
            bobAmbientCooldownRemaining = Math.max(0, bobAmbientCooldownRemaining - dt);
        }

        const settled = step && step.type === "dialoguePoint" && !bobInteriorWalking && !bobInteriorTurning;

        if (bobAmbientActiveAction) {
            if (!settled) {
                // NORMAL GAMEPLAY WINS -- cancel immediately, mid-action if
                // necessary. Never blocks advanceInteriorStep(); this only
                // decides what Bob's sprite looks like.
                bobAmbientActiveAction = null;
                bobAmbientElapsed = 0;
                bobAmbientCooldownRemaining = CONFIG.bobAmbientCooldown;
                return;
            }
            bobAmbientElapsed += dt;
            const totalDuration = BOB_AMBIENT_ACTIONS[bobAmbientActiveAction].frames.length /
                BOB_AMBIENT_ACTIONS[bobAmbientActiveAction].fps;
            if (bobAmbientElapsed >= totalDuration) {
                bobAmbientLastAction = bobAmbientActiveAction;
                bobAmbientActiveAction = null;
                bobAmbientElapsed = 0;
                bobAmbientCooldownRemaining = CONFIG.bobAmbientCooldown;
            }
            return;
        }

        if (!settled || step._ambientRolled) return;
        step._ambientRolled = true; // one roll per idle stop, win or lose

        if (bobAmbientCooldownRemaining > 0) return;
        if (bobAmbientSelectedActions.length === 0) return; // not an eligible meeting -- see enterInsideMeeting()
        if (Math.random() >= CONFIG.bobAmbientTriggerChance) return; // "maybe" -- plain idle stays the common case

        // Prefer whichever selected action DIDN'T just play, so two
        // triggers never obviously repeat back-to-back; falls back to the
        // full pair if that would leave nothing to choose from.
        let candidates = bobAmbientSelectedActions;
        if (candidates.length > 1 && bobAmbientLastAction) {
            const filtered = candidates.filter(function (name) { return name !== bobAmbientLastAction; });
            if (filtered.length > 0) candidates = filtered;
        }
        bobAmbientActiveAction = candidates[Math.floor(Math.random() * candidates.length)];
        bobAmbientElapsed = 0;
    }

    // Bob eases toward a spot behind Bill rather than snapping to a fixed
    // leash distance every frame -- he can lag, catch up late, or settle
    // in a slightly different spot each time, so the two of them don't
    // move in lockstep. A small deadband keeps him from endlessly
    // micro-adjusting once he's basically arrived, so "standing still"
    // actually looks still. He gets his own brief stop-turn-go beat too,
    // exactly like Bill's, so he never appears to moonwalk when the
    // direction he needs to trail in flips.
    function updateInteriorBob(dt, isResting) {
        const gapFrac = isResting ? CONFIG.interiorBobRestGapFrac : CONFIG.interiorBobGapFrac;
        // "Behind" is relative to the direction Bill is actually walking/
        // about to walk (billInteriorMoveDir), NOT his displayed facing --
        // those are two different things now (see updateCharacterFacing).
        const behindOffset = billInteriorMoveDir < 0 ? gapFrac : -gapFrac;
        const targetFrac = Math.max(0, Math.min(1, billInteriorFrac + behindOffset));
        const delta = targetFrac - bobInteriorFrac;

        const wantsMoveLeft = delta < -0.002;
        const wantsMoveRight = delta > 0.002;
        const wantsDir = wantsMoveLeft ? -1 : 1;

        if ((wantsMoveLeft || wantsMoveRight) && wantsDir !== bobInteriorMoveDir) {
            if (bobInteriorTurnTimer <= 0) {
                bobInteriorMoveDir = wantsDir;
            }
            bobInteriorTurning = true;
            bobInteriorTurnTimer += dt;
            if (bobInteriorTurnTimer < CONFIG.interiorTurnDuration) {
                bobInteriorWalking = false;
                return;
            }
            bobInteriorTurnTimer = 0;
        } else {
            bobInteriorTurnTimer = 0;
        }
        bobInteriorTurning = false;

        bobInteriorFrac += delta * Math.min(1, CONFIG.interiorBobLerpSpeed * dt);
        bobInteriorWalking = Math.abs(delta) > 0.002;
        if (bobInteriorWalking) bobInteriorMoveDir = wantsDir;
    }

    // Soft deadzone camera: Bill can roam within the middle band of the
    // screen freely; only once he'd go past it does the camera ease to
    // keep up, clamped so it never reveals space beyond either edge of
    // the actual background art.
    function updateInteriorCamera(dt) {
        if (!canvas) return;
        const scaledWidth = getInteriorBackgroundScaledWidth(canvas.width, canvas.height);
        const viewportFrac = scaledWidth > 0 ? Math.min(1, canvas.width / scaledWidth) : 1;
        const maxCameraFrac = Math.max(0, 1 - viewportFrac);

        const billScreenFrac = viewportFrac > 0 ? (billInteriorFrac - interiorCameraFrac) / viewportFrac : 0.5;

        let targetCameraFrac = interiorCameraFrac;
        if (billScreenFrac > CONFIG.interiorCameraDeadzoneMax) {
            targetCameraFrac = billInteriorFrac - CONFIG.interiorCameraDeadzoneMax * viewportFrac;
        } else if (billScreenFrac < CONFIG.interiorCameraDeadzoneMin) {
            targetCameraFrac = billInteriorFrac - CONFIG.interiorCameraDeadzoneMin * viewportFrac;
        }
        targetCameraFrac = Math.max(0, Math.min(maxCameraFrac, targetCameraFrac));

        interiorCameraFrac += (targetCameraFrac - interiorCameraFrac) * Math.min(1, CONFIG.interiorCameraEaseSpeed * dt);
        interiorCameraFrac = Math.max(0, Math.min(maxCameraFrac, interiorCameraFrac));
    }

    // The interior background, scaled by HEIGHT ONLY (same "cover"
    // approach used everywhere else in this file) so it never stretches.
    // Its resulting on-screen width is the full scrollable world width
    // for this meeting. Falls back to the canvas width itself (no
    // scrolling possible, matches the old static placeholder) if the
    // art hasn't loaded yet.
    function getInteriorBackgroundScaledWidth(canvasW, canvasH) {
        const meeting = MEETINGS[meetingIndex];
        const interior = interiorImages[meeting.id];
        const usingInteriorArt = !!(interior && interior.loaded && interior.naturalWidth > 0 && interior.naturalHeight > 0);
        if (!usingInteriorArt) return canvasW;
        return canvasH * (interior.naturalWidth / interior.naturalHeight);
    }

    function beginLeavingMeeting() {
        state = STATE.LEAVING_MEETING;
        leaveFadeTimer = CONFIG.insideFadeDuration;

        // Level 1 post-meeting travel-music progression: CA/GA/EA/CMA
        // exits each switch permanently to a new travel track (see
        // MEETING_EXIT_TRAVEL_ASSET/switchTravelTrack near the AUDIO
        // section) before the music resumes below. Every other meeting
        // exit (currently just AA) is left alone -- setAudioMode("outside")
        // just resumes whatever track the meeting-entry fade-out paused,
        // exactly as before.
        const exitingTravelAsset = MEETING_EXIT_TRAVEL_ASSET[MEETINGS[meetingIndex].id];
        if (exitingTravelAsset) {
            switchTravelTrack(exitingTravelAsset);
        }

        setAudioMode("outside"); // stops meeting-chatter.mp3, restores/starts the current gameplay track -- see the AUDIO section near the bottom of the file
    }

    function updateLeavingMeeting(dt) {
        leaveFadeTimer -= dt;
        if (leaveFadeTimer > 0) return;

        // The story clock snaps to its locked milestone exactly when they
        // come back out of the meeting.
        clockMinutes = parseStoryTime(STORY_TIMES_AFTER_MEETING[meetingIndex]);

        // IMPORTANT CONTINUITY FIX:
        // Do NOT advance to the next section yet. Keep the current meeting
        // building and the exact same doorway on screen, reveal the exterior,
        // and visibly have both guys emerge from that door first.
        state = STATE.EXITING_MEETING;
        exitMeetingTimer = CONFIG.exitMeetingDuration;
        currentSpeed = 0;
        follower.offset = CONFIG.followerDistance;
        follower.state = FOLLOWER_STATE.FOLLOWING;
    }

    function updateExitingMeeting(dt) {
        const elapsed = CONFIG.exitMeetingDuration - exitMeetingTimer;
        exitMeetingTimer -= dt;

        // First they visibly step out of the doorway. Then normal forward
        // travel resumes while the SAME building slides behind them.
        if (elapsed >= CONFIG.exitDoorStepDuration) {
            currentSpeed = CONFIG.walkSpeed;
            advanceDistance(currentSpeed * dt);
        } else {
            currentSpeed = 0;
        }

        if (exitMeetingTimer > 0) return;

        const isLastMeeting = (meetingIndex === MEETINGS.length - 1);

        if (isLastMeeting) {
            // Harrison Corner/CMA also gets the visible exit before Level 1 ends.
            beginFinish();
        } else {
            // Continue directly into the next outdoor section.
            // No transition fade here: the visible doorway exit already provides
            // the continuity beat, so another black overlay only reads as a blink.
            advanceToNextSection();
            state = STATE.WALKING;
            transitionPhase = null;
            transitionTimer = 0;
        }
    }

    function advanceToNextSection() {
        // The building they just left keeps receding into view on the
        // continuous world line (see the "EXITED BUILDING" block in
        // renderOutdoorScene) instead of vanishing the instant meetingIndex
        // below changes -- that instant disappearance was the second half
        // of the "time warp" report: the OLD interactive building was
        // never given the same continuous treatment as scenery (houses,
        // decorative landmarks -- see getSectionWorldStart) in the
        // previous fix, so it just blinked out of existence while the new
        // section's own close-by content was already on screen.
        exitedMeetingIndex = meetingIndex;

        meetingIndex += 1;

        // Reset ONLY the section-local counter. worldScrollDistance is
        // deliberately left alone here -- it must keep counting up
        // continuously across this boundary, or the tiled background and
        // atmosphere parallax (see drawTiledBackground/
        // drawEnvironmentAtmosphere) snap to a different phase in a
        // single frame, which reads as a blink/teleport even though
        // nothing about the character's on-screen position actually
        // changed. See the comment above advanceDistance() for the full
        // explanation.
        distanceTraveled = 0;
        currentSpeed = CONFIG.walkSpeed;
        loadObstaclesForSection();
        loadHousesForSection();
        loadDecorativeBuildingsForSection();
        loadStreetLampsForSection();
        loadAmbientEventsForSection();
        loadDialogueForSection();
    }

    function updateTransition(dt) {
        transitionTimer -= dt;
        if (transitionTimer > 0) return;

        if (transitionPhase === "finishing") {
            completeFinish();
        } else {
            state = STATE.WALKING;
            transitionPhase = null;
        }
    }

    function beginFinish() {
        state = STATE.TRANSITIONING;
        transitionPhase = "finishing";
        transitionTimer = CONFIG.finishFadeDuration;
        // Deliberately NOT calling fadeOutMusic() here anymore -- grunge4
        // (the final Level 1 travel/end track, see MEETING_EXIT_TRAVEL_ASSET)
        // is meant to keep playing through this fade AND the whole
        // "» CHAPTER 2 »" screen, right up until goToNextChapter() tears
        // Level 1 down for the handoff. See the Level 1 music-progression
        // spec's note on grunge4.
    }

    /* ======================================================================
       TIME-OF-DAY CLOCK (unused legacy atmosphere system -- NOT the HUD
       "TIME LEFT ON EARTH" story clock; see updateFictionalClock below for
       that one). This one tracked a 12-hour wall-clock time of night
       (STORY_TIMES) and is no longer shown anywhere in the HUD, but is
       kept running exactly as before since nothing else reads clockMinutes,
       in case it's wanted again later.

       Ticks forward quickly while walking outside, for a sense of covering
       real distance through Akron, but never crosses the next locked
       milestone on its own -- it holds a few minutes short until the
       story actually reaches that point (see updateLeavingMeeting above,
       which snaps it to the exact value).
       ====================================================================== */
    function updateStoryClock(dt) {
        const outdoorMoving = (state === STATE.WALKING || state === STATE.DASHING ||
            state === STATE.JUMPING || state === STATE.APPROACHING_MEETING);
        if (!outdoorMoving) return;

        const cap = parseStoryTime(STORY_TIMES_AFTER_MEETING[meetingIndex]) - CONFIG.clockApproachBuffer;
        clockMinutes = Math.min(cap, clockMinutes + CONFIG.clockMinutesPerRealSecond * dt);
    }

    function parseStoryTime(timeStr) {
        const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(timeStr).trim());
        if (!match) return 0;
        let hours = parseInt(match[1], 10) % 12;
        const minutes = parseInt(match[2], 10);
        if (/pm/i.test(match[3])) hours += 12;
        return hours * 60 + minutes;
    }

    /* ======================================================================
       HUD "TIME LEFT ON EARTH" -- a FICTIONAL story clock, purely visual.
       It has no gameplay authority: nothing here ends the game, ends a
       scene, moves Bill/Bob, or touches lives/progress/buildings/timing.
       It simply ticks down on its own at CONFIG.storyClockSpeed (fictional
       seconds per real second) so it reads as "alive" -- its value is only
       ever SET by script.js's "clock: HH:MM:SS" lines (see
       getScriptClockSeconds, called from resetRuntimeState/enterInsideMeeting),
       never calculated from actual elapsed gameplay time. Pauses on the
       title screen and once the level has ended or the player is out of
       lives (nothing to visually count down through there); never goes
       below zero.
       ====================================================================== */
    function updateFictionalClock(dt) {
        if (state === STATE.WAITING_TO_START || state === STATE.OUT_OF_LIVES || state === STATE.FINISHED) return;
        storyClockSecondsRemaining = Math.max(0, storyClockSecondsRemaining - dt * CONFIG.storyClockSpeed);
    }

    // ------------------------------------------------------------------
    // CLOCK VISUAL-STATE FRAMEWORK -- purely presentational styling for
    // the "TIME LEFT ON EARTH" housing (digit color/glow + a CSS
    // animation name), keyed by name. NOT wired to elapsed time or
    // storyClockSecondsRemaining in any way -- the level starts and
    // currently stays in "normal" for this whole pass (see
    // CONFIG.clockVisualStateDefault / resetRuntimeState). A future pass
    // can call setClockVisualState("warning") etc. explicitly (e.g. from
    // a script.js line) without touching any clock math here.
    // ------------------------------------------------------------------
    const CLOCK_VISUAL_STATES = {
        normal: { color: "#39ff14", glow: "0 0 6px rgba(57,255,20,0.7), 0 0 16px rgba(57,255,20,0.4), 0 0 28px rgba(57,255,20,0.15)", animation: "none" },
        alert: { color: "#8cff3d", glow: "0 0 7px rgba(140,255,61,0.7)", animation: "hgClockPulse 1.6s ease-in-out infinite" },
        warning: { color: "#f2c14e", glow: "0 0 8px rgba(242,193,78,0.75)", animation: "hgClockFlicker 2.4s ease-in-out infinite" },
        danger: { color: "#ff8a3d", glow: "0 0 10px rgba(255,138,61,0.85)", animation: "hgClockPulse 0.9s ease-in-out infinite" },
        critical: { color: "#ff3b30", glow: "0 0 14px rgba(255,59,48,0.95)", animation: "hgClockCriticalPulse 0.55s ease-in-out infinite" }
    };

    function setClockVisualState(name) {
        const resolved = CLOCK_VISUAL_STATES[name] ? name : "normal";
        clockVisualState = resolved;
        if (!countdownMainEl) return; // buildDom hasn't run yet -- applied again once it does, see buildDom's own initial call
        const style = CLOCK_VISUAL_STATES[resolved];
        // Only the dominant "HH:MM" piece follows the clock's alert
        // state -- countdownSecEl (the small ":SS") deliberately stays a
        // fixed warm-white regardless of state, per the "seconds never
        // dominate" redesign; see buildDom's clock block.
        countdownMainEl.style.color = style.color;
        countdownMainEl.style.textShadow = style.glow;
        countdownMainEl.style.animation = style.animation;
    }

    function formatFictionalClock(totalSeconds) {
        const wholeSeconds = Math.max(0, Math.ceil(totalSeconds));
        const hh = Math.floor(wholeSeconds / 3600);
        const mm = Math.floor((wholeSeconds % 3600) / 60);
        const ss = wholeSeconds % 60;
        const pad = function (n) { return n < 10 ? "0" + n : String(n); };
        return pad(hh) + ":" + pad(mm) + ":" + pad(ss);
    }

    // Same fictional clock value as formatFictionalClock, split into the
    // dominant "HH:MM" piece and a much smaller trailing ":SS" piece --
    // see countdownMainEl/countdownSecEl in buildDom/updateHud. Purely a
    // different split of the same string; storyClockSecondsRemaining's
    // own countdown math (updateFictionalClock) is untouched.
    function formatFictionalClockParts(totalSeconds) {
        const wholeSeconds = Math.max(0, Math.ceil(totalSeconds));
        const hh = Math.floor(wholeSeconds / 3600);
        const mm = Math.floor((wholeSeconds % 3600) / 60);
        const ss = wholeSeconds % 60;
        const pad = function (n) { return n < 10 ? "0" + n : String(n); };
        return { main: pad(hh) + ":" + pad(mm), sec: ":" + pad(ss) };
    }

    function formatClock(totalMinutes) {
        const dayMinutes = 24 * 60;
        let m = Math.round(totalMinutes);
        m = ((m % dayMinutes) + dayMinutes) % dayMinutes;

        const hours24 = Math.floor(m / 60);
        const minutes = m % 60;
        const period = hours24 >= 12 ? "PM" : "AM";
        let hours12 = hours24 % 12;
        if (hours12 === 0) hours12 = 12;
        const mm = minutes < 10 ? "0" + minutes : String(minutes);

        return hours12 + ":" + mm + " " + period;
    }

    /* ======================================================================
       FOLLOWER ("invisible leash" personality)
       ====================================================================== */
    function updateFollower(dt) {
        if (state === STATE.WAITING_TO_START) return;

        follower.driftPhase += dt * 0.6;

        if (follower.state === FOLLOWER_STATE.WAITING) {
            follower.waitTimer -= dt;
            if (follower.waitTimer <= 0) {
                follower.state = FOLLOWER_STATE.FOLLOWING;
            }
            return;
        }

        // How far behind is the follower right now, logically?
        if (follower.offset > CONFIG.followerCatchupDistance) {
            follower.state = FOLLOWER_STATE.CATCHING_UP;
        } else if (follower.state === FOLLOWER_STATE.CATCHING_UP &&
            follower.offset <= CONFIG.followerDistance) {
            follower.state = FOLLOWER_STATE.FOLLOWING;
        }

        const primaryMoving = (currentSpeed > 0);

        if (follower.state === FOLLOWER_STATE.CATCHING_UP) {
            // Hustle: close the gap faster than the primary is moving away.
            follower.offset -= (CONFIG.followerCatchupSpeed - currentSpeed) * dt;
            follower.offset = Math.max(CONFIG.followerDistance * 0.4, follower.offset);
        } else if (primaryMoving) {
            // Small organic wobble around the comfortable distance so he
            // doesn't feel glued in place -- occasionally lags, occasionally
            // closes in, and very occasionally just pauses for a beat.
            const wobble = Math.sin(follower.driftPhase) * 6;
            const target = CONFIG.followerDistance + wobble;
            follower.offset += (target - follower.offset) * Math.min(1, dt * 1.5);
            follower.state = FOLLOWER_STATE.FOLLOWING;

            if (Math.random() < CONFIG.followerWaitChance * dt) {
                follower.state = FOLLOWER_STATE.WAITING;
                follower.waitTimer = 0.4 + Math.random() * 0.5;
            } else if (follower.offset > CONFIG.followerDistance * 1.3) {
                follower.state = FOLLOWER_STATE.LAGGING;
            }
        }
    }

    /* ======================================================================
       DIALOGUE (independent of movement -- never blocks anything)
       ====================================================================== */
    /* ======================================================================
       DIALOGUE (independent of movement -- never blocks anything)

       Only one bubble is ever on screen at a time (keeps it readable and
       uncluttered on mobile). While a bubble is showing, the delay for the
       NEXT queued line doesn't start counting down until this one clears --
       so "delay" means "seconds after the previous line finishes," not
       "seconds after it started."
       ====================================================================== */
    function updateDialogue(dt) {
        if (activeBubble) {
            activeBubble.timeRemaining -= dt;
            if (activeBubble.timeRemaining <= 0) {
                // BRIEF WORLD-CHATTER OVERLAP -- only ever between two
                // consecutive "crowd" lines (crowd is meeting-interior-only,
                // see script.js's own comment on that speaker), so Bill/Bob's
                // own dialogue is never affected. Sparingly (see
                // chatterOverlapChance): the OLD bubble keeps fading for a
                // moment in fadingWorldBubble while the new one appears
                // below, rather than a hard cut -- see drawSpeechBubbles.
                // Purely a rendering echo -- dialogueQueue/dialogueTimer
                // advancement itself is completely unaffected either way.
                if (activeBubble.speaker === "crowd" && dialogueQueue.length > 0 &&
                    dialogueQueue[0].speaker === "crowd" && !fadingWorldBubble) {
                    const overlapChance = activeInteriorConfig ? activeInteriorConfig.chatterOverlapChance : CONFIG.worldChatterOverlapBaseChance;
                    if (Math.random() < overlapChance) {
                        fadingWorldBubble = {
                            text: activeBubble.text,
                            crowdPos: activeBubble.crowdPos,
                            life: CONFIG.worldChatterOverlapFadeSeconds,
                            maxLife: CONFIG.worldChatterOverlapFadeSeconds
                        };
                    }
                }
                activeBubble = null;
            }
        }

        if (fadingWorldBubble) {
            fadingWorldBubble.life -= dt;
            if (fadingWorldBubble.life <= 0) fadingWorldBubble = null;
        }

        if (dialogueQueue.length === 0) return;
        if (state === STATE.WAITING_TO_START) return;
        if (activeBubble) return; // one bubble at a time -- wait for it to clear

        dialogueTimer -= dt;
        if (dialogueTimer <= 0) {
            const entry = dialogueQueue.shift();
            activeBubble = {
                speaker: entry.speaker,
                text: entry.text,
                timeRemaining: CONFIG.dialogueDisplayDuration,
                // Only meaningful for "crowd" -- picked ONCE here (not
                // per-frame in drawSpeechBubbles) so the bubble doesn't
                // jitter between positions while it's on screen. See
                // pickCrowdBubblePreset()/CROWD_BUBBLE_PRESETS.
                crowdPos: (entry.speaker === "crowd") ? pickCrowdBubblePreset() : null,
                // Comic "pop" appear animation reads elapsed time since
                // this moment -- see getBubblePopTransform/drawBubble/
                // drawWorldBubble. Purely presentational.
                popStartTime: billAnimElapsed
            };
            if (entry.speaker === "crowd") {
                maybeTriggerReactionBlip();
            }
            if (dialogueQueue.length > 0) {
                dialogueTimer = dialogueQueue[0].delay;
            }
        }
    }

    // BILL/BOB REACTION BEATS -- reuses the EXISTING idle-blip pose system
    // (billIdleBlipCol/BILL_IDLE_VARIANT_COLS, bobIdleBlipEndAt, etc. --
    // all already in the file, already running on their own random
    // interval) rather than any new artwork or animation state. This just
    // makes one happen NOW, tied to a chatter line, by nudging
    // bill/bobIdleNextBlipAt to "due immediately" -- the exact same code
    // path in drawBillCharacter/drawBobCharacter picks it up on the very
    // next frame. Only fires for whichever of them is actually idle
    // (not mid-walk/turn) and not already mid-blip, and only sparingly
    // (see reactionChance) so it reads as occasional flavor, never forced
    // after every line.
    function maybeTriggerReactionBlip() {
        if (state !== STATE.INSIDE_MEETING) return;
        const chance = activeInteriorConfig ? activeInteriorConfig.reactionChance : CONFIG.reactionBlipBaseChance;
        if (Math.random() >= chance) return;

        const billIdle = !billInteriorWalking && !billInteriorTurning && billIdleBlipEndAt === null;
        const bobIdle = !bobInteriorWalking && !bobInteriorTurning && bobIdleBlipEndAt === null;
        const candidates = [];
        if (billIdle) candidates.push("bill");
        if (bobIdle) candidates.push("bob");
        if (candidates.length === 0) return;

        const who = candidates[Math.floor(Math.random() * candidates.length)];
        if (who === "bill") {
            billIdleNextBlipAt = billAnimElapsed; // due immediately -- picked up by drawBillCharacter's existing check next frame
        } else {
            bobIdleNextBlipAt = bobAnimElapsed;
        }
    }

    /* ======================================================================
       GLOBAL CHARACTER FACING -- the single authoritative place that
       decides which way Bill and Bob are drawn, both outdoors and inside
       a meeting. Runs once per frame, after every position/dialogue
       update for the frame has already happened, and is the ONLY code
       in the file that assigns to billFacingLeft/bobFacingLeft.

       Priority order (first match wins, every frame -- nothing here is
       "sticky" beyond what each tier itself holds):

         1. A special doorway/entrance/exit animation is actively
            playing -- leave facing exactly as it already is; that
            one-shot pose owns the visual and this system must not
            fight it.
         2. Either of them is still actually moving (beyond a small
            epsilon, so floating-point noise never counts) -- face
            direction of travel. Bill leads outdoors by construction
            (the follower system never lets Bob overtake him); indoors
            each of them simply faces the way they're currently walking.
         3. Both are essentially stationary AND a dialogue bubble is
            active -- face each other, decided from their actual
            positions. Never tied to who's currently speaking, so
            alternating bubbles never cause any flipping.
         4. Both stationary, no dialogue -- leave facing exactly as it
            already is (stable idle, no flipping for no reason).
       ====================================================================== */
    function updateCharacterFacing(dt) {
        // Tier 1 -- a doorway/entrance/exit one-shot sequence is playing.
        // These already have their own dedicated animation and hold
        // their own look; don't touch facing while any of them are live.
        const doorwayActive =
            state === STATE.APPROACHING_MEETING ||
            state === STATE.WAITING_AT_DOOR ||
            state === STATE.ENTERING_MEETING ||
            state === STATE.LEAVING_MEETING ||
            state === STATE.EXITING_MEETING ||
            (state === STATE.CHANGING_STORE_EVENT && (
                changingStorePhase === "entering" ||
                changingStorePhase === "hidden" ||
                changingStorePhase === "emerging"
            ));
        if (doorwayActive) return;

        if (state === STATE.INSIDE_MEETING) {
            // Tier 2 (indoors): billInteriorWalking/bobInteriorWalking
            // already encode "moving beyond the epsilon" (see
            // updateInteriorBob's 0.002 deadband), and billInteriorTurning/
            // bobInteriorTurning cover the brief pre-walk turn beat, which
            // is itself part of "about to move that way," not idle.
            const billMoving = billInteriorWalking || billInteriorTurning;
            const bobMoving = bobInteriorWalking || bobInteriorTurning;
            if (billMoving || bobMoving) {
                if (billMoving) billFacingLeft = billInteriorMoveDir < 0;
                if (bobMoving) bobFacingLeft = bobInteriorMoveDir < 0;
                return;
            }
            // Tier 3: both stopped, dialogue active -- face each other by
            // actual x position (frac).
            if (activeBubble) {
                const billIsLeftOfBob = billInteriorFrac < bobInteriorFrac;
                billFacingLeft = !billIsLeftOfBob;
                bobFacingLeft = billIsLeftOfBob;
            }
            // Tier 4 (implicit): stopped, no dialogue -- leave as-is.
            return;
        }

        // Outdoors. This is a rightward-only side-scroller (see
        // drawBillCharacter/drawBobCharacter's own notes on this), and
        // the follower system never lets Bob overtake Bill, so the
        // leader/follower relationship is always structurally stable --
        // there's no position math needed to know who's on which side.
        const moving = currentSpeed > CONFIG.facingSpeedEpsilon;
        if (moving) {
            // Tier 2: face direction of travel -- always rightward here.
            billFacingLeft = false;
            bobFacingLeft = false;
            return;
        }
        if (activeBubble) {
            // Tier 3: stopped and talking (Dry People's Club, Fresh
            // Threads, or any other outdoor dialogue stop) -- face each
            // other. Bob (the follower) is always behind/left of Bill by
            // construction, so this never needs a position comparison.
            billFacingLeft = true;
            bobFacingLeft = false;
        }
        // Tier 4 (implicit): stopped, no dialogue -- leave as-is.
    }

    /* ======================================================================
       RENDERING -- all placeholder shapes, sized to the current canvas
       ====================================================================== */
    function render() {
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;

        if (state === STATE.INSIDE_MEETING || state === STATE.LEAVING_MEETING) {
            renderInsideMeeting(w, h);
        } else {
            renderOutdoorScene(w, h);
        }

        drawTransitionOverlay(w, h);
        updateHud();
    }

    function outdoorGroundY(h) {
        return h * 0.72;
    }

    // VISUAL-ONLY architecture baseline. The background art already contains
    // the road in the foreground, so houses, lamps, and meeting buildings
    // belong farther back on the land/sidewalk instead of at the characters'
    // road baseline. This does not change movement, speed, obstacles, lives,
    // meeting progression, or any other gameplay mechanic.
    function outdoorArchitectureY(h) {
        // VISUAL ONLY: this is the scenery baseline near the TOP EDGE of
        // the sidewalk baked into level1-bg1.png. Houses/lamp posts sit
        // here so they read as being planted on the residential lot rather
        // than floating above it. Gameplay groundY remains unchanged.
        return h * 0.665;
    }

    function outdoorPrimaryX(w) {
        return w * 0.32;
    }

    function renderOutdoorScene(w, h) {
        const groundY = outdoorGroundY(h);
        const architectureY = outdoorArchitectureY(h);

        drawBackground(w, h, groundY);
        drawTiledBackground(w, h, groundY);
        drawEnvironmentAtmosphere(w, groundY);

        const meeting = MEETINGS[meetingIndex];
        const primaryX = outdoorPrimaryX(w);

        // Architecture sits back on the land/sidewalk layer; obstacles and
        // characters stay on the existing road gameplay baseline below it.
        drawHouses(w, architectureY, primaryX);
        drawDecorativeBuildings(w, architectureY, primaryX);
        drawChangingStoreBuilding(w, h, primaryX);
        drawStreetObstacles(w, groundY, primaryX);
        drawImpactEffects(w, groundY, primaryX);
        drawAmbientEvents(w, h);

        // EXITED BUILDING -- the meeting they just left keeps receding into
        // the distance on the same continuous world line as scenery (see
        // getSectionWorldStart/exitedMeetingIndex), instead of vanishing
        // outright the instant advanceToNextSection() changes meetingIndex.
        // That instant disappearance -- a close, fully-detailed building
        // replaced in a single frame by whatever the new section happens to
        // already have in view -- was the second half of the reported
        // "time warp": the interactive building was never given the same
        // continuous treatment as houses/decorative landmarks. Drawn first
        // so the CURRENT building (usually far off to the right, but can
        // briefly overlap right at the handoff) renders on top of it.
        if (exitedMeetingIndex !== null) {
            const exitedMeeting = MEETINGS[exitedMeetingIndex];
            const exitedSectionLen = exitedMeeting.sectionDistance || CONFIG.sectionDistance;
            const exitedWorldPos = getSectionWorldStart(exitedMeetingIndex) + exitedSectionLen;
            const exitedX = primaryX + (exitedWorldPos - worldScrollDistance);
            if (exitedX < -260) {
                exitedMeetingIndex = null; // fully scrolled off -- stop tracking it
            } else {
                drawBuilding(exitedMeeting, w, h, exitedX, false);
            }
        }

        // Keep the interactive meeting building on its original gameplay
        // baseline so its visible doorway continues to match the existing
        // doorway hit-test exactly.
        const currentBuildingX = worldToScreenX(getCurrentSectionDistance(), primaryX);
        drawBuilding(meeting, w, h, currentBuildingX, true);
        drawStreetLamps(w, architectureY, primaryX);

        let followerX = primaryX - follower.offset * (w / CONFIG.sectionDistance === 0 ? 1 : 1) - 40;
        // follower drawn purely relative on-screen, small vertical drift for personality
        const driftY = Math.sin(follower.driftPhase) * 4;

        let primaryDrawX = primaryX + smashLeanOffset(); // lunges forward during a smash

        if (state === STATE.EXITING_MEETING) {
            const elapsed = CONFIG.exitMeetingDuration - exitMeetingTimer;
            const stepT = Math.min(1, Math.max(0, elapsed / CONFIG.exitDoorStepDuration));

            // Use the exact same live doorway position the building is
            // actually drawn with -- including this building's own
            // per-meeting doorway alignment (getDoorwayScreenRect), not
            // generic building-center math. Both characters begin exactly
            // there and ease into their normal walking formation before
            // the journey continues, so they visibly emerge from the real
            // doorway of whichever building they just left.
            const doorRect = getDoorwayScreenRect(w, h);
            const doorwayX = doorRect.centerX + (doorRect.exitOffsetX || 0);
            const primaryTargetX = primaryX;
            const followerTargetX = primaryX - 40;
            const easeT = stepT * stepT * (3 - 2 * stepT);

            primaryDrawX = doorwayX + (primaryTargetX - doorwayX) * easeT;
            followerX = (doorwayX + 18) + (followerTargetX - (doorwayX + 18)) * easeT;
        } else if (state === STATE.CHANGING_STORE_EVENT && changingStorePhase === "emerging") {
            // Same "step out of the real doorway" ease used leaving a
            // meeting (see the EXITING_MEETING branch above), reusing
            // building6's own doorway geometry via
            // getChangingStoreDoorwayScreenRect instead of the current
            // meeting's.
            const elapsed = CONFIG.changingStoreEmergeStepDuration - changingStoreTimer;
            const stepT = Math.min(1, Math.max(0, elapsed / CONFIG.changingStoreEmergeStepDuration));
            const doorRect = getChangingStoreDoorwayScreenRect(w, h, primaryX);
            const doorwayX = doorRect.centerX + (doorRect.exitOffsetX || 0);
            const primaryTargetX = primaryX;
            const followerTargetX = primaryX - 40;
            const easeT = stepT * stepT * (3 - 2 * stepT);

            primaryDrawX = doorwayX + (primaryTargetX - doorwayX) * easeT;
            followerX = (doorwayX + 18) + (followerTargetX - (doorwayX + 18)) * easeT;
        }

        // While hidden inside the changing store, Bill and Bob simply
        // aren't drawn -- no interior, no loading screen, nothing else
        // changes about the scene (see the "hidden" phase in
        // updateChangingStoreEvent). Dust is cleared before this phase
        // starts, so doorwayDustPuffs is already empty here regardless.
        const billBobHidden = (state === STATE.CHANGING_STORE_EVENT && changingStorePhase === "hidden");

        if (!billBobHidden) {
            drawSpeedLines(primaryDrawX, followerX, groundY);
        }
        if (doorwayDustPuffs.length > 0 || skidDustPuffs.length > 0 || runningDustPuffs.length > 0) {
            drawDust(primaryDrawX, followerX, groundY);
        }
        drawSkrrrtEffect(primaryDrawX, followerX, groundY);

        let bobBox = null;
        let billBox = null;
        if (!billBobHidden) {
            bobBox = drawBobCharacter(followerX, groundY, h, driftY, { facingLeft: bobFacingLeft });           // follower (Bob)
            billBox = drawBillCharacter(primaryDrawX, groundY, h, jumpArcOffset(), { facingLeft: billFacingLeft }); // primary (Bill) -- lifts during a jump
        }

        if (state === STATE.KICKING) {
            drawKickLeg(primaryDrawX, groundY, kickLegExtension());
        }

        if (billBox && bobBox) {
            const buildingAnchor = getActiveBuildingBubbleAnchor(w, h, primaryX);
            drawSpeechBubbles(primaryX, followerX, groundY, h, w, billBox, bobBox, buildingAnchor);
        }
    }

    function renderInsideMeeting(w, h) {
        // Finished interior art, when it has loaded, is the full
        // scrollable cinematic stage: scaled by HEIGHT ONLY so it fills
        // the canvas top-to-bottom without stretching, then only the
        // slice of it currently inside the camera's viewport (see
        // updateInteriorCamera/interiorCameraFrac) is drawn -- see
        // drawInteriorBackgroundScrolled. Falls back to the original
        // static placeholder interior (gradient wall/floor + a row of
        // chairs, centered, no scroll) if the image is missing or
        // hasn't loaded yet, unchanged from before.
        const groundY = h * CONFIG.interiorGroundYFrac;
        const meeting = MEETINGS[meetingIndex];
        const interior = interiorImages[meeting.id];
        const usingInteriorArt = !!(interior && interior.loaded && interior.naturalWidth > 0 && interior.naturalHeight > 0);

        if (usingInteriorArt) {
            drawInteriorBackgroundScrolled(interior, w, h, interiorCameraFrac);
        } else {
            const wall = ctx.createLinearGradient(0, 0, 0, groundY);
            wall.addColorStop(0, "#2c2118");
            wall.addColorStop(1, "#3d2f22");
            ctx.fillStyle = wall;
            ctx.fillRect(0, 0, w, groundY);

            ctx.fillStyle = "#4a3a2a";
            ctx.fillRect(0, groundY, w, h - groundY);

            // a simple row of folding chairs -- just enough to read as "a meeting"
            ctx.fillStyle = "#5c4632";
            const chairCount = 6;
            const chairSpacing = w / (chairCount + 1);
            for (let i = 1; i <= chairCount; i++) {
                const cx = chairSpacing * i;
                ctx.fillRect(cx - 10, groundY - 26, 20, 26);
            }

            // understated header so it's clear which fellowship this is --
            // only drawn for the placeholder; the finished art already
            // carries its own fellowship signage baked in.
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.65)";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(meeting.label + " MEETING", w / 2, 26);
            ctx.restore();
        }

        // SUBTLE INTERIOR AMBIENCE -- very soft warm-light breathing,
        // drawn right after the background/before Bill & Bob so it tints
        // the room itself rather than the characters. Generic (no
        // per-background anchor needed), see drawInteriorLampBreathing.
        drawInteriorLampBreathing(w, h);

        // Bill and Bob's actual screen position: their fraction-of-room
        // position (see the interior cinematic engine above) converted to
        // world pixels, minus the camera's current offset in world pixels.
        // Falls back to the same "no scroll" width the background used
        // above when the art hasn't loaded, so positions stay consistent
        // with what's on screen either way.
        const scaledWidth = usingInteriorArt ? (h * (interior.naturalWidth / interior.naturalHeight)) : w;
        const cameraPx = interiorCameraFrac * scaledWidth;
        const billScreenX = billInteriorFrac * scaledWidth - cameraPx;
        const bobScreenX = bobInteriorFrac * scaledWidth - cameraPx;
        const driftY = Math.sin(follower.driftPhase) * 3;

        const interiorRenderOptions = { scaleMultiplier: CONFIG.interiorCharacterScale };

        const bobBox = drawBobCharacter(bobScreenX, groundY, h, driftY,
            Object.assign({ walkingOverride: bobInteriorWalking, facingLeft: bobFacingLeft }, interiorRenderOptions));
        const billBox = drawBillCharacter(billScreenX, groundY, h, 0,
            Object.assign({ walkingOverride: billInteriorWalking, facingLeft: billFacingLeft }, interiorRenderOptions));

        // Existing "inside" dialogue (see loadInsideDialogueForSection) still
        // works exactly as before -- it's the SAME dialogueQueue/activeBubble
        // system used outdoors, just anchored here to each character's
        // EXACT returned bounding box (billBox/bobBox above), which is
        // already camera-scroll-aware, facing-aware, and correct for the
        // much larger interior scale -- see drawSpeechBubbles. No exterior
        // building is on screen in here, so buildingAnchor is always null --
        // a stray "building-dialogue:" line inside a meeting section just
        // gets skipped silently (see drawSpeechBubbles).
        drawSpeechBubbles(billScreenX, bobScreenX, groundY, h, w, billBox, bobBox, null);

        // Floating dust motes -- drawn LAST, on top of everything, so they
        // read as tiny particles hanging in the room's air in front of
        // the scene. See drawInteriorAmbientMotes for why coffee steam
        // specifically was left out this pass.
        drawInteriorAmbientMotes(w, h);
    }

    // ------------------------------------------------------------------
    // SUBTLE INTERIOR AMBIENCE -- both effects below are fully procedural
    // (computed straight from billAnimElapsed + a per-instance seed, no
    // spawn/despawn array, no per-meeting anchor point), which is what
    // makes them safe to enable in every interior without any manual
    // per-background tuning. Coffee steam was deliberately NOT added:
    // making it look right needs a real anchor point on each meeting's
    // interior background (where the coffee/kitchen area actually is in
    // that specific piece of art), which isn't something that can be
    // verified from code alone -- guessing one risked steam rising out of
    // a wall or floating over someone's head. Per the brief's own "skip
    // it rather than hardcode something unsafe" guidance, it's left out
    // this pass; a future pass with the actual background art in hand
    // could add real per-meeting steam anchors here.
    // ------------------------------------------------------------------
    function drawInteriorAmbientMotes(w, h) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 235, 190, 1)";
        for (let i = 0; i < CONFIG.interiorDustMoteCount; i++) {
            const seed = i * 137.5;
            const speed = CONFIG.interiorDustMoteDriftSpeed * (0.7 + (i % 3) * 0.2);
            const y = h - ((billAnimElapsed * speed + seed) % h);
            const x = (w * ((seed * 0.61803) % 1)) + Math.sin(billAnimElapsed * 0.6 + seed) * 10;
            const alpha = 0.15 + 0.15 * Math.sin(billAnimElapsed * 0.9 + seed);
            if (alpha <= 0.02) continue;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, 1.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 0 at the first meeting, 1 at the last -- used only to very slightly
    // deepen the lamp-breathing warm vignette below as the night goes on
    // (see CONFIG.interiorHalloweenMaxExtraAlpha). Not tied to real
    // elapsed time, just which meeting this is.
    function getHalloweenAtmosphereFrac() {
        const totalSteps = Math.max(1, MEETINGS.length - 1);
        return Math.max(0, Math.min(1, meetingIndex / totalSteps));
    }

    function drawInteriorLampBreathing(w, h) {
        const breathe = 0.5 + 0.5 * Math.sin(billAnimElapsed * Math.PI * 2 * CONFIG.interiorLampBreatheSpeed);
        const extra = CONFIG.interiorHalloweenMaxExtraAlpha * getHalloweenAtmosphereFrac();
        const alpha = (CONFIG.interiorLampBreatheAlpha + extra) * breathe;
        if (alpha <= 0.002) return;
        ctx.save();
        const grad = ctx.createRadialGradient(w / 2, h * 0.4, h * 0.15, w / 2, h * 0.4, h * 0.75);
        grad.addColorStop(0, "rgba(255,170,90," + alpha.toFixed(3) + ")");
        grad.addColorStop(1, "rgba(255,170,90,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    // Scrolled variant of drawCoverImage: scales the interior background by
    // HEIGHT ONLY (never stretched) and draws only the horizontal slice
    // that falls within the camera's current viewport, given as a
    // left-edge fraction (0..1) of the full scaled width. Clamped so it
    // can never sample past either edge of the source image.
    function drawInteriorBackgroundScrolled(asset, w, h, cameraFrac) {
        const scale = h / asset.naturalHeight;
        const scaledWidth = asset.naturalWidth * scale;
        const cameraPx = Math.max(0, Math.min(scaledWidth - w, cameraFrac * scaledWidth));

        if (scaledWidth <= w) {
            // Background is narrower than the viewport (e.g. very wide
            // screen) -- center it, same as drawCoverImage would.
            const dx = (w - scaledWidth) / 2;
            ctx.drawImage(asset.image, 0, 0, asset.naturalWidth, asset.naturalHeight, dx, 0, scaledWidth, h);
            return;
        }

        const sx = cameraPx / scale;
        const sWidth = Math.min(asset.naturalWidth - sx, w / scale);
        ctx.drawImage(asset.image, sx, 0, sWidth, asset.naturalHeight, 0, 0, sWidth * scale, h);
    }

    // Shared "cover" image draw: scales a loaded image up/down so it
    // fully fills a w x h area with no gaps, preserving aspect ratio,
    // and crops (never stretches) whichever axis overhangs. Used for
    // the meeting interior backgrounds.
    function drawCoverImage(asset, w, h) {
        const imageRatio = asset.naturalWidth / asset.naturalHeight;
        const targetRatio = w / h;

        let drawWidth, drawHeight;
        if (imageRatio > targetRatio) {
            drawHeight = h;
            drawWidth = h * imageRatio;
        } else {
            drawWidth = w;
            drawHeight = w / imageRatio;
        }

        const dx = (w - drawWidth) / 2;
        const dy = (h - drawHeight) / 2;
        ctx.drawImage(asset.image, dx, dy, drawWidth, drawHeight);
    }

    /* ------------------------------------------------------------------
       ENVIRONMENT PROGRESSION -- which ENVIRONMENT_STATES entry is
       active right now. One function, reused everywhere the outdoor
       scene renders; nothing about the level is duplicated per time of
       day, only these style values change.
       ------------------------------------------------------------------ */
    function getCurrentEnvironmentKey() {
        // The final fade after leaving CMA is its own "winding down" beat,
        // regardless of meetingIndex (there's no walking section after CMA).
        if (state === STATE.TRANSITIONING && transitionPhase === "finishing") {
            return "windingDown";
        }
        return ENVIRONMENT_SEQUENCE[meetingIndex] || ENVIRONMENT_SEQUENCE[ENVIRONMENT_SEQUENCE.length - 1];
    }

    function getCurrentEnvironment() {
        return ENVIRONMENT_STATES[getCurrentEnvironmentKey()];
    }

    function drawBackground(w, h, groundY) {
        // Sky-color fallback only -- shows through solely during the brief
        // gap before the tiled background loads, or if it fails to load
        // at all (see loadEnvironmentAssets). Once the tile is loaded it
        // fully covers this, since the artwork's own sky/land/road are
        // baked into the image. The environment-state color values still
        // do their job here as the "lighting" for that fallback moment.
        const env = getCurrentEnvironment();
        const sky = ctx.createLinearGradient(0, 0, 0, groundY);
        sky.addColorStop(0, env.skyTop);
        sky.addColorStop(1, env.skyBottom);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, groundY);

        // sidewalk / street -- the tile's bottom edge lands exactly on
        // groundY (see drawTiledBackground), so this strip is what's
        // actually beneath Bill and Bob's feet
        ctx.fillStyle = "#2b2b33";
        ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = "#3a3a44";
        ctx.fillRect(0, groundY, w, 6);
    }

    /* ------------------------------------------------------------------
       HALLOWEEN ATMOSPHERE EFFECTS

       Small lit-pumpkin accents and distant trick-or-treater figures,
       layered on top of the tiled background as mood accents (the
       procedural silhouette "buildings" that used to stand in for real
       houses are gone now that actual house sprites exist -- see
       drawHouses). Positioned against distanceTraveled, same as
       everything else at street level, so they scroll in sync with the
       rest of the scene.
       ------------------------------------------------------------------ */
    function drawEnvironmentAtmosphere(w, groundY) {
        const env = getCurrentEnvironment();

        // Uses worldScrollDistance (continuous) rather than distanceTraveled
        // (resets every section) so this parallax never visibly jumps phase
        // when a meeting section changes -- see the note above advanceDistance().
        if (env.pumpkinsLit > 0) {
            const pumpkinSpacing = 340;
            const pumpkinParallax = -(worldScrollDistance * 0.5) % pumpkinSpacing;
            let drawn = 0;
            for (let x = pumpkinParallax - pumpkinSpacing; x < w + pumpkinSpacing && drawn < env.pumpkinsLit; x += pumpkinSpacing) {
                ctx.beginPath();
                ctx.fillStyle = "rgba(255,140,40,0.8)";
                ctx.arc(x, groundY - 10, 7, 0, Math.PI * 2);
                ctx.fill();
                drawn++;
            }
        }

        if (env.figureCount > 0) {
            const figureSpacing = 300;
            const figureParallax = -(worldScrollDistance * 0.4) % figureSpacing;
            let drawn = 0;
            ctx.fillStyle = "rgba(10,10,20," + env.figureOpacity + ")";
            for (let x = figureParallax - figureSpacing; x < w + figureSpacing && drawn < env.figureCount; x += figureSpacing) {
                const bob = Math.sin((worldScrollDistance + x) * 0.02) * 3;
                ctx.fillRect(x - 4, groundY - 26 + bob, 8, 22);
                drawn++;
            }
        }
    }

    /* ------------------------------------------------------------------
       TILED BACKGROUND

       level1-bg1.png is ONE repeating strip -- sky, horizon, open land,
       sidewalk, road all baked into it. It's scaled by HEIGHT ONLY
       (aspect ratio preserved) to fill the entire sky-to-ground band,
       from y=0 down to groundY, the same ground line the gameplay plane
       uses, then tiled horizontally with no gaps for as long as the
       section needs to be. Houses, buildings, and lamps are separate
       objects drawn on top of this -- never baked into the tile itself
       -- so the neighborhood layout can change without touching the
       tile image. If it hasn't loaded yet (or failed to load), nothing
       extra is drawn here -- the sky/street fallback from drawBackground
       already covers that stretch.
       ------------------------------------------------------------------ */
    function drawTiledBackground(w, h, groundY) {
        if (!tileImage.loaded || tileImage.naturalHeight <= 0) return;

        // VISUAL ONLY: fill the entire gameplay canvas with the finished
        // background artwork. groundY is intentionally NOT changed; it
        // remains the gameplay baseline for characters, buildings,
        // obstacles, doorway hit-testing, and every existing mechanic.
        const displayHeight = h;
        const tileWidth = displayHeight * (tileImage.naturalWidth / tileImage.naturalHeight);
        if (tileWidth <= 0) return;

        // Continuous scroll phase (worldScrollDistance), not the
        // per-section distanceTraveled -- otherwise the repeating strip
        // snaps sideways to a new phase the instant a section changes.
        // See the note above advanceDistance().
        const offset = -(worldScrollDistance % tileWidth);
        for (let x = offset - tileWidth; x < w + tileWidth; x += tileWidth) {
            ctx.drawImage(tileImage.image, x, 0, tileWidth, displayHeight);
        }
    }

    /* ------------------------------------------------------------------
       HOUSES -- standalone decorative scenery, placed per meeting
       section by LEVEL1_HOUSES (see sectionHouses, loaded in
       loadHousesForSection). No collision, no interaction; purely
       visual. A placement whose image hasn't loaded (or failed) draws a
       simple placeholder house shape instead of nothing, so the
       neighborhood never shows a gap or a broken-image icon.
       ------------------------------------------------------------------ */
    function drawHouses(w, groundY, primaryX) {
        // VISUAL ONLY: groundY passed here is the scenery baseline at the
        // top edge of the sidewalk. Put the bottom of every house directly
        // on that line (with only a tiny inset into the grass) so there are
        // no more floating houses.
        const houseGroundY = groundY - Math.max(2, canvas.height * 0.006);

        sectionHouses.forEach(function (house) {
            const x = sceneryScreenX(house.section, house.distance, primaryX);

            // Size houses relative to the GAME HEIGHT, not a fixed pixel
            // value. This makes them read as real foreground architecture
            // on portrait phones. Individual placement scales intentionally
            // vary the roofline: taller homes come close to the top of the
            // screen, while smaller homes leave considerably more sky.
            const displayHeight = canvas.height * 0.52 * (house.scale || 1);
            const asset = houseImages[house.assetKey];

            if (x < -220 || x > w + 220) return;

            if (asset && asset.loaded && asset.naturalHeight > 0) {
                const displayWidth = displayHeight * (asset.naturalWidth / asset.naturalHeight);
                ctx.save();
                if (house.flip) {
                    ctx.translate(x, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(asset.image, -displayWidth / 2, houseGroundY - displayHeight, displayWidth, displayHeight);
                } else {
                    ctx.drawImage(asset.image, x - displayWidth / 2, houseGroundY - displayHeight, displayWidth, displayHeight);
                }
                ctx.restore();
                return;
            }

            drawHousePlaceholder(x, houseGroundY, displayHeight);
        });
    }

    function drawHousePlaceholder(x, groundY, displayHeight) {
        const w2 = displayHeight * 0.9;
        const roofH = displayHeight * 0.3;
        const wallH = displayHeight - roofH;

        ctx.save();
        ctx.fillStyle = "#2c2440";
        ctx.fillRect(x - w2 / 2, groundY - wallH, w2, wallH);

        ctx.beginPath();
        ctx.moveTo(x - w2 / 2 - 8, groundY - wallH);
        ctx.lineTo(x, groundY - wallH - roofH);
        ctx.lineTo(x + w2 / 2 + 8, groundY - wallH);
        ctx.closePath();
        ctx.fillStyle = "#201a33";
        ctx.fill();

        ctx.fillStyle = "rgba(255,221,140,0.5)";
        ctx.fillRect(x - w2 / 4, groundY - wallH * 0.65, w2 * 0.18, w2 * 0.18);
        ctx.fillRect(x + w2 / 12, groundY - wallH * 0.65, w2 * 0.18, w2 * 0.18);
        ctx.restore();
    }

    /* ------------------------------------------------------------------
       DECORATIVE NON-ENTRY BUILDINGS -- visual scenery only.

       These use the same sidewalk/architecture baseline as the houses,
       but they are NEVER connected to meeting approach, doorway hit-tests,
       collisions, dialogue, or any other gameplay system. The characters
       simply walk past them.
       ------------------------------------------------------------------ */
    function drawDecorativeBuildings(w, groundY, primaryX) {
        const buildingGroundY = groundY - Math.max(2, canvas.height * 0.006);

        sectionDecorativeBuildings.forEach(function (building) {
            const x = sceneryScreenX(building.section, building.distance, primaryX);
            if (x < -320 || x > w + 320) return;

            const asset = decorativeBuildingImages[building.assetKey];
            if (!asset || !asset.loaded || asset.naturalHeight <= 0) return;

            // Match the visual scale of the residential architecture while
            // leaving a little extra sky above this wider landmark building.
            const displayHeight = canvas.height * 0.48 * (building.scale || 1);
            const displayWidth = displayHeight * (asset.naturalWidth / asset.naturalHeight);

            ctx.save();
            if (building.flip) {
                ctx.translate(x, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(asset.image, -displayWidth / 2, buildingGroundY - displayHeight, displayWidth, displayHeight);
            } else {
                ctx.drawImage(asset.image, x - displayWidth / 2, buildingGroundY - displayHeight, displayWidth, displayHeight);
            }
            ctx.restore();
        });
    }

    /* ------------------------------------------------------------------
       CHANGING STORE BUILDING -- drawn on the real outdoor gameplay
       ground line (via getBuildingRenderGeometry/drawBuilding, same as
       every MEETINGS building), not the architectureY scenery line houses
       use, since Bill and Bob need to actually stop and stand at a real
       doorway on it -- see CHANGING_STORE and updateChangingStoreEvent.
       Only relevant -- and only drawn -- while the current section is
       CHANGING_STORE.section; it behaves like ordinary background art
       (still drawn, just no longer interactive) for the remainder of
       that section once changingStoreCompleted is true.
       ------------------------------------------------------------------ */
    function drawChangingStoreBuilding(w, h, primaryX) {
        const meeting = MEETINGS[meetingIndex];
        if (!meeting || meeting.id !== CHANGING_STORE.section) return;
        const x = worldToScreenX(CHANGING_STORE.distance, primaryX);
        drawBuilding(CHANGING_STORE, w, h, x, false);
    }

    /* ------------------------------------------------------------------
       STREET LAMPS -- standalone decorative scenery, placed per meeting
       section by LEVEL1_STREET_LAMPS. Purely visual, no interaction.
       Scaled relative to the houses/characters (a fixed pixel height),
       not to the viewport.
       ------------------------------------------------------------------ */
    function drawStreetLamps(w, groundY, primaryX) {
        // VISUAL ONLY: lamps sit at the back edge of the sidewalk instead
        // of sharing the characters' road baseline.
        const lampGroundY = groundY - Math.max(10, Math.min(20, w * 0.07));
        sectionStreetLamps.forEach(function (lamp) {
            const x = sceneryScreenX(lamp.section, lamp.distance, primaryX);
            drawStreetLampSprite(x, lampGroundY, w);
        });
    }

    function drawStreetLampSprite(x, groundY, w) {
        if (x < -80 || x > w + 80) return;

        if (streetLampImage.loaded && streetLampImage.naturalHeight > 0) {
            const dispH = CONFIG.streetLampDisplayHeight;
            const dispW = dispH * (streetLampImage.naturalWidth / streetLampImage.naturalHeight);
            ctx.drawImage(streetLampImage.image, x - dispW / 2, groundY - dispH, dispW, dispH);
            return;
        }

        // Fallback: a simple lamp-post-and-glow shape, so a missing lamp
        // image still leaves the street lit rather than bare.
        ctx.save();
        ctx.fillStyle = "#2a2f4d";
        ctx.fillRect(x - 2, groundY - 110, 4, 110);
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 221, 140, 0.55)";
        ctx.arc(x, groundY - 112, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function worldToScreenX(worldDistance, primaryX) {
        return primaryX + (worldDistance - distanceTraveled);
    }

    function drawStreetObstacles(w, groundY, primaryX) {
        if (!CONFIG.obstaclesEnabled) return; // see CONFIG.obstaclesEnabled -- obstacles array is already empty too, this is belt-and-suspenders
        obstacles.forEach(function (o) {
            let x = worldToScreenX(o.distance, primaryX);
            let alpha = 1;

            if (o.rolling) {
                // The skateboard (or any future rollAway obstacle) drifts
                // further away and fades out after a successful kick,
                // rather than just vanishing.
                const progress = 1 - Math.max(0, o.rollAwayTimer / CONFIG.obstacleRollAwayDuration);
                x += progress * CONFIG.obstacleRollAwayDistance;
                alpha = 1 - progress;
            }

            if (x < -60 || x > w + 60) return;
            if (o.resolved && !o.stumbled && !o.rolling) return; // cleanly passed obstacles disappear

            ctx.save();
            ctx.globalAlpha = alpha;
            if (!drawObstacleSprite(o, x, groundY)) {
                drawObstaclePlaceholder(o, x, groundY);
            }
            ctx.restore();
        });
    }

    function drawObstacleSprite(o, x, groundY) {
        // Returns true if it actually drew a sprite frame; false means
        // "no usable sprite yet, caller should fall back to the
        // placeholder." All five obstacles are placeholder-only for now,
        // so this always returns false today -- but a future obstacle
        // with a loaded spriteConfig/spriteImage will render (and
        // animate, if frameCount > 1) automatically, with no other
        // obstacle logic needing to change.
        if (!o.spriteLoaded || !o.spriteImage || !o.spriteConfig) return false;

        const cfg = o.spriteConfig;
        const frameCount = Math.max(1, cfg.frameCount || 1);
        const frameW = cfg.frameWidth || o.spriteImage.width;
        const frameH = cfg.frameHeight || o.spriteImage.height;
        const frameDuration = cfg.frameDuration || 0.15;
        const frame = Math.floor(o.spriteElapsed / frameDuration) % frameCount;

        ctx.drawImage(
            o.spriteImage,
            frame * frameW, 0, frameW, frameH,
            x - frameW / 2, groundY - frameH, frameW, frameH
        );
        return true;
    }

    function drawObstaclePlaceholder(o, x, groundY) {
        // Obviously-labeled placeholder box: color-coded by required
        // action, with the obstacle number and action word printed on it
        // so it's unmistakable during testing which obstacle is which.
        const boxW = 50;
        const boxH = 50;

        ctx.save();
        ctx.fillStyle = obstacleActionColor(o.requiredAction);
        ctx.fillRect(x - boxW / 2, groundY - boxH, boxW, boxH);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - boxW / 2, groundY - boxH, boxW, boxH);

        ctx.fillStyle = "#fdf6e3";
        ctx.textAlign = "center";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText(o.label || "OBSTACLE", x, groundY - boxH + 15);
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(o.requiredAction.toUpperCase(), x, groundY - boxH + 32);
        ctx.restore();
    }

    function obstacleActionColor(action) {
        switch (action) {
            case "jump": return "#d97a2f";
            case "smash": return "#b23b3b";
            case "kick": return "#3b6ea5";
            default: return "#777";
        }
    }

    function drawImpactEffects(w, groundY, primaryX) {
        impactEffects.forEach(function (fx) {
            const x = worldToScreenX(fx.distance, primaryX);
            if (x < -60 || x > w + 60) return;

            const life = Math.max(0, fx.timeRemaining / CONFIG.impactEffectDuration);
            const y = groundY - 30;

            ctx.save();
            ctx.globalAlpha = life;
            ctx.strokeStyle = (fx.kind === "kick") ? "#3b6ea5" : "#b23b3b";
            ctx.lineWidth = 3;

            // Simple radiating burst lines -- placeholder impact feedback,
            // easy to swap for a real effect sprite later.
            const rayCount = 6;
            const innerR = 6;
            const outerR = 10 + (1 - life) * 18;
            for (let i = 0; i < rayCount; i++) {
                const angle = (Math.PI * 2 / rayCount) * i;
                ctx.beginPath();
                ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
                ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    function drawKickLeg(x, groundY, extension) {
        if (extension <= 0) return;
        // Placeholder kick: a simple extended leg jutting forward from
        // the character silhouette. Final animation frames can replace
        // this outright later.
        ctx.save();
        ctx.strokeStyle = "#8a5a34";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x + 6, groundY - 14);
        ctx.lineTo(x + 6 + extension, groundY - 20);
        ctx.stroke();
        ctx.restore();
    }

    // x is the building's already-computed screen position -- section-local
    // for the CURRENT meeting (see the call site in renderOutdoorScene), or
    // continuous-world for a just-EXITED meeting still receding into view
    // (see exitedMeetingIndex).
    function drawBuilding(meeting, w, h, x, isCurrent) {
        // Single source of truth for where/how big this building is drawn --
        // getDoorwayScreenRect() (hit-testing) derives from this same
        // geometry, so the tap target always agrees with what's actually
        // on screen. See the comment above getBuildingRenderGeometry()
        // for why this used to drift.
        const geo = getBuildingRenderGeometry(meeting, w, h, x);
        if (geo.x < -260) return;

        // OPTIONAL PNG OVERRIDE -- the doorway hit-test (getDoorwayScreenRect)
        // reads the same buildingImages/usingOverride check via
        // getBuildingRenderGeometry, so swapping between the override image
        // and the placeholder here never desyncs interaction logic from
        // what's drawn.
        if (geo.usingOverride) {
            drawBuildingImage(buildingImages[meeting.id], geo.x, geo.groundY, geo.displayHeight);
        } else {
            drawBuildingPlaceholder(meeting, geo, isCurrent);
        }
    }


    function getBuildingImageDisplayHeight(styleName, canvasHeight) {
        // Match the visual scale of the residential house sprites. The
        // church gets a little extra height for its steeple; the other
        // meeting buildings stay close to normal two-story house scale.
        switch (styleName) {
            case "church": return canvasHeight * 0.56;
            case "community": return canvasHeight * 0.50;
            case "office": return canvasHeight * 0.52;
            case "hall": return canvasHeight * 0.50;
            case "largeHall": return canvasHeight * 0.68;
            case "store": return canvasHeight * 0.50; // building6.png -- the changing store, sized like an ordinary storefront
            default: return canvasHeight * 0.50;
        }
    }

    function drawBuildingImage(asset, x, groundY, displayHeight) {
        const displayWidth = displayHeight * (asset.naturalWidth / asset.naturalHeight);
        ctx.drawImage(asset.image, x - displayWidth / 2, groundY - displayHeight, displayWidth, displayHeight);
    }

    function drawBuildingPlaceholder(meeting, geo, isCurrent) {
        const x = geo.x, groundY = geo.groundY, buildingHeight = geo.displayHeight;
        const buildingWidth = 180;
        const left = x - buildingWidth / 2;
        const top = groundY - buildingHeight;

        ctx.save();
        ctx.fillStyle = "#20263f";
        ctx.fillRect(left, top, buildingWidth, buildingHeight);

        // simple silhouette differences per style so the four buildings
        // read as different places even as flat placeholders
        ctx.fillStyle = "#171c30";
        if (meeting.buildingStyle === "church") {
            ctx.beginPath();
            ctx.moveTo(left, top);
            ctx.lineTo(left + buildingWidth / 2, top - 40);
            ctx.lineTo(left + buildingWidth, top);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(left + buildingWidth / 2 - 4, top - 60, 8, 24);
        } else if (meeting.buildingStyle === "community") {
            ctx.fillRect(left + 10, top - 14, buildingWidth - 20, 14);
        } else if (meeting.buildingStyle === "office") {
            for (let wy = top + 14; wy < groundY - 14; wy += 22) {
                ctx.fillRect(left + 14, wy, buildingWidth - 28, 10);
            }
        } else if (meeting.buildingStyle === "hall") {
            ctx.beginPath();
            ctx.moveTo(left, top);
            ctx.lineTo(left + buildingWidth, top);
            ctx.lineTo(left + buildingWidth - 20, top - 24);
            ctx.lineTo(left + 20, top - 24);
            ctx.closePath();
            ctx.fill();
        }

        // doorway -- computed from THIS building's own geometry (see
        // computeDoorwayRectFromGeometry), not via getDoorwayScreenRect()
        // (which only ever knows about the CURRENT meeting) -- so an
        // already-exited, receding building draws its placeholder doorway
        // in the right place too, instead of one borrowed from whichever
        // meeting is now current.
        const doorRect = computeDoorwayRectFromGeometry(meeting, geo);
        ctx.fillStyle = (isCurrent && state === STATE.WAITING_AT_DOOR) ? "#f2c14e" : "#0d1020";
        ctx.fillRect(doorRect.left, doorRect.top, doorRect.right - doorRect.left, doorRect.bottom - doorRect.top);

        // fellowship label -- placeholder-only; real building art is
        // expected to show its own signage, so this doesn't draw when
        // an override image is in use (see drawBuilding)
        ctx.fillStyle = "#e8e8f0";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(meeting.label, x, top - 8);

        ctx.restore();
    }

    function buildingStyleHeight(styleName) {
        switch (styleName) {
            case "church": return 170;
            case "community": return 130;
            case "office": return 150;
            case "hall": return 140;
            case "largeHall": return 210;
            case "store": return 140;
            default: return 140;
        }
    }

    // Comic-book skid/slide dust -- TWO sources feed this one renderer:
    // doorwayDustPuffs (the continuous "zip" trail while sliding into a
    // doorway at elevated speed, see updateDoorwayDust) and skidDustPuffs
    // (a big one-time burst the instant Bill/Bob actually stop ANYWHERE,
    // see checkSkidDustBurst/spawnSkidDustBurst). Both are just puffs
    // with a life/maxLife, a belongsTo character, and per-puff jitter/
    // size/rotation baked in at spawn time for variety -- burst puffs are
    // simply bigger and get an inked outline, everything else is shared.
    // billX/bobX are that frame's actual drawn screen positions
    // (primaryDrawX/followerX), so a puff always tracks whichever
    // character it belongs to correctly even as they move. Purely
    // decorative -- never touches collision, position, or movement.
    function drawDust(billX, bobX, groundY) {
        ctx.save();
        const allPuffs = doorwayDustPuffs.concat(skidDustPuffs, runningDustPuffs);
        allPuffs.forEach(function (puff) {
            const t = 1 - Math.max(0, puff.life / puff.maxLife); // 0 = just spawned, 1 = about to vanish
            const baseX = (puff.belongsTo === "bill") ? billX : bobX;
            const cx = baseX + puff.jitterX;
            const cy = groundY + puff.jitterY;
            const scale = puff.sizeScale || 1;

            // Burst puffs (the big skid-stop cloud) get a much larger
            // radius range and a slightly slower fade than a zip puff, so
            // "the faster they were going, the more dramatic" actually
            // reads on screen -- see spawnSkidDustBurst for how sizeScale
            // itself already grows with stop speed. Running foot-dust
            // puffs (isRunning) are the smallest of the three -- just
            // enough to connect a running character to the ground, see
            // spawnRunningDustPuff.
            const radius = puff.isBurst
                ? (14 + t * 34) * scale
                : puff.isRunning
                    ? (5 + t * 9) * scale
                    : (10 + t * 22) * scale;
            const baseAlpha = puff.isBurst ? 0.72 : puff.isRunning ? 0.5 : 0.65;
            const alpha = baseAlpha * (1 - t);
            if (alpha <= 0.01) return;

            // Every puff is drawn as a squashed, rotated ellipse rather
            // than a plain circle -- rotation/scale were randomized at
            // spawn (see spawnDoorwayDustPuff/spawnSkidDustBurst) so a
            // whole cluster reads as several distinct irregular puffs,
            // not one uniform stamped blob.
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(puff.rotation || 0);

            ctx.beginPath();
            ctx.fillStyle = "rgba(214, 202, 176, " + alpha.toFixed(3) + ")";
            ctx.ellipse(0, 0, radius, radius * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            if (puff.isBurst) {
                // Cartoon-ink outline -- only on the big burst puffs, a
                // zip puff stays soft/light to keep reading as a quick
                // trail rather than a comic-panel "POW" cloud.
                ctx.strokeStyle = "rgba(60, 50, 38, " + (alpha * 0.55).toFixed(3) + ")";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.fillStyle = "rgba(255, 250, 235, " + (alpha * 0.8).toFixed(3) + ")";
            ctx.ellipse(0, 0, radius * 0.55, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
        ctx.restore();
    }

    function drawCharacter(x, groundY, color, canvasH, driftY) {
        const bodyW = 26;
        const bodyH = 58;
        const y = groundY - bodyH + driftY;

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(x - bodyW / 2, y, bodyW, bodyH);
        // simple head
        ctx.beginPath();
        ctx.fillStyle = "#e4c9a3";
        ctx.arc(x, y - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Bounding box, top-of-head included, for callers that need an
        // exact anchor (see drawSpeechBubbles) -- head circle is centered
        // at (x, y-10) with radius 12, so its top is y-22.
        return { left: x - bodyW / 2, top: y - 22, width: bodyW, height: bodyH + 22, centerX: x };
    }

    // Bill-specific sprite rendering, driven directly by the actual game
    // `state` -- not by Bill's on-screen position, which barely changes
    // during ordinary walking in this scroll-camera game (the world
    // scrolls under him while his screen x stays close to fixed), so a
    // position-delta approach couldn't reliably tell walking from
    // standing still. Collision/gameplay position (x, groundY) is
    // completely untouched; this only reads x/groundY to place the
    // drawn sprite and reads `state` to choose which of the three
    // animations plays.
    // renderOptions is optional and additive -- every existing outdoor call
    // site passes nothing, so behavior there is byte-for-byte unchanged.
    // It's used by the meeting interior cinematic (see renderInsideMeeting)
    // to render at a larger scale and to drive walk/idle from the interior
    // sequence's own movement instead of outdoor `state`:
    //   scaleMultiplier  -- on-top multiplier applied over billScale (default 1)
    //   walkingOverride  -- if defined (true/false), forces walk/idle and
    //                       skips the outdoor doorway one-shot pose entirely
    // Fresh Threads floss condition. Deliberately scoped to the two
    // stationary CHANGING_STORE_EVENT phases where Bill has already
    // walked clear of the door in his new outfit and stopped moving --
    // "pauseBeforeDialogue2" (the brief comedic beat right after the
    // reveal walk) and "dialogue2" (the post-store dialogue itself) --
    // i.e. the earliest point Bill has reached his outside reveal/
    // dialogue standing spot, per spec. Excludes "reveal" itself (still
    // walking, world coordinates still advancing) and everything before
    // it (hidden inside, or still in the old pre-costume outfit).
    function isBillFlossActive() {
        return state === STATE.CHANGING_STORE_EVENT &&
            (changingStorePhase === "pauseBeforeDialogue2" || changingStorePhase === "dialogue2");
    }

    // Fresh Threads arms-crossed punctuation beat -- the short comedic
    // "button" right after the floss/idle dialogue finishes, before normal
    // gameplay resumes. See the "armsCrossedPose" case in
    // updateChangingStoreEvent for the phase itself (a fixed
    // CONFIG.changingStoreArmsCrossedDuration timer, not tied to dialogue).
    function isBillArmsCrossedActive() {
        return state === STATE.CHANGING_STORE_EVENT && changingStorePhase === "armsCrossedPose";
    }

    function drawBillCharacter(x, groundY, canvasH, verticalOffset, renderOptions) {
        renderOptions = renderOptions || {};
        const scaleMultiplier = renderOptions.scaleMultiplier || 1;
        const useOverride = renderOptions.walkingOverride !== undefined;

        // Fresh Threads floss override -- see isBillFlossActive(). Gates
        // the whole FLOSS/IDLE comedy cycle below; independent of
        // billAppearance/costume2 loading, only needs the funny sheet
        // itself. Never active while useOverride is set (interior meeting
        // cinematic), matching every other outdoor-only pose here.
        const flossCycleActive = !useOverride && isBillFlossActive() && billSpriteImageFunny &&
            billSpriteImageFunny.loaded && billSpriteImageFunny.naturalWidth > 0 && billSpriteImageFunny.naturalHeight > 0;

        // End-of-Fresh-Threads arms-crossed punctuation beat -- see
        // isBillArmsCrossedActive(). Mutually exclusive with flossCycleActive
        // by construction (different changingStorePhase values), same
        // useOverride/funny-sheet-loaded gating.
        const armsCrossedActive = !useOverride && isBillArmsCrossedActive() && billSpriteImageFunny &&
            billSpriteImageFunny.loaded && billSpriteImageFunny.naturalWidth > 0 && billSpriteImageFunny.naturalHeight > 0;

        // FLOSS/IDLE alternation timer. Resets (so the cycle always
        // starts on FLOSS, never IDLE) exactly on the entry edge --
        // isBillFlossActive() going false->true -- same
        // catch-the-entry-edge pattern billWasInDoorwayState already uses
        // below. Left alone (not reset) every other frame so the cycle
        // keeps running smoothly for as long as the dialogue lasts,
        // however long that turns out to be -- this never touches
        // dialogue timing itself, only reads billAnimElapsed against it.
        let flossFrameActive = false;
        let flossPosInCycle = 0;
        if (flossCycleActive) {
            if (!billFlossCyclePrevActive) {
                billFlossCycleStartAt = billAnimElapsed;
            }
            billFlossCyclePrevActive = true;
            const elapsedInCycle = billAnimElapsed - billFlossCycleStartAt;
            const cycleLength = CONFIG.billFlossOnDuration + CONFIG.billFlossOffDuration;
            flossPosInCycle = elapsedInCycle % cycleLength;
            flossFrameActive = flossPosInCycle < CONFIG.billFlossOnDuration;
        } else {
            billFlossCyclePrevActive = false;
            billFlossCycleStartAt = null;
        }

        // Picks costume2 only once it's loaded; falls back to the normal
        // sheet (never to the flat placeholder) if costume2 is missing --
        // billAppearance itself never causes a fallback to the placeholder
        // shape, only a missing/failed image file does. flossFrameActive
        // (the FLOSS half of the cycle only) and armsCrossedActive both
        // skip this entirely and go straight to the funny sheet; the IDLE
        // half of the floss cycle, and everything else, falls through to
        // this exactly as before -- so IDLE reuses Bill's normal costume2
        // idle pose/animation completely unchanged.
        let activeBillImage = (flossFrameActive || armsCrossedActive)
            ? billSpriteImageFunny
            : ((billAppearance === "costume2" && billSpriteImage2 && billSpriteImage2.loaded) ? billSpriteImage2 : billSpriteImage);

        const usingSprite = !!(activeBillImage && activeBillImage.loaded &&
            activeBillImage.naturalWidth > 0 && activeBillImage.naturalHeight > 0);

        if (!usingSprite) {
            // Fallback: unchanged original placeholder look.
            return drawCharacter(x, groundY, "#8a5a34", canvasH, verticalOffset);
        }

        const isWalking = useOverride ? renderOptions.walkingOverride : (state === STATE.WALKING || state === STATE.DASHING);
        const isAtDoorway = useOverride ? false : (state === STATE.APPROACHING_MEETING || state === STATE.WAITING_AT_DOOR);

        let row, col;

        if (armsCrossedActive) {
            // Row 2, cells 0-4, played once in order then held on the last
            // frame -- see BILL_ARMSCROSSED_FRAMES/CONFIG.billArmsCrossedFPS.
            // Paced against updateChangingStoreEvent's own changingStoreTimer
            // countdown (elapsed = total duration so far), not a separate
            // clock, so this always stays in lockstep with the phase that's
            // actually driving how long the beat lasts.
            row = BILL_FUNNY_ROW_ARMSCROSSED;
            const armsCrossedElapsed = Math.max(0, CONFIG.changingStoreArmsCrossedDuration - changingStoreTimer);
            const armsCrossedStep = Math.min(
                BILL_ARMSCROSSED_FRAMES.length - 1,
                Math.floor(armsCrossedElapsed * CONFIG.billArmsCrossedFPS)
            );
            col = BILL_ARMSCROSSED_FRAMES[armsCrossedStep];
            billWasInDoorwayState = false;
            billDoorwaySequenceStartAt = null;
        } else if (flossFrameActive) {
            // Row 0, cells 0-4, looping -- see BILL_FLOSS_FRAMES/
            // CONFIG.billFlossFPS. Time-based against flossPosInCycle (0
            // at the start of each FLOSS window), deliberately not tied
            // to walkSpeed/FASTER -- this is its own idle/comedy
            // animation, not movement. It's fine for the 5-frame sequence
            // to loop more than once within one ~1.4s FLOSS window.
            row = BILL_FUNNY_ROW_FLOSS;
            const flossStep = Math.floor(flossPosInCycle * CONFIG.billFlossFPS) % BILL_FLOSS_FRAMES.length;
            col = BILL_FLOSS_FRAMES[flossStep];
            billWasInDoorwayState = false;
            billDoorwaySequenceStartAt = null;
        } else if (isAtDoorway) {
            // ONE-SHOT reaction: 1 -> 2 -> 3 [-> 20], then hold. Starts
            // fresh exactly once per doorway approach (billWasInDoorwayState
            // catches the entry edge), never loops.
            if (!billWasInDoorwayState) {
                billWasInDoorwayState = true;
                billDoorwaySequenceStartAt = billAnimElapsed;
            }
            const elapsed = billAnimElapsed - billDoorwaySequenceStartAt;
            const stepIndex = Math.min(
                BILL_DOORWAY_SEQUENCE.length - 1,
                Math.floor(elapsed * CONFIG.billDoorwaySequenceFPS)
            );
            row = BILL_DOORWAY_SEQUENCE[stepIndex].row;
            col = BILL_DOORWAY_SEQUENCE[stepIndex].col;
        } else {
            billWasInDoorwayState = false;
            billDoorwaySequenceStartAt = null;

            if (isWalking) {
                // Loop 7 -> 8 -> 9 -> 10 -> 11 (cell 12 intentionally excluded).
                // Outdoor walking uses the faster outdoor-only FPS
                // (CONFIG.billOutdoorStrollFPS, ~25% quicker than before);
                // the meeting cinematic keeps using CONFIG.billStrollFPS
                // unchanged (useOverride is only ever true from inside a
                // meeting -- see renderInsideMeeting).
                const strollFPS = useOverride ? CONFIG.billStrollFPS : CONFIG.billOutdoorStrollFPS;
                const strollStep = Math.floor(billAnimElapsed * strollFPS) % BILL_STROLL_FRAMES.length;
                row = BILL_ROW_RIGHT;
                col = BILL_STROLL_FRAMES[strollStep];
            } else {
                // IDLE: rests on cell 1 almost all the time, with rare,
                // brief 1->2->1 / 1->4->1 blips -- never a continuous cycle.
                row = BILL_ROW_IDLE;
                if (billIdleNextBlipAt === null) {
                    billIdleNextBlipAt = billAnimElapsed + billRandomRange(CONFIG.billIdleBlipMinInterval, CONFIG.billIdleBlipMaxInterval);
                }
                if (billIdleBlipEndAt !== null) {
                    if (billAnimElapsed >= billIdleBlipEndAt) {
                        billIdleBlipEndAt = null;
                        billIdleBlipCol = null;
                        billIdleNextBlipAt = billAnimElapsed + billRandomRange(CONFIG.billIdleBlipMinInterval, CONFIG.billIdleBlipMaxInterval);
                        col = BILL_IDLE_FRAME_COL;
                    } else {
                        col = billIdleBlipCol;
                    }
                } else if (billAnimElapsed >= billIdleNextBlipAt) {
                    billIdleBlipCol = BILL_IDLE_VARIANT_COLS[Math.floor(Math.random() * BILL_IDLE_VARIANT_COLS.length)];
                    billIdleBlipEndAt = billAnimElapsed + CONFIG.billIdleBlipHoldSeconds;
                    col = billIdleBlipCol;
                } else {
                    col = BILL_IDLE_FRAME_COL;
                }
            }
        }

        const cellW = (flossFrameActive || armsCrossedActive) ? (activeBillImage.naturalWidth / BILL_FUNNY_SPRITE_COLS) : (activeBillImage.naturalWidth / BILL_SPRITE_COLS);
        const cellH = (flossFrameActive || armsCrossedActive) ? (activeBillImage.naturalHeight / BILL_FUNNY_SPRITE_ROWS) : (activeBillImage.naturalHeight / BILL_SPRITE_ROWS);
        const srcX = col * cellW;
        const srcY = row * cellH;

        // Every used frame's feet already sit flush with the bottom edge
        // of its own cell (verified against the actual PNG), so scaling
        // the whole cell and bottom-aligning it to groundY keeps Bill's
        // feet planted with no per-frame bounce vertically. Horizontally,
        // the chosen frame's own native offset (see BILL_FRAME_OFFSET_X)
        // is scaled to display space and applied so Bill's body stays
        // stable on his actual gameplay x. billRenderOffsetX/Y remain for
        // overall fine nudging on top of that; gameplay position
        // (x, groundY) itself is untouched.
        const displayHeight = CONFIG.billBaseDisplayHeight * CONFIG.billScale * scaleMultiplier;
        const displayWidth = displayHeight * (cellW / cellH);
        // Torso-anchored auto-measurement for every pose, both costumes
        // -- see the big comment above getAutoFrameOffsetX for why this
        // replaced BILL_FRAME_OFFSET_X (that table centered each frame's
        // WHOLE silhouette, which visibly hops the body whenever an idle
        // blip/gesture changes arm position, or a walk cycle swings a
        // leg -- both confirmed live via the debug overlay).
        // flossFrameActive skips the auto-measurement entirely -- the funny
        // sheet is already a clean, pre-normalized programming grid (see
        // BILL_FUNNY_SPRITE_COLS/ROWS above), so each cell is drawn as-is
        // with no per-frame recentering, same spirit as skipping the
        // inset table below.
        const billCacheKey = "bill-" + billAppearance;
        const billOffsetX = (flossFrameActive || armsCrossedActive) ? 0 : getAutoFrameOffsetX(billCacheKey, activeBillImage.image, row, col, cellW, cellH, srcX, srcY);
        const frameOffsetDisplay = billOffsetX * (displayWidth / cellW);
        const destX = x - displayWidth / 2 + frameOffsetDisplay + CONFIG.billRenderOffsetX;
        const destY = groundY - displayHeight + verticalOffset + CONFIG.billRenderOffsetY;

        if (typeof window !== "undefined" && window.DEBUG_ANCHOR) {
            debugTrackAnchor("bill", row, col, billAppearance, !!renderOptions.facingLeft, x, destX, displayWidth);
            debugDrawAnchorLine(x, groundY);
        }

        // Directional, appearance-aware inset on the SOURCE rect -- see
        // SPRITE_INSET above. costume2 gets a much bigger TOP margin to
        // guard against the row-above bleed observed above Bill's head;
        // the bottom margin stays minimal so feet are never additionally
        // clipped by this inset itself.
        // flossFrameActive deliberately bypasses SPRITE_INSET/spriteInsetFor --
        // per spec, none of the old Bill2 crop hacks apply to this new,
        // already-normalized sheet. Full 256x256 cell, straight through.
        const billInset = (flossFrameActive || armsCrossedActive) ? { top: 0, bottom: 0, left: 0, right: 0 } : spriteInsetFor(billAppearance, row);
        const srcXi = srcX + billInset.left;
        const srcYi = srcY + billInset.top;
        const srcWi = cellW - billInset.left - billInset.right;
        const srcHi = cellH - billInset.top - billInset.bottom;

        // facingLeft (set every frame by updateCharacterFacing -- see that
        // function for the full priority order, both indoors and out).
        // Mirrors the SAME frames horizontally around Bill's own x rather
        // than using separate left-facing art. imageSmoothingEnabled is
        // turned off just for this draw so the large interior scale-up
        // can't sample pixels from the neighboring sprite-sheet cell at
        // the frame's edges -- see the matching note in drawBobCharacter.
        const wasSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        let screenLeft;
        if (renderOptions.facingLeft) {
            screenLeft = 2 * x - destX - displayWidth;
            ctx.save();
            ctx.translate(x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(activeBillImage.image, srcXi, srcYi, srcWi, srcHi, destX - x, destY, displayWidth, displayHeight);
            ctx.restore();
        } else {
            screenLeft = destX;
            ctx.drawImage(activeBillImage.image, srcXi, srcYi, srcWi, srcHi, destX, destY, displayWidth, displayHeight);
        }
        ctx.imageSmoothingEnabled = wasSmoothing;

        if (DEBUG_BILL_SPRITE) {
            drawBillDebugOverlay(x, groundY, destX, destY, displayWidth, displayHeight);
        }

        return { left: screenLeft, top: destY, width: displayWidth, height: displayHeight, centerX: screenLeft + displayWidth / 2 };
    }

    function billRandomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    // DEBUG ONLY -- see DEBUG_BILL_SPRITE. Draws the gameplay baseline
    // crosshair and the drawn sprite frame's bounds.
    function drawBillDebugOverlay(x, groundY, destX, destY, displayWidth, displayHeight) {
        ctx.save();
        ctx.strokeStyle = "#ff2d55";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 10, groundY);
        ctx.lineTo(x + 10, groundY);
        ctx.moveTo(x, groundY - 10);
        ctx.lineTo(x, groundY + 10);
        ctx.stroke();
        ctx.strokeStyle = "rgba(45, 210, 255, 0.8)";
        ctx.strokeRect(destX, destY, displayWidth, displayHeight);
        ctx.restore();
    }

    // DEBUG -- draws a crosshair at Bob's ground-anchor point (x, groundY)
    // and a rectangle around his COMPLETE destination box (destX, destY,
    // displayWidth, displayHeight) -- i.e. exactly the box drawImage()
    // targets. If his shoe soles are ever cut off INSIDE this box, the
    // bug is in the source crop (frame.canvas has real content missing).
    // If they're cut off only where the box itself crosses the canvas/
    // container edge, the bug is on the destination/rendering side
    // instead (canvas size, a CSS container, a clip region) -- see
    // CONFIG.debugShowBobBounds below to flip this on.
    const DEBUG_BOB_SPRITE = CONFIG.debugShowBobBounds;

    // Bob-specific sprite rendering, structured exactly like
    // drawBillCharacter (same fallback/offset/bottom-alignment approach)
    // but fully independent of it -- nothing about Bill's function is
    // shared or modified. Driven by the EXISTING follower state machine
    // (updateFollower/FOLLOWER_STATE, untouched) plus Bill's own `state`,
    // not by Bob's screen position:
    //   - Bill is approaching/waiting at a doorway AND Bob has already
    //     closed the gap (not CATCHING_UP)  -> one-shot 19->6, hold on 6
    //   - Bill is WALKING/DASHING, OR Bob is still CATCHING UP to his
    //     normal trailing spot (even if Bill has already stopped)  -> walk
    //   - otherwise (including FOLLOWER_STATE.WAITING, Bill's brief
    //     personality pauses)  -> idle, resting on cell 1 with rare,
    //     brief 1->2->1 blips
    // renderOptions mirrors drawBillCharacter's -- see the comment above it.
    // walkingOverride, when defined, also fully bypasses the outdoor
    // follower state machine (FOLLOWER_STATE/isCatchingUp) and the doorway
    // one-shot pose, since neither applies to the interior cinematic's own
    // Bob-eases-toward-Bill logic (see updateInteriorBob).
    function drawBobCharacter(x, groundY, canvasH, verticalOffset, renderOptions) {
        renderOptions = renderOptions || {};
        const scaleMultiplier = renderOptions.scaleMultiplier || 1;
        const useOverride = renderOptions.walkingOverride !== undefined;

        // Ambient action override -- see updateBobAmbientAction. Only ever
        // true while bobAmbientActiveAction is set (meaning: eligible
        // meeting, an actual dialoguePoint stop, Bob fully settled, and the
        // random roll landed on one of his two selected actions this
        // meeting), and only if the funny sheet itself actually loaded.
        const bobAmbientFrameActive = !!bobAmbientActiveAction && bobSpriteImageFunny &&
            bobSpriteImageFunny.loaded && bobSpriteImageFunny.naturalWidth > 0 && bobSpriteImageFunny.naturalHeight > 0;

        // Same pattern as drawBillCharacter's activeBillImage -- picks
        // costume2 only once it's actually loaded, otherwise stays on the
        // normal sheet (never falls to the flat placeholder just because
        // of an appearance switch, only a missing/failed file does that).
        // bobAmbientFrameActive skips this entirely and goes straight to
        // the funny sheet; if that sheet fails to load, bobAmbientFrameActive
        // is simply false (see above) and this picks the normal
        // costume2/normal sheet exactly as before.
        const activeBobImage = bobAmbientFrameActive
            ? bobSpriteImageFunny
            : ((bobAppearance === "costume2" && bobSpriteImage2 && bobSpriteImage2.loaded) ? bobSpriteImage2 : bobSpriteImage);

        const usingSprite = !!(activeBobImage && activeBobImage.loaded &&
            activeBobImage.naturalWidth > 0 && activeBobImage.naturalHeight > 0);

        if (!usingSprite) {
            // Fallback: unchanged original placeholder look.
            return drawCharacter(x, groundY, "#3b6ea5", canvasH, verticalOffset);
        }

        const isCatchingUp = useOverride ? false : (follower.state === FOLLOWER_STATE.CATCHING_UP);
        const isDoorway = useOverride ? false : (state === STATE.APPROACHING_MEETING || state === STATE.WAITING_AT_DOOR);
        const isBillWalking = useOverride ? renderOptions.walkingOverride : (state === STATE.WALKING || state === STATE.DASHING);

        let row, col;

        if (bobAmbientFrameActive) {
            // Whichever action is active -- own row, own frames, own FPS,
            // see BOB_AMBIENT_ACTIONS. Paced off bobAmbientElapsed
            // (accumulated in updateBobAmbientAction, dt-based) rather than
            // bobAnimElapsed, so a mid-action cancel/restart next time
            // never inherits a stale phase.
            const activeActionDef = BOB_AMBIENT_ACTIONS[bobAmbientActiveAction];
            row = activeActionDef.row;
            const ambientStep = Math.min(
                activeActionDef.frames.length - 1,
                Math.floor(bobAmbientElapsed * activeActionDef.fps)
            );
            col = activeActionDef.frames[ambientStep];
            bobWasInDoorwayState = false;
            bobDoorwaySequenceStartAt = null;
        } else if (isDoorway && !isCatchingUp) {
            // ONE-SHOT: 19 -> 6, then hold. Only starts once Bob has
            // actually closed the gap and settled -- while he's still
            // hustling to catch up (isCatchingUp), he keeps walking below.
            if (!bobWasInDoorwayState) {
                bobWasInDoorwayState = true;
                bobDoorwaySequenceStartAt = bobAnimElapsed;
            }
            const elapsed = bobAnimElapsed - bobDoorwaySequenceStartAt;
            const stepIndex = Math.min(
                BOB_DOORWAY_SEQUENCE.length - 1,
                Math.floor(elapsed * CONFIG.bobDoorwaySequenceFPS)
            );
            row = BOB_DOORWAY_SEQUENCE[stepIndex].row;
            col = BOB_DOORWAY_SEQUENCE[stepIndex].col;
        } else {
            bobWasInDoorwayState = false;
            bobDoorwaySequenceStartAt = null;

            if (isBillWalking || isCatchingUp) {
                // Loop 7 -> 8 -> 9 -> 10 -> 11 -> 12. Outdoor uses the
                // faster outdoor-only FPS (CONFIG.bobOutdoorStrollFPS,
                // ~25% quicker); the meeting cinematic keeps
                // CONFIG.bobStrollFPS unchanged (useOverride is only ever
                // true from inside a meeting -- see renderInsideMeeting).
                const strollFPS = useOverride ? CONFIG.bobStrollFPS : CONFIG.bobOutdoorStrollFPS;
                const strollStep = Math.floor(bobAnimElapsed * strollFPS) % BOB_WALK_FRAMES.length;
                row = BOB_ROW_WALK;
                col = BOB_WALK_FRAMES[strollStep];
            } else {
                // IDLE: rests on cell 1 almost all the time, with a rare,
                // brief 1->2->1 blip -- never a continuous cycle.
                row = BOB_ROW_A;
                if (bobIdleNextBlipAt === null) {
                    bobIdleNextBlipAt = bobAnimElapsed + billRandomRange(CONFIG.bobIdleBlipMinInterval, CONFIG.bobIdleBlipMaxInterval);
                }
                if (bobIdleBlipEndAt !== null) {
                    if (bobAnimElapsed >= bobIdleBlipEndAt) {
                        bobIdleBlipEndAt = null;
                        bobIdleNextBlipAt = bobAnimElapsed + billRandomRange(CONFIG.bobIdleBlipMinInterval, CONFIG.bobIdleBlipMaxInterval);
                        col = BOB_IDLE_FRAME_COL;
                    } else {
                        col = BOB_IDLE_VARIANT_COL;
                    }
                } else if (bobAnimElapsed >= bobIdleNextBlipAt) {
                    bobIdleBlipEndAt = bobAnimElapsed + CONFIG.bobIdleBlipHoldSeconds;
                    col = BOB_IDLE_VARIANT_COL;
                } else {
                    col = BOB_IDLE_FRAME_COL;
                }
            }
        }

        const cellW = bobAmbientFrameActive ? (activeBobImage.naturalWidth / BOB_FUNNY_SPRITE_COLS) : (activeBobImage.naturalWidth / BOB_SPRITE_COLS);
        const cellH = bobAmbientFrameActive ? (activeBobImage.naturalHeight / BOB_FUNNY_SPRITE_ROWS) : (activeBobImage.naturalHeight / BOB_SPRITE_ROWS);
        const srcX = col * cellW;
        const srcY = row * cellH;

        // Every used frame except cell 19 has its feet flush with its
        // cell's bottom edge already (verified against the actual PNG);
        // cell 19 gets its own vertical correction (BOB_FRAME_OFFSET_Y)
        // so it doesn't visibly hop relative to cell 6 right after it in
        // the doorway sequence. Horizontal centering uses the same
        // per-frame native-offset-scaled-to-display-space approach as
        // Bill's sprite. bobRenderOffsetX/Y remain for overall fine
        // nudging on top of that; gameplay position (x, groundY) itself
        // is untouched -- this only affects where the art is drawn.
        const displayHeight = CONFIG.bobBaseDisplayHeight * CONFIG.bobScale * scaleMultiplier;
        const displayWidth = displayHeight * (cellW / cellH);
        // Same reasoning as billOffsetX in drawBillCharacter: torso-
        // anchored auto-measurement for every pose, both costumes -- see
        // the comment above getAutoFrameOffsetX. This replaces
        // BOB_FRAME_OFFSET_X, which centered each frame's whole
        // silhouette and was confirmed live (via the debug overlay) to
        // visibly hop Bob's body -- both on the 0,0 <-> 0,1 idle-blip
        // transition, and worse, during ordinary walking once an
        // intermediate feet-only anchor was tried. Y is untouched (still
        // BOB_FRAME_OFFSET_Y) -- the reported bug is horizontal only,
        // and every used frame's feet are already flush to its cell's
        // bottom edge except cell 19, which that table already corrects
        // for.
        const bobCacheKey = "bob-" + bobAppearance;
        // bobAmbientFrameActive skips the auto-measurement/Y-correction
        // entirely -- the funny sheet is already a clean, pre-normalized
        // programming grid (see BOB_FUNNY_SPRITE_COLS/ROWS above), same
        // as Bill's floss handling.
        const bobOffsetXRaw = bobAmbientFrameActive ? 0 : getAutoFrameOffsetX(bobCacheKey, activeBobImage.image, row, col, cellW, cellH, srcX, srcY);
        const bobOffsetYRaw = bobAmbientFrameActive ? 0 : ((bobAppearance === "costume2") ? 0 : bobFrameOffsetY(row, col));
        const offsetXDisplay = bobOffsetXRaw * (displayWidth / cellW);
        const offsetYDisplay = bobOffsetYRaw * (displayHeight / cellH);
        const destX = x - displayWidth / 2 + offsetXDisplay + CONFIG.bobRenderOffsetX;
        // CONFIG.bobRenderOffsetY (-24) is bob2-specific -- tuned to
        // correct basic-level1-bob2.png's own irregular vertical spacing,
        // never meant for the funny sheet. Confirmed via [BOB FRAME DEBUG]
        // measurement that a bare bottom-anchor (0 correction) was the
        // WRONG assumption for the funny sheet too, though for a different
        // reason: bob2's own feet visually sit ~24px above a naive
        // bottom-anchor (that's what its -24 is really compensating for),
        // so zero-correction funny frames landed ~24px BELOW bob2's own
        // baseline -- a sustained "feet sinking into the ground" for the
        // whole duration of the animation, confirmed against actual
        // gameplay video. CONFIG.bobFunnyRenderOffsetY is a separate,
        // independently-tunable constant for exactly this -- see its
        // definition above. It only ever affects the funny sheet; bob2's
        // own rendering (the "costume2 | costume2" case above) is
        // completely unchanged.
        const destY = groundY - displayHeight + verticalOffset + offsetYDisplay +
            (bobAmbientFrameActive ? CONFIG.bobFunnyRenderOffsetY : CONFIG.bobRenderOffsetY);

        if (typeof window !== "undefined" && window.DEBUG_ANCHOR) {
            // NOTE: debugTrackAnchor's poseKey is "row,col,appearanceLabel,
            // facingLeft" -- it has no idea which SHEET is active on its
            // own. BOB_FUNNY_ROW_DONUT (1) and BOB_FUNNY_ROW_COFFEE (0) are
            // the SAME row numbers as costume2's own walk row (1) and idle
            // row (0), so passing plain bobAppearance here would make an
            // [ANCHOR JUMP] on, say, "1,4,costume2,false" ambiguous --
            // genuinely impossible to tell whether that's costume2's own
            // walk-cycle frame 1,4 or a funny donut frame 1,4. Folding the
            // active ambient action into the label removes that ambiguity.
            const bobAnchorLabel = bobAmbientFrameActive ? ("funny-" + bobAmbientActiveAction) : bobAppearance;
            debugTrackAnchor("bob", row, col, bobAnchorLabel, !!renderOptions.facingLeft, x, destX, displayWidth);
            debugDrawAnchorLine(x, groundY);
            // TEMPORARY -- see debugLogBobFrameGeometry above. Draws the
            // same destination-box overlay drawBillDebugOverlay already
            // provides elsewhere, plus a full geometry dump on every
            // normal<->funny identity change.
            drawBillDebugOverlay(x, groundY, destX, destY, displayWidth, displayHeight);
            debugLogBobFrameGeometry({
                sheetLabel: bobAmbientFrameActive ? "funny" : bobAppearance,
                animName: bobAmbientFrameActive ? bobAmbientActiveAction : bobAppearance,
                row: row, col: col,
                image: activeBobImage.image, srcX: srcX, srcY: srcY, cellW: cellW, cellH: cellH,
                destX: destX, destY: destY, destW: displayWidth, destH: displayHeight,
                worldX: x, groundY: groundY,
                scaleMultiplier: scaleMultiplier,
                verticalOffset: verticalOffset,
                offsetYDisplay: offsetYDisplay,
                bob2OffsetYApplied: bobAmbientFrameActive ? CONFIG.bobFunnyRenderOffsetY : CONFIG.bobRenderOffsetY,
                cropInsetLabel: bobAmbientFrameActive ? JSON.stringify(bobFunnyCropInset(bobAmbientActiveAction, row, col)) : JSON.stringify(bobCropInset(bobAppearance, row, col)),
                usingIsolatedCanvas: true
            });
        }

        if (bobAmbientFrameActive) {
            // Draw from this cell's own isolated, pre-cropped canvas (see
            // getBobFunnyFrameCanvas) instead of the shared 1280x1024
            // funny sheet Image -- same structural fix as the normal
            // sheet's getBobFrameCanvas/bobFrameCanvasCache just above,
            // now applied here too so neighboring-cell artwork (e.g. the
            // row above bleeding in above Bob's head) has no pixels left
            // to sample from once this canvas is what actually gets
            // scaled. bobFunnyRenderOffsetY (vertical alignment) is
            // completely separate from this and untouched -- this only
            // changes WHERE the source pixels are read from, not where
            // they're drawn on screen.
            //
            // Drawn at the SAME destX/destY/displayWidth/displayHeight
            // every uncropped frame already uses -- deliberately NOT
            // scaling the destination box down to match
            // BOB_FUNNY_CROP_INSET_BY_ROW's (rows 1-3) top margin. An
            // earlier pass here tried compensating for that (shrinking
            // the box and shifting it down to preserve exact 1:1 scale),
            // but that visibly cut Bob off on rows 1-3 -- confirmed
            // directly against gameplay screenshots. Reverted to this
            // simpler stretch-to-fill approach instead, which is exactly
            // what getBobFrameCanvas/drawBobCharacter's own normal-sheet
            // path already does for bob2's OWN row insets above (see
            // BOB_CROP_INSET) -- a proven, already-shipped pattern. The
            // trade-off is a small (single-digit-percent) vertical
            // stretch on rows 1-3 specifically, same as bob2 already
            // accepts for its own insets; that's a minor proportion
            // difference, not a visible clipping bug.
            const funnyFrame = getBobFunnyFrameCanvas(bobAmbientActiveAction, activeBobImage.image, row, col, cellW, cellH, srcX, srcY);
            const wasSmoothingAmbient = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = false;
            let ambientScreenLeft;
            if (renderOptions.facingLeft) {
                ambientScreenLeft = 2 * x - destX - displayWidth;
                ctx.save();
                ctx.translate(x, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(funnyFrame.canvas, 0, 0, funnyFrame.width, funnyFrame.height, destX - x, destY, displayWidth, displayHeight);
                ctx.restore();
            } else {
                ambientScreenLeft = destX;
                ctx.drawImage(funnyFrame.canvas, 0, 0, funnyFrame.width, funnyFrame.height, destX, destY, displayWidth, displayHeight);
            }
            ctx.imageSmoothingEnabled = wasSmoothingAmbient;

            if (DEBUG_BOB_SPRITE) {
                drawBillDebugOverlay(x, groundY, destX, destY, displayWidth, displayHeight);
            }

            return { left: ambientScreenLeft, top: destY, width: displayWidth, height: displayHeight, centerX: ambientScreenLeft + displayWidth / 2 };
        }

        // The actual fix: draw from this cell's own isolated, pre-cropped
        // canvas (see getBobFrameCanvas) instead of the shared spritesheet
        // Image. That canvas physically contains only this cell's pixels,
        // so there is nothing left for any scale factor or filtering mode
        // to bleed in from a neighboring pose -- see the long comment by
        // BOB_CROP_INSET above for why this is a structural fix rather
        // than another tweak of the same source-rect-inset approach.
        const frame = getBobFrameCanvas(bobAppearance, activeBobImage.image, row, col, cellW, cellH, srcX, srcY);

        // facingLeft (set every frame by updateCharacterFacing -- see that
        // function for the full priority order, both indoors and out).
        // Same mirror-about-x approach as Bill; see the note in
        // drawBillCharacter. imageSmoothingEnabled off here too -- belt-
        // and-suspenders on top of the isolation fix, and harmless either
        // way since the isolated canvas has no neighbor data to sample
        // regardless.
        const wasSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        let screenLeft;
        if (renderOptions.facingLeft) {
            screenLeft = 2 * x - destX - displayWidth;
            ctx.save();
            ctx.translate(x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(frame.canvas, 0, 0, frame.width, frame.height, destX - x, destY, displayWidth, displayHeight);
            ctx.restore();
        } else {
            screenLeft = destX;
            ctx.drawImage(frame.canvas, 0, 0, frame.width, frame.height, destX, destY, displayWidth, displayHeight);
        }
        ctx.imageSmoothingEnabled = wasSmoothing;

        if (DEBUG_BOB_SPRITE) {
            drawBillDebugOverlay(x, groundY, destX, destY, displayWidth, displayHeight);
        }

        return { left: screenLeft, top: destY, width: displayWidth, height: displayHeight, centerX: screenLeft + displayWidth / 2 };
    }

    // CROWD DIALOGUE BUBBLES -- an anonymous meeting-room voice (script.js
    // "crowd:" lines), not anchored to Bill or Bob at all. Only meaningful
    // while state === STATE.INSIDE_MEETING (that's the only place script.js
    // is ever expected to queue a crowd line -- see drawSpeechBubbles).
    //
    // Normalized (0..1) fractions of the canvas, not raw pixels, so they
    // stay correctly placed at any screen size. Kept away from the top
    // HUD strip (hearts/clock/progress bar) and the side edges, and
    // biased toward the upper-middle of the room -- above where Bill and
    // Bob's heads normally are at interior scale -- per the "avoid their
    // faces when possible" request. A small, fixed set on purpose (not
    // random/procedural placement) -- just enough that consecutive crowd
    // lines don't all come from the exact same spot.
    const CROWD_BUBBLE_PRESETS = [
        { xFrac: 0.26, yFrac: 0.30 }, // upper-left
        { xFrac: 0.50, yFrac: 0.27 }, // upper-middle
        { xFrac: 0.74, yFrac: 0.31 }, // upper-right
        { xFrac: 0.34, yFrac: 0.40 }, // mid-left
        { xFrac: 0.68, yFrac: 0.41 }  // mid-right
    ];
    function pickCrowdBubblePreset() {
        const preset = CROWD_BUBBLE_PRESETS[crowdBubblePresetIndex % CROWD_BUBBLE_PRESETS.length];
        crowdBubblePresetIndex += 1;
        return preset;
    }

    // BUILDING SPEECH BUBBLES ("building-dialogue:" lines in script.js) --
    // anchored to whichever building/landmark is actually the current
    // outdoor context, reusing each one's OWN existing render geometry
    // rather than tracking a separate duplicate position for this:
    //   - Fresh Threads event active -> the CHANGING_STORE building
    //   - Dry People's Club stop active -> its own decorative landmark
    //     entry in LEVEL1_DECORATIVE_BUILDINGS (matched by section+distance,
    //     same "noEntry2" object drawDecorativeBuildings already draws --
    //     never a duplicated/hardcoded position)
    //   - otherwise -> the meeting building currently being approached
    //     (MEETINGS[meetingIndex]), which covers the normal case of
    //     building-dialogue lines inside Outside-level1's dialogue points
    // Returns null only while inside a meeting (renderInsideMeeting never
    // calls this -- there's no exterior building on screen there), in
    // which case drawSpeechBubbles skips a "building" bubble silently
    // rather than guessing a screen position.
    function getActiveBuildingBubbleAnchor(w, h, primaryX) {
        const architectureY = outdoorArchitectureY(h);
        let geo = null;
        let anchorX = null;

        if (state === STATE.CHANGING_STORE_EVENT) {
            anchorX = worldToScreenX(CHANGING_STORE.distance, primaryX);
            geo = getBuildingRenderGeometry(CHANGING_STORE, w, h, anchorX);
        } else if (state === STATE.DRY_CLUB_DIALOGUE) {
            const landmark = LEVEL1_DECORATIVE_BUILDINGS.filter(function (b) {
                return b.section === DRY_CLUB_STOP.section && b.distance === DRY_CLUB_STOP.distance;
            })[0];
            if (landmark) {
                anchorX = sceneryScreenX(landmark.section, landmark.distance, primaryX);
                const buildingGroundY = architectureY - Math.max(2, h * 0.006); // matches drawDecorativeBuildings' own buildingGroundY exactly
                geo = { groundY: buildingGroundY, displayHeight: h * 0.48 * (landmark.scale || 1) };
            }
        } else {
            const meeting = MEETINGS[meetingIndex];
            if (meeting) {
                anchorX = worldToScreenX(getCurrentSectionDistance(), primaryX);
                geo = getBuildingRenderGeometry(meeting, w, h, anchorX);
            }
        }

        if (!geo || anchorX === null) return null;

        // Upper-middle of the building, not its peak/roofline and not its
        // doorway -- reads as "the building/sign itself" rather than
        // pointing at any one architectural feature (per the "aim for the
        // upper/front, avoid covering signage" request), then floored so a
        // tall building (the AA church) never pushes the bubble up under
        // the HUD strip.
        const rawAnchorY = geo.groundY - geo.displayHeight * 0.78 - CONFIG.buildingBubbleMargin;
        const minAnchorY = h * CONFIG.buildingBubbleMinYFrac;
        return { x: anchorX, y: Math.max(rawAnchorY, minAnchorY) };
    }

    function drawSpeechBubbles(primaryX, followerX, groundY, h, canvasWidth, billBox, bobBox, buildingAnchor) {
        // Only one dialogue bubble is ever active at once -- see updateDialogue().
        // billBox/bobBox are the EXACT bounding boxes drawBillCharacter/
        // drawBobCharacter just drew (screen-space left/top/width/height,
        // already correct for camera scroll, facing/flip, jump/lean
        // offsets, and interior vs outdoor scale -- see their `return` at
        // the end of each). Anchoring off the real returned box, instead
        // of a fixed screen position or an approximate height formula, is
        // what keeps the bubble glued to the actual speaker everywhere:
        // outdoors, inside a meeting, while the camera scrolls, and
        // whichever way they're currently facing. billBubbleMargin/
        // bobBubbleMargin give each character its own small fixed gap
        // above their own head, independent of the other.
        //
        // TWO visual styles, one intentional distinction (see drawBubble
        // vs drawWorldBubble): Bill/Bob speaking use the original comic
        // speech-balloon design, unchanged. Crowd chatter and building
        // dialogue -- voices from the world/environment around them, not
        // one of the two main characters -- both route through the SAME
        // drawWorldBubble instead, so there's exactly one place that
        // defines what "ambient dialogue" looks like.
        // Brief overlap: the previous world-chatter line, still fading
        // out, drawn first (underneath, visually secondary) so it never
        // competes with the new one -- see updateDialogue's
        // fadingWorldBubble handling above. Crowd-only, same as the
        // overlap logic itself.
        if (fadingWorldBubble && state === STATE.INSIDE_MEETING && fadingWorldBubble.crowdPos) {
            const fadeAlpha = Math.max(0, fadingWorldBubble.life / fadingWorldBubble.maxLife) * 0.7; // caps below full opacity so it always reads as "the old one," never competes with the fresh bubble
            drawWorldBubble(fadingWorldBubble.crowdPos.xFrac * canvasWidth, fadingWorldBubble.crowdPos.yFrac * h,
                fadingWorldBubble.text, canvasWidth, h, fadeAlpha, null); // null popStartTime -- it's fading out, not appearing, so no pop-in
        }

        if (activeBubble && activeBubble.speaker === "crowd") {
            // Anonymous meeting-room voice -- no anchor box at all, just
            // one of the preset room positions picked when this bubble
            // was created (see updateDialogue). Only rendered inside a
            // meeting; if a crowd line somehow reached this call outside
            // one (script.js is meeting-only for "crowd:" today), skip it
            // silently rather than showing an anonymous bubble outdoors.
            if (state === STATE.INSIDE_MEETING && activeBubble.crowdPos) {
                drawWorldBubble(activeBubble.crowdPos.xFrac * canvasWidth, activeBubble.crowdPos.yFrac * h,
                    activeBubble.text, canvasWidth, h, 1, activeBubble.popStartTime);
            }
        } else if (activeBubble && activeBubble.speaker === "building") {
            // "building-dialogue:" lines -- anchored to whichever building
            // is the current outdoor context (see getActiveBuildingBubbleAnchor,
            // recomputed fresh every frame so it scrolls with the world
            // exactly like the building itself). null while inside a
            // meeting -- skip silently rather than guessing a position.
            if (buildingAnchor) {
                drawWorldBubble(buildingAnchor.x, buildingAnchor.y, activeBubble.text, canvasWidth, h, 1, activeBubble.popStartTime);
            }
        } else if (activeBubble) {
            const isBill = (activeBubble.speaker === "bill");
            const box = isBill ? billBox : bobBox;
            let anchorX, bubbleY;
            if (box) {
                anchorX = box.centerX;
                bubbleY = box.top - (isBill ? CONFIG.billBubbleMargin : CONFIG.bobBubbleMargin);
            } else {
                // Fallback only -- both real call sites always pass a box.
                anchorX = isBill ? primaryX : followerX;
                bubbleY = groundY - 110;
            }
            drawBubble(anchorX, bubbleY, activeBubble.text, canvasWidth, h, activeBubble.popStartTime);
        }

        if (state === STATE.WAITING_AT_DOOR) {
            const meeting = MEETINGS[meetingIndex];
            const x = worldToScreenX(getCurrentSectionDistance(), primaryX);
            const override = buildingImages[meeting.id];
            const hasBuildingImage = !!(override && override.loaded && override.naturalHeight > 0);
            const visibleBuildingHeight = hasBuildingImage
                ? getBuildingImageDisplayHeight(meeting.buildingStyle, h)
                : buildingStyleHeight(meeting.buildingStyle);
            // Bill's own inner thought while waiting, not ambient chatter
            // -- keeps the character-style bubble, unchanged. Pops in
            // once using doorwayWaitTimer (already resets to 0 the
            // instant WAITING_AT_DOOR begins, see updateDoorwayWait) as
            // its "time since appeared" -- billAnimElapsed - doorwayWaitTimer
            // is exactly the billAnimElapsed value it first appeared at.
            drawBubble(x, groundY - visibleBuildingHeight - 26,
                "God, grant me the serenity...", canvasWidth, h, billAnimElapsed - doorwayWaitTimer);
        }
    }

    // ------------------------------------------------------------------
    // COMIC BUBBLE POP-IN -- shared by both bubble families. Reads
    // elapsed time since the bubble was created (billAnimElapsed minus
    // the popStartTime stamped on it in updateDialogue, or passed
    // directly for the always-on WAITING_AT_DOOR bubble) and returns a
    // scale/rotation to apply for a brief comic "pop": 90% -> ~105% ->
    // 100%, settling from a small +/-1 degree tilt. One-shot -- once
    // elapsed passes popDuration it always returns {scale:1, rotation:0},
    // so this never becomes a continuous bounce. Passing popStartTime as
    // null/undefined (the fading-out echo bubble) skips the pop entirely.
    // ------------------------------------------------------------------
    function getBubblePopTransform(popStartTime, anchorX) {
        if (popStartTime === null || popStartTime === undefined) {
            return { scale: 1, rotation: 0 };
        }
        const popDuration = 0.16;
        const elapsed = billAnimElapsed - popStartTime;
        if (elapsed >= popDuration || elapsed < 0) {
            return { scale: 1, rotation: 0 };
        }
        const t = elapsed / popDuration;
        const scale = (t < 0.5)
            ? (0.9 + (1.05 - 0.9) * (t / 0.5))
            : (1.05 + (1.0 - 1.05) * ((t - 0.5) / 0.5));
        // Fixed +/-1 degree sign derived from the anchor position (not
        // Math.random(), so it's stable across the bubble's whole
        // lifetime instead of re-rolling every frame) -- purely a small
        // flourish, fades to 0 by the time the pop settles.
        const sign = (Math.sin(anchorX * 0.37) >= 0) ? 1 : -1;
        const rotation = sign * (Math.PI / 180) * (1 - t);
        return { scale: scale, rotation: rotation };
    }

    function wrapBubbleText(text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let current = "";

        words.forEach(function (word) {
            const candidate = current ? current + " " + word : word;
            if (current && ctx.measureText(candidate).width > maxWidth) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        });
        if (current) lines.push(current);

        return lines;
    }

    // ------------------------------------------------------------------
    // VERBATIM SVG PATH GEOMETRY -- these two path strings are copied
    // EXACTLY, character for character, from the authoritative CodePen
    // ("Comic Book Speech Bubbles with SVG" by Dudley Storey,
    // https://codepen.io/dudleystorey/pen/wMLBLK), fetched directly from
    // the pen's own JS panel. Nothing about the geometry below is
    // reinterpreted, redrawn, or approximated -- see drawSvgPathOnCanvas
    // for the generic (M/L/C/S, upper=absolute/lower=relative, Z)
    // SVG-path-command interpreter that executes these exact strings as
    // canvas bezier/line calls, and drawSpeechBalloon/drawStarburstBubble
    // below for how each is scaled UNIFORMLY (never distorted) to fit
    // the current line of dialogue.
    // ------------------------------------------------------------------

    // "speech bubble" class from the CodePen -- the classic smooth
    // rounded balloon, tail included as part of the same continuous
    // outline (the thin curved tendril reaching down to lower-left).
    // Native viewBox: 0 0 132 136.
    const SVG_SPEECH_BUBBLE = {
        viewBoxW: 132,
        viewBoxH: 136,
        d: "M66.1 1.5C30.4 1.5 1.5 22.9 1.5 46c0 18.1 17.9 33.5 42.8 39.3 1.5 14.8-1.3 39-8.5 48.1 10.8-12.5 22.4-33.6 26.6-45.7 1.2 0 2.5.1 3.7.1 35.7 0 64.6-18.7 64.6-41.8S101.8 1.5 66.1 1.5zM35.8 133.4c-.3.4-.7.8-1 1.1.4-.3.7-.7 1-1.1z",
        // Safe interior region for text, in the path's own local
        // coordinate space -- the rounded MAIN BODY only, deliberately
        // excluding the thin tail tendril (roughly local y 90-136) so
        // vertical centering never runs text down into the tail.
        // Estimated from the path's own coordinate structure (the body
        // is the round portion from the top apex at local (66,1.5) down
        // to where the outline pinches into the tail around y~90).
        safeLeft: 14, safeTop: 10, safeRight: 118, safeBottom: 78,
        // Where the tail's tip actually lands, in local coordinates --
        // this is what gets translated to the real on-screen anchor
        // (the speaker), per "point the finished SVG toward the
        // character, don't redraw the tail separately."
        tailTipX: 35.4, tailTipY: 134.5,
        stroke: "#000",
        strokeWidth: 4,
        lineJoin: "bevel"
    };

    // "electric" class from the CodePen -- the explosive/starburst
    // balloon with its angular lightning-style tail, also part of the
    // same continuous outline. Native viewBox: 0 0 300 150.
    const SVG_STARBURST_BUBBLE = {
        viewBoxW: 300,
        viewBoxH: 150,
        d: "M32.7,18.3c11,5,33.3,3.3,37-11.3 c11.7,8.7,40,11.3,54.7,0c7.3,10,36.7,13.3,46,0c0.3,8,29,16.7,39.3,11.7C202.3,27,212,40.7,229,42c-11.7,6-7.7,28.3,0,32.7 c-11,1-14.3,12.3-14.3,12.3l34.7,25.3l-12.7,2.3l36.7,21l-52.9-12.6l6.2-6.4l-28.3-16.3c0,0-14.7,14-14.3,19.3 c-10-5-36,3.7-44.3,13.3c-9.7-13.7-40.3-12.7-56-2c-7-10.3-37.7-11.7-48.7-10.7c7.2-9.7-9.3-31.7-27-35c14-5,19.7-34.3,6.7-40.7 C30.3,43.3,39.7,28,32.7,18.3z",
        // Safe interior region -- NOT eyeballed from the CSS padding
        // percentages. The CodePen's own `.electric { padding: 4% 6%
        // 12% 0% }` looked like a natural starting point, but this
        // star's outline is concave (spikes/valleys, not a smooth
        // oval), so a rectangle built from simple corner percentages
        // can still land in a notch between two points and clip the
        // outline. This exact rectangle was instead verified
        // empirically: the path was sampled into ~570 points along its
        // real bezier/line curves, and this region was grown outward
        // from the shape's body center until every point on its
        // boundary (checked via point-in-polygon, 1-unit resolution)
        // still tested strictly inside the outline, then padded in a
        // few more units for margin -- so it's guaranteed clear of both
        // the outline and the lightning tail (which starts well past
        // x=195), not an estimate.
        safeLeft: 42, safeTop: 26, safeRight: 180, safeBottom: 114,
        tailTipX: 273.4, tailTipY: 100.4,
        stroke: "#231F20",
        strokeWidth: 4,
        lineJoin: "miter"
    };

    // ------------------------------------------------------------------
    // Minimal SVG path-command interpreter -- supports exactly the
    // commands used by the two paths above (M/m, L/l, C/c, S/s, Z/z;
    // uppercase = absolute, lowercase = relative, per the SVG spec,
    // including the "S" smooth-curve reflection and implicit repeated
    // commands). This exists purely so the path DATA above can be used
    // completely verbatim -- exactly as authored in the CodePen -- while
    // still rendering through this game's existing canvas pipeline
    // (everything else in the game world is canvas-drawn, not SVG/DOM,
    // so this keeps the bubble geometry pixel-faithful to the reference
    // without introducing a second, separately-positioned rendering
    // layer). offsetX/offsetY/scaleX/scaleY map the path's own local
    // coordinates onto the screen; a negative scaleX mirrors the whole
    // shape horizontally (see drawSpeechBalloon's flip logic).
    // ------------------------------------------------------------------
    function drawSvgPathOnCanvas(c, d, offsetX, offsetY, scaleX, scaleY) {
        const tokens = d.match(/[MLCSZmlcsz]|-?\d*\.?\d+(?:e-?\d+)?/g);
        let i = 0;
        let cx = 0, cy = 0;
        let startX = 0, startY = 0;
        let prevControlX = null, prevControlY = null;
        let lastCmd = null;

        function num() { return parseFloat(tokens[i++]); }
        function tx(x) { return offsetX + x * scaleX; }
        function ty(y) { return offsetY + y * scaleY; }

        while (i < tokens.length) {
            const t = tokens[i];
            let cmd;
            if (/^[MLCSZmlcsz]$/.test(t)) { cmd = t; i++; } else { cmd = lastCmd; }
            lastCmd = cmd;
            switch (cmd) {
                case 'M': cx = num(); cy = num(); startX = cx; startY = cy; c.moveTo(tx(cx), ty(cy)); prevControlX = null; break;
                case 'm': cx += num(); cy += num(); startX = cx; startY = cy; c.moveTo(tx(cx), ty(cy)); prevControlX = null; break;
                case 'L': cx = num(); cy = num(); c.lineTo(tx(cx), ty(cy)); prevControlX = null; break;
                case 'l': cx += num(); cy += num(); c.lineTo(tx(cx), ty(cy)); prevControlX = null; break;
                case 'C': {
                    const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
                    c.bezierCurveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y));
                    prevControlX = x2; prevControlY = y2; cx = x; cy = y;
                    break;
                }
                case 'c': {
                    const x1 = cx + num(), y1 = cy + num(), x2 = cx + num(), y2 = cy + num(), x = cx + num(), y = cy + num();
                    c.bezierCurveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y));
                    prevControlX = x2; prevControlY = y2; cx = x; cy = y;
                    break;
                }
                case 'S': {
                    const x2 = num(), y2 = num(), x = num(), y = num();
                    const x1 = (prevControlX !== null) ? (2 * cx - prevControlX) : cx;
                    const y1 = (prevControlY !== null) ? (2 * cy - prevControlY) : cy;
                    c.bezierCurveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y));
                    prevControlX = x2; prevControlY = y2; cx = x; cy = y;
                    break;
                }
                case 's': {
                    const x2 = cx + num(), y2 = cy + num(), x = cx + num(), y = cy + num();
                    const x1 = (prevControlX !== null) ? (2 * cx - prevControlX) : cx;
                    const y1 = (prevControlY !== null) ? (2 * cy - prevControlY) : cy;
                    c.bezierCurveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y));
                    prevControlX = x2; prevControlY = y2; cx = x; cy = y;
                    break;
                }
                case 'Z': case 'z': c.closePath(); cx = startX; cy = startY; prevControlX = null; break;
                default: return; // unrecognized token -- stop rather than risk a bad draw
            }
        }
    }

    // ------------------------------------------------------------------
    // Shared engine for both bubble families: given the verbatim SVG def
    // (SVG_SPEECH_BUBBLE or SVG_STARBURST_BUBBLE), the text, and where
    // the tail should point, this wraps the text, then picks ONE UNIFORM
    // scale (never separate X/Y stretch -- the geometry is never
    // distorted) large enough that the wrapped text fits inside the
    // shape's own safe interior region, translates the whole path so its
    // built-in tail tip lands exactly on the anchor point, and fills
    // /strokes it via drawSvgPathOnCanvas using the EXACT path string.
    // ------------------------------------------------------------------
    function drawSvgSpeechBubble(svgDef, anchorX, anchorY, text, canvasWidth, canvasHeight, popStartTime, opts) {
        // Wait for ComicNeue-Bold to actually finish loading before
        // measuring/wrapping ANY dialogue text -- see the DIALOGUE FONTS
        // block near the top of the file. Skips drawing entirely for
        // the (typically sub-second, local-file) window before it's
        // ready, rather than measure with the wrong font metrics. Once
        // ready this is permanently true for the rest of the session.
        if (!isDialogueFontReady()) return;

        const options = opts || {};
        // Bubble geometry is now FIXED (a single scale, never grown or
        // shrunk to fit text) -- per "never alter/distort the SVG bubble
        // geometry just to fit text." Only the font size adapts, via the
        // auto-fit loop below.
        const scale = options.scale;
        const maxFontSize = options.maxFontSize;
        const minFontSize = options.minFontSize;
        const fontFamily = getDialogueFontFamily();
        // uppercase/italic are opt-in per caller (see drawWorldBubble/
        // drawBubble) -- both now set them, per the global typography
        // rule, but the option plumbing stays generic. Uppercasing
        // happens HERE, at render time only, on a local copy -- script.js's
        // actual dialogue strings are never touched. Italic is NOT done
        // via ctx.font's "italic" keyword (browsers synthesize their own
        // oblique angle for a font with no real italic face, which can
        // read as a much stronger slant than intended, and would also
        // shift measureText's own width results during wrapping). It's
        // applied instead as a small, fixed shear transform at DRAW time
        // only, well after wrapping/measuring is done against the
        // upright glyph widths -- see the fillText loop below -- so the
        // lean is exactly as slight as CONFIG-tuned, on every browser.
        const displayText = options.uppercase ? text.toUpperCase() : text;

        const safeW = svgDef.safeRight - svgDef.safeLeft;
        const safeH = svgDef.safeBottom - svgDef.safeTop;
        const safeWidthPx = safeW * scale;
        const safeHeightPx = safeH * scale;
        // Padding INSIDE the already-inset safe rect (which itself
        // already keeps clear of the outline/tail) -- this is the
        // "generous padding" margin between the text and the edge of
        // that safe rect.
        const textPadding = Math.max(8, scale * 4);
        const maxTextWidth = safeWidthPx - textPadding * 2;
        const maxTextHeight = safeHeightPx - textPadding * 2;

        // AUTO-FIT FONT SIZE -- try progressively smaller sizes until
        // the wrapped text fits the fixed safe area, both width and
        // height. ctx.font is set FIRST, before any ctx.measureText call
        // (wrapBubbleText measures using whatever font is currently
        // active on the context) -- using stale/default font metrics to
        // wrap text and then drawing it in a different, larger font is
        // exactly what caused text to overflow past the bubble edges
        // before this fix. Now that isDialogueFontReady() has already
        // gated on the font being genuinely loaded (above), these
        // measurements are against ComicNeue-Bold's own real metrics,
        // not a fallback.
        let fontSize = maxFontSize;
        let lines = [];
        let lineHeight = 0;
        let textBlockH = 0;
        for (let fs = maxFontSize; fs >= minFontSize; fs -= 1) {
            ctx.font = "bold " + fs + "px " + fontFamily; // always measured/drawn upright -- see the italic shear note above
            lineHeight = Math.round(fs * (options.lineHeightMultiplier || 1.26));
            lines = wrapBubbleText(displayText, maxTextWidth);
            textBlockH = lines.length * lineHeight;
            fontSize = fs;
            if (textBlockH <= maxTextHeight) break; // fits -- stop shrinking, ctx.font/lines/lineHeight already correct for this size
        }
        // ctx.font is already set to `fontSize` from the loop above --
        // reused as-is below for the actual fillText calls.

        // Flip horizontally so the balloon body leans toward open screen
        // space rather than off the edge, per "point/flip the finished
        // SVG toward Bill or Bob as needed" -- the tail tip itself always
        // lands exactly on the anchor either way; flipping only changes
        // which side the body sits on relative to that fixed point.
        const flip = (anchorX > canvasWidth / 2);
        const scaleX = flip ? -scale : scale;
        const scaleY = scale;

        // Translate so the path's own built-in tail tip maps exactly
        // onto (anchorX, anchorY) -- offsetX/offsetY solved from
        // tx(tailTipX) = anchorX, ty(tailTipY) = anchorY.
        let offsetX = anchorX - svgDef.tailTipX * scaleX;
        let offsetY = anchorY - svgDef.tailTipY * scaleY;

        // Clamp the FULL RENDERED BOUNDING BOX -- body, outline, and
        // tail together -- fully inside the safe viewport, not just the
        // anchor point. A bubble anchored high (e.g. building dialogue
        // over a tall building) would otherwise have its body's TOP
        // edge sitting well above the anchor itself, since the tail has
        // real length; clamping only the anchor (the old approach) left
        // the body free to poke up under the HUD. hudHeightPx mirrors
        // the actual top-HUD panel's own responsive CSS height (see
        // buildDom's hudPanel: clamp(68px, 18vw, 92px)) so "below the
        // HUD" here matches what's really drawn on top of the canvas.
        const edgeMargin = 10;
        const hudHeightPx = Math.max(68, Math.min(92, canvasWidth * 0.18));
        const minTopPx = hudHeightPx + edgeMargin;
        const maxBottomPx = canvasHeight - edgeMargin;

        const shapeLeft = offsetX + Math.min(0, svgDef.viewBoxW * scaleX);
        const shapeRight = offsetX + Math.max(0, svgDef.viewBoxW * scaleX);
        const shapeTop = offsetY + Math.min(0, svgDef.viewBoxH * scaleY);
        const shapeBottom = offsetY + Math.max(0, svgDef.viewBoxH * scaleY);

        if (shapeLeft < edgeMargin) offsetX += edgeMargin - shapeLeft;
        else if (shapeRight > canvasWidth - edgeMargin) offsetX -= shapeRight - (canvasWidth - edgeMargin);

        if (shapeTop < minTopPx) offsetY += minTopPx - shapeTop;
        else if (shapeBottom > maxBottomPx) offsetY -= shapeBottom - maxBottomPx;

        // Comic "pop" appear animation -- scales/rotates the whole shape
        // as one unit around its own safe-region center, then settles;
        // see getBubblePopTransform. No-op once the pop window elapses.
        const pivotX = offsetX + ((svgDef.safeLeft + svgDef.safeRight) / 2) * scaleX;
        const pivotY = offsetY + ((svgDef.safeTop + svgDef.safeBottom) / 2) * scaleY;
        const pop = getBubblePopTransform(popStartTime, anchorX);

        ctx.save();
        if (typeof options.alpha === "number") ctx.globalAlpha = options.alpha;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(pop.rotation);
        ctx.scale(pop.scale, pop.scale);
        ctx.translate(-pivotX, -pivotY);

        // Hard offset shadow -- printed-comic-page depth.
        ctx.save();
        ctx.translate(3, 3);
        ctx.fillStyle = "rgba(10,10,10,0.28)";
        ctx.beginPath();
        drawSvgPathOnCanvas(ctx, svgDef.d, offsetX, offsetY, scaleX, scaleY);
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        drawSvgPathOnCanvas(ctx, svgDef.d, offsetX, offsetY, scaleX, scaleY);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = svgDef.stroke;
        ctx.lineWidth = svgDef.strokeWidth;
        ctx.lineJoin = svgDef.lineJoin;
        ctx.stroke();

        // ctx.font is still set from the auto-fit loop above -- the
        // exact font/size that was actually measured for wrapping is
        // the same one used to draw, by construction.
        ctx.fillStyle = "#141414";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textCenterX = offsetX + ((svgDef.safeLeft + svgDef.safeRight) / 2) * scaleX;
        const textTop = pivotY - textBlockH / 2;
        // Slight forward lean (see the note above) applied per line,
        // around each line's own centered anchor point -- translating
        // to (textCenterX, ly) first means the shear rotates the glyph
        // shapes in place without shifting the line off-center.
        const italicShear = options.italic ? -0.15 : 0;
        lines.forEach(function (line, i) {
            const ly = textTop + lineHeight * i + lineHeight / 2;
            ctx.save();
            ctx.translate(textCenterX, ly);
            if (italicShear) ctx.transform(1, 0, italicShear, 1, 0, 0);
            ctx.fillText(line, 0, 0);
            ctx.restore();
        });

        ctx.restore();
    }

    // BILL & BOB -- the CodePen's "speech bubble" (classic smooth
    // rounded balloon), verbatim geometry at a fixed scale -- SHAPE
    // unchanged. See drawSvgSpeechBubble/SVG_SPEECH_BUBBLE above -- text
    // auto-fits via font-size reduction, the bubble itself never grows/
    // shrinks. Typography (uppercase/italic/font) now matches the same
    // global rule as the electric/world bubble below -- see
    // drawSvgSpeechBubble's uppercase/italic option handling.
    function drawBubble(anchorX, anchorY, text, canvasWidth, canvasHeight, popStartTime) {
        drawSvgSpeechBubble(SVG_SPEECH_BUBBLE, anchorX, anchorY, text, canvasWidth, canvasHeight, popStartTime, {
            scale: (canvasWidth * 0.52) / SVG_SPEECH_BUBBLE.viewBoxW,
            maxFontSize: Math.round(Math.max(16, Math.min(20, canvasWidth * 0.044))),
            minFontSize: 12,
            uppercase: true,
            italic: false, // removed -- was too hard to read on mobile; upright Comic Neue Bold instead
            lineHeightMultiplier: 1.3
        });
    }

    // CROWD / BUILDING / WORLD -- the CodePen's "electric" starburst
    // balloon, verbatim geometry at a fixed scale, same font auto-fit
    // approach. Both ambient-voice call sites in drawSpeechBubbles route
    // through this one function, same as before.
    function drawWorldBubble(anchorX, anchorY, text, canvasWidth, canvasHeight, alpha, popStartTime) {
        drawSvgSpeechBubble(SVG_STARBURST_BUBBLE, anchorX, anchorY, text, canvasWidth, canvasHeight, popStartTime, {
            alpha: alpha,
            scale: (canvasWidth * 0.48) / SVG_STARBURST_BUBBLE.viewBoxW,
            maxFontSize: Math.round(Math.max(15, Math.min(18, canvasWidth * 0.039))),
            minFontSize: 10,
            // Typography per the electric-bubble spec: ALL CAPS (render-
            // time only -- script.js's actual strings are untouched), a
            // touch more line spacing than the default for clear
            // comic-book readability. Bill/Bob's drawBubble uses the
            // same set (uppercase, upright, ComicNeue-Bold).
            uppercase: true,
            italic: false, // removed -- was too hard to read on mobile; upright Comic Neue Bold instead
            lineHeightMultiplier: 1.32
        });
    }


    function drawTransitionOverlay(w, h) {
        let alpha = 0;

        if (state === STATE.ENTERING_MEETING) {
            // outdoor scene fading to black as they step through the doorway
            alpha = 1 - Math.max(0, finishTimer / CONFIG.transitionDuration);
        } else if (state === STATE.INSIDE_MEETING) {
            // black fading away to reveal the interior
            alpha = Math.max(0, insideFadeTimer / CONFIG.insideFadeDuration);
        } else if (state === STATE.LEAVING_MEETING) {
            // interior fading to black as they step back outside
            alpha = 1 - Math.max(0, leaveFadeTimer / CONFIG.insideFadeDuration);
        } else if (state === STATE.EXITING_MEETING) {
            // Fade back up on the SAME exterior and doorway.
            const elapsed = CONFIG.exitMeetingDuration - exitMeetingTimer;
            alpha = 1 - Math.min(1, Math.max(0, elapsed / CONFIG.exitRevealDuration));
        } else if (state === STATE.TRANSITIONING) {
            if (transitionPhase === "in") {
                alpha = transitionTimer / CONFIG.transitionDuration;
            } else if (transitionPhase === "finishing") {
                alpha = 1 - (transitionTimer / CONFIG.finishFadeDuration);
            }
        } else if (state === STATE.CHANGING_STORE_EVENT && changingStorePhase === "hidden") {
            // Quick comic-panel fade bracketing the SAME "hidden" window
            // that already exists (Bill/Bob aren't drawn and the sprite
            // swap already happens the instant it begins -- see
            // updateChangingStoreEvent's "hidden" case). This only adds a
            // fast fade-to-black/fade-back-in on top of that -- it does
            // NOT change changingStoreTransformDelay (how long "hidden"
            // itself lasts) or when the swap happens. A simple
            // ramp-up/hold/ramp-down "trapezoid": alpha rises to 1 over
            // the first changingStoreFadeDuration seconds, stays fully
            // black through the middle, then eases back to 0 over the
            // final changingStoreFadeDuration seconds -- right as the
            // "emerging" phase (and its own doorway-exit visual) begins.
            const elapsed = CONFIG.changingStoreTransformDelay - changingStoreTimer;
            const remaining = changingStoreTimer;
            const fadeIn = Math.min(1, Math.max(0, elapsed / CONFIG.changingStoreFadeDuration));
            const fadeOut = Math.min(1, Math.max(0, remaining / CONFIG.changingStoreFadeDuration));
            alpha = Math.min(fadeIn, fadeOut);
        }

        if (alpha > 0) {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0," + Math.min(1, Math.max(0, alpha)) + ")";
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }

    function updateHud() {
        if (livesHeartsEl) {
            livesHeartsEl.textContent = "\u2665 ".repeat(lives).trim();
        }
        if (livesDisplay) {
            livesDisplay.style.opacity = (livesFlashTimer > 0) ? "0.4" : "1";
        }
        if (countdownMainEl && countdownSecEl) {
            const parts = formatFictionalClockParts(storyClockSecondsRemaining);
            countdownMainEl.textContent = parts.main;
            countdownSecEl.textContent = parts.sec;
        }
        if (progressSegmentEls.length > 0) {
            const pct = computeLevelProgress();
            const litCount = Math.round(pct * progressSegmentEls.length);
            progressSegmentEls.forEach(function (segment, i) {
                segment.style.background = (i < litCount) ? "#39ff14" : "#241f1d";
                segment.style.boxShadow = (i < litCount) ? "0 0 4px rgba(57,255,20,0.65)" : "none";
            });
        }
        if (actionButton && actionButtonHousing) {
            updateActionButtonHud();
        }
    }

    // Centralized per-frame sync for the action button: label, subtitle,
    // visual (active/disabled) style, and one-time transition animations.
    // Visual restyling and animations only fire on an ACTUAL state change
    // (buttonState !== lastActionButtonState) -- see BUTTON_STATE /
    // getActionButtonState -- so this is cheap to call every frame and
    // never re-triggers a pop while sitting still in one state.
    function updateActionButtonHud() {
        const buttonState = getActionButtonState();
        const stateChanged = (buttonState !== lastActionButtonState);

        if (stateChanged) {
            applyActionButtonVisualState(buttonState);

            // One-time pop animations (requirement: "use one-time
            // transition effects," never a continuous animation).
            // FASTER re-appearing after DISABLED_MEETING deliberately gets
            // NO animation here -- applyActionButtonVisualState above
            // already restored the active green glow instantly, which is
            // exactly the "let the glow return quickly" behavior asked
            // for, without a bounce. Animates actionButtonHousing (the
            // visible control) -- actionButton itself (the larger
            // invisible tap target) is never animated.
            let animName = null;
            if (buttonState === BUTTON_STATE.FASTER && lastActionButtonState === BUTTON_STATE.START) {
                animName = "hgButtonSnap";       // small snap: START -> FASTER
            } else if (buttonState === BUTTON_STATE.ENTER) {
                animName = "hgButtonPop";        // one noticeable pop: FASTER -> ENTER
            } else if (buttonState === BUTTON_STATE.CONTINUE) {
                animName = "hgButtonPopBig";      // stronger celebratory pop: LEVEL COMPLETE -> CONTINUE
            }
            if (animName) {
                actionButtonHousing.style.animation = "none";
                void actionButtonHousing.offsetWidth; // force reflow so the animation restarts cleanly
                actionButtonHousing.style.animation = animName + " 0.32s ease-out";
            }

            lastActionButtonState = buttonState;
        }
    }

    // Active (START/FASTER/ENTER/CONTINUE): neon green, thick black
    // outline, hard drop shadow, pressable-looking. Disabled
    // (DISABLED_MEETING/DISABLED_TRANSITION): gray/desaturated, darker
    // border, no glow, recessed (inset shadow instead of a raised one) --
    // "physically inactive," per spec -- and no symbol at all (there's no
    // controller icon for "disabled," so the housing just goes dark/
    // empty rather than showing a stale symbol). Only ever called on an
    // actual state change (see updateActionButtonHud), never every
    // frame, so it never fights with the transient press
    // (setActionButtonPressed) or pop-animation transforms. Styles
    // actionButtonHousing (the visible control), never actionButton
    // itself (the larger invisible tap target).
    function applyActionButtonVisualState(buttonState) {
        if (!actionButton || !actionButtonHousing) return;
        const active = (buttonState === BUTTON_STATE.START || buttonState === BUTTON_STATE.FASTER ||
            buttonState === BUTTON_STATE.ENTER || buttonState === BUTTON_STATE.CONTINUE);

        // CONTINUE ("» CHAPTER 2 »") is the one state that needs actual
        // room for a text label -- every other state keeps the compact
        // 56px square tap target/housing exactly as before. Both the
        // visible housing AND the underlying actionButton tap target are
        // resized together so the whole wider pill stays tappable, not
        // just its center (actionButtonHousing has pointer-events:none;
        // actionButton is what actually receives the press).
        if (buttonState === BUTTON_STATE.CONTINUE) {
            actionButton.style.width = "clamp(200px, 62vw, 260px)";
            actionButton.style.height = "60px";
            actionButtonHousing.style.width = "100%";
            actionButtonHousing.style.height = "100%";
        } else {
            actionButton.style.width = "clamp(64px, 17vw, 76px)";
            actionButton.style.height = "clamp(64px, 17vw, 76px)";
            actionButtonHousing.style.width = "56px";
            actionButtonHousing.style.height = "56px";
        }

        actionButtonHousing.style.transform = "translate(-50%, -50%)";
        if (active) {
            actionButtonHousing.style.border = "3px solid #0a0a0a";
            actionButtonHousing.style.background = "linear-gradient(#2a2320, #14100d)";
            actionButton.style.cursor = "pointer";
        } else {
            actionButtonHousing.style.border = "3px solid #3a3a3a";
            actionButtonHousing.style.background = "linear-gradient(#3a3a3a, #232323)";
            actionButtonHousing.style.boxShadow = "0 1px 0 #000, inset 0 3px 5px rgba(0,0,0,0.55)"; // recessed, not raised
            actionButton.style.cursor = "default";
        }

        // Exactly one symbol (or none, for the disabled states) shown at
        // a time -- no controller-style ambiguity about what pressing it
        // does. CONTINUE is the sole exception: it shows the
        // "» CHAPTER 2 »" text+chevron group, since a bare symbol can't
        // convey "go to the next chapter" the way it can for START/FASTER.
        if (actionButtonPlayEl) actionButtonPlayEl.style.display = (buttonState === BUTTON_STATE.START) ? "block" : "none";
        if (actionButtonBoltEl) actionButtonBoltEl.style.display = (buttonState === BUTTON_STATE.FASTER) ? "block" : "none";
        if (actionButtonChevronWrap) actionButtonChevronWrap.style.display = (buttonState === BUTTON_STATE.ENTER) ? "block" : "none";
        if (actionButtonChapter2Wrap) actionButtonChapter2Wrap.style.display = (buttonState === BUTTON_STATE.CONTINUE) ? "flex" : "none";

        // boxShadow for the ACTIVE case, and all fire-particle spawning,
        // is owned entirely by updateActionButtonFireVisual/
        // updateActionButtonFireParticles (see below) so the fire glow
        // composes correctly with the base drop-shadow instead of the
        // two fighting over the same style property.
        updateActionButtonFireVisual();

        // ENTER gets its own darker "screen" housing (matching the
        // green-bordered chevron panel) instead of the ordinary active
        // button background -- applied AFTER updateActionButtonFireVisual
        // so it isn't overwritten by the FASTER-glow boxShadow logic above.
        if (buttonState === BUTTON_STATE.ENTER) {
            actionButtonHousing.style.border = "3px solid #145214";
            actionButtonHousing.style.background = "linear-gradient(#141d10, #0a0f08)";
            actionButtonHousing.style.boxShadow = "0 3px 0 #000, 0 5px 8px rgba(0,0,0,0.5), 0 0 12px rgba(57,255,20,0.35)";
        }
        // CONTINUE ("▶ CHAPTER 2 ◀") deliberately does NOT get the ENTER
        // panel's dark-screen/neon-glow-box treatment -- it keeps the
        // same plain active-state housing (dark gradient pill, thick
        // black outline, ordinary drop shadow) already applied above,
        // same as START/FASTER. A simple retro control, not a lit-up
        // screen -- only the triangle icons + label carry the neon-green
        // arcade accent color now.
    }

    // Blends the housing's base "active" drop-shadow with an additional
    // glow layer that grows and shifts from green -> orange -> red as
    // fasterSpeedLevel rises (see bumpFasterSpeedLevel), and re-colors
    // the lightning-bolt symbol itself the same way (green -> hotter
    // yellow/white at the top end), per spec ("visually transition from
    // neon green toward a hotter yellow/white center at high speed").
    // Called whenever fasterSpeedLevel changes AND whenever the button's
    // active/disabled state changes (via applyActionButtonVisualState),
    // so it's always correct regardless of which changed. The ACTUAL
    // flame/ember particles are handled separately by
    // updateActionButtonFireParticles (called every frame from the main
    // update() loop, since particles need continuous per-frame motion,
    // not just per-state-change restyling) -- this function only owns
    // the glow/bolt color.
    function updateActionButtonFireVisual() {
        if (!actionButton || !actionButtonHousing) return;
        const buttonState = getActionButtonState();
        const active = (buttonState === BUTTON_STATE.START || buttonState === BUTTON_STATE.FASTER ||
            buttonState === BUTTON_STATE.ENTER || buttonState === BUTTON_STATE.CONTINUE);

        if (!active) {
            actionButtonHousing.style.boxShadow = "0 1px 0 #000, inset 0 3px 5px rgba(0,0,0,0.55)";
            return;
        }

        const levelFrac = fasterSpeedLevel / CONFIG.fasterSpeedMaxLevel; // 0..1
        const baseDropShadow = "0 3px 0 #000, 0 5px 8px rgba(0,0,0,0.5)";
        if (levelFrac <= 0) {
            actionButtonHousing.style.boxShadow = baseDropShadow;
        } else {
            // Green (57,255,20) at level 0 -> hot orange-red (255,70,20) at
            // max level. Glow blur/spread and opacity both grow with level
            // too, so it reads as "hotter," not just "different color."
            const r = Math.round(57 + (255 - 57) * levelFrac);
            const g = Math.round(255 + (70 - 255) * levelFrac);
            const b = Math.round(20 + (20 - 20) * levelFrac);
            const blur = Math.round(10 + levelFrac * 26);
            const spread = Math.round(1 + levelFrac * 5);
            const glowAlpha = (0.35 + levelFrac * 0.55).toFixed(2);
            const glow = "0 0 " + blur + "px " + spread + "px rgba(" + r + "," + g + "," + b + "," + glowAlpha + ")";
            actionButtonHousing.style.boxShadow = baseDropShadow + ", " + glow;
        }

        // The lightning bolt ITSELF ramps from neon green toward a
        // hotter yellow/white center as speed rises, per spec -- a
        // different, brighter target than the housing's green->orange-red
        // glow above (the bolt is meant to look like it's the thing
        // catching fire, not just glowing hot).
        if (actionButtonBoltEl) {
            const br = Math.round(57 + (255 - 57) * levelFrac);
            const bg = Math.round(255 + (250 - 255) * levelFrac);
            const bb = Math.round(20 + (230 - 20) * levelFrac);
            actionButtonBoltEl.style.background = "rgb(" + br + "," + bg + "," + bb + ")";
            const boltBlur = Math.round(6 + levelFrac * 12);
            const boltAlpha = (0.75 + levelFrac * 0.25).toFixed(2);
            actionButtonBoltEl.style.filter = "drop-shadow(0 0 " + boltBlur + "px rgba(" + br + "," + bg + "," + bb + "," + boltAlpha + "))";
        }
    }

    // ------------------------------------------------------------------
    // REAL PARTICLE FIRE -- spawns/updates/removes small DOM particle
    // divs above the FASTER button every frame (called from the main
    // update() loop, since organic rise/drift/shrink/fade needs
    // continuous motion, not just per-state restyling). Fully replaces
    // the old fixed 4-shape flame flicker. LOW levels (below
    // fireParticleMinLevel) stay glow-only, exactly as before -- see
    // updateActionButtonFireVisual. Spawning stops immediately the
    // instant the button state changes away from an active FASTER/ENTER/
    // etc. context; already-alive particles are simply told to decay
    // fireParticleFastFadeMultiplier times faster so they clear almost
    // immediately rather than lingering -- see the "active" branch below.
    // Hard-capped at fireParticleMaxAlive so a long FASTER hold can never
    // accumulate unbounded DOM nodes (performance/cleanup requirement).
    // ------------------------------------------------------------------
    function spawnFireParticle(isEmber) {
        if (!actionButtonFireContainer) return;
        if (fireParticles.length >= CONFIG.fireParticleMaxAlive) return;

        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.left = "0px";
        el.style.bottom = "0px";
        el.style.borderRadius = "50%";
        el.style.pointerEvents = "none";
        el.style.background = isEmber
            ? "radial-gradient(circle, #fff2b8 0%, #ffb23d 55%, rgba(255,90,30,0) 100%)"
            : "radial-gradient(circle at 50% 65%, #fff6c2 0%, #ffcf4d 38%, #ff8a1e 70%, rgba(255,61,30,0) 100%)";
        actionButtonFireContainer.appendChild(el);

        const buttonWidth = actionButtonHousing ? actionButtonHousing.offsetWidth : 56;
        const startX = billRandomRange(buttonWidth * 0.12, buttonWidth * 0.88) - buttonWidth / 2; // spread across the housing width, centered on 0
        const life = isEmber ? CONFIG.fireEmberLifeSeconds : CONFIG.fireParticleLifeSeconds;

        fireParticles.push({
            el: el,
            x: startX,
            y: 0,
            vx: billRandomRange(-14, 14),       // slight left/right drift
            vy: billRandomRange(isEmber ? 60 : 40, isEmber ? 100 : 70), // px/sec upward -- embers rise faster/farther
            life: life,
            maxLife: life,
            size: isEmber ? billRandomRange(2, 4) : billRandomRange(6, 11),
            wobbleSeed: Math.random() * Math.PI * 2,
            isEmber: !!isEmber
        });
    }

    function updateActionButtonFireParticles(dt) {
        if (!actionButton || !actionButtonHousing || !actionButtonFireContainer) return;

        const buttonState = getActionButtonState();
        const active = (buttonState === BUTTON_STATE.START || buttonState === BUTTON_STATE.FASTER ||
            buttonState === BUTTON_STATE.ENTER || buttonState === BUTTON_STATE.CONTINUE);
        const isFaster = (buttonState === BUTTON_STATE.FASTER);
        const levelFrac = fasterSpeedLevel / CONFIG.fasterSpeedMaxLevel; // 0..1

        // SPAWNING: only while actively FASTER-ing at or above
        // fireParticleMinLevel. Any other state (including active-but-
        // not-FASTER, e.g. START/ENTER/CONTINUE, and every disabled
        // state) spawns nothing -- existing particles just finish out
        // (see the fast-fade branch below).
        if (isFaster && active && fasterSpeedLevel >= CONFIG.fireParticleMinLevel) {
            const spawnInterval = CONFIG.fireParticleSpawnIntervalBase -
                (CONFIG.fireParticleSpawnIntervalBase - CONFIG.fireParticleSpawnIntervalMax) * levelFrac;
            fireSpawnTimer -= dt;
            if (fireSpawnTimer <= 0) {
                fireSpawnTimer = spawnInterval;
                spawnFireParticle(false);
                if (fasterSpeedLevel >= CONFIG.fireParticleEmberMinLevel && Math.random() < CONFIG.fireEmberChancePerSpawn) {
                    spawnFireParticle(true);
                }
            }
        } else {
            fireSpawnTimer = 0;
        }

        // MAX-LEVEL "barely containing itself": a small continuous
        // vibration, layered on top of whatever pop/snap one-shot
        // animation may be running (harmless either way -- one-shots are
        // brief and simply override this for their own short duration).
        // Only while genuinely at max level AND actively FASTER-ing.
        // Applied to actionButtonHousing (the visible control) --
        // actionButton (the larger invisible tap target) never moves.
        if (isFaster && active && fasterSpeedLevel >= CONFIG.fasterSpeedMaxLevel) {
            const jitterX = Math.sin(billAnimElapsed * 47) * 0.6;
            const jitterY = Math.cos(billAnimElapsed * 53) * 0.5;
            actionButtonHousing.style.transform = "translate(-50%, -50%) translate(" + jitterX.toFixed(2) + "px," + jitterY.toFixed(2) + "px)";
        } else if (actionButtonHousing.style.transform.indexOf("translate(-50%, -50%) translate(") === 0) {
            actionButtonHousing.style.transform = "translate(-50%, -50%)";
        }

        // UPDATE + DRAW every existing particle, active or not -- once
        // spawning stops, particles already in flight simply finish
        // (faster, per fireParticleFastFadeMultiplier) rather than being
        // yanked away instantly, which would look like popping rather
        // than fire dying down.
        const fadeRate = active ? 1 : CONFIG.fireParticleFastFadeMultiplier;
        for (let i = fireParticles.length - 1; i >= 0; i--) {
            const p = fireParticles[i];
            p.life -= dt * fadeRate;
            if (p.life <= 0) {
                p.el.remove();
                fireParticles.splice(i, 1);
                continue;
            }
            const t = 1 - Math.max(0, p.life / p.maxLife); // 0 = just spawned, 1 = about to vanish
            p.y += p.vy * dt;
            p.x += (p.vx + Math.sin(billAnimElapsed * 5 + p.wobbleSeed) * 10) * dt;
            const scale = Math.max(0.05, 1 - t); // shrinks as it rises
            const alpha = p.isEmber ? (1 - t) * 0.85 : (1 - t * t); // embers fade linearly; main flame holds brighter longer then drops off
            const size = p.size * scale;

            p.el.style.width = size + "px";
            p.el.style.height = size + "px";
            p.el.style.opacity = Math.max(0, alpha).toFixed(2);
            p.el.style.transform = "translate(" + p.x.toFixed(1) + "px, " + (-p.y).toFixed(1) + "px)";
        }
    }

    // Small periodic upward "bump" on the whole button while the doorway
    // chevrons are showing, reusing the existing hgButtonSnap keyframe
    // (same one FASTER speed-bumps use) rather than adding a new one.
    // Purely cosmetic -- getActionButtonState()/enterMeeting() untouched.
    function updateChevronBump(dt) {
        if (!actionButtonHousing) return;
        if (getActionButtonState() !== BUTTON_STATE.ENTER) {
            chevronBumpTimer = CONFIG.chevronBumpIntervalSeconds; // fresh countdown ready for next time ENTER appears
            return;
        }
        chevronBumpTimer -= dt;
        if (chevronBumpTimer <= 0) {
            chevronBumpTimer = CONFIG.chevronBumpIntervalSeconds;
            actionButtonHousing.style.animation = "none";
            void actionButtonHousing.offsetWidth; // force reflow so it restarts cleanly
            actionButtonHousing.style.animation = "hgButtonSnap 0.32s ease-out";
        }
    }

    /* ------------------------------------------------------------------
       LEVEL 1 PROGRESS -- route/section progress plus completed meeting
       checkpoints. Not time, not obstacle count -- just "how far through
       Level 1 are they." Centralized here so the calculation is easy to
       adjust later without touching the HUD rendering itself.
       ------------------------------------------------------------------ */
    function computeLevelProgress() {
        if (state === STATE.FINISHED) return 1;

        const totalSections = MEETINGS.length;
        let sectionFraction;

        if (state === STATE.ENTERING_MEETING || state === STATE.INSIDE_MEETING ||
            state === STATE.LEAVING_MEETING || state === STATE.EXITING_MEETING ||
            (state === STATE.TRANSITIONING && transitionPhase === "finishing")) {
            sectionFraction = 1; // reached the building; working through the meeting itself
        } else if (state === STATE.TRANSITIONING && transitionPhase === "in") {
            sectionFraction = 0; // just stepped into the next walking section
        } else {
            sectionFraction = Math.min(1, Math.max(0, distanceTraveled / getCurrentSectionDistance()));
        }

        const completedSections = Math.min(meetingIndex, totalSections);
        return Math.min(1, (completedSections + sectionFraction) / totalSections);
    }

    /* ------------------------------------------------------------------
       LIVES

       Losing a life is a soft, forgiving setback -- gameplay keeps
       going. Reaching zero freezes gameplay and shows a temporary
       development retry screen (see triggerOutOfLives / STATE.OUT_OF_LIVES).
       ------------------------------------------------------------------ */
    function loseLife() {
        if (lives <= 0) return;
        lives -= 1;
        livesFlashTimer = CONFIG.lifeLostFlashDuration;
        if (lives <= 0) {
            triggerOutOfLives();
        }
    }

    function triggerOutOfLives() {
        state = STATE.OUT_OF_LIVES;
        currentSpeed = 0;
        fadeOutMusic();
        if (retryOverlay) {
            retryOverlay.style.display = "flex";
        }
    }

    /* ======================================================================
       FINISH -- single centralized exit point
       ====================================================================== */
    function completeFinish() {
        state = STATE.FINISHED;
        // Deliberately NOT calling detachInput() here -- the action button
        // (now showing CONTINUE, see getActionButtonState) needs to stay
        // pressable so the player can advance on their own. Every other
        // input path is already inert in STATE.FINISHED (the movement
        // switch in update() has no case for it, and onCanvasPointerDown
        // only acts during STATE.WAITING_AT_DOOR), so leaving listeners
        // attached is safe. Advancing to the next chapter now happens only
        // via goToNextChapter(), triggered by that CONTINUE press -- not
        // automatically, the moment the level ends.
    }

    function finish() {
        // Public, safe-to-call exit point. If gameplay is still running,
        // gracefully wind it down through the same fade used after EA.
        if (state === STATE.FINISHED) return;
        state = STATE.TRANSITIONING;
        transitionPhase = "finishing";
        transitionTimer = CONFIG.finishFadeDuration;
        fadeOutMusic();
    }

    /* ======================================================================
       AUDIO
       ====================================================================== */
    // Permanently swaps musicEl to a new travel track -- used at the
    // CA/GA/EA/CMA meeting exits (see MEETING_EXIT_TRAVEL_ASSET,
    // beginLeavingMeeting). Whatever the meeting-entry fade-out already
    // paused is done for good (per the Level 1 music-progression spec,
    // each of these is a one-way switch, never resumed); this fully
    // releases it and creates a fresh looping Audio for the new track,
    // left paused/silent at volume 0. setAudioMode("outside") (always
    // called right after this, from beginLeavingMeeting) already knows
    // how to play()+fade-in whatever musicEl currently is, so no other
    // audio code needs to change -- this function only ever swaps WHICH
    // element musicEl points at.
    const MEETING_EXIT_TRAVEL_ASSET = {
        ca: "grunge1",  // CA -> GA
        ga: "grunge2",  // GA -> EA
        ea: "grunge3",  // EA -> CMA
        cma: "grunge4"  // final Level 1 travel/end music
        // "aa" deliberately has no entry here -- AA's post-meeting travel
        // music is the existing Fresh Threads beforeFreshThreads/
        // afterFreshThreads handoff, untouched, see beginLeavingMeeting.
    };

    function switchTravelTrack(assetKey) {
        stopMusic(); // fully releases whatever the meeting-entry fade-out paused -- that track is retired for good
        try {
            musicEl = new Audio(resolveAssetUrl(ASSETS[assetKey]));
            musicEl.loop = true;
            musicEl.volume = 0;
            musicFading = false;
        } catch (err) {
            musicEl = null;
        }
    }

    function startMusic() {
        try {
            // Same resolveAssetUrl() helper as the fonts above, for a
            // consistent, explicit resolution against document.baseURI
            // -- though ASSETS.music was already a plain relative string
            // in the same "assets/..." convention every working image
            // uses, so if this still 404s, the most likely explanation
            // is that the mp3 file itself isn't present on disk yet
            // rather than a path-resolution problem.
            musicEl = new Audio(resolveAssetUrl(ASSETS.music));
            musicEl.loop = true;
            musicEl.volume = 0.6;
            musicFading = false;
            const playPromise = musicEl.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {
                    // Autoplay blocked or file missing -- continue silently.
                });
            }
        } catch (err) {
            musicEl = null;
        }
    }

    function stopMusic() {
        if (!musicEl) return;
        try {
            musicEl.pause();
            musicEl.currentTime = 0;
        } catch (err) {
            // ignore
        }
        musicEl = null;
    }

    function fadeOutMusic() {
        if (!musicEl || musicFading) return;
        musicFading = true;
        const fadeStep = 0.05;
        const fadeInterval = setInterval(function () {
            if (!musicEl) {
                clearInterval(fadeInterval);
                return;
            }
            musicEl.volume = Math.max(0, musicEl.volume - fadeStep);
            if (musicEl.volume <= 0) {
                clearInterval(fadeInterval);
                stopMusic();
            }
        }, 80);
    }

    // ------------------------------------------------------------------
    // MEETING-DUCK / FRESH-THREADS-STING AUDIO SYSTEM
    //
    // Three conceptual states (see audioMode), and exactly one function
    // that moves between them -- setAudioMode() -- so the mix can never
    // get stuck half-transitioned:
    //   "outside"    -- current gameplay track (musicEl) at MUSIC_NORMAL_VOLUME, no chatter, no sting
    //   "meeting"    -- gameplay track fully faded out then paused (NOT ducked/quiet underneath), meeting-chatter.mp3 looping in foreground
    //   "freshSting" -- fresh.mp3 playing alone at first; partway through, the afterFreshThreads track fades in underneath it (see startFreshToMeetingTrack) and becomes musicEl going forward
    //
    // Call sites: enterInsideMeeting() -> setAudioMode("meeting"),
    // beginLeavingMeeting() -> setAudioMode("outside"), the
    // "entering"->"hidden" Fresh Threads transition in
    // updateChangingStoreEvent() -> beginFreshThreadsMusicFadeOut()
    // (permanently retires the beforeFreshThreads track), the
    // "hidden"->"emerging" transition -> setAudioMode("freshSting"), and
    // fresh.mp3's own "ended" event -> setAudioMode("outside"). None of
    // those call sites' surrounding movement/timing logic is touched --
    // this is purely an added function call at each point.
    // ------------------------------------------------------------------
    const MUSIC_NORMAL_VOLUME = 0.6;              // matches startMusic()'s existing default
    const AUDIO_DUCK_FADE_MS = 450;               // "short smooth fade" for the meeting fade-out/restore and the Fresh Threads fade-out
    const AUDIO_FADE_STEP_MS = 80;

    // Fades musicEl's volume toward targetVolume over durationMs, then
    // calls the optional onComplete callback once (e.g. to pause/stop
    // the element once it's inaudible). Clears any fade already in
    // progress first, so rapid back-to-back calls (e.g. entering then
    // immediately leaving a meeting) can never leave two fades fighting
    // over the same element's volume.
    function fadeMusicVolumeTo(targetVolume, durationMs, onComplete) {
        if (musicFadeIntervalId) {
            clearInterval(musicFadeIntervalId);
            musicFadeIntervalId = null;
        }
        if (!musicEl) return;
        const steps = Math.max(1, Math.round(durationMs / AUDIO_FADE_STEP_MS));
        const startVolume = musicEl.volume;
        const delta = (targetVolume - startVolume) / steps;
        let count = 0;
        musicFadeIntervalId = setInterval(function () {
            count++;
            if (!musicEl) {
                clearInterval(musicFadeIntervalId);
                musicFadeIntervalId = null;
                return;
            }
            musicEl.volume = Math.max(0, Math.min(1, startVolume + delta * count));
            if (count >= steps) {
                musicEl.volume = Math.max(0, Math.min(1, targetVolume));
                clearInterval(musicFadeIntervalId);
                musicFadeIntervalId = null;
                if (typeof onComplete === "function") onComplete();
            }
        }, AUDIO_FADE_STEP_MS);
    }

    // Singleton start -- if a previous instance is somehow still around
    // (e.g. a scene transition firing twice), it's stopped and replaced
    // rather than left running underneath the new one, per "only one
    // meeting-chatter audio instance should exist at a time."
    function startMeetingChatter() {
        if (meetingChatterEl) {
            try { meetingChatterEl.pause(); } catch (err) { /* ignore */ }
            meetingChatterEl = null;
        }
        try {
            meetingChatterEl = new Audio(resolveAssetUrl(ASSETS.meetingChatter));
            meetingChatterEl.loop = true; // loops for the whole meeting if the clip is shorter than the scene, per spec
            meetingChatterEl.volume = 0.85; // foreground/dominant, but still leaves a little headroom under 1.0
            const playPromise = meetingChatterEl.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () { /* autoplay blocked or file missing -- continue silently */ });
            }
        } catch (err) {
            meetingChatterEl = null;
        }
    }

    function stopMeetingChatter() {
        if (!meetingChatterEl) return;
        try {
            meetingChatterEl.pause();
        } catch (err) { /* ignore */ }
        meetingChatterEl = null;
    }

    // ------------------------------------------------------------------
    // UI CLICK SFX -- intro/game-entry (START) and chapter-handoff
    // (CONTINUE) presses only, per spec section 1. Deliberately NOT used
    // for the FASTER/dash press or the meeting-doorway ENTER press --
    // those are gameplay movement controls, not menu/story navigation.
    // A single reused instance is fine here since click.mp3 is a short,
    // non-looping, non-overlapping-by-design sound (button presses aren't
    // rapid-fire the way dash triggers can be).
    // ------------------------------------------------------------------
    function playUiClickSound() {
        try {
            if (!uiClickEl) {
                uiClickEl = new Audio(resolveAssetUrl(ASSETS.uiClick));
            }
            uiClickEl.currentTime = 0;
            const playPromise = uiClickEl.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () { /* autoplay blocked or file missing -- continue silently */ });
            }
        } catch (err) { /* ignore */ }
    }

    const FRESH_TO_MEETING_FADE_MS = 2500; // how long the afterFreshThreads track takes to fade in underneath fresh.mp3 once triggered -- keep this comfortably shorter than half of fresh.mp3's own length so the new track is fully up by the time fresh.mp3 ends

    // Singleton start, same reasoning as startMeetingChatter(). Also
    // arms the halfway-point handoff to the afterFreshThreads gameplay
    // track (see startFreshToMeetingTrack()) -- fresh.mp3 itself is
    // never cut short, the new track just starts fading in underneath
    // it partway through.
    function startFreshThreadsSting() {
        if (freshStingEl) {
            try { freshStingEl.pause(); } catch (err) { /* ignore */ }
            freshStingEl = null;
        }
        freshThreadsHalfwaySwapped = false;
        try {
            freshStingEl = new Audio(resolveAssetUrl(ASSETS.freshThreadsSting));
            freshStingEl.loop = false; // one-shot sting, not a loop
            freshStingEl.volume = 1;

            // Fires repeatedly during playback -- the moment we cross the
            // halfway point of fresh.mp3's own duration, start fading the
            // new gameplay track in underneath it. Guarded by
            // freshThreadsHalfwaySwapped so it can only ever fire once per
            // sting playback.
            freshStingEl.addEventListener("timeupdate", function () {
                if (freshThreadsHalfwaySwapped) return;
                if (!freshStingEl || !freshStingEl.duration || isNaN(freshStingEl.duration)) return;
                if (freshStingEl.currentTime >= freshStingEl.duration / 2) {
                    freshThreadsHalfwaySwapped = true;
                    startFreshToMeetingTrack();
                }
            });

            // The moment the sting finishes, hand the mix back to normal
            // outdoor music -- this is what actually resumes the music,
            // independent of whichever Fresh Threads visual phase the
            // costume-change choreography happens to be in by then. By
            // this point the afterFreshThreads track should already be
            // playing (see the timeupdate handler above); the fallback
            // here just guarantees it starts even if that never fired
            // (e.g. a browser that never reports a usable duration).
            freshStingEl.addEventListener("ended", function () {
                if (!freshThreadsHalfwaySwapped) {
                    freshThreadsHalfwaySwapped = true;
                    startFreshToMeetingTrack();
                }
                if (audioMode === "freshSting") {
                    setAudioMode("outside");
                }
            });
            const playPromise = freshStingEl.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {
                    // Autoplay blocked or file missing -- don't strand the
                    // mix paused forever waiting for an "ended" event that
                    // will never fire.
                    if (!freshThreadsHalfwaySwapped) {
                        freshThreadsHalfwaySwapped = true;
                        startFreshToMeetingTrack();
                    }
                    if (audioMode === "freshSting") setAudioMode("outside");
                });
            }
        } catch (err) {
            freshStingEl = null;
            if (!freshThreadsHalfwaySwapped) {
                freshThreadsHalfwaySwapped = true;
                startFreshToMeetingTrack();
            }
            if (audioMode === "freshSting") setAudioMode("outside");
        }
    }

    // Permanently promotes the afterFreshThreads track to "the" current
    // gameplay background track -- fades it in from silence underneath
    // whatever's still playing (fresh.mp3). From this point on, musicEl
    // IS this track: meeting enter/exit (setAudioMode) and any later
    // resume just keep operating on musicEl exactly as before, with no
    // extra branching needed. The original beforeFreshThreads track was
    // already faded out and fully stopped back when the clothing-change
    // sequence began -- see beginFreshThreadsMusicFadeOut() -- and is
    // never touched again.
    function startFreshToMeetingTrack() {
        currentGameplayTrack = "afterFreshThreads";
        try {
            musicEl = new Audio(resolveAssetUrl(ASSETS.musicAfterFresh));
            musicEl.loop = true;
            musicEl.volume = 0;
            musicFading = false;
            const playPromise = musicEl.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () { /* autoplay blocked or file missing -- continue silently */ });
            }
            fadeMusicVolumeTo(MUSIC_NORMAL_VOLUME, FRESH_TO_MEETING_FADE_MS);
        } catch (err) {
            musicEl = null;
        }
    }

    // Fades OUT and permanently stops whichever gameplay track is
    // currently playing (always beforeFreshThreads the one time this is
    // called -- see the "entering" -> "hidden" transition in
    // updateChangingStoreEvent, right as the clothing-change sequence
    // begins). Uses stopMusic() (not a pause) so musicEl is fully torn
    // down and nulled out -- nothing later in the file can accidentally
    // resume it, satisfying "must NEVER resume after the Fresh Threads
    // transition has happened."
    function beginFreshThreadsMusicFadeOut() {
        if (!musicEl) return;
        fadeMusicVolumeTo(0, AUDIO_DUCK_FADE_MS, function () {
            stopMusic();
        });
    }

    // The single entry point for all three states -- every transition
    // between "outside"/"meeting"/"freshSting" goes through here, so a
    // given mode's cleanup (stopping whichever extra track was playing,
    // restoring/pausing music appropriately) always happens before the
    // next mode's setup starts. Re-entering the mode it's already in is
    // a no-op, which is what makes the "don't double-start on a
    // transition firing twice" guarantee work for meeting chatter too.
    function setAudioMode(mode) {
        if (mode === audioMode) return;
        audioMode = mode;

        if (mode === "meeting") {
            // Full fade-out-and-stop, not a duck -- the current gameplay
            // track (whichever one musicEl currently points at) must not
            // linger quietly underneath the meeting chatter. Paused (not
            // stopMusic()'d) so beginLeavingMeeting()'s "outside" branch
            // below can resume it from exactly where it left off.
            fadeMusicVolumeTo(0, AUDIO_DUCK_FADE_MS, function () {
                if (musicEl) {
                    try { musicEl.pause(); } catch (err) { /* ignore */ }
                }
            });
            startMeetingChatter();
        } else if (mode === "freshSting") {
            stopMeetingChatter(); // defensive -- chatter should never be active outdoors, but never let it survive into the sting
            if (musicFadeIntervalId) {
                clearInterval(musicFadeIntervalId);
                musicFadeIntervalId = null;
            }
            if (musicEl) {
                try { musicEl.pause(); } catch (err) { /* ignore */ } // paused, not stopped -- currentTime is left exactly where it was so it can resume from there
            }
            startFreshThreadsSting();
        } else { // "outside"
            stopMeetingChatter();
            if (freshStingEl) {
                try { freshStingEl.pause(); } catch (err) { /* ignore */ }
                freshStingEl = null;
            }
            if (musicEl) {
                // Resume from wherever it already was -- never restarts
                // the track. Covers both "coming back from a meeting"
                // (musicEl was paused at fade-out, needs an explicit
                // play() to continue) and "coming back from the Fresh
                // sting" (musicEl is the afterFreshThreads track, already
                // playing/fading in from startFreshToMeetingTrack -- this
                // just makes sure it lands at normal volume).
                if (musicEl.paused) {
                    const playPromise = musicEl.play();
                    if (playPromise && typeof playPromise.catch === "function") {
                        playPromise.catch(function () { /* ignore */ });
                    }
                }
                fadeMusicVolumeTo(MUSIC_NORMAL_VOLUME, AUDIO_DUCK_FADE_MS);
            }
        }
    }

    /* ======================================================================
       RESIZE
       ====================================================================== */
    function attachResize() {
        resizeHandler = function () {
            resizeCanvas();
        };
        window.addEventListener("resize", resizeHandler);
    }

    function detachResize() {
        if (resizeHandler) {
            window.removeEventListener("resize", resizeHandler);
            resizeHandler = null;
        }
    }

    function resizeCanvas() {
        if (!canvas) return;
        // FIXED logical resolution -- see the GAME FRAME block near the
        // top of this file. Every gameplay calculation that reads
        // canvas.width/canvas.height (outdoorPrimaryX, worldToScreenX,
        // getLandmarkCenterStopOffset, HUD layout, render(), etc.) now
        // always sees the same 390x780 stage regardless of the real
        // device/window size -- #game's own CSS transform is what
        // actually scales this fixed-resolution canvas up/down to fit
        // the screen; the canvas's own CSS width/height (still 100% of
        // #game, unchanged) is what gets visually scaled. See
        // onCanvasPointerDown for the matching pointer-coordinate
        // conversion this requires. Guarded so a window "resize" event
        // (which still calls this, unchanged) doesn't reassign -- and
        // therefore clear -- the canvas every time when the logical
        // resolution never actually changes.
        if (canvas.width !== GAME_STAGE_WIDTH || canvas.height !== GAME_STAGE_HEIGHT) {
            canvas.width = GAME_STAGE_WIDTH;
            canvas.height = GAME_STAGE_HEIGHT;
        }
    }

    /* ======================================================================
       CLEANUP -- makes repeated start() calls during development safe
       ====================================================================== */
    function cleanup() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        detachInput();
        detachResize();
        stopMusic();
        stopMeetingChatter();
        if (freshStingEl) {
            try { freshStingEl.pause(); } catch (err) { /* ignore */ }
            freshStingEl = null;
        }
        if (musicFadeIntervalId) {
            clearInterval(musicFadeIntervalId);
            musicFadeIntervalId = null;
        }
        audioMode = "outside";
        currentGameplayTrack = "beforeFreshThreads";
        freshThreadsHalfwaySwapped = false;

        if (container) {
            container.innerHTML = "";
        }

        canvas = null;
        ctx = null;
        livesDisplay = null;
        livesHeartsEl = null;
        clockDisplay = null;
        countdownDigitsEl = null;
        countdownMainEl = null;
        countdownSecEl = null;
        countdownCaptionEl = null;
        progressLabelEl = null;
        progressSegmentEls = [];
        startPrompt = null;
        actionButton = null;
        actionButtonHousing = null;
        actionButtonPlayEl = null;
        actionButtonBoltEl = null;
        actionButtonWhooshEl = null;
        actionButtonChevronWrap = null;
        actionButtonChapter2Wrap = null;
        actionButtonChevronEls = [];
        actionButtonFireContainer = null;
        fireParticles = [];
        retryOverlay = null;
        retryButton = null;
        debugAnchorButton = null;

        obstacles = [];
        dialogueQueue = [];
        activeBubble = null;
        fadingWorldBubble = null;
        impactEffects = [];
        activeAmbientEvents = [];

        lastTapTime = 0;
        musicFading = false;
    }

    /* ======================================================================
       PUBLIC API
       ====================================================================== */
    window.HalloweenGame.chapter1Gameplay = {
        start: start,
        finish: finish
    };

}());