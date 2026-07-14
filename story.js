window.gameData = {
  title: "The Very Very Unofficial Story of How We Got Here",

  chapters: [
    {
      id: 1,
      title: "Just One More Time",

      gameplay: {
        duration: 30,

        background: {
          id: "street",
          image: null
        },

        player: {
          image: "runner.png",
          width: 145,
          height: 123
        },

        obstacles: [
          {
            id: "big-party",
            image: null,
            label: "Big Party"
          },
          {
            id: "obvious-drunk",
            image: null,
            label: "Real Drunk"
          },
          {
            id: "trouble-woman",
            image: null,
            label: "Trouble"
          }
        ],

        collisionAction: "restart"
      },

      cards: [
        {
          image: null,
          text:
`I still have my job.

I'm making good money.

All the men I work with drink after work.`
        },

        {
          image: null,
          text:
`Sure...

Sometimes I get out of control.

But who doesn't when they drink?`
        },

        {
          image: null,
          text:
`Besides...

All men of genius drink.

I'll just stay away from the people who get me into trouble when I drink...

...and I should be fine.`
        }
      ]
    }
  ]
};

// Temporary compatibility line.
// The current engine still looks for window.chapters.
window.chapters = window.gameData.chapters;