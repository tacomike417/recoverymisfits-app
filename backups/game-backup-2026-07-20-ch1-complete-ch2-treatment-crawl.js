(() => {
  "use strict";

  // =====================================
  // CORE SETUP
  // =====================================

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const engine = window.RecoveryEngine;

  /*
    Chapters are numbered normally in the URL:

      ?chapter=1
      ?chapter=2
      ?chapter=3

    The engine still uses zero-based chapter indexes.
  */

  const chapterNumber =
    Math.max(
      1,
      Number(
        new URLSearchParams(
          window.location.search
        ).get("chapter")
      ) || 1
    );

  const chapterIndex =
    chapterNumber - 1;

  const currentChapter =
    engine.getChapter(chapterIndex);

  // =====================================
  // CHAPTER 2 STORY CARDS
  // Edit this text whenever you want.
  // =====================================

  if (chapterNumber === 2 && currentChapter) {
    currentChapter.cards = [
      {
        title: "HERE WE GO AGAIN",
        image: "assets/cards/chapter2-card1.png",
        text:
          "Bill's plan didn't work.\n\n" +
          "Beer turned into uncontrolable drinking,\n" +
          "and avoiding certain people\n" +
          "didn't change a thing.\n\n" +
          "Now Lois is making another call for help."
      },

      {
        title: "THE BELLADONNA TREATMENT",
        image: "assets/cards/chapter2-card2.png",
        text:
          "\"Yes... we'll begin immediately.\"\n\n" +
          "Hydrotherapy...\n" +
          "Intense exercise...\n" +
          "Belladonna treatments...\n\n" +
          "The goal is to calm his nervous system.\n\n" +
          "When we're finished he'll be a new man.\n"
      },

      {
        title: "RUN! RUN! RUN!",
        image: "assets/cards/chapter2-card3.png",
        text:
          "RUN! RUN! RUN!\n\n" +
          "Now hot bath!\n\n" +
          "Now cold shower!\n\n" +
          "Now Belladonna..."
      },

      {
        title: "BELLADONNA?",
        image: "assets/cards/chapter2-card4.png",
        text:
          "Bill:\n" +
          "\"I don't want to drink any Belladonna!\"\n\n" +
          "Nurse:\n" +
          "\"Oh, honey...\n\n" +
          "You don't drink it...\n\n" +
          "It goes in the other way.\""
      },

      {
        title: "THIS IS TORTURE",
        image: "assets/cards/chapter2-card5.png",
        text:
          "This...\n\n" +
          "is...\n\n" +
          "TORTURE.\n\n" + "There has to be a better solution..."
      }
    ];
  }

  let width = 0;
  let height = 0;

  // splash → chapter1CutScene → title/story → playing → finished
  const skipIntro = new URLSearchParams(window.location.search).get("skipIntro") === "1";

  /*
    Chapter 2 intentionally begins with the shared crawl even though
    Chapter 1 sends it over with skipIntro=1. Other chapters keep the
    existing skipIntro behavior unchanged.
  */
  let gameState =
    chapterNumber === 2
      ? "chapter1CutScene"
      : skipIntro
        ? "story"
        : "splash";

  // =====================================
  // SPLASH SETTINGS
  // =====================================

  const SPLASH_HOLD_MS = 2000;
  const SPLASH_FADE_MS = 800;

  let splashStartedAt = performance.now();

  // =====================================
  // CHAPTER 1 OPENING CUT SCENE
  // =====================================

  const chapter1CutSceneEnabled =
    (chapterNumber === 1 && !skipIntro) ||
    chapterNumber === 2;

  const chapter1CutSceneText =
    chapterNumber === 2
      ? [
          "CHAPTER 2",
          "",
          "Seven years have passed...",
          "",
          "Our friend is now a regular at hospitals seeking help.",
          "",
          "His drinking has become impossible to hide.",
          "",
          "Steady work has become impossible to keep.",
          "",
          "His marriage has grown unhappy.",
          "",
          "His friends have left him behind.",
          "",
          "His life is on the brink of collapse.",
          "",
          "Experimental treatment now seems like his only option.",
          "",
          "He is becoming desperate for a solution..."
        ]
      : [
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
  ];

  const CHAPTER_1_CUT_SCENE_SCROLL_SPEED = 22;
  const CHAPTER_1_CUT_SCENE_END_HOLD_MS = 1700;

  let chapter1CutSceneStartedAt = 0;
  let chapter1CutSceneFinishedAt = 0;

  const chapter1CutSceneStars = Array.from(
    { length: 115 },
    (_, index) => ({
      x: ((index * 73) % 997) / 997,
      y: ((index * 191) % 991) / 991,
      size: 0.7 + ((index * 29) % 17) / 10,
      phase: (index * 0.73) % (Math.PI * 2)
    })
  );

  // =====================================
  // CHAPTER STATE
  // =====================================

  let chapterTimer = null;
  let chapterFinished = false;
  let currentCardIndex = 0;
  let gameplayStartedAt = 0;

  const isTreatmentLevel = chapterNumber === 2;
  const treatmentDurationMs =
    (currentChapter?.gameplay?.duration || 30) * 1000;

  const treatmentSlots = [
    {
      label: "RUN!",
      imagePath: "assets/treatment/treatment-run.png",
      active: false,
      warningAt: 0,
      expiresAt: 0,
      flash: 0
    },
    {
      label: "HOT SHOWER!",
      imagePath: "assets/treatment/treatment-hot-shower.png",
      active: false,
      warningAt: 0,
      expiresAt: 0,
      flash: 0
    },
    {
      label: "COLD BATH!",
      imagePath: "assets/treatment/treatment-cold-bath.png",
      active: false,
      warningAt: 0,
      expiresAt: 0,
      flash: 0
    },
    {
      label: "BELLADONNA!",
      imagePath: "assets/treatment/treatment-belladonna.png",
      active: false,
      warningAt: 0,
      expiresAt: 0,
      flash: 0
    }
  ];

  let treatmentNextCueAt = 0;
  let treatmentHits = 0;
  let treatmentMisses = 0;
  let treatmentFailedLabel = "";
  let treatmentAttempt = 0;
  let treatmentOverloadTriggered = false;

  /*
    Chapter 1 keeps its exact current difficulty until the first
    obstacle collision. Every retry after that collision uses the
    easier hazard settings below. Chapter 2 keeps its own existing
    first-attempt/easier-retry system.
  */
  let chapter1EasierRetry = false;
  const treatmentParticles = [];

  // =====================================
  // BACKGROUND STATE
  // =====================================

  let backgroundOffset = 0;

  const BACKGROUND_SCROLL_SPEED = 1.2;

  // =====================================
  // CANVAS
  // =====================================

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    const scale = Math.max(
      1,
      window.devicePixelRatio || 1
    );

    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(
      scale,
      0,
      0,
      scale,
      0,
      0
    );
  }

  window.addEventListener(
    "resize",
    resizeCanvas
  );

  resizeCanvas();

  // =====================================
  // IMAGE LOADING
  // =====================================

  const billImage = new Image();

  billImage.src =
    currentChapter?.gameplay?.player?.image ||
    "runner.png";

  const backgroundImage = new Image();

  backgroundImage.src =
    isTreatmentLevel
      ? "assets/backgrounds/background-chapter2.png"
      : currentChapter?.gameplay?.background?.image ||
        "";

  const obstacleDefinitions =
    currentChapter?.gameplay?.obstacles || [];

  const obstacleImages = new Map();

  for (const definition of obstacleDefinitions) {
    const image = new Image();

    image.src = definition.image || "";

    obstacleImages.set(
      definition.id,
      image
    );
  }
  const collectibleDefinitions =
  currentChapter?.gameplay?.collectibles || [];

  const collectibleImages = new Map();

for (const definition of collectibleDefinitions) {
  const image = new Image();

  image.src = definition.image || "";

  collectibleImages.set(
    definition.id,
    image
  );
}

  const splashImage = new Image();

  splashImage.src =
    "assets/splash/recovery-misfits-splash.png";

  const titleImage = new Image();

  titleImage.src =
    "assets/title/unofficial-title.png";

  const treatmentImages = new Map();

  for (const slot of treatmentSlots) {
    const image = new Image();
    image.src = slot.imagePath;
    treatmentImages.set(slot.label, image);
  }

  const treatmentRestartImage = new Image();
  treatmentRestartImage.src =
    "assets/treatment/treatment-restart-required.png";

  // =====================================
  // SOUND AND VIBRATION
  // =====================================

  /*
    Audio files currently used:

      assets/sounds/music/chapter1.mp3
      assets/sounds/sfx/click.ogg
      assets/sounds/sfx/crash.mp3
      assets/sounds/sfx/pickup-large.mp3

    Future chapters can use chapter2.mp3,
    chapter3.mp3, and so on.
  */

  const backgroundMusic = new Audio(
    `assets/sounds/music/chapter${chapterNumber}.mp3`
  );

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.32;
  backgroundMusic.preload = "auto";

  const soundFiles = {
    click:
      "assets/sounds/sfx/click.ogg",

    crash:
      "assets/sounds/sfx/crash.mp3",

    pickup:
      "assets/sounds/sfx/pickup-large.mp3"
  };

  const soundVolumes = {
    click: 0.5,
    crash: 0.72,
    pickup: 0.58
  };

  let audioUnlocked = false;

  const treatmentMusicSettings = {
    startRate: 0.9,
    endRate: 1.28,
    baseVolume: 0.3,
    activeTileBoost: 0.018,
    smoothing: 0.08
  };

  function startBackgroundMusicForGameplay() {
    audioUnlocked = true;

    if (isTreatmentLevel) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      backgroundMusic.playbackRate = treatmentMusicSettings.startRate;
      backgroundMusic.volume = treatmentMusicSettings.baseVolume;
    } else {
      backgroundMusic.playbackRate = 1;
      backgroundMusic.volume = 0.32;
    }

    backgroundMusic
      .play()
      .catch(() => {
        audioUnlocked = false;
      });
  }

  function stopBackgroundMusic(resetToBeginning = false) {
    backgroundMusic.pause();

    if (resetToBeginning) {
      backgroundMusic.currentTime = 0;
    }
  }

  function updateTreatmentMusic(now) {
    if (!isTreatmentLevel || gameState !== "playing") {
      return;
    }

    const elapsed = Math.max(0, now - gameplayStartedAt);
    const progress = Math.min(1, elapsed / treatmentDurationMs);
    const activeTiles = treatmentSlots.filter(slot => slot.active).length;

    const progressRate =
      treatmentMusicSettings.startRate +
      (treatmentMusicSettings.endRate - treatmentMusicSettings.startRate) *
        progress;

    const targetRate = Math.min(
      1.35,
      progressRate + activeTiles * treatmentMusicSettings.activeTileBoost
    );

    backgroundMusic.playbackRate +=
      (targetRate - backgroundMusic.playbackRate) *
      treatmentMusicSettings.smoothing;
  }

  function playSound(
    soundName,
    options = {}
  ) {
    const source =
      soundFiles[soundName];

    if (!source) {
      return;
    }

    const sound =
      new Audio(source);

    sound.volume =
      options.volume ??
      soundVolumes[soundName] ??
      0.6;

    sound.playbackRate =
      options.playbackRate ?? 1;

    sound
      .play()
      .catch(() => {});
  }

  function vibrate(pattern) {
    if (
      typeof navigator.vibrate !==
      "function"
    ) {
      return;
    }

    navigator.vibrate(pattern);
  }

  function playClickFeedback() {
    playSound("click");
    vibrate(8);
  }

  function playPickupFeedback(
    effectStrength = 1
  ) {
    const strength =
      Math.max(
        1,
        Number(effectStrength) || 1
      );

    playSound(
      "pickup",
      {
        playbackRate:
          Math.max(
            0.82,
            1.05 -
              Math.min(strength, 6) *
                0.035
          ),

        volume:
          Math.min(
            0.78,
            0.54 +
              Math.min(strength, 6) *
                0.035
          )
      }
    );

    if (strength >= 4) {
      vibrate([18, 20, 28]);
    } else if (strength >= 2) {
      vibrate([14, 18, 18]);
    } else {
      vibrate(12);
    }
  }

  function playCrashFeedback() {
    playSound("crash");
    vibrate([55, 25, 70]);
  }

  // =====================================
  // PLAYER
  // =====================================

  const bill = {
    x: 40,
    y: 200,

    width:
      currentChapter?.gameplay?.player?.width ||
      145,

    height:
      currentChapter?.gameplay?.player?.height ||
      123,

    targetY: 200
  };

  function resetBill() {
    bill.x = 40;

    bill.y = Math.max(
      80,
      height / 2 - bill.height / 2
    );

    bill.targetY = bill.y;
  }

  function keepBillOnScreen() {
    const topLimit = 40;

    const bottomLimit =
      height - bill.height - 40;

    bill.targetY = Math.max(
      topLimit,
      Math.min(
        bottomLimit,
        bill.targetY
      )
    );
  }

  // =====================================
  // GAME ENTITIES
  // Handles hazards and collectibles.
  // =====================================

  const activeEntities = [];

  // =====================================
  // BEER COUNT, PICKUP EFFECTS, AND NEAR MISSES
  // =====================================

  let score = 0;
  let displayedScore = 0;

  const pickupParticles = [];
  const floatingNumbers = [];
  const pickupFlashes = [];

  let screenShake = 0;
  let billPickupBounce = 0;
  let scorePulse = 0;

  function resetPickupEffects() {
    score = 0;
    displayedScore = 0;

    pickupParticles.length = 0;
    floatingNumbers.length = 0;
    pickupFlashes.length = 0;

    screenShake = 0;
    billPickupBounce = 0;
    scorePulse = 0;
  }

  // =====================================
  // HAZARD SPAWNING
  // =====================================

  let nextObstacleSpawnAt = 0;

  const MIN_SPAWN_DELAY = 1700;
  const MAX_SPAWN_DELAY = 3000;

  function getRandomSpawnDelay() {
    const minimumDelay =
      chapterNumber === 1 && chapter1EasierRetry
        ? 2700
        : MIN_SPAWN_DELAY;

    const maximumDelay =
      chapterNumber === 1 && chapter1EasierRetry
        ? 4500
        : MAX_SPAWN_DELAY;

    return (
      minimumDelay +
      Math.random() *
        (maximumDelay - minimumDelay)
    );
  }

  // =====================================
  // COLLECTIBLE SPAWNING
  // =====================================

  let nextCollectibleSpawnAt = 0;

  const MIN_COLLECTIBLE_SPAWN_DELAY = 700;
  const MAX_COLLECTIBLE_SPAWN_DELAY = 1400;

  function getRandomCollectibleSpawnDelay() {
    return (
      MIN_COLLECTIBLE_SPAWN_DELAY +
      Math.random() *
        (
          MAX_COLLECTIBLE_SPAWN_DELAY -
          MIN_COLLECTIBLE_SPAWN_DELAY
        )
    );
  }

  // =====================================
  // ENTITY RESET
  // =====================================

  function resetObstacles() {
    activeEntities.length = 0;

    nextObstacleSpawnAt =
      performance.now() +
      (
        chapterNumber === 1 && chapter1EasierRetry
          ? 2200
          : 1200
      );

    nextCollectibleSpawnAt =
      performance.now() + 500;
  }

  // =====================================
  // HAZARD CREATION
  // =====================================

  function spawnObstacle(now) {
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
      The falling drunk is marked "vertical"
      in story.js, but the engine converts him
      into a fast diagonal hazard.
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
        chapterNumber === 1 && chapter1EasierRetry
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

      nextObstacleSpawnAt =
        now + getRandomSpawnDelay();

      return;
    }

    /*
      Woman and drink pal stay aligned
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
        chapterNumber === 1 && chapter1EasierRetry
          ? (definition.speed || 4) * 0.62
          : definition.speed || 4
    });

    nextObstacleSpawnAt =
      now + getRandomSpawnDelay();
  }

  // =====================================
  // COLLECTIBLE CREATION
  // =====================================

  function spawnCollectible(now) {
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

    nextCollectibleSpawnAt =
      now +
      getRandomCollectibleSpawnDelay();
  }

  // =====================================
  // HAZARD MOVEMENT
  // =====================================

  function updateObstacles(now) {
    if (now >= nextObstacleSpawnAt) {
      spawnObstacle(now);
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
  }

  // =====================================
  // COLLECTIBLE MOVEMENT
  // =====================================

  function updateCollectibles(now) {
    if (now >= nextCollectibleSpawnAt) {
      spawnCollectible(now);
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
  }

  // =====================================
  // HAZARD DRAWING
  // =====================================

  function drawObstacles() {
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
  }

  // =====================================
  // COLLECTIBLE DRAWING
  // =====================================

  function drawCollectibles() {
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
        remain visible even if an image path
        or filename is wrong.
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
  }

  // =====================================
  // PICKUP EFFECT CREATION
  // =====================================

  function createPickupEffects(
    entity,
    meterAmount,
    effectStrength
  ) {
    const centerX =
      entity.x + entity.width / 2;

    const centerY =
      entity.y + entity.height / 2;

    /*
      Every beer collectible adds exactly one
      to the ONE MORE meter.

      The original collectible value is still
      used only to control how dramatic the
      particles, flash, and screen shake feel.
    */

    const particleCount =
      12 +
      Math.min(
        18,
        effectStrength * 2
      );

    for (
      let index = 0;
      index < particleCount;
      index += 1
    ) {
      const angle =
        Math.random() * Math.PI * 2;

      const speed =
        1.8 + Math.random() * 4.8;

      pickupParticles.push({
        x: centerX,
        y: centerY,
        velocityX:
          Math.cos(angle) * speed,
        velocityY:
          Math.sin(angle) * speed - 1.2,
        gravity: 0.13 + Math.random() * 0.08,
        size: 3 + Math.floor(Math.random() * 6),
        life: 1,
        decay: 0.025 + Math.random() * 0.025,
        rotation: Math.random() * Math.PI,
        rotationSpeed:
          (Math.random() - 0.5) * 0.35,
        color:
          Math.random() > 0.45
            ? "#ffd84d"
            : "#ffffff"
      });
    }

    /*
      Small beer pickups rely on the particles,
      flash, bounce, and beer counter.

      Larger pickups get a short arcade-style
      celebration word—never a point value.
    */

    let pickupWord = "";

    if (effectStrength >= 10) {
      pickupWord = "JACKPOT!";
    } else if (effectStrength >= 6) {
      pickupWord = "BIG HAUL!";
    } else if (effectStrength >= 3) {
      pickupWord = "NICE!";
    }

    if (pickupWord) {
      floatingNumbers.push({
        x: centerX,
        y: centerY - entity.height * 0.15,
        text: pickupWord,
        life: 1,
        velocityY: -1.6,
        scale: 0.65,
        color: "#ffffff"
      });
    }

    pickupFlashes.push({
      x: centerX,
      y: centerY,
      radius: 8,
      life: 1
    });

    screenShake = Math.max(
      screenShake,
      4 +
      Math.min(
        7,
        effectStrength * 0.6
      )
    );

    billPickupBounce = 1;
    scorePulse = 1;
  }

  // =====================================
  // PICKUP EFFECT MOVEMENT
  // =====================================

  function updatePickupEffects() {
    displayedScore +=
      (score - displayedScore) * 0.22;

    if (Math.abs(score - displayedScore) < 0.05) {
      displayedScore = score;
    }

    screenShake *= 0.82;
    billPickupBounce *= 0.82;
    scorePulse *= 0.84;

    for (
      let index = pickupParticles.length - 1;
      index >= 0;
      index -= 1
    ) {
      const particle = pickupParticles[index];

      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += particle.gravity;
      particle.velocityX *= 0.985;
      particle.rotation += particle.rotationSpeed;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        pickupParticles.splice(index, 1);
      }
    }

    for (
      let index = floatingNumbers.length - 1;
      index >= 0;
      index -= 1
    ) {
      const number = floatingNumbers[index];

      number.y += number.velocityY;
      number.velocityY *= 0.96;
      number.life -= 0.022;
      number.scale += (1 - number.scale) * 0.2;

      if (number.life <= 0) {
        floatingNumbers.splice(index, 1);
      }
    }

    for (
      let index = pickupFlashes.length - 1;
      index >= 0;
      index -= 1
    ) {
      const flash = pickupFlashes[index];

      flash.radius += 3.8;
      flash.life -= 0.065;

      if (flash.life <= 0) {
        pickupFlashes.splice(index, 1);
      }
    }
  }

  // =====================================
  // PICKUP EFFECT DRAWING
  // =====================================

  function drawPickupEffects() {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (const flash of pickupFlashes) {
      ctx.globalAlpha = flash.life * 0.7;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(
        flash.x,
        flash.y,
        flash.radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.globalAlpha = flash.life * 0.35;
      ctx.fillStyle = "#ffe56b";

      ctx.beginPath();
      ctx.arc(
        flash.x,
        flash.y,
        flash.radius * 0.55,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    for (const particle of pickupParticles) {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      const size = particle.size;

      ctx.fillStyle =
        particle.color || "#ffffff";

      ctx.fillRect(
        -size / 2,
        -size / 2,
        size,
        size
      );

      ctx.restore();
    }

    for (const number of floatingNumbers) {
      ctx.save();
      ctx.globalAlpha = number.life;
      ctx.translate(number.x, number.y);
      ctx.scale(number.scale, number.scale);

      ctx.font = "bold 27px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#000000";
      ctx.fillStyle =
        number.color || "#ffffff";

      ctx.strokeText(number.text, 0, 0);
      ctx.fillText(number.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }

  // =====================================
  // COLLISION HELPERS
  // =====================================

  function rectanglesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // =====================================
  // NEAR MISS EFFECTS
  // =====================================

  function createNearMissEffects(
    entity,
    billHitbox
  ) {
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

    /*
      Near misses should feel exciting,
      but less powerful than grabbing
      a large beer collectible.
    */

    screenShake = Math.max(
      screenShake,
      2.5
    );

    billPickupBounce = Math.max(
      billPickupBounce,
      0.45
    );
  }

  // =====================================
  // HAZARD COLLISIONS
  // =====================================

  function checkObstacleCollisions() {
    /*
      Reduced hitboxes prevent transparent
      areas, speech bubbles, hats and bottles
      from causing unfair collisions.
    */

    const easierChapter1Retry =
      chapterNumber === 1 && chapter1EasierRetry;

    const billHitbox = {
      x:
        bill.x +
        bill.width *
          (easierChapter1Retry ? 0.37 : 0.3),

      y:
        bill.y +
        bill.height *
          (easierChapter1Retry ? 0.33 : 0.25),

      width:
        bill.width *
          (easierChapter1Retry ? 0.26 : 0.4),

      height:
        bill.height *
          (easierChapter1Retry ? 0.34 : 0.5)
    };

    for (const entity of activeEntities) {
      if (entity.type !== "hazard") {
        continue;
      }

      const entityHitbox = {
        x:
          entity.x +
          entity.width *
            (easierChapter1Retry ? 0.4 : 0.32),

        y:
          entity.y +
          entity.height *
            (easierChapter1Retry ? 0.44 : 0.38),

        width:
          entity.width *
            (easierChapter1Retry ? 0.2 : 0.36),

        height:
          entity.height *
            (easierChapter1Retry ? 0.32 : 0.48)
      };

      /*
        A real collision still restarts
        the gameplay immediately.
      */

      if (
        rectanglesOverlap(
          billHitbox,
          entityHitbox
        )
      ) {
        if (chapterNumber === 1) {
          chapter1EasierRetry = true;
        }

        playCrashFeedback();
        restartGameplay();
        return;
      }

      /*
        The near-miss zone surrounds the
        real hazard hitbox by a small margin.
      */

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
        rectanglesOverlap(
          billHitbox,
          nearMissZone
        )
      ) {
        entity.nearMissArmed = true;
      }

      /*
        Once the hazard has passed Bill,
        reward the close escape exactly once.
      */

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

        createNearMissEffects(
          entity,
          billHitbox
        );
      }
    }
  }

  // =====================================
  // COLLECTIBLE COLLISIONS
  // =====================================

  function checkCollectibleCollisions() {
    const billHitbox = {
      x: bill.x + bill.width * 0.22,
      y: bill.y + bill.height * 0.18,
      width: bill.width * 0.56,
      height: bill.height * 0.64
    };

    for (
      let index = activeEntities.length - 1;
      index >= 0;
      index -= 1
    ) {
      const entity = activeEntities[index];

      if (entity.type !== "collectible") {
        continue;
      }

      const collectibleHitbox = {
        x: entity.x + entity.width * 0.12,
        y: entity.y + entity.height * 0.12,
        width: entity.width * 0.76,
        height: entity.height * 0.76
      };

      if (
        !rectanglesOverlap(
          billHitbox,
          collectibleHitbox
        )
      ) {
        continue;
      }

      const effectStrength =
        Number(entity.definition.value) || 1;

      /*
        Every mug, six-pack, twelve-pack,
        or crate advances the meter by one.
      */

      score += 1;

      playPickupFeedback(
        effectStrength
      );

      createPickupEffects(
        entity,
        1,
        effectStrength
      );

      activeEntities.splice(index, 1);
    }
  }

  // =====================================
  // GAMEPLAY RESTART
  // =====================================

  function resetTreatmentGame(now = performance.now()) {
    treatmentHits = 0;
    treatmentMisses = 0;
    treatmentFailedLabel = "";
    treatmentParticles.length = 0;
    treatmentOverloadTriggered = false;
    treatmentNextCueAt = now + (treatmentAttempt === 1 ? 500 : 650);

    for (const slot of treatmentSlots) {
      slot.active = false;
      slot.warningAt = 0;
      slot.expiresAt = 0;
      slot.flash = 0;
    }
  }

  function restartGameplay() {
    resetBill();
    resetObstacles();
    resetPickupEffects();

    backgroundOffset = 0;
    chapterFinished = false;

    chapterTimer =
      engine.createTimer(0);

    gameplayStartedAt = performance.now();

    if (isTreatmentLevel) {
      resetTreatmentGame(gameplayStartedAt);
    }

    gameState = "playing";
  }

  // =====================================
  // STATE CHANGES
  // =====================================

  function showChapter1CutScene() {
    if (!chapter1CutSceneEnabled) {
      showTitleScreen();
      return;
    }

    chapter1CutSceneStartedAt = performance.now();
    chapter1CutSceneFinishedAt = 0;
    gameState = "chapter1CutScene";
  }

  function finishChapter1CutScene() {
    chapter1CutSceneFinishedAt = 0;

    if (chapterNumber === 2) {
      showStoryCards();
      return;
    }

    gameState = "title";
  }

  function showTitleScreen() {
    if (skipIntro) {
      showStoryCards();
      return;
    }
    gameState = "title";
  }

  function showStoryCards() {
    currentCardIndex = 0;
    gameState = "story";
  }

  function startGameplay() {
    resetBill();
    resetObstacles();
    resetPickupEffects();

    chapterFinished = false;
    backgroundOffset = 0;

    chapterTimer =
      engine.createTimer(0);

    gameplayStartedAt = performance.now();

    if (isTreatmentLevel) {
      treatmentAttempt += 1;
      resetTreatmentGame(gameplayStartedAt);
    }

    gameState = "playing";

    /*
      Start the background music only when
      Bill's 30-second gameplay begins.
    */

    startBackgroundMusicForGameplay();
  }

  function finishChapter() {
    chapterFinished = true;
    stopBackgroundMusic(false);
    gameState = "finished";
  }

  function continueToNextChapter() {
    const nextChapterNumber =
      chapterNumber + 1;

    const nextChapter =
      engine.getChapter(
        nextChapterNumber - 1
      );

    /*
      As soon as Chapter 2 exists in story.js,
      tapping the finished screen loads it.

      Until then, the finished screen remains
      in place instead of opening a broken page.
    */

    if (!nextChapter) {
      return;
    }

    const nextUrl =
      new URL(window.location.href);

    nextUrl.searchParams.set(
      "chapter",
      String(nextChapterNumber)
    );

    nextUrl.searchParams.set(
      "skipIntro",
      "1"
    );

    window.location.href =
      nextUrl.toString();
  }

  // =====================================
  // STORY CARD HELPERS
  // =====================================

  function getStoryCards() {
    if (
      !Array.isArray(
        currentChapter?.cards
      )
    ) {
      return [];
    }

    return currentChapter.cards;
  }

  function getCurrentStoryCard() {
    const cards = getStoryCards();

    return (
      cards[currentCardIndex] ||
      null
    );
  }

  function advanceStoryCard() {
    const cards = getStoryCards();

    currentCardIndex += 1;

    if (
      currentCardIndex >=
      cards.length
    ) {
      startGameplay();
    }
  }

  // =====================================
  // CHAPTER 2 TREATMENT MINI-GAME
  // =====================================

  function getTreatmentLayout() {
    const margin = Math.max(14, Math.min(24, width * 0.045));
    const gap = Math.max(12, Math.min(20, width * 0.04));
    const top = 118;
    const bottomMargin = 26;
    const slotWidth = (width - margin * 2 - gap) / 2;
    const slotHeight = (height - top - bottomMargin - gap) / 2;

    return treatmentSlots.map((slot, index) => ({
      slot,
      x: margin + (index % 2) * (slotWidth + gap),
      y: top + Math.floor(index / 2) * (slotHeight + gap),
      width: slotWidth,
      height: slotHeight
    }));
  }

  function activateTreatmentCue(now) {
    const elapsed = Math.max(0, now - gameplayStartedAt);
    const progress = Math.min(1, elapsed / treatmentDurationMs);
    const isFirstAttempt = treatmentAttempt === 1;
    const activeCount = treatmentSlots.filter(slot => slot.active).length;

    /*
      On the first treatment attempt, cues arrive in clusters instead
      of appearing one at a time. Early clusters contain two treatments,
      middle clusters contain two or three, and late clusters can light
      all four cards. Retry attempts keep the easier original pacing.
    */

    let targetActive;

    if (isFirstAttempt) {
      if (progress < 0.24) {
        targetActive = 2;
      } else if (progress < 0.62) {
        targetActive = Math.random() < 0.42 ? 3 : 2;
      } else {
        targetActive = Math.random() < 0.38 ? 4 : 3;
      }
    } else {
      targetActive = progress < 0.40 ? 1 : progress < 0.78 ? 2 : 3;
    }

    const inactive = treatmentSlots
      .filter(slot => !slot.active)
      .sort(() => Math.random() - 0.5);

    const numberToActivate = Math.max(
      0,
      Math.min(inactive.length, targetActive - activeCount)
    );

    for (const slot of inactive.slice(0, numberToActivate)) {
      const visibleFor = isFirstAttempt
        ? Math.max(1450, 2150 - progress * 650)
        : 2700 - progress * 800;
      const warningFor = Math.min(1000, visibleFor * 0.44);

      slot.active = true;
      slot.warningAt = now + visibleFor - warningFor;
      slot.expiresAt = now + visibleFor;
      slot.flash = 1;
    }

    const nextDelay = isFirstAttempt
      ? 980 - progress * 430
      : 1250 - progress * 650;

    treatmentNextCueAt = now + Math.max(isFirstAttempt ? 520 : 600, nextDelay);
  }

  function triggerFirstAttemptTreatmentOverload(now, progress) {
    if (
      treatmentAttempt !== 1 ||
      treatmentOverloadTriggered ||
      progress < 0.38
    ) {
      return;
    }

    treatmentOverloadTriggered = true;

    const inactive = treatmentSlots
      .filter(slot => !slot.active)
      .sort(() => Math.random() - 0.5);

    const needed = Math.max(0, 3 - treatmentSlots.filter(slot => slot.active).length);

    for (const slot of inactive.slice(0, needed)) {
      const visibleFor = 1650;
      const warningFor = 720;
      slot.active = true;
      slot.warningAt = now + visibleFor - warningFor;
      slot.expiresAt = now + visibleFor;
      slot.flash = 1.35;
    }

    treatmentNextCueAt = Math.max(treatmentNextCueAt, now + 780);
  }

  function updateTreatmentParticles() {
    for (let i = treatmentParticles.length - 1; i >= 0; i -= 1) {
      const particle = treatmentParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.12;
      particle.life -= 1;
      particle.size *= 0.97;

      if (particle.life <= 0 || particle.size < 0.7) {
        treatmentParticles.splice(i, 1);
      }
    }
  }

  function createTreatmentExplosion(item, label) {
    const centerX = item.x + item.width / 2;
    const centerY = item.y + item.height / 2;
    const colors = label === "BELLADONNA!"
      ? ["#9cff8f", "#ffffff", "#ffe56b", "#4ee26b"]
      : ["#ffffff", "#ffe56b", "#d8c69e", "#f2a900"];

    for (let i = 0; i < 34; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 5.4;
      treatmentParticles.push({
        x: centerX + (Math.random() - 0.5) * 24,
        y: centerY + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.4,
        size: 3 + Math.random() * 6,
        life: 22 + Math.floor(Math.random() * 18),
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function failTreatment(slot) {
    treatmentMisses += 1;
    treatmentFailedLabel = slot.label;
    slot.active = false;
    slot.warningAt = 0;
    slot.expiresAt = 0;
    stopBackgroundMusic(true);
    gameState = "treatmentFailed";
  }

  function updateTreatmentGame(now) {
    updateTreatmentParticles();

    const elapsed = Math.max(0, now - gameplayStartedAt);
    const progress = Math.min(1, elapsed / treatmentDurationMs);

    triggerFirstAttemptTreatmentOverload(now, progress);

    if (now >= treatmentNextCueAt) {
      activateTreatmentCue(now);
    }

    for (const slot of treatmentSlots) {
      slot.flash *= 0.82;

      if (slot.active && now >= slot.expiresAt) {
        failTreatment(slot);
        return;
      }
    }
  }

  function tapTreatmentSlot(clientX, clientY) {
    for (const item of getTreatmentLayout()) {
      const inside =
        clientX >= item.x &&
        clientX <= item.x + item.width &&
        clientY >= item.y &&
        clientY <= item.y + item.height;

      if (!inside || !item.slot.active) {
        continue;
      }

      createTreatmentExplosion(item, item.slot.label);
      item.slot.active = false;
      item.slot.warningAt = 0;
      item.slot.expiresAt = 0;
      item.slot.flash = 1.4;
      treatmentHits += 1;
      playPickupFeedback(item.slot.label === "BELLADONNA!" ? 6 : 2);
      return true;
    }

    return false;
  }

  function drawImageCoverInRect(image, x, y, targetWidth, targetHeight) {
    if (
      !image ||
      !image.complete ||
      image.naturalWidth <= 0 ||
      image.naturalHeight <= 0
    ) {
      return false;
    }

    const scale = Math.max(
      targetWidth / image.naturalWidth,
      targetHeight / image.naturalHeight
    );
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = x + (targetWidth - drawWidth) / 2;
    const drawY = y + (targetHeight - drawHeight) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, targetWidth, targetHeight);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
    return true;
  }

  function drawTreatmentGame() {
    const backgroundWasDrawn =
      drawCoverImage(backgroundImage);

    if (!backgroundWasDrawn) {
      ctx.fillStyle = "#17202a";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#253746";
      ctx.fillRect(0, height * 0.58, width, height * 0.42);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.fillRect(0, 0, width, height);

    for (const item of getTreatmentLayout()) {
      const slot = item.slot;
      const now = performance.now();
      const warning = slot.active && now >= slot.warningAt;
      const blinkOn = !warning || Math.floor(now / 105) % 2 === 0;
      const inset = slot.active ? 0 : 5;

      ctx.fillStyle = "#080b0e";
      ctx.fillRect(item.x - 4, item.y - 4, item.width + 8, item.height + 8);

      const imageX = item.x + inset;
      const imageY = item.y + inset;
      const imageWidth = item.width - inset * 2;
      const imageHeight = item.height - inset * 2;
      const treatmentImage = treatmentImages.get(slot.label);
      const imageWasDrawn = drawImageCoverInRect(
        treatmentImage,
        imageX,
        imageY,
        imageWidth,
        imageHeight
      );

      if (!imageWasDrawn) {
        ctx.fillStyle = slot.active ? "#d8c69e" : "#35424c";
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
      }

      ctx.fillStyle = slot.active
        ? (warning && blinkOn
            ? "rgba(207, 62, 62, 0.58)"
            : "rgba(0, 0, 0, 0.10)")
        : "rgba(5, 10, 14, 0.70)";
      ctx.fillRect(imageX, imageY, imageWidth, imageHeight);

      ctx.strokeStyle = slot.active
        ? (warning ? (blinkOn ? "#ffffff" : "#ff5757") : "#fff2a8")
        : "#65737e";
      ctx.lineWidth = slot.active ? (warning ? 7 : 5) : 2;
      ctx.strokeRect(item.x, item.y, item.width, item.height);

      if (!slot.active) {
        continue;
      }

      const pulse = 1 + Math.sin(performance.now() * 0.018) * 0.02 + slot.flash * 0.012;
      const fontSize = Math.max(17, Math.min(25, item.width * 0.082));
      const bannerHeight = Math.max(42, Math.min(54, item.height * 0.24));
      const bannerX = item.x + 10;
      const bannerY = item.y + item.height - bannerHeight - 10;
      const bannerWidth = item.width - 20;
      const cornerRadius = 8;

      ctx.save();
      ctx.translate(item.x + item.width / 2, bannerY + bannerHeight / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(-(item.x + item.width / 2), -(bannerY + bannerHeight / 2));

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, cornerRadius);
      ctx.fillStyle = warning
        ? (blinkOn ? "rgba(150, 20, 20, 0.92)" : "rgba(72, 8, 8, 0.94)")
        : "rgba(8, 12, 16, 0.88)";
      ctx.fill();

      ctx.strokeStyle = warning
        ? (blinkOn ? "#ffdfdf" : "#ff6b6b")
        : "rgba(255, 242, 168, 0.92)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = warning
        ? (blinkOn ? "#ffffff" : "#ffd1d1")
        : "#fff7dc";
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillText(slot.label, item.x + item.width / 2, bannerY + bannerHeight / 2 + 1, bannerWidth - 18);
      ctx.restore();
    }

    for (const particle of treatmentParticles) {
      ctx.globalAlpha = Math.max(0, particle.life / 40);
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        Math.round(particle.x),
        Math.round(particle.y),
        Math.max(1, Math.round(particle.size)),
        Math.max(1, Math.round(particle.size))
      );
    }
    ctx.globalAlpha = 1;
  }

  function drawTreatmentFailed() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(0, 0, width, height);

    const boxWidth = Math.min(350, width - 34);
    const boxHeight = 218;
    const boxX = (width - boxWidth) / 2;
    const boxY = (height - boxHeight) / 2;

    ctx.fillStyle = "#080b0e";
    ctx.fillRect(boxX - 5, boxY - 5, boxWidth + 10, boxHeight + 10);
    ctx.fillStyle = "#b52f2f";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px Arial, Helvetica, sans-serif";
    ctx.fillText("TREATMENT RESTART", width / 2, boxY + 51, boxWidth - 24);
    ctx.fillText("REQUIRED", width / 2, boxY + 84, boxWidth - 24);

    ctx.font = "700 14px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#ffe6e6";
    ctx.fillText(`${treatmentFailedLabel} WAS MISSED`, width / 2, boxY + 122, boxWidth - 28);

    const buttonX = boxX + 28;
    const buttonY = boxY + 151;
    const buttonWidth = boxWidth - 56;
    const buttonHeight = 46;
    ctx.fillStyle = "#f2a900";
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.font = "900 18px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText("RESTART TREATMENT", width / 2, buttonY + buttonHeight / 2 + 1);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // =====================================
  // INPUT
  // =====================================

  function handlePrimaryAction(event) {
    if (gameState === "chapter1CutScene") {
      if (
        !event ||
        typeof event.clientX !== "number" ||
        typeof event.clientY !== "number" ||
        chapter1CutSceneSkipButtonContains(
          event.clientX,
          event.clientY
        )
      ) {
        playClickFeedback();
        finishChapter1CutScene();
      }

      return;
    }

    if (gameState === "title") {
      playClickFeedback();
      showStoryCards();
      return;
    }

    if (gameState === "story") {
      playClickFeedback();
      advanceStoryCard();
      return;
    }

    if (gameState === "finished") {
      playClickFeedback();
      continueToNextChapter();
      return;
    }

    if (gameState === "treatmentFailed") {
      playClickFeedback();
      startGameplay();
      return;
    }

    if (gameState !== "playing") {
      return;
    }

    if (
      isTreatmentLevel &&
      event &&
      typeof event.clientX === "number" &&
      typeof event.clientY === "number"
    ) {
      tapTreatmentSlot(event.clientX, event.clientY);
      return;
    }

    if (
      event &&
      typeof event.clientY ===
        "number"
    ) {
      bill.targetY =
        event.clientY -
        bill.height / 2;

      keepBillOnScreen();
    }
  }

  canvas.style.touchAction = "none";

canvas.addEventListener(
  "pointerdown",
  (event) => {
    canvas.setPointerCapture(event.pointerId);
    handlePrimaryAction(event);
  }
);

  canvas.addEventListener(
  "pointermove",
  (event) => {
    if (gameState !== "playing" || isTreatmentLevel) {
      return;
    }

    if (
      event.pointerType === "mouse" &&
      event.buttons === 0
    ) {
      return;
    }

    event.preventDefault();

    bill.targetY =
      event.clientY - bill.height / 2;

    keepBillOnScreen();
  }
);

  window.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        if (
          gameState === "chapter1CutScene" ||
          gameState === "title" ||
          gameState === "story" ||
          gameState === "finished"
        ) {
          event.preventDefault();

          handlePrimaryAction();

          return;
        }
      }

      if (
        gameState !== "playing"
      ) {
        return;
      }

      if (
        event.key === "ArrowUp"
      ) {
        bill.targetY -= 70;
      }

      if (
        event.key === "ArrowDown"
      ) {
        bill.targetY += 70;
      }

      keepBillOnScreen();
    }
  );

  // =====================================
  // IMAGE DRAWING HELPER
  // =====================================

  function drawContainedImage(image) {
    if (
      !image.complete ||
      image.naturalWidth <= 0
    ) {
      return;
    }

    const scale = Math.min(
      width /
        image.naturalWidth,

      height /
        image.naturalHeight
    );

    const drawWidth =
      image.naturalWidth * scale;

    const drawHeight =
      image.naturalHeight * scale;

    const drawX =
      (width - drawWidth) / 2;

    const drawY =
      (height - drawHeight) / 2;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      image,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  function drawCoverImage(image) {
    if (
      !image.complete ||
      image.naturalWidth <= 0 ||
      image.naturalHeight <= 0
    ) {
      return false;
    }

    const scale = Math.max(
      width / image.naturalWidth,
      height / image.naturalHeight
    );

    const drawWidth =
      image.naturalWidth * scale;

    const drawHeight =
      image.naturalHeight * scale;

    const drawX =
      (width - drawWidth) / 2;

    const drawY =
      (height - drawHeight) / 2;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      image,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );

    return true;
  }

  // =====================================
  // BACKGROUND
  // =====================================

  function backgroundImageIsReady() {
    return (
      backgroundImage.complete &&
      backgroundImage.naturalWidth >
        0 &&
      backgroundImage.naturalHeight >
        0
    );
  }

  function getBackgroundDrawSize() {
    if (!backgroundImageIsReady()) {
      return {
        width: 0,
        height: 0
      };
    }

    const scale =
      height /
      backgroundImage.naturalHeight;

    return {
      width:
        backgroundImage.naturalWidth *
        scale,

      height
    };
  }

  function updateBackground() {
    backgroundOffset -=
      BACKGROUND_SCROLL_SPEED;

    if (
      !backgroundImageIsReady()
    ) {
      if (
        backgroundOffset <= -140
      ) {
        backgroundOffset += 140;
      }

      return;
    }

    const backgroundSize =
      getBackgroundDrawSize();

    if (
      backgroundSize.width <= 0
    ) {
      return;
    }

    while (
      backgroundOffset <=
      -backgroundSize.width
    ) {
      backgroundOffset +=
        backgroundSize.width;
    }
  }

  function drawImageBackground() {
    const backgroundSize =
      getBackgroundDrawSize();

    if (
      backgroundSize.width <= 0 ||
      backgroundSize.height <= 0
    ) {
      return false;
    }

    ctx.imageSmoothingEnabled = false;

    let drawX = backgroundOffset;

    while (drawX > 0) {
      drawX -=
        backgroundSize.width;
    }

    while (drawX < width) {
      ctx.drawImage(
        backgroundImage,
        drawX,
        0,
        backgroundSize.width,
        backgroundSize.height
      );

      drawX +=
        backgroundSize.width;
    }

    return true;
  }

  function drawFallbackBackground() {
    ctx.fillStyle = "#172330";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.fillStyle = "#263747";

    ctx.fillRect(
      0,
      height * 0.65,
      width,
      height * 0.35
    );

    ctx.fillStyle = "#10171d";

    let buildingNumber = 0;

    for (
      let x =
        backgroundOffset - 140;
      x < width + 140;
      x += 140
    ) {
      const buildingHeight =
        130 +
        (
          Math.abs(
            buildingNumber
          ) % 3
        ) *
          40;

      ctx.fillRect(
        x,
        height * 0.65 -
          buildingHeight,
        110,
        buildingHeight
      );

      buildingNumber += 1;
    }

    ctx.fillStyle = "#ffd66b";

    for (
      let x =
        backgroundOffset - 115;
      x < width + 140;
      x += 140
    ) {
      ctx.fillRect(
        x,
        height * 0.65 - 95,
        15,
        20
      );

      ctx.fillRect(
        x + 40,
        height * 0.65 - 60,
        15,
        20
      );
    }
  }

  function drawBackground() {
    const imageWasDrawn =
      drawImageBackground();

    if (!imageWasDrawn) {
      drawFallbackBackground();
    }
  }

  // =====================================
  // PLAYER DRAWING
  // =====================================

  function drawBill() {
    ctx.imageSmoothingEnabled = false;

    const bounceScale =
      1 + billPickupBounce * 0.08;

    const drawWidth =
      bill.width * bounceScale;

    const drawHeight =
      bill.height *
      (1 - billPickupBounce * 0.05);

    const drawX =
      bill.x - (drawWidth - bill.width) / 2;

    const drawY =
      bill.y + (bill.height - drawHeight) / 2;

    if (
      billImage.complete &&
      billImage.naturalWidth > 0
    ) {
      ctx.drawImage(
        billImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      return;
    }

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  // =====================================
  // SPLASH SCREEN
  // =====================================

  function updateSplash(now) {
    const elapsed =
      now - splashStartedAt;

    if (
      elapsed >=
      SPLASH_HOLD_MS +
        SPLASH_FADE_MS
    ) {
      showChapter1CutScene();
    }
  }

  function drawSplashScreen(now) {
    ctx.fillStyle = "#000000";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    const elapsed =
      now - splashStartedAt;

    let opacity = 1;

    if (
      elapsed >
      SPLASH_HOLD_MS
    ) {
      const fadeProgress =
        (
          elapsed -
          SPLASH_HOLD_MS
        ) /
        SPLASH_FADE_MS;

      opacity = Math.max(
        0,
        1 - fadeProgress
      );
    }

    ctx.save();

    ctx.globalAlpha = opacity;

    drawContainedImage(
      splashImage
    );

    ctx.restore();
  }

  // =====================================
  // CHAPTER 1 OPENING CUT SCENE
  // =====================================

  function getChapter1CutSceneSkipButton() {
    const buttonWidth = Math.min(124, width * 0.28);
    const buttonHeight = 44;
    const margin = 16;

    return {
      x: width - buttonWidth - margin,
      y: height - buttonHeight - margin,
      width: buttonWidth,
      height: buttonHeight
    };
  }

  function chapter1CutSceneSkipButtonContains(x, y) {
    const button = getChapter1CutSceneSkipButton();

    return (
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height
    );
  }

  function wrapChapter1CutSceneLine(textLine, maxCharacters) {
    if (!textLine) {
      return [""];
    }

    const words = textLine.split(/\s+/);
    const wrapped = [];
    let current = "";

    for (const word of words) {
      const candidate = current
        ? `${current} ${word}`
        : word;

      if (
        current &&
        candidate.length > maxCharacters
      ) {
        wrapped.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      wrapped.push(current);
    }

    return wrapped;
  }

  function getChapter1CutSceneLines() {
    const maxCharacters =
      width < 520 ? 28 : 42;

    const lines = [];

    for (const paragraph of chapter1CutSceneText) {
      lines.push(
        ...wrapChapter1CutSceneLine(
          paragraph,
          maxCharacters
        )
      );
    }

    return lines;
  }

  function updateChapter1CutScene(now) {
    if (!chapter1CutSceneStartedAt) {
      chapter1CutSceneStartedAt = now;
    }

    const lines = getChapter1CutSceneLines();
    const baseFontSize =
      Math.max(25, Math.min(42, width * 0.057));
    const lineSpacing = baseFontSize * 1.28;
    const elapsedSeconds =
      (now - chapter1CutSceneStartedAt) / 1000;
    const crawlTop =
      height * 0.93 -
      elapsedSeconds *
        CHAPTER_1_CUT_SCENE_SCROLL_SPEED;
    const lastLineY =
      crawlTop +
      Math.max(0, lines.length - 1) *
        lineSpacing;

    if (lastLineY > height * 0.18) {
      chapter1CutSceneFinishedAt = 0;
      return;
    }

    if (!chapter1CutSceneFinishedAt) {
      chapter1CutSceneFinishedAt = now;
      return;
    }

    if (
      now - chapter1CutSceneFinishedAt >=
      CHAPTER_1_CUT_SCENE_END_HOLD_MS
    ) {
      finishChapter1CutScene();
    }
  }

  function drawChapter1CutSceneStars(now) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    for (const star of chapter1CutSceneStars) {
      const twinkle =
        0.48 +
        Math.sin(
          now * 0.0017 + star.phase
        ) *
          0.22;

      ctx.globalAlpha = Math.max(0.18, twinkle);
      ctx.fillStyle = "#ffffff";

      const starSize =
        Math.max(1, star.size);

      ctx.fillRect(
        star.x * width,
        star.y * height,
        starSize,
        starSize
      );
    }

    ctx.globalAlpha = 1;
  }

  function drawChapter1CutScene(now) {
    drawChapter1CutSceneStars(now);

    const lines = getChapter1CutSceneLines();
    const baseFontSize =
      Math.max(25, Math.min(42, width * 0.057));
    const lineSpacing = baseFontSize * 1.28;
    const elapsedSeconds =
      (now - chapter1CutSceneStartedAt) / 1000;
    const crawlTop =
      height * 0.93 -
      elapsedSeconds *
        CHAPTER_1_CUT_SCENE_SCROLL_SPEED;
    const horizonY = height * 0.115;
    const bottomY = height * 0.91;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(width * 0.42, horizonY);
    ctx.lineTo(width * 0.58, horizonY);
    ctx.lineTo(width * 0.96, bottomY);
    ctx.lineTo(width * 0.04, bottomY);
    ctx.closePath();
    ctx.clip();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let index = 0; index < lines.length; index += 1) {
      const virtualY =
        crawlTop + index * lineSpacing;

      if (
        virtualY < horizonY - lineSpacing ||
        virtualY > height + lineSpacing
      ) {
        continue;
      }

      const depth = Math.max(
        0,
        Math.min(
          1,
          (virtualY - horizonY) /
            Math.max(1, bottomY - horizonY)
        )
      );

      const perspectiveScale =
        0.34 + depth * 0.88;
      const screenY =
        horizonY +
        Math.pow(depth, 1.16) *
          (bottomY - horizonY);
      const fadeNearHorizon =
        Math.max(
          0,
          Math.min(1, (screenY - horizonY) / 95)
        );
      const fadeNearBottom =
        Math.max(
          0,
          Math.min(1, (height - screenY) / 75)
        );

      let fontWeight = "700";
      let fontSize = baseFontSize;

      if (index === 0) {
        fontWeight = "900";
        fontSize = baseFontSize * 1.18;
      } else if (index === 2) {
        fontWeight = "900";
        fontSize = baseFontSize * 0.96;
      }

      ctx.save();
      ctx.globalAlpha =
        Math.min(fadeNearHorizon, fadeNearBottom);
      ctx.translate(width / 2, screenY);
      ctx.scale(perspectiveScale, perspectiveScale);
      ctx.font =
        `${fontWeight} ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle =
        index === 0 || index === 2
          ? "#ffd84d"
          : "#fff2a8";
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 7;
      ctx.fillText(
        lines[index],
        0,
        0,
        width * 0.76 / perspectiveScale
      );
      ctx.restore();
    }

    ctx.restore();

    const button = getChapter1CutSceneSkipButton();

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(
      button.x,
      button.y,
      button.width,
      button.height
    );
    ctx.strokeStyle = "#fff2a8";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      button.x,
      button.y,
      button.width,
      button.height
    );
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 16px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#fff7dc";
    ctx.fillText(
      "SKIP",
      button.x + button.width / 2,
      button.y + button.height / 2 + 1
    );
    ctx.restore();
  }

  // =====================================
  // TITLE SCREEN
  // =====================================

  function drawTitleScreen() {
    ctx.fillStyle = "#000000";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    drawContainedImage(titleImage);

    const blink =
      Math.floor(
        performance.now() / 500
      ) %
        2 ===
      0;

    if (!blink) {
      return;
    }

    const boxWidth = Math.min(
      440,
      width - 30
    );

    const boxHeight = 54;

    const boxX =
      width / 2 -
      boxWidth / 2;

    const boxY =
      height -
      boxHeight -
      30;

    ctx.fillStyle =
      "rgba(0, 0, 0, 0.78)";

    ctx.fillRect(
      boxX,
      boxY,
      boxWidth,
      boxHeight
    );

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      boxX,
      boxY,
      boxWidth,
      boxHeight
    );

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "18px monospace";

    ctx.fillText(
      "CLICK, TAP, OR PRESS ENTER",
      width / 2,
      boxY + boxHeight / 2
    );

    ctx.textAlign = "left";
    ctx.textBaseline =
      "alphabetic";
  }

  // =====================================
  // GAME CARD
  // Copy this entire section next time
  // we change story-card appearance.
  // =====================================

  function wrapText(
    text,
    maxWidth
  ) {
    const paragraphs =
      String(text || "").split(
        "\n"
      );

    const lines = [];

    for (
      const paragraph of paragraphs
    ) {
      if (
        paragraph.trim() === ""
      ) {
        lines.push("");
        continue;
      }

      const words =
        paragraph.split(/\s+/);

      let line = "";

      for (const word of words) {
        const testLine =
          line.length > 0
            ? `${line} ${word}`
            : word;

        if (
          ctx.measureText(
            testLine
          ).width <= maxWidth
        ) {
          line = testLine;
        } else {
          if (line) {
            lines.push(line);
          }

          line = word;
        }
      }

      if (line) {
        lines.push(line);
      }
    }

    return lines;
  }

  function drawStoryCard() {
    const card =
      getCurrentStoryCard();

    ctx.fillStyle = "#000000";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    if (!card) {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "20px monospace";

      ctx.fillText(
        "No story card found.",
        width / 2,
        height / 2
      );

      ctx.textAlign = "left";

      return;
    }

    /*
      Cache card images so they are
      not recreated every frame.
    */

    if (
      !drawStoryCard.imageCache
    ) {
      drawStoryCard.imageCache =
        new Map();
    }

    let cardImage = null;

    if (card.image) {
      if (
        !drawStoryCard.imageCache.has(
          card.image
        )
      ) {
        const image =
          new Image();

        image.src = card.image;

        drawStoryCard.imageCache.set(
          card.image,
          image
        );
      }

      cardImage =
        drawStoryCard.imageCache.get(
          card.image
        );
    }

    const isMobile =
      width < 650;

    const cardWidth = Math.min(
      900,
      width - 20
    );

    const cardHeight = Math.min(
      isMobile
        ? height - 20
        : 540,

      height - 20
    );

    const cardX =
      (width - cardWidth) / 2;

    const cardY =
      (height - cardHeight) / 2;

    /*
      Cream-colored card body.
    */

    ctx.fillStyle = "#d8c69e";

    ctx.fillRect(
      cardX,
      cardY,
      cardWidth,
      cardHeight
    );

    /*
      Dark SNES-style outer border.
    */

    ctx.strokeStyle = "#101828";
    ctx.lineWidth = 7;

    ctx.strokeRect(
      cardX,
      cardY,
      cardWidth,
      cardHeight
    );

    const title =
      card.title || "";

    // =====================================
    // MOBILE GAME CARD
    // =====================================

    if (isMobile) {
      const innerPadding = 10;

      const imageAreaX =
        cardX + innerPadding;

      const imageAreaY =
        cardY + innerPadding;

      const imageAreaWidth =
        cardWidth -
        innerPadding * 2;

      const imageAreaHeight =
        cardHeight * 0.48;

      /*
        Draw the entire card image without
        cropping it on mobile.
      */

      if (
        cardImage &&
        cardImage.complete &&
        cardImage.naturalWidth > 0
      ) {
        const scale = Math.max(
          imageAreaWidth /
            cardImage.naturalWidth,

          imageAreaHeight /
            cardImage.naturalHeight
        );

        const drawWidth =
          cardImage.naturalWidth *
          scale;

        const drawHeight =
          cardImage.naturalHeight *
          scale;

        const drawX =
          imageAreaX +
          (
            imageAreaWidth -
            drawWidth
          ) /
            2;

        const drawY =
          imageAreaY +
          (
            imageAreaHeight -
            drawHeight
          ) /
            2;

        ctx.save();

        ctx.beginPath();

        ctx.rect(
          imageAreaX,
          imageAreaY,
          imageAreaWidth,
          imageAreaHeight
        );

        ctx.clip();

        ctx.imageSmoothingEnabled =
          false;

        ctx.drawImage(
          cardImage,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );

        ctx.restore();
      }

      /*
        Title bar overlays the bottom
        of the picture.
      */

      const titleBarHeight = 40;

      const titleBarY =
        imageAreaY +
        imageAreaHeight -
        titleBarHeight;

      ctx.fillStyle = "#000000";

      ctx.fillRect(
        imageAreaX,
        titleBarY,
        imageAreaWidth,
        titleBarHeight
      );

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const titleFontSize =
        Math.max(
          13,
          Math.min(
            18,
            cardWidth * 0.045
          )
        );

      ctx.font =
        `bold ${titleFontSize}px monospace`;

      ctx.fillText(
        title.toUpperCase(),
        imageAreaX + 12,
        titleBarY +
          titleBarHeight / 2
      );

      /*
        Story text starts directly below
        the picture. There is no divider line.
      */

      const textX =
        cardX + 18;

      const textWidth =
        cardWidth - 36;

      const bodyFontSize =
        Math.max(
          13,
          Math.min(
            17,
            cardWidth * 0.038
          )
        );

      ctx.fillStyle = "#1b1713";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      ctx.font =
        `${bodyFontSize}px monospace`;

      const lines = wrapText(
        card.text,
        textWidth
      );

      const lineHeight =
        bodyFontSize * 1.45;

      let textY =
        imageAreaY +
        imageAreaHeight +
        14;

      for (const line of lines) {
        ctx.fillText(
          line,
          textX,
          textY
        );

        textY += lineHeight;
      }

      const cards =
        getStoryCards();

      const isLastCard =
        currentCardIndex ===
        cards.length - 1;

      ctx.font =
        `bold ${Math.max(
          12,
          bodyFontSize * 0.78
        )}px monospace`;

      ctx.fillText(
        isLastCard
          ? "TAP TO BEGIN"
          : "TAP FOR NEXT PAGE",
        textX,
        cardY +
          cardHeight -
          34
      );
    }

    // =====================================
    // DESKTOP GAME CARD
    // =====================================

    else {
      const imageWidth =
        cardWidth * 0.52;

      const imageAreaX =
        cardX + 8;

      const imageAreaY =
        cardY + 8;

      const imageAreaWidth =
        imageWidth - 8;

      const imageAreaHeight =
        cardHeight - 16;

      const textX =
        cardX +
        imageWidth +
        18;

      const textWidth =
        cardWidth -
        imageWidth -
        36;

      if (
        cardImage &&
        cardImage.complete &&
        cardImage.naturalWidth > 0
      ) {
        const scale = Math.max(
          imageAreaWidth /
            cardImage.naturalWidth,

          imageAreaHeight /
            cardImage.naturalHeight
        );

        const drawWidth =
          cardImage.naturalWidth *
          scale;

        const drawHeight =
          cardImage.naturalHeight *
          scale;

        const drawX =
          imageAreaX +
          (
            imageAreaWidth -
            drawWidth
          ) /
            2;

        const drawY =
          imageAreaY +
          (
            imageAreaHeight -
            drawHeight
          ) /
            2;

        ctx.save();

        ctx.beginPath();

        ctx.rect(
          imageAreaX,
          imageAreaY,
          imageAreaWidth,
          imageAreaHeight
        );

        ctx.clip();

        ctx.imageSmoothingEnabled =
          false;

        ctx.drawImage(
          cardImage,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );

        ctx.restore();
      }

      /*
        Desktop title bar also overlays
        the bottom of the picture.
      */

      const titleBarHeight = 44;

      const titleBarY =
        imageAreaY +
        imageAreaHeight -
        titleBarHeight;

      ctx.fillStyle = "#000000";

      ctx.fillRect(
        imageAreaX,
        titleBarY,
        imageAreaWidth,
        titleBarHeight
      );

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const titleFontSize =
        Math.max(
          15,
          Math.min(
            21,
            cardWidth * 0.03
          )
        );

      ctx.font =
        `bold ${titleFontSize}px monospace`;

      ctx.fillText(
        title.toUpperCase(),
        imageAreaX + 12,
        titleBarY +
          titleBarHeight / 2
      );

      /*
        Editable story text remains
        on the right on desktop.
      */

      const bodyFontSize =
        Math.max(
          13,
          Math.min(
            20,
            cardWidth * 0.027
          )
        );

      ctx.fillStyle = "#1b1713";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      ctx.font =
        `${bodyFontSize}px monospace`;

      const lines = wrapText(
        card.text,
        textWidth
      );

      const lineHeight =
        bodyFontSize * 1.55;

      let textY =
        cardY + 28;

      for (const line of lines) {
        ctx.fillText(
          line,
          textX,
          textY
        );

        textY += lineHeight;
      }

      const cards =
        getStoryCards();

      const isLastCard =
        currentCardIndex ===
        cards.length - 1;

      ctx.font =
        `bold ${Math.max(
          12,
          bodyFontSize * 0.75
        )}px monospace`;

      ctx.fillText(
        isLastCard
          ? "TAP TO BEGIN"
          : "TAP FOR NEXT PAGE",
        textX,
        cardY +
          cardHeight -
          42
      );
    }

    ctx.textAlign = "left";
    ctx.textBaseline =
      "alphabetic";
  }

  // =====================================
  // END GAME CARD
  // =====================================

  // =====================================
  // GAMEPLAY HUD
  // =====================================

  function drawGameplayHud() {
    if (!chapterTimer) {
      return;
    }

    const durationMs =
      (currentChapter?.gameplay?.duration || 30) * 1000;

    const elapsed = Math.max(
      0,
      performance.now() - gameplayStartedAt
    );

    const progress = Math.max(
      0,
      Math.min(1, elapsed / durationMs)
    );

    const barWidth = Math.min(310, width - 32);
    const barHeight = 13;
    const barX = (width - barWidth) / 2;
    const barY = 48;
    const label = isTreatmentLevel
      ? "TREATMENT COMPLETION:"
      : "LEVEL PROGRESS:";

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `bold ${isTreatmentLevel ? 14 : 13}px monospace`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText(label, width / 2, 32);
    ctx.fillText(label, width / 2, 32);

    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

    ctx.fillStyle = "#3c4650";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = progress > 0.82 ? "#fff2a8" : "#f2a900";
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(barX, barY + 2, barWidth * progress, 3);

    if (isTreatmentLevel) {
      ctx.textAlign = "left";
      ctx.font = "bold 13px monospace";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";
      ctx.strokeText(`ORDERS COMPLETED: ${treatmentHits}`, 16, 92);
      ctx.fillText(`ORDERS COMPLETED: ${treatmentHits}`, 16, 92);
    }

    ctx.restore();
  }

  // =====================================
  // FINISHED SCREEN
  // =====================================

  function drawChapterFinished() {
    ctx.fillStyle =
      "rgba(0, 0, 0, 0.84)";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.textAlign = "center";

    if (isTreatmentLevel) {
      ctx.font = "900 34px monospace";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffe56b";
      ctx.strokeText("TREATMENT COMPLETE!", width / 2, height / 2 - 72, width - 28);
      ctx.fillText("TREATMENT COMPLETE!", width / 2, height / 2 - 72, width - 28);

      ctx.font = "bold 19px monospace";
      ctx.lineWidth = 5;
      ctx.fillStyle = "#ffffff";
      ctx.strokeText(`${treatmentHits} ORDERS COMPLETED`, width / 2, height / 2 - 18);
      ctx.fillText(`${treatmentHits} ORDERS COMPLETED`, width / 2, height / 2 - 18);

      ctx.font = "bold 17px monospace";
      ctx.fillStyle = "#fff2a8";
      ctx.strokeText("BILL IS EXHAUSTED.", width / 2, height / 2 + 24);
      ctx.fillText("BILL IS EXHAUSTED.", width / 2, height / 2 + 24);

      const blink = Math.floor(performance.now() / 500) % 2 === 0;
      if (blink) {
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.strokeText("TAP TO CONTINUE", width / 2, height / 2 + 92);
        ctx.fillText("TAP TO CONTINUE", width / 2, height / 2 + 92);
      }

      ctx.textAlign = "left";
      return;
    }

    // -------------------------------------
    // YOU WIN
    // -------------------------------------

    const winPulse =
      1 +
      Math.sin(
        performance.now() * 0.004
      ) *
        0.025;

    ctx.save();

    ctx.translate(
      width / 2,
      height / 2 - 112
    );

    ctx.scale(
      winPulse,
      winPulse
    );

    ctx.font = "900 46px monospace";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffe56b";

    ctx.strokeText(
      "YOU WIN!",
      0,
      0
    );

    ctx.fillText(
      "YOU WIN!",
      0,
      0
    );

    ctx.restore();

    // -------------------------------------
    // DETOX MESSAGE
    // -------------------------------------

    ctx.font = "bold 20px monospace";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";

    ctx.strokeText(
      "...ANOTHER TRIP",
      width / 2,
      height / 2 - 58
    );

    ctx.fillText(
      "...ANOTHER TRIP",
      width / 2,
      height / 2 - 58
    );

    ctx.strokeText(
      "TO DETOX.",
      width / 2,
      height / 2 - 28
    );

    ctx.fillText(
      "TO DETOX.",
      width / 2,
      height / 2 - 28
    );

    // -------------------------------------
    // FINAL MESSAGE BOX
    // -------------------------------------

    const boxWidth = Math.min(
      350,
      width * 0.82
    );

    const boxHeight = 112;

    const boxX =
      width / 2 -
      boxWidth / 2;

    const boxY =
      height / 2 + 10;

    ctx.fillStyle = "#000000";

    ctx.fillRect(
      boxX - 5,
      boxY - 5,
      boxWidth + 10,
      boxHeight + 10
    );

    ctx.fillStyle = "#3b2a16";

    ctx.fillRect(
      boxX,
      boxY,
      boxWidth,
      boxHeight
    );

    ctx.fillStyle = "#f2a900";

    ctx.fillRect(
      boxX,
      boxY,
      boxWidth,
      8
    );

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#fff2a8";

    ctx.fillText(
      "ONE'S TOO MANY...",
      width / 2,
      boxY + 34
    );

    ctx.fillText(
      "A THOUSAND ISN'T ENOUGH!",
      width / 2,
      boxY + 58
    );

    ctx.font = "bold 23px monospace";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
      `${score} BEERS`,
      width / 2,
      boxY + 91
    );

    // -------------------------------------
    // CONTINUE PROMPT
    // -------------------------------------

    const blink =
      Math.floor(
        performance.now() / 500
      ) %
        2 ===
      0;

    if (blink) {
      ctx.font = "bold 16px monospace";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";

      ctx.strokeText(
        "TAP TO CONTINUE",
        width / 2,
        boxY + boxHeight + 44
      );

      ctx.fillText(
        "TAP TO CONTINUE",
        width / 2,
        boxY + boxHeight + 44
      );
    }

    ctx.textAlign = "left";
  }

  // =====================================
  // UPDATE
  // =====================================

  function update(now) {
    switch (gameState) {
      case "splash":
        updateSplash(now);
        break;

      case "chapter1CutScene":
        updateChapter1CutScene(now);
        break;

      case "playing":
        if (
          chapterTimer &&
          chapterTimer.isFinished()
        ) {
          finishChapter();
          break;
        }

        if (isTreatmentLevel) {
          updateTreatmentGame(now);
          updateTreatmentMusic(now);
          break;
        }

        bill.y +=
          (
            bill.targetY -
            bill.y
          ) *
          0.24;

        updateBackground();
        updateObstacles(now);
        updateCollectibles(now);
        updatePickupEffects();
        checkCollectibleCollisions();
        checkObstacleCollisions();

        break;

      default:
        break;
    }
  }

  // =====================================
  // DRAW
  // =====================================

  function draw(now) {
    switch (gameState) {
      case "splash":
        drawSplashScreen(now);
        break;

      case "chapter1CutScene":
        drawChapter1CutScene(now);
        break;

      case "title":
        drawTitleScreen();
        break;

      case "story":
        drawStoryCard();
        break;

      case "playing": {
        if (isTreatmentLevel) {
          drawTreatmentGame();
          drawGameplayHud();
          break;
        }

        const shakeX =
          (Math.random() - 0.5) * screenShake;

        const shakeY =
          (Math.random() - 0.5) * screenShake;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        drawBackground();
        drawObstacles();
        drawCollectibles();
        drawBill();
        drawPickupEffects();

        ctx.restore();

        drawGameplayHud();
        break;
      }

      case "treatmentFailed":
        drawTreatmentGame();
        drawGameplayHud();
        drawTreatmentFailed();
        break;

      case "finished":
        if (isTreatmentLevel) {
          drawTreatmentGame();
        } else {
          drawBackground();
          drawObstacles();
          drawCollectibles();
          drawBill();
          drawPickupEffects();
        }
        drawGameplayHud();
        drawChapterFinished();
        break;

      default:
        ctx.fillStyle = "#000000";

        ctx.fillRect(
          0,
          0,
          width,
          height
        );

        break;
    }
  }

  // =====================================
  // PAGE VISIBILITY
  // =====================================

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        backgroundMusic.pause();
        return;
      }

      if (audioUnlocked && gameState === "playing") {
        backgroundMusic
          .play()
          .catch(() => {});
      }
    }
  );

  // =====================================
  // MAIN LOOP
  // =====================================

  function gameLoop(now) {
    update(now);
    draw(now);

    requestAnimationFrame(
      gameLoop
    );
  }

  resetBill();

  requestAnimationFrame(
    gameLoop
  );
})();