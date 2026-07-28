(() => {
  "use strict";

  function loadImageMap(definitions) {
    const images = new Map();

    for (const definition of definitions) {
      const image = new Image();
      image.src = definition.image || "";
      images.set(definition.id, image);
    }

    return images;
  }

  function createState(chapter) {
    const obstacleDefinitions = chapter?.gameplay?.obstacles || [];
    const collectibleDefinitions = chapter?.gameplay?.collectibles || [];

    return {
      activeEntities: [],
      obstacleDefinitions,
      obstacleImages: loadImageMap(obstacleDefinitions),
      collectibleDefinitions,
      collectibleImages: loadImageMap(collectibleDefinitions),
      nextObstacleSpawnAt: 0,
      nextCollectibleSpawnAt: 0,

      resetChapter(options = {}) {
        resetEntities(this, {
          activeEntities: this.activeEntities,
          easierRetry: Boolean(options.easierRetry)
        });
      },

      updateChapter(runtime) {
        updateGameplay(this, runtime);
      },

      drawChapter(runtime) {
        drawGameplay(this, runtime);
      }
    };
  }

  function getRandomSpawnDelay(state, runtime) {
    const minimumDelay = runtime.easierRetry ? 2700 : 1700;
    const maximumDelay = runtime.easierRetry ? 4500 : 3000;

    return minimumDelay + Math.random() * (maximumDelay - minimumDelay);
  }

  function getRandomCollectibleSpawnDelay() {
    return 700 + Math.random() * 700;
  }

  function resetEntities(state, runtime) {
    runtime.activeEntities.length = 0;

    state.nextObstacleSpawnAt =
      performance.now() + (runtime.easierRetry ? 2200 : 1200);

    state.nextCollectibleSpawnAt = performance.now() + 500;
  }

  function spawnObstacle(state, runtime) {
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

    if (obstacleDefinitions.length === 0) return;

    const definition =
      obstacleDefinitions[Math.floor(Math.random() * obstacleDefinitions.length)];

    const obstacleHeight = definition.height || 180;
    const image = obstacleImages.get(definition.id);
    const aspectRatio =
      image && image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight
        : 1;

    const obstacleWidth = obstacleHeight * aspectRatio;
    const movement = definition.movement || "horizontal";
    let x;
    let y;

    if (movement === "vertical") {
      x = width + obstacleWidth;
      y = height - obstacleHeight - 25;

      const dx = bill.x - x;
      const dy = bill.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      const baseSpeed = definition.speed || 7;
      const speed = easierRetry ? baseSpeed * 0.62 : baseSpeed;

      activeEntities.push({
        type: "hazard",
        definition,
        x,
        y,
        width: obstacleWidth,
        height: obstacleHeight,
        movement: "diagonal",
        speed,
        velocityX: (dx / distance) * speed,
        velocityY: (dy / distance) * speed
      });

      state.nextObstacleSpawnAt = now + getRandomSpawnDelay(state, runtime);
      return;
    }

    x = width + obstacleWidth;
    y = height - obstacleHeight - 25;

    activeEntities.push({
      type: "hazard",
      definition,
      x,
      y,
      width: obstacleWidth,
      height: obstacleHeight,
      movement,
      speed: easierRetry
        ? (definition.speed || 4) * 0.62
        : definition.speed || 4
    });

    state.nextObstacleSpawnAt = now + getRandomSpawnDelay(state, runtime);
  }

  function spawnCollectible(state, runtime) {
    const {
      now,
      width,
      height,
      activeEntities,
      collectibleDefinitions,
      collectibleImages
    } = runtime;

    if (collectibleDefinitions.length === 0) return;

    const definition =
      collectibleDefinitions[Math.floor(Math.random() * collectibleDefinitions.length)];

    const collectibleHeight = definition.height || 80;
    const image = collectibleImages.get(definition.id);
    const aspectRatio =
      image && image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight
        : 1;

    const collectibleWidth = collectibleHeight * aspectRatio;
    const topLimit = 70;
    const bottomLimit = Math.max(topLimit, height - collectibleHeight - 45);
    const y = topLimit + Math.random() * (bottomLimit - topLimit);

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

    state.nextCollectibleSpawnAt = now + getRandomCollectibleSpawnDelay();
  }

  function updateObstacles(state, runtime) {
    const { now, height, activeEntities } = runtime;

    if (now >= state.nextObstacleSpawnAt) spawnObstacle(state, runtime);

    for (let index = activeEntities.length - 1; index >= 0; index -= 1) {
      const entity = activeEntities[index];
      if (entity.type !== "hazard") continue;

      if (entity.movement === "diagonal") {
        entity.x += entity.velocityX;
        entity.y += entity.velocityY;

        const isOffscreen =
          entity.x + entity.width < -80 ||
          entity.y + entity.height < -80 ||
          entity.y > height + 80;

        if (isOffscreen) activeEntities.splice(index, 1);
        continue;
      }

      entity.x -= entity.speed;
      if (entity.x + entity.width < -40) activeEntities.splice(index, 1);
    }
  }

  function updateCollectibles(state, runtime) {
    const { now, activeEntities } = runtime;

    if (now >= state.nextCollectibleSpawnAt) spawnCollectible(state, runtime);

    for (let index = activeEntities.length - 1; index >= 0; index -= 1) {
      const entity = activeEntities[index];
      if (entity.type !== "collectible") continue;

      entity.x -= entity.speed;
      if (entity.x + entity.width < -40) activeEntities.splice(index, 1);
    }
  }

  function drawObstacles(runtime) {
    const { ctx, activeEntities, obstacleImages } = runtime;
    ctx.imageSmoothingEnabled = false;

    for (const entity of activeEntities) {
      if (entity.type !== "hazard") continue;
      const image = obstacleImages.get(entity.definition.id);

      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, entity.x, entity.y, entity.width, entity.height);
      }
    }
  }

  function drawCollectibles(runtime) {
    const { ctx, activeEntities, collectibleImages } = runtime;
    ctx.imageSmoothingEnabled = false;

    for (const entity of activeEntities) {
      if (entity.type !== "collectible") continue;
      const image = collectibleImages.get(entity.definition.id);

      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, entity.x, entity.y, entity.width, entity.height);
        continue;
      }

      ctx.fillStyle = "#f2c94c";
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
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

  function drawGameplay(state, runtime) {
    const { ctx, screenShake, drawBackground, drawBill, drawPickupEffects } = runtime;
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawObstacles(runtime);
    drawCollectibles(runtime);
    drawBill();
    drawPickupEffects();
    ctx.restore();
  }

  function rectanglesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function createNearMissEffects(runtime, entity, billHitbox) {
    const {
      floatingNumbers,
      pickupParticles,
      getScreenShake,
      setScreenShake,
      getBillPickupBounce,
      setBillPickupBounce
    } = runtime;

    const words = ["WHEW!", "CLOSE ONE!", "TOO CLOSE!"];

    floatingNumbers.push({
      x: billHitbox.x + billHitbox.width / 2 + 28,
      y: billHitbox.y - 10,
      text: words[Math.floor(Math.random() * words.length)],
      life: 1,
      velocityY: -1.25,
      scale: 0.72,
      color: "#8fe9ff"
    });

    const burstX = Math.max(billHitbox.x + billHitbox.width, entity.x);
    const burstY = billHitbox.y + billHitbox.height / 2;

    for (let index = 0; index < 10; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.2;

      pickupParticles.push({
        x: burstX,
        y: burstY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        gravity: 0.03,
        size: 2 + Math.floor(Math.random() * 4),
        life: 1,
        decay: 0.035 + Math.random() * 0.025,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        color: Math.random() > 0.5 ? "#8fe9ff" : "#ffffff"
      });
    }

    setScreenShake(Math.max(getScreenShake(), 2.5));
    setBillPickupBounce(Math.max(getBillPickupBounce(), 0.45));
  }

  function checkObstacleCollisions(state, runtime) {
    const {
      bill,
      activeEntities,
      easierRetry,
      setEasierRetry,
      playCrashFeedback,
      restartGameplay
    } = runtime;

    const billHitbox = {
      x: bill.x + bill.width * (easierRetry ? 0.37 : 0.3),
      y: bill.y + bill.height * (easierRetry ? 0.33 : 0.25),
      width: bill.width * (easierRetry ? 0.26 : 0.4),
      height: bill.height * (easierRetry ? 0.34 : 0.5)
    };

    for (const entity of activeEntities) {
      if (entity.type !== "hazard") continue;

      const entityHitbox = {
        x: entity.x + entity.width * (easierRetry ? 0.4 : 0.32),
        y: entity.y + entity.height * (easierRetry ? 0.44 : 0.38),
        width: entity.width * (easierRetry ? 0.2 : 0.36),
        height: entity.height * (easierRetry ? 0.32 : 0.48)
      };

      if (rectanglesOverlap(billHitbox, entityHitbox)) {
        setEasierRetry(true);
        playCrashFeedback();
        restartGameplay();
        return;
      }

      const nearMissPadding = 34;
      const nearMissZone = {
        x: entityHitbox.x - nearMissPadding,
        y: entityHitbox.y - nearMissPadding,
        width: entityHitbox.width + nearMissPadding * 2,
        height: entityHitbox.height + nearMissPadding * 2
      };

      if (rectanglesOverlap(billHitbox, nearMissZone)) {
        entity.nearMissArmed = true;
      }

      const hazardHasPassedBill =
        entityHitbox.x + entityHitbox.width < billHitbox.x;

      if (entity.nearMissArmed && !entity.nearMissTriggered && hazardHasPassedBill) {
        entity.nearMissTriggered = true;
        createNearMissEffects(runtime, entity, billHitbox);
      }
    }
  }

  function checkCollectibleCollisions(state, runtime) {
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

    for (let index = activeEntities.length - 1; index >= 0; index -= 1) {
      const entity = activeEntities[index];
      if (entity.type !== "collectible") continue;

      const collectibleHitbox = {
        x: entity.x + entity.width * 0.12,
        y: entity.y + entity.height * 0.12,
        width: entity.width * 0.76,
        height: entity.height * 0.76
      };

      if (!rectanglesOverlap(billHitbox, collectibleHitbox)) continue;

      const effectStrength = Number(entity.definition.value) || 1;
      addScore(1);
      playPickupFeedback(effectStrength);
      createPickupEffects(entity, 1, effectStrength);
      activeEntities.splice(index, 1);
    }
  }

  function updateGameplay(state, runtime) {
    const { bill, updateBackground, updatePickupEffects } = runtime;

    bill.y += (bill.targetY - bill.y) * 0.24;
    updateBackground();
    updateObstacles(state, runtime);
    updateCollectibles(state, runtime);
    updatePickupEffects();
    checkCollectibleCollisions(state, runtime);
    checkObstacleCollisions(state, runtime);
  }

  window.RecoveryEntities = {
    createState,
    getRandomSpawnDelay,
    getRandomCollectibleSpawnDelay,
    resetEntities,
    spawnObstacle,
    spawnCollectible,
    updateObstacles,
    updateCollectibles,
    drawGameplay,
    drawObstacles,
    drawCollectibles,
    rectanglesOverlap,
    createNearMissEffects,
    checkObstacleCollisions,
    checkCollectibleCollisions,
    updateGameplay
  };
})();