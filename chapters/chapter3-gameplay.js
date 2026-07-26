(() => {
  "use strict";

  function createDoctorsOpinionGame(options) {
    const ctx = options.ctx;
    const getWidth = options.getWidth;
    const getHeight = options.getHeight;
    const backgroundMusic = options.backgroundMusic;
    const stopBackgroundMusic = options.stopBackgroundMusic;
    const playClickFeedback = options.playClickFeedback;
    const playPickupFeedback = options.playPickupFeedback;
    const setGameState = options.setGameState;

    let width = 0;
    let height = 0;

    function syncSize() {
      width = getWidth();
      height = getHeight();
    }

    const obsessionThoughtTexts = [
      "JUST ONE...",
      "YOU DESERVE IT.",
      "THIS TIME WILL BE DIFFERENT.",
      "YOU'VE BEEN SOBER LONG ENOUGH.",
      "NOBODY WILL KNOW.",
      "JUST BEER.",
      "TOMORROW YOU'LL QUIT.",
      "YOU'VE EARNED IT.",
      "WHAT'S THE BIG DEAL?",
      "IT'LL BE DIFFERENT THIS TIME."
    ];

    const obsessionButtons = [
      { id: "drink", label: "DRINK", icon: "🍺" },
      { id: "meeting", label: "GO TO A MEETING", icon: "👥" },
      { id: "sponsor", label: "CALL A SPONSOR", icon: "☎" },
      { id: "asylum", label: "GO TO AN ASYLUM", icon: "🏥" },
      { id: "busy", label: "STAY BUSY", icon: "🚶" },
      { id: "read", label: "READ ABOUT IT", icon: "📖" }
    ];

    let doctorPhase = "obsession";
    let doctorPhaseStartedAt = 0;
    let doctorMessage = "";
    let doctorMessageUntil = 0;
    let doctorReliefUntil = 0;
    let doctorThoughts = [];
    let doctorNextThoughtAt = 0;
    let doctorBurial = 0;
    let doctorSlowUntil = 0;
    let doctorClearUntil = 0;
    let doctorReboundUntil = 0;
    let doctorCopingUses = { asylum: 0, busy: 0, read: 0 };
    let doctorCooldowns = { asylum: 0, busy: 0, read: 0 };
    let cravingObjects = [];
    let cravingNextSpawnAt = 0;
    let cravingStartedAt = 0;
    let cravingCollected = 0;
    let cravingEndAt = 0;

    // =====================================
    // CHAPTER 3 DOCTOR'S OPINION MINI-GAME
    // =====================================

    function resetDoctorsOpinionGame(now = performance.now()) {
      syncSize();
      doctorPhase = "obsession";
      doctorPhaseStartedAt = now;
      doctorMessage = "USE THE BUTTONS. FIND SOME RELIEF.";
      doctorMessageUntil = now + 3200;
      doctorReliefUntil = 0;
      doctorThoughts = [];
      doctorNextThoughtAt = now + 450;
      doctorBurial = 0;
      doctorSlowUntil = 0;
      doctorClearUntil = 0;
      doctorReboundUntil = 0;
      doctorCopingUses = { asylum: 0, busy: 0, read: 0 };
      doctorCooldowns = { asylum: 0, busy: 0, read: 0 };
      cravingObjects = [];
      cravingNextSpawnAt = 0;
      cravingStartedAt = 0;
      cravingCollected = 0;
      cravingEndAt = 0;
    }

    function getDoctorLayout() {
      const panelWidth = Math.max(150, Math.min(210, width * 0.36));
      const gap = 7;
      const margin = 10;
      const buttonHeight = Math.max(42, Math.min(55, (height - 84 - gap * 5) / 6));
      const x = width - panelWidth - margin;
      const top = 66;
      return {
        playWidth: x - 8,
        panelX: x,
        panelWidth,
        buttons: obsessionButtons.map((button, index) => ({
          button,
          x,
          y: top + index * (buttonHeight + gap),
          width: panelWidth,
          height: buttonHeight
        }))
      };
    }

    function showDoctorMessage(text, duration = 1700) {
      doctorMessage = text;
      doctorMessageUntil = performance.now() + duration;
    }

    function spawnObsessionThought(now) {
      const layout = getDoctorLayout();
      const rebound = now < doctorReboundUntil;
      const slowed = now < doctorSlowUntil;
      const size = 13 + Math.floor(Math.random() * 5);
      doctorThoughts.push({
        text: obsessionThoughtTexts[Math.floor(Math.random() * obsessionThoughtTexts.length)],
        x: 10 + Math.random() * Math.max(30, layout.playWidth - 135),
        y: -24,
        speed: (0.9 + Math.random() * 1.2) * (rebound ? 1.75 : slowed ? 0.45 : 1),
        size,
        wobble: Math.random() * Math.PI * 2
      });

      let delay = 560;
      if (slowed) delay = 1000;
      if (rebound) delay = 260;
      delay -= Math.min(220, doctorBurial * 2.2);
      doctorNextThoughtAt = now + Math.max(180, delay + Math.random() * 180);
    }

    function updateDoctorsOpinionGame(now) {
      syncSize();
      if (doctorPhase === "obsession") {
        if (now >= doctorNextThoughtAt && now >= doctorClearUntil) {
          spawnObsessionThought(now);
        }

        if (now < doctorClearUntil) {
          doctorThoughts.length = 0;
          doctorBurial = Math.max(0, doctorBurial - 0.45);
        } else {
          const layout = getDoctorLayout();
          const billGroundY = height - 45 + doctorBurial;
          for (let i = doctorThoughts.length - 1; i >= 0; i -= 1) {
            const thought = doctorThoughts[i];
            thought.y += thought.speed;
            thought.x += Math.sin(now * 0.004 + thought.wobble) * 0.18;
            if (thought.y >= billGroundY - 90) {
              doctorBurial = Math.min(76, doctorBurial + 5.5);
              doctorThoughts.splice(i, 1);
            } else if (thought.y > height + 30 || thought.x > layout.playWidth) {
              doctorThoughts.splice(i, 1);
            }
          }
        }
        return;
      }

      if (doctorPhase === "relief") {
        doctorThoughts.length = 0;
        doctorBurial = Math.max(0, doctorBurial - 1.8);
        if (now >= doctorReliefUntil) {
          doctorPhase = "cravingIntro";
          doctorPhaseStartedAt = now;
        }
        return;
      }

      if (doctorPhase === "cravingIntro") {
        if (now - doctorPhaseStartedAt >= 1800) {
          doctorPhase = "craving";
          cravingStartedAt = now;
          cravingNextSpawnAt = now;
          spawnCravingObject(now, true);
          backgroundMusic.currentTime = 0;
          backgroundMusic.playbackRate = 1.08;
          backgroundMusic.volume = 0.34;
          backgroundMusic.play().catch(() => {});
        }
        return;
      }

      if (doctorPhase === "craving") {
        const elapsed = now - cravingStartedAt;
        const intensity = Math.min(1, elapsed / 17000);
        if (now >= cravingNextSpawnAt) {
          const count = elapsed < 2500 ? 1 : 1 + Math.floor(intensity * 3);
          for (let i = 0; i < count; i += 1) spawnCravingObject(now, false);
          cravingNextSpawnAt = now + Math.max(190, 850 - intensity * 620);
        }

        for (const item of cravingObjects) {
          item.x += item.vx;
          item.y += item.vy;
          if (item.x < 18 || item.x > width - 18) item.vx *= -1;
          if (item.y < 58 || item.y > height - 20) item.vy *= -1;
        }

        if (elapsed > 19000 || cravingObjects.length > 105) {
          doctorPhase = "cravingEnd";
          cravingEndAt = now;
          stopBackgroundMusic(false);
        }
        return;
      }

      if (doctorPhase === "cravingEnd" && now - cravingEndAt > 4800) {
        setGameState("chapter3PreviewFinished");
      }
    }

    function spawnCravingObject(now, firstBeer) {
      const types = ["BEER", "BEER", "BEER", "SHOT", "WHISKEY"];
      const type = firstBeer ? "BEER" : types[Math.floor(Math.random() * types.length)];
      cravingObjects.push({
        type,
        x: width * (0.18 + Math.random() * 0.64),
        y: height * (0.22 + Math.random() * 0.60),
        vx: (Math.random() - 0.5) * (firstBeer ? 0.4 : 1.8),
        vy: (Math.random() - 0.5) * (firstBeer ? 0.4 : 1.8),
        size: firstBeer ? 58 : 34 + Math.random() * 18,
        born: now
      });
    }

    function useObsessionButton(id, now) {
      if (id === "drink") {
        doctorPhase = "relief";
        doctorPhaseStartedAt = now;
        doctorReliefUntil = now + 2600;
        doctorThoughts.length = 0;
        doctorMessage = "RELIEF...";
        doctorMessageUntil = doctorReliefUntil;
        backgroundMusic.pause();
        return;
      }

      if (id === "meeting") {
        showDoctorMessage("SORRY, KID. AA HASN'T BEEN INVENTED YET.", 2300);
        return;
      }

      if (id === "sponsor") {
        showDoctorMessage("SORRY, NO SUCH THING YET, KID.", 2300);
        return;
      }

      if (now < doctorCooldowns[id]) {
        showDoctorMessage("STILL WEARING OFF...", 900);
        return;
      }

      doctorCopingUses[id] += 1;
      doctorCooldowns[id] = now + 6800;
      doctorSlowUntil = now + 4300;
      doctorBurial = Math.max(0, doctorBurial - 22);

      if (id === "asylum") {
        doctorClearUntil = now + 2500;
        showDoctorMessage("THE THOUGHTS QUIET DOWN... FOR A WHILE.", 2200);
      } else if (id === "busy") {
        showDoctorMessage("KEEPING BUSY HELPS... FOR A WHILE.", 2100);
      } else {
        doctorThoughts.splice(0, Math.floor(doctorThoughts.length * 0.7));
        showDoctorMessage("KNOWLEDGE HELPS... BUT THE THOUGHT RETURNS.", 2200);
      }

      const totalUses = doctorCopingUses.asylum + doctorCopingUses.busy + doctorCopingUses.read;
      doctorReboundUntil = now + 4300 + totalUses * 700;
    }

    function tapDoctorsOpinionGame(x, y) {
      syncSize();
      const now = performance.now();
      if (doctorPhase === "obsession") {
        for (const item of getDoctorLayout().buttons) {
          if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) {
            playClickFeedback();
            useObsessionButton(item.button.id, now);
            return true;
          }
        }
        return false;
      }

      if (doctorPhase === "craving") {
        for (let i = cravingObjects.length - 1; i >= 0; i -= 1) {
          const item = cravingObjects[i];
          const radius = item.size * 0.62;
          if (Math.hypot(x - item.x, y - item.y) <= radius) {
            cravingCollected += 1;
            cravingObjects.splice(i, 1);
            const splits = 2 + Math.floor(Math.random() * 3);
            for (let n = 0; n < splits; n += 1) spawnCravingObject(now, false);
            if (Math.random() < 0.55) spawnCravingObject(now, false);
            playPickupFeedback(3);
            return true;
          }
        }
      }
      return false;
    }

    function drawPixelBill(centerX, groundY, peaceful = false) {
      const buried = peaceful ? 0 : doctorBurial;
      const y = groundY + buried;
      ctx.save();
      ctx.translate(centerX, y);
      ctx.fillStyle = "#2a2118";
      ctx.fillRect(-25, -88, 50, 55);
      ctx.fillStyle = "#d5a06b";
      ctx.fillRect(-17, -112, 34, 27);
      ctx.fillStyle = "#3a2b1c";
      ctx.fillRect(-23, -119, 46, 9);
      ctx.fillRect(-15, -128, 30, 10);
      ctx.fillStyle = peaceful ? "#fff2a8" : "#ffffff";
      ctx.fillRect(-9, -101, 5, 4);
      ctx.fillRect(6, -101, 5, 4);
      ctx.fillStyle = "#000000";
      ctx.fillRect(-10, -100, 3, 3);
      ctx.fillRect(7, -100, 3, 3);
      ctx.fillRect(-7, -89, 14, 3);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(-22, -33, 17, 35);
      ctx.fillRect(5, -33, 17, 35);
      ctx.restore();
    }

    function drawDoctorsOpinionGame(now) {
      syncSize();
      ctx.fillStyle = "#11131a";
      ctx.fillRect(0, 0, width, height);

      if (doctorPhase === "obsession" || doctorPhase === "relief") {
        const layout = getDoctorLayout();
        const peaceful = doctorPhase === "relief";
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, peaceful ? "#263348" : "#171923");
        gradient.addColorStop(1, peaceful ? "#73582c" : "#39271e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, layout.playWidth, height);

        ctx.fillStyle = "#5d3d23";
        ctx.fillRect(0, height - 45, layout.playWidth, 45);
        ctx.fillStyle = "#2c1c12";
        for (let x = 0; x < layout.playWidth; x += 18) {
          ctx.fillRect(x, height - 45 + ((x / 18) % 2) * 8, 13, 7);
        }

        for (const thought of doctorThoughts) {
          ctx.font = `900 ${thought.size}px monospace`;
          ctx.textAlign = "left";
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#000000";
          ctx.fillStyle = "#f4efe0";
          ctx.strokeText(thought.text, thought.x, thought.y);
          ctx.fillText(thought.text, thought.x, thought.y);
        }

        drawPixelBill(layout.playWidth * 0.52, height - 44, peaceful);

        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(layout.panelX - 6, 0, layout.panelWidth + 16, height);
        for (const item of layout.buttons) {
          const cooling = doctorCooldowns[item.button.id] && now < doctorCooldowns[item.button.id];
          ctx.fillStyle = item.button.id === "drink" ? "#c78d22" : cooling ? "#4c4c4c" : "#e7dcc4";
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `900 ${Math.max(11, Math.min(15, item.height * 0.28))}px monospace`;
          ctx.fillStyle = item.button.id === "drink" ? "#000000" : cooling ? "#c8c8c8" : "#161616";
          ctx.fillText(`${item.button.icon} ${item.button.label}`, item.x + item.width / 2, item.y + item.height / 2, item.width - 10);
          if (cooling) {
            const remaining = Math.ceil((doctorCooldowns[item.button.id] - now) / 1000);
            ctx.font = "bold 10px monospace";
            ctx.fillText(`${remaining}s`, item.x + item.width - 18, item.y + 10);
          }
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (now < doctorMessageUntil) {
          const boxW = Math.min(layout.playWidth - 24, 420);
          ctx.fillStyle = "rgba(0,0,0,0.82)";
          ctx.fillRect(layout.playWidth / 2 - boxW / 2, 12, boxW, 42);
          ctx.font = "900 13px monospace";
          ctx.fillStyle = peaceful ? "#fff2a8" : "#ffffff";
          ctx.fillText(doctorMessage, layout.playWidth / 2, 33, boxW - 12);
        }
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        return;
      }

      if (doctorPhase === "cravingIntro") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 35px monospace";
        ctx.fillStyle = "#fff2a8";
        ctx.fillText("RELIEF...", width / 2, height / 2 - 25);
        ctx.font = "bold 17px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("THEN THE FIRST DRINK.", width / 2, height / 2 + 34);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        return;
      }

      ctx.fillStyle = "#20150e";
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const item of cravingObjects) {
        const icon = item.type === "SHOT" ? "🥃" : item.type === "WHISKEY" ? "🍾" : "🍺";
        ctx.font = `${Math.floor(item.size)}px serif`;
        ctx.fillText(icon, item.x, item.y);
      }

      if (doctorPhase === "craving") {
        ctx.font = "900 16px monospace";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#ffffff";
        ctx.strokeText(cravingCollected === 0 ? "TAP THE FIRST DRINK" : "TRY TO KEEP UP", width / 2, 30);
        ctx.fillText(cravingCollected === 0 ? "TAP THE FIRST DRINK" : "TRY TO KEEP UP", width / 2, 30);
      }

      if (doctorPhase === "cravingEnd") {
        ctx.fillStyle = "rgba(0,0,0,0.78)";
        ctx.fillRect(0, 0, width, height);
        const elapsed = now - cravingEndAt;
        ctx.font = "900 28px monospace";
        ctx.fillStyle = "#fff2a8";
        ctx.fillText("ONE'S TOO MANY.", width / 2, height / 2 - 45, width - 24);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("A THOUSAND AIN'T ENOUGH.", width / 2, height / 2, width - 24);
        if (elapsed > 2300) {
          ctx.font = "900 17px monospace";
          ctx.fillStyle = "#ffe56b";
          ctx.fillText("THIS IS THE PHENOMENON OF CRAVING.", width / 2, height / 2 + 64, width - 24);
        }
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }


    return {
      reset: resetDoctorsOpinionGame,
      update: updateDoctorsOpinionGame,
      tap: tapDoctorsOpinionGame,
      draw: drawDoctorsOpinionGame
    };
  }

  window.RecoveryDoctorsOpinionGame = {
    create: createDoctorsOpinionGame
  };
})();