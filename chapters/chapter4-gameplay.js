(() => {
  "use strict";

  const ROUNDS = [
    {
      theme: "SURRENDER",
      question: "What usually keeps us from asking for help?",
      answers: [
        "Bad luck",
        "Pride",
        "Running out of money",
        "Not enough sleep"
      ],
      correct: 1,
      board: "PRIDE",
      score: 98,
      takeaway: "Pride kept telling us we could handle it on our own.",
      resistance: "BILL: Asking for help seems a little dramatic."
    },
    {
      theme: "HOPE",
      question: "What first made us think recovery might actually work?",
      answers: [
        "Winning the lottery",
        "Finding a better excuse",
        "Seeing recovered alcoholics who were happy",
        "Waiting for life to get easier"
      ],
      correct: 2,
      board: "RECOVERED ALCOHOLICS WHO WERE HAPPY",
      score: 96,
      takeaway: "They laughed, enjoyed life, and had something we wanted.",
      resistance: "BILL: Recovered and happy? Now that sounds suspicious."
    },
    {
      theme: "HONESTY",
      question: "What helped us finally start changing?",
      answers: [
        "Drinking only on weekends",
        "Hiding it better",
        "Getting honest with ourselves",
        "Waiting until tomorrow"
      ],
      correct: 2,
      board: "GETTING HONEST",
      score: 94,
      takeaway: "We could not change what we refused to face.",
      resistance: "BILL: We have been mostly honest... about some things."
    },
    {
      theme: "OPEN-MINDEDNESS",
      question: "What helped us hear a new solution?",
      answers: [
        "Winning more arguments",
        "Doing things our way",
        "Keeping an open mind",
        "Waiting for everyone else to change"
      ],
      correct: 2,
      board: "AN OPEN MIND",
      score: 93,
      takeaway: "We did not need all the answers. We only needed to listen.",
      resistance: "BILL: We already know what does not work. That should count."
    },
    {
      theme: "WILLINGNESS",
      question: "What helped us take the next step?",
      answers: [
        "Trying something different",
        "Waiting until we felt ready",
        "Thinking about it much harder",
        "Hoping the problem fixed itself"
      ],
      correct: 0,
      board: "TRYING SOMETHING DIFFERENT",
      score: 91,
      takeaway: "Willingness did not require certainty—only a beginning.",
      resistance: "BILL: How different are we talking here?"
    },
    {
      theme: "FAITH",
      question: "What did we discover we did not have to do anymore?",
      answers: [
        "Pretend everything was fine",
        "Depend only on ourselves",
        "Carry every problem alone",
        "Have every answer before starting"
      ],
      correct: 1,
      board: "DEPEND ONLY ON OURSELVES",
      score: 89,
      takeaway: "We became willing to believe help could come from beyond us.",
      resistance: "BILL: ...Maybe doing everything alone has not gone perfectly."
    }
  ];

  function createSurveySaysGame({
    ctx,
    getWidth,
    getHeight,
    backgroundMusic,
    stopBackgroundMusic,
    playClickFeedback,
    playPickupFeedback,
    setGameState
  }) {
    let phase = "intro";
    let phaseStartedAt = 0;
    let roundIndex = 0;
    let selectedIndex = -1;
    let firstTryCorrect = 0;
    let attemptsThisRound = 0;
    let message = "";
    let messageUntil = 0;
    let answerButtons = [];
    let continueButton = null;
    let shakeUntil = 0;
    let revealStartedAt = 0;
    let endingStartedAt = 0;
    let confetti = [];

    // Chapter 4 artwork. These files live in assets/players/chapter4/.
    const chapter4Assets = {
      questionBoard: loadImage("assets/players/chapter4/survey-board.png"),
      revealBoard: loadImage("assets/players/chapter4/board.png"),
      ebby: loadImage("assets/players/chapter4/ebby.png"),
      billThinking: loadImage("assets/players/chapter4/thinking.png"),
      speechBubble: loadImage("assets/players/chapter4/bubbe.png")
    };

    function loadImage(source) {
      const image = new Image();
      image.src = source;
      return image;
    }

    const safeClick = () => {
      if (typeof playClickFeedback === "function") playClickFeedback();
    };

    const safePickup = () => {
      if (typeof playPickupFeedback === "function") playPickupFeedback(3);
    };

    function reset(now = performance.now()) {
      phase = "intro";
      phaseStartedAt = now;
      roundIndex = 0;
      selectedIndex = -1;
      firstTryCorrect = 0;
      attemptsThisRound = 0;
      message = "";
      messageUntil = 0;
      answerButtons = [];
      continueButton = null;
      shakeUntil = 0;
      revealStartedAt = 0;
      endingStartedAt = 0;
      confetti = [];
    }

    function currentRound() {
      return ROUNDS[Math.min(roundIndex, ROUNDS.length - 1)];
    }

    function beginRound(now) {
      phase = "question";
      phaseStartedAt = now;
      selectedIndex = -1;
      attemptsThisRound = 0;
      message = "";
      messageUntil = 0;
    }

    function showMessage(text, duration = 1250) {
      message = text;
      messageUntil = performance.now() + duration;
    }

    function chooseAnswer(index, now) {
      if (phase !== "question") return;
      const round = currentRound();
      attemptsThisRound += 1;
      selectedIndex = index;

      if (index === round.correct) {
        if (attemptsThisRound === 1) firstTryCorrect += 1;
        safePickup();
        phase = "reveal";
        revealStartedAt = now;
        phaseStartedAt = now;
        message = "";
        return;
      }

      safeClick();
      shakeUntil = now + 380;
      const wrongLines = [
        "SURVEY SAYS... NOT QUITE.",
        "WE TRIED THAT ONE TOO.",
        "THAT ANSWER KEPT US BUSY—NOT RECOVERED.",
        "GOOD GUESS. BAD EXPERIENCE."
      ];
      showMessage(wrongLines[(attemptsThisRound - 1) % wrongLines.length], 1350);
    }

    function nextFromReveal(now) {
      phase = "resistance";
      phaseStartedAt = now;
    }

    function nextFromResistance(now) {
      if (roundIndex < ROUNDS.length - 1) {
        roundIndex += 1;
        beginRound(now);
      } else {
        phase = "ending";
        endingStartedAt = now;
        phaseStartedAt = now;
        makeConfetti();
      }
    }

    function makeConfetti() {
      const width = getWidth();
      const height = getHeight();
      confetti = Array.from({ length: 90 }, (_, i) => ({
        x: Math.random() * width,
        y: -Math.random() * height * 0.7,
        size: 4 + Math.random() * 7,
        speed: 0.8 + Math.random() * 2.2,
        drift: (Math.random() - 0.5) * 1.1,
        spin: Math.random() * Math.PI * 2,
        tone: i % 5
      }));
    }

    function update(now) {
      if (message && now >= messageUntil) message = "";

      if (phase === "ending") {
        confetti.forEach((piece) => {
          piece.y += piece.speed;
          piece.x += piece.drift + Math.sin(now * 0.004 + piece.spin) * 0.25;
          if (piece.y > getHeight() + 20) {
            piece.y = -20;
            piece.x = Math.random() * getWidth();
          }
        });
      }
    }

    function roundedRect(x, y, w, h, r = 10) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }

    function panel(x, y, w, h, fill = "#10283d", border = "#e0b44f") {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.45)";
      roundedRect(x + 6, y + 7, w, h, 12);
      ctx.fill();
      ctx.fillStyle = border;
      roundedRect(x, y, w, h, 12);
      ctx.fill();
      ctx.fillStyle = fill;
      roundedRect(x + 4, y + 4, w - 8, h - 8, 9);
      ctx.fill();
      ctx.restore();
    }

    function fitText(text, maxWidth, startSize, minSize = 12, weight = 900) {
      let size = startSize;
      while (size > minSize) {
        ctx.font = `${weight} ${size}px monospace`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 1;
      }
      return size;
    }

    function wrapText(text, maxWidth, startSize, maxLines = 3) {
      const size = fitText(text, maxWidth, startSize, 13);
      ctx.font = `900 ${size}px monospace`;
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.]+$/, "")}...`;
        return { lines: kept, size };
      }
      return { lines, size };
    }

    function drawCenteredLines(lines, x, centerY, lineHeight, maxWidth) {
      const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineHeight, maxWidth));
    }

    function imageReady(image) {
      return Boolean(
        image &&
        image.complete &&
        image.naturalWidth > 0 &&
        image.naturalHeight > 0
      );
    }

    function drawImageContained(image, x, y, targetWidth, targetHeight, alignX = 0.5, alignY = 0.5) {
      if (!imageReady(image)) return false;
      const scale = Math.min(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = x + (targetWidth - drawWidth) * alignX;
      const drawY = y + (targetHeight - drawHeight) * alignY;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
      return true;
    }


    function drawImageCropped(image, crop, x, y, targetWidth, targetHeight) {
      if (!imageReady(image)) return false;

      const sourceX = Math.round(image.naturalWidth * crop.x);
      const sourceY = Math.round(image.naturalHeight * crop.y);
      const sourceWidth = Math.round(image.naturalWidth * crop.width);
      const sourceHeight = Math.round(image.naturalHeight * crop.height);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        sourceX, sourceY, sourceWidth, sourceHeight,
        x, y, targetWidth, targetHeight
      );
      ctx.restore();
      return true;
    }



    function drawImageCroppedContained(image, crop, x, y, targetWidth, targetHeight, alignX = 0.5, alignY = 1) {
      if (!imageReady(image)) return false;

      const sourceX = Math.round(image.naturalWidth * crop.x);
      const sourceY = Math.round(image.naturalHeight * crop.y);
      const sourceWidth = Math.round(image.naturalWidth * crop.width);
      const sourceHeight = Math.round(image.naturalHeight * crop.height);
      const sourceAspect = sourceWidth / sourceHeight;
      const targetAspect = targetWidth / targetHeight;

      let drawWidth;
      let drawHeight;
      if (sourceAspect > targetAspect) {
        drawWidth = targetWidth;
        drawHeight = drawWidth / sourceAspect;
      } else {
        drawHeight = targetHeight;
        drawWidth = drawHeight * sourceAspect;
      }

      const drawX = x + (targetWidth - drawWidth) * alignX;
      const drawY = y + (targetHeight - drawHeight) * alignY;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        sourceX, sourceY, sourceWidth, sourceHeight,
        drawX, drawY, drawWidth, drawHeight
      );
      ctx.restore();
      return true;
    }

    const artCrops = {
      questionBoard: { x: 0.12, y: 0.015, width: 0.76, height: 0.86 },
      revealBoard: { x: 0.095, y: 0.075, width: 0.81, height: 0.75 },
      ebby: { x: 0.28, y: 0.035, width: 0.46, height: 0.91 },
      bill: { x: 0.20, y: 0.025, width: 0.60, height: 0.94 },
      bubble: { x: 0.14, y: 0.065, width: 0.72, height: 0.77 }
    };

    function drawImageCover(image, x, y, targetWidth, targetHeight) {
      if (!imageReady(image)) return false;
      const scale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
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

    function drawBackground(now) {
      const width = getWidth();
      const height = getHeight();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#09121f");
      gradient.addColorStop(0.55, "#142944");
      gradient.addColorStop(1, "#06090e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#f4ce6d";
      for (let x = -height; x < width + height; x += 95) {
        ctx.beginPath();
        ctx.moveTo(width / 2, height * 0.18);
        ctx.lineTo(x, height);
        ctx.lineTo(x + 35, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(0, height * 0.83, width, height * 0.17);

      const pulse = 0.72 + Math.sin(now * 0.006) * 0.18;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#f5c853";
      for (let i = 0; i < 12; i += 1) {
        const x = (i + 0.5) * (width / 12);
        ctx.beginPath();
        ctx.arc(x, height * 0.075, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawHeader(now) {
      const width = getWidth();
      const height = getHeight();
      const margin = Math.max(12, width * 0.02);
      panel(margin, margin, width - margin * 2, Math.max(62, height * 0.085), "#581d21", "#f0c557");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff0a7";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.font = `900 ${Math.max(27, Math.min(48, width * 0.055))}px monospace`;
      ctx.fillText("SURVEY SAYS!", width / 2, margin + Math.max(62, height * 0.085) / 2 + 1, width * 0.82);
      ctx.shadowBlur = 0;
    }

    function drawHopeMeter(yRatio = 0.89) {
      const width = getWidth();
      const height = getHeight();
      const x = width * 0.08;
      const y = height * yRatio;
      const w = width * 0.84;
      const h = Math.max(26, height * 0.037);
      panel(x, y, w, h, "#08131a", "#b58b38");
      const innerX = x + 8;
      const innerY = y + 8;
      const innerW = w - 16;
      const innerH = h - 16;
      const filled = phase === "ending" ? 6 : roundIndex + (phase === "reveal" || phase === "resistance" ? 1 : 0);
      const gap = 5;
      const segW = (innerW - gap * 5) / 6;
      for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = i < filled ? "#f4d35e" : "#253544";
        ctx.fillRect(innerX + i * (segW + gap), innerY, segW, innerH);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(12, height * 0.018)}px monospace`;
      ctx.fillText("HOPE METER", width / 2, y - 5);
    }

    function drawIntro(now) {
      const width = getWidth();
      const height = getHeight();
      drawBackground(now);
      drawHeader(now);

      panel(width * 0.09, height * 0.22, width * 0.82, height * 0.48, "#10243a", "#e8b74e");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.max(18, width * 0.030)}px monospace`;
      ctx.fillText("BROADCASTING LIVE FROM", width / 2, height * 0.31, width * 0.72);
      ctx.fillStyle = "#f5d56d";
      ctx.font = `900 ${Math.max(24, width * 0.047)}px monospace`;
      ctx.fillText("OUR CONTESTANT'S LIVING ROOM!", width / 2, height * 0.39, width * 0.74);

      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(16, width * 0.025)}px monospace`;
      ctx.fillText("WE SURVEYED 100 RECOVERED ALCOHOLICS...", width / 2, height * 0.51, width * 0.76);
      ctx.fillText("SIX ROUNDS. FOUR CHOICES. ONE COMMON EXPERIENCE.", width / 2, height * 0.57, width * 0.76);

      ctx.fillStyle = "#f5d56d";
      ctx.font = `900 ${Math.max(16, width * 0.025)}px monospace`;
      ctx.fillText("TAP TO PLAY", width / 2, height * 0.64);
    }

    function drawQuestion(now) {
      const width = getWidth();
      const height = getHeight();
      const round = currentRound();
      const shake = now < shakeUntil ? Math.sin(now * 0.12) * 7 : 0;

      ctx.save();
      ctx.translate(shake, 0);
      drawBackground(now);

      const portraitLayout = width < height * 0.82;

      // The generated PNGs contain wide empty margins. Crop those margins
      // before scaling so the actual artwork—not the full 1536×1024 canvas—
      // fills the game screen.
      const boardX = portraitLayout ? width * 0.015 : width * 0.15;
      const boardY = portraitLayout ? height * 0.025 : height * 0.025;
      const boardW = portraitLayout ? width * 0.97 : width * 0.70;
      const boardH = portraitLayout ? boardW / 1.32 : boardW / 1.32;

      if (portraitLayout) {
        const peopleY = boardY + boardH + height * 0.018;
        // Bill is the contestant on the left; Ebby is the host on the right.
        // Both are drawn about 50% larger than the previous layout.
        drawImageCropped(chapter4Assets.billThinking, artCrops.bill, width * 0.005, peopleY, width * 0.43, height * 0.285);
        drawImageCropped(chapter4Assets.ebby, artCrops.ebby, width * 0.565, peopleY, width * 0.43, height * 0.285);
      } else {
        const characterTop = height * 0.39;
        drawImageCropped(chapter4Assets.billThinking, artCrops.bill, width * 0.005, characterTop, width * 0.37, height * 0.735);
        drawImageCropped(chapter4Assets.ebby, artCrops.ebby, width * 0.625, characterTop, width * 0.37, height * 0.735);
      }

      const boardDrawn = drawImageCropped(
        chapter4Assets.questionBoard,
        artCrops.questionBoard,
        boardX, boardY, boardW, boardH
      );

      if (!boardDrawn) {
        drawHeader(now);
        panel(boardX, height * 0.17, boardW, height * 0.66, "#102943", "#ddb14d");
      }

      // These percentages line up with the blank regions in survey-board.png.
      const contentX = boardX + boardW * 0.115;
      const contentW = boardW * 0.77;
      const questionCenterY = boardY + boardH * 0.355;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      const q = wrapText(round.question.toUpperCase(), contentW, Math.max(portraitLayout ? 11 : 18, width * 0.027), 2);
      ctx.font = `900 ${q.size}px monospace`;
      drawCenteredLines(q.lines, width / 2, questionCenterY, q.size * 1.12, contentW);

      answerButtons = [];
      const answerX = boardX + boardW * 0.195;
      const answerW = boardW * 0.675;
      const firstAnswerY = boardY + boardH * 0.495;
      const answerStep = boardH * 0.112;
      const answerH = boardH * 0.082;

      round.answers.forEach((answer, i) => {
        const y = firstAnswerY + i * answerStep;
        const hitX = boardX + boardW * 0.105;
        const hitW = boardW * 0.79;
        answerButtons.push({ x: hitX, y: y - answerH / 2, width: hitW, height: answerH, index: i });

        const selectedWrong = selectedIndex === i && i !== round.correct;
        if (selectedWrong) {
          ctx.save();
          ctx.globalAlpha = 0.58;
          ctx.fillStyle = "#8a2028";
          ctx.fillRect(hitX, y - answerH / 2, hitW, answerH);
          ctx.restore();
        }

        const wrapped = wrapText(answer.toUpperCase(), answerW, Math.max(portraitLayout ? 10 : 14, width * 0.020), 2);
        ctx.font = `900 ${wrapped.size}px monospace`;
        ctx.fillStyle = selectedWrong ? "#ffd6d6" : "#ffffff";
        drawCenteredLines(wrapped.lines, answerX + answerW / 2, y, wrapped.size * 1.08, answerW);
      });

      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(12, width * 0.016)}px monospace`;
      ctx.fillText(`ROUND ${roundIndex + 1} OF 6 • ${round.theme}`, width / 2, portraitLayout ? height * 0.78 : height * 0.875);

      drawHopeMeter();

      if (message) {
        panel(width * 0.08, portraitLayout ? height * 0.69 : height * 0.785, width * 0.84, height * 0.07, "#3c1518", "#ff7a7a");
        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.max(13, width * 0.019)}px monospace`;
        ctx.fillText(message, width / 2, portraitLayout ? height * 0.725 : height * 0.82, width * 0.78);
      }
      ctx.restore();
    }

    function drawReveal(now) {
      const width = getWidth();
      const height = getHeight();
      const round = currentRound();
      drawBackground(now);

      const elapsed = now - revealStartedAt;
      const pop = Math.min(1, elapsed / 350);
      const portraitLayout = width < height * 0.82;

      // Portrait reveal layout: board, characters, lesson, button, and meter
      // each receive their own fixed lane. Nothing is allowed to overlap.
      const boardX = portraitLayout ? width * 0.025 : width * 0.17;
      const boardY = portraitLayout ? height * 0.035 : height * 0.08;
      const boardW = portraitLayout ? width * 0.95 : width * 0.66;
      const boardH = portraitLayout ? height * 0.43 : boardW / 1.38;

      ctx.save();
      ctx.translate(width / 2, boardY + boardH / 2);
      ctx.scale(0.86 + pop * 0.14, 0.86 + pop * 0.14);
      ctx.translate(-width / 2, -(boardY + boardH / 2));

      const boardDrawn = drawImageCropped(
        chapter4Assets.revealBoard,
        artCrops.revealBoard,
        boardX,
        boardY,
        boardW,
        boardH
      );
      if (!boardDrawn) panel(boardX, boardY, boardW, boardH, "#153756", "#f0c44d");

      // Fill the blank marquee at the top of the reveal board.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(17, width * 0.047)}px monospace`;
      ctx.fillText("SURVEY SAYS!", width / 2, boardY + boardH * 0.115, boardW * 0.72);

      // First answer row. Keep the answer on one readable line whenever possible.
      const rowCenterY = boardY + boardH * 0.315;
      const answerCenterX = boardX + boardW * 0.515;
      const answerMaxW = boardW * 0.56;
      const scoreX = boardX + boardW * 0.865;
      const answerText = round.board.toUpperCase();

      let answerFont = Math.max(10, width * 0.026);
      ctx.font = `900 ${answerFont}px monospace`;
      while (answerFont > 9 && ctx.measureText(answerText).width > answerMaxW) {
        answerFont -= 0.5;
        ctx.font = `900 ${answerFont}px monospace`;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillText(answerText, answerCenterX, rowCenterY, answerMaxW);

      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(21, width * 0.054)}px monospace`;
      ctx.fillText(String(round.score), scoreX, rowCenterY);
      ctx.restore();

      // Larger character row beneath the board.
      const peopleY = portraitLayout ? height * 0.465 : height * 0.38;
      const peopleH = portraitLayout ? height * 0.235 : height * 0.56;
      drawImageCroppedContained(
        chapter4Assets.billThinking,
        artCrops.bill,
        portraitLayout ? width * 0.015 : width * 0.005,
        peopleY,
        portraitLayout ? width * 0.46 : width * 0.34,
        peopleH,
        0.15,
        1
      );
      drawImageCroppedContained(
        chapter4Assets.ebby,
        artCrops.ebby,
        portraitLayout ? width * 0.525 : width * 0.655,
        peopleY,
        portraitLayout ? width * 0.46 : width * 0.34,
        peopleH,
        0.85,
        1
      );

      // Lesson panel. It sits completely below the character art.
      const takeawayY = portraitLayout ? height * 0.685 : height * 0.72;
      const takeawayH = portraitLayout ? height * 0.082 : height * 0.11;
      panel(width * 0.09, takeawayY, width * 0.82, takeawayH, "#10243a", "#7ab3da");
      const takeaway = wrapText(
        round.takeaway.toUpperCase(),
        width * 0.72,
        Math.max(portraitLayout ? 12 : 14, width * 0.022),
        2
      );
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${takeaway.size}px monospace`;
      drawCenteredLines(
        takeaway.lines,
        width / 2,
        takeawayY + takeawayH / 2,
        takeaway.size * 1.10,
        width * 0.74
      );

      continueButton = portraitLayout
        ? { x: width * 0.29, y: height * 0.79, width: width * 0.42, height: height * 0.058 }
        : { x: width * 0.34, y: height * 0.845, width: width * 0.32, height: height * 0.06 };
      panel(
        continueButton.x,
        continueButton.y,
        continueButton.width,
        continueButton.height,
        "#5b1e23",
        "#f0c44d"
      );
      ctx.fillStyle = "#fff0a7";
      ctx.font = `900 ${Math.max(13, width * 0.022)}px monospace`;
      ctx.fillText("CONTINUE", width / 2, continueButton.y + continueButton.height / 2);

      drawHopeMeter(portraitLayout ? 0.91 : 0.89);
    }

    function drawResistance(now) {
      const width = getWidth();
      const height = getHeight();
      const round = currentRound();
      drawBackground(now);

      const portraitLayout = width < height * 0.82;

      drawImageCropped(
        chapter4Assets.billThinking,
        artCrops.bill,
        portraitLayout ? width * 0.40 : width * 0.49,
        portraitLayout ? height * 0.40 : height * 0.29,
        portraitLayout ? width * 0.58 : width * 0.48,
        portraitLayout ? height * 0.40 : height * 0.55,
        1,
        1
      );

      const bubbleX = portraitLayout ? width * 0.03 : width * 0.045;
      const bubbleY = portraitLayout ? height * 0.07 : height * 0.11;
      const bubbleW = portraitLayout ? width * 0.94 : width * 0.57;
      const bubbleH = portraitLayout ? bubbleW * 0.62 : height * 0.48;
      const bubbleDrawn = drawImageCropped(
        chapter4Assets.speechBubble,
        artCrops.bubble,
        bubbleX,
        bubbleY,
        bubbleW,
        bubbleH,
        0,
        0
      );

      if (!bubbleDrawn) {
        panel(bubbleX, bubbleY, bubbleW, bubbleH, "#ffffff", "#101010");
      }

      // Remove the old "OUR CONTESTANT RESPONDS" label. Bill's portrait and
      // speech bubble make the exchange clear without explaining it.
      const spokenText = round.resistance.replace(/^BILL:\s*/i, "");
      const line = wrapText(spokenText.toUpperCase(), bubbleW * 0.68, Math.max(19, width * 0.030), 5);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#111111";
      ctx.font = `900 ${line.size}px monospace`;
      drawCenteredLines(
        line.lines,
        bubbleX + bubbleW * 0.51,
        bubbleY + bubbleH * 0.43,
        line.size * 1.20,
        bubbleW * 0.70
      );

      continueButton = { x: width * 0.25, y: height * 0.80, width: width * 0.50, height: height * 0.075 };
      panel(continueButton.x, continueButton.y, continueButton.width, continueButton.height, "#173854", "#7ab3da");
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(15, width * 0.022)}px monospace`;
      ctx.fillText(roundIndex === 5 ? "SEE THE RESULTS" : "NEXT ROUND", width / 2, continueButton.y + continueButton.height / 2);
      drawHopeMeter();
    }

    function drawEnding(now) {
      const width = getWidth();
      const height = getHeight();
      drawBackground(now);
      drawHeader(now);

      confetti.forEach((piece) => {
        const tones = ["#f4d35e", "#ffffff", "#7ab3da", "#da6b76", "#8fd694"];
        ctx.fillStyle = tones[piece.tone];
        ctx.fillRect(piece.x, piece.y, piece.size, piece.size * 0.55);
      });

      panel(width * 0.08, height * 0.20, width * 0.84, height * 0.50, "#122b43", "#f0c44d");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(28, width * 0.052)}px monospace`;
      ctx.fillText("SIX ROUNDS COMPLETE!", width / 2, height * 0.30, width * 0.78);

      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(20, width * 0.034)}px monospace`;
      ctx.fillText("FIRST-TRY ANSWERS", width / 2, height * 0.40);
      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(48, width * 0.085)}px monospace`;
      ctx.fillText(`${firstTryCorrect} / 6`, width / 2, height * 0.51);

      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.max(15, width * 0.024)}px monospace`;
      ctx.fillText("EVERY ROUND TAUGHT THE SAME THING:", width / 2, height * 0.60, width * 0.74);
      ctx.fillStyle = "#f4d35e";
      ctx.fillText("WE DID NOT HAVE TO DO THIS ALONE.", width / 2, height * 0.65, width * 0.74);

      continueButton = { x: width * 0.27, y: height * 0.76, width: width * 0.46, height: height * 0.075 };
      panel(continueButton.x, continueButton.y, continueButton.width, continueButton.height, "#5b1e23", "#f0c44d");
      ctx.fillStyle = "#fff0a7";
      ctx.font = `900 ${Math.max(15, width * 0.024)}px monospace`;
      ctx.fillText("RETURN TO THE KITCHEN", width / 2, continueButton.y + continueButton.height / 2, continueButton.width - 20);
      drawHopeMeter();
    }

    function drawKitchenEnding(now) {
      const width = getWidth();
      const height = getHeight();
      const elapsed = now - phaseStartedAt;
      const fade = Math.min(1, elapsed / 700);
      ctx.fillStyle = "#050403";
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = fade;
      panel(width * 0.09, height * 0.25, width * 0.82, height * 0.40, "#241a12", "#8f6b3c");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#d9c49b";
      ctx.font = `900 ${Math.max(16, width * 0.025)}px monospace`;
      ctx.fillText("THE LIGHTS FADE. THE KITCHEN RETURNS.", width / 2, height * 0.34, width * 0.74);
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(21, width * 0.038)}px monospace`;
      ctx.fillText('EBBY: "WHY DON\'T WE CHOOSE', width / 2, height * 0.46, width * 0.75);
      ctx.fillText('OUR OWN CONCEPTION OF GOD?"', width / 2, height * 0.52, width * 0.75);
      ctx.fillStyle = "#d9c49b";
      ctx.font = `900 ${Math.max(14, width * 0.022)}px monospace`;
      ctx.fillText("TAP TO COMPLETE CHAPTER 4", width / 2, height * 0.59);
      ctx.restore();
    }

    function draw(now = performance.now()) {
      if (phase === "intro") drawIntro(now);
      else if (phase === "question") drawQuestion(now);
      else if (phase === "reveal") drawReveal(now);
      else if (phase === "resistance") drawResistance(now);
      else if (phase === "ending") drawEnding(now);
      else if (phase === "kitchenEnding") drawKitchenEnding(now);
    }

    function pointIn(rect, x, y) {
      return rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }

    function tap(x, y) {
      const now = performance.now();

      if (phase === "intro") {
        safeClick();
        beginRound(now);
        return true;
      }

      if (phase === "question") {
        for (const button of answerButtons) {
          if (pointIn(button, x, y)) {
            chooseAnswer(button.index, now);
            return true;
          }
        }
        return false;
      }

      if (phase === "reveal" && pointIn(continueButton, x, y)) {
        safeClick();
        nextFromReveal(now);
        return true;
      }

      if (phase === "resistance" && pointIn(continueButton, x, y)) {
        safeClick();
        nextFromResistance(now);
        return true;
      }

      if (phase === "ending" && pointIn(continueButton, x, y)) {
        safeClick();
        phase = "kitchenEnding";
        phaseStartedAt = now;
        if (typeof stopBackgroundMusic === "function") stopBackgroundMusic(false);
        else if (backgroundMusic) {
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;
        }
        return true;
      }

      if (phase === "kitchenEnding") {
        safeClick();
        if (typeof setGameState === "function") setGameState("finished");
        return true;
      }

      return false;
    }

    return { reset, update, tap, draw };
  }

  window.RecoveryChapter4Gameplay = {
    createSurveySaysGame,
    createChapter4Game: createSurveySaysGame
  };

  // Compatibility alias in case the engine expects a generic factory name.
  window.createSurveySaysGame = createSurveySaysGame;
})();