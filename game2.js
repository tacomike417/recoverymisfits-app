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
  // 4. STORY / TITLE CARDS
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
    currentChapter.cards = [
      {
        title: "OUR FRIEND IS BACK",
        image: "assets/cards/chapter3-card1.png",
        text:
          "Dr.: \"You're back.\"\n\n" +
          "\"I don't know why this keeps happening to me. " +
          "I get well. I leave. I honestly believe this time will be different. " +
          "Then the thought of drinking returns. I drink. I can't stop. " +
          "And I come back.\""
      },

      {
        title: "THE DOCTOR'S OPINION",
        image: "assets/cards/chapter3-card2.png",
        text:
          "\"I've developed a theory after seeing so many men come through our hospital. " +
          "Some men have developed an allergy to alcohol—a two-fold illness. " +
          "The first part is that once they drink, they cannot stop on their own willpower. " +
          "One drink and the phenomenon of craving starts, and they cannot stop.\""
      },

      {
        title: "THE MENTAL OBSESSION",
        image: "assets/cards/chapter3-card3.png",
        text:
          "\"And once these men have stopped, sworn off alcohol for good, " +
          "a mental obsession—an idea that overcomes all other ideas—takes hold " +
          "and tells these men they can drink safely again.\""
      },

      {
        title: "THE VICIOUS CYCLE",
        image: "assets/cards/chapter3-card4.png",
        text:
          "\"And the vicious cycle starts all over again. " +
          "They lose jobs. Families. Freedom. " +
          "They find themselves locked up, seeking care again... " +
          "or unfortunately die.\""
      },

      {
        title: "MY OPINION",
        image: "assets/cards/chapter3-card5.png",
        text:
          "\"This is my opinion as I see it right now. " +
          "I know of no solution other than complete abstinence. " +
          "Yet even then, these men seem to suffer. " +
          "They cannot stay away from alcohol for very long.\""
      }
    ];
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
  let currentCardIndex = 0;
  let gameplayStartedAt = 0;

  const isTreatmentLevel = chapterNumber === 2;
  const isDoctorsOpinionLevel = chapterNumber === 3;
  const treatmentDurationMs =
    (currentChapter?.gameplay?.duration || 30) * 1000;

  // =====================================
  // CHAPTER 3: DOCTOR'S OPINION GAME
  // =====================================



  /*
    Chapter 1 keeps its exact current difficulty until the first
    obstacle collision. Every retry after that collision uses the
    easier hazard settings below. Chapter 2 keeps its own existing
    first-attempt/easier-retry system.
  */
  let chapter1EasierRetry = false;

  // =====================================
  // BACKGROUND STATE
  // =====================================

  let backgroundOffset = 0;

  const BACKGROUND_SCROLL_SPEED = 1.2;

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

  const titleImage = new Image();

  titleImage.src =
    "assets/title/unofficial-title.png";

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
    fadeAudio(cutsceneMusic, 0, MUSIC_FADE_MS, true);

    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0;
    backgroundMusic.playbackRate = isTreatmentLevel
      ? treatmentMusicSettings.startRate
      : 1;

    playAudio(backgroundMusic).then((started) => {
      if (!started) {
        audioUnlocked = false;
        return;
      }

      fadeAudio(
        backgroundMusic,
        isTreatmentLevel ? treatmentMusicSettings.baseVolume : 0.32
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
    const activeTiles = treatmentGame.getActiveCount();

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
  // GAME ENTITIES — ACTIVE HAZARDS AND COLLECTIBLES
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
  // CHAPTER ENTITY RESET
  // Chapter 1 owns hazard and collectible timing.
  // =====================================

  function resetObstacles() {
    if (
      typeof currentChapter?.resetEntities !==
      "function"
    ) {
      activeEntities.length = 0;
      return;
    }

    currentChapter.resetEntities({
      activeEntities,
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
      treatmentGame.reset(gameplayStartedAt);
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

    chapterTimer = isDoctorsOpinionLevel
      ? null
      : engine.createTimer(0);

    gameplayStartedAt = performance.now();

    if (isTreatmentLevel) {
      treatmentGame.startAttempt(gameplayStartedAt);
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

    /*
      Chapter 3 currently begins as a cutscene preview, so Chapter 2
      is allowed to open it even before Chapter 3 has been added to
      story.js. Later chapters still require a matching chapter entry.
    */

    if (!nextChapter && nextChapterNumber !== 3) {
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
  // INPUT / TAP / CLICK HANDLING — WHAT HAPPENS WHEN THE PLAYER PRESSES
  // =====================================

  function handlePrimaryAction(event) {
    if (gameState === "openingSplash") {
      beginRecoveryMisfitsSplash();
      return;
    }

    if (gameState === "chapter1CutScene") {
      startCutsceneMusic();

      if (
        !event ||
        typeof event.clientX !== "number" ||
        typeof event.clientY !== "number"
      ) {
        playClickFeedback();
        finishChapter1CutScene();
        return;
      }

      if (
        chapter1CutSceneSpeedButtonContains(
          event.clientX,
          event.clientY
        )
      ) {
        toggleChapter1CutSceneSpeed();
        return;
      }

      if (
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
      if (performance.now() < finishedInputReadyAt) {
        return;
      }

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
      isDoctorsOpinionLevel &&
      event &&
      typeof event.clientX === "number" &&
      typeof event.clientY === "number"
    ) {
      doctorsOpinionGame.tap(event.clientX, event.clientY);
      return;
    }

    if (
      isTreatmentLevel &&
      event &&
      typeof event.clientX === "number" &&
      typeof event.clientY === "number"
    ) {
      treatmentGame.tap(event.clientX, event.clientY);
      return;
    }

    if (
      event &&
      typeof event.clientY ===
        "number"
    ) {
      window.RecoveryPlayer.setPlayerTargetY(
        bill,
        event.clientY -
          bill.height / 2,
        height
      );
    }
  }

  canvas.style.touchAction = "none";

  /*
    Chrome may reject audio started from pointerdown while mobile
    device emulation is active. Use a real click to unlock and start
    the Recovery Misfits splash sound.
  */
  canvas.addEventListener(
    "click",
    (event) => {
      if (gameState !== "openingSplash") {
        return;
      }

      event.preventDefault();
      beginRecoveryMisfitsSplash();
    },
    { passive: false }
  );

canvas.addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();

    /*
      The opening splash is handled by the click listener above,
      because Chrome recognizes click more reliably for audio unlock.
    */
    if (gameState === "openingSplash") {
      return;
    }

    handlePrimaryAction(event);

    try {
      if (canvas.hasPointerCapture && !canvas.hasPointerCapture(event.pointerId)) {
        canvas.setPointerCapture(event.pointerId);
      }
    } catch (error) {
      // Pointer capture is optional; the game still responds to the tap.
    }
  },
  { passive: false }
);

  canvas.addEventListener(
  "pointermove",
  (event) => {
    if (gameState !== "playing" || isTreatmentLevel || isDoctorsOpinionLevel) {
      return;
    }

    if (
      event.pointerType === "mouse" &&
      event.buttons === 0
    ) {
      return;
    }

    event.preventDefault();

    window.RecoveryPlayer.setPlayerTargetY(
      bill,
      event.clientY -
        bill.height / 2,
      height
    );
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
          gameState === "openingSplash" ||
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
        window.RecoveryPlayer.movePlayerTarget(
          bill,
          -70,
          height
        );
      }

      if (
        event.key === "ArrowDown"
      ) {
        window.RecoveryPlayer.movePlayerTarget(
          bill,
          70,
          height
        );
      }
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

  const treatmentGame =
    window.RecoveryTreatmentGame.create({
      ctx,
      getWidth: () => width,
      getHeight: () => height,
      getGameplayStartedAt: () => gameplayStartedAt,
      getDurationMs: () => treatmentDurationMs,
      drawCoverImage,
      getBackgroundImage: () => backgroundImage,
      stopBackgroundMusic,
      playPickupFeedback,
      setGameState: (value) => {
        gameState = value;
      }
    });


  const doctorsOpinionGame =
    window.RecoveryDoctorsOpinionGame.create({
      ctx,
      getWidth: () => width,
      getHeight: () => height,
      backgroundMusic,
      stopBackgroundMusic,
      playClickFeedback,
      playPickupFeedback,
      setGameState: (value) => {
        gameState = value;
      }
    });


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
      ctx.strokeText(`ORDERS COMPLETED: ${treatmentGame.getHits()}`, 16, 92);
      ctx.fillText(`ORDERS COMPLETED: ${treatmentGame.getHits()}`, 16, 92);
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
      ctx.strokeText(`${treatmentGame.getHits()} ORDERS COMPLETED`, width / 2, height / 2 - 18);
      ctx.fillText(`${treatmentGame.getHits()} ORDERS COMPLETED`, width / 2, height / 2 - 18);

      ctx.font = "bold 17px monospace";
      ctx.fillStyle = "#fff2a8";
      ctx.strokeText("OUR FRIEND IS EXHAUSTED.", width / 2, height / 2 + 24);
      ctx.fillText("OUR FRIEND IS EXHAUSTED.", width / 2, height / 2 + 24);

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
      "A THOUSAND AIN'T ENOUGH.",
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
  // CHAPTER 3 PREVIEW END SCREEN
  // =====================================

  function drawChapter3PreviewFinished() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "900 32px monospace";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffe56b";
    ctx.strokeText("CHAPTER 3", width / 2, height / 2 - 50, width - 30);
    ctx.fillText("CHAPTER 3", width / 2, height / 2 - 50, width - 30);

    ctx.font = "bold 18px monospace";
    ctx.lineWidth = 5;
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("THE DOCTOR'S OPINION", width / 2, height / 2, width - 30);
    ctx.fillText("THE DOCTOR'S OPINION", width / 2, height / 2, width - 30);

    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#fff2a8";
    ctx.strokeText("CONTINUES SOON...", width / 2, height / 2 + 62, width - 30);
    ctx.fillText("CONTINUES SOON...", width / 2, height / 2 + 62, width - 30);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

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

    updateBackground,
    updatePickupEffects,

    drawBackground,
    drawBill,
    drawPickupEffects,

    playCrashFeedback,
    restartGameplay,

    playPickupFeedback,
    createPickupEffects
  };

  function update(now) {
    switch (gameState) {
      case "openingSplash":
        break;

      case "splash":
        updateSplash(now);
        break;

      case "chapter1CutScene":
        updateChapter1CutScene(now);
        break;

      case "playing":
        if (isDoctorsOpinionLevel) {
          doctorsOpinionGame.update(now);
          break;
        }

        if (
          chapterTimer &&
          chapterTimer.isFinished()
        ) {
          finishChapter();
          break;
        }

        if (isTreatmentLevel) {
          treatmentGame.update(now);
          updateTreatmentMusic(now);
          break;
        }

        if (typeof currentChapter?.updateGameplay === "function") {
          currentChapter.updateGameplay(
            window.RecoveryRuntime.createChapterRuntime(
              chapterRuntimeContext,
              now
            )
          );
        }

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
      case "openingSplash":
        drawOpeningSplashScreen(now);
        break;

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
        if (isDoctorsOpinionLevel) {
          doctorsOpinionGame.draw(now);
          break;
        }

        if (isTreatmentLevel) {
          treatmentGame.draw();
          drawGameplayHud();
          break;
        }

        if (typeof currentChapter?.drawGameplay === "function") {
          currentChapter.drawGameplay(
            window.RecoveryRuntime.createChapterRuntime(
              chapterRuntimeContext,
              now
            )
          );
        }

        drawGameplayHud();
        break;
      }

      case "treatmentFailed":
        treatmentGame.draw();
        drawGameplayHud();
        treatmentGame.drawFailed();
        break;

      case "chapter3PreviewFinished":
        drawChapter3PreviewFinished();
        break;

      case "finished":
        if (isDoctorsOpinionLevel) {
          doctorsOpinionGame.draw(now);
        } else if (isTreatmentLevel) {
          treatmentGame.draw();
        } else if (
          typeof currentChapter?.drawGameplay === "function"
        ) {
          currentChapter.drawGameplay(
            window.RecoveryRuntime.createChapterRuntime(
              chapterRuntimeContext,
              now,
              {
                screenShake: 0
              }
            )
          );
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
        cutsceneMusic.pause();
        return;
      }

      if (!audioUnlocked) {
        return;
      }

      if (gameState === "playing") {
        playAudio(backgroundMusic);
      } else if (gameState === "chapter1CutScene") {
        playAudio(cutsceneMusic);
      }
    }
  );

  // =====================================
  // MAIN GAME LOOP — UPDATES AND DRAWS THE CORRECT SCREEN EVERY FRAME
  // =====================================

  function gameLoop(now) {
    update(now);
    draw(now);

    requestAnimationFrame(
      gameLoop
    );
  }

  resetBill();

  if (gameState === "chapter1CutScene") {
    startCutsceneMusic();
  }

  requestAnimationFrame(
    gameLoop
  );
})();