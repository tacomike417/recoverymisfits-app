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

window.HalloweenGame.chapter1Story = {

    name: "chapter1-story",

    music: "assets/audio/chapter1-story-music.mp3",

    storyMusic: null,

    currentCard: 0,

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
                "“Hey... aren’t you guys...?”",
                "“Uhhhh...”"
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
                "“You guys need to see this.”"
            ]
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
                "“THIS... IS... AWESOME!”",

                "“AA is bigger than ever! There’s Cocaine Anonymous, Gamblers Anonymous... there’s even Emotions Anonymous!”",

                "“Whoa... and they’re using the Twelve Steps?”",

                "“Yeah! Isn’t it great? So many people helping people!”"
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
                // TODO - ADD STORY CARD 4 DIALOGUE
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
                // TODO - ADD STORY CARD 5 DIALOGUE
            ]
        }

    ],


    start() {

        console.log("chapter1-story starting");

        this.injectStyles();

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
            ==========================================
            CHAPTER 1 STORY CARDS
            VINTAGE COMIC PRESENTATION
            ==========================================

            Design rule:
            The story art and gameplay get to be goofy.
            The UI stays restrained and looks like an
            old printed comic page.

            Palette:
            - Near-black page surround
            - Warm aged comic paper
            - Dark brown/black ink
            - Small faded orange accent
            */


            .chapter1-story-screen {

                width: 100%;
                height: 100%;

                background:
                    #0b0b0b;

                display: flex;
                flex-direction: column;

                overflow: hidden;

                color: #17130f;

                font-family:
                    "Trebuchet MS",
                    Arial,
                    sans-serif;

                animation:
                    chapter1-story-page-in
                    220ms
                    ease-out;
            }


            @keyframes chapter1-story-page-in {

                from {
                    opacity: 0;
                    transform: scale(0.992);
                }

                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }


            /*
            ==========================================
            COMIC IMAGE AREA
            ==========================================
            */

            .chapter1-story-image-area {

                height: 66%;

                box-sizing: border-box;

                padding:
                    8px 8px 0 8px;

                background:
                    #0b0b0b;
            }


            .chapter1-story-image-frame {

                width: 100%;
                height: 100%;

                box-sizing: border-box;

                border:
                    4px solid #17130f;

                background:
                    #000;

                overflow: hidden;

                display: flex;

                align-items: center;
                justify-content: center;

                box-shadow:
                    0 2px 0 #473b2b;
            }


            .chapter1-story-image {

                width: 100%;
                height: 100%;

                object-fit: cover;

                display: block;
            }


            /*
            If an image isn't created yet,
            this gives us something useful
            instead of a broken-image icon.
            */

            .chapter1-story-placeholder {

                width: 100%;
                height: 100%;

                display: flex;

                align-items: center;
                justify-content: center;

                text-align: center;

                padding: 30px;

                box-sizing: border-box;

                background:
                    #26221d;

                color:
                    #b9aa87;

                font-family:
                    "Trebuchet MS",
                    Arial,
                    sans-serif;

                font-size: 14px;

                line-height: 1.5;
            }


            /*
            ==========================================
            DIALOGUE / COMIC PAPER AREA
            ==========================================
            */

            .chapter1-story-text-area {

                height: 27%;

                box-sizing: border-box;

                padding:
                    15px 20px 12px 20px;

                position: relative;

                overflow-y: auto;

                display: flex;

                align-items: center;

                background:
                    #e1cf9f;

                border-top:
                    4px solid #17130f;

                border-left:
                    8px solid #0b0b0b;

                border-right:
                    8px solid #0b0b0b;

                box-shadow:
                    inset 0 1px 0 #f0dfb5,
                    inset 0 -1px 0 #9e895f;
            }


            /*
            Very subtle old-paper grain.
            */

            .chapter1-story-text-area::before {

                content: "";

                position: absolute;
                inset: 0;

                pointer-events: none;

                opacity: 0.10;

                background-image:
                    radial-gradient(
                        circle at 18% 24%,
                        #4b3b24 0 0.7px,
                        transparent 0.8px
                    ),
                    radial-gradient(
                        circle at 76% 68%,
                        #4b3b24 0 0.6px,
                        transparent 0.7px
                    );

                background-size:
                    31px 29px,
                    43px 37px;
            }


            /*
            Restrained faded-orange printer's rule.
            */

            .chapter1-story-text-area::after {

                content: "";

                position: absolute;

                left: 20px;
                right: 20px;
                top: 8px;

                height: 3px;

                background:
                    #a94f25;

                opacity: 0.85;

                pointer-events: none;
            }


            .chapter1-story-text {

                width: 100%;

                position: relative;

                z-index: 1;

                font-size:
                    clamp(
                        17px,
                        4vw,
                        24px
                    );

                line-height: 1.32;

                color:
                    #17130f;

                text-align: left;

                font-weight: 700;

                letter-spacing:
                    0.01em;

                text-shadow:
                    0 1px 0
                    rgba(
                        255,
                        255,
                        255,
                        0.18
                    );
            }


            .chapter1-story-line {

                margin:
                    0 0 10px 0;
            }


            .chapter1-story-line:last-child {

                margin-bottom: 0;
            }


            /*
            ==========================================
            NAVIGATION
            ==========================================
            */

            .chapter1-story-nav {

                height: 7%;

                min-height: 48px;

                box-sizing: border-box;

                display: flex;

                align-items: center;
                justify-content: space-between;

                padding:
                    5px 14px;

                background:
                    #11100e;

                border-top:
                    3px solid #000;

                font-family:
                    "Trebuchet MS",
                    Arial,
                    sans-serif;
            }


            .chapter1-story-nav-button {

                border: 0;

                background:
                    transparent;

                color:
                    #e5d4aa;

                font-size: 15px;

                font-weight: 800;

                letter-spacing:
                    0.035em;

                cursor: pointer;

                padding:
                    8px 10px;

                text-transform:
                    uppercase;

                transition:
                    color 120ms ease,
                    transform 120ms ease;
            }


            .chapter1-story-nav-button:hover {

                color:
                    #d66a32;
            }


            .chapter1-story-nav-button:active {

                transform:
                    translateY(1px);
            }


            .chapter1-story-nav-button:disabled {

                opacity: 0.24;

                cursor: default;
            }


            .chapter1-story-nav-button:disabled:hover {

                color:
                    #e5d4aa;
            }


            .chapter1-story-counter {

                color:
                    #8c8067;

                font-size: 12px;

                font-family:
                    "Trebuchet MS",
                    Arial,
                    sans-serif;

                font-weight: 700;

                letter-spacing:
                    0.08em;

                user-select: none;
            }


            /*
            ==========================================
            MOBILE
            ==========================================
            */

            @media (max-width: 500px) {

                .chapter1-story-image-area {

                    padding:
                        5px 5px 0 5px;
                }


                .chapter1-story-image-frame {

                    border-width: 3px;
                }


                .chapter1-story-text-area {

                    padding:
                        13px 14px 9px 14px;

                    border-left-width: 5px;
                    border-right-width: 5px;
                }


                .chapter1-story-text-area::after {

                    left: 14px;
                    right: 14px;
                    top: 7px;

                    height: 2px;
                }


                .chapter1-story-text {

                    font-size:
                        clamp(
                            16px,
                            4.25vw,
                            21px
                        );

                    line-height: 1.28;
                }


                .chapter1-story-nav {

                    padding:
                        4px 8px;
                }


                .chapter1-story-nav-button {

                    font-size: 14px;

                    padding:
                        8px 7px;
                }


                .chapter1-story-counter {

                    font-size: 11px;
                }

            }


            /*
            Respect reduced-motion settings.
            */

            @media (
                prefers-reduced-motion:
                reduce
            ) {

                .chapter1-story-screen {

                    animation: none;
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


    showCard() {

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
            (line) => {

                const paragraph =
                    document.createElement(
                        "p"
                    );


                paragraph.className =
                    "chapter1-story-line";


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
            `${this.currentCard + 1} / ${this.cards.length}`;


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
    },


    previousCard() {

        if (
            this.currentCard <= 0
        ) {
            return;
        }


        this.currentCard--;


        this.showCard();
    },


    nextCard() {

        if (
            this.currentCard <
            this.cards.length - 1
        ) {

            this.currentCard++;


            this.showCard();


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