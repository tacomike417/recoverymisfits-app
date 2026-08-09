window.gameData = {
  // =====================================
  // GAME TITLE
  // =====================================

  title: "The Very Very Unofficial Story of How We Got Here",

  // =====================================
  // CHAPTERS
  // =====================================

  chapters: [
    // =====================================
    // CHAPTER 1
    // =====================================

    {
      id: 1,
      title: "What's the big deal?",

      // =====================================
      // CHAPTER 1 GAMEPLAY
      // =====================================

      gameplay: {
        duration: 30,

        // =====================================
        // BACKGROUND
        // =====================================

        background: {
          id: "street",
          image: "assets/backgrounds/background-chapter1.png"
        },

        // =====================================
        // PLAYER
        // =====================================

        player: {
          image: "assets/players/player-chapter1.png",
          width: 181,
          height: 154
        },

        // =====================================
        // HAZARDS
        // =====================================

        obstacles: [
          {
            id: "trouble-woman",
            image: "assets/obstacles/obstacle-woman.png",
            label: "Wanna Party?",
            height: 188,
            movement: "horizontal",
            speed: 4
          },

          {
            id: "drink-pal",
            image: "assets/obstacles/obstacle-drink-pal.png",
            label: "Lemme Buy Ya a Drink Pal",
            height: 188,
            movement: "horizontal",
            speed: 4.5
          },

          {
            id: "falling-drunk",
            image: "assets/obstacles/obstacle-falling-drunk.png",
            label: "Just One Won't Hurt Ya",
            height: 205,
            movement: "vertical",
            speed: 7
          }
        ],

        // =====================================
        // COLLECTIBLES
        // =====================================

        collectibles: [
          {
            id: "beer-mug",
            image: "assets/collectibles/beer-mug.png",
            value: 1,
            height: 72,
            speed: 4.5
          },

          {
            id: "beer-6pack",
            image: "assets/collectibles/beer-6pack.png",
            value: 6,
            height: 88,
            speed: 4.8
          },

          {
            id: "beer-12pack",
            image: "assets/collectibles/beer-12pack.png",
            value: 12,
            height: 98,
            speed: 5
          },

          {
            id: "beer-crate",
            image: "assets/collectibles/beer-crate.png",
            value: 24,
            height: 112,
            speed: 5.3
          }
        ],

        // =====================================
        // COLLISION BEHAVIOR
        // =====================================

        collisionAction: "restart"
      },

      // =====================================
      // CHAPTER 1 STORY CARDS
      // =====================================

      cards: [
        {
          image: "assets/cards/chapter1-card1.png",
          title: "WHAT'S THE BIG DEAL?",
          text:
`I still have my job.

I'm making good money.

All the men I work with drink too.`
        },

        {
          image: "assets/cards/chapter1-card2.png",
          title: "WHY IS EVERYONE ON MY CASE?",
          text:
`Sure...

Sometimes I get out of control.

But who doesn't when they drink? That's the fun of drinking!`
        },

        {
          image: "assets/cards/chapter1-card3.png",
          title: "HOW DO I KEEP ENDING UP HERE?",
          text:
`I don't get it...

Other guys I drink with go home after a few.

They don't spend their whole paychecks at the bar.`
        },

        {
          image: "assets/cards/chapter1-card4.png",
          title: "WHAT IS GOING ON WITH ME?",
          text:
`I say I'm going to have one, maybe two, and be home by 7pm.

Once I start I don't want to stop. I can't stop. I don't know why.

I have to figure this out!`
        },

        {
          image: "assets/cards/chapter1-card5.png",
          title: "IT WILL BE DIFFERENT THIS TIME...",
          text:
`It will be different this time, I swear!

I just need to avoid the people that get me into trouble...

And I'll just stick to beer this time. I promise.

Then I won't get so drunk. My wife will be happy again.

And I'll be back to normal.`
        },

        {
          image: "assets/cards/chapter1-card6.png",
          title: "IT'LL BE DIFFERENT THIS TIME",
          text:
`Swipe up and down
to move Bill.

Avoid the people
that get you into trouble.`
        }
      ]
    },

    // =====================================
    // CHAPTER 2
    // =====================================

    {
      id: 2,
      title: "The Belladonna Treatment",

      // =====================================
      // CHAPTER 2 STORY CARDS
      // =====================================

      cards: [
        {
          image: "assets/cards/chapter2-card1.png",
          title: "HERE WE GO AGAIN",
          text:
`Bill's plan didn't work.

Beer turned into more drinking,
and avoiding certain people
didn't change anything.

Now Lois is making another call
for help.`
        }
      ]
    }
  ]
};

// =====================================
// ENGINE COMPATIBILITY
// The current engine still looks for
// window.chapters.
// =====================================

window.chapters = window.gameData.chapters;