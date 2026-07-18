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

  let width = 0;
  let height = 0;

  // splash → title → story → playing → finished
  let gameState = "splash";

  // =====================================
  // SPLASH SETTINGS
  // =====================================

  const SPLASH_HOLD_MS = 2000;
  const SPLASH_FADE_MS = 800;

  let splashStartedAt = performance.now();

  // =====================================
  // CHAPTER STATE
  // =====================================

  let chapterTimer = null;
  let chapterFinished = false;
  let currentCardIndex = 0;

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
    currentChapter?.gameplay?.background?.image ||
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

  function unlockAudio() {
    if (audioUnlocked) {
      return;
    }

    audioUnlocked = true;

    backgroundMusic
      .play()
      .catch(() => {
        audioUnlocked = false;
      });
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
    return (
      MIN_SPAWN_DELAY +
      Math.random() *
        (MAX_SPAWN_DELAY - MIN_SPAWN_DELAY)
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
      performance.now() + 1200;

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

      const speed =
        definition.speed || 7;

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
      speed: definition.speed || 4
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

    const billHitbox = {
      x:
        bill.x +
        bill.width * 0.3,

      y:
        bill.y +
        bill.height * 0.25,

      width:
        bill.width * 0.4,

      height:
        bill.height * 0.5
    };

    for (const entity of activeEntities) {
      if (entity.type !== "hazard") {
        continue;
      }

      const entityHitbox = {
        x:
          entity.x +
          entity.width * 0.32,

        y:
          entity.y +
          entity.height * 0.38,

        width:
          entity.width * 0.36,

        height:
          entity.height * 0.48
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

  function restartGameplay() {
    resetBill();
    resetObstacles();
    resetPickupEffects();

    backgroundOffset = 0;
    chapterFinished = false;

    chapterTimer =
      engine.createTimer(0);

    gameState = "playing";
  }

  // =====================================
  // STATE CHANGES
  // =====================================

  function showTitleScreen() {
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

    gameState = "playing";

    /*
      Start the background music only when
      Bill's 30-second gameplay begins.
    */

    unlockAudio();
  }

  function finishChapter() {
    chapterFinished = true;
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
  // INPUT
  // =====================================

  function handlePrimaryAction(event) {
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

    if (gameState !== "playing") {
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
    if (gameState !== "playing") {
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
      showTitleScreen();
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
        const scale = Math.min(
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

    const counterWidth = Math.min(
      250,
      Math.max(180, width * 0.38)
    );

    const counterHeight = 28;
    const counterX = 20;
    const counterY = 74;

    ctx.save();

    // -------------------------------------
    // PLAY INSTRUCTION
    // -------------------------------------

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px monospace";

    ctx.fillText(
      "Drag up and down",
      20,
      30
    );

    ctx.font = "13px monospace";

    ctx.fillText(
      currentChapter.title,
      20,
      52
    );

    // -------------------------------------
    // ONE MORE TITLE
    // -------------------------------------

    const counterScale =
      1 + scorePulse * 0.08;

    ctx.save();

    ctx.translate(
      counterX,
      counterY
    );

    ctx.scale(
      counterScale,
      counterScale
    );

    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#fff2a8";

    ctx.strokeText(
      "ONE MORE...",
      0,
      -7
    );

    ctx.fillText(
      "ONE MORE...",
      0,
      -7
    );

    ctx.restore();

    // -------------------------------------
    // OPEN-ENDED BEER COUNTER
    // -------------------------------------

    ctx.fillStyle =
      "rgba(0, 0, 0, 0.78)";

    ctx.fillRect(
      counterX - 4,
      counterY - 4,
      counterWidth + 8,
      counterHeight + 8
    );

    ctx.fillStyle = "#3b2a16";

    ctx.fillRect(
      counterX,
      counterY,
      counterWidth,
      counterHeight
    );

    /*
      The gold sweep loops gently across the
      counter. It gives the HUD motion without
      suggesting there is a finish line.
    */

    const sweepWidth =
      Math.max(
        36,
        counterWidth * 0.22
      );

    const sweepTravel =
      counterWidth + sweepWidth;

    const sweepX =
      counterX -
      sweepWidth +
      (
        (performance.now() * 0.07) %
        sweepTravel
      );

    ctx.save();

    ctx.beginPath();

    ctx.rect(
      counterX,
      counterY,
      counterWidth,
      counterHeight
    );

    ctx.clip();

    ctx.fillStyle =
      "rgba(242, 169, 0, 0.72)";

    ctx.fillRect(
      sweepX,
      counterY,
      sweepWidth,
      counterHeight
    );

    ctx.fillStyle =
      "rgba(255, 255, 255, 0.34)";

    ctx.fillRect(
      sweepX,
      counterY + 3,
      sweepWidth,
      5
    );

    ctx.restore();

    // -------------------------------------
    // BEER TOTAL
    // -------------------------------------

    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";

    const beerLabel =
      `${Math.round(displayedScore)} BEERS`;

    ctx.strokeText(
      beerLabel,
      counterX + counterWidth / 2,
      counterY + counterHeight / 2 + 1
    );

    ctx.fillText(
      beerLabel,
      counterX + counterWidth / 2,
      counterY + counterHeight / 2 + 1
    );

    // -------------------------------------
    // TIMER
    // -------------------------------------

    ctx.font = "22px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
      chapterTimer.getRemainingSeconds(),
      width - 25,
      40
    );

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

      case "playing":
        if (
          chapterTimer &&
          chapterTimer.isFinished()
        ) {
          finishChapter();
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

      case "title":
        drawTitleScreen();
        break;

      case "story":
        drawStoryCard();
        break;

      case "playing": {
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

      case "finished":
        drawBackground();
        drawObstacles();
        drawCollectibles();
        drawBill();
        drawPickupEffects();
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

      if (audioUnlocked) {
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