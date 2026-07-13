(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const engine = window.RecoveryEngine;
const currentChapter = engine.getChapter(0);

  let width = 0;
  let height = 0;
  let backgroundOffset = 0;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    const scale = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const billImage = new Image();
  billImage.src = "runner.png";

  const bill = {
    x: 120,
    y: 200,
    width: 145,
    height: 123,
    targetY: 200
  };

  function keepBillOnScreen() {
    const topLimit = 40;
    const bottomLimit = height - bill.height - 40;

    bill.targetY = Math.max(
      topLimit,
      Math.min(bottomLimit, bill.targetY)
    );
  }

  canvas.addEventListener("pointerdown", (event) => {
    bill.targetY = event.clientY - bill.height / 2;
    keepBillOnScreen();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.buttons === 0 && event.pointerType === "mouse") {
      return;
    }

    bill.targetY = event.clientY - bill.height / 2;
    keepBillOnScreen();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      bill.targetY -= 70;
    }

    if (event.key === "ArrowDown") {
      bill.targetY += 70;
    }

    keepBillOnScreen();
  });

  function updateBackground() {
    backgroundOffset -= 1.2;

    if (backgroundOffset <= -140) {
      backgroundOffset += 140;
    }
  }

  function update() {
    bill.y += (bill.targetY - bill.y) * 0.14;
    updateBackground();
  }

  function drawBackground() {
    ctx.fillStyle = "#172330";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#263747";
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    ctx.fillStyle = "#10171d";

    let buildingNumber = 0;

    for (
      let x = backgroundOffset - 140;
      x < width + 140;
      x += 140
    ) {
      const buildingHeight =
        130 + (Math.abs(buildingNumber) % 3) * 40;

      ctx.fillRect(
        x,
        height * 0.65 - buildingHeight,
        110,
        buildingHeight
      );

      buildingNumber++;
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

  function drawBill() {
    ctx.imageSmoothingEnabled = false;

    if (billImage.complete && billImage.naturalWidth > 0) {
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

  function drawInstructions() {
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
  }

  function draw() {
    drawBackground();
    drawBill();
    drawInstructions();
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
})();