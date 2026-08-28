/*
chapter1-story.js
Recovery Misfits Halloween Game

STORY CARD ASSETS

assets/cards/chapter1-story-1.png
assets/cards/chapter1-story-2.png
assets/cards/chapter1-story-3.png
assets/cards/chapter1-story-4.png
assets/cards/chapter1-story-5.png

AUDIO

assets/audio/chapter1-story-music.mp3

LAYOUT

- Top ~66%: comic artwork
- Middle ~27%: dialogue
- Bottom ~7%: Back / Next navigation
*/

window.HalloweenGame = window.HalloweenGame || {};

/* ==========================================================================
   GAME FRAME -- shared 390x780 canonical portrait stage, identical block
   in chapter0-intro.js/chapter1-story.js/chapter1-gameplay.js (guarded so
   it only actually runs once no matter how many of those three include
   it). Locks the #game element itself to a fixed 390x780 CSS box, then
   scales that whole box up/down as one rigid unit (a single centered CSS
   transform) to fit whatever the real window/device is -- so every
   chapter composes against the exact same logical stage instead of a
   wider screen revealing more world. See chapter1-gameplay.js's
   resizeCanvas() for the matching fixed-resolution canvas half of this.
   ========================================================================== */
if (!window.HalloweenGame.gameFrameReady) {
    window.HalloweenGame.gameFrameReady = true;
    (function () {
        var GAME_STAGE_WIDTH = 390;
        var GAME_STAGE_HEIGHT = 780;
        function applyGameFrame() {
            var game = document.getElementById("game");
            if (!game) return;
            var scale = Math.min(window.innerWidth / GAME_STAGE_WIDTH, window.innerHeight / GAME_STAGE_HEIGHT);
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

window.HalloweenGame.chapter1Story = {

    name: "chapter1-story",

    music: "assets/audio/chapter1-story-music.mp3",

    uiClick: "assets/audio/click.mp3",

    storyMusic: null,

    uiClickEl: null,

    currentCard: 0,

    storyFrameRestore: null,

    storyFrameResizeHandler: null,

    cards: [

        /*
        STORY CARD 1

        IMAGE IDEA:
        Halloween night in Akron, Ohio.

        Our friends have just arrived.
        People in Halloween costumes notice them
        and begin staring.

        Their expressions should suggest:
        "Oh no... we've been recognized."
        */

        {
            image: "assets/cards/chapter1-story-1.png",

            lines: [
    "Our friends landed back on Earth smack dab in the middle of Akron, Ohio, where they had met years earlier.",
      "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0────────────────────────",
    "Crashing down in front of a meeting hall, they caught the attention of the few in the crowd whose attention wasn't otherwise occupied."
]
        },


        /*
        STORY CARD 2

        IMAGE IDEA:
        Someone from the group excitedly holds
        out a modern cell phone.

        The screen shows a Google search for:

        RECOVERY

        One of our friends takes the phone and
        studies it very intently, almost like
        he is inspecting an alien artifact.
        */

        {
    image: "assets/cards/chapter1-story-2.png",

lines: [
    "“Hey, aren't you those guys...?”",
    "“Uggghhh.....”",
    "“So... where's the weekly meeting around here?”",
    "“WEEKLY MEETING!? Ha! Man, you guys really have been gone awhile.”",
    "“Here... you gotta see this.”",
     "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0────────────────────────",
    "",
    "Quickly, not slowly, our friends caught up on roughly half a century of recovery."
],
    indentLines: [1, 2]
},


        /*
        STORY CARD 3

        IMAGE IDEA:
        His face completely lights up.

        He is staring at the phone, then turns
        toward his friend, absolutely amazed
        by what recovery has become.
        */

        {
            image: "assets/cards/chapter1-story-3.png",

            lines: [
    "One simple search pulled up thousands upon thousands of results — meetings from all kinds of fellowships, all over the world.",
    "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0────────────────────────",
    "Curious, the pair began to wonder just how much recovery had blossomed since the last time they'd sat in a meeting."
]
        },


        /*
        STORY CARD 4

        TODO:
        Add Story Card 4 tomorrow.

        IMAGE IDEA:
        TODO

        DIALOGUE:
        TODO
        */

        {
            image: "assets/cards/chapter1-story-4.png",

            lines: [
  
"Alcoholics, cocaine addicts, even Juggalos... those looking for recovery could finally find their people.",

    "They met in halls, church basements, living rooms, and now, even online.",


]
        },


        /*
        STORY CARD 5

        TODO:
        Add Story Card 5 tomorrow.

        IMAGE IDEA:
        TODO

        DIALOGUE:
        TODO
        */

        {
            image: "assets/cards/chapter1-story-5.png",

    lines: [
    "Eager to see what recovery looked like nowadays, and with their own sobriety once again in play, the two did what they had always done...",

    "They hit a meeting.",

    "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0────────────────────────",

    "What they were about to find would be QUITE DISTURBING..."
]

        }

    ],


    start() {

        console.log("CHAPTER 1 STORY — NEW FILE IS LOADING!!!");

        this.injectStyles();

        this.activateStoryFrame();

        this.currentCard = 0;

        this.startMusic();

        this.showCard();
    },


    injectStyles() {

        if (
            document.getElementById(
                "chapter1-story-styles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "chapter1-story-styles";


        style.textContent = `

            /*
            ============================================================
            CHAPTER 1 STORY — LAYOUT CORRECTION ONLY
            ============================================================
            One continuous 390x780 comic page.
            No visible black strips above or below.
            Masthead at top, navigation at bottom.
            Artwork is proportional and never cropped.
            */

            @font-face {
                font-family: "RM Bangers";
                src: url("assets/fonts/Bangers-Regular.ttf") format("truetype");
                font-display: swap;
            }

            @font-face {
                font-family: "RM Adam Warren";
                src: url("assets/fonts/adam-warren-pro-regular.ttf") format("truetype");
                font-display: swap;
            }

            @font-face {
                font-family: "RM Comic Neue";
                src: url("assets/fonts/ComicNeue-Bold.ttf") format("truetype");
                font-display: swap;
            }
:root {
                --comic-paper: #dfc987;
                --comic-paper-light: #eedca2;
                --comic-ink: #17130f;
                --comic-red: #a8372b;
                --comic-blue: #376d78;
                --comic-yellow: #d3ad39;
            }

            /*
            CRITICAL:
            Occupy the complete 390x780 #game stage.
            This removes the exposed black #game background.
            */
            .chapter1-story-screen {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                min-height: 100%;
                max-height: none;
                margin: 0;
                padding: 0;
                position: absolute;
                inset: 0;

                width: 100%;
                height: 100%;
                min-height: 100%;

                margin: 0;
                padding: 0;

                box-sizing: border-box;

                display: flex;
                flex-direction: column;

                overflow: hidden;

                background:
                    radial-gradient(
                        circle at 16% 19%,
                        rgba(73,48,23,0.15) 0 0.8px,
                        transparent 1px
                    ),
                    radial-gradient(
                        circle at 76% 63%,
                        rgba(93,59,28,0.11) 0 0.65px,
                        transparent 0.9px
                    ),
                    radial-gradient(
                        circle at 54% 36%,
                        rgba(255,240,182,0.23) 0 1px,
                        transparent 1.3px
                    ),
                    var(--comic-paper);

                background-size:
                    19px 17px,
                    29px 31px,
                    37px 41px,
                    auto;

                color: var(--comic-ink);

                font-family:
                    "RM Comic Neue",
                    "Comic Sans MS",
                    sans-serif;

                transform-origin: center center;
                isolation: isolate;
            }

            .chapter1-story-screen::before {
                content: "";

                position: absolute;
                inset: 0;

                z-index: 20;

                pointer-events: none;

                opacity: 0.09;

                background-image:
                    repeating-linear-gradient(
                        0deg,
                        rgba(36,26,18,0.09) 0,
                        rgba(36,26,18,0.09) 1px,
                        transparent 1px,
                        transparent 4px
                    ),
                    radial-gradient(
                        circle,
                        rgba(31,23,16,0.22) 0 0.55px,
                        transparent 0.8px
                    );

                background-size:
                    auto,
                    5px 5px;

                mix-blend-mode: multiply;
            }

            .chapter1-story-screen::after {
                content: none;
            }


            /*
            ============================================================
            MASTHEAD — NATURAL HEIGHT, FLUSH TO TOP
            ============================================================
            */

            .chapter1-story-masthead {
                flex: 0 0 auto;

                width: 100%;

                margin: 0;
                padding: 5px 7px 4px;

                box-sizing: border-box;

                position: relative;
                z-index: 3;

                background: transparent;
                border: 0;
                box-shadow: none;
            }

            .chapter1-story-masthead-top {
                width: 100%;
                min-width: 0;

                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 6px;

                overflow: hidden;
            }

            .chapter1-story-logo {
                flex: 0 0 auto;

                font-family:
                    "RM Bangers",
                    Impact,
                    sans-serif;

                font-size: 30px;
                line-height: 0.95;
                letter-spacing: 0.35px;

                color: var(--comic-red);

                -webkit-text-stroke:
                    1.1px
                    var(--comic-ink);

                paint-order: stroke fill;

                text-shadow:
                    2px 2px 0 var(--comic-ink),
                    -1px 0 rgba(51,112,120,0.28);

                transform:
                    rotate(-1deg)
                    skewX(-4deg);

                white-space: nowrap;
            }

            .chapter1-story-publisher {
                flex: 1 1 auto;
                min-width: 0;

                font-family:
                    "RM Bangers",
                    Impact,
                    sans-serif;

                color: var(--comic-ink);

                font-size: 13px;
                line-height: 1;
                letter-spacing: 0.4px;

                text-align: right;
                white-space: nowrap;
            }

            .chapter1-story-issue {
                width: 100%;
                height: 21px;

                margin-top: 3px;
                padding: 1px 8px 0;

                box-sizing: border-box;

                display: flex;
                align-items: center;
                justify-content: center;

                background:
                    radial-gradient(
                        circle,
                        rgba(23,19,15,0.20) 0 0.5px,
                        transparent 0.8px
                    ),
                    var(--comic-yellow);

                background-size:
                    5px 5px,
                    auto;

                border: 0;
                box-shadow: none;

                font-family:
                    "RM Adam Warren",
                    "RM Comic Neue",
                    sans-serif;

                font-size: 10px;
                font-weight: 900;
                letter-spacing: 0.5px;

                color: var(--comic-ink);

                white-space: nowrap;
                overflow: hidden;
            }


            /*
            ============================================================
            ARTWORK — ~9PX PAPER MARGIN, FULL IMAGE, NO CROPPING
            ============================================================
            */

            .chapter1-story-image-area {
                flex: 0 0 auto;

                width: 100%;

                margin: 0;
                padding: 0 9px;

                box-sizing: border-box;

                background: transparent;
            }

            .chapter1-story-image-frame {
                width: 100%;
                height: auto;

                margin: 0;
                padding: 0;

                box-sizing: border-box;

                position: relative;

                overflow: hidden;

                display: block;

                background: transparent;

                border:
                    3px solid
                    var(--comic-ink);

                box-shadow: none;
                transform: none;
            }

            .chapter1-story-image-frame::before {
                content: "";

                position: absolute;
                inset: 0;

                z-index: 2;

                pointer-events: none;

                opacity: 0.09;

                background-image:
                    radial-gradient(
                        circle,
                        rgba(20,16,12,0.46) 0 0.6px,
                        transparent 0.9px
                    );

                background-size: 4px 4px;

                mix-blend-mode: multiply;
            }

            .chapter1-story-image-frame::after {
                content: none;
            }

            .chapter1-story-image {
                width: 100%;
                height: auto;
                max-height: none;

                margin: 0;
                padding: 0;

                object-fit: contain;
                object-position: center center;

                display: block;

                filter:
                    saturate(0.92)
                    contrast(1.08)
                    sepia(0.07);
            }

            .chapter1-story-placeholder {
                width: 100%;
                min-height: 260px;

                display: flex;
                align-items: center;
                justify-content: center;

                text-align: center;

                box-sizing: border-box;

                padding: 24px;

                background: var(--comic-paper-light);
                color: var(--comic-ink);

                font-family:
                    "RM Adam Warren",
                    "RM Comic Neue",
                    sans-serif;

                font-size: 15px;
                font-weight: 900;
                line-height: 1.35;
            }


            /*
            ============================================================
            STORY BOX — FILLS THE REMAINING SPACE
            ============================================================
            */

            .chapter1-story-text-area {
                flex: 1 1 auto;

                width: calc(100% - 18px);
                min-height: 0;

                margin: 7px 9px 5px;
                padding: 14px 15px 10px;

                box-sizing: border-box;

                position: relative;

                overflow-y: auto;

                display: flex;
                align-items: flex-start;

                background:
                    radial-gradient(
                        circle at 12% 22%,
                        rgba(88,58,27,0.12) 0 0.7px,
                        transparent 0.95px
                    ),
                    radial-gradient(
                        circle at 81% 70%,
                        rgba(88,58,27,0.10) 0 0.65px,
                        transparent 0.9px
                    ),
                    var(--comic-paper-light);

                background-size:
                    21px 23px,
                    31px 29px,
                    auto;

                border:
                    3px solid
                    var(--comic-ink);

                box-shadow:
                    1px 1px 0
                    rgba(23,19,15,0.48);

                transform: none;

                scrollbar-width: thin;
                scrollbar-color:
                    rgba(23,19,15,0.36)
                    transparent;
            }

            .chapter1-story-text-area::before {
                content: "";

                position: absolute;
                inset: 0;

                pointer-events: none;

                opacity: 0.08;

                background-image:
                    radial-gradient(
                        circle,
                        rgba(23,19,15,0.42) 0 0.55px,
                        transparent 0.8px
                    );

                background-size: 6px 6px;
            }

            .chapter1-story-text {
                width: 100%;

                position: relative;
                z-index: 1;

                font-family:
                    "Courier New",
                    Courier,
                    monospace;

                font-size: 19px;
                line-height: 1.22;

                color: var(--comic-ink);

                text-align: left;
                font-weight: 700;
                letter-spacing: 0.12px;

                text-shadow:
                    0.55px 0 rgba(169,55,43,0.13),
                    -0.55px 0 rgba(55,109,120,0.12);
            }

            .chapter1-story-line {
                margin: 0 0 9px;
            }

            .chapter1-story-line:last-child {
                margin-bottom: 0;
            }

            .chapter1-story-line.dialogue-indent {
                margin-left: 42px;
                padding-left: 14px;
                border-left: 4px solid var(--comic-ink);
            }


            /*
            ============================================================
            NAVIGATION — NATURAL HEIGHT, FLUSH TO BOTTOM
            ============================================================
            */

            .chapter1-story-nav {
                flex: 0 0 50px;

                width: 100%;
                height: 50px;

                margin: 0;
                padding: 2px 8px 4px;

                box-sizing: border-box;

                display: grid;

                grid-template-columns:
                    104px
                    minmax(0, 1fr)
                    104px;

                align-items: end;
                gap: 5px;

                background: transparent;
                border: 0;

                position: relative;
                z-index: 3;
            }

            .chapter1-story-nav-button {
                height: 42px;

                border: 0;

                color: var(--comic-ink);

                font-family:
                    "RM Bangers",
                    Impact,
                    sans-serif;

                font-size: 19px;
                line-height: 1;
                letter-spacing: 0.7px;

                cursor: pointer;

                padding: 1px 14px 0;

                text-transform: uppercase;

                text-shadow:
                    0.7px 0
                    rgba(255,255,255,0.22);

                box-shadow:
                    2px 2px 0
                    var(--comic-ink);

                transition:
                    transform 90ms ease,
                    filter 90ms ease;

                clip-path:
                    polygon(
                        18% 0,
                        100% 0,
                        100% 100%,
                        18% 100%,
                        18% 78%,
                        0 50%,
                        18% 22%
                    );

                background:
                    radial-gradient(
                        circle,
                        rgba(23,19,15,0.22) 0 0.55px,
                        transparent 0.8px
                    ),
                    var(--comic-blue);

                background-size:
                    5px 5px,
                    auto;

                transform:
                    rotate(-1deg);
            }

            .chapter1-story-nav-button:last-child {
                clip-path:
                    polygon(
                        0 0,
                        82% 0,
                        82% 22%,
                        100% 50%,
                        82% 78%,
                        82% 100%,
                        0 100%
                    );

                background:
                    radial-gradient(
                        circle,
                        rgba(23,19,15,0.22) 0 0.55px,
                        transparent 0.8px
                    ),
                    var(--comic-red);

                background-size:
                    5px 5px,
                    auto;

                transform:
                    rotate(1deg);
            }

            .chapter1-story-nav-button:hover {
                filter: brightness(1.08);
            }

            .chapter1-story-nav-button:active {
                transform:
                    translate(2px, 2px)
                    rotate(0deg);

                box-shadow: none;
            }

            .chapter1-story-nav-button:disabled {
                opacity: 0.24;
                cursor: default;
                filter: grayscale(0.65);
            }

            .chapter1-story-counter {
                min-width: 0;

                padding-bottom: 9px;

                color: var(--comic-ink);

                font-family:
                    "RM Adam Warren",
                    "RM Comic Neue",
                    sans-serif;

                font-size: 12px;
                font-weight: 900;
                letter-spacing: 0.5px;

                text-align: center;

                user-select: none;
                white-space: nowrap;
            }


            /*
            ============================================================
            PAGE TRANSITIONS — PRESERVED
            ============================================================
            */

            .chapter1-story-screen.page-exit-next {
                animation:
                    chapter1-page-exit-next
                    315ms
                    cubic-bezier(.55,.06,.74,.42)
                    forwards;

                transform-origin: left center;
            }

            .chapter1-story-screen.page-enter-next {
                animation:
                    chapter1-page-enter-next
                    365ms
                    cubic-bezier(.19,.74,.22,1)
                    forwards;

                transform-origin: right center;
            }

            .chapter1-story-screen.page-exit-back {
                animation:
                    chapter1-page-exit-back
                    315ms
                    cubic-bezier(.55,.06,.74,.42)
                    forwards;

                transform-origin: right center;
            }

            .chapter1-story-screen.page-enter-back {
                animation:
                    chapter1-page-enter-back
                    365ms
                    cubic-bezier(.19,.74,.22,1)
                    forwards;

                transform-origin: left center;
            }

            @keyframes chapter1-page-exit-next {
                0% {
                    opacity: 1;

                    transform:
                        perspective(760px)
                        translateX(0)
                        rotateY(0deg);
                }

                100% {
                    opacity: 0;

                    transform:
                        perspective(760px)
                        translateX(-48%)
                        rotateY(-17deg);
                }
            }

            @keyframes chapter1-page-enter-next {
                0% {
                    opacity: 0;

                    transform:
                        perspective(760px)
                        translateX(42%)
                        rotateY(14deg);
                }

                100% {
                    opacity: 1;

                    transform:
                        perspective(760px)
                        translateX(0)
                        rotateY(0deg);
                }
            }

            @keyframes chapter1-page-exit-back {
                0% {
                    opacity: 1;

                    transform:
                        perspective(760px)
                        translateX(0)
                        rotateY(0deg);
                }

                100% {
                    opacity: 0;

                    transform:
                        perspective(760px)
                        translateX(48%)
                        rotateY(17deg);
                }
            }

            @keyframes chapter1-page-enter-back {
                0% {
                    opacity: 0;

                    transform:
                        perspective(760px)
                        translateX(-42%)
                        rotateY(-14deg);
                }

                100% {
                    opacity: 1;

                    transform:
                        perspective(760px)
                        translateX(0)
                        rotateY(0deg);
                }
            }


            .chapter1-story-screen.dense-dialogue
            .chapter1-story-text {
                font-family:
                    "Courier New",
                    Courier,
                    monospace;

                font-size: 17px;
                line-height: 1.16;
                letter-spacing: 0;
            }

            .chapter1-story-screen.dense-dialogue
            .chapter1-story-line {
                margin-bottom: 5px;
            }


            @media (max-width: 500px) {

                .chapter1-story-masthead {
                    padding:
                        4px 6px 3px;
                }

                .chapter1-story-logo {
                    font-size: 27px;
                }

                .chapter1-story-publisher {
                    font-size: 12px;
                }

                .chapter1-story-issue {
                    height: 20px;
                    font-size: 9.2px;
                }

                .chapter1-story-image-area {
                    padding:
                        0 9px;
                }

                .chapter1-story-text-area {
                    width:
                        calc(100% - 18px);

                    margin:
                        6px 9px 4px;

                    padding:
                        12px 13px 9px;
                }

                .chapter1-story-text {
                    font-size: 18px;
                }

                .chapter1-story-screen.dense-dialogue
                .chapter1-story-text {
                    font-size: 16px;
                }

                .chapter1-story-nav {
                    flex-basis: 49px;
                    height: 49px;

                    grid-template-columns:
                        98px
                        minmax(0, 1fr)
                        98px;

                    padding:
                        2px 5px 3px;
                }

                .chapter1-story-nav-button {
                    height: 40px;
                    font-size: 18px;
                    padding:
                        1px 11px 0;
                }

                .chapter1-story-counter {
                    font-size: 11px;
                    padding-bottom: 8px;
                }
            }


            @media (
                prefers-reduced-motion:
                reduce
            ) {

                .chapter1-story-screen.page-exit-next,
                .chapter1-story-screen.page-enter-next,
                .chapter1-story-screen.page-exit-back,
                .chapter1-story-screen.page-enter-back {
                    animation-duration: 1ms;
                }

                .chapter1-story-nav-button {
                    transition: none;
                }
            }


        `;


        document.head.appendChild(
            style
        );
    },


    /*
    ================================================================
    STORY-ONLY OUTER FRAME
    ================================================================
    The normal game uses a rigid 390x780 stage with a black surround.
    That is correct for gameplay, but on some viewport aspect ratios it
    produces visible top/bottom letterboxing around this comic page.

    While Chapter 1 Story is active, keep the logical width at 390px,
    scale from the available viewport width, and expand the logical
    story-stage height to consume the available portrait height.

    Everything is restored before Chapter 1 gameplay begins.
    */
    activateStoryFrame() {

        const game =
            document.getElementById(
                "game"
            );


        if (!game) {
            return;
        }


        if (!this.storyFrameRestore) {

            this.storyFrameRestore = {

                gamePosition:
                    game.style.position,

                gameLeft:
                    game.style.left,

                gameTop:
                    game.style.top,

                gameWidth:
                    game.style.width,

                gameHeight:
                    game.style.height,

                gameTransformOrigin:
                    game.style.transformOrigin,

                gameTransform:
                    game.style.transform,

                gameOverflow:
                    game.style.overflow,

                gameBackground:
                    game.style.background,

                gameMargin:
                    game.style.margin,

                gamePadding:
                    game.style.padding,

                gameBorder:
                    game.style.border,

                gameBoxSizing:
                    game.style.boxSizing,

                htmlBackground:
                    document.documentElement.style.background,

                bodyBackground:
                    document.body.style.background,

                bodyMargin:
                    document.body.style.margin,

                bodyOverflow:
                    document.body.style.overflow

            };
        }


        const applyStoryFrame =
            () => {

                const LOGICAL_WIDTH =
                    390;


                /*
                Scale from width on portrait/mobile-like viewports.
                On wide desktop windows, cap against the normal 780
                story height so the comic doesn't become enormous.
                */
                const widthScale =
                    window.innerWidth /
                    LOGICAL_WIDTH;


                const normalHeightScale =
                    window.innerHeight /
                    780;


                const portraitLike =
                    window.innerHeight >=
                    window.innerWidth;


                const scale =
                    portraitLike
                        ? widthScale
                        : Math.min(
                            widthScale,
                            normalHeightScale
                        );


                const safeScale =
                    Math.max(
                        0.01,
                        scale
                    );


                const visibleLogicalHeight =
                    Math.max(
                        780,
                        Math.round(
                            window.innerHeight /
                            safeScale
                        )
                    );


                game.style.position =
                    "fixed";

                game.style.left =
                    "50%";

                game.style.top =
                    "50%";

                game.style.width =
                    LOGICAL_WIDTH + "px";

                game.style.height =
                    visibleLogicalHeight + "px";

                game.style.transformOrigin =
                    "center center";

                game.style.transform =
                    "translate(-50%, -50%) scale(" +
                    safeScale +
                    ")";

                game.style.overflow =
                    "hidden";

                game.style.background =
                    "#dfc987";

                game.style.margin =
                    "0";

                game.style.padding =
                    "0";

                game.style.border =
                    "0";

                game.style.boxSizing =
                    "border-box";


                document.documentElement.style.background =
                    "#dfc987";

                document.body.style.background =
                    "#dfc987";

                document.body.style.margin =
                    "0";

                document.body.style.overflow =
                    "hidden";
            };


        applyStoryFrame();


        if (this.storyFrameResizeHandler) {

            window.removeEventListener(
                "resize",
                this.storyFrameResizeHandler
            );

            window.removeEventListener(
                "orientationchange",
                this.storyFrameResizeHandler
            );
        }


        this.storyFrameResizeHandler =
            applyStoryFrame;


        window.addEventListener(
            "resize",
            this.storyFrameResizeHandler
        );


        window.addEventListener(
            "orientationchange",
            this.storyFrameResizeHandler
        );
    },


    restoreNormalGameFrame() {

        const game =
            document.getElementById(
                "game"
            );


        if (
            this.storyFrameResizeHandler
        ) {

            window.removeEventListener(
                "resize",
                this.storyFrameResizeHandler
            );

            window.removeEventListener(
                "orientationchange",
                this.storyFrameResizeHandler
            );


            this.storyFrameResizeHandler =
                null;
        }


        if (
            !game ||
            !this.storyFrameRestore
        ) {

            return;
        }


        const restore =
            this.storyFrameRestore;


        game.style.position =
            restore.gamePosition;

        game.style.left =
            restore.gameLeft;

        game.style.top =
            restore.gameTop;

        game.style.width =
            restore.gameWidth;

        game.style.height =
            restore.gameHeight;

        game.style.transformOrigin =
            restore.gameTransformOrigin;

        game.style.transform =
            restore.gameTransform;

        game.style.overflow =
            restore.gameOverflow;

        game.style.background =
            restore.gameBackground;

        game.style.margin =
            restore.gameMargin;

        game.style.padding =
            restore.gamePadding;

        game.style.border =
            restore.gameBorder;

        game.style.boxSizing =
            restore.gameBoxSizing;


        document.documentElement.style.background =
            restore.htmlBackground;

        document.body.style.background =
            restore.bodyBackground;

        document.body.style.margin =
            restore.bodyMargin;

        document.body.style.overflow =
            restore.bodyOverflow;


        this.storyFrameRestore =
            null;


        /*
        Re-run the normal shared 390x780 frame immediately.
        The shared frame's resize listener is still installed.
        Dispatching resize restores the canonical gameplay geometry
        before chapter1Gameplay.start() renders.
        */
        window.dispatchEvent(
            new Event(
                "resize"
            )
        );
    },


    startMusic() {

        if (!this.storyMusic) {

            this.storyMusic =
                new Audio(
                    this.music
                );


            this.storyMusic.loop =
                true;


            this.storyMusic.volume =
                0.6;
        }


        this.storyMusic.currentTime =
            0;


        this.storyMusic
            .play()
            .catch(
                (error) => {

                    console.warn(
                        "chapter1 story music could not start:",
                        error
                    );

                }
            );
    },


    /*
    UI CLICK SFX

    Story-card Back/Next navigation only -- short, responsive,
    plays immediately on press without delaying the nav action
    itself. A single reused instance is fine since these presses
    are never rapid-fire/overlapping.
    */
    playUiClickSound() {

        try {

            if (!this.uiClickEl) {

                this.uiClickEl =
                    new Audio(this.uiClick);
            }

            this.uiClickEl.currentTime = 0;

            this.uiClickEl
                .play()
                .catch(() => {});

        } catch (error) {
            // ignore
        }
    },


    showCard(transitionDirection = null) {

        const game =
            document.getElementById(
                "game"
            );


        if (!game) {

            console.error(
                "chapter1-story: #game element not found"
            );

            return;
        }


        const card =
            this.cards[
                this.currentCard
            ];


        if (!card) {

            console.error(
                "chapter1-story: card not found"
            );

            return;
        }


        game.innerHTML = "";


        const screen =
            document.createElement(
                "div"
            );


        screen.className =
            "chapter1-story-screen";


        if (
            card.lines.length >= 4
        ) {

            screen.classList.add(
                "dense-dialogue"
            );
        }


        /*
        COMIC MASTHEAD
        */

        const masthead =
            document.createElement(
                "div"
            );


        masthead.className =
            "chapter1-story-masthead";


        masthead.innerHTML = `
            <div class="chapter1-story-masthead-top">
                <div class="chapter1-story-logo">
                    RECOVERY MISFITS
                </div>

                <div class="chapter1-story-publisher">
                    — RULE 62 COMICS — FREE
                </div>
            </div>

            <div class="chapter1-story-issue">
                HALLOWEEN EDITION&nbsp;&nbsp;•&nbsp;&nbsp;VOL. 417&nbsp;&nbsp;•&nbsp;&nbsp;NO. 69
            </div>
        `;


        /*
        IMAGE AREA
        */

        const imageArea =
            document.createElement(
                "div"
            );


        imageArea.className =
            "chapter1-story-image-area";


        const imageFrame =
            document.createElement(
                "div"
            );


        imageFrame.className =
            "chapter1-story-image-frame";


        const image =
            document.createElement(
                "img"
            );


        image.className =
            "chapter1-story-image";


        image.src =
            card.image;


        image.alt =
            "Recovery Misfits story panel";


        image.onerror = () => {

            image.remove();


            const placeholder =
                document.createElement(
                    "div"
                );


            placeholder.className =
                "chapter1-story-placeholder";


            placeholder.innerHTML = `
                COMIC PANEL ${this.currentCard + 1}
                <br><br>
                ${card.image}
            `;


            imageFrame.appendChild(
                placeholder
            );
        };


        imageFrame.appendChild(
            image
        );


        imageArea.appendChild(
            imageFrame
        );


        /*
        TEXT AREA
        */

        const textArea =
            document.createElement(
                "div"
            );


        textArea.className =
            "chapter1-story-text-area";


        const text =
            document.createElement(
                "div"
            );


        text.className =
            "chapter1-story-text";


        card.lines.forEach(
            (line, lineIndex) => {

                const paragraph =
                    document.createElement(
                        "p"
                    );


                paragraph.className =
                    "chapter1-story-line";


                if (
                    Array.isArray(card.indentLines) &&
                    card.indentLines.includes(lineIndex)
                ) {
                    paragraph.classList.add(
                        "dialogue-indent"
                    );
                }


                paragraph.textContent =
                    line;


                text.appendChild(
                    paragraph
                );

            }
        );


        textArea.appendChild(
            text
        );


        /*
        NAVIGATION
        */

        const nav =
            document.createElement(
                "div"
            );


        nav.className =
            "chapter1-story-nav";


        const backButton =
            document.createElement(
                "button"
            );


        backButton.className =
            "chapter1-story-nav-button";


        backButton.type =
            "button";


        backButton.innerHTML =
            "← Back";


        backButton.disabled =
            this.currentCard === 0;


        backButton.addEventListener(
            "click",
            () => {

                this.playUiClickSound();

                this.previousCard();

            }
        );


        const counter =
            document.createElement(
                "div"
            );


        counter.className =
            "chapter1-story-counter";


        counter.textContent =
            `CARD ${this.currentCard + 1} OF ${this.cards.length}`;


        const nextButton =
            document.createElement(
                "button"
            );


        nextButton.className =
            "chapter1-story-nav-button";


        nextButton.type =
            "button";


        if (
            this.currentCard ===
            this.cards.length - 1
        ) {

            nextButton.innerHTML =
                "Next →";

        } else {

            nextButton.innerHTML =
                "Next →";

        }


        nextButton.addEventListener(
            "click",
            () => {

                this.playUiClickSound();

                this.nextCard();

            }
        );


        nav.appendChild(
            backButton
        );


        nav.appendChild(
            counter
        );


        nav.appendChild(
            nextButton
        );


        /*
        BUILD SCREEN
        */

        screen.appendChild(
            masthead
        );


        screen.appendChild(
            imageArea
        );


        screen.appendChild(
            textArea
        );


        screen.appendChild(
            nav
        );


        game.appendChild(
            screen
        );


        if (
            transitionDirection === "next"
        ) {

            screen.classList.add(
                "page-enter-next"
            );

        } else if (
            transitionDirection === "back"
        ) {

            screen.classList.add(
                "page-enter-back"
            );
        }
    },


    previousCard() {

        if (
            this.currentCard <= 0
        ) {
            return;
        }


        const screen =
            document.querySelector(
                ".chapter1-story-screen"
            );


        if (screen) {

            screen.classList.add(
                "page-exit-back"
            );


            setTimeout(
                () => {

                    this.currentCard--;

                    this.showCard(
                        "back"
                    );

                },
                300
            );


            return;
        }


        this.currentCard--;

        this.showCard(
            "back"
        );
    },


    nextCard() {

        if (
            this.currentCard <
            this.cards.length - 1
        ) {

            const screen =
                document.querySelector(
                    ".chapter1-story-screen"
                );


            if (screen) {

                screen.classList.add(
                    "page-exit-next"
                );


                setTimeout(
                    () => {

                        this.currentCard++;

                        this.showCard(
                            "next"
                        );

                    },
                    300
                );


                return;
            }


            this.currentCard++;

            this.showCard(
                "next"
            );


            return;
        }


        this.finish();
    },


    finish() {

        console.log(
            "chapter1-story complete"
        );


        this.fadeOutMusic(
            1000
        );


        this.restoreNormalGameFrame();


        /*
        NEXT STEP:

        Level 1 gameplay will start here.

        When chapter1-gameplay.js exists,
        we will hand control to it here.
        */

        if (
            window.HalloweenGame &&
            window.HalloweenGame.chapter1Gameplay &&
            typeof window.HalloweenGame
                .chapter1Gameplay.start ===
                "function"
        ) {

            setTimeout(
                () => {

                    window.HalloweenGame
                        .chapter1Gameplay
                        .start();

                },
                1050
            );


            return;
        }


        console.log(
            "chapter1-gameplay.js not connected yet"
        );
    },


    fadeOutMusic(duration) {

        if (!this.storyMusic) {
            return;
        }


        const audio =
            this.storyMusic;


        const startingVolume =
            audio.volume;


        const steps =
            20;


        const interval =
            duration / steps;


        let step =
            0;


        const fade =
            setInterval(
                () => {

                    step++;


                    const percent =
                        step / steps;


                    audio.volume =
                        Math.max(
                            0,
                            startingVolume *
                            (1 - percent)
                        );


                    if (
                        step >= steps
                    ) {

                        clearInterval(
                            fade
                        );


                        audio.pause();


                        audio.currentTime =
                            0;


                        audio.volume =
                            startingVolume;
                    }

                },
                interval
            );
    }

};