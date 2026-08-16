/*
chapter2-story.js
Recovery Misfits Halloween Game

Temporary Chapter 2 transition test.
*/

window.HalloweenGame = window.HalloweenGame || {};

window.HalloweenGame.chapter2Story = {

    name: "chapter2-story",

    start() {
        console.log("chapter2-story starting");

        this.injectStyles();
        this.showScreen();
    },

    injectStyles() {

        if (document.getElementById("chapter2-story-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "chapter2-story-styles";

        style.textContent = `

            .chapter2-story-screen {

                width: 100%;
                height: 100%;

                box-sizing: border-box;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 24px;

                background: #080808;

                font-family:
                    "Trebuchet MS",
                    Arial,
                    sans-serif;

                text-align: center;

                animation:
                    chapter2-story-fade-in
                    500ms
                    ease-out;
            }

            .chapter2-story-card {

                width: min(88%, 560px);

                box-sizing: border-box;

                padding: 32px 24px;

                background: #dcc89a;

                color: #17130f;

                border: 5px solid #111;

                box-shadow:
                    8px 8px 0 #000;
            }

            .chapter2-story-small {

                margin-bottom: 12px;

                font-size: 14px;

                font-weight: 900;

                letter-spacing: 0.14em;

                text-transform: uppercase;
            }

            .chapter2-story-title {

                margin: 0 0 14px 0;

                font-size:
                    clamp(
                        38px,
                        10vw,
                        68px
                    );

                line-height: 1;

                font-weight: 1000;

                text-transform: uppercase;
            }

            .chapter2-story-subtitle {

                margin: 0 0 24px 0;

                font-size:
                    clamp(
                        19px,
                        5vw,
                        28px
                    );

                font-weight: 900;

                text-transform: uppercase;
            }

            .chapter2-story-text {

                margin: 0;

                font-size:
                    clamp(
                        17px,
                        4.5vw,
                        23px
                    );

                line-height: 1.4;

                font-weight: 700;
            }

            .chapter2-story-success {

                margin-top: 24px;

                display: inline-block;

                padding: 8px 14px;

                background: #111;

                color: #52ff73;

                border: 3px solid #000;

                font-weight: 900;

                letter-spacing: 0.08em;

                text-transform: uppercase;
            }

            @keyframes chapter2-story-fade-in {

                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

        `;

        document.head.appendChild(style);
    },

    showScreen() {

        const game =
            document.getElementById("game");

        if (!game) {

            console.error(
                "chapter2-story: #game element not found"
            );

            return;
        }

        game.innerHTML = "";

        const screen =
            document.createElement("div");

        screen.className =
            "chapter2-story-screen";

        screen.innerHTML = `

            <div class="chapter2-story-card">

                <div class="chapter2-story-small">
                    Recovery Misfits
                </div>

                <h1 class="chapter2-story-title">
                    Chapter 2
                </h1>

                <div class="chapter2-story-subtitle">
                    The Night Is Young
                </div>

                <p class="chapter2-story-text">
                    Our friends survived the first leg
                    of the journey.
                    <br><br>
                    But Halloween night is just
                    getting started...
                </p>

                <div class="chapter2-story-success">
                    Transition Successful
                </div>

            </div>

        `;

        game.appendChild(screen);
    }

};