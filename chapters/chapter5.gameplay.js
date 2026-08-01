/*
  CHAPTER 5 GAMEPLAY
  Working With Others — playable integration draft
*/

(() => {
  "use strict";

  function createChapter5Game({
    ctx,
    getWidth,
    getHeight,
    playClickFeedback,
    playPickupFeedback,
    setGameState
  }) {
    const DURATION_MS = 45000;

    const keys = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    /*
      MOBILE TOUCH CONTROL

      Press and slide anywhere on the canvas to steer Bill.
      Release your thumb to stop moving.
      A quick tap near a building performs the action.
    */
    const touchStick = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startedAt: 0,
      dragged: false
    };

    let suppressEngineTapUntil = 0;

    const quotes = [
      "GET LOST!",
      "I'M TRYING TO DRINK!",
      "COME BACK MONDAY.",
      "I DON'T HAVE A PROBLEM.",
      "WHO INVITED YOU?",
      "YOU'RE RUINING POKER NIGHT.",
      "I'M NOT READY.",
      "BEAT IT!",
      "YOU BUYING?",
      "I'LL QUIT TOMORROW."
    ];

    const buildings = [
      { x: 0.08, y: 0.13, w: 0.16, h: 0.16, name: "BAR" },
      { x: 0.33, y: 0.09, w: 0.17, h: 0.17, name: "PARTY" },
      { x: 0.59, y: 0.15, w: 0.16, h: 0.16, name: "POOL HALL" },
      { x: 0.10, y: 0.54, w: 0.18, h: 0.16, name: "BOWLING" },
      { x: 0.38, y: 0.52, w: 0.17, h: 0.16, name: "LIQUOR" },
      { x: 0.64, y: 0.54, w: 0.17, h: 0.16, name: "TAVERN" }
    ];

    const player = {
      x: 0,
      y: 0,
      size: 26,
      speed: 180,
      facingX: 0,
      facingY: 1
    };

    let phase = "intro";
    let startedAt = 0;
    let previousNow = 0;
    let remainingMs = DURATION_MS;
    let bubble = null;
    let bubbleEndsAt = 0;
    let interactionLockUntil = 0;
    let attempts = 0;
    let litPerson = -1;
    let hearts = 3;

    const learned = {
      acceptance: 0,
      empathy: 0,
      compassion: 0,
      honesty: 0
    };

    function reset(now) {
      const width = getWidth();
      const height = getHeight();

      phase = "intro";
      startedAt = now || performance.now();
      previousNow = startedAt;
      remainingMs = DURATION_MS;
      bubble = null;
      bubbleEndsAt = 0;
      interactionLockUntil = 0;
      attempts = 0;
      litPerson = -1;
      hearts = 3;

      learned.acceptance = 0;
      learned.empathy = 0;
      learned.compassion = 0;
      learned.honesty = 0;

      player.x = width * 0.43;
      player.y = height * 0.42;
    }

    function rectForBuilding(building) {
      const width = getWidth();
      const height = getHeight();

      return {
        x: building.x * width,
        y: building.y * height,
        width: building.w * width,
        height: building.h * height,
        name: building.name
      };
    }

    function playerNearBuilding(rect) {
      const px = player.x + player.size / 2;
      const py = player.y + player.size / 2;

      const closestX = Math.max(rect.x, Math.min(px, rect.x + rect.width));
      const closestY = Math.max(rect.y, Math.min(py, rect.y + rect.height));

      return Math.hypot(px - closestX, py - closestY) < 42;
    }

    function getNearbyBuilding() {
      for (const building of buildings) {
        const rect = rectForBuilding(building);

        if (playerNearBuilding(rect)) {
          return rect;
        }
      }

      return null;
    }

    function attemptHelp(now) {
      if (phase !== "playing" || now < interactionLockUntil) {
        return false;
      }

      const building = getNearbyBuilding();

      if (!building) {
        return false;
      }

      attempts += 1;
      litPerson = attempts % 8;
      hearts = Math.min(8, hearts + 1);

      learned.acceptance = Math.min(5, learned.acceptance + 1);
      learned.empathy = Math.min(5, learned.empathy + 1);
      learned.compassion = Math.min(5, learned.compassion + 1);
      learned.honesty = Math.min(5, learned.honesty + 1);

      bubble = {
        building: building.name,
        bill: "I FOUND THE SOLUTION TO YOUR ALCOHOLISM!",
        reply: quotes[Math.floor(Math.random() * quotes.length)]
      };

      bubbleEndsAt = now + 1500;
      interactionLockUntil = now + 1700;

      player.x -= player.facingX * 32;
      player.y -= player.facingY * 32;

      try {
        playPickupFeedback?.(2);
      } catch (_error) {
        // Sound must never stop gameplay.
      }

      return true;
    }

    function update(now) {
      if (!previousNow) {
        previousNow = now;
      }

      const dt = Math.min(0.05, Math.max(0, (now - previousNow) / 1000));
      previousNow = now;

      if (phase === "intro" || phase === "results") {
        return;
      }

      remainingMs = Math.max(0, DURATION_MS - (now - startedAt));

      if (remainingMs <= 0) {
        phase = "results";
        bubble = null;
        litPerson = -1;
        return;
      }

      let moveX = 0;
      let moveY = 0;

      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;
      if (keys.up) moveY -= 1;
      if (keys.down) moveY += 1;

      if (touchStick.active) {
        const dragX = touchStick.currentX - touchStick.startX;
        const dragY = touchStick.currentY - touchStick.startY;
        const dragDistance = Math.hypot(dragX, dragY);
        const deadZone = 10;

        if (dragDistance > deadZone) {
          const strength = Math.min(1, (dragDistance - deadZone) / 55);
          moveX += (dragX / dragDistance) * strength;
          moveY += (dragY / dragDistance) * strength;
        }
      }

      if (moveX || moveY) {
        const length = Math.hypot(moveX, moveY) || 1;
        moveX /= length;
        moveY /= length;

        player.facingX = moveX;
        player.facingY = moveY;

        player.x += moveX * player.speed * dt;
        player.y += moveY * player.speed * dt;
      }

      const width = getWidth();
      const height = getHeight();
      const hudWidth = Math.max(185, width * 0.24);
      const playWidth = width - hudWidth;

      player.x = Math.max(6, Math.min(playWidth - player.size - 6, player.x));
      player.y = Math.max(6, Math.min(height - player.size - 6, player.y));

      if (bubble && now >= bubbleEndsAt) {
        bubble = null;
        litPerson = -1;
      }
    }

    function drawPersonIcon(x, y, active) {
      ctx.fillStyle = active ? "#78f06d" : "#6c7680";
      ctx.beginPath();
      ctx.arc(x, y - 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 6, y, 12, 13);
    }

    function drawBuilding(rect, nearby) {
      ctx.fillStyle = nearby ? "#d9a441" : "#9a6539";
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

      ctx.fillStyle = "#66331f";
      ctx.fillRect(
        rect.x + rect.width * 0.4,
        rect.y + rect.height * 0.56,
        rect.width * 0.2,
        rect.height * 0.44
      );

      ctx.strokeStyle = nearby ? "#fff07a" : "#392418";
      ctx.lineWidth = nearby ? 4 : 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 12px monospace";
      ctx.fillText(rect.name, rect.x + rect.width / 2, rect.y + 16);
    }

    function drawMap() {
      const width = getWidth();
      const height = getHeight();
      const hudWidth = Math.max(185, width * 0.24);
      const playWidth = width - hudWidth;

      ctx.fillStyle = "#4f9a52";
      ctx.fillRect(0, 0, playWidth, height);

      ctx.fillStyle = "#c4a66a";
      ctx.fillRect(playWidth * 0.43, 0, playWidth * 0.14, height);
      ctx.fillRect(0, height * 0.40, playWidth, height * 0.13);

      const nearby = getNearbyBuilding();

      for (const building of buildings) {
        const rect = rectForBuilding(building);

        if (rect.x + rect.width > playWidth) {
          continue;
        }

        drawBuilding(rect, nearby && nearby.name === rect.name);
      }

      ctx.fillStyle = "#173b74";
      ctx.fillRect(player.x, player.y, player.size, player.size);

      ctx.fillStyle = "#f0c59a";
      ctx.fillRect(
        player.x + player.size * 0.25,
        player.y + 2,
        player.size * 0.5,
        player.size * 0.34
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BILL", player.x + player.size / 2, player.y - 7);

      if (nearby && phase === "playing" && !bubble) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(player.x - 26, player.y - 33, 78, 22);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.fillText("TAP HERE", player.x + player.size / 2, player.y - 22);
      }

      if (touchStick.active && phase === "playing") {
        const dx = touchStick.currentX - touchStick.startX;
        const dy = touchStick.currentY - touchStick.startY;
        const distance = Math.hypot(dx, dy);
        const maxRadius = 42;
        const scale = distance > maxRadius ? maxRadius / distance : 1;

        ctx.save();
        ctx.globalAlpha = 0.55;

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(touchStick.startX, touchStick.startY, maxRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(
          touchStick.startX + dx * scale,
          touchStick.startY + dy * scale,
          15,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      }
    }

    function drawTrait(label, value, x, y, width) {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.font = "bold 11px monospace";
      ctx.fillText(label, x, y);

      ctx.fillStyle = "#303841";
      ctx.fillRect(x, y + 7, width, 8);

      ctx.fillStyle = "#78f06d";
      ctx.fillRect(x, y + 7, width * (value / 5), 8);
    }

    function drawHud() {
      const width = getWidth();
      const height = getHeight();
      const hudWidth = Math.max(185, width * 0.24);
      const hudX = width - hudWidth;

      ctx.fillStyle = "#101820";
      ctx.fillRect(hudX, 0, hudWidth, height);

      ctx.strokeStyle = "#d8c69e";
      ctx.lineWidth = 4;
      ctx.strokeRect(hudX + 3, 3, hudWidth - 6, height - 6);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 14px monospace";
      ctx.fillText("PEOPLE SOBER", hudX + hudWidth / 2, 30);

      for (let index = 0; index < 8; index += 1) {
        const column = index % 4;
        const row = Math.floor(index / 4);

        drawPersonIcon(
          hudX + 42 + column * 34,
          60 + row * 35,
          index === litPerson
        );
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.fillText("0", hudX + hudWidth / 2, 126);

      ctx.fillText("OUR FRIEND", hudX + hudWidth / 2, 158);

      ctx.fillStyle = "#e94f57";
      ctx.font = "18px serif";
      ctx.fillText("♥".repeat(Math.min(8, hearts)), hudX + hudWidth / 2, 184);

      const left = hudX + 18;
      const barWidth = hudWidth - 36;

      drawTrait("ACCEPTANCE", learned.acceptance, left, 222, barWidth);
      drawTrait("EMPATHY", learned.empathy, left, 262, barWidth);
      drawTrait("COMPASSION", learned.compassion, left, 302, barWidth);
      drawTrait("HONESTY", learned.honesty, left, 342, barWidth);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 15px monospace";
      ctx.fillText(
        `TIME ${Math.ceil(remainingMs / 1000)}`,
        hudX + hudWidth / 2,
        height - 34
      );
    }

    function wrapText(text, maxWidth) {
      const words = String(text).split(/\s+/);
      const lines = [];
      let line = "";

      for (const word of words) {
        const test = line ? `${line} ${word}` : word;

        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = word;
        }
      }

      if (line) lines.push(line);
      return lines;
    }

    function drawBubble() {
      if (!bubble) return;

      const width = getWidth();
      const hudWidth = Math.max(185, width * 0.24);
      const playWidth = width - hudWidth;

      const boxX = 24;
      const boxY = 24;
      const boxWidth = playWidth - 48;
      const boxHeight = 112;

      ctx.fillStyle = "#fffbea";
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.font = "bold 13px monospace";

      const billLines = wrapText(bubble.bill, boxWidth - 26);
      billLines.forEach((line, index) => {
        ctx.fillText(line, boxX + boxWidth / 2, boxY + 25 + index * 16);
      });

      ctx.fillStyle = "#a51d24";
      ctx.font = "bold 16px monospace";
      ctx.fillText(
        `${bubble.building}: "${bubble.reply}"`,
        boxX + boxWidth / 2,
        boxY + 86
      );
    }

    function drawIntro(now) {
      const width = getWidth();
      const height = getHeight();

      ctx.fillStyle = "#090b18";
      ctx.fillRect(0, 0, width, height);

      const flash = Math.floor(now / 180) % 2 === 0;

      ctx.fillStyle = flash ? "#ffe66d" : "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 25px monospace";
      ctx.fillText("WORKING WITH OTHERS", width / 2, height * 0.19);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 17px monospace";
      ctx.fillText("MOVE AROUND THE MAP", width / 2, height * 0.40);
      ctx.fillText("FIND PEOPLE TO SOBER UP", width / 2, height * 0.47);

      ctx.font = "14px monospace";
      ctx.fillText("PRESS AND SLIDE = MOVE", width / 2, height * 0.60);
      ctx.fillText("TAP NEAR A BUILDING = TALK", width / 2, height * 0.66);

      if (Math.floor(now / 500) % 2 === 0) {
        ctx.font = "bold 19px monospace";
        ctx.fillStyle = "#78f06d";
        ctx.fillText("► PRESS START ◄", width / 2, height * 0.81);
      }
    }

    function drawResults(now) {
      const width = getWidth();
      const height = getHeight();

      ctx.fillStyle = "#080b12";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 23px monospace";
      ctx.fillText("RESULTS", width / 2, height * 0.20);

      ctx.font = "bold 18px monospace";
      ctx.fillText("PEOPLE SOBER: 0", width / 2, height * 0.39);

      ctx.fillStyle = "#78f06d";
      ctx.fillText("OUR FRIEND STAYED SOBER", width / 2, height * 0.53);

      ctx.fillStyle = "#e94f57";
      ctx.font = "28px serif";
      ctx.fillText("♥ ♥ ♥ ♥ ♥", width / 2, height * 0.62);

      if (Math.floor(now / 500) % 2 === 0) {
        ctx.fillStyle = "#ffe66d";
        ctx.font = "bold 17px monospace";
        ctx.fillText("PRESS ENTER TO CONTINUE", width / 2, height * 0.79);
      }
    }

    function draw(now) {
      if (phase === "intro") {
        drawIntro(now);
        return;
      }

      if (phase === "results") {
        drawResults(now);
        return;
      }

      drawMap();
      drawHud();
      drawBubble();
    }

    function tap(_x, _y) {
      const now = performance.now();

      if (now < suppressEngineTapUntil) {
        return true;
      }

      if (phase === "intro") {
        phase = "playing";
        startedAt = now;
        previousNow = now;

        try {
          playClickFeedback?.();
        } catch (_error) {
          // Ignore audio errors.
        }

        return true;
      }

      if (phase === "playing") {
        return attemptHelp(now);
      }

      if (phase === "results") {
        try {
          setGameState?.("finished");
        } catch (_error) {
          // Let the engine remain stable if the state hook is unavailable.
        }

        return true;
      }

      return false;
    }


    function canvasPointFromPointer(event) {
      const canvas = ctx.canvas;
      const rect = canvas.getBoundingClientRect();

      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function handlePointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const point = canvasPointFromPointer(event);

      touchStick.active = true;
      touchStick.pointerId = event.pointerId;
      touchStick.startX = point.x;
      touchStick.startY = point.y;
      touchStick.currentX = point.x;
      touchStick.currentY = point.y;
      touchStick.startedAt = performance.now();
      touchStick.dragged = false;

      try {
        ctx.canvas.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Pointer capture is helpful but not required.
      }

      event.preventDefault();
    }

    function handlePointerMove(event) {
      if (
        !touchStick.active ||
        touchStick.pointerId !== event.pointerId
      ) {
        return;
      }

      const point = canvasPointFromPointer(event);

      touchStick.currentX = point.x;
      touchStick.currentY = point.y;

      if (
        Math.hypot(
          touchStick.currentX - touchStick.startX,
          touchStick.currentY - touchStick.startY
        ) > 12
      ) {
        touchStick.dragged = true;
      }

      event.preventDefault();
    }

    function finishPointer(event) {
      if (
        !touchStick.active ||
        touchStick.pointerId !== event.pointerId
      ) {
        return;
      }

      const now = performance.now();
      const wasTap =
        !touchStick.dragged &&
        now - touchStick.startedAt < 350;

      touchStick.active = false;
      touchStick.pointerId = null;

      if (wasTap) {
        suppressEngineTapUntil = now + 250;
        tap(touchStick.currentX, touchStick.currentY);
      } else {
        /*
          Prevent the engine's normal release/click handler from turning
          the end of a drag into an accidental building interaction.
        */
        suppressEngineTapUntil = now + 300;
      }

      event.preventDefault();
    }

    function handleKeyDown(event) {
      if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = true;
      if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = true;
      if (event.code === "ArrowUp" || event.code === "KeyW") keys.up = true;
      if (event.code === "ArrowDown" || event.code === "KeyS") keys.down = true;

      if (
        event.code === "Space" ||
        event.code === "Enter" ||
        event.code === "KeyE"
      ) {
        event.preventDefault();
        tap(0, 0);
      }
    }

    function handleKeyUp(event) {
      if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = false;
      if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = false;
      if (event.code === "ArrowUp" || event.code === "KeyW") keys.up = false;
      if (event.code === "ArrowDown" || event.code === "KeyS") keys.down = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    ctx.canvas.style.touchAction = "none";
    ctx.canvas.addEventListener("pointerdown", handlePointerDown, {
      passive: false,
      capture: true
    });
    ctx.canvas.addEventListener("pointermove", handlePointerMove, {
      passive: false,
      capture: true
    });
    ctx.canvas.addEventListener("pointerup", finishPointer, {
      passive: false,
      capture: true
    });
    ctx.canvas.addEventListener("pointercancel", finishPointer, {
      passive: false,
      capture: true
    });

    return {
      reset,
      update,
      tap,
      draw
    };
  }

  window.RecoveryChapter5Gameplay = {
    createChapterGame: createChapter5Game,
    createChapter5Game
  };
})();