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
      resistance: "BILL: Asking for help seems a little dramatic..."
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
      resistance: "BILL:  Sober AND happy? Not possible..."
    },
    {
      theme: "HONESTY",
      question: "What helped us finally start changing?",
      answers: [
        "Drinking only on weekends",
        "Hiding it better",
        "Getting honest",
        "Waiting until tomorrow"
      ],
      correct: 2,
      board: "GETTING HONEST",
      score: 94,
      takeaway: "We could not change what we refused to face.",
      resistance: "BILL: Well I have been mostly honest... about some things."
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
      takeaway: "Want different? Do different.",
      resistance: "BILL: There's NO WAY getting Spiritual will work..NO WAY! But my old buddy did it.. Hmmmm?"
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
      takeaway: "Willingness is the key.",
      resistance: "BILL: How different are we talking here?"
    },
    {
      theme: "FAITH",
      question: "What did we discover with an open mind?",
      answers: [
        "It's my way or the highway",
        "God does not make too hard terms with those who seek Him.",
        "I need to go to church on Sundays",
        "Be perfect before starting"
      ],
      correct: 1,
      board: "GOD DOES NOT\nMAKE TOO HARD TERMS WITH THOSE THAT SEEK HIM",
      score: 89,
      takeaway: "We became willing to believe help could come from beyond us.",
      resistance: "BILL: ...Maybe doing everything alone hasn't gone perfectly. But I did it MY WAY!"
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
      billThinking: loadImage("assets/players/chapter4/prejudice.png"),
      billCrossed: loadImage("assets/players/chapter4/crossed.png"),
      speechBubble: loadImage("assets/players/chapter4/bubbe.png"),
      gameShowHeader: loadImage("assets/players/chapter4/game-show-header.png"),
      gameShowCrowd: loadImage("assets/players/chapter4/game-show-crowd.png"),
      gameShowBackground: loadImage("assets/players/chapter4/gameshow-stage-background.png")
    };

    // Chapter 4 game-show audio.
    const chapter4Audio = {
      intro: loadAudio("assets/sounds/music/chapter4-intro.mp3", true, 0.72),
      applause: loadAudio("assets/sounds/music/chapter4-applause.mp3", false, 0.82),
      thinking: loadAudio("assets/sounds/music/chapter4-thinking.mp3", true, 0.38),
      correct: loadAudio("assets/sounds/music/chapter4-correct.mp3", false, 0.92),
      wrong: loadAudio("assets/sounds/music/chapter4-wrong.mp3", false, 0.92)
    };

    const audioFades = [];

    function loadImage(source) {
      const image = new Image();
      image.src = source;
      return image;
    }

    function loadAudio(source, loop = false, volume = 1) {
      const audio = new Audio(source);
      audio.preload = "auto";
      audio.loop = loop;
      audio.volume = volume;
      return audio;
    }

    function playAudio(audio, restart = false) {
      if (!audio) return;
      try {
        if (restart) audio.currentTime = 0;
        const result = audio.play();
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch (_error) {
        // Audio failures must never interrupt gameplay.
      }
    }

    function stopAudio(audio, resetTime = true) {
      if (!audio) return;
      try {
        audio.pause();
        if (resetTime) audio.currentTime = 0;
      } catch (_error) {
        // Ignore browser media-state errors.
      }
    }

    function fadeAudio(audio, targetVolume, duration = 700, stopWhenSilent = false) {
      if (!audio) return;
      for (let i = audioFades.length - 1; i >= 0; i -= 1) {
        if (audioFades[i].audio === audio) audioFades.splice(i, 1);
      }
      audioFades.push({
        audio,
        from: audio.volume,
        to: Math.max(0, Math.min(1, targetVolume)),
        startedAt: performance.now(),
        duration: Math.max(1, duration),
        stopWhenSilent
      });
    }

    function updateAudioFades(now) {
      for (let i = audioFades.length - 1; i >= 0; i -= 1) {
        const fade = audioFades[i];
        const progress = Math.min(1, (now - fade.startedAt) / fade.duration);
        try {
          fade.audio.volume =
            fade.from +
            (fade.to - fade.from) * progress;
        } catch (_error) {
          audioFades.splice(i, 1);
          continue;
        }

        if (progress >= 1) {
          if (fade.stopWhenSilent && fade.to <= 0.001) stopAudio(fade.audio);
          audioFades.splice(i, 1);
        }
      }
    }

    function stopAllChapter4Audio() {
      audioFades.length = 0;
      Object.values(chapter4Audio).forEach((audio) => stopAudio(audio));
    }

    function startIntroAudio() {
      stopAllChapter4Audio();
      try {
        chapter4Audio.intro.volume = 0.72;
        chapter4Audio.applause.volume = 0.82;
      } catch (_error) {
        // Continue even if the browser rejects a volume change.
      }
      playAudio(chapter4Audio.intro, true);
      playAudio(chapter4Audio.applause, true);
    }

    function startThinkingMusic() {
      try {
        chapter4Audio.thinking.volume = 0;
      } catch (_error) {
        // Continue into the round even if audio is unavailable.
      }
      playAudio(chapter4Audio.thinking, true);
      fadeAudio(chapter4Audio.thinking, 0.38, 650);
    }

    const safeClick = () => {
      try {
        if (typeof playClickFeedback === "function") playClickFeedback();
      } catch (_error) {
        // Feedback is optional and must never block a state transition.
      }
    };

    const safePickup = () => {
      try {
        if (typeof playPickupFeedback === "function") playPickupFeedback(3);
      } catch (_error) {
        // Feedback is optional and must never block a state transition.
      }
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
      startIntroAudio();
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
      startThinkingMusic();
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
        fadeAudio(chapter4Audio.thinking, 0, 350, true);
        playAudio(chapter4Audio.correct, true);
        safePickup();
        phase = "reveal";
        revealStartedAt = now;
        phaseStartedAt = now;
        message = "";
        return;
      }

      playAudio(chapter4Audio.wrong, true);
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
      updateAudioFades(now);
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

    function wrapTextWithFont(text, maxWidth, startSize, maxLines = 3, fontFamily = "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif", weight = 900) {
      let size = startSize;
      let lines = [];

      while (size >= 12) {
        ctx.font = `${weight} ${size}px ${fontFamily}`;
        const words = text.split(/\s+/).filter(Boolean);
        lines = [];
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
        if (lines.length <= maxLines) break;
        size -= 1;
      }

      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.]+$/, "")}...`;
      }

      return { lines, size, fontFamily, weight };
    }

    function drawCenteredLines(lines, x, centerY, lineHeight, maxWidth) {
      const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineHeight, maxWidth));
    }

    // Canvas textBaseline="middle" can look uneven when two cells use very
    // different font sizes. This uses the actual glyph bounds so the answer
    // and score sit on the same visual center line.
    function drawOpticallyCenteredText(text, x, centerY, maxWidth) {
      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent || 0;
      const descent = metrics.actualBoundingBoxDescent || 0;
      const baselineY = centerY + (ascent - descent) / 2;

      ctx.save();
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, x, baselineY, maxWidth);
      ctx.restore();
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

    function drawBackground(now, showTopLights = true) {
      const width = getWidth();
      const height = getHeight();

      // Use the curtain background as the full-screen Chapter 4 backdrop.
      // If it has not loaded yet, fall back to the original dark-blue gradient.
      if (imageReady(chapter4Assets.gameShowBackground)) {
        drawImageCover(
          chapter4Assets.gameShowBackground,
          0,
          0,
          width,
          height
        );
        return;
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#09121f");
      gradient.addColorStop(0.55, "#142944");
      gradient.addColorStop(1, "#06090e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    function drawHeader(now) {
      const width = getWidth();
      const height = getHeight();
      const headerHeight = Math.max(72, Math.min(height * 0.18, 180));

      if (imageReady(chapter4Assets.gameShowHeader)) {
        drawImageContained(
          chapter4Assets.gameShowHeader,
          width * 0.03,
          height * 0.012,
          width * 0.94,
          headerHeight,
          0.5,
          0.5
        );
        return;
      }

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
    function drawAudience(now) {
      const width = getWidth();
      const height = getHeight();
      const portraitLayout = width < height * 0.82;

      let crowdHeight = portraitLayout ? height * 0.22 : height * 0.25;
      let bounce = Math.sin(now * 0.004) * 1;

      if (phase === "reveal") {
        bounce = Math.sin(now * 0.020) * 4;
      } else if (phase === "ending") {
        crowdHeight *= 1.05;
        bounce = Math.sin(now * 0.022) * 5;
      }

      const lift = portraitLayout ? height * 0.032 : height * 0.042;
      const overdraw = Math.max(28, height * 0.06);

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = false;
      drawImageCover(
        chapter4Assets.gameShowCrowd,
        0,
        height - crowdHeight - lift + bounce,
        width,
        crowdHeight + lift + overdraw
      );
      ctx.restore();
    }

    function drawIntro(now) {
      const width = getWidth();
      const height = getHeight();
      const elapsed = Math.max(0, now - phaseStartedAt);
      const portraitLayout = width < height * 0.82;

      // The custom logo supplies all of the marquee lights, so the old row of
      // floating dots is intentionally disabled on the intro screen.
      drawBackground(now, false);

      // The generated header PNG has transparent space around the visible sign.
      // Crop that space before scaling so the actual logo fills the screen.
      const logoCrop = { x: 0.035, y: 0.19, width: 0.93, height: 0.61 };
      const logoX = portraitLayout ? width * 0.005 : width * 0.09;
      const logoY = portraitLayout ? height * 0.008 : height * 0.015;
      const logoW = portraitLayout ? width * 0.99 : width * 0.82;
      const logoH = portraitLayout ? height * 0.245 : height * 0.255;

      // A gentle stage-light pulse makes the transparent marquee feel alive.
      const logoPulse = 1 + Math.sin(now * 0.0065) * 0.018;
      const glowPulse = 15 + (Math.sin(now * 0.011) + 1) * 9;
      ctx.save();
      ctx.translate(width / 2, logoY + logoH / 2);
      ctx.scale(logoPulse, logoPulse);
      ctx.translate(-width / 2, -(logoY + logoH / 2));
      ctx.shadowColor = "rgba(255,190,45,.95)";
      ctx.shadowBlur = glowPulse;
      const logoDrawn = drawImageCroppedContained(
        chapter4Assets.gameShowHeader,
        logoCrop,
        logoX,
        logoY,
        logoW,
        logoH,
        0.5,
        0.5
      );
      ctx.restore();

      if (!logoDrawn) {
        panel(logoX, logoY, logoW, logoH, "#5b1e23", "#f0c557");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff0a7";
        ctx.font = `900 ${Math.max(27, Math.min(58, width * 0.066))}px monospace`;
        ctx.fillText("SURVEY SAYS!", width / 2, logoY + logoH * 0.42, logoW * 0.82);
        ctx.font = `900 ${Math.max(18, Math.min(34, width * 0.042))}px monospace`;
        ctx.fillText("GAME SHOW", width / 2, logoY + logoH * 0.72, logoW * 0.65);
      }

      // The panel now begins directly below the large logo and uses nearly the
      // full mobile width. Text is deliberately arranged in short lines so it
      // cannot spill outside the canvas on a 450px-wide phone viewport.
      const panelX = portraitLayout ? width * 0.035 : width * 0.12;
      const panelY = portraitLayout ? height * 0.245 : height * 0.265;
      const panelW = portraitLayout ? width * 0.93 : width * 0.76;
      const panelH = portraitLayout ? height * 0.69 : height * 0.64;
      // Royal game-board panel: deep navy, thick gold frame, and a second
      // inner gold line inspired by the Chapter 4 answer board artwork.
      panel(panelX, panelY, panelW, panelH, "#061a36", "#d69a22");
      ctx.save();
      ctx.strokeStyle = "#ffd66b";
      ctx.lineWidth = Math.max(2, width * 0.005);
      roundedRect(panelX + 9, panelY + 9, panelW - 18, panelH - 18, 8);
      ctx.stroke();
      ctx.strokeStyle = "rgba(113,63,10,.85)";
      ctx.lineWidth = Math.max(1, width * 0.0025);
      roundedRect(panelX + 14, panelY + 14, panelW - 28, panelH - 28, 7);
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // About five seconds of dramatic typing after the opening pause.
      const introLine = "YOU ARE THE NEXT CONTESTANT ON SURVEY SAYS!";
      const typingStart = 850;
      const msPerCharacter = 102;
      const visibleCharacters = Math.max(
        0,
        Math.min(introLine.length, Math.floor((elapsed - typingStart) / msPerCharacter))
      );
      const typedLine = introLine.slice(0, visibleCharacters);
      const showCursor = visibleCharacters < introLine.length && Math.floor(now / 350) % 2 === 0;
      const typedDisplay = `${typedLine}${showCursor ? "_" : ""}`;

      const introImpactFont = "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
      const typed = wrapTextWithFont(
        typedDisplay,
        panelW * 0.84,
        portraitLayout ? Math.max(27, width * 0.069) : Math.max(34, width * 0.052),
        4,
        introImpactFont,
        900
      );

      // Heavy condensed lettering with dark extrusion and a thin bright-gold
      // edge, giving the scrolling announcement an arcade marquee feel.
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#301b06";
      ctx.lineWidth = Math.max(4, typed.size * 0.13);
      ctx.fillStyle = "#f6c94e";
      ctx.font = `900 ${typed.size}px ${introImpactFont}`;
      const typedStartY = panelY + panelH * 0.19 - ((typed.lines.length - 1) * typed.size * 1.02) / 2;
      typed.lines.forEach((line, index) => {
        const lineY = typedStartY + index * typed.size * 1.02;
        ctx.strokeText(line, width / 2, lineY, panelW * 0.84);
        ctx.fillText(line, width / 2, lineY, panelW * 0.84);
      });
      ctx.strokeStyle = "#fff0a0";
      ctx.lineWidth = Math.max(1, typed.size * 0.025);
      typed.lines.forEach((line, index) => {
        const lineY = typedStartY + index * typed.size * 1.02;
        ctx.strokeText(line, width / 2, lineY, panelW * 0.84);
      });

      const announcementFinished = visibleCharacters >= introLine.length;
      const revealStart = typingStart + introLine.length * msPerCharacter;
      const lowerAlpha = announcementFinished
        ? Math.min(1, (elapsed - revealStart) / 500)
        : 0;

      ctx.save();
      ctx.globalAlpha = Math.max(0, lowerAlpha);

      // Break long announcements into mobile-safe lines instead of relying on
      // canvas maxWidth, which visually clips words at the right edge.
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${portraitLayout ? Math.max(13, width * 0.031) : Math.max(16, width * 0.021)}px monospace`;
      ctx.fillText("BROADCASTING LIVE", width / 2, panelY + panelH * 0.40, panelW * 0.78);
      ctx.fillText("RIGHT HERE, RIGHT NOW!", width / 2, panelY + panelH * 0.455, panelW * 0.82);

      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${portraitLayout ? Math.max(12, width * 0.028) : Math.max(15, width * 0.019)}px monospace`;
      ctx.fillText("WE SURVEYED 100", width / 2, panelY + panelH * 0.575, panelW * 0.78);
      ctx.fillText("RECOVERED ALCOHOLICS...", width / 2, panelY + panelH * 0.625, panelW * 0.82);
      ctx.fillText("SIX ROUNDS. FOUR CHOICES.", width / 2, panelY + panelH * 0.715, panelW * 0.84);
      ctx.fillStyle = "#f5d56d";
      ctx.fillText("ONE COMMON EXPERIENCE.", width / 2, panelY + panelH * 0.765, panelW * 0.82);

      // Large, slowly breathing call-to-action.
      const tapScale = 1 + Math.sin(now * 0.006) * 0.04;
      const tapW = panelW * 0.72;
      const tapH = panelH * 0.105;
      const tapX = width / 2 - tapW / 2;
      const tapY = panelY + panelH * 0.835;
      ctx.globalAlpha = Math.max(0, lowerAlpha);
      ctx.save();
      ctx.translate(width / 2, tapY + tapH / 2);
      ctx.scale(tapScale, tapScale);
      ctx.translate(-width / 2, -(tapY + tapH / 2));
      // Royal-red call-to-action with a double gold edge.
      panel(tapX, tapY, tapW, tapH, "#741523", "#d99b24");
      ctx.strokeStyle = "#ffe07a";
      ctx.lineWidth = Math.max(2, width * 0.004);
      roundedRect(tapX + 7, tapY + 7, tapW - 14, tapH - 14, 7);
      ctx.stroke();
      ctx.fillStyle = "#fff1ad";
      ctx.shadowColor = "rgba(0,0,0,.85)";
      ctx.shadowBlur = 4;
      ctx.font = `900 ${portraitLayout ? Math.max(17, width * 0.042) : Math.max(21, width * 0.027)}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
      ctx.fillText("TAP TO TAKE THE STAGE", width / 2, tapY + tapH / 2, tapW * 0.88);
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.restore();
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
      const boardX = portraitLayout ? width * 0.015 : width * 0.15;
      const boardY = height * 0.025;
      const boardW = portraitLayout ? width * 0.97 : width * 0.70;
      const boardH = boardW / 1.32;

      if (portraitLayout) {
        const peopleY = boardY + boardH - height * 0.005;
        drawImageCroppedContained(
          chapter4Assets.billThinking,
          artCrops.bill,
          width * -0.045,
          peopleY,
          width * 0.54,
          height * 0.39,
          0.2,
          1
        );
        drawImageCroppedContained(
          chapter4Assets.ebby,
          artCrops.ebby,
          width * 0.505,
          peopleY,
          width * 0.54,
          height * 0.39,
          0.8,
          1
        );
      } else {
        const characterTop = height * 0.31;
        drawImageCroppedContained(
          chapter4Assets.billThinking,
          artCrops.bill,
          width * -0.055,
          characterTop,
          width * 0.46,
          height * 0.74,
          0.2,
          1
        );
        drawImageCroppedContained(
          chapter4Assets.ebby,
          artCrops.ebby,
          width * 0.595,
          characterTop,
          width * 0.46,
          height * 0.74,
          0.8,
          1
        );
      }

      const boardDrawn = drawImageCropped(
        chapter4Assets.questionBoard,
        artCrops.questionBoard,
        boardX,
        boardY,
        boardW,
        boardH
      );

      if (!boardDrawn) {
        drawHeader(now);
        panel(boardX, height * 0.17, boardW, height * 0.66, "#102943", "#ddb14d");
      }

      const contentW = boardW * 0.77;
      const questionCenterY = boardY + boardH * 0.355;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f7cf4a";

      const q = wrapText(
        round.question.toUpperCase(),
        contentW,
        Math.max(portraitLayout ? 11 : 18, width * 0.027),
        2
      );

      ctx.font = `900 ${q.size}px monospace`;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#2b1805";
      ctx.lineWidth = Math.max(2, q.size * 0.10);

      const questionStartY =
        questionCenterY - ((q.lines.length - 1) * q.size * 1.12) / 2;

      q.lines.forEach((questionLine, index) => {
        const lineY = questionStartY + index * q.size * 1.12;
        ctx.strokeText(questionLine, width / 2, lineY, contentW);
        ctx.fillText(questionLine, width / 2, lineY, contentW);
      });

      answerButtons = [];
      const answerX = boardX + boardW * 0.195;
      const answerW = boardW * 0.675;
      const firstAnswerY = boardY + boardH * 0.495;
      const answerStep = boardH * 0.112;
      const answerH = boardH * 0.082;

      round.answers.forEach((answer, index) => {
        const y = firstAnswerY + index * answerStep;
        const hitX = boardX + boardW * 0.105;
        const hitW = boardW * 0.79;

        answerButtons.push({
          x: hitX,
          y: y - answerH / 2,
          width: hitW,
          height: answerH,
          index
        });

        const selectedWrong =
          selectedIndex === index &&
          index !== round.correct;

        if (selectedWrong) {
          ctx.save();
          ctx.globalAlpha = 0.58;
          ctx.fillStyle = "#8a2028";
          ctx.fillRect(
            hitX,
            y - answerH / 2,
            hitW,
            answerH
          );
          ctx.restore();
        }

        const wrapped = wrapText(
          answer.toUpperCase(),
          answerW,
          Math.max(portraitLayout ? 10 : 14, width * 0.020),
          2
        );

        ctx.font = `900 ${wrapped.size}px monospace`;
        ctx.fillStyle = selectedWrong ? "#ffd6d6" : "#ffffff";

        drawCenteredLines(
          wrapped.lines,
          answerX + answerW / 2,
          y,
          wrapped.size * 1.08,
          answerW
        );
      });

      const roundLabelY =
        portraitLayout ? height * 0.75 : height * 0.84;
      const roundPanelW =
        portraitLayout ? width * 0.72 : width * 0.40;
      const roundPanelH =
        portraitLayout ? height * 0.046 : height * 0.052;
      const roundPanelX = width / 2 - roundPanelW / 2;
      const roundPanelY = roundLabelY - roundPanelH / 2;

      panel(
        roundPanelX,
        roundPanelY,
        roundPanelW,
        roundPanelH,
        "#071a35",
        "#d89d26"
      );

      ctx.save();
      ctx.strokeStyle = "#ffe17a";
      ctx.lineWidth = Math.max(1.5, width * 0.003);
      roundedRect(
        roundPanelX + 6,
        roundPanelY + 6,
        roundPanelW - 12,
        roundPanelH - 12,
        7
      );
      ctx.stroke();

      ctx.fillStyle = "#f7cf4a";
      ctx.font =
        `900 ${Math.max(13, width * 0.018)}px ` +
        "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";

      ctx.fillText(
        `ROUND ${roundIndex + 1} OF ${ROUNDS.length} • ${round.theme}`,
        width / 2,
        roundLabelY,
        roundPanelW * 0.88
      );
      ctx.restore();

      if (message) {
        panel(
          width * 0.08,
          portraitLayout ? height * 0.66 : height * 0.75,
          width * 0.84,
          height * 0.07,
          "#3c1518",
          "#ff7a7a"
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.max(13, width * 0.019)}px monospace`;
        ctx.fillText(
          message,
          width / 2,
          portraitLayout ? height * 0.695 : height * 0.785,
          width * 0.78
        );
      }

      drawAudience(now);
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

      const boardX = portraitLayout ? width * 0.025 : width * 0.17;
      const boardY = portraitLayout ? height * 0.035 : height * 0.08;
      const boardW = portraitLayout ? width * 0.95 : width * 0.66;
      const boardH = portraitLayout ? height * 0.43 : boardW / 1.38;

      // Flip the reveal board open like a game-show answer card. The board
      // starts almost edge-on, then swings toward the player with a tiny
      // overshoot. This is all canvas transformation—no extra artwork.
      const flipDuration = 620;
      const flipProgress = Math.min(1, elapsed / flipDuration);
      const flipEase = 1 - Math.pow(1 - flipProgress, 3);
      const flipOvershoot = flipProgress < 0.82
        ? 0
        : Math.sin(((flipProgress - 0.82) / 0.18) * Math.PI) * 0.035;
      const flipScaleX = Math.max(0.035, flipEase + flipOvershoot);
      const revealScale = 0.86 + pop * 0.14;

      ctx.save();
      ctx.translate(width / 2, boardY + boardH / 2);
      ctx.scale(revealScale * flipScaleX, revealScale);
      ctx.translate(-width / 2, -(boardY + boardH / 2));

      const boardDrawn = drawImageCropped(
        chapter4Assets.revealBoard,
        artCrops.revealBoard,
        boardX,
        boardY,
        boardW,
        boardH
      );

      if (!boardDrawn) {
        panel(boardX, boardY, boardW, boardH, "#153756", "#f0c44d");
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(17, width * 0.047)}px monospace`;
      ctx.fillText(
        "SURVEY SAYS!",
        width / 2,
        boardY + boardH * 0.115,
        boardW * 0.72
      );

      const rowCenterY = boardY + boardH * 0.315;
      const answerCenterX = boardX + boardW * 0.485;
      const answerMaxW = boardW * 0.59;
      const scoreX = boardX + boardW * 0.865;
      const answerLines = round.board.toUpperCase().split("\n");

      let answerFont = Math.max(10, width * 0.026);
      ctx.font = `900 ${answerFont}px monospace`;

      while (
        answerFont > 9 &&
        answerLines.some(
          (answerLine) => ctx.measureText(answerLine).width > answerMaxW
        )
      ) {
        answerFont -= 0.5;
        ctx.font = `900 ${answerFont}px monospace`;
      }

      ctx.fillStyle = "#ffffff";
      const answerLineHeight = answerFont * 1.08;
      const answerStartY =
        rowCenterY - ((answerLines.length - 1) * answerLineHeight) / 2;

      answerLines.forEach((answerLine, index) => {
        drawOpticallyCenteredText(
          answerLine,
          answerCenterX,
          answerStartY + index * answerLineHeight,
          answerMaxW
        );
      });

      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(21, width * 0.054)}px monospace`;
      drawOpticallyCenteredText(
        String(round.score),
        scoreX,
        rowCenterY,
        boardW * 0.11
      );

      ctx.restore();

      const peopleY = portraitLayout ? height * 0.405 : height * 0.31;
      const peopleH = portraitLayout ? height * 0.37 : height * 0.70;

      drawImageCroppedContained(
        chapter4Assets.billThinking,
        artCrops.bill,
        portraitLayout ? width * -0.045 : width * -0.055,
        peopleY,
        portraitLayout ? width * 0.54 : width * 0.45,
        peopleH,
        0.18,
        1
      );

      drawImageCroppedContained(
        chapter4Assets.ebby,
        artCrops.ebby,
        portraitLayout ? width * 0.505 : width * 0.605,
        peopleY,
        portraitLayout ? width * 0.54 : width * 0.45,
        peopleH,
        0.82,
        1
      );

      const takeawayY = portraitLayout ? height * 0.65 : height * 0.68;
      const takeawayH = portraitLayout ? height * 0.085 : height * 0.11;

      panel(
        width * 0.09,
        takeawayY,
        width * 0.82,
        takeawayH,
        "#10243a",
        "#7ab3da"
      );

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
        ? {
            x: width * 0.27,
            y: height * 0.755,
            width: width * 0.46,
            height: height * 0.06
          }
        : {
            x: width * 0.34,
            y: height * 0.80,
            width: width * 0.32,
            height: height * 0.065
          };

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

      ctx.fillText(
        "CONTINUE",
        width / 2,
        continueButton.y + continueButton.height / 2
      );

      drawAudience(now);
    }

    function drawComicThoughtBubble(x, y, w, h, now, portraitLayout) {
      const bob = Math.sin(now * 0.0045) * Math.max(1.5, h * 0.006);
      const bx = x;
      const by = y + bob;
      const radius = Math.min(w, h) * 0.075;

      ctx.save();

      // Warm shadow and gold edge keep the thought from looking like a plain
      // white document pasted over the stage.
      ctx.shadowColor = "rgba(0,0,0,.62)";
      ctx.shadowBlur = Math.max(10, w * 0.028);
      ctx.shadowOffsetY = Math.max(7, h * 0.025);
      ctx.fillStyle = "#d69a22";
      roundedRect(bx, by, w, h, radius);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#fff8df";
      roundedRect(bx + 6, by + 6, w - 12, h - 12, Math.max(8, radius - 4));
      ctx.fill();

      // Comic-book inner border.
      ctx.strokeStyle = "#3a210f";
      ctx.lineWidth = Math.max(3, w * 0.009);
      roundedRect(bx + 11, by + 11, w - 22, h - 22, Math.max(7, radius - 7));
      ctx.stroke();

      ctx.strokeStyle = "rgba(214,154,34,.75)";
      ctx.lineWidth = Math.max(1.5, w * 0.004);
      roundedRect(bx + 18, by + 18, w - 36, h - 36, Math.max(6, radius - 10));
      ctx.stroke();

      // Thought dots point toward Bill and make the panel unmistakably a
      // thought bubble even when the original bubble PNG is unavailable.
      const dotBaseX = portraitLayout ? bx + w * 0.76 : bx + w * 0.86;
      const dotBaseY = by + h * 0.91;
      const dots = portraitLayout
        ? [
            { x: dotBaseX, y: dotBaseY, r: w * 0.040 },
            { x: dotBaseX + w * 0.075, y: dotBaseY + h * 0.095, r: w * 0.028 },
            { x: dotBaseX + w * 0.125, y: dotBaseY + h * 0.17, r: w * 0.018 }
          ]
        : [
            { x: dotBaseX, y: dotBaseY, r: w * 0.032 },
            { x: dotBaseX + w * 0.065, y: dotBaseY + h * 0.09, r: w * 0.022 },
            { x: dotBaseX + w * 0.105, y: dotBaseY + h * 0.155, r: w * 0.015 }
          ];

      dots.forEach((dot) => {
        ctx.fillStyle = "#d69a22";
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff8df";
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#3a210f";
        ctx.lineWidth = Math.max(2, w * 0.005);
        ctx.stroke();
      });

      // Red game-show ribbon gives the page a title and breaks up the white.
      const ribbonW = w * 0.58;
      const ribbonH = Math.max(30, h * 0.105);
      const ribbonX = bx + w * 0.07;
      const ribbonY = by - ribbonH * 0.30;
      panel(ribbonX, ribbonY, ribbonW, ribbonH, "#741523", "#f0c44d");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff0a7";
      ctx.font = `900 ${Math.max(13, w * 0.043)}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
      ctx.fillText("OUR FRIEND'S OLD THINKING", ribbonX + ribbonW / 2, ribbonY + ribbonH / 2, ribbonW * 0.88);

      // Oversized quotation marks add a comic-panel feel without competing
      // with the actual sentence.
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#741523";
      ctx.font = `900 ${Math.max(70, h * 0.35)}px Georgia, serif`;
      ctx.fillText("“", bx + w * 0.13, by + h * 0.34);
      ctx.fillText("”", bx + w * 0.87, by + h * 0.78);
      ctx.globalAlpha = 1;

      ctx.restore();
      return bob;
    }

    function drawResistance(now) {
      const width = getWidth();
      const height = getHeight();
      const round = currentRound();
      drawBackground(now);

      const portraitLayout = width < height * 0.82;

      drawImageCroppedContained(
        chapter4Assets.billCrossed,
        artCrops.bill,
        portraitLayout ? width * 0.27 : width * 0.39,
        portraitLayout ? height * 0.27 : height * 0.15,
        portraitLayout ? width * 0.80 : width * 0.68,
        portraitLayout ? height * 0.66 : height * 0.82,
        1,
        1
      );

      const bubbleX = portraitLayout ? width * 0.025 : width * 0.035;
      const bubbleY = portraitLayout ? height * 0.045 : height * 0.075;
      const bubbleW = portraitLayout ? width * 0.95 : width * 0.60;
      const bubbleH = portraitLayout ? height * 0.43 : height * 0.53;

      // Draw the thought panel directly on the canvas. This keeps the existing
      // character art but replaces the big white block with a comic-style
      // thought bubble, title ribbon, quotation marks, and thought dots.
      const bubbleBob = drawComicThoughtBubble(
        bubbleX,
        bubbleY,
        bubbleW,
        bubbleH,
        now,
        portraitLayout
      );

      const spokenText =
        round.resistance.replace(/^BILL:\s*/i, "");

      const thoughtFont =
        "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";

      const line = wrapTextWithFont(
        spokenText.toUpperCase(),
        bubbleW * 0.74,
        portraitLayout
          ? Math.max(34, width * 0.078)
          : Math.max(44, width * 0.052),
        4,
        thoughtFont,
        900
      );

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.font = `900 ${line.size}px ${thoughtFont}`;

      const thoughtCenterX = bubbleX + bubbleW * 0.51;
      const thoughtCenterY = bubbleY + bubbleBob + bubbleH * 0.48;
      const thoughtStartY =
        thoughtCenterY -
        ((line.lines.length - 1) * line.size * 1.02) / 2;

      line.lines.forEach((thoughtLine, index) => {
        const lineY = thoughtStartY + index * line.size * 1.02;

        ctx.strokeStyle = "#f8f2df";
        ctx.lineWidth = Math.max(3, line.size * 0.11);
        ctx.strokeText(thoughtLine, thoughtCenterX, lineY, bubbleW * 0.78);

        ctx.strokeStyle = "#3a210f";
        ctx.lineWidth = Math.max(1.5, line.size * 0.045);
        ctx.strokeText(thoughtLine, thoughtCenterX, lineY, bubbleW * 0.78);

        ctx.fillStyle = "#111111";
        ctx.fillText(thoughtLine, thoughtCenterX, lineY, bubbleW * 0.78);
      });

      continueButton = portraitLayout
        ? {
            x: width * 0.20,
            y: height * 0.755,
            width: width * 0.60,
            height: height * 0.072
          }
        : {
            x: width * 0.29,
            y: height * 0.79,
            width: width * 0.42,
            height: height * 0.075
          };

      panel(
        continueButton.x,
        continueButton.y,
        continueButton.width,
        continueButton.height,
        "#741523",
        "#f0c44d"
      );

      ctx.fillStyle = "#fff0a7";
      ctx.font =
        `900 ${Math.max(19, width * 0.029)}px ` +
        "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";

      ctx.fillText(
        roundIndex === ROUNDS.length - 1
          ? "SEE THE RESULTS"
          : "NEXT ROUND",
        width / 2,
        continueButton.y + continueButton.height / 2,
        continueButton.width - 20
      );

      drawAudience(now);
    }

    function drawEnding(now) {
      const width = getWidth();
      const height = getHeight();

      drawBackground(now);
      drawHeader(now);

      confetti.forEach((piece) => {
        const tones = [
          "#f4d35e",
          "#ffffff",
          "#7ab3da",
          "#da6b76",
          "#8fd694"
        ];

        ctx.fillStyle = tones[piece.tone];
        ctx.fillRect(
          piece.x,
          piece.y,
          piece.size,
          piece.size * 0.55
        );
      });

      panel(
        width * 0.08,
        height * 0.20,
        width * 0.84,
        height * 0.50,
        "#122b43",
        "#f0c44d"
      );

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(28, width * 0.052)}px monospace`;

      ctx.fillText(
        "SIX ROUNDS COMPLETE!",
        width / 2,
        height * 0.30,
        width * 0.78
      );

      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(20, width * 0.034)}px monospace`;
      ctx.fillText(
        "FIRST-TRY ANSWERS",
        width / 2,
        height * 0.40
      );

      ctx.fillStyle = "#f4d35e";
      ctx.font = `900 ${Math.max(48, width * 0.085)}px monospace`;
      ctx.fillText(
        `${firstTryCorrect} / ${ROUNDS.length}`,
        width / 2,
        height * 0.51
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.max(15, width * 0.024)}px monospace`;
      ctx.fillText(
        "EVERY ROUND TAUGHT THE SAME THING:",
        width / 2,
        height * 0.60,
        width * 0.74
      );

      ctx.fillStyle = "#f4d35e";
      ctx.fillText(
        "WE DID NOT HAVE TO DO THIS ALONE.",
        width / 2,
        height * 0.65,
        width * 0.74
      );

      continueButton = {
        x: width * 0.27,
        y: height * 0.72,
        width: width * 0.46,
        height: height * 0.075
      };

      panel(
        continueButton.x,
        continueButton.y,
        continueButton.width,
        continueButton.height,
        "#5b1e23",
        "#f0c44d"
      );

      ctx.fillStyle = "#fff0a7";
      ctx.font = `900 ${Math.max(15, width * 0.024)}px monospace`;

      ctx.fillText(
        "CONTINUE TO CHAPTER 5",
        width / 2,
        continueButton.y + continueButton.height / 2,
        continueButton.width - 20
      );

      drawAudience(now);
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
    }

    function pointIn(rect, x, y) {
      return rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }

    function tap(x, y) {
      const now = performance.now();

      if (phase === "intro") {
        safeClick();
        fadeAudio(chapter4Audio.applause, 0, 900, true);
        fadeAudio(chapter4Audio.intro, 0, 1500, true);
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

      if (phase === "resistance") {
        safeClick();
        nextFromResistance(now);
        return true;
      }

      if (phase === "ending" && pointIn(continueButton, x, y)) {
        safeClick();
        stopAllChapter4Audio();

        try {
          if (typeof stopBackgroundMusic === "function") {
            stopBackgroundMusic(false);
          } else if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
          }
        } catch (_error) {
          // Music shutdown must never block the chapter transition.
        }

        // Skip the old Chapter 4 finish/fade screens and load Chapter 5's
        // cut scene immediately after the summary screen.
        try {
          const nextChapterUrl = new URL(window.location.href);
          nextChapterUrl.searchParams.set("chapter", "5");
          window.location.href = nextChapterUrl.toString();
        } catch (_error) {
          // Fallback for older browsers or unusual local-server URLs.
          window.location.href = "unofficial-story2.html?chapter=5";
        }

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