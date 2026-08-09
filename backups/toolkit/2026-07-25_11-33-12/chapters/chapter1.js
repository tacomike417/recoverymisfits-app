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
