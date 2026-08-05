// ===================================================
// CHAPTER 6 GAMEPLAY
// EPILOGUE CARDS + FINAL CRAWL
// ===================================================

(() => {
  "use strict";

  const SHARE_URL = "";

  const slides = [
    {
      type: "fullscreen",
      image: "assets/slides/chapter6-slide6.png",
      autoAdvanceAfterMs: 4000
    },
    {
      type: "fullscreen",
      image: "assets/slides/chapter6-slide7.png",
      autoAdvanceAfterMs: 4000,
      startSoundtrack: true
    },
    {
      type: "card",
      image: "assets/slides/chapter6-slide1.png",
      title: "ONE CONVERSATION",
      text: "One alcoholic talking honestly to another alcoholic.",
      autoAdvanceAfterMs: 5200
    },
    {
      type: "card",
      image: "assets/slides/chapter6-slide2.png",
      title: "A PROGRAM OF ACTION",
      text:
        "Our friend presented the doctor with a simple program of action that could bring victory over alcohol.",
      autoAdvanceAfterMs: 5600
    },
    {
      type: "card",
      image: "assets/slides/chapter6-slide3.png",
      title: "CARRYING THE MESSAGE",
      text:
        "They gave freely of their time for the sake of being useful to drunks who wanted help.",
      autoAdvanceAfterMs: 5400
    },
    {
      type: "card",
      image: "assets/slides/chapter6-slide4.png",
      title: "THE MESSAGE SPREADS",
      text:
        "What began with two drunks grew into the Big Book, a fellowship, and a new way of living.",
      autoAdvanceAfterMs: 5600
    },
    {
      type: "card",
      image: "assets/slides/chapter6-slide5.png",
      title: "STILL HAPPENING",
      text:
        "Somewhere today, someone walked into their first meeting and found a room full of people who understood.",
      autoAdvanceAfterMs: 5800
    },
    {
      type: "crawl",
      lines: [
        "THE BEGINNING",
        "",
        "Our friend's story is over.",
        "",
        "But something much bigger",
        "is only just beginning...",
        "",
        "One alcoholic talked honestly",
        "to another alcoholic.",
        "",
        "One conversation became",
        "hundreds of meetings.",
        "",
        "Hundreds became thousands.",
        "",
        "Every meeting...",
        "Every handshake...",
        "Every newcomer...",
        "",
        "adds another chapter.",
        "",
        "Somewhere today, someone",
        "walked into their first meeting.",
        "",
        "Maybe...",
        "",
        "you will be the person",
        "to greet them.",
        "",
        "The next chapter has never",
        "been about our friend.",
        "",
        "It's about us.",
        "",
        "",
        "",
        "KEEP COMING BACK!"
      ],
      autoAdvanceAfterMs: 34000
    },
    {
      type: "chaosLogo",
      image: "assets/slides/logo.png",
      autoAdvanceAfterMs: 10000
    },
    {
      type: "keepComingBack",
      title: "KEEP COMING BACK!"
    }
  ];

  function createChapter6Game({
    ctx,
    getWidth,
    getHeight,
    backgroundMusic,
    stopBackgroundMusic,
    playClickFeedback
  }) {
    let slideIndex = 0;
    let slideStartedAt = 0;
    let sequenceStartedAt = 0;
    let soundtrackStarted = false;

    const imageCache = new Map();

    const soundtrack = new Audio("assets/slides/chapter6-slides.mp3");
    soundtrack.preload = "auto";
    soundtrack.volume = 0.72;

    const finaleImages = {
      bill: new Image(),
      wasteCase: new Image(),
      chapter3: new Image()
    };

    finaleImages.bill.src = "assets/players/player-chapter1.png";
    finaleImages.wasteCase.src =
      "assets/players/chapter5/chap5-drunk6-waste-case.png";
    finaleImages.chapter3.src = "assets/players/player-chapter3.png";

    for (const slide of slides) {
      if (!slide.image) continue;

      const image = new Image();
      image.src = slide.image;
      imageCache.set(slide.image, image);
    }

    function unlockSoundtrackSilently() {
      soundtrack.pause();
      soundtrack.currentTime = 0;
      soundtrack.muted = true;

      const attempt = soundtrack.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {});
      }
    }

    function startSoundtrack() {
      if (soundtrackStarted) return;

      soundtrackStarted = true;
      soundtrack.pause();
      soundtrack.currentTime = 0;
      soundtrack.muted = false;
      soundtrack.volume = 0.72;

      const attempt = soundtrack.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {});
      }
    }

    function getTimelinePosition(now) {
      const totalElapsed = Math.max(0, now - sequenceStartedAt);
      let cursor = 0;

      for (let index = 0; index < slides.length; index += 1) {
        const duration = Number(slides[index].autoAdvanceAfterMs) || 0;

        if (duration <= 0 || totalElapsed < cursor + duration) {
          return {
            index,
            localElapsed: Math.max(0, totalElapsed - cursor)
          };
        }

        cursor += duration;
      }

      return {
        index: slides.length - 1,
        localElapsed: 0
      };
    }

    function syncTimeline(now = performance.now()) {
      const position = getTimelinePosition(now);

      if (position.index !== slideIndex) {
        slideIndex = position.index;
        slideStartedAt = now - position.localElapsed;
      }

      if (slideIndex >= 1) {
        startSoundtrack();
      }

      return position.localElapsed;
    }

    function reset() {
      const now = performance.now();

      slideIndex = 0;
      slideStartedAt = now;
      sequenceStartedAt = now;
      soundtrackStarted = false;

      if (typeof stopBackgroundMusic === "function") {
        stopBackgroundMusic(true);
      } else if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }

      unlockSoundtrackSilently();
    }

    function advance() {
      // The ending plays as one continuous movie.
      return false;
    }

    function tap(clientX, clientY) {
      if (slideIndex >= 1 && soundtrack.paused) {
        soundtrackStarted = false;
        startSoundtrack();
      }

      const slide = slides[slideIndex];

      if (
        slide?.type === "keepComingBack" &&
        Number.isFinite(clientX) &&
        Number.isFinite(clientY)
      ) {
        const button = getShareButtonRect(
          getWidth(),
          getHeight()
        );

        const inside =
          clientX >= button.x &&
          clientX <= button.x + button.width &&
          clientY >= button.y &&
          clientY <= button.y + button.height;

        if (inside && SHARE_URL) {
          window.open(
            SHARE_URL,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }

      return true;
    }

    function update() {
      syncTimeline(performance.now());
    }

    function drawStars(width, height, alpha = 0.35) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < 58; i += 1) {
        const x = (i * 73) % width;
        const y = (i * 137) % height;
        const size = i % 7 === 0 ? 2 : 1;
        ctx.fillRect(x, y, size, size);
      }

      ctx.restore();
    }

    function drawSparkles(width, height, now, strength = 1) {
      ctx.save();

      for (let i = 0; i < 36; i += 1) {
        const drift = now * (0.006 + (i % 5) * 0.0014);
        const x = (i * 97 + Math.sin(drift + i) * 24 + width) % width;
        const y = (i * 151 - drift * (6 + (i % 4)) + height * 4) % height;
        const twinkle = 0.18 + (Math.sin(now * 0.004 + i * 1.7) + 1) * 0.13;
        const size = i % 9 === 0 ? 2 : 1;

        ctx.globalAlpha = twinkle * strength;
        ctx.fillStyle = i % 3 === 0 ? "#f2d36f" : "#fff4cf";
        ctx.fillRect(Math.round(x), Math.round(y), size, size);
      }

      ctx.restore();
    }

    function drawWrappedText(text, centerX, startY, maxWidth, lineHeight) {
      const paragraphs = String(text || "").split("\n");
      let y = startY;

      for (const paragraph of paragraphs) {
        if (!paragraph) {
          y += lineHeight;
          continue;
        }

        const words = paragraph.split(/\s+/);
        let line = "";

        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;

          if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, centerX, y);
            y += lineHeight;
            line = word;
          } else {
            line = testLine;
          }
        }

        if (line) {
          ctx.fillText(line, centerX, y);
          y += lineHeight;
        }
      }

      return y;
    }

    // Fits the whole image inside the available area without stretching or cropping.
    function drawContainedImage(image, x, y, width, height) {
      if (!image || !image.complete || !image.naturalWidth) return false;

      const scale = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight
      );

      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = x + (width - drawWidth) / 2;
      const drawY = y + (height - drawHeight) / 2;

      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      return true;
    }

    function drawCardSlide(slide, width, height, fadeIn, now) {
      const image = imageCache.get(slide.image);
      const outerPad = Math.max(14, Math.round(width * 0.045));
      const imageTop = Math.max(22, Math.round(height * 0.035));
      const imageHeight = Math.round(height * 0.56);
      const panelTop = imageTop + imageHeight + 14;
      const panelBottom = height - 42;
      const panelHeight = Math.max(150, panelBottom - panelTop);

      ctx.fillStyle = "#05070b";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = fadeIn;

      // Image area, formatted like the chapter story cards.
      ctx.fillStyle = "#111722";
      ctx.fillRect(
        outerPad,
        imageTop,
        width - outerPad * 2,
        imageHeight
      );

      drawContainedImage(
        image,
        outerPad,
        imageTop,
        width - outerPad * 2,
        imageHeight
      );

      // Text panel below the image.
      ctx.fillStyle = "#000000";
      ctx.fillRect(outerPad, panelTop, width - outerPad * 2, panelHeight);

      ctx.strokeStyle = "#b98b2f";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        outerPad + 1,
        imageTop + 1,
        width - outerPad * 2 - 2,
        imageHeight - 2
      );
      ctx.strokeRect(
        outerPad + 1,
        panelTop + 1,
        width - outerPad * 2 - 2,
        panelHeight - 2
      );

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#d6b45f";
      ctx.font = `900 ${Math.max(19, Math.min(25, width * 0.062))}px monospace`;
      ctx.fillText(slide.title, width / 2, panelTop + 35, width - 52);

      ctx.font = `700 ${Math.max(14, Math.min(18, width * 0.043))}px monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "top";
      drawWrappedText(
        slide.text,
        width / 2,
        panelTop + 69,
        width - 70,
        Math.max(22, Math.round(height * 0.032))
      );

      ctx.restore();
      drawSparkles(width, height, now, 0.72);
    }

    function drawFullscreenSlide(slide, width, height) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const image = imageCache.get(slide.image);
      if (!image || !image.complete || !image.naturalWidth) return;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, width, height);
      ctx.restore();
    }

    // A flat, centered crawl. No perspective transform, so the words stay readable.
    function drawCrawl(slide, width, height, elapsed, fadeIn) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      drawStars(width, height, 0.5);
      drawSparkles(width, height, elapsed, 0.55);

      const lineHeight = Math.max(31, Math.round(height * 0.044));
      const totalHeight = slide.lines.length * lineHeight;
      const startY = height + 60;
      const endY = -totalHeight - 80;
      const duration = slide.autoAdvanceAfterMs || 31000;
      const progress = Math.min(1, elapsed / duration);
      const currentY = startY + (endY - startY) * progress;

      ctx.save();
      ctx.globalAlpha = fadeIn;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      slide.lines.forEach((line, index) => {
        const y = currentY + index * lineHeight;

        if (y < -lineHeight || y > height + lineHeight) return;

        if (index === 0) {
          ctx.font = `900 ${Math.max(25, Math.min(32, width * 0.078))}px monospace`;
          ctx.fillStyle = "#d6b45f";
        } else {
          ctx.font = `800 ${Math.max(17, Math.min(21, width * 0.052))}px monospace`;
          ctx.fillStyle = "#f2d36f";
        }

        ctx.fillText(line, width / 2, y, width - 46);
      });

      ctx.restore();
    }

    function drawSpriteImage(image, x, y, maxWidth, maxHeight, rotation = 0) {
      if (
        !image ||
        !image.complete ||
        !image.naturalWidth ||
        !image.naturalHeight
      ) {
        return;
      }

      const scale = Math.min(
        maxWidth / image.naturalWidth,
        maxHeight / image.naturalHeight
      );

      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(x + maxWidth / 2, y + maxHeight / 2);
      ctx.rotate(rotation);
      ctx.drawImage(
        image,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    }

    function drawFullWidthImage(image, width, centerY) {
      if (
        !image ||
        !image.complete ||
        !image.naturalWidth ||
        !image.naturalHeight
      ) {
        return;
      }

      const drawWidth = width;
      const drawHeight =
        image.naturalHeight * (drawWidth / image.naturalWidth);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        0,
        centerY - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    }

    function drawChaosLogoSlide(slide, width, height, elapsed) {
      const duration = slide.autoAdvanceAfterMs || 10000;
      const progress = Math.min(1, elapsed / duration);

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      drawStars(width, height, 0.34);
      drawSparkles(width, height, elapsed, 0.72);

      const logo = imageCache.get(slide.image);
      const logoAlpha =
        (0.5 + (Math.sin(elapsed * 0.0028) + 1) * 0.23) *
        (progress > 0.82 ? Math.max(0, 1 - (progress - 0.82) / 0.18) : 1);

      if (logo && logo.complete && logo.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = logoAlpha;
        drawFullWidthImage(
          logo,
          width,
          height * 0.47
        );
        ctx.restore();
      }

      const billW = 164;
      const billH = 232;
      const billX = ((elapsed * 0.055) % (width + billW * 2)) - billW;
      const billY = height * 0.13 + Math.sin(elapsed * 0.004) * 26;
      drawSpriteImage(
        finaleImages.bill,
        billX,
        billY,
        billW,
        billH,
        Math.sin(elapsed * 0.003) * 0.08
      );

      const corners = [
        [16, 25],
        [width - 90, 28],
        [width - 94, height - 138],
        [18, height - 140]
      ];
      const leg = Math.floor(elapsed / 700) % 4;
      const legProgress = (elapsed % 700) / 700;
      const from = corners[leg];
      const to = corners[(leg + 1) % 4];
      const wasteX = from[0] + (to[0] - from[0]) * legProgress;
      const wasteY = from[1] + (to[1] - from[1]) * legProgress;
      drawSpriteImage(
        finaleImages.wasteCase,
        wasteX,
        wasteY,
        148,
        208,
        Math.sin(elapsed * 0.018) * 0.13
      );

      const explosionAt = 7200;
      const c3W = 176;
      const c3H = 240;
      const c3X = width / 2 - c3W / 2;
      const c3Y = height * 0.69 - c3H / 2;

      if (elapsed < explosionAt) {
        const intensity = Math.min(1, elapsed / explosionAt);
        const shake = 1 + intensity * 13;

        drawSpriteImage(
          finaleImages.chapter3,
          c3X + Math.sin(elapsed * 0.075) * shake,
          c3Y + Math.cos(elapsed * 0.091) * shake,
          c3W,
          c3H,
          Math.sin(elapsed * 0.06) * 0.11 * intensity
        );
      } else {
        const burst = Math.min(1, (elapsed - explosionAt) / 1250);

        for (let i = 0; i < 28; i += 1) {
          const angle = (Math.PI * 2 * i) / 28 + i * 0.31;
          const distance = (20 + (i % 7) * 8) * burst;

          ctx.save();
          ctx.globalAlpha = 1 - burst;
          ctx.fillStyle = i % 3 === 0 ? "#f2d36f" : "#ffffff";
          ctx.fillRect(
            width / 2 + Math.cos(angle) * distance,
            height * 0.69 + Math.sin(angle) * distance,
            6 + (i % 4) * 4,
            6 + (i % 4) * 4
          );
          ctx.restore();
        }
      }

      if (progress > 0.85) {
        const blackFade = Math.min(1, (progress - 0.85) / 0.15);
        ctx.fillStyle = `rgba(0, 0, 0, ${blackFade})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    function getShareButtonRect(width, height) {
      const buttonWidth = Math.min(250, width - 64);
      const buttonHeight = 54;

      return {
        x: (width - buttonWidth) / 2,
        y: height - 96,
        width: buttonWidth,
        height: buttonHeight
      };
    }

    function drawKeepComingBackSlide(slide, width, height, fadeIn) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = fadeIn;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#d6b45f";
      ctx.font =
        `900 ${Math.max(30, Math.min(42, width * 0.095))}px monospace`;
      ctx.strokeText(slide.title, width / 2, height * 0.45, width - 34);
      ctx.fillText(slide.title, width / 2, height * 0.45, width - 34);

      const button = getShareButtonRect(width, height);

      ctx.fillStyle = "#d6b45f";
      ctx.fillRect(
        button.x,
        button.y,
        button.width,
        button.height
      );

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        button.x,
        button.y,
        button.width,
        button.height
      );

      ctx.fillStyle = "#000000";
      ctx.font = "900 20px monospace";
      ctx.fillText(
        "SHARE",
        width / 2,
        button.y + button.height / 2 + 1
      );

      ctx.restore();
    }

    function draw() {
      const now = performance.now();
      const elapsed = syncTimeline(now);
      const width = getWidth();
      const height = getHeight();
      const slide = slides[slideIndex] || slides[slides.length - 1];
      const fadeIn = Math.min(1, elapsed / 650);

      ctx.save();

      if (slide.type === "fullscreen") {
        drawFullscreenSlide(slide, width, height);
      } else if (slide.type === "card") {
        drawCardSlide(slide, width, height, fadeIn, now);
      } else if (slide.type === "crawl") {
        drawCrawl(slide, width, height, elapsed, fadeIn);
      } else if (slide.type === "chaosLogo") {
        drawChaosLogoSlide(slide, width, height, elapsed);
      } else {
        drawKeepComingBackSlide(slide, width, height, fadeIn);
      }

      ctx.restore();
    }

    function stop() {
      soundtrack.pause();
      soundtrack.currentTime = 0;
      soundtrack.muted = false;
    }

    return {
      reset,
      update,
      draw,
      tap,
      stop
    };
  }

  window.RecoveryChapter6Gameplay = {
    createChapterGame: createChapter6Game,
    createChapter6Game,
    slides
  };
})();