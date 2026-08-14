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

   The top HUD has three fixed sections: LIVES (left), the story clock
   (center, atmosphere only -- see STORY_TIMES), and a Level 1 progress
   bar (right).

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
       CONFIG -- all gameplay tuning values live here
       ====================================================================== */
    const CONFIG = {
        // movement
        walkSpeed: 140,             // px/sec the world scrolls at while walking
        dashSpeed: 320,             // px/sec while dashing
        dashDuration: 0.6,          // seconds a dash burst lasts
        dashCooldown: 0.35,         // seconds before another action can trigger
        doubleTapWindow: 300,       // ms between presses to count as a double press

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
        doorwayDustSpawnInterval: 0.15,    // seconds between dust puffs while sliding into the doorway
        doorwayDustLifeSeconds: 0.32,      // how long each puff lives before fully fading -- keeps it feeling like a quick "zip," not a lingering cloud

        // the meeting doorway -- must match between rendering (drawBuilding)
        // and hit-testing (getDoorwayScreenRect) so the tappable area is
        // always exactly where the doorway is drawn
        doorwayWidth: 34,
        doorwayHeight: 54,
        doorwayHitPadding: 28,          // extra thumb-friendly margin around the visible doorway, in every direction
        doorwayHintDelayFirst: 2.5,     // seconds to wait before showing the pointer hint, the first time
        doorwayHintDelayLearned: 4.0,   // seconds to wait on later meetings, once the player has already used a doorway once

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
        dialogueDefaultDelay: 2.0,
        dialogueDisplayDuration: 4.0,

        // pause after a meeting dialogue point finishes, before the interior
        // cinematic moves again (see the "dialoguePoint" step type in
        // updateInteriorSequence) -- also reused as the changing store's
        // post-pt1 pause before the doorway zip begins
        interiorPostDialoguePause: 2.0,

        // CHANGING STORE STORY EVENT (building6.png) -- see
        // updateChangingStoreEvent for the phase-by-phase choreography.
        // Approach/stop distances and the doorway zip speed reuse the
        // existing meetingSlowDistance/meetingStopDistance/
        // doorwaySlideSpeedMultiplier values above so this event feels
        // identical to a real meeting doorway; only these are new.
        changingStoreTransformDelay: 1.75,      // seconds Bill and Bob stay hidden inside while their sprites swap (spec: ~1.5-2s)
        changingStoreEmergeStepDuration: 0.5,   // seconds easing back out from the doorway to their normal standing spot (mirrors exitDoorStepDuration)
        changingStoreRevealWalkDuration: 0.6,   // seconds walking a short distance from the door afterward so both new costumes are clearly visible, not overlapping
        changingStoreCostumeRevealPause: 0.8,   // brief comedic pause after the costume reveal, before ChangingStore-level1/pt2 plays

        // story clock (atmosphere only -- see STORY_TIMES below for the
        // actual locked milestones)
        clockMinutesPerRealSecond: 6.5, // how fast the displayed clock ticks forward while walking outside
        clockApproachBuffer: 3,         // game-minutes the clock holds back from the next locked milestone until the story actually reaches it

        // the permanent bottom control button
        actionButtonLabel: "ACTION",    // easy to change later if we want different wording

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
        billStrollFPS: 4,            // the walk cycle (see BILL_STROLL_FRAMES) -- tune independently of walkSpeed/dashSpeed, travel speed is unaffected. Used INSIDE meetings only (see billOutdoorStrollFPS for the outdoor street level).
        billOutdoorStrollFPS: 5,     // OUTDOOR ONLY -- 4 * 1.25, sprite animation only, Bill's actual travel speed (walkSpeed/dashSpeed) is completely untouched
        billRenderOffsetX: 0,        // px -- nudge sprite left/right without touching gameplay x
        billRenderOffsetY: 0,        // px -- nudge sprite up/down without touching gameplay/ground y
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
        bobStrollFPS: 4,              // the 6-frame walk cycle (see BOB_WALK_FRAMES). Used INSIDE meetings only (see bobOutdoorStrollFPS for the outdoor street level).
        bobOutdoorStrollFPS: 5,       // OUTDOOR ONLY -- 4 * 1.25, sprite animation only, Bob's actual travel/follow speed is completely untouched
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

        // MEETING INTERIOR CINEMATIC -- see the "MEETING INTERIOR CINEMATIC"
        // block further down (buildInteriorSequence/updateInteriorSequence)
        // for the reusable choreography system these values drive. None of
        // this touches billScale/bobScale or anything about the outdoor
        // scene -- interiorCharacterScale is an on-top multiplier applied
        // only while state === STATE.INSIDE_MEETING (or LEAVING_MEETING,
        // which just renders the frozen final interior frame).
        interiorCharacterScale: 2.5,     // characters render at this multiple of their CURRENT outdoor size while inside a meeting
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
        interiorPauseBeforeExit: 0.4     // seconds paused back at the entrance before actually leaving
    };

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

        music: "assets/audio/chapter1-gameplay-music.mp3"
    };

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

       Leave a meeting out entirely (as all of them are right now) to
       just use the defaults from CONFIG (interiorEntranceFrac/
       interiorMidFrac/interiorFarFrac).
       ====================================================================== */
    const MEETING_INTERIOR_CONFIG = {};

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
            doorway: { xPercent: 0.34, bottomPercent: 1.0, widthPercent: 0.14, heightPercent: 0.40 }
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
            doorway: { xPercent: 0.35, bottomPercent: 1.0, widthPercent: 0.11, heightPercent: 0.30 }
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
    let clockDisplay = null;
    let progressFill = null;
    let startPrompt = null;
    let actionButton = null;
    let retryOverlay = null;
    let retryButton = null;

    let rafId = null;
    let lastFrameTime = 0;

    let state = STATE.WAITING_TO_START;
    let meetingIndex = 0;
    let exitedMeetingIndex = null;   // index of the meeting just left, if its building is still receding into view -- see advanceToNextSection() and the "EXITED BUILDING" block in renderOutdoorScene()

    let distanceTraveled = 0;       // logical distance covered in the CURRENT section only (0..sectionDistance) -- resets to 0 every time advanceToNextSection() runs. All section-boundary/gameplay-logic checks (approach, obstacles, doorway) use this, unchanged.
    let worldScrollDistance = 0;    // continuous logical distance covered since Level 1 started -- NEVER reset at a section boundary. Purely for rendering continuity (tiled background scroll phase, atmosphere parallax) -- see advanceDistance()/setDistanceTraveled() below and the note above advanceToNextSection().
    let currentSpeed = 0;           // current px/sec of the primary character

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

    // meeting doorway -- see getDoorwayScreenRect / isPointOnDoorway / drawDoorwayHintArrow
    let doorwayWaitTimer = 0;      // seconds spent waiting at the current doorway, unpressed
    let hasLearnedDoorway = false; // true once the player has successfully tapped any doorway this level (gives the hint longer to appear on later doors)

    // CHANGING STORE EVENT -- see CHANGING_STORE / checkChangingStoreApproach /
    // updateChangingStoreEvent. changingStorePhase is only meaningful while
    // state === STATE.CHANGING_STORE_EVENT.
    let changingStorePhase = null;    // null | "approach" | "dialogue1" | "entering" | "hidden" | "emerging" | "reveal" | "pauseBeforeDialogue2" | "dialogue2"
    let changingStoreTimer = 0;       // generic countdown/elapsed timer, meaning depends on changingStorePhase
    let changingStoreCompleted = false; // true once the whole event has played out once -- the store then behaves like ordinary scenery, see checkChangingStoreApproach

    // DRY PEOPLE'S CLUB DIALOGUE STOP -- see DRY_CLUB_STOP /
    // checkDryClubApproach / updateDryClubDialogue. Much smaller than the
    // changing store event: just approach, stop, play one dialogue point,
    // resume -- no doorway, no costume change.
    let dryClubPhase = null;         // null | "dialogue"
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
    let musicFading = false;

    let transitionTimer = 0;
    let transitionPhase = null;  // "in" | "finishing"
    let finishTimer = 0;

    // inside-the-meeting sequence
    let insideElapsed = 0;
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
    let billInteriorFacingLeft = false; // which way each character is currently drawn facing -- see updateInteriorSequence/updateInteriorBob
    let bobInteriorFacingLeft = false;
    let bobInteriorTurnTimer = 0;       // brief "stop and turn" beat before Bob reverses, mirrors the walk-step turn beat below

    // story clock (atmosphere only)
    let clockMinutes = 0;

    // neighborhood scenery system -- see BACKGROUND_TILE_ASSET / HOUSE_ASSET_SOURCES / LEVEL1_HOUSES / LEVEL1_STREET_LAMPS above
    let tileImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let houseImages = {};           // assetKey -> { image, loaded, naturalWidth, naturalHeight }
    let streetLampImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let decorativeBuildingImages = {}; // assetKey -> decorative scenery image; no interaction logic
    let buildingImages = {};        // meeting id -> { image, loaded, naturalWidth, naturalHeight } -- optional PNG override, see drawBuilding
    let interiorImages = {};        // meeting id -> interior background image, see renderInsideMeeting
    let billSpriteImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let billSpriteImage2 = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // costume2 -- see billAppearance
    let billAnimElapsed = 0;        // seconds, free-running animation clock -- never resets on state change, see drawBillCharacter
    let billIdleNextBlipAt = null;  // billAnimElapsed timestamp for the next occasional idle variation (1->2->1 or 1->4->1)
    let billIdleBlipEndAt = null;   // if an idle blip is currently showing, when it ends and Bill returns to resting on frame 1
    let billIdleBlipCol = null;     // which variation column (1 or 3) the current/last blip used
    let billDoorwaySequenceStartAt = null; // billAnimElapsed timestamp the one-shot doorway reaction sequence began
    let billWasInDoorwayState = false;     // tracks entry into APPROACHING_MEETING/WAITING_AT_DOOR so the sequence starts fresh exactly once
    let doorwayDustPuffs = [];             // small dust puffs during the faster doorway slide -- see updateApproach/drawDoorwayDust
    let doorwayDustSpawnTimer = 0;

    let bobSpriteImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 };
    let bobSpriteImage2 = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // costume2 -- see bobAppearance
    let level1VisualsImage = { image: null, loaded: false, naturalWidth: 0, naturalHeight: 0 }; // ambient scenery sheet -- see AMBIENT_EVENTS
    let bobAnimElapsed = 0;         // seconds, free-running -- independent of billAnimElapsed
    let bobIdleNextBlipAt = null;   // billAnimElapsed-style timestamp (on bobAnimElapsed) for the next occasional 1->2->1 blip
    let bobIdleBlipEndAt = null;    // if the blip is currently showing, when it ends and Bob returns to resting on cell 1
    let bobDoorwaySequenceStartAt = null; // timestamp the one-shot 19->6 doorway reaction began
    let bobWasInDoorwayState = false;     // tracks entry into "Bob has caught up and Bill is at the doorway" so the sequence starts fresh exactly once
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
        // TOP HUD -- three fixed sections: LIVES (left), story clock
        // (center, atmosphere only), Level 1 progress (right).
        // ------------------------------------------------------------
        livesDisplay = document.createElement("div");
        livesDisplay.style.position = "absolute";
        livesDisplay.style.top = "10px";
        livesDisplay.style.left = "12px";
        livesDisplay.style.padding = "4px 10px";
        livesDisplay.style.borderRadius = "10px";
        livesDisplay.style.background = "rgba(0,0,0,0.35)";
        livesDisplay.style.color = "#d9534f";
        livesDisplay.style.font = "13px sans-serif";
        livesDisplay.style.letterSpacing = "2px";
        livesDisplay.style.pointerEvents = "none";
        container.appendChild(livesDisplay);

        // Small, unobtrusive story clock -- atmosphere only, not a
        // countdown. See STORY_TIMES for how its milestones are set.
        clockDisplay = document.createElement("div");
        clockDisplay.style.position = "absolute";
        clockDisplay.style.top = "10px";
        clockDisplay.style.left = "50%";
        clockDisplay.style.transform = "translateX(-50%)";
        clockDisplay.style.padding = "4px 10px";
        clockDisplay.style.borderRadius = "10px";
        clockDisplay.style.background = "rgba(0,0,0,0.35)";
        clockDisplay.style.color = "#eee";
        clockDisplay.style.font = "12px sans-serif";
        clockDisplay.style.letterSpacing = "1px";
        clockDisplay.style.pointerEvents = "none";
        container.appendChild(clockDisplay);

        // Level 1 progress bar -- route/section progress plus completed
        // meeting checkpoints. Not time, not a countdown.
        const progressTrack = document.createElement("div");
        progressTrack.style.position = "absolute";
        progressTrack.style.top = "10px";
        progressTrack.style.right = "12px";
        progressTrack.style.width = "84px";
        progressTrack.style.height = "14px";
        progressTrack.style.padding = "2px";
        progressTrack.style.boxSizing = "border-box";
        progressTrack.style.borderRadius = "8px";
        progressTrack.style.background = "rgba(0,0,0,0.35)";
        progressTrack.style.border = "1px solid rgba(222,208,174,0.5)";
        progressTrack.style.pointerEvents = "none";
        container.appendChild(progressTrack);

        progressFill = document.createElement("div");
        progressFill.style.width = "0%";
        progressFill.style.height = "100%";
        progressFill.style.borderRadius = "5px";
        progressFill.style.background = "#ded0ae";
        progressTrack.appendChild(progressFill);

        // The one permanent control. PRESS = GO, DOUBLE PRESS = ACTION.
        actionButton = document.createElement("div");
        actionButton.textContent = CONFIG.actionButtonLabel;
        actionButton.style.position = "absolute";
        actionButton.style.left = "50%";
        actionButton.style.bottom = "18px";
        actionButton.style.transform = "translateX(-50%)";
        actionButton.style.width = "132px";
        actionButton.style.height = "58px";
        actionButton.style.display = "flex";
        actionButton.style.alignItems = "center";
        actionButton.style.justifyContent = "center";
        actionButton.style.borderRadius = "10px";
        actionButton.style.border = "2px solid #ded0ae";
        actionButton.style.background = "#1c1712";
        actionButton.style.color = "#ded0ae";
        actionButton.style.font = "bold 16px sans-serif";
        actionButton.style.letterSpacing = "2px";
        actionButton.style.boxShadow = "0 3px 0 rgba(0,0,0,0.5)";
        actionButton.style.touchAction = "none";
        actionButton.style.userSelect = "none";
        actionButton.style.webkitUserSelect = "none";
        actionButton.style.cursor = "pointer";
        container.appendChild(actionButton);

        // Small instruction that sits above the button until the player's
        // first press, then disappears for good.
        startPrompt = document.createElement("div");
        startPrompt.textContent = "PRESS TO START";
        startPrompt.style.position = "absolute";
        startPrompt.style.left = "50%";
        startPrompt.style.bottom = "84px";
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

        if (getComputedStyle(container).position === "static") {
            container.style.position = "relative";
        }
        container.style.overflow = "hidden";
    }

    function resetRuntimeState() {
        state = STATE.WAITING_TO_START;
        meetingIndex = 0;
        exitedMeetingIndex = null;

        distanceTraveled = 0;
        worldScrollDistance = 0;
        currentSpeed = 0;

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
        doorwayDustPuffs = [];
        doorwayDustSpawnTimer = 0;
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
        billInteriorFacingLeft = false;
        bobInteriorFacingLeft = false;
        bobInteriorTurnTimer = 0;

        clockMinutes = parseStoryTime(STORY_TIMES.levelStart);

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
    let scriptDialogueLoadAttempted = false;

    function parseScriptText(text) {
        const result = {};
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

            // speaker: dialogue text
            const speakerMatch = line.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
            if (speakerMatch) {
                const speaker = speakerMatch[1].trim().toLowerCase();
                const dialogueText = speakerMatch[2].trim();
                if (speaker !== "bill" && speaker !== "bob" && speaker !== "crowd") {
                    console.warn("script.js line " + (index + 1) + ": unrecognized speaker \"" + speakerMatch[1] + "\" -- ignoring line.");
                    return;
                }
                if (!currentSection || !currentPointKey) {
                    console.warn("script.js line " + (index + 1) + ": dialogue line appears before any //SectionName / //[pt#] -- ignoring.");
                    return;
                }
                if (dialogueText.length === 0) return;
                result[currentSection][currentPointKey].push({ speaker: speaker, text: dialogueText });
                return;
            }

            console.warn("script.js line " + (index + 1) + ": couldn't parse \"" + rawLine.trim() + "\" -- ignoring.");
        });

        return result;
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
                scriptDialogue = parseScriptText(text);
            })
            .catch(function (err) {
                console.warn("script.js could not be loaded (" + err.message + ") -- falling back to existing dialogue tables.");
                scriptDialogue = null;
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

        pointerListenersAttached = false;
    }

    function preventDefaultTouch(e) {
        e.preventDefault();
    }

    function onCanvasPointerDown(e) {
        if (state !== STATE.WAITING_AT_DOOR) return;
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX !== undefined) ? e.clientX - rect.left : rect.width * 0.8;
        const y = (e.clientY !== undefined) ? e.clientY - rect.top : rect.height * 0.8;
        if (isPointOnDoorway(x, y, rect.width, rect.height)) {
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
       THE ACTION BUTTON -- the player's one control.
         PRESS         = GO
         DOUBLE PRESS  = ACTION (jump or hustle, decided automatically)
       ------------------------------------------------------------------ */
    function onActionButtonPointerDown(e) {
        e.preventDefault();
        setActionButtonPressed(true);

        const now = performance.now();
        const isDoublePress = (now - lastTapTime) <= CONFIG.doubleTapWindow;
        lastTapTime = isDoublePress ? 0 : now; // consume so a triple-press isn't double-double

        if (state === STATE.WAITING_TO_START) {
            beginWalking();
            return;
        }

        if (isDoublePress && (state === STATE.WALKING || state === STATE.DASHING)) {
            performAction();
        }
    }

    function onActionButtonPointerUp() {
        setActionButtonPressed(false);
    }

    function setActionButtonPressed(isPressed) {
        // Small press/depress visual response -- nothing fancier.
        if (!actionButton) return;
        if (isPressed) {
            actionButton.style.transform = "translateX(-50%) translateY(2px)";
            actionButton.style.boxShadow = "0 1px 0 rgba(0,0,0,0.5)";
        } else {
            actionButton.style.transform = "translateX(-50%)";
            actionButton.style.boxShadow = "0 3px 0 rgba(0,0,0,0.5)";
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
       ------------------------------------------------------------------ */
    function performAction() {
        if (dashCooldownRemaining > 0) return;

        const nearest = findNearestUnresolvedObstacle();
        if (nearest) {
            const gap = nearest.distance - distanceTraveled;
            if (gap <= CONFIG.actionTriggerDistance) {
                triggerObstacleAction(nearest);
                return;
            }
        }

        startDash();
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
        updateStoryClock(dt);
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
        const distanceToBuilding = Math.max(0, getCurrentSectionDistance() - distanceTraveled);

        if (distanceToBuilding <= CONFIG.meetingStopDistance) {
            currentSpeed = 0;
            setDistanceTraveled(getCurrentSectionDistance() - CONFIG.meetingStopDistance);
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

    // Small SNES-style dust puffs during the doorway slide -- see
    // drawDoorwayDust for the actual rendering. Spawn timing/lifetime are
    // tracked here in world/update time; each puff only remembers WHICH
    // character it belongs to plus a small fixed jitter, and gets resolved
    // to an actual screen position at render time using that frame's real
    // primaryDrawX/followerX -- so the puffs always sit correctly at
    // whichever character's feet, every frame, with no separate position
    // bookkeeping to keep in sync.
    function updateDoorwayDust(dt) {
        doorwayDustSpawnTimer -= dt;
        if (doorwayDustSpawnTimer <= 0) {
            doorwayDustSpawnTimer = CONFIG.doorwayDustSpawnInterval;
            spawnDoorwayDustPuff("bill");
            spawnDoorwayDustPuff("bob");
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
            // the doorway, so "behind" is a negative x offset) and a small
            // random vertical variance right at ground level.
            jitterX: -billRandomRange(8, 20),
            jitterY: billRandomRange(-2, 2)
        });
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
       stop dead (player input already blocked -- see below), play
       DryPeoplesClub-level1/pt1, resume normal control. See DRY_CLUB_STOP
       for placement.

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
        if (distanceToStop <= CONFIG.meetingStopDistance) {
            state = STATE.DRY_CLUB_DIALOGUE;
            dryClubPhase = "dialogue";
            currentSpeed = 0;
            setDistanceTraveled(Math.max(0, DRY_CLUB_STOP.distance - CONFIG.meetingStopDistance));
            loadDryClubDialogue("pt1");
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
        const cfg = getInteriorConfig(meetingId);
        billInteriorFrac = cfg.entranceFrac;
        billInteriorFacingLeft = false; // spawns facing right, into the room
        bobInteriorFrac = Math.max(0, cfg.entranceFrac - CONFIG.interiorBobRestGapFrac);
        bobInteriorFacingLeft = false;
        bobInteriorTurnTimer = 0;
        interiorCameraFrac = 0;
        interiorSequence = buildInteriorSequence(meetingId);
        interiorStepIndex = 0;
        interiorStepTimer = 0;
        billInteriorWalking = false;
        bobInteriorWalking = false;
    }

    function updateInsideMeeting(dt) {
        if (insideFadeTimer > 0) {
            insideFadeTimer -= dt;
        }
        insideElapsed += dt;

        // Absolute safety net -- unchanged in spirit from before. If the
        // choreographed scene or a dialogue entry is ever misconfigured
        // badly enough that we're still here after insideMeetingMaxDuration,
        // leave immediately rather than soft-locking, wherever the
        // cinematic sequence currently happens to be.
        if (insideElapsed >= CONFIG.insideMeetingMaxDuration) {
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
            farFrac: overrides.farFrac !== undefined ? overrides.farFrac : CONFIG.interiorFarFrac
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
            { type: "wait", duration: CONFIG.interiorPauseEntrance }
        ];

        waypointFracs.forEach(function (frac, i) {
            steps.push({ type: "walk", to: frac });
            steps.push({ type: "dialoguePoint", point: "pt" + (i + 1) });
            steps.push({ type: "wait", duration: CONFIG.interiorPostDialoguePause });
        });

        steps.push({ type: "waitMin" });
        steps.push({ type: "walk", to: cfg.entranceFrac });
        steps.push({ type: "wait", duration: CONFIG.interiorPauseBeforeExit });
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
                const wantsFacingLeft = dir < 0;

                // Deliberate stop-turn-go beat: if this walk needs Bill to
                // reverse from his current facing, turn him first (idle
                // pose, already mirrored) and hold briefly before any
                // actual movement starts, rather than an instant bounce.
                if (wantsFacingLeft !== billInteriorFacingLeft && !step._turned) {
                    billInteriorFacingLeft = wantsFacingLeft;
                    billInteriorWalking = false;
                    interiorStepTimer += dt;
                    if (interiorStepTimer >= CONFIG.interiorTurnDuration) {
                        step._turned = true;
                        interiorStepTimer = 0;
                    }
                    break;
                }

                const speed = CONFIG.interiorWalkSpeedFrac;
                billInteriorWalking = true;
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
        // actually facing, so Bob never ends up leading or overlapping
        // Bill when they turn around together.
        const isResting = (step.type === "wait" || step.type === "holdForScene" ||
            step.type === "dialoguePoint" || step.type === "waitMin");
        updateInteriorBob(dt, isResting);
        updateInteriorCamera(dt);
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
        const behindOffset = billInteriorFacingLeft ? gapFrac : -gapFrac;
        const targetFrac = Math.max(0, Math.min(1, billInteriorFrac + behindOffset));
        const delta = targetFrac - bobInteriorFrac;

        const wantsFacingLeft = delta < -0.002;
        const wantsFacingRight = delta > 0.002;

        if ((wantsFacingLeft || wantsFacingRight) && wantsFacingLeft !== bobInteriorFacingLeft) {
            if (bobInteriorTurnTimer <= 0) {
                bobInteriorFacingLeft = wantsFacingLeft;
            }
            bobInteriorTurnTimer += dt;
            if (bobInteriorTurnTimer < CONFIG.interiorTurnDuration) {
                bobInteriorWalking = false;
                return;
            }
            bobInteriorTurnTimer = 0;
        } else {
            bobInteriorTurnTimer = 0;
        }

        bobInteriorFrac += delta * Math.min(1, CONFIG.interiorBobLerpSpeed * dt);
        bobInteriorWalking = Math.abs(delta) > 0.002;
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
        fadeOutMusic();
    }

    /* ======================================================================
       STORY CLOCK (atmosphere only -- see STORY_TIMES above)

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
                activeBubble = null;
            }
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
                crowdPos: (entry.speaker === "crowd") ? pickCrowdBubblePreset() : null
            };
            if (dialogueQueue.length > 0) {
                dialogueTimer = dialogueQueue[0].delay;
            }
        }
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

        if (doorwayDustPuffs.length > 0) {
            drawDoorwayDust(primaryDrawX, followerX, groundY);
        }

        let bobBox = null;
        let billBox = null;
        if (!billBobHidden) {
            bobBox = drawBobCharacter(followerX, groundY, h, driftY);           // follower (Bob)
            billBox = drawBillCharacter(primaryDrawX, groundY, h, jumpArcOffset()); // primary (Bill) -- lifts during a jump
        }

        if (state === STATE.KICKING) {
            drawKickLeg(primaryDrawX, groundY, kickLegExtension());
        }

        if (billBox && bobBox) {
            drawSpeechBubbles(primaryX, followerX, groundY, h, w, billBox, bobBox);
        }

        // No permanent "TAP THE DOORWAY" text -- the doorway itself is the
        // interaction. A small pointer only appears after a short wait,
        // and never if the player has already tapped it.
        if (state === STATE.WAITING_AT_DOOR && shouldShowDoorwayHint()) {
            drawDoorwayHintArrow(w, h);
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
            Object.assign({ walkingOverride: bobInteriorWalking, facingLeft: bobInteriorFacingLeft }, interiorRenderOptions));
        const billBox = drawBillCharacter(billScreenX, groundY, h, 0,
            Object.assign({ walkingOverride: billInteriorWalking, facingLeft: billInteriorFacingLeft }, interiorRenderOptions));

        // Existing "inside" dialogue (see loadInsideDialogueForSection) still
        // works exactly as before -- it's the SAME dialogueQueue/activeBubble
        // system used outdoors, just anchored here to each character's
        // EXACT returned bounding box (billBox/bobBox above), which is
        // already camera-scroll-aware, facing-aware, and correct for the
        // much larger interior scale -- see drawSpeechBubbles.
        drawSpeechBubbles(billScreenX, bobScreenX, groundY, h, w, billBox, bobBox);
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
    // (see exitedMeetingIndex). isCurrent gates the doorway glow/highlight,
    // which only makes sense for the meeting the player can actually
    // interact with right now.
    function drawBuilding(meeting, w, h, x, isCurrent) {
        // Single source of truth for where/how big this building is drawn --
        // getDoorwayScreenRect() (hit-testing), drawDoorwayGlow(), and
        // drawDoorwayHintArrow() all derive from this same geometry, so the
        // tap target and every doorway-adjacent visual always agree with
        // what's actually on screen. See the comment above
        // getBuildingRenderGeometry() for why this used to drift.
        const geo = getBuildingRenderGeometry(meeting, w, h, x);
        if (geo.x < -260) return;

        // OPTIONAL PNG OVERRIDE -- the doorway hit-test (getDoorwayScreenRect)
        // reads the same buildingImages/usingOverride check via
        // getBuildingRenderGeometry, so swapping between the override image
        // and the placeholder here never desyncs interaction logic from
        // what's drawn.
        if (geo.usingOverride) {
            drawBuildingImage(buildingImages[meeting.id], geo.x, geo.groundY, geo.displayHeight);
            if (isCurrent && state === STATE.WAITING_AT_DOOR) {
                drawDoorwayGlow(w, h);
            }
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

    function drawDoorwayGlow(w, h) {
        // Subtle "you can tap here" cue drawn over a real building
        // image -- the artist's own doorway art shows through beneath it.
        // Uses the exact same rect as the tap-target (getDoorwayScreenRect),
        // so the glow always sits exactly over the real, live doorway.
        const rect = getDoorwayScreenRect(w, h);
        ctx.save();
        ctx.fillStyle = "rgba(242, 193, 78, 0.35)";
        ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
        ctx.restore();
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

    // Small SNES-style "zip" dust puffs during the faster doorway slide --
    // see updateDoorwayDust/spawnDoorwayDustPuff for spawning/lifetime.
    // Deliberately tiny and few: a soft filled circle per puff, growing
    // slightly and fading out over its short life, never more than a
    // couple visible at once. billX/bobX are that frame's actual drawn
    // screen positions (primaryDrawX/followerX), so a puff always tracks
    // whichever character it belongs to correctly even as they move.
    function drawDoorwayDust(billX, bobX, groundY) {
        ctx.save();
        doorwayDustPuffs.forEach(function (puff) {
            const t = 1 - Math.max(0, puff.life / puff.maxLife); // 0 = just spawned, 1 = about to vanish
            const baseX = (puff.belongsTo === "bill") ? billX : bobX;
            const cx = baseX + puff.jitterX;
            const cy = groundY + puff.jitterY;
            const radius = 6 + t * 13;
            const alpha = 0.7 * (1 - t);
            if (alpha <= 0) return;

            // Two-tone puff (soft outer + brighter core) so it reads
            // clearly against both light and dark ground art, not just a
            // flat translucent dot.
            ctx.beginPath();
            ctx.fillStyle = "rgba(214, 202, 176, " + alpha.toFixed(3) + ")";
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = "rgba(255, 250, 235, " + (alpha * 0.8).toFixed(3) + ")";
            ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
            ctx.fill();
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
    function drawBillCharacter(x, groundY, canvasH, verticalOffset, renderOptions) {
        renderOptions = renderOptions || {};
        const scaleMultiplier = renderOptions.scaleMultiplier || 1;
        const useOverride = renderOptions.walkingOverride !== undefined;

        // Picks costume2 only once it's loaded; falls back to the normal
        // sheet (never to the flat placeholder) if costume2 is missing --
        // billAppearance itself never causes a fallback to the placeholder
        // shape, only a missing/failed image file does.
        const activeBillImage = (billAppearance === "costume2" && billSpriteImage2 && billSpriteImage2.loaded)
            ? billSpriteImage2 : billSpriteImage;

        const usingSprite = !!(activeBillImage && activeBillImage.loaded &&
            activeBillImage.naturalWidth > 0 && activeBillImage.naturalHeight > 0);

        if (!usingSprite) {
            // Fallback: unchanged original placeholder look.
            return drawCharacter(x, groundY, "#8a5a34", canvasH, verticalOffset);
        }

        const isWalking = useOverride ? renderOptions.walkingOverride : (state === STATE.WALKING || state === STATE.DASHING);
        const isAtDoorway = useOverride ? false : (state === STATE.APPROACHING_MEETING || state === STATE.WAITING_AT_DOOR);

        let row, col;

        if (isAtDoorway) {
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

        const cellW = activeBillImage.naturalWidth / BILL_SPRITE_COLS;
        const cellH = activeBillImage.naturalHeight / BILL_SPRITE_ROWS;
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
        // BILL_FRAME_OFFSET_X was hand-measured against the ORIGINAL
        // basic-level1-bill.png only -- applying those same per-cell
        // corrections to the different costume2 artwork is as likely to
        // introduce misalignment as fix it, so costume2 gets a neutral
        // (0) offset until it has its own measured table.
        const billOffsetX = (billAppearance === "costume2") ? 0 : billFrameOffsetX(row, col);
        const frameOffsetDisplay = billOffsetX * (displayWidth / cellW);
        const destX = x - displayWidth / 2 + frameOffsetDisplay + CONFIG.billRenderOffsetX;
        const destY = groundY - displayHeight + verticalOffset + CONFIG.billRenderOffsetY;

        // Directional, appearance-aware inset on the SOURCE rect -- see
        // SPRITE_INSET above. costume2 gets a much bigger TOP margin to
        // guard against the row-above bleed observed above Bill's head;
        // the bottom margin stays minimal so feet are never additionally
        // clipped by this inset itself.
        const billInset = spriteInsetFor(billAppearance, row);
        const srcXi = srcX + billInset.left;
        const srcYi = srcY + billInset.top;
        const srcWi = cellW - billInset.left - billInset.right;
        const srcHi = cellH - billInset.top - billInset.bottom;

        // facingLeft (interior cinematic only -- outdoor Bill only ever
        // walks right, so renderOptions.facingLeft is always falsy there
        // and this exactly matches the old unflipped draw). Mirrors the
        // SAME frames horizontally around Bill's own x rather than using
        // separate left-facing art. imageSmoothingEnabled is turned off
        // just for this draw so the large interior scale-up can't sample
        // pixels from the neighboring sprite-sheet cell at the frame's
        // edges -- see the matching note in drawBobCharacter.
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

        // Same pattern as drawBillCharacter's activeBillImage -- picks
        // costume2 only once it's actually loaded, otherwise stays on the
        // normal sheet (never falls to the flat placeholder just because
        // of an appearance switch, only a missing/failed file does that).
        const activeBobImage = (bobAppearance === "costume2" && bobSpriteImage2 && bobSpriteImage2.loaded)
            ? bobSpriteImage2 : bobSpriteImage;

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

        if (isDoorway && !isCatchingUp) {
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

        const cellW = activeBobImage.naturalWidth / BOB_SPRITE_COLS;
        const cellH = activeBobImage.naturalHeight / BOB_SPRITE_ROWS;
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
        // Same reasoning as billOffsetX in drawBillCharacter: BOB_FRAME_OFFSET_X/Y
        // were hand-measured against the ORIGINAL basic-level1-bob.png only --
        // applying those same per-cell corrections to the different costume2
        // artwork is as likely to introduce misalignment as fix it, so
        // costume2 gets neutral (0) offsets until it has its own measured table.
        const bobOffsetXRaw = (bobAppearance === "costume2") ? 0 : bobFrameOffsetX(row, col);
        const bobOffsetYRaw = (bobAppearance === "costume2") ? 0 : bobFrameOffsetY(row, col);
        const offsetXDisplay = bobOffsetXRaw * (displayWidth / cellW);
        const offsetYDisplay = bobOffsetYRaw * (displayHeight / cellH);
        const destX = x - displayWidth / 2 + offsetXDisplay + CONFIG.bobRenderOffsetX;
        const destY = groundY - displayHeight + verticalOffset + offsetYDisplay + CONFIG.bobRenderOffsetY;

        // The actual fix: draw from this cell's own isolated, pre-cropped
        // canvas (see getBobFrameCanvas) instead of the shared spritesheet
        // Image. That canvas physically contains only this cell's pixels,
        // so there is nothing left for any scale factor or filtering mode
        // to bleed in from a neighboring pose -- see the long comment by
        // BOB_CROP_INSET above for why this is a structural fix rather
        // than another tweak of the same source-rect-inset approach.
        const frame = getBobFrameCanvas(bobAppearance, activeBobImage.image, row, col, cellW, cellH, srcX, srcY);

        // facingLeft (interior cinematic only -- outdoor Bob only ever
        // walks right, so renderOptions.facingLeft is always falsy there
        // and this exactly matches the old unflipped draw). Same mirror-
        // about-x approach as Bill; see the note in drawBillCharacter.
        // imageSmoothingEnabled off here too -- belt-and-suspenders on
        // top of the isolation fix, and harmless either way since the
        // isolated canvas has no neighbor data to sample regardless.
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
        { xFrac: 0.26, yFrac: 0.22 }, // upper-left
        { xFrac: 0.50, yFrac: 0.18 }, // upper-middle
        { xFrac: 0.74, yFrac: 0.23 }, // upper-right
        { xFrac: 0.34, yFrac: 0.32 }, // mid-left
        { xFrac: 0.68, yFrac: 0.33 }  // mid-right
    ];
    function pickCrowdBubblePreset() {
        const preset = CROWD_BUBBLE_PRESETS[crowdBubblePresetIndex % CROWD_BUBBLE_PRESETS.length];
        crowdBubblePresetIndex += 1;
        return preset;
    }

    function drawSpeechBubbles(primaryX, followerX, groundY, h, canvasWidth, billBox, bobBox) {
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
        if (activeBubble && activeBubble.speaker === "crowd") {
            // Anonymous meeting-room voice -- no anchor box at all, just
            // one of the preset room positions picked when this bubble
            // was created (see updateDialogue). Only rendered inside a
            // meeting; if a crowd line somehow reached this call outside
            // one (script.js is meeting-only for "crowd:" today), skip it
            // silently rather than showing an anonymous bubble outdoors.
            if (state === STATE.INSIDE_MEETING && activeBubble.crowdPos) {
                drawBubble(activeBubble.crowdPos.xFrac * canvasWidth, activeBubble.crowdPos.yFrac * h,
                    activeBubble.text, canvasWidth);
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
            drawBubble(anchorX, bubbleY, activeBubble.text, canvasWidth);
        }

        if (state === STATE.WAITING_AT_DOOR) {
            const meeting = MEETINGS[meetingIndex];
            const x = worldToScreenX(getCurrentSectionDistance(), primaryX);
            const override = buildingImages[meeting.id];
            const hasBuildingImage = !!(override && override.loaded && override.naturalHeight > 0);
            const visibleBuildingHeight = hasBuildingImage
                ? getBuildingImageDisplayHeight(meeting.buildingStyle, h)
                : buildingStyleHeight(meeting.buildingStyle);
            drawBubble(x, groundY - visibleBuildingHeight - 26,
                "God, grant me the serenity...", canvasWidth);
        }
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

    function drawBubble(anchorX, anchorY, text, canvasWidth) {
        // Restrained comic-style bubble: cream fill, dark outline, small
        // tail toward the speaker. Wraps to multiple lines and slides away
        // from the screen edge (without losing track of who's talking) so
        // it stays fully visible and readable on a phone.
        ctx.save();
        ctx.font = "15px sans-serif";

        const paddingX = 12;
        const paddingY = 9;
        const lineHeight = 19;
        const edgePadding = 10;
        const maxBubbleWidth = Math.min(230, canvasWidth * 0.62);
        const maxTextWidth = maxBubbleWidth - paddingX * 2;

        const lines = wrapBubbleText(text, maxTextWidth);
        let textWidth = 0;
        lines.forEach(function (line) {
            textWidth = Math.max(textWidth, ctx.measureText(line).width);
        });

        const bubbleW = Math.min(maxBubbleWidth, textWidth + paddingX * 2);
        const bubbleH = paddingY * 2 + lines.length * lineHeight;
        const halfW = bubbleW / 2;

        // Keep the bubble body fully on screen even if the speaker is
        // standing near an edge.
        let bubbleCenterX = anchorX;
        if (bubbleCenterX - halfW < edgePadding) {
            bubbleCenterX = edgePadding + halfW;
        } else if (bubbleCenterX + halfW > canvasWidth - edgePadding) {
            bubbleCenterX = canvasWidth - edgePadding - halfW;
        }

        const bubbleTop = anchorY - bubbleH;

        ctx.fillStyle = "#fdf6e3";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 2;
        roundRect(ctx, bubbleCenterX - halfW, bubbleTop, bubbleW, bubbleH, 10);
        ctx.fill();
        ctx.stroke();

        // Tail still points at the actual speaker, even if the bubble body
        // had to shift to stay on screen.
        const tailX = Math.max(bubbleCenterX - halfW + 14, Math.min(bubbleCenterX + halfW - 14, anchorX));
        ctx.beginPath();
        ctx.moveTo(tailX - 7, anchorY);
        ctx.lineTo(tailX + 7, anchorY);
        ctx.lineTo(tailX, anchorY + 9);
        ctx.closePath();
        ctx.fillStyle = "#fdf6e3";
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        lines.forEach(function (line, i) {
            const ly = bubbleTop + paddingY + lineHeight * i + lineHeight / 2;
            ctx.fillText(line, bubbleCenterX, ly);
        });

        ctx.restore();
    }

    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    function drawDoorwayHintArrow(w, h) {
        // Small, discoverable nudge -- only shown after shouldShowDoorwayHint()
        // says the player has been waiting a bit. Points directly at the
        // real doorway (see getDoorwayScreenRect) and gently bobs. Sits
        // just above the doorway itself, well below the Serenity Prayer
        // bubble (anchored up near the roofline), so the two never collide.
        const rect = getDoorwayScreenRect(w, h);
        const cx = (rect.left + rect.right) / 2;
        const bob = Math.sin(doorwayWaitTimer * 4) * 4;
        const tipY = rect.top - 10 + bob;

        ctx.save();
        ctx.fillStyle = "rgba(253,246,227,0.9)";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(cx, tipY + 14);
        ctx.lineTo(cx - 8, tipY);
        ctx.lineTo(cx - 3, tipY);
        ctx.lineTo(cx - 3, tipY - 16);
        ctx.lineTo(cx + 3, tipY - 16);
        ctx.lineTo(cx + 3, tipY);
        ctx.lineTo(cx + 8, tipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
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
        }

        if (alpha > 0) {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0," + Math.min(1, Math.max(0, alpha)) + ")";
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }

    function updateHud() {
        if (livesDisplay) {
            livesDisplay.textContent = "\u2665 ".repeat(lives).trim();
            livesDisplay.style.opacity = (livesFlashTimer > 0) ? "0.4" : "1";
        }
        if (clockDisplay) {
            clockDisplay.textContent = formatClock(clockMinutes);
        }
        if (progressFill) {
            progressFill.style.width = Math.round(computeLevelProgress() * 100) + "%";
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
        detachInput();

        console.log("chapter1-gameplay complete - next story handler not connected yet");

        const next = window.HalloweenGame.nextChapter;
        if (next && typeof next.start === "function") {
            next.start();
        }
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
    function startMusic() {
        try {
            musicEl = new Audio(ASSETS.music);
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
        if (!canvas || !container) return;
        const rect = container.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width));
        canvas.height = Math.max(1, Math.floor(rect.height));
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

        if (container) {
            container.innerHTML = "";
        }

        canvas = null;
        ctx = null;
        livesDisplay = null;
        clockDisplay = null;
        progressFill = null;
        startPrompt = null;
        actionButton = null;
        retryOverlay = null;
        retryButton = null;

        obstacles = [];
        dialogueQueue = [];
        activeBubble = null;
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