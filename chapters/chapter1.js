window.RecoveryChapters = window.RecoveryChapters || {};

window.RecoveryChapters.chapter1 = {
  id: 1,
  title: "Just One More Time",

  crawl: [
    "CHAPTER 1",
    "",
    "NOT SO VERY LONG AGO...",
    "",
    "Our friend is a successful businessman.",
    "",
    "He has a loving wife...",
    "",
    "Good friends...",
    "",
    "And a future that looks bright.",
    "",
    "Drinking has become a part of his everyday life.",
    "",
    "After work.",
    "",
    "With friends.",
    "",
    "To celebrate.",
    "",
    "To relax.",
    "",
    "Most days are fine.",
    "",
    "But every now and then...",
    "",
    "He takes it too far.",
    "",
    "Another apology.",
    "",
    "Another promise.",
    "",
    "Another hospital stay.",
    "",
    "Each time he leaves the hospital...",
    "",
    "He believes this time will be different.",
    "",
    "He'll be more careful.",
    "",
    "He'll have more willpower.",
    "",
    "He'll finally get it under control.",
    "",
    "He has no idea...",
    "",
    "He's about to begin a journey...",
    "",
    "One that millions of us would one day understand."
  ],

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
  ],

  prepare() {
    if (!Array.isArray(this.cards)) {
      return;
    }

    this.cards = this.cards.filter((card) => {
      const searchableText = `${card?.title || ""} ${card?.text || ""}`;
      return !/swipe/i.test(searchableText);
    });

    const bigDealCard = this.cards.find((card) =>
      /get out of control|who doesn(?:'|’)t when they drink/i.test(
        card?.text || ""
      )
    );

    if (
      bigDealCard &&
      !/what(?:'|’)s the big deal/i.test(bigDealCard.text || "")
    ) {
      bigDealCard.text =
        `${bigDealCard.text || ""}\n\n"What's the big deal?"`;
    }
  }
};

const legacyChapter1 =
  window.gameData?.chapters?.find((chapter) => chapter.id === 1);

if (legacyChapter1) {
  Object.assign(
    legacyChapter1,
    window.RecoveryChapters.chapter1
  );

  window.RecoveryChapters.chapter1 = legacyChapter1;
}

