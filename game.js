(() => {
  "use strict";

  // =====================================
  // CORE SETUP
  // =====================================

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const engine = window.RecoveryEngine;
  const currentChapter = engine.getChapter(0);

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

  const splashImage = new Image();

  splashImage.src =
    "assets/splash/recovery-misfits-splash.png";

  const titleImage = new Image();

  titleImage.src =
    "assets/title/unofficial-title.png";

  // =====================================
  // PLAYER
  // =====================================

  const bill = {
    x: 120,
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
    bill.x = 120;

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
  // OBSTACLES
  // =====================================

  const activeObstacles = [];

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

  function resetObstacles() {
    activeObstacles.length = 0;

    nextObstacleSpawnAt =
      performance.now() + 1200;
  }

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
      into a fast diagonal obstacle.
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

      activeObstacles.push({
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

    activeObstacles.push({
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

  function updateObstacles(now) {
    if (now >= nextObstacleSpawnAt) {
      spawnObstacle(now);
    }

    for (
      let index =
        activeObstacles.length - 1;
      index >= 0;
      index -= 1
    ) {
      const obstacle =
        activeObstacles[index];

      if (
        obstacle.movement === "diagonal"
      ) {
        obstacle.x +=
          obstacle.velocityX;

        obstacle.y +=
          obstacle.velocityY;

        const isOffscreen =
          obstacle.x +
              obstacle.width <
            -80 ||
          obstacle.y +
              obstacle.height <
            -80 ||
          obstacle.y >
            height + 80;

        if (isOffscreen) {
          activeObstacles.splice(
            index,
            1
          );
        }

        continue;
      }

      obstacle.x -= obstacle.speed;

      if (
        obstacle.x +
          obstacle.width <
        -40
      ) {
        activeObstacles.splice(
          index,
          1
        );
      }
    }
  }

  function drawObstacles() {
    ctx.imageSmoothingEnabled = false;

    for (
      const obstacle of activeObstacles
    ) {
      const image =
        obstacleImages.get(
          obstacle.definition.id
        );

      if (
        image &&
        image.complete &&
        image.naturalWidth > 0
      ) {
        ctx.drawImage(
          image,
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height
        );
      }
    }
  }

  function rectanglesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function checkObstacleCollisions() {
    /*
      These reduced hitboxes prevent
      transparent areas, speech bubbles,
      hats and bottles from causing
      unfair collisions.
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

    for (
      const obstacle of activeObstacles
    ) {
      const obstacleHitbox = {
        x:
          obstacle.x +
          obstacle.width * 0.32,

        y:
          obstacle.y +
          obstacle.height * 0.38,

        width:
          obstacle.width * 0.36,

        height:
          obstacle.height * 0.48
      };

      if (
        rectanglesOverlap(
          billHitbox,
          obstacleHitbox
        )
      ) {
        restartGameplay();
        return;
      }
    }
  }

  function restartGameplay() {
    resetBill();
    resetObstacles();

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

    chapterFinished = false;
    backgroundOffset = 0;

    chapterTimer =
      engine.createTimer(0);

    gameState = "playing";
  }

  function finishChapter() {
    chapterFinished = true;
    gameState = "finished";
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
      showStoryCards();
      return;
    }

    if (gameState === "story") {
      advanceStoryCard();
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

  canvas.addEventListener(
    "pointerdown",
    handlePrimaryAction
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (
        gameState !== "playing"
      ) {
        return;
      }

      if (
        event.pointerType ===
          "mouse" &&
        event.buttons === 0
      ) {
        return;
      }

      bill.targetY =
        event.clientY -
        bill.height / 2;

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
          gameState === "story"
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

    if (
      billImage.complete &&
      billImage.naturalWidth > 0
    ) {
      ctx.drawImage(
        billImage,
        bill.x,
        bill.y,
        bill.width,
        bill.height
      );

      return;
    }

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      bill.x,
      bill.y,
      bill.width,
      bill.height
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

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px monospace";

    ctx.fillText(
      "Drag up and down",
      20,
      32
    );

    ctx.font = "13px monospace";

    ctx.fillText(
      currentChapter.title,
      20,
      55
    );

    ctx.font = "22px monospace";
    ctx.textAlign = "right";

    ctx.fillText(
      chapterTimer.getRemainingSeconds(),
      width - 25,
      40
    );

    ctx.textAlign = "left";
  }

  // =====================================
  // FINISHED SCREEN
  // =====================================

  function drawChapterFinished() {
    ctx.fillStyle =
      "rgba(0, 0, 0, 0.78)";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "28px monospace";

    ctx.fillText(
      "CHAPTER COMPLETE",
      width / 2,
      height / 2 - 20
    );

    ctx.font = "18px monospace";

    ctx.fillText(
      "More story coming next.",
      width / 2,
      height / 2 + 25
    );

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

      case "playing":
        drawBackground();
        drawObstacles();
        drawBill();
        drawGameplayHud();
        break;

      case "finished":
        drawBackground();
        drawObstacles();
        drawBill();
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