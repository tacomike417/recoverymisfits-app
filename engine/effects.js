(() => {
  "use strict";

  function create({ ctx }) {
    if (!ctx) {
      throw new Error("RecoveryEffects.create requires a canvas context.");
    }

    let score = 0;
    let displayedScore = 0;

    const pickupParticles = [];
    const floatingNumbers = [];
    const pickupFlashes = [];

    let screenShake = 0;
    let billPickupBounce = 0;
    let scorePulse = 0;

    function reset() {
      score = 0;
      displayedScore = 0;

      pickupParticles.length = 0;
      floatingNumbers.length = 0;
      pickupFlashes.length = 0;

      screenShake = 0;
      billPickupBounce = 0;
      scorePulse = 0;
    }

    function createEffects(entity, meterAmount, effectStrength) {
      const centerX = entity.x + entity.width / 2;
      const centerY = entity.y + entity.height / 2;

      const particleCount =
        12 + Math.min(18, effectStrength * 2);

      for (let index = 0; index < particleCount; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 4.8;

        pickupParticles.push({
          x: centerX,
          y: centerY,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed - 1.2,
          gravity: 0.13 + Math.random() * 0.08,
          size: 3 + Math.floor(Math.random() * 6),
          life: 1,
          decay: 0.025 + Math.random() * 0.025,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.35,
          color: Math.random() > 0.45 ? "#ffd84d" : "#ffffff"
        });
      }

      let pickupWord = "";

      if (effectStrength >= 10) {
        pickupWord = "JACKPOT!";
      } else if (effectStrength >= 6) {
        pickupWord = "BIG HAUL!";
      } else if (effectStrength >= 3) {
        pickupWord = "NICE!";
      }

      if (pickupWord) {
        floatingNumbers.push({
          x: centerX,
          y: centerY - entity.height * 0.15,
          text: pickupWord,
          life: 1,
          velocityY: -1.6,
          scale: 0.65,
          color: "#ffffff"
        });
      }

      pickupFlashes.push({
        x: centerX,
        y: centerY,
        radius: 8,
        life: 1
      });

      screenShake = Math.max(
        screenShake,
        4 + Math.min(7, effectStrength * 0.6)
      );

      billPickupBounce = 1;
      scorePulse = 1;
    }

    function update() {
      displayedScore += (score - displayedScore) * 0.22;

      if (Math.abs(score - displayedScore) < 0.05) {
        displayedScore = score;
      }

      screenShake *= 0.82;
      billPickupBounce *= 0.82;
      scorePulse *= 0.84;

      for (let index = pickupParticles.length - 1; index >= 0; index -= 1) {
        const particle = pickupParticles[index];

        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += particle.gravity;
        particle.velocityX *= 0.985;
        particle.rotation += particle.rotationSpeed;
        particle.life -= particle.decay;

        if (particle.life <= 0) {
          pickupParticles.splice(index, 1);
        }
      }

      for (let index = floatingNumbers.length - 1; index >= 0; index -= 1) {
        const number = floatingNumbers[index];

        number.y += number.velocityY;
        number.velocityY *= 0.96;
        number.life -= 0.022;
        number.scale += (1 - number.scale) * 0.2;

        if (number.life <= 0) {
          floatingNumbers.splice(index, 1);
        }
      }

      for (let index = pickupFlashes.length - 1; index >= 0; index -= 1) {
        const flash = pickupFlashes[index];

        flash.radius += 3.8;
        flash.life -= 0.065;

        if (flash.life <= 0) {
          pickupFlashes.splice(index, 1);
        }
      }
    }

    function draw() {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      for (const flash of pickupFlashes) {
        ctx.globalAlpha = flash.life * 0.7;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = flash.life * 0.35;
        ctx.fillStyle = "#ffe56b";

        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const particle of pickupParticles) {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        const size = particle.size;
        ctx.fillStyle = particle.color || "#ffffff";
        ctx.fillRect(-size / 2, -size / 2, size, size);

        ctx.restore();
      }

      for (const number of floatingNumbers) {
        ctx.save();
        ctx.globalAlpha = number.life;
        ctx.translate(number.x, number.y);
        ctx.scale(number.scale, number.scale);

        ctx.font = "bold 27px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = number.color || "#ffffff";

        ctx.strokeText(number.text, 0, 0);
        ctx.fillText(number.text, 0, 0);

        ctx.restore();
      }

      ctx.restore();
    }

    return {
      floatingNumbers,
      pickupParticles,
      reset,
      create: createEffects,
      update,
      draw,
      getScore: () => score,
      addScore: (amount) => {
        score += Number(amount) || 0;
      },
      getScreenShake: () => screenShake,
      setScreenShake: (value) => {
        screenShake = Number(value) || 0;
      },
      getBillPickupBounce: () => billPickupBounce,
      setBillPickupBounce: (value) => {
        billPickupBounce = Number(value) || 0;
      }
    };
  }

  window.RecoveryEffects = { create };
})();