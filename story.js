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
    // Full Chapter 1 content is registered by:
    // chapters/chapter1.js
    // =====================================

    {
      id: 1,
      title: "Just One More Time",
      crawl: [],
      gameplay: {},
      cards: []
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