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

  nextObstacleSpawnAt: 0,
  nextCollectibleSpawnAt: 0,

  getRandomSpawnDelay(runtime) {
    const minimumDelay =
      runtime.easierRetry
        ? 2700
        : 1700;

    const maximumDelay =
      runtime.easierRetry
        ? 4500
        : 3000;

    return (
      minimumDelay +
      Math.random() *
        (maximumDelay - minimumDelay)
    );
  },

  getRandomCollectibleSpawnDelay() {
    const minimumDelay = 700;
    const maximumDelay = 1400;

    return (
      minimumDelay +
      Math.random() *
        (maximumDelay - minimumDelay)
    );
  },

  resetEntities(runtime) {
    runtime.activeEntities.length = 0;

    this.nextObstacleSpawnAt =
      performance.now() +
      (
        runtime.easierRetry
          ? 2200
          : 1200
      );

    this.nextCollectibleSpawnAt =
      performance.now() + 500;
  },

  spawnObstacle(runtime) {
    const {
      now,
      width,
      height,
      bill,
      activeEntities,
      obstacleDefinitions,
      obstacleImages,
      easierRetry
    } = runtime;

    if (obstacleDefinitions.length === 0) {
      return;
    }

    const definition =
      obstacleDefinitions[
        Math.floor(
          Math.random() *
            obstacleDefinitions.length
        )
      ];

    const obstacleHeight =
      definition.height || 180;

    const image =
      obstacleImages.get(definition.id);

    const aspectRatio =
      image &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0
        ? image.naturalWidth /
          image.naturalHeight
        : 1;

    const obstacleWidth =
      obstacleHeight * aspectRatio;

    const movement =
      definition.movement || "horizontal";

    let x;
    let y;

    /*
      The falling drunk is marked vertical
      in the configuration, but Chapter 1
      turns him into a diagonal hazard.
    */

    if (movement === "vertical") {
      x = width + obstacleWidth;

      y =
        height -
        obstacleHeight -
        25;

      const targetX = bill.x;
      const targetY = bill.y;

      const dx = targetX - x;
      const dy = targetY - y;

      const distance =
        Math.hypot(dx, dy) || 1;

      const baseSpeed =
        definition.speed || 7;

      const speed =
        easierRetry
          ? baseSpeed * 0.62
          : baseSpeed;

      activeEntities.push({
        type: "hazard",
        definition,
        x,
        y,
        width: obstacleWidth,
        height: obstacleHeight,
        movement: "diagonal",
        speed,
        velocityX:
          (dx / distance) * speed,
        velocityY:
          (dy / distance) * speed
      });

      this.nextObstacleSpawnAt =
        now +
        this.getRandomSpawnDelay(runtime);

      return;
    }

    /*
      The woman and drink pal stay aligned
      along the bottom of the screen.
    */

    x = width + obstacleWidth;

    y =
      height -
      obstacleHeight -
      25;

    activeEntities.push({
      type: "hazard",
      definition,
      x,
      y,
      width: obstacleWidth,
      height: obstacleHeight,
      movement,
      speed:
        easierRetry
          ? (definition.speed || 4) * 0.62
          : definition.speed || 4
    });

    this.nextObstacleSpawnAt =
      now +
      this.getRandomSpawnDelay(runtime);
  },

  spawnCollectible(runtime) {
    const {
      now,
      width,
      height,
      activeEntities,
      collectibleDefinitions,
      collectibleImages
    } = runtime;

    if (collectibleDefinitions.length === 0) {
      return;
    }

    const definition =
      collectibleDefinitions[
        Math.floor(
          Math.random() *
            collectibleDefinitions.length
        )
      ];

    const collectibleHeight =
      definition.height || 80;

    const image =
      collectibleImages.get(definition.id);

    const aspectRatio =
      image &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0
        ? image.naturalWidth /
          image.naturalHeight
        : 1;

    const collectibleWidth =
      collectibleHeight * aspectRatio;

    const topLimit = 70;

    const bottomLimit =
      Math.max(
        topLimit,
        height -
          collectibleHeight -
          45
      );

    const y =
      topLimit +
      Math.random() *
        (bottomLimit - topLimit);

    activeEntities.push({
      type: "collectible",
      definition,
      x: width + collectibleWidth,
      y,
      width: collectibleWidth,
      height: collectibleHeight,
      movement: "horizontal",
      speed: definition.speed || 4.5
    });

    this.nextCollectibleSpawnAt =
      now +
      this.getRandomCollectibleSpawnDelay();
  },

  updateObstacles(runtime) {
    const {
      now,
      height,
      activeEntities
    } = runtime;

    if (now >= this.nextObstacleSpawnAt) {
      this.spawnObstacle(runtime);
    }

    for (
      let index =
        activeEntities.length - 1;
      index >= 0;
      index -= 1
    ) {
      const entity =
        activeEntities[index];

      if (entity.type !== "hazard") {
        continue;
      }

      if (entity.movement === "diagonal") {
        entity.x += entity.velocityX;
        entity.y += entity.velocityY;

        const isOffscreen =
          entity.x + entity.width < -80 ||
          entity.y + entity.height < -80 ||
          entity.y > height + 80;

        if (isOffscreen) {
          activeEntities.splice(index, 1);
        }

        continue;
      }

      entity.x -= entity.speed;

      if (
        entity.x + entity.width <
        -40
      ) {
        activeEntities.splice(index, 1);
      }
    }
  },

  updateCollectibles(runtime) {
    const {
      now,
      activeEntities
    } = runtime;

    if (now >= this.nextCollectibleSpawnAt) {
      this.spawnCollectible(runtime);
    }

    for (
      let index =
        activeEntities.length - 1;
      index >= 0;
      index -= 1
    ) {
      const entity =
        activeEntities[index];

      if (entity.type !== "collectible") {
        continue;
      }

      entity.x -= entity.speed;

      if (
        entity.x + entity.width <
        -40
      ) {
        activeEntities.splice(index, 1);
      }
    }
  },

  drawGameplay(runtime) {
    const {
      ctx,
      screenShake,
      drawBackground,
      drawBill,
      drawPickupEffects
    } = runtime;

    const shakeX =
      (Math.random() - 0.5) * screenShake;

    const shakeY =
      (Math.random() - 0.5) * screenShake;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBackground();
    this.drawObstacles(runtime);
    this.drawCollectibles(runtime);
    drawBill();
    drawPickupEffects();

    ctx.restore();
  },

  drawObstacles(runtime) {
    const {
      ctx,
      activeEntities,
      obstacleImages
    } = runtime;

    ctx.imageSmoothingEnabled = false;

    for (const entity of activeEntities) {
      if (entity.type !== "hazard") {
        continue;
      }

      const image =
        obstacleImages.get(
          entity.definition.id
        );

      if (
        image &&
        image.complete &&
        image.naturalWidth > 0
      ) {
        ctx.drawImage(
          image,
          entity.x,
          entity.y,
          entity.width,
          entity.height
        );
      }
    }
  },

  drawCollectibles(runtime) {
    const {
      ctx,
      activeEntities,
      collectibleImages
    } = runtime;

    ctx.imageSmoothingEnabled = false;

    for (const entity of activeEntities) {
      if (entity.type !== "collectible") {
        continue;
      }

      const image =
        collectibleImages.get(
          entity.definition.id
        );

      if (
        image &&
        image.complete &&
        image.naturalWidth > 0
      ) {
        ctx.drawImage(
          image,
          entity.x,
          entity.y,
          entity.width,
          entity.height
        );

        continue;
      }

      /*
        Temporary fallback so collectibles
        remain visible if an image fails.
      */

      ctx.fillStyle = "#f2c94c";

      ctx.fillRect(
        entity.x,
        entity.y,
        entity.width,
        entity.height
      );

      ctx.fillStyle = "#000000";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        `BEER +${entity.definition.value || 0}`,
        entity.x + entity.width / 2,
        entity.y + entity.height / 2
      );

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
  },


  // =====================================
  // CHAPTER 1 COLLISION SYSTEM
  // =====================================

  rectanglesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  },

  createNearMissEffects(runtime, entity, billHitbox) {
    const {
      floatingNumbers,
      pickupParticles,
      getScreenShake,
      setScreenShake,
      getBillPickupBounce,
      setBillPickupBounce
    } = runtime;

    const words = [
      "WHEW!",
      "CLOSE ONE!",
      "TOO CLOSE!"
    ];

    floatingNumbers.push({
      x:
        billHitbox.x +
        billHitbox.width / 2 +
        28,

      y:
        billHitbox.y - 10,

      text:
        words[
          Math.floor(
            Math.random() *
            words.length
          )
        ],

      life: 1,
      velocityY: -1.25,
      scale: 0.72,
      color: "#8fe9ff"
    });

    const burstX =
      Math.max(
        billHitbox.x +
          billHitbox.width,
        entity.x
      );

    const burstY =
      billHitbox.y +
      billHitbox.height / 2;

    for (
      let index = 0;
      index < 10;
      index += 1
    ) {
      const angle =
        Math.random() * Math.PI * 2;

      const speed =
        1.2 + Math.random() * 3.2;

      pickupParticles.push({
        x: burstX,
        y: burstY,

        velocityX:
          Math.cos(angle) * speed,

        velocityY:
          Math.sin(angle) * speed,

        gravity: 0.03,

        size:
          2 +
          Math.floor(
            Math.random() * 4
          ),

        life: 1,

        decay:
          0.035 +
          Math.random() * 0.025,

        rotation:
          Math.random() * Math.PI,

        rotationSpeed:
          (Math.random() - 0.5) * 0.3,

        color:
          Math.random() > 0.5
            ? "#8fe9ff"
            : "#ffffff"
      });
    }

    setScreenShake(
      Math.max(
        getScreenShake(),
        2.5
      )
    );

    setBillPickupBounce(
      Math.max(
        getBillPickupBounce(),
        0.45
      )
    );
  },

  checkObstacleCollisions(runtime) {
    const {
      bill,
      activeEntities,
      easierRetry,
      setEasierRetry,
      playCrashFeedback,
      restartGameplay
    } = runtime;

    const billHitbox = {
      x:
        bill.x +
        bill.width *
          (easierRetry ? 0.37 : 0.3),

      y:
        bill.y +
        bill.height *
          (easierRetry ? 0.33 : 0.25),

      width:
        bill.width *
          (easierRetry ? 0.26 : 0.4),

      height:
        bill.height *
          (easierRetry ? 0.34 : 0.5)
    };

    for (const entity of activeEntities) {
      if (entity.type !== "hazard") {
        continue;
      }

      const entityHitbox = {
        x:
          entity.x +
          entity.width *
            (easierRetry ? 0.4 : 0.32),

        y:
          entity.y +
          entity.height *
            (easierRetry ? 0.44 : 0.38),

        width:
          entity.width *
            (easierRetry ? 0.2 : 0.36),

        height:
          entity.height *
            (easierRetry ? 0.32 : 0.48)
      };

      if (
        this.rectanglesOverlap(
          billHitbox,
          entityHitbox
        )
      ) {
        setEasierRetry(true);
        playCrashFeedback();
        restartGameplay();
        return;
      }

      const nearMissPadding = 34;

      const nearMissZone = {
        x:
          entityHitbox.x -
          nearMissPadding,

        y:
          entityHitbox.y -
          nearMissPadding,

        width:
          entityHitbox.width +
          nearMissPadding * 2,

        height:
          entityHitbox.height +
          nearMissPadding * 2
      };

      if (
        this.rectanglesOverlap(
          billHitbox,
          nearMissZone
        )
      ) {
        entity.nearMissArmed = true;
      }

      const hazardHasPassedBill =
        entityHitbox.x +
          entityHitbox.width <
        billHitbox.x;

      if (
        entity.nearMissArmed &&
        !entity.nearMissTriggered &&
        hazardHasPassedBill
      ) {
        entity.nearMissTriggered = true;

        this.createNearMissEffects(
          runtime,
          entity,
          billHitbox
        );
      }
    }
  },

  checkCollectibleCollisions(runtime) {
    const {
      bill,
      activeEntities,
      addScore,
      playPickupFeedback,
      createPickupEffects
    } = runtime;

    const billHitbox = {
      x: bill.x + bill.width * 0.22,
      y: bill.y + bill.height * 0.18,
      width: bill.width * 0.56,
      height: bill.height * 0.64
    };

    for (
      let index =
        activeEntities.length - 1;
      index >= 0;
      index -= 1
    ) {
      const entity =
        activeEntities[index];

      if (entity.type !== "collectible") {
        continue;
      }

      const collectibleHitbox = {
        x:
          entity.x +
          entity.width * 0.12,

        y:
          entity.y +
          entity.height * 0.12,

        width:
          entity.width * 0.76,

        height:
          entity.height * 0.76
      };

      if (
        !this.rectanglesOverlap(
          billHitbox,
          collectibleHitbox
        )
      ) {
        continue;
      }

      const effectStrength =
        Number(
          entity.definition.value
        ) || 1;

      addScore(1);
      playPickupFeedback(effectStrength);

      createPickupEffects(
        entity,
        1,
        effectStrength
      );

      activeEntities.splice(index, 1);
    }
  },

  updateGameplay(runtime) {
    const {
      bill,
      updateBackground,
      updatePickupEffects
    } = runtime;

    bill.y +=
      (bill.targetY - bill.y) *
      0.24;

    updateBackground();
    this.updateObstacles(runtime);
    this.updateCollectibles(runtime);
    updatePickupEffects();
    this.checkCollectibleCollisions(runtime);
    this.checkObstacleCollisions(runtime);
  },

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

