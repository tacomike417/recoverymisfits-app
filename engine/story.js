(() => {
  "use strict";

  function createStorySystem(options = {}) {
    const ctx = options.ctx;
    const currentChapter = options.currentChapter || null;
    const engine = options.engine || null;
    const chapterNumber = Number(options.chapterNumber) || 1;
    const onStoryComplete =
      typeof options.onStoryComplete === "function"
        ? options.onStoryComplete
        : () => {};

    let width = 0;
    let height = 0;
    let isTreatmentLevel = false;
    let treatmentHits = 0;
    let score = 0;
    let currentCardIndex = 0;

    const titleImage = new Image();
    titleImage.src =
      options.titleImagePath ||
      "assets/title/unofficial-title.png";

    function syncRuntime() {
      width = Number(options.getWidth?.()) || 0;
      height = Number(options.getHeight?.()) || 0;
      isTreatmentLevel = Boolean(options.isTreatmentLevel?.());
      treatmentHits = Number(options.getTreatmentHits?.()) || 0;
      score = Number(options.getScore?.()) || 0;
    }

    function drawContainedImage(image) {
      if (
        !image ||
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return false;
      }

      const scale = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight
      );

      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      return true;
    }

    function getStoryCards() {
      return Array.isArray(currentChapter?.cards)
        ? currentChapter.cards
        : [];
    }

    function getCurrentStoryCard() {
      return getStoryCards()[currentCardIndex] || null;
    }

    function reset() {
      currentCardIndex = 0;
    }

    function advance() {
      const cards = getStoryCards();
      currentCardIndex += 1;

      if (currentCardIndex >= cards.length) {
        onStoryComplete();
      }
    }

    function continueToNextChapter() {
      const nextChapterNumber = chapterNumber + 1;
      const nextChapter = engine?.getChapter?.(nextChapterNumber - 1);

      if (!nextChapter && nextChapterNumber !== 3) {
        return;
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("chapter", String(nextChapterNumber));
      nextUrl.searchParams.set("skipIntro", "1");
      window.location.href = nextUrl.toString();
    }

    function drawTitleScreen() {
      syncRuntime();
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
      syncRuntime();
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

        const controlY =
          cardY +
          cardHeight -
          34;

        const separatorY =
          controlY - 18;

        ctx.strokeStyle =
          "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(textX, separatorY);
        ctx.lineTo(
          cardX + cardWidth - 18,
          separatorY
        );
        ctx.stroke();
  
        ctx.font =
          `bold ${Math.max(
            12,
            bodyFontSize * 0.78
          )}px monospace`;
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
  
        ctx.fillText(
          isLastCard
            ? "TAP TO BEGIN"
            : "TAP FOR NEXT PAGE",
          textX,
          controlY
        );

        const progressLabel =
          "STORY PROGRESS";
        const progressWidth =
          Math.min(110, cardWidth * 0.28);
        const progressX =
          cardX + cardWidth - 18 - progressWidth;
        const progressY =
          controlY + 15;
        const remainingProgress =
          cards.length > 0
            ? (cards.length - currentCardIndex) /
              cards.length
            : 0;

        ctx.font =
          `${Math.max(9, bodyFontSize * 0.58)}px monospace`;
        ctx.textAlign = "right";
        ctx.fillText(
          progressLabel,
          cardX + cardWidth - 18,
          controlY - 1
        );

        ctx.fillStyle =
          "rgba(0, 0, 0, 0.16)";
        ctx.fillRect(
          progressX,
          progressY,
          progressWidth,
          2
        );

        ctx.fillStyle = "#000000";
        ctx.fillRect(
          progressX,
          progressY,
          progressWidth * remainingProgress,
          2
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

        const controlY =
          cardY +
          cardHeight -
          42;

        const separatorY =
          controlY - 20;

        ctx.strokeStyle =
          "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(textX, separatorY);
        ctx.lineTo(
          cardX + cardWidth - 18,
          separatorY
        );
        ctx.stroke();
  
        ctx.font =
          `bold ${Math.max(
            12,
            bodyFontSize * 0.75
          )}px monospace`;
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
  
        ctx.fillText(
          isLastCard
            ? "TAP TO BEGIN"
            : "TAP FOR NEXT PAGE",
          textX,
          controlY
        );

        const progressLabel =
          "STORY PROGRESS";
        const progressWidth =
          Math.min(120, textWidth * 0.42);
        const progressX =
          cardX + cardWidth - 18 - progressWidth;
        const progressY =
          controlY + 16;
        const remainingProgress =
          cards.length > 0
            ? (cards.length - currentCardIndex) /
              cards.length
            : 0;

        ctx.font =
          `${Math.max(9, bodyFontSize * 0.56)}px monospace`;
        ctx.textAlign = "right";
        ctx.fillText(
          progressLabel,
          cardX + cardWidth - 18,
          controlY - 1
        );

        ctx.fillStyle =
          "rgba(0, 0, 0, 0.16)";
        ctx.fillRect(
          progressX,
          progressY,
          progressWidth,
          2
        );

        ctx.fillStyle = "#000000";
        ctx.fillRect(
          progressX,
          progressY,
          progressWidth * remainingProgress,
          2
        );
      }
  
      ctx.textAlign = "left";
      ctx.textBaseline =
        "alphabetic";
    }

    function drawChapterFinished() {
      syncRuntime();
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
        ctx.strokeText(`${treatmentHits} ORDERS COMPLETED`, width / 2, height / 2 - 18);
        ctx.fillText(`${treatmentHits} ORDERS COMPLETED`, width / 2, height / 2 - 18);
  
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

    function drawChapter3PreviewFinished() {
      syncRuntime();
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

    return {
      reset,
      advance,
      continueToNextChapter,
      drawTitleScreen,
      drawStoryCard,
      drawChapterFinished,
      drawChapter3PreviewFinished
    };
  }

  window.RecoveryStory = {
    createStorySystem
  };
})();