window.gameData = {
  title: "The Very Very Unofficial Story of How We Got Here",

  chapters: [
    {
      id: 1,
      title: "What's the big deal?",

      gameplay: {
        duration: 30,

        background: {
          id: "street",
          image: "assets/backgrounds/background-chapter1.png"
        },

        player: {
          image: "assets/players/player-chapter1.png",
          width: 181,
          height: 154
        },

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

        collisionAction: "restart"
      },

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

Once I start I don't want to stop.  I can't stop.  I don't know why.

I have to figure this out!`
},

  {
  image: "assets/cards/chapter1-card5.png",
  title: "IT WILL BE DIFFERENT THIS TIME I SWEAR!",
  text:
`That's it! I just need to avoid the people that get me into trouble... I'll just stick to beer this time.

Then I won't drink so much.  My wife will be happy again.  And I'll be back to normal.`
},
{
  image: "assets/cards/chapter1-card6.png",
  title: "IT'LL BE DIFFERENT THIS TIME",
  text:
`Swipe up and down
to move Bill.

Avoid the people
that get you into trouble.`
},

      ]
    }
  ]
};

// Temporary compatibility line.
// The current engine still looks for window.chapters.
window.chapters = window.gameData.chapters;