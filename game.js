(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const engine = window.RecoveryEngine;
  const currentChapter = engine.getChapter(0);

  let width = 0;
  let height = 0;
  let backgroundOffset = 0;

  let gameState = "title";
  let chapterTimer = null;
  let chapterFinished = false;

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
  // IMAGES
  // =====================================

  const billImage = new Image();
  billImage.src = "runner.png";

  const titleImage = new Image();
  titleImage.src = "unofficial-title.png";

  // =====================================
  // BILL
  // =====================================

  const bill = {
    x: 120,
    y: 200,
    width: 145,
    height: 123,
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
  // GAME START
  // =====================================

  function startGame() {
    if (gameState !== "title") {
      return;
    }

    resetBill();

    chapterFinished = false;
    chapterTimer = engine.createTimer(0);

    gameState = "playing";
  }

  // =====================================
  // INPUT
  // =====================================

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (gameState === "title") {
        startGame();
        return;
      }

      if (gameState !== "playing") {
        return;
      }

      bill.targetY =
        event.clientY - bill.height / 2;

      keepBillOnScreen();
    }
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (gameState !== "playing") {
        return;
      }

      if (
        event.buttons === 0 &&
        event.pointerType === "mouse"
      ) {
        return;
      }

      bill.targetY =
        event.clientY - bill.height / 2;

      keepBillOnScreen();
    }
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (
        gameState === "title" &&
        (
          event.key === "Enter" ||
          event.key === " "
        )
      ) {
        startGame();
        return;
      }

      if (gameState !== "playing") {
        return;
      }

      if (event.key === "ArrowUp") {
        bill.targetY -= 70;
      }

      if (event.key === "ArrowDown") {
        bill.targetY += 70;
      }

      keepBillOnScreen();
    }
  );

  // =====================================
  // BACKGROUND
  // =====================================

  function updateBackground() {
    backgroundOffset -= 1.2;

    if (backgroundOffset <= -140) {
      backgroundOffset += 140;
    }
  }

  function drawBackground() {
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
      let x = backgroundOffset - 140;
      x < width + 140;
      x += 140
    ) {
      const buildingHeight =
        130 +
        (
          Math.abs(buildingNumber) % 3
        ) * 40;

      ctx.fillRect(
        x,
        height * 0.65 - buildingHeight,
        110,
        buildingHeight
      );

      buildingNumber += 1;
    }

    ctx.fillStyle = "#ffd66b";

    for (
      let x = backgroundOffset - 115;
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

  // =====================================
  // UPDATE
  // =====================================

  function update() {
    if (gameState !== "playing") {
      return;
    }

    if (
      chapterTimer &&
      chapterTimer.isFinished()
    ) {
      chapterFinished = true;
      gameState = "finished";
      return;
    }

    bill.y +=
      (bill.targetY - bill.y) * 0.14;

    updateBackground();
  }

  // =====================================
  // DRAW BILL
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
    } else {
      ctx.fillStyle = "#ffffff";

      ctx.fillRect(
        bill.x,
        bill.y,
        bill.width,
        bill.height
      );
    }
  }

  // =====================================
  // HUD
  // =====================================

  function drawInstructions() {
    if (
      gameState !== "playing" ||
      !chapterTimer
    ) {
      return;
    }

    ctx.fillStyle = "#ffffff";

    ctx.font = "16px monospace";

    ctx.fillText(
      "Drag Bill up and down",
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

    if (
      titleImage.complete &&
      titleImage.naturalWidth > 0
    ) {
      const imageRatio =
        titleImage.naturalWidth /
        titleImage.naturalHeight;

      const screenRatio =
        width / height;

      let drawWidth;
      let drawHeight;
      let drawX;
      let drawY;

      if (imageRatio > screenRatio) {
        drawWidth = width;
        drawHeight = width / imageRatio;
        drawX = 0;
        drawY =
          (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imageRatio;
        drawX =
          (width - drawWidth) / 2;
        drawY = 0;
      }

      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(
        titleImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
    }

    const blink =
      Math.floor(performance.now() / 500) %
        2 ===
      0;

    if (blink) {
      ctx.fillStyle =
        "rgba(0, 0, 0, 0.72)";

      ctx.fillRect(
        width / 2 - 180,
        height - 92,
        360,
        48
      );

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "18px monospace";

      ctx.fillText(
        "CLICK, TAP, OR PRESS ENTER",
        width / 2,
        height - 60
      );

      ctx.textAlign = "left";
    }
  }

  // =====================================
  // CHAPTER COMPLETE
  // =====================================

  function drawChapterFinished() {
    if (!chapterFinished) {
      return;
    }

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
      "Story card coming next",
      width / 2,
      height / 2 + 25
    );

    ctx.textAlign = "left";
  }

  // =====================================
  // DRAW
  // =====================================

  function draw() {
    if (gameState === "title") {
      drawTitleScreen();
      return;
    }

    drawBackground();
    drawBill();
    drawInstructions();
    drawChapterFinished();
  }

  // =====================================
  // MAIN LOOP
  // =====================================

  function gameLoop() {
    update();
    draw();

    requestAnimationFrame(gameLoop);
  }

  resetBill();
  gameLoop();
})();