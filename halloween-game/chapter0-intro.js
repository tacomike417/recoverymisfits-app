/*
chapter0-intro.js
Recovery Misfits Halloween Game

TITLE ASSETS

assets/title/chapter0-intro-1.png
assets/title/chapter0-intro-2.png
assets/title/chapter0-intro-3.png
assets/title/chapter0-intro-4.png

AUDIO

assets/audio/chapter0-intro-music.mp3
assets/audio/chapter0-intro-splash.mp3
assets/audio/thud.mp3
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

window.HalloweenGame.chapter0Intro = {

    name: "chapter0-intro",

    cards: [
        { image: "assets/title/chapter0-intro-1.png" },
        { image: "assets/title/chapter0-intro-2.png" },
        { image: "assets/title/chapter0-intro-3.png" },
        { image: "assets/title/chapter0-intro-4.png" }
    ],

    music: "assets/audio/chapter0-intro-music.mp3",
    splashAudio: "assets/audio/chapter0-intro-splash.mp3",
    thud: "assets/audio/thud.mp3",
    uiClick: "assets/audio/click.mp3",

    mainMusic: null,
    uiClickEl: null,

    /*
    DEVELOPMENT MENU

    Set this to false before release to hide the DEV box completely.
    */
    devMode: true,

    titleCards: [
        {
            text:
                "For reasons nobody completely understands...<br><br>" +
                "Our two old friends were given twenty-four hours back on Earth.",
            duration: 7000
        },
        {
            text:
                "There were probably better days to choose.<br><br>" +
                "They got Halloween.",
            duration: 5500
        },
        {
            text:
                "They didn't know the world had changed.<br><br>" +
                "They thought they'd find a few meetings still left.",
            duration: 6500
        },
        {
            text:
                "What they did not expect...<br><br>" +
                "was millions of people trudging the same road.",
            duration: 6500
        },
        {
            text:
                "And so began one completely unnecessary 24 hours...<br><br>" +
                "back among the living.",
            duration: 6500
        }
    ],

    currentTitleCard: 0,
    titleCardTimer: null,
    titleCardStartedAt: 0,
    titleCardRemaining: 0,
    titleSequencePaused: false,
    titleTransitioning: false,


    start() {

        console.log("chapter0-intro starting");

        this.injectStyles();
        this.showOpeningScreen();
    },


    injectStyles() {

        if (document.getElementById("chapter0-intro-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "chapter0-intro-styles";

        style.textContent = `

            @keyframes orangeButtonBlink {

                0%, 55% {
                    opacity: 1;
                }

                56%, 100% {
                    opacity: 0.35;
                }
            }


            @keyframes whiteButtonBlink {

                0%, 55% {
                    opacity: 1;
                }

                56%, 100% {
                    opacity: 0.35;
                }
            }


            @keyframes rejectShake {

                0% {
                    transform: translateX(0);
                }

                20% {
                    transform: translateX(-8px);
                }

                40% {
                    transform: translateX(8px);
                }

                60% {
                    transform: translateX(-6px);
                }

                80% {
                    transform: translateX(6px);
                }

                100% {
                    transform: translateX(0);
                }
            }


            @keyframes filmTextJitter {

                0% {
                    transform:
                        translate(0px, 0px)
                        rotate(0deg);
                }

                12% {
                    transform:
                        translate(0.7px, -0.5px)
                        rotate(-0.03deg);
                }

                27% {
                    transform:
                        translate(-0.8px, 0.3px)
                        rotate(0.03deg);
                }

                43% {
                    transform:
                        translate(0.4px, 0.8px)
                        rotate(0deg);
                }

                61% {
                    transform:
                        translate(-0.5px, -0.6px)
                        rotate(-0.02deg);
                }

                79% {
                    transform:
                        translate(0.8px, 0.2px)
                        rotate(0.02deg);
                }

                100% {
                    transform:
                        translate(0px, 0px)
                        rotate(0deg);
                }
            }


            @keyframes filmFlicker {

                0% {
                    opacity: 0.08;
                }

                14% {
                    opacity: 0.13;
                }

                31% {
                    opacity: 0.09;
                }

                47% {
                    opacity: 0.15;
                }

                66% {
                    opacity: 0.10;
                }

                83% {
                    opacity: 0.14;
                }

                100% {
                    opacity: 0.08;
                }
            }


            @keyframes filmFrameDrift {

                0% {
                    transform: translateY(0);
                }

                19% {
                    transform: translateY(0);
                }

                20% {
                    transform: translateY(-1px);
                }

                22% {
                    transform: translateY(0);
                }

                54% {
                    transform: translateY(0);
                }

                55% {
                    transform: translateY(1px);
                }

                57% {
                    transform: translateY(0);
                }

                83% {
                    transform: translateY(0);
                }

                84% {
                    transform: translateY(-1px);
                }

                86% {
                    transform: translateY(0);
                }

                100% {
                    transform: translateY(0);
                }
            }


            @keyframes scratchMove {

                0% {
                    left: 17%;
                    opacity: 0;
                }

                18% {
                    opacity: 0;
                }

                20% {
                    opacity: 0.10;
                }

                23% {
                    opacity: 0;
                }

                49% {
                    left: 71%;
                    opacity: 0;
                }

                51% {
                    opacity: 0.08;
                }

                54% {
                    opacity: 0;
                }

                100% {
                    left: 42%;
                    opacity: 0;
                }
            }


            .chapter0-screen {

                position: relative;

                width: 100%;
                height: 100%;

                background: #000;

                display: flex;

                align-items: center;
                justify-content: center;

                overflow: hidden;
            }


            .chapter0-image {

                width: 100%;
                height: 100%;

                object-fit: contain;

                display: block;
            }


            .chapter0-controls {

                position: absolute;

                left: 50%;
                bottom: 1.5%;

                transform: translateX(-50%);

                width: 88%;
                max-width: 390px;

                text-align: center;

                font-family: Arial, sans-serif;

                color: #fff;
            }


            .chapter0-rule62-label {

                display: flex;

                align-items: center;
                justify-content: center;

                gap: 8px;

                margin-bottom: 10px;

                font-size: 16px;
                font-weight: bold;

                color: #fff;

                text-shadow:
                    2px 2px 3px #000;

                cursor: pointer;

                user-select: none;
            }


            #rule62-check {

                width: 21px;
                height: 21px;

                cursor: pointer;

                accent-color: #f7941d;
            }


            #lets-play-button {

                width: 100%;

                padding: 13px 18px;

                background: #050505;

                border: 4px solid #f7941d;

                border-radius: 4px;

                color: #f7941d;

                font-size: 22px;

                font-weight: 900;

                letter-spacing: 1px;

                cursor: pointer;

                box-shadow:
                    0 0 0 2px #000,
                    0 0 12px rgba(247,148,29,0.45);

                text-shadow:
                    2px 2px 0 #000;

                animation:
                    orangeButtonBlink
                    1.1s
                    steps(1,end)
                    infinite;
            }


            #lets-play-button.rejecting {

                animation:
                    rejectShake
                    300ms
                    linear;
            }


            /*
            DEVELOPMENT BOX

            Small, intentionally plain control used while building/testing.
            Set devMode to false above to remove it from the opening screen.
            */

            .chapter0-dev-box {

                position: absolute;

                z-index: 50;

                top: 10px;
                right: 10px;

                width: 150px;

                box-sizing: border-box;

                padding: 8px;

                background:
                    rgba(0,0,0,0.82);

                border:
                    1px solid
                    rgba(255,255,255,0.35);

                border-radius: 4px;

                font-family:
                    Arial,
                    sans-serif;

                color: #fff;

                text-align: left;
            }


            .chapter0-dev-title {

                margin-bottom: 6px;

                color: #f7941d;

                font-size: 10px;

                font-weight: 900;

                letter-spacing: 1.2px;

                text-transform: uppercase;
            }


            .chapter0-dev-button {

                width: 100%;

                box-sizing: border-box;

                margin-top: 5px;

                padding: 7px 6px;

                border:
                    1px solid
                    rgba(255,255,255,0.55);

                border-radius: 3px;

                background: #151515;

                color: #fff;

                font-family:
                    Arial,
                    sans-serif;

                font-size: 10px;

                font-weight: 800;

                letter-spacing: 0.5px;

                cursor: pointer;
            }


            .chapter0-dev-button:hover {

                background: #242424;
            }


            .chapter0-dev-button:active {

                transform:
                    translateY(1px);
            }


            .chapter0-dev-button.level1 {

                border-color:
                    #f7941d;

                color:
                    #f7941d;
            }


            @media (max-width: 600px) {

                .chapter0-dev-box {

                    top: 6px;
                    right: 6px;

                    width: 138px;

                    padding: 6px;
                }


                .chapter0-dev-button {

                    padding: 6px 5px;

                    font-size: 9px;
                }

            }


            .chapter0-story-controls {

                position: absolute;

                left: 50%;
                bottom: 3%;

                transform: translateX(-50%);

                width: 86%;
                max-width: 390px;

                text-align: center;
            }


            #start-story-button {

                width: 100%;

                padding: 15px 18px;

                background: #000;

                border: 4px solid #fff;

                border-radius: 4px;

                color: #fff;

                font-family: Arial, sans-serif;

                font-size: 20px;

                font-weight: 900;

                letter-spacing: 1.5px;

                cursor: pointer;

                box-shadow:
                    0 0 0 2px #000,
                    0 0 10px rgba(255,255,255,0.35);

                text-shadow:
                    2px 2px 0 #000;

                animation:
                    whiteButtonBlink
                    1.1s
                    steps(1,end)
                    infinite;
            }


            #start-story-button:active {

                transform: translateY(2px);
            }


            .silent-film-screen {

                position: relative;

                width: 100%;
                height: 100%;

                background: #000;

                overflow: hidden;

                display: flex;

                align-items: center;
                justify-content: center;

                opacity: 0;

                transition:
                    opacity 650ms ease;
            }


            .silent-film-background {

                position: absolute;

                inset: 0;

                width: 100%;
                height: 100%;

                object-fit: contain;

                display: block;

                animation:
                    filmFrameDrift
                    3.2s
                    linear
                    infinite;
            }


            .silent-film-darkener {

                position: absolute;

                inset: 0;

                background:
                    rgba(0,0,0,0.13);

                pointer-events: none;
            }


            .silent-film-static {

                position: absolute;

                inset: 0;

                pointer-events: none;

                opacity: 0.10;

                background-image:

                    repeating-linear-gradient(
                        0deg,
                        rgba(255,255,255,0.035) 0px,
                        rgba(255,255,255,0.035) 1px,
                        transparent 1px,
                        transparent 4px
                    );

                animation:
                    filmFlicker
                    1.25s
                    linear
                    infinite;
            }


            .silent-film-scratch {

                position: absolute;

                top: 0;
                bottom: 0;

                left: 35%;

                width: 1px;

                background:
                    rgba(255,245,215,0.18);

                pointer-events: none;

                animation:
                    scratchMove
                    6.5s
                    linear
                    infinite;
            }


            .silent-film-text-wrap {

                position: relative;

                z-index: 5;

                width: 78%;

                max-width: 780px;

                text-align: center;

                padding: 28px 20px;
            }


            .silent-film-text {

                color: #f2e4c1;

                font-family:
                    Georgia,
                    "Times New Roman",
                    serif;

                font-size:
                    clamp(
                        30px,
                        5vw,
                        56px
                    );

                line-height: 1.28;

                font-weight: 700;

                letter-spacing: 0.4px;

                text-shadow:
                    2px 2px 0 #000,
                    -1px -1px 0 #000;

                animation:
                    filmTextJitter
                    0.85s
                    steps(2,end)
                    infinite;
            }


            /*
            BOTTOM CONTROL BAR
            */

            .silent-film-restart {

                position: absolute;

                z-index: 10;

                left: 14px;
                bottom: 14px;

                padding:
                    8px 10px;

                border:
                    1px solid
                    rgba(242,228,193,0.65);

                border-radius: 3px;

                background:
                    rgba(0,0,0,0.78);

                color: #f2e4c1;

                font-family:
                    Georgia,
                    "Times New Roman",
                    serif;

                font-size: 11px;

                font-weight: 700;

                letter-spacing: 0.5px;

                cursor: pointer;

                opacity: 0.72;

                text-transform: uppercase;
            }


            .silent-film-restart:hover {

                opacity: 1;
            }


            .silent-film-restart:active {

                transform:
                    translateY(1px);
            }


            .silent-film-pause {

                position: absolute;

                z-index: 10;

                right: 18px;
                bottom: 18px;

                width: 46px;
                height: 46px;

                display: flex;

                align-items: center;
                justify-content: center;

                border:
                    2px solid
                    rgba(242,228,193,0.8);

                border-radius: 50%;

                background:
                    rgba(0,0,0,0.78);

                color: #f2e4c1;

                font-size: 18px;

                cursor: pointer;

                opacity: 0.78;
            }


            .silent-film-pause:hover {

                opacity: 1;
            }


            .silent-film-screen.paused
            .silent-film-background,

            .silent-film-screen.paused
            .silent-film-static,

            .silent-film-screen.paused
            .silent-film-scratch,

            .silent-film-screen.paused
            .silent-film-text {

                animation-play-state:
                    paused;
            }


            @media (max-width: 600px) {

                .silent-film-text-wrap {

                    width: 80%;

                    padding:
                        18px 12px;
                }


                .silent-film-text {

                    font-size:
                        clamp(
                            28px,
                            7vw,
                            42px
                        );

                    line-height: 1.25;
                }


                .silent-film-pause {

                    right: 12px;
                    bottom: 12px;

                    width: 42px;
                    height: 42px;
                }


                .silent-film-restart {

                    left: 10px;
                    bottom: 12px;

                    padding:
                        7px 8px;

                    font-size: 9px;
                }
            }

        `;

        document.head.appendChild(style);
    },


    showOpeningScreen() {

        const game =
            document.getElementById("game");

        if (!game) {

            console.error(
                "chapter0-intro: #game element not found"
            );

            return;
        }

        game.innerHTML = "";

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "chapter0-screen";


        const img =
            document.createElement("img");

        img.className =
            "chapter0-image";

        img.src =
            this.cards[0].image;

        img.alt =
            "A Totally Unnecessary Halloween Game";


        const controls =
            document.createElement("div");

        controls.className =
            "chapter0-controls";


        controls.innerHTML = `

            <label class="chapter0-rule62-label">

                <input
                    id="rule62-check"
                    type="checkbox"
                >

                <span>
                    I understand Rule 62
                </span>

            </label>


            <button
                id="lets-play-button"
                type="button"
            >

                ▶ &nbsp;
                LET'S PLAY!
                &nbsp; ◀

            </button>

        `;


        wrapper.appendChild(img);
        wrapper.appendChild(controls);


        /*
        DEVELOPMENT BOX

        PLAY NORMAL simply hides the dev box and leaves the normal
        Rule 62 / LET'S PLAY flow untouched.

        JUMP TO GAMEPLAY skips directly to chapter1Gameplay.start().
        */

        if (this.devMode) {

            const devBox =
                document.createElement("div");

            devBox.className =
                "chapter0-dev-box";

            devBox.innerHTML = `

                <div class="chapter0-dev-title">
                    DEV MODE
                </div>

                <button
                    class="chapter0-dev-button"
                    id="dev-play-normal"
                    type="button"
                >
                    PLAY NORMAL
                </button>

                <button
                    class="chapter0-dev-button level1"
                    id="dev-jump-level1"
                    type="button"
                >
                    JUMP TO GAMEPLAY
                </button>

            `;

            wrapper.appendChild(devBox);
        }


        game.appendChild(wrapper);


        if (this.devMode) {

            const playNormalButton =
                document.getElementById(
                    "dev-play-normal"
                );

            const jumpLevel1Button =
                document.getElementById(
                    "dev-jump-level1"
                );


            if (playNormalButton) {

                playNormalButton.addEventListener(
                    "click",
                    () => {

                        const devBox =
                            document.querySelector(
                                ".chapter0-dev-box"
                            );

                        if (devBox) {
                            devBox.remove();
                        }

                    }
                );
            }


            if (jumpLevel1Button) {

                jumpLevel1Button.addEventListener(
                    "click",
                    () => {

                        this.jumpDirectlyToGameplay();

                    }
                );
            }
        }


        const button =
            document.getElementById(
                "lets-play-button"
            );


        button.addEventListener(
            "click",
            () => {

                this.playUiClickSound();

                this.tryToPlay();

            }
        );
    },


    jumpDirectlyToGameplay() {

        console.log(
            "DEV MODE: jumping directly to Level 1 gameplay."
        );


        /*
        Stop/reset anything from the intro that may already exist.
        This is intentionally defensive so the dev jump remains safe
        even if it is used after more intro features are added later.
        */

        clearTimeout(
            this.titleCardTimer
        );


        this.titleSequencePaused =
            false;

        this.titleTransitioning =
            false;


        if (this.mainMusic) {

            try {

                this.mainMusic.pause();

                this.mainMusic.currentTime =
                    0;

            } catch (error) {

                console.warn(
                    "DEV MODE: could not stop intro music cleanly.",
                    error
                );
            }
        }


        const game =
            document.getElementById(
                "game"
            );


        if (game) {

            game.innerHTML = "";
        }


        if (
            window.HalloweenGame &&
            window.HalloweenGame.chapter1Gameplay &&
            typeof window.HalloweenGame
                .chapter1Gameplay
                .start ===
                "function"
        ) {

            window.HalloweenGame
                .chapter1Gameplay
                .start();


            return;
        }


        console.error(
            "DEV MODE: chapter1-gameplay.js is not ready."
        );
    },


    /*
    UI CLICK SFX

    Intro/game-entry and story-navigation presses only (LET'S PLAY,
    START THE STORY, START STORY OVER, the silent-film play/pause
    toggle) -- short, responsive, plays immediately on press without
    delaying the action attached to that button. A single reused
    instance is fine since these presses are never rapid-fire/overlapping.
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


    tryToPlay() {

        const checkbox =
            document.getElementById(
                "rule62-check"
            );


        if (
            !checkbox ||
            !checkbox.checked
        ) {

            this.rejectPlay();

            return;
        }


        this.beginGame();
    },


    rejectPlay() {

        const thud =
            new Audio(this.thud);


        thud.volume = 0.9;


        thud
            .play()
            .catch(() => {});


        if ("vibrate" in navigator) {

            navigator.vibrate(
                [100,50,150]
            );
        }


        const button =
            document.getElementById(
                "lets-play-button"
            );


        if (!button) {
            return;
        }


        button.classList.remove(
            "rejecting"
        );


        void button.offsetWidth;


        button.classList.add(
            "rejecting"
        );


        setTimeout(
            () => {

                button.classList.remove(
                    "rejecting"
                );

            },
            320
        );
    },


    beginGame() {

        console.log(
            "Rule 62 understood. Starting game."
        );

        this.showRecoveryMisfitsSplash();
    },


    showRecoveryMisfitsSplash() {

        const game =
            document.getElementById("game");


        if (!game) {
            return;
        }


        game.innerHTML = "";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            "chapter0-screen";


        wrapper.style.opacity = "0";


        wrapper.style.transition =
            "opacity 500ms ease";


        const img =
            document.createElement("img");


        img.className =
            "chapter0-image";


        img.src =
            this.cards[1].image;


        img.alt =
            "Recovery Misfits Presents";


        wrapper.appendChild(img);


        game.appendChild(wrapper);


        const splashSound =
            new Audio(
                this.splashAudio
            );


        splashSound.volume = 1;


        const startSplash = () => {

            requestAnimationFrame(
                () => {

                    wrapper.style.opacity =
                        "1";

                }
            );


            splashSound
                .play()
                .catch(() => {});


            setTimeout(
                () => {

                    wrapper.style.opacity =
                        "0";

                },
                2188
            );


            setTimeout(
                () => {

                    this.showMainTitleScreen();

                },
                2688
            );
        };


        if (img.complete) {

            startSplash();

        } else {

            img.onload =
                startSplash;
        }
    },


    showMainTitleScreen() {

        const game =
            document.getElementById("game");


        if (!game) {
            return;
        }


        game.innerHTML = "";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            "chapter0-screen";


        wrapper.style.opacity = "0";


        wrapper.style.transition =
            "opacity 500ms ease";


        const img =
            document.createElement("img");


        img.className =
            "chapter0-image";


        img.src =
            this.cards[2].image;


        img.alt =
            "A Very Unnecessary Halloween Game";


        const controls =
            document.createElement("div");


        controls.className =
            "chapter0-story-controls";


        controls.innerHTML = `

            <button
                id="start-story-button"
                type="button"
            >

                ▶ &nbsp;
                START THE STORY
                &nbsp; ◀

            </button>

        `;


        wrapper.appendChild(img);

        wrapper.appendChild(controls);

        game.appendChild(wrapper);


        const showScreen = () => {

            requestAnimationFrame(
                () => {

                    wrapper.style.opacity =
                        "1";

                }
            );
        };


        if (img.complete) {

            showScreen();

        } else {

            img.onload =
                showScreen;
        }


        const button =
            document.getElementById(
                "start-story-button"
            );


        button.addEventListener(
            "click",
            () => {

                this.playUiClickSound();

                this.startStory();

            }
        );
    },


    startStory() {

        console.log(
            "Starting silent-film story sequence"
        );


        const button =
            document.getElementById(
                "start-story-button"
            );


        if (button) {

            button.style.animation =
                "none";
        }


        this.startIntroMusic();


        const game =
            document.getElementById("game");


        if (!game) {
            return;
        }


        const currentScreen =
            game.firstElementChild;


        if (currentScreen) {

            currentScreen.style.transition =
                "opacity 600ms ease";


            currentScreen.style.opacity =
                "0";
        }


        setTimeout(
            () => {

                this.currentTitleCard = 0;

                this.titleSequencePaused =
                    false;

                this.titleTransitioning =
                    false;


                this.showSilentFilmCard();

            },
            650
        );
    },


    startIntroMusic() {

        if (!this.mainMusic) {

            this.mainMusic =
                new Audio(this.music);


            this.mainMusic.loop =
                true;


            this.mainMusic.volume =
                0.65;
        }


        this.mainMusic.currentTime = 0;


        this.mainMusic
            .play()
            .catch(
                (error) => {

                    console.warn(
                        "chapter0-intro music could not play:",
                        error
                    );
                }
            );
    },


    showSilentFilmCard() {

        const game =
            document.getElementById("game");


        if (!game) {
            return;
        }


        const card =
            this.titleCards[
                this.currentTitleCard
            ];


        if (!card) {

            this.finishTitleSequence();

            return;
        }


        game.innerHTML = "";


        const screen =
            document.createElement("div");


        screen.className =
            "silent-film-screen";


        screen.id =
            "silent-film-screen";


        const background =
            document.createElement("img");


        background.className =
            "silent-film-background";


        background.src =
            this.cards[3].image;


        background.alt =
            "Silent film Halloween story";


        const darkener =
            document.createElement("div");


        darkener.className =
            "silent-film-darkener";


        const staticLayer =
            document.createElement("div");


        staticLayer.className =
            "silent-film-static";


        const scratch =
            document.createElement("div");


        scratch.className =
            "silent-film-scratch";


        const textWrap =
            document.createElement("div");


        textWrap.className =
            "silent-film-text-wrap";


        const text =
            document.createElement("div");


        text.className =
            "silent-film-text";


        text.innerHTML =
            card.text;


        textWrap.appendChild(text);


        /*
        START STORY OVER
        */

        const restartButton =
            document.createElement("button");


        restartButton.className =
            "silent-film-restart";


        restartButton.type =
            "button";


        restartButton.innerHTML =
            "↶ START STORY OVER";


        restartButton.setAttribute(
            "aria-label",
            "Start story over"
        );


        restartButton.addEventListener(
            "click",
            () => {

                this.playUiClickSound();

                this.restartTitleSequence();

            }
        );


        /*
        PLAY / PAUSE
        */

        const pauseButton =
            document.createElement("button");


        pauseButton.className =
            "silent-film-pause";


        pauseButton.type =
            "button";


        pauseButton.setAttribute(
            "aria-label",
            "Pause story"
        );


        pauseButton.innerHTML =
            "Ⅱ";


        pauseButton.addEventListener(
            "click",
            () => {

                this.playUiClickSound();

                this.toggleTitlePause();

            }
        );


        screen.appendChild(background);

        screen.appendChild(darkener);

        screen.appendChild(staticLayer);

        screen.appendChild(scratch);

        screen.appendChild(textWrap);

        screen.appendChild(restartButton);

        screen.appendChild(pauseButton);


        game.appendChild(screen);


        const startCard = () => {

            requestAnimationFrame(
                () => {

                    screen.style.opacity =
                        "1";

                }
            );


            this.startTitleCardTimer(
                card.duration
            );
        };


        if (background.complete) {

            startCard();

        } else {

            background.onload =
                startCard;
        }
    },


    startTitleCardTimer(duration) {

        clearTimeout(
            this.titleCardTimer
        );


        this.titleCardRemaining =
            duration;


        this.titleCardStartedAt =
            performance.now();


        this.titleCardTimer =
            setTimeout(
                () => {

                    this.advanceTitleCard();

                },
                duration
            );
    },


    advanceTitleCard() {

        if (
            this.titleSequencePaused ||
            this.titleTransitioning
        ) {

            return;
        }


        this.titleTransitioning = true;


        const screen =
            document.getElementById(
                "silent-film-screen"
            );


        if (!screen) {
            return;
        }


        screen.style.opacity = "0";


        setTimeout(
            () => {

                this.currentTitleCard++;


                this.titleTransitioning =
                    false;


                if (
                    this.currentTitleCard >=
                    this.titleCards.length
                ) {

                    this.finishTitleSequence();

                    return;
                }


                this.showSilentFilmCard();

            },
            700
        );
    },


    /*
    RESTART SILENT-FILM STORY

    Goes back to Card 1.

    Music restarts from beginning.
    */

    restartTitleSequence() {

        console.log(
            "Restarting title-card story"
        );


        clearTimeout(
            this.titleCardTimer
        );


        this.currentTitleCard = 0;

        this.titleSequencePaused =
            false;

        this.titleTransitioning =
            false;


        if (this.mainMusic) {

            this.mainMusic.pause();

            this.mainMusic.currentTime =
                0;

            this.mainMusic.volume =
                0.65;


            this.mainMusic
                .play()
                .catch(
                    (error) => {

                        console.warn(
                            "Could not restart intro music:",
                            error
                        );
                    }
                );
        }


        const screen =
            document.getElementById(
                "silent-film-screen"
            );


        if (screen) {

            screen.classList.remove(
                "paused"
            );


            screen.style.transition =
                "opacity 350ms ease";


            screen.style.opacity =
                "0";


            setTimeout(
                () => {

                    this.showSilentFilmCard();

                },
                375
            );


            return;
        }


        this.showSilentFilmCard();
    },


    toggleTitlePause() {

        const screen =
            document.getElementById(
                "silent-film-screen"
            );


        const pauseButton =
            document.querySelector(
                ".silent-film-pause"
            );


        if (!screen) {
            return;
        }


        /*
        PAUSE
        */

        if (!this.titleSequencePaused) {

            this.titleSequencePaused =
                true;


            clearTimeout(
                this.titleCardTimer
            );


            const elapsed =
                performance.now() -
                this.titleCardStartedAt;


            this.titleCardRemaining =
                Math.max(
                    0,
                    this.titleCardRemaining -
                    elapsed
                );


            screen.classList.add(
                "paused"
            );


            if (
                this.mainMusic &&
                !this.mainMusic.paused
            ) {

                this.mainMusic.pause();
            }


            if (pauseButton) {

                pauseButton.innerHTML =
                    "▶";


                pauseButton.setAttribute(
                    "aria-label",
                    "Resume story"
                );
            }


            return;
        }


        /*
        RESUME
        */

        this.titleSequencePaused =
            false;


        screen.classList.remove(
            "paused"
        );


        if (this.mainMusic) {

            this.mainMusic
                .play()
                .catch(
                    (error) => {

                        console.warn(
                            "Could not resume intro music:",
                            error
                        );
                    }
                );
        }


        if (pauseButton) {

            pauseButton.innerHTML =
                "Ⅱ";


            pauseButton.setAttribute(
                "aria-label",
                "Pause story"
            );
        }


        this.startTitleCardTimer(
            this.titleCardRemaining
        );
    },


    finishTitleSequence() {

        clearTimeout(
            this.titleCardTimer
        );


        const game =
            document.getElementById("game");


        if (!game) {
            return;
        }


        const screen =
            game.firstElementChild;


        if (screen) {

            screen.style.transition =
                "opacity 900ms ease";


            screen.style.opacity =
                "0";
        }


        this.fadeOutIntroMusic(
            1800
        );


        setTimeout(
            () => {

                game.innerHTML = "";

                this.handoffToChapter1();

            },
            1900
        );
    },


    fadeOutIntroMusic(duration) {

        if (!this.mainMusic) {
            return;
        }


        const audio =
            this.mainMusic;


        const startingVolume =
            audio.volume;


        const steps = 30;

        const interval =
            duration / steps;


        let step = 0;


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


                    if (step >= steps) {

                        clearInterval(fade);


                        audio.pause();


                        audio.currentTime = 0;


                        audio.volume =
                            startingVolume;
                    }

                },
                interval
            );
    },


    handoffToChapter1() {

        console.log(
            "chapter0-intro complete. Starting chapter1-story."
        );


        if (
            window.HalloweenGame &&
            window.HalloweenGame.chapter1Story &&
            typeof window.HalloweenGame
                .chapter1Story
                .start ===
                "function"
        ) {

            window.HalloweenGame
                .chapter1Story
                .start();


            return;
        }


        console.error(
            "chapter1-story.js is not ready."
        );
    }

};