(() => {
  "use strict";

  function createTreatmentGame(options) {
    const ctx = options.ctx;
    const getWidth = options.getWidth;
    const getHeight = options.getHeight;
    const getGameplayStartedAt = options.getGameplayStartedAt;
    const getDurationMs = options.getDurationMs;
    const drawCoverImage = options.drawCoverImage;
    const getBackgroundImage = options.getBackgroundImage;
    const stopBackgroundMusic = options.stopBackgroundMusic;
    const playPickupFeedback = options.playPickupFeedback;
    const setGameState = options.setGameState;

    const treatmentSlots = [
      { label: "RUN!", imagePath: "assets/treatment/treatment-run.png", active: false, warningAt: 0, expiresAt: 0, flash: 0 },
      { label: "HOT SHOWER!", imagePath: "assets/treatment/treatment-hot-shower.png", active: false, warningAt: 0, expiresAt: 0, flash: 0 },
      { label: "COLD BATH!", imagePath: "assets/treatment/treatment-cold-bath.png", active: false, warningAt: 0, expiresAt: 0, flash: 0 },
      { label: "BELLADONNA!", imagePath: "assets/treatment/treatment-belladonna.png", active: false, warningAt: 0, expiresAt: 0, flash: 0 }
    ];

    const treatmentImages = new Map();
    for (const slot of treatmentSlots) {
      const image = new Image();
      image.src = slot.imagePath;
      treatmentImages.set(slot.label, image);
    }

    const treatmentParticles = [];
    let treatmentNextCueAt = 0;
    let treatmentHits = 0;
    let treatmentMisses = 0;
    let treatmentFailedLabel = "";
    let treatmentAttempt = 0;
    let treatmentOverloadTriggered = false;

    function reset(now = performance.now()) {
      treatmentHits = 0;
      treatmentMisses = 0;
      treatmentFailedLabel = "";
      treatmentParticles.length = 0;
      treatmentOverloadTriggered = false;
      treatmentNextCueAt = now + (treatmentAttempt === 1 ? 500 : 650);

      for (const slot of treatmentSlots) {
        slot.active = false;
        slot.warningAt = 0;
        slot.expiresAt = 0;
        slot.flash = 0;
      }
    }

    function startAttempt(now = performance.now()) {
      treatmentAttempt += 1;
      reset(now);
    }

    function getLayout() {
      const width = getWidth();
      const height = getHeight();
      const margin = Math.max(14, Math.min(24, width * 0.045));
      const gap = Math.max(12, Math.min(20, width * 0.04));
      const top = 118;
      const bottomMargin = 26;
      const slotWidth = (width - margin * 2 - gap) / 2;
      const slotHeight = (height - top - bottomMargin - gap) / 2;

      return treatmentSlots.map((slot, index) => ({
        slot,
        x: margin + (index % 2) * (slotWidth + gap),
        y: top + Math.floor(index / 2) * (slotHeight + gap),
        width: slotWidth,
        height: slotHeight
      }));
    }

    function activateCue(now) {
      const elapsed = Math.max(0, now - getGameplayStartedAt());
      const progress = Math.min(1, elapsed / getDurationMs());
      const isFirstAttempt = treatmentAttempt === 1;
      const activeCount = getActiveCount();
      let targetActive;

      if (isFirstAttempt) {
        if (progress < 0.24) targetActive = 2;
        else if (progress < 0.62) targetActive = Math.random() < 0.42 ? 3 : 2;
        else targetActive = Math.random() < 0.38 ? 4 : 3;
      } else {
        targetActive = progress < 0.40 ? 1 : progress < 0.78 ? 2 : 3;
      }

      const inactive = treatmentSlots.filter(slot => !slot.active).sort(() => Math.random() - 0.5);
      const numberToActivate = Math.max(0, Math.min(inactive.length, targetActive - activeCount));

      for (const slot of inactive.slice(0, numberToActivate)) {
        const visibleFor = isFirstAttempt ? Math.max(1450, 2150 - progress * 650) : 2700 - progress * 800;
        const warningFor = Math.min(1000, visibleFor * 0.44);
        slot.active = true;
        slot.warningAt = now + visibleFor - warningFor;
        slot.expiresAt = now + visibleFor;
        slot.flash = 1;
      }

      const nextDelay = isFirstAttempt ? 980 - progress * 430 : 1250 - progress * 650;
      treatmentNextCueAt = now + Math.max(isFirstAttempt ? 520 : 600, nextDelay);
    }

    function triggerFirstAttemptOverload(now, progress) {
      if (treatmentAttempt !== 1 || treatmentOverloadTriggered || progress < 0.38) return;
      treatmentOverloadTriggered = true;
      const inactive = treatmentSlots.filter(slot => !slot.active).sort(() => Math.random() - 0.5);
      const needed = Math.max(0, 3 - getActiveCount());

      for (const slot of inactive.slice(0, needed)) {
        const visibleFor = 1650;
        const warningFor = 720;
        slot.active = true;
        slot.warningAt = now + visibleFor - warningFor;
        slot.expiresAt = now + visibleFor;
        slot.flash = 1.35;
      }
      treatmentNextCueAt = Math.max(treatmentNextCueAt, now + 780);
    }

    function updateParticles() {
      for (let i = treatmentParticles.length - 1; i >= 0; i -= 1) {
        const particle = treatmentParticles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.12;
        particle.life -= 1;
        particle.size *= 0.97;
        if (particle.life <= 0 || particle.size < 0.7) treatmentParticles.splice(i, 1);
      }
    }

    function createExplosion(item, label) {
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      const colors = label === "BELLADONNA!"
        ? ["#9cff8f", "#ffffff", "#ffe56b", "#4ee26b"]
        : ["#ffffff", "#ffe56b", "#d8c69e", "#f2a900"];

      for (let i = 0; i < 34; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.2 + Math.random() * 5.4;
        treatmentParticles.push({
          x: centerX + (Math.random() - 0.5) * 24,
          y: centerY + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          size: 3 + Math.random() * 6,
          life: 22 + Math.floor(Math.random() * 18),
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    function fail(slot) {
      treatmentMisses += 1;
      treatmentFailedLabel = slot.label;
      slot.active = false;
      slot.warningAt = 0;
      slot.expiresAt = 0;
      stopBackgroundMusic(true);
      setGameState("treatmentFailed");
    }

    function update(now) {
      updateParticles();
      const elapsed = Math.max(0, now - getGameplayStartedAt());
      const progress = Math.min(1, elapsed / getDurationMs());
      triggerFirstAttemptOverload(now, progress);
      if (now >= treatmentNextCueAt) activateCue(now);

      for (const slot of treatmentSlots) {
        slot.flash *= 0.82;
        if (slot.active && now >= slot.expiresAt) {
          fail(slot);
          return;
        }
      }
    }

    function tap(clientX, clientY) {
      for (const item of getLayout()) {
        const inside = clientX >= item.x && clientX <= item.x + item.width && clientY >= item.y && clientY <= item.y + item.height;
        if (!inside || !item.slot.active) continue;
        createExplosion(item, item.slot.label);
        item.slot.active = false;
        item.slot.warningAt = 0;
        item.slot.expiresAt = 0;
        item.slot.flash = 1.4;
        treatmentHits += 1;
        playPickupFeedback(item.slot.label === "BELLADONNA!" ? 6 : 2);
        return true;
      }
      return false;
    }

    function drawImageCoverInRect(image, x, y, targetWidth, targetHeight) {
      if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return false;
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

    function draw() {
      const width = getWidth();
      const height = getHeight();
      const backgroundWasDrawn = drawCoverImage(getBackgroundImage());
      if (!backgroundWasDrawn) {
        ctx.fillStyle = "#17202a";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#253746";
        ctx.fillRect(0, height * 0.58, width, height * 0.42);
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.fillRect(0, 0, width, height);

      for (const item of getLayout()) {
        const slot = item.slot;
        const now = performance.now();
        const warning = slot.active && now >= slot.warningAt;
        const blinkOn = !warning || Math.floor(now / 105) % 2 === 0;
        const inset = slot.active ? 0 : 5;
        ctx.fillStyle = "#080b0e";
        ctx.fillRect(item.x - 4, item.y - 4, item.width + 8, item.height + 8);
        const imageX = item.x + inset;
        const imageY = item.y + inset;
        const imageWidth = item.width - inset * 2;
        const imageHeight = item.height - inset * 2;
        const imageWasDrawn = drawImageCoverInRect(treatmentImages.get(slot.label), imageX, imageY, imageWidth, imageHeight);
        if (!imageWasDrawn) {
          ctx.fillStyle = slot.active ? "#d8c69e" : "#35424c";
          ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        }
        ctx.fillStyle = slot.active ? (warning && blinkOn ? "rgba(207, 62, 62, 0.58)" : "rgba(0, 0, 0, 0.10)") : "rgba(5, 10, 14, 0.70)";
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        ctx.strokeStyle = slot.active ? (warning ? (blinkOn ? "#ffffff" : "#ff5757") : "#fff2a8") : "#65737e";
        ctx.lineWidth = slot.active ? (warning ? 7 : 5) : 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        if (!slot.active) continue;

        const pulse = 1 + Math.sin(performance.now() * 0.018) * 0.02 + slot.flash * 0.012;
        const fontSize = Math.max(17, Math.min(25, item.width * 0.082));
        const bannerHeight = Math.max(42, Math.min(54, item.height * 0.24));
        const bannerX = item.x + 10;
        const bannerY = item.y + item.height - bannerHeight - 10;
        const bannerWidth = item.width - 20;
        ctx.save();
        ctx.translate(item.x + item.width / 2, bannerY + bannerHeight / 2);
        ctx.scale(pulse, pulse);
        ctx.translate(-(item.x + item.width / 2), -(bannerY + bannerHeight / 2));
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 8);
        ctx.fillStyle = warning ? (blinkOn ? "rgba(150, 20, 20, 0.92)" : "rgba(72, 8, 8, 0.94)") : "rgba(8, 12, 16, 0.88)";
        ctx.fill();
        ctx.strokeStyle = warning ? (blinkOn ? "#ffdfdf" : "#ff6b6b") : "rgba(255, 242, 168, 0.92)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `800 ${fontSize}px Arial, Helvetica, sans-serif`;
        ctx.fillStyle = warning ? (blinkOn ? "#ffffff" : "#ffd1d1") : "#fff7dc";
        ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillText(slot.label, item.x + item.width / 2, bannerY + bannerHeight / 2 + 1, bannerWidth - 18);
        ctx.restore();
      }

      for (const particle of treatmentParticles) {
        ctx.globalAlpha = Math.max(0, particle.life / 40);
        ctx.fillStyle = particle.color;
        ctx.fillRect(Math.round(particle.x), Math.round(particle.y), Math.max(1, Math.round(particle.size)), Math.max(1, Math.round(particle.size)));
      }
      ctx.globalAlpha = 1;
    }

    function drawFailed() {
      const width = getWidth();
      const height = getHeight();
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.fillRect(0, 0, width, height);
      const boxWidth = Math.min(350, width - 34);
      const boxHeight = 218;
      const boxX = (width - boxWidth) / 2;
      const boxY = (height - boxHeight) / 2;
      ctx.fillStyle = "#080b0e";
      ctx.fillRect(boxX - 5, boxY - 5, boxWidth + 10, boxHeight + 10);
      ctx.fillStyle = "#b52f2f";
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 25px Arial, Helvetica, sans-serif";
      ctx.fillText("TREATMENT RESTART", width / 2, boxY + 51, boxWidth - 24);
      ctx.fillText("REQUIRED", width / 2, boxY + 84, boxWidth - 24);
      const missedTreatmentText = {
        "RUN!": "YOU MISSED MILD EXERCISE",
        "HOT SHOWER!": "YOU MISSED A HOT SHOWER",
        "COLD BATH!": "YOU MISSED A COLD BATH",
        "BELLADONNA!": "YOU MISSED BELLADONNA TREATMENT"
      }[treatmentFailedLabel] || `YOU MISSED ${treatmentFailedLabel}`;
      ctx.font = "700 14px Arial, Helvetica, sans-serif";
      ctx.fillStyle = "#ffe6e6";
      ctx.fillText(missedTreatmentText, width / 2, boxY + 122, boxWidth - 28);
      const buttonX = boxX + 28;
      const buttonY = boxY + 151;
      const buttonWidth = boxWidth - 56;
      const buttonHeight = 46;
      ctx.fillStyle = "#f2a900";
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
      ctx.font = "900 18px Arial, Helvetica, sans-serif";
      ctx.fillStyle = "#000000";
      ctx.fillText("RESTART TREATMENT", width / 2, buttonY + buttonHeight / 2 + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    function getActiveCount() { return treatmentSlots.filter(slot => slot.active).length; }
    function getHits() { return treatmentHits; }

    return { reset, startAttempt, update, tap, draw, drawFailed, getActiveCount, getHits };
  }

  window.RecoveryTreatmentGame = { create: createTreatmentGame };
})();