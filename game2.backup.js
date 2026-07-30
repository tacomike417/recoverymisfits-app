(() => {
  "use strict";

  // ============================================================================
  // RECOVERY MISFITS GAME.JS — PLAIN-ENGLISH MAP
  // ============================================================================
  //
  // This file controls the full browser-game flow. Nothing in this comment
  // appears inside the game. It is only here to help you find things quickly.
  //
  // GAME FLOW
  // 1. OPENING CLICK-THROUGH PAGE
  //    Image: assets/splash/opening-splash.png
  //    Purpose: waits for a real tap/click so Chrome will allow audio.
  //
  // 2. RECOVERY MISFITS SPLASH PAGE
  //    Image: assets/splash/recovery-misfits-splash.png
  //    Sound: assets/sounds/splash.mp3
  //    Behavior: fades in, stays visible for the whole sound, then fades out.
  //
  // 3. OPENING CHAPTER CRAWL
  //    Sound: assets/sounds/music/cutscene1.mp3
  //    Behavior: Star-Wars-style perspective without cutting off sentence edges.
  //
  // 4. STORY / TITLE CARDS (engine/story.js)
  //    Chapter 1 cards mostly come from story.js.
  //    Chapter 2 and Chapter 3 cards are written near the top of this file.
  //
  // 5. GAMEPLAY
  //    Chapter 1: moving hazards and beer collectibles.
  //    Chapter 2: treatment mini-game.
  //    Chapter 3: Doctor's Opinion / obsession and craving mini-game.
  //
  // 6. FINISH SCREEN AND NEXT CHAPTER
  //
  // HOW TO FIND A SECTION
  // Use Ctrl+F and search for one of these exact phrases:
  //   OPENING CLICK-THROUGH PAGE
  //   RECOVERY MISFITS SPLASH PAGE
  //   OPENING CHAPTER CRAWL
  //   CHAPTER 2 STORY CARDS
  //   CHAPTER 3 STORY CARDS
  //   MAIN GAME LOOP
  //   INPUT / TAP / CLICK HANDLING
  //
  // IMPORTANT
  // The big comments are safe reading guides. They do not change gameplay.
  // ============================================================================

  // =====================================
  // CORE SETUP — CANVAS, ENGINE, URL CHAPTER NUMBER
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
    engine.getChapter(chapterIndex) ||
    (chapterNumber === 3
      ? { cards: [], gameplay: {} }
      : null);

  // =====================================
  // CURRENT CHAPTER SETUP
  // =====================================

  if (typeof currentChapter?.prepare === "function") {
    currentChapter.prepare();
  }

  // =====================================
  // CHAPTER 2 STORY CARDS — EDIT THESE OBJECTS TO CHANGE THE CARDS
  // Each object has a title, image path, and the words shown on that card.
  // =====================================

  if (chapterNumber === 2 && currentChapter) {
    currentChapter.cards =
      window.RecoveryChapters?.chapter2?.cards || [];
  }

  // =====================================
  // CHAPTER 3 STORY CARDS — EDIT THESE OBJECTS TO CHANGE THE CARDS
  // Each object has a title, image path, and the words shown on that card.
  // =====================================

  if (chapterNumber === 3 && currentChapter) {
    currentChapter.cards =
      window.RecoveryChapters?.chapter3?.cards || [];
  }

  let width = 0;
  let height = 0;

  // openingSplash → splash → chapter1CutScene → title/story → playing → finished
  const skipIntro = new URLSearchParams(window.location.search).get("skipIntro") === "1";

  /*
    Chapter 2 intentionally begins with the shared crawl even though
    Chapter 1 sends it over with skipIntro=1. Other chapters keep the
    existing skipIntro behavior unchanged.
  */
  let gameState =
    chapterNumber === 2 || chapterNumber === 3
      ? "chapter1CutScene"
      : skipIntro
        ? "story"
        : "openingSplash";

  // ============================================================================
  // RECOVERY MISFITS SPLASH PAGE — TIMING SETTINGS
  // ============================================================================
  //
  // This is the SECOND screen, after the opening click-through page.
  //
  // SPLASH_FADE_IN_MS:
  // How long recovery-misfits-splash.png takes to fade from black to visible.
  //
  // SPLASH_FADE_MS:
  // How long it takes to fade back to black AFTER splash.mp3 ends.
  //
  // SPLASH_AUDIO_FALLBACK_MS:
  // Emergency safety timer only. Normally the real "ended" event from
  // splash.mp3 controls when the fade-out begins.
  // ============================================================================

  const SPLASH_FADE_IN_MS = 500;
  const SPLASH_FADE_MS = 650;
  const SPLASH_AUDIO_FALLBACK_MS = 4000;
  const MUSIC_FADE_MS = 650;
  const FINISHED_INPUT_LOCK_MS = 1200;

  let splashStartedAt = 0;
  let splashAudioFinished = false;
  let splashFadeStartedAt = 0;
  let splashFallbackEndsAt = 0;
  let finishedInputReadyAt = 0;

  // ============================================================================
  // OPENING CHAPTER CRAWL — TEXT, SPEED, PERSPECTIVE, AND SKIP BUTTON
  // ============================================================================
  // This same cinematic system is used before Chapters 1, 2, and 3.
  // Search for chapter1CutSceneText near the top to edit the actual wording.
  // Search for CHAPTER_1_CUT_SCENE_SCROLL_SPEED to change its speed.
  // The drawing code below keeps the narrowing perspective while calculating
  // a safe width for every line so sentence edges do not get cut off.
  // ============================================================================

  const chapter1CutSceneEnabled =
    (chapterNumber === 1 && !skipIntro) ||
    chapterNumber === 2 ||
    chapterNumber === 3;

  const chapter1CutSceneText =
    chapterNumber === 3
      ? window.RecoveryChapters?.chapter3?.crawl || []
      : chapterNumber === 2
      ? window.RecoveryChapters?.chapter2?.crawl || []
      : window.RecoveryChapters?.chapter1?.crawl || [];

  const CHAPTER_1_CUT_SCENE_SCROLL_SPEED = 22;
  const CHAPTER_1_CUT_SCENE_END_HOLD_MS = 1700;

  // This shared setting controls the speed button on every chapter crawl.
  let chapter1CutSceneSpeedMultiplier = 1;

  let chapter1CutSceneStartedAt = 0;
  let chapter1CutSceneFinishedAt = 0;

  // These track the crawl frame-by-frame so changing speed does not make it jump.
  let chapter1CutSceneCrawlDistance = 0;
  let chapter1CutSceneLastUpdatedAt = 0;

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
  // SHARED CHAPTER STATE — TIMER, CURRENT CARD, GAMEPLAY START TIME
  // =====================================

  let chapterTimer = null;
  let chapterFinished = false;
  let gameplayStartedAt = 0;

  const isTreatmentLevel = chapterNumber === 2;
  const isDoctorsOpinionLevel = chapterNumber === 3;
  const treatmentDurationMs =
    (currentChapter?.gameplay?.duration || 30) * 1000;

  // Chapter 3 gameplay state now lives in chapters/chapter3-gameplay.js.

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
  // CANVAS SIZE — MAKES THE GAME FILL THE BROWSER WINDOW
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
  // IMAGE LOADING — ALL ART FILE PATHS USED BY THE GAME
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

  const backgroundSystem =
    window.RecoveryBackground.createBackground({
      ctx,
      image: backgroundImage,
      getWidth: () => width,
      getHeight: () => height,
      scrollSpeed: 1.2
    });

  const entitySystem =
    window.RecoveryEntities.createState(currentChapter);

  const {
    activeEntities,
    obstacleDefinitions,
    obstacleImages,
    collectibleDefinitions,
    collectibleImages
  } = entitySystem;

  const storySystem =
    window.RecoveryStory.createStorySystem({
      ctx,
      currentChapter,
      engine,
      chapterNumber,
      getWidth: () => width,
      getHeight: () => height,
      isTreatmentLevel: () => isTreatmentLevel,
      getTreatmentHits: () => treatmentHits,
      getScore: () => score,
      onStoryComplete: startGameplay
    });

  // OPENING CLICK-THROUGH PAGE IMAGE
  // This is the very first page with the flashing TAP TO START message.
  const openingSplashImage = new Image();

  openingSplashImage.src =
    "assets/splash/opening-splash.png";

  // RECOVERY MISFITS SPLASH PAGE IMAGE
  // This is shown while assets/sounds/splash.mp3 plays.
  const splashImage = new Image();

  splashImage.src =
    "assets/splash/recovery-misfits-splash.png";

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
  // SOUND AND VIBRATION — MUSIC, SPLASH AUDIO, CLICKS, CRASHES
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

  // OPENING CHAPTER CRAWL MUSIC
  // This track belongs ONLY to the scrolling cinematic crawl.
  const cutsceneMusic = new Audio(
    "assets/sounds/music/cutscene1.mp3"
  );

  cutsceneMusic.loop = true;
  cutsceneMusic.volume = 0.32;
  cutsceneMusic.preload = "auto";

  // TITLE SCREEN MUSIC
  // Begins when the Chapter 1 title screen appears and fades out
  // when the player taps to continue to the story cards.
  const titleMusic = new Audio(
    "assets/sounds/music/title-theme.mp3"
  );

  titleMusic.loop = true;
  titleMusic.volume = 0;
  titleMusic.preload = "auto";

  // GAMEPLAY MUSIC
  // Each chapter can have chapter1.mp3, chapter2.mp3, chapter3.mp3, etc.
  const backgroundMusic = new Audio(
    `assets/sounds/music/chapter${chapterNumber}.mp3`
  );

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0;
  backgroundMusic.preload = "auto";

  // RECOVERY MISFITS SPLASH SOUND
  // The splash image stays visible until this exact sound finishes.
  const splashSound = new Audio(
    `assets/sounds/splash.mp3?v=${Date.now()}`
  );

  splashSound.volume = 1;
  splashSound.preload = "auto";

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

  function playAudio(audio) {
    return audio.play()
      .then(() => true)
      .catch(() => false);
  }

  function fadeAudio(audio, targetVolume, duration = MUSIC_FADE_MS, pauseWhenSilent = false) {
    const startVolume = audio.volume;
    const startedAt = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }

      audio.volume = targetVolume;

      if (pauseWhenSilent && targetVolume === 0) {
        audio.pause();
        audio.currentTime = 0;
      }
    }

    requestAnimationFrame(step);
  }

  function startCutsceneMusic() {
    audioUnlocked = true;
    backgroundMusic.pause();
    cutsceneMusic.playbackRate = chapter1CutSceneSpeedMultiplier;

    if (cutsceneMusic.paused) {
      cutsceneMusic.volume = 0;
      playAudio(cutsceneMusic).then((started) => {
        if (started && gameState === "chapter1CutScene") {
          fadeAudio(cutsceneMusic, 0.32);
        }
      });
    } else if (gameState === "chapter1CutScene") {
      fadeAudio(cutsceneMusic, 0.32);
    }
  }

  function stopCutsceneMusic() {
    cutsceneMusic.pause();
    cutsceneMusic.currentTime = 0;
    cutsceneMusic.volume = 0;
    cutsceneMusic.playbackRate = 1;
  }

  function startTitleMusic() {
    if (chapterNumber !== 1) {
      return;
    }

    cutsceneMusic.pause();
    backgroundMusic.pause();

    titleMusic.pause();
    titleMusic.currentTime = 0;
    titleMusic.volume = 0;

    playAudio(titleMusic).then((started) => {
      if (started && gameState === "title") {
        fadeAudio(titleMusic, 0.55, 900);
      }
    });
  }

  function fadeOutTitleMusic() {
    if (titleMusic.paused) {
      titleMusic.currentTime = 0;
      titleMusic.volume = 0;
      return;
    }

    fadeAudio(
      titleMusic,
      0,
      900,
      true
    );
  }

  function unlockAudioFromUserGesture() {
    audioUnlocked = true;

    /*
      Start only the audible splash sound inside the first real tap.
      Starting a second audio track at the same moment can cause some
      browsers to reject or interrupt the splash sound. The cut-scene
      music starts normally after the splash has finished.
    */
    splashSound.pause();
    splashSound.muted = false;
    splashSound.currentTime = 0;

    cutsceneMusic.pause();
    cutsceneMusic.currentTime = 0;
    cutsceneMusic.volume = 0;
    cutsceneMusic.playbackRate = 1;

    return playAudio(splashSound);
  }

  function beginRecoveryMisfitsSplash() {
    splashStartedAt = performance.now();
    splashAudioFinished = false;
    splashFadeStartedAt = 0;
    splashFallbackEndsAt = splashStartedAt + SPLASH_AUDIO_FALLBACK_MS;
    gameState = "splash";

    unlockAudioFromUserGesture().then((started) => {
      if (!started) {
        // Keep the splash visible until the safety timer expires.
      }
    });
  }

  function finishSplashAudio() {
    if (gameState !== "splash" || splashAudioFinished) {
      return;
    }

    splashAudioFinished = true;
    splashFadeStartedAt = performance.now();
  }

  splashSound.addEventListener("ended", finishSplashAudio);
  splashSound.addEventListener("error", finishSplashAudio);

  function startBackgroundMusicForGameplay() {
    audioUnlocked = true;

    /*
      Stop every earlier-screen track immediately before gameplay begins.
      This prevents a title-music fade animation from competing with the
      Chapter 1 or Chapter 2 gameplay track.
    */
    titleMusic.pause();
    titleMusic.currentTime = 0;
    titleMusic.volume = 0;

    cutsceneMusic.pause();
    cutsceneMusic.currentTime = 0;
    cutsceneMusic.volume = 0;
    cutsceneMusic.playbackRate = 1;

    backgroundMusic.pause();
    backgroundMusic.muted = false;
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0;
    backgroundMusic.playbackRate = isTreatmentLevel
      ? treatmentMusicSettings.startRate
      : 1;

    /*
      Calling load() here gives Chrome a fresh playback attempt after the
      user's final TAP TO CONTINUE action.
    */
    backgroundMusic.load();

    playAudio(backgroundMusic).then((started) => {
      if (!started) {
        audioUnlocked = false;
        return;
      }

      fadeAudio(
        backgroundMusic,
        isTreatmentLevel ? treatmentMusicSettings.baseVolume : 0.32,
        MUSIC_FADE_MS
      );
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

  const doctorsOpinionGame =
    window.RecoveryChapter3Gameplay.createDoctorsOpinionGame({
      ctx,
      getWidth: () => width,
      getHeight: () => height,
      backgroundMusic,
      stopBackgroundMusic,
      playClickFeedback,
      playPickupFeedback,
      setGameState: (nextState) => {
        gameState = nextState;
      }
    });

  // =====================================
  // PLAYER — BILL IMAGE SIZE AND VERTICAL POSITION
  // =====================================

  const bill =
    window.RecoveryPlayer.createPlayer(
      currentChapter?.gameplay?.player
    );

  function resetBill() {
    window.RecoveryPlayer.resetPlayer(
      bill,
      height
    );
  }

  function keepBillOnScreen() {
    window.RecoveryPlayer.keepPlayerOnScreen(
      bill,
      height
    );
  }

  // =====================================
  // GAME ENTITIES
  // Stored and loaded by engine/entities.js.
  // =====================================

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
  // CHAPTER ENTITY RESET
  // Chapter 1 owns hazard and collectible timing.
  // =====================================

  function resetObstacles() {
    entitySystem.resetChapter({
      easierRetry:
        chapterNumber === 1 &&
        chapter1EasierRetry
    });
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
  // GAMEPLAY RESTART — RESET THE CURRENT ATTEMPT
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

    backgroundSystem.reset();
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
  // SCREEN / STATE CHANGES — MOVE FROM ONE PART OF THE GAME TO ANOTHER
  // =====================================

  function showChapter1CutScene() {
    if (!chapter1CutSceneEnabled) {
      showTitleScreen();
      return;
    }

    chapter1CutSceneStartedAt = performance.now();
    chapter1CutSceneFinishedAt = 0;
    chapter1CutSceneSpeedMultiplier = 1;
    chapter1CutSceneCrawlDistance = 0;
    chapter1CutSceneLastUpdatedAt = chapter1CutSceneStartedAt;
    gameState = "chapter1CutScene";
    startCutsceneMusic();
  }

  function finishChapter1CutScene() {
    chapter1CutSceneFinishedAt = 0;

    // The crawl music belongs only to the cinematic. Stop and reset it before
    // showing the title screen or any story cards.
    stopCutsceneMusic();

    if (chapterNumber === 2) {
      showStoryCards();
      return;
    }

    if (chapterNumber === 3) {
      showStoryCards();
      return;
    }

    gameState = "title";
    startTitleMusic();
  }

  function showTitleScreen() {
    if (skipIntro) {
      showStoryCards();
      return;
    }

    gameState = "title";
    startTitleMusic();
  }

  function showStoryCards() {
    fadeOutTitleMusic();
    storySystem.reset();
    gameState = "story";
  }

  function startGameplay() {
    resetBill();
    resetObstacles();
    resetPickupEffects();

    chapterFinished = false;
    backgroundSystem.reset();

    chapterTimer = isDoctorsOpinionLevel
      ? null
      : engine.createTimer(0);

    gameplayStartedAt = performance.now();

    if (isTreatmentLevel) {
      treatmentAttempt += 1;
      resetTreatmentGame(gameplayStartedAt);
    }

    if (isDoctorsOpinionLevel) {
      doctorsOpinionGame.reset(gameplayStartedAt);
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
    finishedInputReadyAt = performance.now() + FINISHED_INPUT_LOCK_MS;
    gameState = "finished";
  }

  function continueToNextChapter() {
    storySystem.continueToNextChapter();
  }

  // =====================================
  // STORY CARD HELPERS
  // =====================================





  function advanceStoryCard() {
    storySystem.advance();
  }

  // Chapter 3 gameplay now lives in chapters/chapter3-gameplay.js.

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

    const missedTreatmentText = {
      "RUN!": "YOU MISSED MILD EXERCISE",
      "HOT SHOWER!": "YOU MISSED A HOT SHOWER",
      "COLD BATH!": "YOU MISSED A COLD BATH",
      "BELLADONNA!": "YOU MISSED BELLADONNA TREATMENT"
    }[treatmentFailedLabel] || `YOU MISSED ${treatmentFailedLabel}`;

    ctx.font = "700 14px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#ffe6e6";
    ctx.fillText(missedTreatmentText, width / 2, boxY + 122, boxWidth - 28);

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

  // Input handling is installed by engine/gameflow.js near the bottom.

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
  // Handled by engine/background.js.
  // =====================================

  // =====================================
  // PLAYER — BILL IMAGE SIZE AND VERTICAL POSITION DRAWING
  // =====================================

  function drawBill() {
    window.RecoveryPlayer.drawPlayer({
      ctx,
      player: bill,
      image: billImage,
      pickupBounce:
        billPickupBounce
    });
  }

  // ============================================================================
  // RECOVERY MISFITS SPLASH PAGE
  // ============================================================================
  //
  // SCREEN ORDER
  // opening-splash.png -> player taps -> recovery-misfits-splash.png
  // -> splash.mp3 finishes -> splash fades out -> opening chapter crawl
  //
  // updateSplash() decides WHEN this screen ends.
  // drawSplashScreen() decides HOW it looks while it is on screen.
  // ============================================================================

  function updateSplash(now) {
    if (!splashAudioFinished && now >= splashFallbackEndsAt) {
      splashAudioFinished = true;
      splashFadeStartedAt = now;
    }

    if (!splashAudioFinished) {
      return;
    }

    if (!splashFadeStartedAt) {
      splashFadeStartedAt = now;
    }

    if (now - splashFadeStartedAt >= SPLASH_FADE_MS) {
      showChapter1CutScene();
    }
  }

  // ============================================================================
  // OPENING CLICK-THROUGH PAGE
  // ============================================================================
  // This screen has no music of its own. Its job is to receive the first
  // tap/click, unlock browser audio, and then start the Recovery Misfits splash.
  // ============================================================================
  function drawOpeningSplashScreen(now) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    drawContainedImage(openingSplashImage);

    const centerX = width / 2;
    const baseFont = Math.max(13, Math.min(19, width * 0.042));
    const wordingStartY = height * 0.73;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = Math.max(3, baseFont * 0.2);

    const wordingLines = [
      { text: "2026", size: baseFont * 0.82, y: wordingStartY },
      { text: "RECOVERY MISFITS", size: baseFont * 1.12, y: wordingStartY + baseFont * 1.45 },
      { text: "recoverymisfits.org", size: baseFont * 0.74, y: wordingStartY + baseFont * 2.75 },
      { text: "ONE DAY AT A TIME", size: baseFont * 0.78, y: wordingStartY + baseFont * 3.95 }
    ];

    for (const line of wordingLines) {
      ctx.font = `900 ${line.size}px monospace`;
      ctx.strokeText(line.text, centerX, line.y);
      ctx.fillText(line.text, centerX, line.y);
    }

    const blinkOn = Math.floor(now / 500) % 2 === 0;

    if (blinkOn) {
      const promptSize = Math.max(17, Math.min(25, width * 0.055));
      const promptY = height - Math.max(32, height * 0.07);
      ctx.font = `900 ${promptSize}px monospace`;
      ctx.lineWidth = Math.max(4, promptSize * 0.22);
      ctx.strokeText("► TAP TO START ◄", centerX, promptY);
      ctx.fillText("► TAP TO START ◄", centerX, promptY);
    }

    ctx.restore();
  }

  function drawSplashScreen(now) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // First fade IN from black as splash.mp3 begins.
    const fadeInProgress = Math.max(
      0,
      Math.min(1, (now - splashStartedAt) / SPLASH_FADE_IN_MS)
    );

    let opacity = fadeInProgress;

    // Do not begin fading OUT until splash.mp3 has actually finished.
    if (splashAudioFinished && splashFadeStartedAt) {
      const fadeOutProgress = Math.max(
        0,
        Math.min(1, (now - splashFadeStartedAt) / SPLASH_FADE_MS)
      );

      opacity = fadeInProgress * (1 - fadeOutProgress);
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    drawContainedImage(splashImage);
    ctx.restore();
  }

  // =====================================
  // CHAPTER CUT SCENE — STAR-WARS-STYLE CRAWL
  // =====================================
  // This is shared by Chapters 1, 2, and 3. The speed button therefore
  // appears on every chapter crawl that uses this shared screen.

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

  function getChapter1CutSceneSpeedButton() {
    const buttonWidth = Math.min(124, width * 0.28);
    const buttonHeight = 44;
    const margin = 16;
    const gap = 10;

    return {
      x: width - buttonWidth * 2 - margin - gap,
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

  function chapter1CutSceneSpeedButtonContains(x, y) {
    const button = getChapter1CutSceneSpeedButton();

    return (
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height
    );
  }

  function toggleChapter1CutSceneSpeed() {
    chapter1CutSceneSpeedMultiplier =
      chapter1CutSceneSpeedMultiplier === 1 ? 2 : 1;

    cutsceneMusic.playbackRate = chapter1CutSceneSpeedMultiplier;
    playClickFeedback();
  }

  function wrapChapter1CutSceneLine(textLine, maxCharacters) {
    if (!textLine) {
      return [""];
    }

    const words = textLine.split(/\s+/);
    const wrapped = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (current && candidate.length > maxCharacters) {
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
    const maxCharacters = width < 520 ? 24 : 36;
    const lines = [];

    for (const paragraph of chapter1CutSceneText) {
      lines.push(...wrapChapter1CutSceneLine(paragraph, maxCharacters));
    }

    return lines;
  }

  function updateChapter1CutScene(now) {
    if (!chapter1CutSceneStartedAt) {
      chapter1CutSceneStartedAt = now;
      chapter1CutSceneLastUpdatedAt = now;
      chapter1CutSceneCrawlDistance = 0;
      chapter1CutSceneSpeedMultiplier = 1;
      cutsceneMusic.playbackRate = 1;
    }

    if (!chapter1CutSceneLastUpdatedAt) {
      chapter1CutSceneLastUpdatedAt = now;
    }

    const frameSeconds = Math.max(
      0,
      (now - chapter1CutSceneLastUpdatedAt) / 1000
    );

    chapter1CutSceneLastUpdatedAt = now;

    chapter1CutSceneCrawlDistance +=
      frameSeconds *
      CHAPTER_1_CUT_SCENE_SCROLL_SPEED *
      chapter1CutSceneSpeedMultiplier;

    const lines = getChapter1CutSceneLines();
    const baseFontSize = Math.max(25, Math.min(42, width * 0.057));
    const lineSpacing = baseFontSize * 1.28;
    const crawlTop = height * 0.93 - chapter1CutSceneCrawlDistance;
    const lastLineY =
      crawlTop + Math.max(0, lines.length - 1) * lineSpacing;

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
        0.48 + Math.sin(now * 0.0017 + star.phase) * 0.22;

      ctx.globalAlpha = Math.max(0.18, twinkle);
      ctx.fillStyle = "#ffffff";

      const starSize = Math.max(1, star.size);

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
    const baseFontSize = Math.max(25, Math.min(42, width * 0.057));
    const lineSpacing = baseFontSize * 1.28;
    const crawlTop = height * 0.93 - chapter1CutSceneCrawlDistance;
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
      const virtualY = crawlTop + index * lineSpacing;

      if (virtualY < horizonY - lineSpacing || virtualY > bottomY) {
        continue;
      }

      const depth = Math.max(
        0,
        Math.min(
          1,
          (virtualY - horizonY) / Math.max(1, bottomY - horizonY)
        )
      );

      const perspectiveScale = 0.34 + depth * 0.88;
      const screenY =
        horizonY + Math.pow(depth, 1.16) * (bottomY - horizonY);
      const fadeNearHorizon = Math.max(
        0,
        Math.min(1, (screenY - horizonY) / 95)
      );
      const fadeNearBottom = Math.max(
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
      ctx.globalAlpha = Math.min(fadeNearHorizon, fadeNearBottom);
      ctx.translate(width / 2, screenY);
      ctx.scale(perspectiveScale, perspectiveScale);
      ctx.font =
        `${fontWeight} ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle =
        index === 0 || index === 2 ? "#ffd84d" : "#fff2a8";
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 7;

      const trapezoidWidthAtLine = width * (0.16 + depth * 0.76);
      const safeScreenWidth = trapezoidWidthAtLine * 0.82;
      const safeUnscaledWidth = safeScreenWidth / perspectiveScale;

      ctx.fillText(lines[index], 0, 0, safeUnscaledWidth);
      ctx.restore();
    }

    ctx.restore();

    // 1X / 2X SPEED BUTTON
    const speedButton = getChapter1CutSceneSpeedButton();

    ctx.save();
    ctx.fillStyle =
      chapter1CutSceneSpeedMultiplier === 2
        ? "rgba(255, 216, 77, 0.92)"
        : "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(
      speedButton.x,
      speedButton.y,
      speedButton.width,
      speedButton.height
    );
    ctx.strokeStyle = "#fff2a8";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      speedButton.x,
      speedButton.y,
      speedButton.width,
      speedButton.height
    );
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 16px Arial, Helvetica, sans-serif";
    ctx.fillStyle =
      chapter1CutSceneSpeedMultiplier === 2 ? "#000000" : "#fff7dc";
    ctx.fillText(
      chapter1CutSceneSpeedMultiplier === 2 ? "2X SPEED" : "1X SPEED",
      speedButton.x + speedButton.width / 2,
      speedButton.y + speedButton.height / 2 + 1
    );
    ctx.restore();

    // SKIP BUTTON
    const button = getChapter1CutSceneSkipButton();

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(button.x, button.y, button.width, button.height);
    ctx.strokeStyle = "#fff2a8";
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
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
  // TITLE SCREEN — UNOFFICIAL STORY TITLE IMAGE
  // =====================================



  // =====================================
  // GAME CARD
  // Copy this entire section next time
  // we change story-card appearance.
  // =====================================





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




  // =====================================
  // CHAPTER 3 PREVIEW END SCREEN
  // =====================================



  // =====================================
  // UPDATE
  // =====================================

  // =====================================
  // CHAPTER RUNTIME CONNECTIONS
  // Connects game2.js state to the shared
  // builder in engine/runtime.js.
  // =====================================

  const chapterRuntimeContext = {
    ctx,
    bill,
    activeEntities,

    obstacleDefinitions,
    obstacleImages,

    collectibleDefinitions,
    collectibleImages,

    floatingNumbers,
    pickupParticles,

    getWidth:
      () => width,

    getHeight:
      () => height,

    isEasierRetry:
      () =>
        chapterNumber === 1 &&
        chapter1EasierRetry,

    getScreenShake:
      () => screenShake,

    setScreenShake:
      (value) => {
        screenShake = value;
      },

    getBillPickupBounce:
      () => billPickupBounce,

    setBillPickupBounce:
      (value) => {
        billPickupBounce = value;
      },

    setEasierRetry:
      (value) => {
        if (chapterNumber === 1) {
          chapter1EasierRetry =
            Boolean(value);
        }
      },

    addScore:
      (amount) => {
        score +=
          Number(amount) || 0;
      },

    updatePlayer:
      () => {
        window.RecoveryPlayer.updatePlayer(
          bill
        );
      },

    updateBackground:
      backgroundSystem.update,
    updatePickupEffects,

    drawBackground:
      backgroundSystem.draw,
    drawBill,
    drawPickupEffects,

    playCrashFeedback,
    restartGameplay,

    playPickupFeedback,
    createPickupEffects
  };

  const gameFlow = window.RecoveryGameFlow.createController({
    canvas,
    ctx,

    getGameState: () => gameState,
    getFinishedInputReadyAt: () => finishedInputReadyAt,
    getWidth: () => width,
    getHeight: () => height,

    isTreatmentLevel,
    isDoctorsOpinionLevel,

    beginRecoveryMisfitsSplash,
    startCutsceneMusic,
    finishChapter1CutScene,
    chapter1CutSceneSpeedButtonContains,
    chapter1CutSceneSkipButtonContains,
    toggleChapter1CutSceneSpeed,
    playClickFeedback,
    showStoryCards,
    advanceStoryCard,
    continueToNextChapter,
    startGameplay,
    tapDoctorsOpinionGame: doctorsOpinionGame.tap,
    tapTreatmentSlot,

    player: bill,

    updateSplash,
    updateChapter1CutScene,
    updateDoctorsOpinionGame: doctorsOpinionGame.update,
    updateTreatmentGame,
    updateTreatmentMusic,
    finishChapter,

    chapterTimerIsFinished: () =>
      Boolean(chapterTimer?.isFinished()),

    updateChapterEntities: (now) => {
      entitySystem.updateChapter(
        window.RecoveryRuntime.createChapterRuntime(
          chapterRuntimeContext,
          now
        )
      );
    },

    drawOpeningSplashScreen,
    drawSplashScreen,
    drawChapter1CutScene,
    drawTitleScreen: storySystem.drawTitleScreen,
    drawStoryCard: storySystem.drawStoryCard,
    drawDoctorsOpinionGame: doctorsOpinionGame.draw,
    drawTreatmentGame,
    drawGameplayHud,
    drawTreatmentFailed,
    drawChapter3PreviewFinished:
      storySystem.drawChapter3PreviewFinished,
    drawChapterFinished:
      storySystem.drawChapterFinished,

    drawChapterEntities: (now, options) => {
      entitySystem.drawChapter(
        window.RecoveryRuntime.createChapterRuntime(
          chapterRuntimeContext,
          now,
          options
        )
      );
    },

    backgroundMusic,
    cutsceneMusic,
    isAudioUnlocked: () => audioUnlocked,
    playAudio
  });

  window.RecoveryInput.installInputHandlers({
    canvas,
    getGameState: () => gameState,
    isTreatmentLevel,
    isDoctorsOpinionLevel,
    handlePrimaryAction: gameFlow.handlePrimaryAction,
    beginRecoveryMisfitsSplash,
    player: bill,
    getHeight: () => height
  });

  resetBill();

  if (gameState === "chapter1CutScene") {
    startCutsceneMusic();
  }

  gameFlow.start();
})();