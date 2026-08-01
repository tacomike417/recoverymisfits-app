(() => {
  "use strict";

  const { drawWindow, drawBeveledWindow, drawSegmentedMeter } = window.RecoveryUI;

  // Everything used only by Chapter 3 gameplay lives in this file.
  // Keep Chapter 3 wording, buttons, rules, drawing, and future additions here.

  const chapter3PlayerImage = new Image();
  chapter3PlayerImage.src = "assets/players/player-chapter3.png";

  // Chapter 3, Level 2 bar scene layers.
  // All four files live together so the scene can be assembled without
  // modifying any of the artwork.
  const chapter3BarBackgroundImage = new Image();
  chapter3BarBackgroundImage.src = "assets/players/chapter3/bar-background.png";

  const chapter3BarImage = new Image();
  chapter3BarImage.src = "assets/players/chapter3/bar.png";

  const chapter3BillAtBarImage = new Image();
  chapter3BillAtBarImage.src = "assets/players/chapter3/bill-at-bar.png";

  const chapter3BartenderImage = new Image();
  chapter3BartenderImage.src = "assets/players/chapter3/bartender.png";

  const chapter3BartenderSmileImage = new Image();
  chapter3BartenderSmileImage.src =
    "assets/players/chapter3/bartender-smirk.png";

  // Placeholder for the doctor's finished sprite. Until this file exists,
  // the procedural stand-in below continues to draw normally.
  const chapter3DoctorImage = new Image();
  chapter3DoctorImage.addEventListener("error", () => {
    // Optional placeholder asset. The procedural doctor is used until this
    // file is added, so a missing image must never stop gameplay.
  });
  chapter3DoctorImage.src = "assets/players/chapter3/chap3-dr.png";

  // Cache the visible bounds of transparent PNG sprites so large transparent
  // margins do not distort scene placement.
  const chapter3VisibleImageBounds = new WeakMap();

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
    { id: "drink", label: "HAVE JUST ONE", icon: "🍺" },
    { id: "meeting", label: "GO TO A MEETING", icon: "👥" },
    { id: "sponsor", label: "CALL A SPONSOR", icon: "☎" },
    { id: "asylum", label: "GO TO AN ASYLUM", icon: "🏥" },
    { id: "busy", label: "STAY BUSY", icon: "🚶" },
    { id: "isolate", label: "ISOLATE", icon: "🚪" },
    { id: "fight", label: "FIGHT!", icon: "✊" }
  ];

  function createDoctorsOpinionGame({
    ctx,
    getWidth,
    getHeight,
    backgroundMusic,
    stopBackgroundMusic,
    playClickFeedback,
    playPickupFeedback,
    setGameState
  }) {
    let doctorPhase = "obsession";
    let doctorPhaseStartedAt = 0;
    let doctorObsessionStartedAt = 0;
    let doctorMessage = "";
    let doctorMessageUntil = 0;
    let doctorMessageLarge = false;
    let doctorMessageAwaitingTap = false;
    let doctorReliefUntil = 0;
    let doctorThoughts = [];
    let doctorNextThoughtAt = 0;
    let doctorBurial = 0;
    let doctorSlowUntil = 0;
    let doctorClearUntil = 0;
    let doctorReboundUntil = 0;
    let doctorCopingUses = { asylum: 0, busy: 0, isolate: 0 };
    let doctorCooldowns = { asylum: 0, busy: 0, isolate: 0 };
    let doctorDisabledButtons = {
      meeting: false,
      sponsor: false,
      asylum: false,
      busy: false,
      isolate: false
    };
    let doctorOptionUsed = {
      meeting: false,
      sponsor: false,
      asylum: false,
      busy: false,
      isolate: false
    };
    let doctorReliefSource = "";
    let doctorReliefEndsAt = 0;
    let cravingObjects = [];
    let cravingNextSpawnAt = 0;
    let cravingStartedAt = 0;
    let cravingCollected = 0;
    let cravingEndAt = 0;
    let cravingRoundIndex = -1;
    let cravingRoundStartedAt = 0;
    let cravingRoundDrinks = 0;
    let cravingCardUntil = 0;
    let cravingCardTitle = "";
    let cravingCardSubtitle = "";
    let cravingSplitFlashUntil = 0;
    let cravingSplitX = 0;
    let cravingSplitY = 0;
    let cravingBillWear = 0;
    let cravingShotFlashUntil = 0;
    let cravingShotStartX = 0;
    let cravingShotStartY = 0;
    let cravingShotSpeedLabel = "";

    const cravingConversation = [
      { speaker: "bartender", text: "ONE MORE?" },
      { speaker: "bill", text: "OF COURSE!" },
      { speaker: "bartender", text: "WANT A TORNADO SHOT?" },
      { speaker: "bill", text: "YES. HOW FITTING..." },
      { speaker: "bartender", text: "HOW'S THE WIFE?" },
      { speaker: "bill", text: "DON'T ASK..." },
      { speaker: "bartender", text: "HOW'S THE JOB?" },
      { speaker: "bill", text: "WHAT JOB?" },
      { speaker: "bartender", text: "I THOUGHT YOU SAID ONLY ONE MORE?" },
      {
        speaker: "bill",
        text: "ONE AFTER ANOTHER IS WHAT I MEANT, BUDDY."
      }
    ];
    let cravingConversationIndex = 0;
    let cravingConversationNextAt = 0;

    const cravingSceneDuration = 75000;
    const cravingExcuses = [
      "WELL... MAYBE JUST ONE MORE.",
      "NO HURRY GETTING HOME...",
      "TOMORROW'S SATURDAY. I CAN SLEEP IN.",
      "YOU'VE EARNED IT.",
      "ONE MORE WON'T MATTER.",
      "BUT EVERYBODY'S STILL HERE!",
      "I'M MAKING A BIG DEAL ABOUT THIS...",
      "WE'RE ALL PARTYING.",
      "YOU'RE DOING FINE.",
      "JUST THIS ONCE.",
      "NEXT ROUND'S ON ME, THOUGH...",
      "I DON'T WANT TO BE RUDE.",
      "IT'S STILL EARLY.",
      "I'LL GET SOBER TOMORROW."
    ];
    let cravingGoHomeButton = null;
    let cravingEscapeProgress = 0;
    let cravingEscapeAttempt = 1;
    let cravingReturnText = "";
    let cravingReturnUntil = 0;
    let cravingBartenderSmileUntil = 0;
    let cravingFloatingScores = [];
    let cravingMoneyFloats = [];
    let cravingMoneySpent = 0;
    const cravingMinimumEscapeTime = 45000;
    let cravingDoctorMirageStartedAt = 0;
    let cravingDoctorMirageShown = false;
    let cravingDoctorMirageTriggerAt = 0;
    let cravingDoctorMirageDuration = 6000;
    let cravingPostHundredMashCount = 0;
    let cravingPostHundredStartProgress = 0;
    const cravingPostHundredMashGoal = 10;

    // Current craving gameplay:
    // automatic drinks + one GO HOME button + Bill exits left.

    // Separate music for the phenomenon-of-craving half of Chapter 3.
    // The original Chapter 3 track is stopped before this begins.
    const chapter3Part2Music = new Audio(
      "assets/sounds/music/chapter3-pt2.mp3"
    );
    chapter3Part2Music.loop = true;
    chapter3Part2Music.preload = "auto";
    chapter3Part2Music.volume = 0.32;

    const cravingRounds = [
      { title: "THAT NIGHT...", subtitle: "MAYBE IT ENDS HERE.", drinks: 7, duration: 9000, speed: 0.095, splitChance: 0.18 },
      { title: "THE NEXT MORNING...", subtitle: "IT WASN'T OVER.", drinks: 3, duration: 6200, speed: 0.105, splitChance: 0.12 },
      { title: "THAT NIGHT...", subtitle: "BACK AT IT.", drinks: 9, duration: 9200, speed: 0.115, splitChance: 0.24 },
      { title: "THREE DAYS LATER...", subtitle: "MAYBE THIS ONE WILL BE SHORT.", drinks: 12, duration: 10500, speed: 0.125, splitChance: 0.30 },
      { title: "ONE WEEK LATER...", subtitle: "HE THOUGHT HE HAD IT AGAIN.", drinks: 5, duration: 7200, speed: 0.12, splitChance: 0.16 },
      { title: "ONE MONTH LATER...", subtitle: "THE BENDER CAME BACK.", drinks: 15, duration: 11800, speed: 0.14, splitChance: 0.34 },
      { title: "SIX MONTHS LATER...", subtitle: "HE STILL NEVER KNEW.", drinks: 10, duration: 10500, speed: 0.15, splitChance: 0.28 }
    ];
    let doctorFightEnergy = 100;
    let doctorFightUntil = 0;
    let doctorFightPressedUntil = 0;
    let doctorFightMashCount = 0;
    let doctorLastFightTapAt = 0;
    let doctorShakeUntil = 0;
    let doctorShakeStrength = 0;
    let doctorImpactUntil = 0;
    let doctorImpactX = 0;
    let doctorImpactY = 0;
    let doctorLastFightShatterAt = 0;
    let doctorShatteredThought = null;


    function resetDoctorsOpinionGame(now = performance.now()) {
      doctorPhase = "obsession";
      doctorPhaseStartedAt = now;
      doctorObsessionStartedAt = now;
      doctorMessage = "USE WILLPOWER TO STAY SOBER.";
      doctorMessageUntil = now + 3200;
      doctorMessageLarge = false;
      doctorMessageAwaitingTap = false;
      doctorReliefUntil = 0;
      doctorThoughts = [];
      doctorNextThoughtAt = now + 450;
      doctorBurial = 0;
      doctorSlowUntil = 0;
      doctorClearUntil = 0;
      doctorReboundUntil = 0;
      doctorCopingUses = { asylum: 0, busy: 0, isolate: 0 };
      doctorCooldowns = { asylum: 0, busy: 0, isolate: 0 };
      doctorDisabledButtons = {
        meeting: false,
        sponsor: false,
        asylum: false,
        busy: false,
        isolate: false
      };
      doctorOptionUsed = {
        meeting: false,
        sponsor: false,
        asylum: false,
        busy: false,
        isolate: false
      };
      doctorReliefSource = "";
      doctorReliefEndsAt = 0;
      cravingObjects = [];
      cravingNextSpawnAt = 0;
      cravingStartedAt = 0;
      cravingCollected = 0;
      cravingEndAt = 0;
      cravingRoundIndex = -1;
      cravingRoundStartedAt = 0;
      cravingRoundDrinks = 0;
      cravingCardUntil = 0;
      cravingCardTitle = "";
      cravingCardSubtitle = "";
      cravingSplitFlashUntil = 0;
      cravingSplitX = 0;
      cravingSplitY = 0;
      cravingBillWear = 0;
      cravingShotFlashUntil = 0;
      cravingShotStartX = 0;
      cravingShotStartY = 0;
      cravingShotSpeedLabel = "";
      cravingConversationIndex = 0;
      cravingConversationNextAt = 0;
      cravingGoHomeButton = null;
      cravingEscapeProgress = 0;
      cravingEscapeAttempt = 1;
      cravingReturnText = "";
      cravingReturnUntil = 0;
      cravingBartenderSmileUntil = 0;
      cravingFloatingScores = [];
      cravingMoneyFloats = [];
      cravingMoneySpent = 0;
      cravingDoctorMirageStartedAt = 0;
      cravingDoctorMirageShown = false;
      cravingDoctorMirageTriggerAt = 0;
      cravingDoctorMirageDuration = 6000;
      cravingPostHundredMashCount = 0;
      cravingPostHundredStartProgress = 0;
      chapter3Part2Music.pause();
      chapter3Part2Music.currentTime = 0;
      doctorFightEnergy = 100;
      doctorFightUntil = 0;
      doctorFightPressedUntil = 0;
      doctorFightMashCount = 0;
      doctorLastFightTapAt = 0;
      doctorShakeUntil = 0;
      doctorShakeStrength = 0;
      doctorImpactUntil = 0;
      doctorImpactX = 0;
      doctorImpactY = 0;
      doctorLastFightShatterAt = 0;
      doctorShatteredThought = null;
    }

    function getDoctorLayout() {
      const width = getWidth();
      const height = getHeight();

      const outerMargin = Math.max(12, Math.round(width * 0.014));
      const titleY = outerMargin;
      const titleHeight = Math.max(62, Math.round(height * 0.052));

      const progressGap = 9;
      const progressHeight = Math.max(34, Math.round(height * 0.032));
      const contentTop = titleY + titleHeight + 13;

      const footerHeight = Math.max(62, Math.round(height * 0.055));
      const footerY = height - outerMargin - footerHeight;

      // Bottom stack:
      // instruction -> WILLPOWER -> chapter footer
      const progressY = footerY - progressGap - progressHeight;
      const instructionHeight = Math.max(58, Math.round(height * 0.052));
      const instructionY =
        progressY - 12 - instructionHeight;
      const sceneBottom = instructionY - 12;

      const panelWidth = Math.max(220, Math.min(292, width * 0.292));
      const panelX = width - outerMargin - panelWidth;
      const playX = outerMargin;
      const playWidth = panelX - playX - 14;

      const menuHeaderHeight = Math.max(46, Math.round(height * 0.040));
      const panelBottom = sceneBottom;
      const panelHeight = panelBottom - contentTop;

      const gap = Math.max(7, Math.round(height * 0.0057));
      const normalWeights = {
        drink: 1.08,
        meeting: 1.02,
        sponsor: 1.02,
        asylum: 1.02,
        busy: 0.96,
        isolate: 0.96,
        fight: 1.26
      };

      const totalWeight = obsessionButtons.reduce(
        (sum, button) => sum + normalWeights[button.id],
        0
      );

      const availableButtonsHeight =
        panelHeight - menuHeaderHeight - gap * obsessionButtons.length - 10;
      const unit = availableButtonsHeight / totalWeight;

      let nextY = contentTop + menuHeaderHeight + gap;
      const buttons = obsessionButtons.map((button) => {
        const itemHeight = Math.max(43, unit * normalWeights[button.id]);
        const item = {
          button,
          x: panelX + 8,
          y: nextY,
          width: panelWidth - 16,
          height: itemHeight
        };
        nextY += itemHeight + gap;
        return item;
      });

      return {
        outerMargin,
        titleY,
        titleHeight,
        progressY,
        progressHeight,
        contentTop,
        footerY,
        footerHeight,
        instructionY,
        instructionHeight,
        panelX,
        panelWidth,
        panelHeight,
        panelBottom,
        menuHeaderHeight,
        playX,
        playWidth,
        sceneBottom,
        buttons
      };
    }

    function showDoctorMessage(
      text,
      duration = 1700,
      large = false,
      awaitingTap = false
    ) {
      doctorMessage = text;
      doctorMessageLarge = large;
      doctorMessageAwaitingTap = awaitingTap;
      doctorMessageUntil = awaitingTap
        ? Number.POSITIVE_INFINITY
        : performance.now() + duration;
    }

    function dismissDoctorMessage() {
      doctorMessage = "";
      doctorMessageUntil = 0;
      doctorMessageLarge = false;
      doctorMessageAwaitingTap = false;
    }

    function spawnObsessionThought(now) {
      const layout = getDoctorLayout();
      const rebound = now < doctorReboundUntil;
      const slowed = now < doctorSlowUntil;
      const elapsed = Math.max(0, now - doctorObsessionStartedAt);
      const pressure = Math.min(1, elapsed / 60000);

      const maxThoughts = rebound ? 12 : 9;
      if (doctorThoughts.length >= maxThoughts) {
        doctorNextThoughtAt = now + 220;
        return;
      }

      const billCenterX = layout.playX + layout.playWidth * 0.52;
      const billDrawHeight = Math.max(
        285,
        Math.min(345, getWidth() * 0.54)
      );
      const visibleBurial = Math.min(172, doctorBurial);
      const billGroundY = layout.sceneBottom - 8;
      const billHeadY =
        billGroundY + visibleBurial - billDrawHeight * 0.78;

      const laneFractions = [0.14, 0.31, 0.49, 0.67, 0.84];
      const targetFraction =
        laneFractions[Math.floor(Math.random() * laneFractions.length)];
      const targetX =
        layout.playX + layout.playWidth * targetFraction;

      doctorThoughts.push({
        text:
          obsessionThoughtTexts[
            Math.floor(Math.random() * obsessionThoughtTexts.length)
          ],
        x: billCenterX + (Math.random() - 0.5) * 20,
        y: billHeadY - 6,
        speed:
          (0.82 + pressure * 0.72 + Math.random() * 0.38) *
          (rebound ? 1.50 : slowed ? 0.48 : 1),
        size: 13 + Math.floor(Math.random() * 3),
        wobble: Math.random() * Math.PI * 2,
        targetX,
        driftStrength: 0.010 + Math.random() * 0.006
      });

      // The thought itself is what drives Bill down.
      const thoughtWeight = 5.2 + pressure * 4.3;
      doctorBurial = Math.min(172, doctorBurial + thoughtWeight);

      doctorImpactUntil = now + 145;
      doctorImpactX = billCenterX;
      doctorImpactY = billHeadY;
      doctorShakeUntil = now + 95;
      doctorShakeStrength = Math.min(
        2.7,
        1.1 + doctorBurial * 0.007
      );

      let delay = 760 - pressure * 390;
      if (slowed) delay = 1120;
      if (rebound) delay = 300;

      doctorNextThoughtAt =
        now + Math.max(245, delay + Math.random() * 170);
    }

    function updateDoctorsOpinionGame(now) {
      const width = getWidth();
      const height = getHeight();

      if (doctorPhase === "obsession") {
        if (now >= doctorNextThoughtAt && now >= doctorClearUntil) {
          spawnObsessionThought(now);
        }

        if (now < doctorClearUntil) {
          doctorThoughts.length = 0;
          doctorBurial = Math.max(0, doctorBurial - 0.45);
        } else {
          const layout = getDoctorLayout();
          const fightStrength = Math.max(0, doctorFightEnergy / 100);
          const fighting = now < doctorFightUntil && doctorFightEnergy > 0;
          const fightLift = fighting ? 10 + 20 * fightStrength : 0;
          const billCenterX = layout.playX + layout.playWidth * 0.52;
          const billGroundY = layout.sceneBottom - 8 - fightLift;
          const billDrawHeight = Math.max(
            285,
            Math.min(345, getWidth() * 0.54)
          );
          const visibleBurial = Math.min(172, doctorBurial);
          const billHeadY =
            billGroundY + visibleBurial - billDrawHeight * 0.78;

          for (let i = doctorThoughts.length - 1; i >= 0; i -= 1) {
            const thought = doctorThoughts[i];

            // Thoughts rise out of Bill and spread across the screen.
            // Fight does not erase the obsession. It only slows the thoughts
            // enough for Bill to push back against them for a moment.
            const thoughtSpeedMultiplier = fighting
              ? 0.72 + (1 - fightStrength) * 0.10
              : 1;
            thought.y -= thought.speed * thoughtSpeedMultiplier;
            thought.x +=
              (thought.targetX - thought.x) *
              (thought.driftStrength || 0.012);
            thought.x +=
              Math.sin(now * 0.004 + thought.wobble) * 0.20;

            if (
              thought.y < layout.contentTop - 70 ||
              thought.x > layout.playX + layout.playWidth + 80 ||
              thought.x < layout.playX - 80
            ) {
              doctorThoughts.splice(i, 1);
            }
          }
        }
        return;
      }

      if (doctorPhase === "temporaryRelief") {
        doctorThoughts.length = 0;
        doctorBurial = Math.max(0, doctorBurial - 1.8);

        if (now >= doctorReliefEndsAt) {
          doctorPhase = "obsession";
          doctorPhaseStartedAt = now;
          doctorNextThoughtAt = now + 250;
          doctorReboundUntil = now + 4200;
          doctorReliefSource = "";
          showDoctorMessage("THE THOUGHT COMES BACK.", 1800);
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
        if (now - doctorPhaseStartedAt >= 900) {
          startCravingRound(0, now);
          cravingConversationIndex = 0;
          cravingConversationNextAt = 0;
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;

          chapter3Part2Music.currentTime = 0;
          chapter3Part2Music.playbackRate = 1;
          chapter3Part2Music.play().catch(() => {
            // The game remains playable if the new music file has not been
            // added yet or the browser is still waiting for user interaction.
          });
        }
        return;
      }

      if (doctorPhase === "craving") {
        const cravingElapsed = Math.max(
          0,
          now - cravingRoundStartedAt
        );

        if (
          !cravingDoctorMirageShown &&
          cravingDoctorMirageTriggerAt > 0 &&
          now >= cravingDoctorMirageTriggerAt
        ) {
          cravingDoctorMirageShown = true;
          cravingDoctorMirageStartedAt = now;
        }

        // Rubber-band difficulty: fast early progress creates confidence,
        // then the bar increasingly fights back over a 45-second struggle.
        const timePressure = Math.min(
          1,
          cravingElapsed / cravingMinimumEscapeTime
        );
        const drinkPressure = Math.min(1, cravingCollected / 22);
        const escapePressure = Math.min(1, cravingEscapeProgress);
        const intensity = Math.min(
          1,
          timePressure * 0.58 +
            drinkPressure * 0.22 +
            escapePressure * 0.42
        );

        // Bill can look extremely close to escaping early, but the last gap
        // does not fully open until roughly 45 seconds have passed.
        const escapeCeiling =
          cravingMoneySpent >= 100
            ? 1
            : 0.78 + 0.22 * Math.pow(timePressure, 1.65);

        const spentOverOneHundred = cravingMoneySpent >= 100;

        const pullStrength =
          spentOverOneHundred
            ? 0
            : (
                0.000003 +
                intensity * intensity * 0.000092 +
                intensity * intensity * intensity * 0.000052
              );

        // Before $100, the bar keeps dragging Bill backward. Once the final
        // ten-tap sequence begins, progress is controlled only by the player.
        cravingEscapeProgress = Math.max(
          0,
          cravingEscapeProgress - pullStrength * 16
        );

        cravingEscapeProgress = Math.min(
          cravingEscapeProgress,
          escapeCeiling
        );

        if (!spentOverOneHundred && now >= cravingNextSpawnAt) {
          serveAutomaticBeer(now, intensity);

          // Near the door, the bartender may fire a quick second drink.
          if (
            !spentOverOneHundred &&
            intensity > 0.42 &&
            Math.random() < 0.14 + intensity * 0.50
          ) {
            serveAutomaticBeer(now + 45, intensity);
          }

          // Long pauses at first; increasingly relentless service later.
          const baseDelay = 1800 - intensity * 1250;
          const randomWindow = 540 - intensity * 360;
          const postHundredBreathingRoom =
            spentOverOneHundred ? 900 : 0;

          cravingNextSpawnAt =
            now +
            Math.max(430, baseDelay) +
            postHundredBreathingRoom +
            Math.random() * Math.max(100, randomWindow);
        }

        const billHandX = getCravingBillHandX();

        for (let i = cravingObjects.length - 1; i >= 0; i -= 1) {
          const item = cravingObjects[i];
          const dt = Math.max(8, Math.min(40, now - (item.lastUpdate || now)));
          item.x -= item.speed * dt;
          item.lastUpdate = now;

          // Score only when the beer reaches Bill's wrist. Because Bill moves
          // left toward the door, the contact point moves with him.
          if (item.autoDrink && item.x <= billHandX) {
            scoreAutomaticBeer(item, now);
            cravingObjects.splice(i, 1);
            continue;
          }

          if (item.x < -item.size) {
            cravingObjects.splice(i, 1);
          }
        }

        cravingFloatingScores = cravingFloatingScores.filter(
          score => now - score.startedAt < 950
        );
        cravingMoneyFloats = cravingMoneyFloats.filter(
          money => now - money.startedAt < 1200
        );

        return;
      }

    }

    function getCravingBarLayout() {
      const width = getWidth();
      const height = getHeight();
      return {
        // The bar artwork occupies the lower portion of the portrait canvas.
        barTop: height * 0.535,
        barBottom: height * 0.79,

        // Character boxes preserve each PNG's natural aspect ratio.
        billX: width * 0.015,
        billY: height * 0.145,
        billWidth: width * 0.55,
        billHeight: height * 0.43,

        // Shift the bartender substantially right to open a longer gameplay
        // lane between his serving hand and Bill.
        bartenderX: width * 0.69,
        bartenderY: height * 0.105,
        bartenderWidth: width * 0.42,
        bartenderHeight: height * 0.49,

        // Beer movement begins near the bartender's hand and scores only when
        // it reaches Bill's wrist.
        billDrinkX: width * 0.315,
        slideStartX: width * 0.93,
        beerY: height * 0.545
      };
    }

    function startCravingRound(index, now) {
      cravingRoundIndex = 0;
      cravingObjects.length = 0;
      cravingEscapeProgress = 0;
      cravingReturnText = "";
      cravingReturnUntil = 0;
      cravingBartenderSmileUntil = 0;
      cravingNextSpawnAt = now + 1550;

      if (!cravingDoctorMirageShown && cravingDoctorMirageTriggerAt <= 0) {
        cravingDoctorMirageTriggerAt =
          now + 10000 + Math.random() * 5000;
        cravingDoctorMirageDuration =
          5000 + Math.random() * 2000;
      }

      doctorPhase = "craving";
      doctorPhaseStartedAt = now;
      cravingRoundStartedAt = now;
      if (!cravingStartedAt) cravingStartedAt = now;
    }

    function beginActiveCravingRound(now) {
      doctorPhase = "craving";
      cravingRoundStartedAt = now;
      cravingNextSpawnAt = now + 450;
      if (!cravingStartedAt) cravingStartedAt = now;
    }

    function chooseCravingReturnText() {
      const choices = [
        "ONE DAY LATER...",
        "TWO WEEKS LATER...",
        "FOUR MONTHS LATER..."
      ];
      return choices[Math.floor(Math.random() * choices.length)];
    }

    function getCravingBillShift() {
      // Going home means moving left, away from the bartender and bar.
      return -cravingEscapeProgress * getWidth() * 0.22;
    }

    function getCravingBillHandX() {
      const bar = getCravingBarLayout();
      return bar.billDrinkX + getCravingBillShift();
    }

    function chooseAutomaticDrink() {
      const drinks = [
        { type: "BEER", label: "🍺", size: 50, costMin: 3, costMax: 5 },
        { type: "SHOT", label: "🥃", size: 42, costMin: 3, costMax: 5 }
      ];

      const drink =
        drinks[cravingCollected % drinks.length];

      return drink;
    }

    function serveAutomaticBeer(now, intensity = 0) {
      const bar = getCravingBarLayout();
      const round = cravingRounds[0];
      const drink = chooseAutomaticDrink();
      const roll = Math.random();
      // Every drink is fired hard down the bar. A little variation keeps the
      // rhythm unpredictable, but there are no leisurely slides anymore.
      const speedMultiplier =
        roll < 0.30
          ? 1.55 + Math.random() * 0.28
          : roll < 0.70
            ? 1.82 + Math.random() * 0.34
            : 2.15 + Math.random() * 0.38;

      cravingObjects.push({
        type: drink.type,
        label: drink.label,
        x: bar.slideStartX,
        y: bar.beerY,
        speed:
          round.speed *
          speedMultiplier *
          (0.92 + intensity * 1.72),
        size: drink.size + Math.random() * 4,
        born: now,
        lastUpdate: now,
        autoDrink: true,
        cost:
          drink.costMin +
          Math.floor(Math.random() * (drink.costMax - drink.costMin + 1))
      });

      cravingBartenderSmileUntil = now + 650;
      cravingShotFlashUntil = now + 220;
      cravingShotStartX = bar.slideStartX;
      cravingShotStartY = bar.beerY;
      cravingShotSpeedLabel = "";
    }

    function scoreAutomaticBeer(item, now) {
      const handX = getCravingBillHandX();
      const cost = Math.max(3, Math.min(6, item.cost || 3));

      cravingCollected += 1;
      cravingRoundDrinks += 1;
      const moneyBeforeDrink = cravingMoneySpent;
      cravingMoneySpent += cost;

      if (
        moneyBeforeDrink < 100 &&
        cravingMoneySpent >= 100
      ) {
        // The struggle has made its point. From here, the player gets Bill
        // out with exactly ten more deliberate GO HOME taps.
        cravingPostHundredMashCount = 0;
        cravingPostHundredStartProgress = cravingEscapeProgress;
        cravingObjects.length = 0;
      }

      cravingBillWear = Math.min(1, cravingBillWear + 0.028);

      // Early drinks barely interrupt him. As the scene escalates, every
      // drink yanks Bill much farther back toward the bar.
      const cravingElapsed = Math.max(
        0,
        now - cravingRoundStartedAt
      );
      const timePressure = Math.min(
        1,
        cravingElapsed / cravingMinimumEscapeTime
      );
      const drinkPressure = Math.min(1, cravingCollected / 22);
      const escapePressure = Math.min(1, cravingEscapeProgress);
      const intensity = Math.min(
        1,
        timePressure * 0.58 +
          drinkPressure * 0.22 +
          escapePressure * 0.42
      );
      const spentOverOneHundred = cravingMoneySpent >= 100;
      const setbackMultiplier = spentOverOneHundred ? 0.25 : 1;

      const drinkSetback =
        (
          0.016 +
          intensity * 0.078 +
          intensity * intensity * 0.125
        ) * setbackMultiplier;

      cravingEscapeProgress = Math.max(
        0,
        cravingEscapeProgress - drinkSetback
      );

      cravingFloatingScores.push({
        x: handX,
        y: item.y - 28,
        startedAt: now
      });

      cravingMoneyFloats.push({
        x: handX + 16,
        y: item.y - 8,
        startedAt: now,
        amount: cost
      });

      playPickupFeedback(3);
    }

    function reachCravingDoor(now) {
      cravingObjects.length = 0;
      cravingEscapeProgress = 1;
      doctorPhase = "cravingEnd";
      cravingEndAt = now;
      chapter3Part2Music.pause();
      chapter3Part2Music.currentTime = 0;
      stopBackgroundMusic(false);
    }

    function spawnCravingObject(now, firstBeer = false, sourceX = null) {
      const round = cravingRounds[Math.max(0, cravingRoundIndex)];
      const bar = getCravingBarLayout();

      // Every beer is pushed differently. Some crawl along the bar while
      // others shoot toward Bill and demand a quick reaction.
      const roll = Math.random();
      const speedMultiplier =
        firstBeer
          ? 0.62
          : roll < 0.18
            ? 1.28 + Math.random() * 0.36
            : roll < 0.58
              ? 0.56 + Math.random() * 0.24
              : 0.82 + Math.random() * 0.30;

      const spawnX = sourceX == null ? bar.slideStartX : sourceX;
      const spawnY = bar.beerY + (Math.random() - 0.5) * 8;

      // Each collected drink adds pressure. By the end, even the "slow"
      // beers are arriving noticeably faster than they did at the beginning.
      const drinkAcceleration = 1 + Math.min(1.35, cravingCollected * 0.045);
      const speed = round.speed * speedMultiplier * drinkAcceleration;

      cravingObjects.push({
        type: "BEER",
        x: spawnX,
        y: spawnY,
        speed,
        size: firstBeer ? 54 : 46 + Math.random() * 7,
        born: now,
        lastUpdate: now,
        shotLife: sourceX == null ? 1 : 0
      });

      if (sourceX == null) {
        cravingShotFlashUntil = now + 240;
        cravingShotStartX = spawnX;
        cravingShotStartY = spawnY;
        cravingShotSpeedLabel = "";
      }
    }

    function spawnCravingShot(now) {
      const round = cravingRounds[Math.max(0, cravingRoundIndex)];
      const bar = getCravingBarLayout();
      const speedMultiplier = 1.35 + Math.random() * 0.45;

      cravingObjects.push({
        type: "SHOT",
        x: bar.slideStartX,
        y: bar.beerY + 4,
        speed: round.speed * speedMultiplier,
        size: 38,
        born: now,
        lastUpdate: now,
        shotLife: 1
      });

      cravingShotFlashUntil = now + 260;
      cravingShotStartX = bar.slideStartX;
      cravingShotStartY = bar.beerY + 4;
      cravingShotSpeedLabel = "TORNADO!";
    }

    function consumeCravingBeer(index, now, tapped) {
      const item = cravingObjects[index];
      if (!item) return;
      const round = cravingRounds[cravingRoundIndex];
      cravingObjects.splice(index, 1);
      cravingRoundDrinks += 1;
      cravingCollected += 1;
      cravingBillWear = Math.min(1, cravingBillWear + 0.018);

      const bar = getCravingBarLayout();
      cravingFloatingScores.push({
        x: bar.billDrinkX,
        y: bar.beerY - 28,
        startedAt: now
      });

      if (
        item.type === "BEER" &&
        cravingRoundDrinks < round.drinks - 1 &&
        Math.random() < round.splitChance
      ) {
        cravingSplitFlashUntil = now + 520;
        cravingSplitX = item.x;
        cravingSplitY = item.y;
        spawnCravingObject(now, false, item.x + 18);
        spawnCravingObject(now, false, item.x + 54);
        cravingRoundDrinks = Math.max(0, cravingRoundDrinks - 1);
      }

      if (tapped) playPickupFeedback(3);
    }

    function useObsessionButton(id, now) {
      if (id === "drink") {
        // The drink is always available. The player can surrender to the
        // obsession immediately or keep trying the other responses first.
        doctorPhase = "relief";
        doctorPhaseStartedAt = now;
        doctorReliefUntil = now + 5200;
        doctorThoughts.length = 0;
        doctorMessage =
          "CONGRATULATIONS!\nYOU TRIGGERED THE ALLERGY.\nTHE PHENOMENON OF CRAVING HAS NOW BEGUN.\nNOW SEE IF YOU CAN STOP!";
        doctorMessageUntil = doctorReliefUntil;
        doctorMessageLarge = true;

        // End the first-half music cleanly here. Part two begins with its own
        // track after the transition card.
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        return;
      }

      if (id === "meeting") {
        doctorOptionUsed.meeting = true;
        doctorDisabledButtons.meeting = true;
        showDoctorMessage(
          "SORRY KID, THOSE AIN'T BEEN INVENTED YET...",
          0,
          true,
          true
        );
        return;
      }

      if (id === "sponsor") {
        doctorOptionUsed.sponsor = true;
        doctorDisabledButtons.sponsor = true;
        showDoctorMessage(
          "NOPE, THAT IDEA DOESN'T EVEN EXIST AT THIS POINT.",
          0,
          true,
          true
        );
        return;
      }

      if (id === "fight") {
        if (doctorFightEnergy <= 0) {
          return;
        }

        const allOtherOptionsUsed =
          doctorOptionUsed.meeting &&
          doctorOptionUsed.sponsor &&
          doctorOptionUsed.asylum &&
          doctorOptionUsed.busy &&
          doctorOptionUsed.isolate;

        const tapGap = now - doctorLastFightTapAt;
        doctorFightMashCount =
          tapGap <= 330
            ? Math.min(10, doctorFightMashCount + 1)
            : 1;
        doctorLastFightTapAt = now;

        const currentStrength = Math.max(
          0.08,
          doctorFightEnergy / 100
        );
        const mashStrength = Math.min(
          1,
          doctorFightMashCount / 7
        );

        // One tap only buys a fraction of a second.
        // Repeated taps overlap and create the feeling of actively holding
        // the obsession back.
        const fightDuration =
          105 +
          currentStrength * 155 +
          mashStrength * 120;
        const reliefAmount =
          0.8 +
          currentStrength * 3.4 +
          mashStrength * 2.3;

        doctorFightPressedUntil = now + 115;
        doctorFightUntil = Math.max(
          doctorFightUntil,
          now + fightDuration
        );
        doctorBurial = Math.max(
          0,
          doctorBurial - reliefAmount
        );
        doctorShakeUntil = now + 70;
        doctorShakeStrength =
          1.5 + currentStrength + mashStrength * 0.8;

        const layout = getDoctorLayout();
        const billCenterX =
          layout.playX + layout.playWidth * 0.52;
        const billDrawHeight = Math.max(
          285,
          Math.min(345, getWidth() * 0.54)
        );
        const visibleBurial = Math.min(172, doctorBurial);
        const billGroundY = layout.sceneBottom - 8;
        const billHeadY =
          billGroundY + visibleBurial - billDrawHeight * 0.78;

        // Most Fight taps only slow the chatter and lift Bill. Occasionally
        // the closest visible bubble directly above Bill's head shatters.
        const canShatter =
          doctorThoughts.length > 0 &&
          !doctorShatteredThought &&
          now - doctorLastFightShatterAt > 700;
        const shatterChance = 0.08 + mashStrength * 0.10;

        if (canShatter && Math.random() < shatterChance) {
          let shatterIndex = -1;
          let closestDistance = Number.POSITIVE_INFINITY;

          doctorThoughts.forEach((thought, index) => {
            const dx = thought.x - billCenterX;
            const dy = thought.y - billHeadY;
            const isAboveBillsHead =
              dy <= 25 &&
              dy >= -210 &&
              Math.abs(dx) <= 175;

            if (!isAboveBillsHead) return;

            const distance = Math.hypot(dx, dy);
            if (distance < closestDistance) {
              closestDistance = distance;
              shatterIndex = index;
            }
          });

          if (shatterIndex >= 0) {
            const shatteredThought = doctorThoughts[shatterIndex];
            doctorThoughts.splice(shatterIndex, 1);
            doctorLastFightShatterAt = now;
            doctorShatteredThought = {
              ...shatteredThought,
              startedAt: now,
              duration: 430
            };
            doctorImpactUntil = now + 260;
            doctorImpactX = shatteredThought.x;
            doctorImpactY = shatteredThought.y;
            doctorShakeUntil = now + 95;
            doctorShakeStrength = Math.max(doctorShakeStrength, 2.4);
          }
        }

        const energyLoss = allOtherOptionsUsed
          ? doctorFightEnergy > 65
            ? 4
            : doctorFightEnergy > 35
              ? 5
              : 7
          : 1.5;

        doctorFightEnergy = Math.max(
          0,
          doctorFightEnergy - energyLoss
        );

        // Fight communicates only through the weakening button,
        // draining WILLPOWER meter, and increasingly urgent Drink pulse.
        // No notification interrupts the button-mashing rhythm.
        return;
      }

      if (doctorDisabledButtons[id]) {
        showDoctorMessage("THAT OPTION IS USED UP.", 1500);
        return;
      }

      if (id === "asylum" || id === "busy" || id === "isolate") {
        doctorOptionUsed[id] = true;
        doctorDisabledButtons[id] = true;
        doctorCopingUses[id] += 1;
        doctorPhase = "temporaryRelief";
        doctorPhaseStartedAt = now;
        doctorReliefSource = id;
        doctorReliefEndsAt = now + 10000;
        doctorThoughts.length = 0;
        doctorBurial = Math.max(0, doctorBurial - 34);
        doctorSlowUntil = doctorReliefEndsAt;

        if (id === "asylum") {
          showDoctorMessage("THE ASYLUM GIVES RELIEF... FOR A WHILE.", 2400);
        } else if (id === "isolate") {
          showDoctorMessage("ISOLATION GIVES RELIEF... FOR A WHILE.", 2400);
        } else {
          showDoctorMessage("STAYING BUSY GIVES RELIEF... FOR A WHILE.", 2400);
        }
        return;
      }
    }

    function tapDoctorsOpinionGame(x, y) {
      const now = performance.now();

      if (doctorMessageAwaitingTap) {
        playClickFeedback();
        dismissDoctorMessage();
        return true;
      }
      if (doctorPhase === "cravingEnd") {
        // Ignore the same physical tap that completed the game. The results
        // card must remain visible until the player deliberately taps again.
        if (now - cravingEndAt < 900) {
          return true;
        }

        playClickFeedback();
        doctorPhase = "complete";

        const nextChapterUrl = new URL(window.location.href);
        nextChapterUrl.searchParams.set("chapter", "4");
        nextChapterUrl.searchParams.delete("skipIntro");
        window.location.href = nextChapterUrl.toString();

        return true;
      }

      if (doctorPhase === "obsession" || doctorPhase === "temporaryRelief") {
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
        if (
          cravingGoHomeButton &&
          x >= cravingGoHomeButton.x &&
          x <= cravingGoHomeButton.x + cravingGoHomeButton.width &&
          y >= cravingGoHomeButton.y &&
          y <= cravingGoHomeButton.y + cravingGoHomeButton.height
        ) {
          playClickFeedback();

          // Repeated taps move Bill toward the door. Later drinks make each
          // tap slightly less effective.
          const cravingElapsed = Math.max(
            0,
            now - cravingRoundStartedAt
          );
          const timePressure = Math.min(
            1,
            cravingElapsed / cravingMinimumEscapeTime
          );
          const drinkPressure = Math.min(1, cravingCollected / 22);
          const escapePressure = Math.min(1, cravingEscapeProgress);
          const intensity = Math.min(
            1,
            timePressure * 0.58 +
              drinkPressure * 0.22 +
              escapePressure * 0.42
          );
          const escapeCeiling =
            cravingMoneySpent >= 100
              ? 1
              : 0.78 + 0.22 * Math.pow(timePressure, 1.65);

          // Early taps move Bill dramatically. Near the temporary ceiling,
          // diminishing returns force the player to keep fighting while the
          // increasingly rapid drinks drag him back.
          const roomToCeiling = Math.max(
            0,
            escapeCeiling - cravingEscapeProgress
          );
          const ceilingResistance = Math.max(
            0.14,
            Math.min(1, roomToCeiling / 0.18)
          );
          const spentOverOneHundred = cravingMoneySpent >= 100;

          if (spentOverOneHundred) {
            cravingPostHundredMashCount = Math.min(
              cravingPostHundredMashGoal,
              cravingPostHundredMashCount + 1
            );

            const finalMashProgress =
              cravingPostHundredMashCount / cravingPostHundredMashGoal;

            cravingEscapeProgress =
              cravingPostHundredStartProgress +
              (1 - cravingPostHundredStartProgress) * finalMashProgress;

            if (
              cravingPostHundredMashCount >= cravingPostHundredMashGoal
            ) {
              cravingEscapeProgress = 1;
              reachCravingDoor(now);
            }

            return true;
          }

          const tapGain =
            (0.090 - intensity * 0.034) *
            ceilingResistance;

          cravingEscapeProgress = Math.min(
            escapeCeiling,
            cravingEscapeProgress + tapGain
          );

          if (
            cravingElapsed >= cravingMinimumEscapeTime &&
            cravingEscapeProgress >= 0.995
          ) {
            cravingEscapeProgress = 1;
            reachCravingDoor(now);
          }
          return true;
        }

      }
      return false;
    }

    function drawPixelBill(centerX, groundY, peaceful = false) {
      // Keep Bill visible even when the gameplay burial value becomes extreme.
      const buried = peaceful ? 0 : Math.min(doctorBurial, 172);
      const y = groundY + buried;

      if (chapter3PlayerImage.complete && chapter3PlayerImage.naturalWidth > 0) {
        const drawHeight = Math.max(285, Math.min(345, getWidth() * 0.54));
        const drawWidth =
          drawHeight * (chapter3PlayerImage.naturalWidth / chapter3PlayerImage.naturalHeight);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          chapter3PlayerImage,
          centerX - drawWidth / 2,
          y - drawHeight,
          drawWidth,
          drawHeight
        );
        ctx.restore();
        return;
      }

      // Keep the original pixel Bill as a fallback while the PNG loads.
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

    function wrapThoughtText(text, maxChars = 15) {
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";

      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (test.length > maxChars && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }

      if (line) lines.push(line);
      return lines.slice(0, 3);
    }

    function drawThoughtBubble(thought) {
      ctx.save();

      const now = performance.now();
      const wobble = Math.sin(now * 0.0045 + thought.wobble) * 1.4;
      const lines = wrapThoughtText(thought.text);
      const fontSize = thought.size;
      const lineHeight = fontSize + 3;

      ctx.font = `900 ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const widest = Math.max(
        ...lines.map((line) => ctx.measureText(line).width)
      );
      const bubbleWidth = Math.max(104, Math.min(178, widest + 30));
      const bubbleHeight = Math.max(
        48,
        lines.length * lineHeight + 25
      );
      const left = Math.round(thought.x - bubbleWidth / 2);
      const top = Math.round(thought.y - bubbleHeight / 2 + wobble);
      const cut = 10;

      // Shadow.
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.beginPath();
      ctx.moveTo(left + cut + 5, top + 6);
      ctx.lineTo(left + bubbleWidth - cut + 5, top + 6);
      ctx.lineTo(left + bubbleWidth + 5, top + cut + 6);
      ctx.lineTo(left + bubbleWidth + 5, top + bubbleHeight - cut + 6);
      ctx.lineTo(left + bubbleWidth - cut + 5, top + bubbleHeight + 6);
      ctx.lineTo(left + cut + 5, top + bubbleHeight + 6);
      ctx.lineTo(left + 5, top + bubbleHeight - cut + 6);
      ctx.lineTo(left + 5, top + cut + 6);
      ctx.closePath();
      ctx.fill();

      // Black outer frame.
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.moveTo(left + cut - 4, top - 4);
      ctx.lineTo(left + bubbleWidth - cut + 4, top - 4);
      ctx.lineTo(left + bubbleWidth + 4, top + cut - 4);
      ctx.lineTo(left + bubbleWidth + 4, top + bubbleHeight - cut + 4);
      ctx.lineTo(left + bubbleWidth - cut + 4, top + bubbleHeight + 4);
      ctx.lineTo(left + cut - 4, top + bubbleHeight + 4);
      ctx.lineTo(left - 4, top + bubbleHeight - cut + 4);
      ctx.lineTo(left - 4, top + cut - 4);
      ctx.closePath();
      ctx.fill();

      // Cream body.
      ctx.fillStyle = "#e9dfc8";
      ctx.beginPath();
      ctx.moveTo(left + cut, top);
      ctx.lineTo(left + bubbleWidth - cut, top);
      ctx.lineTo(left + bubbleWidth, top + cut);
      ctx.lineTo(left + bubbleWidth, top + bubbleHeight - cut);
      ctx.lineTo(left + bubbleWidth - cut, top + bubbleHeight);
      ctx.lineTo(left + cut, top + bubbleHeight);
      ctx.lineTo(left, top + bubbleHeight - cut);
      ctx.lineTo(left, top + cut);
      ctx.closePath();
      ctx.fill();

      // Top highlight and bottom shade.
      ctx.fillStyle = "#fff8e8";
      ctx.fillRect(left + cut + 2, top + 4, bubbleWidth - cut * 2 - 4, 3);
      ctx.fillStyle = "#bcae92";
      ctx.fillRect(
        left + cut + 2,
        top + bubbleHeight - 7,
        bubbleWidth - cut * 2 - 4,
        3
      );

      // Angular speech tail.
      const tailX = Math.round(thought.x - bubbleWidth * 0.16);
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.moveTo(tailX - 4, top + bubbleHeight);
      ctx.lineTo(tailX + 21, top + bubbleHeight);
      ctx.lineTo(tailX + 5, top + bubbleHeight + 19);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#e9dfc8";
      ctx.beginPath();
      ctx.moveTo(tailX, top + bubbleHeight - 1);
      ctx.lineTo(tailX + 15, top + bubbleHeight - 1);
      ctx.lineTo(tailX + 5, top + bubbleHeight + 12);
      ctx.closePath();
      ctx.fill();

      // Text.
      ctx.fillStyle = "#161616";
      const totalTextHeight = lines.length * lineHeight;
      const firstY =
        top + bubbleHeight / 2 - totalTextHeight / 2 + lineHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          thought.x,
          firstY + index * lineHeight,
          bubbleWidth - 22
        );
      });

      ctx.restore();
    }

    function drawShatteredThought(thought, now) {
      if (!thought) return;

      const progress = Math.max(
        0,
        Math.min(1, (now - thought.startedAt) / thought.duration)
      );

      if (progress >= 1) {
        doctorShatteredThought = null;
        return;
      }

      ctx.save();

      const lines = wrapThoughtText(thought.text);
      const fontSize = thought.size;
      const lineHeight = fontSize + 3;
      ctx.font = `900 ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const widest = Math.max(
        ...lines.map((line) => ctx.measureText(line).width)
      );
      const bubbleWidth = Math.max(104, Math.min(178, widest + 30));
      const bubbleHeight = Math.max(48, lines.length * lineHeight + 25);
      const left = thought.x - bubbleWidth / 2;
      const top = thought.y - bubbleHeight / 2;
      const burst = 8 + progress * 28;
      const fade = 1 - progress;

      ctx.globalAlpha = Math.max(0, fade);
      ctx.lineJoin = "round";

      const pieces = [
        {
          points: [[0, 0], [0.50, 0], [0.42, 0.50], [0.05, 0.56]],
          dx: -burst,
          dy: -burst * 0.55,
          rotation: -0.18 * progress
        },
        {
          points: [[0.50, 0], [1, 0], [0.95, 0.56], [0.42, 0.50]],
          dx: burst,
          dy: -burst * 0.45,
          rotation: 0.20 * progress
        },
        {
          points: [[0.05, 0.56], [0.42, 0.50], [0.50, 1], [0, 1]],
          dx: -burst * 0.75,
          dy: burst * 0.65,
          rotation: 0.14 * progress
        },
        {
          points: [[0.42, 0.50], [0.95, 0.56], [1, 1], [0.50, 1]],
          dx: burst * 0.78,
          dy: burst * 0.72,
          rotation: -0.16 * progress
        }
      ];

      for (const piece of pieces) {
        ctx.save();
        const centerX = left + bubbleWidth / 2 + piece.dx;
        const centerY = top + bubbleHeight / 2 + piece.dy;
        ctx.translate(centerX, centerY);
        ctx.rotate(piece.rotation);
        ctx.translate(-centerX, -centerY);

        ctx.beginPath();
        piece.points.forEach(([px, py], index) => {
          const x = left + px * bubbleWidth + piece.dx;
          const y = top + py * bubbleHeight + piece.dy;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = "#e9dfc8";
        ctx.fill();
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }

      // Bright crack and flying shards keep the effect readable above Bill.
      ctx.strokeStyle = "#fff4b0";
      ctx.lineWidth = 3;
      for (let ray = 0; ray < 8; ray += 1) {
        const angle = (Math.PI * 2 * ray) / 8 + 0.2;
        const inner = 7 + progress * 5;
        const outer = 19 + progress * 31;
        ctx.beginPath();
        ctx.moveTo(
          thought.x + Math.cos(angle) * inner,
          thought.y + Math.sin(angle) * inner
        );
        ctx.lineTo(
          thought.x + Math.cos(angle) * outer,
          thought.y + Math.sin(angle) * outer
        );
        ctx.stroke();
      }

      ctx.fillStyle = "#fff8e8";
      for (let shard = 0; shard < 10; shard += 1) {
        const angle = (Math.PI * 2 * shard) / 10 + 0.35;
        const distance = 15 + progress * 42;
        const x = thought.x + Math.cos(angle) * distance;
        const y = thought.y + Math.sin(angle) * distance;
        const size = 2 + (shard % 3);
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }

      ctx.restore();
    }

    function wrapDoctorText(text, maxWidth, font) {
      ctx.font = font;
      const outputLines = [];
      const explicitLines = String(text).split("\n");

      for (const explicitLine of explicitLines) {
        const words = explicitLine.trim().split(/\s+/).filter(Boolean);
        let line = "";

        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && line) {
            outputLines.push(line);
            line = word;
          } else {
            line = test;
          }
        }

        if (line) outputLines.push(line);
      }

      return outputLines;
    }

    function drawWideDoctorNotification(text, width, height) {
      const boxWidth = width * 0.94;
      const boxX = (width - boxWidth) / 2;
      const fontSize = Math.max(20, Math.min(30, width * 0.038));
      const font = `900 ${fontSize}px monospace`;
      const maxTextWidth = boxWidth - 50;
      const lines = wrapDoctorText(text, maxTextWidth, font);
      const lineHeight = fontSize + 10;
      const boxHeight = Math.max(
        92,
        Math.min(height * 0.30, lines.length * lineHeight + 46)
      );
      const boxY = height * 0.37 - boxHeight / 2;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fillRect(0, boxY - 16, width, boxHeight + 32);

      drawBeveledWindow(ctx, {
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        fill: "rgba(5, 14, 18, 0.98)",
        border: "#c9962d",
        highlight: "#ffe08a",
        innerBorder: "#2b1808",
        shadowOffset: 8,
        cut: 16,
        inset: 10
      });

      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#050505";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";

      const startY =
        boxY + boxHeight / 2 -
        ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(line, width / 2, y, maxTextWidth);
        ctx.fillText(line, width / 2, y, maxTextWidth);
      });

      ctx.restore();
    }

    function drawDoctorVictoryMessage(width, height) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Almost total blackness: it first reads like a victory screen,
      // then the consequence lands underneath.
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const titleSize = Math.max(38, Math.min(66, width * 0.105));
      const subSize = Math.max(22, Math.min(34, width * 0.052));
      const bodySize = Math.max(18, Math.min(27, width * 0.041));

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      ctx.font = `900 ${titleSize}px monospace`;
      ctx.strokeStyle = "#3b2600";
      ctx.lineWidth = 9;
      ctx.fillStyle = "#ffd34d";
      ctx.strokeText(
        "CONGRATULATIONS!",
        width / 2,
        height * 0.20,
        width * 0.92
      );
      ctx.fillText(
        "CONGRATULATIONS!",
        width / 2,
        height * 0.20,
        width * 0.92
      );

      ctx.font = `900 ${subSize}px monospace`;
      ctx.strokeStyle = "#240000";
      ctx.lineWidth = 7;
      ctx.fillStyle = "#ff5d4a";
      ctx.strokeText(
        "YOU TRIGGERED THE ALLERGY.",
        width / 2,
        height * 0.34,
        width * 0.88
      );
      ctx.fillText(
        "YOU TRIGGERED THE ALLERGY.",
        width / 2,
        height * 0.34,
        width * 0.88
      );

      const dividerY = height * 0.425;
      ctx.fillStyle = "#c9962d";
      ctx.fillRect(width * 0.12, dividerY, width * 0.76, 4);

      const bodyLines = [
        "THE PHENOMENON OF CRAVING",
        "HAS NOW BEGUN."
      ];

      ctx.font = `900 ${bodySize}px monospace`;
      ctx.strokeStyle = "#050505";
      ctx.lineWidth = 5;
      ctx.fillStyle = "#ffffff";

      const bodyLineHeight = bodySize + 15;
      const bodyStartY = height * 0.54;

      bodyLines.forEach((line, index) => {
        const y = bodyStartY + index * bodyLineHeight;
        ctx.strokeText(line, width / 2, y, width * 0.88);
        ctx.fillText(line, width / 2, y, width * 0.88);
      });

      ctx.font = `900 ${Math.max(22, bodySize * 1.08)}px monospace`;
      ctx.fillStyle = "#ffd34d";
      ctx.strokeStyle = "#3b2600";
      ctx.lineWidth = 6;
      ctx.strokeText(
        "NOW SEE IF YOU CAN STOP!",
        width / 2,
        height * 0.79,
        width * 0.90
      );
      ctx.fillText(
        "NOW SEE IF YOU CAN STOP!",
        width / 2,
        height * 0.79,
        width * 0.90
      );

      ctx.restore();
    }

    function drawLargeDoctorMessage(text, width, height) {
      if (String(text).startsWith("CONGRATULATIONS!")) {
        drawDoctorVictoryMessage(width, height);
        return;
      }

      const boxWidth = width * 0.94;
      const boxHeight = Math.min(390, height * 0.48);
      const boxX = (width - boxWidth) / 2;
      const boxY = (height - boxHeight) / 2;

      const maxTextWidth = boxWidth - 72;
      const fontSize = Math.max(26, Math.min(40, width * 0.046));
      const lineHeight = fontSize + 16;
      const tapSize = Math.max(17, Math.min(24, width * 0.025));

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Pause the visual action and focus attention on the message.
      ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
      ctx.fillRect(0, 0, width, height);

      drawBeveledWindow(ctx, {
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        fill: "#07151a",
        border: "#c9962d",
        highlight: "#ffe08a",
        innerBorder: "#2b1808",
        shadowOffset: 10,
        cut: 18,
        inset: 11
      });

      ctx.font = `900 ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#050505";
      ctx.lineWidth = 7;
      ctx.lineJoin = "round";

      const outputLines = [];
      const explicitLines = text.includes("\n") ? text.split("\n") : [text];

      for (const explicitLine of explicitLines) {
        const words = explicitLine.split(/\s+/);
        let line = "";

        for (const word of words) {
          const test = line ? `${line} ${word}` : word;

          if (ctx.measureText(test).width > maxTextWidth && line) {
            outputLines.push(line);
            line = word;
          } else {
            line = test;
          }
        }

        if (line) {
          outputLines.push(line);
        }
      }

      const totalTextHeight = outputLines.length * lineHeight;
      const messageAreaTop = boxY + 28;
      const messageAreaBottom = doctorMessageAwaitingTap
        ? boxY + boxHeight - 68
        : boxY + boxHeight - 28;
      const messageAreaHeight = messageAreaBottom - messageAreaTop;
      const startY =
        messageAreaTop +
        messageAreaHeight / 2 -
        totalTextHeight / 2 +
        lineHeight / 2;

      outputLines.forEach((outputLine, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(outputLine, width / 2, y, maxTextWidth);
        ctx.fillText(outputLine, width / 2, y, maxTextWidth);
      });

      if (doctorMessageAwaitingTap) {
        ctx.font = `900 ${tapSize}px monospace`;
        ctx.fillStyle = "#ffd34d";
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = 4;

        const tapY = boxY + boxHeight - 34;
        ctx.strokeText("TAP TO CONTINUE", width / 2, tapY, maxTextWidth);
        ctx.fillText("TAP TO CONTINUE", width / 2, tapY, maxTextWidth);
      }

      ctx.restore();
    }

    function drawPixelPanel(
      x,
      y,
      width,
      height,
      fill,
      accent = "#f2c94c"
    ) {
      drawWindow(ctx, {
        x,
        y,
        width,
        height,
        fill,
        border: accent,
        highlight: accent,
        shadow: "rgba(0, 0, 0, 0.55)",
        shadowOffset: 5
      });
    }

    function drawStormEnvironment(layout, now, peaceful) {
      const width = layout.playWidth;
      const height = getHeight();
      const horizonY = layout.sceneBottom - 155;

      // Layer 1: stormy twilight sky.
      const sky = ctx.createLinearGradient(0, 54, 0, height);
      sky.addColorStop(0, peaceful ? "#263b55" : "#111729");
      sky.addColorStop(0.52, peaceful ? "#55455e" : "#29243f");
      sky.addColorStop(1, peaceful ? "#8a633c" : "#4b2f32");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 54, width, height - 54);

      // Layer 2: slow drifting clouds built from blocky pixels.
      const cloudShift = (now * 0.006) % 180;
      const cloudBands = [
        { y: 88, speed: 0.35, alpha: 0.20 },
        { y: 134, speed: 0.52, alpha: 0.16 },
        { y: 188, speed: 0.22, alpha: 0.13 }
      ];

      for (const band of cloudBands) {
        const shift = (cloudShift * band.speed) % 180;
        ctx.fillStyle = `rgba(8, 11, 22, ${band.alpha})`;
        for (let x = -210; x < width + 210; x += 180) {
          const cloudX = Math.round(x + shift);
          ctx.fillRect(cloudX, band.y, 118, 18);
          ctx.fillRect(cloudX + 18, band.y - 10, 78, 14);
          ctx.fillRect(cloudX + 44, band.y + 15, 104, 13);
        }
      }

      // Layer 3: distant skyline silhouette.
      ctx.fillStyle = peaceful ? "#20283a" : "#101421";
      const buildings = [
        [0, 70], [24, 102], [46, 82], [68, 122], [94, 92],
        [119, 138], [146, 106], [172, 150], [201, 94], [226, 126],
        [252, 78], [277, 118], [304, 148], [333, 96], [359, 130],
        [386, 84], [412, 120], [439, 104], [466, 142], [494, 88]
      ];

      for (let i = 0; i < buildings.length; i += 1) {
        const [x, buildingHeight] = buildings[i];
        const w = 22 + (i % 3) * 7;
        ctx.fillRect(x, horizonY - buildingHeight, w, buildingHeight);

        // Rooftop shapes.
        if (i % 4 === 0) {
          ctx.fillRect(x + 6, horizonY - buildingHeight - 12, 5, 12);
        }
        if (i % 5 === 0) {
          ctx.fillRect(x + 10, horizonY - buildingHeight - 18, 3, 18);
        }

        // A few warm windows.
        for (let wy = horizonY - buildingHeight + 14; wy < horizonY - 12; wy += 18) {
          if ((i + Math.floor(wy / 18)) % 3 !== 0) continue;
          ctx.fillStyle = peaceful ? "#d6a45c" : "#ba7135";
          ctx.fillRect(x + 6, wy, 4, 5);
          if (w > 25) ctx.fillRect(x + 15, wy + 3, 4, 5);
          ctx.fillStyle = peaceful ? "#20283a" : "#101421";
        }
      }

      // Layer 4: fog band.
      const fog = ctx.createLinearGradient(0, horizonY - 35, 0, horizonY + 45);
      fog.addColorStop(0, "rgba(112, 105, 130, 0)");
      fog.addColorStop(0.55, peaceful ? "rgba(170, 150, 130, 0.16)" : "rgba(86, 76, 103, 0.18)");
      fog.addColorStop(1, "rgba(20, 18, 25, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, horizonY - 35, width, 90);

      // Layer 5: street lamps.
      const lampXs = [34, width - 45];
      for (const lampX of lampXs) {
        ctx.fillStyle = "#17130f";
        ctx.fillRect(lampX - 3, horizonY - 18, 6, 76);
        ctx.fillRect(lampX - 11, horizonY - 24, 22, 5);
        ctx.fillStyle = "#e1a84a";
        ctx.fillRect(lampX - 7, horizonY - 38, 14, 16);
        ctx.fillStyle = "#ffe7a0";
        ctx.fillRect(lampX - 4, horizonY - 34, 8, 9);

        const glow = ctx.createRadialGradient(
          lampX,
          horizonY - 29,
          2,
          lampX,
          horizonY - 29,
          38
        );
        glow.addColorStop(0, "rgba(255, 211, 105, 0.24)");
        glow.addColorStop(1, "rgba(255, 211, 105, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(lampX - 38, horizonY - 67, 76, 76);
      }

      // Layer 6: rain streaks. Deterministic positions avoid flicker.
      ctx.strokeStyle = peaceful
        ? "rgba(183, 208, 229, 0.20)"
        : "rgba(151, 171, 210, 0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const rainOffset = (now * 0.22) % 62;
      for (let i = 0; i < 62; i += 1) {
        const x = (i * 73 + (i % 5) * 19) % Math.max(1, width);
        const y = ((i * 47 + rainOffset) % Math.max(1, height - 80)) + 58;
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y + 17);
      }
      ctx.stroke();

      // Falling obsession "comets" behind the thought bubbles.
      for (let i = 0; i < 22; i += 1) {
        const lane = (i * 91 + 37) % Math.max(1, width - 30);
        const travel = (now * (0.055 + (i % 4) * 0.012) + i * 103) %
          Math.max(1, layout.sceneBottom - 120);
        const cy = 72 + travel;
        const radius = 4 + (i % 4) * 2;

        ctx.strokeStyle = "rgba(224, 196, 130, 0.46)";
        ctx.lineWidth = 3 + (i % 2);
        ctx.beginPath();
        ctx.moveTo(lane - radius * 0.3, cy - 42 - radius * 2);
        ctx.lineTo(lane, cy - radius);
        ctx.stroke();

        ctx.fillStyle = i % 3 === 0 ? "#8c8177" : "#605a58";
        ctx.fillRect(lane - radius, cy - radius, radius * 2, radius * 2);
        ctx.fillStyle = "#b8aaa0";
        ctx.fillRect(lane - radius + 2, cy - radius + 2, Math.max(2, radius - 1), 3);
        ctx.fillStyle = "#252323";
        ctx.fillRect(lane - radius + 3, cy + radius - 3, Math.max(2, radius), 3);
      }

      // Layer 7: broken street and foreground rubble.
      ctx.fillStyle = "#282522";
      ctx.fillRect(0, layout.sceneBottom - 72, width, 72);
      ctx.fillStyle = "#161616";
      ctx.fillRect(0, layout.sceneBottom - 76, width, 7);

      for (let x = -12; x < width + 18; x += 26) {
        const y = layout.sceneBottom - 66 + ((x / 26) % 3) * 8;
        ctx.fillStyle = x % 52 === 0 ? "#4a4540" : "#37332f";
        ctx.fillRect(x, y, 20, 10);
        ctx.fillStyle = "#1b1917";
        ctx.fillRect(x + 4, y + 8, 18, 5);
      }

      // Foreground cracks.
      ctx.strokeStyle = "#0d0d0d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 18; x < width; x += 72) {
        ctx.moveTo(x, layout.sceneBottom - 60);
        ctx.lineTo(x + 13, layout.sceneBottom - 50);
        ctx.lineTo(x + 4, layout.sceneBottom - 39);
        ctx.lineTo(x + 22, layout.sceneBottom - 28);
      }
      ctx.stroke();
    }

    function drawBillRubble(centerX, groundY, burial) {
      const pile = Math.min(1, burial / 172);
      const rows = 2 + Math.floor(pile * 9);

      ctx.save();
      for (let row = 0; row < rows; row += 1) {
        const count = 5 + row * 2;
        const rowY = groundY - row * 12 + 4;
        for (let i = 0; i < count; i += 1) {
          const spread = 78 + row * 9;
          const x = centerX - spread + (i / Math.max(1, count - 1)) * spread * 2;
          const wobble = ((i * 17 + row * 11) % 9) - 4;
          const rockW = 17 + ((i + row) % 4) * 4;
          const rockH = 9 + ((i * 3 + row) % 3) * 3;

          ctx.fillStyle = (i + row) % 3 === 0 ? "#57504a" : "#3e3935";
          ctx.fillRect(Math.round(x + wobble - rockW / 2), rowY, rockW, rockH);
          ctx.fillStyle = "#71675e";
          ctx.fillRect(Math.round(x + wobble - rockW / 2 + 3), rowY + 2, Math.max(4, rockW - 7), 2);
          ctx.fillStyle = "#1c1a18";
          ctx.fillRect(Math.round(x + wobble - rockW / 2 + 4), rowY + rockH - 3, Math.max(5, rockW - 6), 3);
        }
      }
      ctx.restore();
    }

    function getVisibleImageBounds(image) {
      const cached = chapter3VisibleImageBounds.get(image);
      if (cached) return cached;

      const fallback = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight
      };

      try {
        const scan = document.createElement("canvas");
        scan.width = image.naturalWidth;
        scan.height = image.naturalHeight;
        const scanCtx = scan.getContext("2d", { willReadFrequently: true });
        scanCtx.drawImage(image, 0, 0);

        const pixels = scanCtx.getImageData(0, 0, scan.width, scan.height).data;
        let minX = scan.width;
        let minY = scan.height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < scan.height; y += 1) {
          for (let x = 0; x < scan.width; x += 1) {
            const alpha = pixels[(y * scan.width + x) * 4 + 3];
            if (alpha > 8) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX >= minX && maxY >= minY) {
          const bounds = {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
          };
          chapter3VisibleImageBounds.set(image, bounds);
          return bounds;
        }
      } catch (error) {
        // If pixel inspection is unavailable, use the complete image safely.
      }

      chapter3VisibleImageBounds.set(image, fallback);
      return fallback;
    }

    function drawImageCover(image, x, y, width, height) {
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const boxRatio = width / height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;

      if (imageRatio > boxRatio) {
        sourceWidth = image.naturalHeight * boxRatio;
        sourceX = (image.naturalWidth - sourceWidth) * 0.5;
      } else {
        sourceHeight = image.naturalWidth / boxRatio;
        sourceY = (image.naturalHeight - sourceHeight) * 0.5;
      }

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        x,
        y,
        width,
        height
      );
    }

    function drawTrimmedImageContain(
      image,
      x,
      y,
      width,
      height,
      anchorX = 0.5,
      anchorY = 1
    ) {
      const source = getVisibleImageBounds(image);
      const scale = Math.min(width / source.width, height / source.height);
      const drawWidth = source.width * scale;
      const drawHeight = source.height * scale;
      const drawX = x + (width - drawWidth) * anchorX;
      const drawY = y + (height - drawHeight) * anchorY;

      ctx.drawImage(
        image,
        source.x,
        source.y,
        source.width,
        source.height,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
    }

    function wrapCravingSpeech(textValue, maxChars = 20) {
      const words = String(textValue).split(/\s+/);
      const lines = [];
      let line = "";

      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (next.length > maxChars && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }

      if (line) lines.push(line);
      return lines;
    }

    function drawCravingSpeechBubble(
      textValue,
      x,
      y,
      maxWidth,
      tailX,
      tailY,
      speaker
    ) {
      const lines = wrapCravingSpeech(textValue, speaker === "bill" ? 22 : 20);
      const fontSize = Math.max(14, Math.round(getWidth() * 0.037));
      const lineHeight = fontSize + 5;
      const paddingX = 13;
      const paddingY = 11;
      const bubbleWidth = Math.min(
        maxWidth,
        Math.max(
          110,
          ...lines.map((line) => {
            ctx.font = `900 ${fontSize}px monospace`;
            return ctx.measureText(line).width + paddingX * 2;
          })
        )
      );
      const bubbleHeight = paddingY * 2 + lineHeight * lines.length;

      ctx.save();

      // Tail. The doctor's mirage uses a short pointer instead of the
      // longer character-to-bubble connector used by normal conversation.
      const effectiveTailY =
        speaker === "doctor"
          ? y + bubbleHeight + Math.max(8, getHeight() * 0.010)
          : tailY;

      ctx.beginPath();
      ctx.moveTo(tailX, effectiveTailY);
      ctx.lineTo(x + bubbleWidth * 0.46, y + bubbleHeight);
      ctx.lineTo(x + bubbleWidth * 0.62, y + bubbleHeight);
      ctx.closePath();
      ctx.fillStyle = "#f7f0dc";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#17120d";
      ctx.stroke();

      // Bubble
      const radius = 14;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + bubbleWidth - radius, y);
      ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + radius);
      ctx.lineTo(x + bubbleWidth, y + bubbleHeight - radius);
      ctx.quadraticCurveTo(
        x + bubbleWidth,
        y + bubbleHeight,
        x + bubbleWidth - radius,
        y + bubbleHeight
      );
      ctx.lineTo(x + radius, y + bubbleHeight);
      ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = "#f7f0dc";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#17120d";
      ctx.stroke();

      ctx.font = `900 ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#21170e";

      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          x + bubbleWidth / 2,
          y + paddingY + lineHeight * index + lineHeight / 2
        );
      });

      ctx.restore();
    }

    function drawCravingDoctorMirage(now, bar) {
      if (cravingDoctorMirageStartedAt <= 0) return;

      const elapsed = now - cravingDoctorMirageStartedAt;
      const duration = cravingDoctorMirageDuration;

      if (elapsed >= duration) {
        cravingDoctorMirageStartedAt = 0;
        return;
      }

      const fadeInDuration = 1000;
      const fadeOutDuration = 1250;
      let alpha = 1;

      if (elapsed < fadeInDuration) {
        alpha = elapsed / fadeInDuration;
      } else if (elapsed > duration - fadeOutDuration) {
        alpha = Math.max(
          0,
          (duration - elapsed) / fadeOutDuration
        );
      }

      const width = getWidth();
      const height = getHeight();
      const shimmerX = Math.sin(now / 110) * 2;

      // Center Dr. Silkworth cleanly between Bill and the bartender.
      const doctorX = width * 0.515 + shimmerX;
      const doctorGroundY = bar.barTop + height * 0.025;
      const doctorHeight = height * 0.285;

      const doctorLoaded =
        chapter3DoctorImage.complete &&
        chapter3DoctorImage.naturalWidth > 0 &&
        chapter3DoctorImage.naturalHeight > 0;

      if (doctorLoaded) {
        const doctorWidth =
          doctorHeight *
          (
            chapter3DoctorImage.naturalWidth /
            chapter3DoctorImage.naturalHeight
          );

        ctx.save();
        ctx.globalAlpha = alpha * 0.94;
        ctx.imageSmoothingEnabled = false;

        // Very light mirage glow behind him.
        ctx.fillStyle = "rgba(238, 244, 224, 0.10)";
        ctx.beginPath();
        ctx.ellipse(
          doctorX,
          doctorGroundY - doctorHeight * 0.48,
          doctorWidth * 0.58,
          doctorHeight * 0.56,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.drawImage(
          chapter3DoctorImage,
          doctorX - doctorWidth / 2,
          doctorGroundY - doctorHeight,
          doctorWidth,
          doctorHeight
        );
        ctx.restore();
      }

      // Draw this in normal canvas coordinates. The old version accidentally
      // left a translated canvas active, which shoved the bubble down/right.
      const bubbleY = height * 0.205;

      ctx.save();
      ctx.globalAlpha = alpha;
      drawCravingSpeechBubble(
        "THE MORE THEY DRINK THE THIRSTIER THEY GET",
        width * 0.13,
        bubbleY,
        width * 0.74,
        doctorX,
        bubbleY + height * 0.115,
        "doctor"
      );
      ctx.restore();
    }

    function drawCravingConversation(now, bar) {
      if (
        doctorPhase !== "craving" ||
        cravingConversation.length === 0 ||
        cravingConversationNextAt <= 0
      ) {
        return;
      }

      if (now >= cravingConversationNextAt) {
        cravingConversationIndex =
          (cravingConversationIndex + 1) % cravingConversation.length;
        cravingConversationNextAt = now + 2600;

        // The bartender's tornado-shot offer is immediately followed by an
        // actual shot glass sliding down the bar when Bill agrees.
        if (cravingConversationIndex === 3) {
          spawnCravingShot(now + 120);
        }
      }

      const line = cravingConversation[cravingConversationIndex];
      const width = getWidth();
      const height = getHeight();

      if (line.speaker === "bartender") {
        drawCravingSpeechBubble(
          line.text,
          width * 0.49,
          height * 0.19,
          width * 0.47,
          width * 0.72,
          height * 0.39,
          "bartender"
        );
      } else {
        drawCravingSpeechBubble(
          line.text,
          width * 0.03,
          height * 0.17,
          width * 0.49,
          width * 0.30,
          height * 0.40,
          "bill"
        );
      }
    }

    function drawCravingBarScene(now) {
      const width = getWidth();
      const height = getHeight();
      const bar = getCravingBarLayout();
      const round = cravingRounds[Math.max(0, cravingRoundIndex)];

      const imageReady = image =>
        image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Layer 1: complete tavern back wall.
      if (imageReady(chapter3BarBackgroundImage)) {
        // Preserve the landscape artwork and crop its sides for portrait play.
        drawImageCover(chapter3BarBackgroundImage, 0, 0, width, height);
      } else {
        const wall = ctx.createLinearGradient(0, 0, 0, height);
        wall.addColorStop(0, "#171116");
        wall.addColorStop(1, "#40271c");
        ctx.fillStyle = wall;
        ctx.fillRect(0, 0, width, height);
      }

      // Layer 2: bartender on the right. The smirk PNG appears briefly
      // whenever he sends another drink.
      const activeBartenderImage =
        now < cravingBartenderSmileUntil &&
        imageReady(chapter3BartenderSmileImage)
          ? chapter3BartenderSmileImage
          : chapter3BartenderImage;

      if (imageReady(activeBartenderImage)) {
        ctx.save();
        ctx.translate(bar.bartenderX + bar.bartenderWidth, 0);
        ctx.scale(-1, 1);
        // Keep the bartender's original aspect ratio while anchoring both
        // expression sprites to the exact same center and bottom position.
        const bartenderAspect =
          activeBartenderImage.naturalWidth /
          activeBartenderImage.naturalHeight;

        let bartenderDrawWidth = bar.bartenderWidth;
        let bartenderDrawHeight =
          bartenderDrawWidth / bartenderAspect;

        if (bartenderDrawHeight > bar.bartenderHeight) {
          bartenderDrawHeight = bar.bartenderHeight;
          bartenderDrawWidth =
            bartenderDrawHeight * bartenderAspect;
        }

        const bartenderDrawX =
          (bar.bartenderWidth - bartenderDrawWidth) / 2;
        const bartenderDrawY =
          bar.bartenderY +
          bar.bartenderHeight -
          bartenderDrawHeight;

        ctx.drawImage(
          activeBartenderImage,
          bartenderDrawX,
          bartenderDrawY,
          bartenderDrawWidth,
          bartenderDrawHeight
        );
        ctx.restore();
      }

      // Repaint only the bartender's lower hand area above the foreground
      // bar later. This lets his torso remain behind the bar while his hands
      // visibly rest on its top.

      // Layer 3: Bill on the left. His condition subtly worsens as drinks add up.
      if (imageReady(chapter3BillAtBarImage)) {
        ctx.save();
        const wearDrop = cravingBillWear * height * 0.018;
        const wearTilt = cravingBillWear * 0.018;
        ctx.globalAlpha = Math.max(0.88, 1 - cravingBillWear * 0.08);
        const escapeShift = getCravingBillShift();
        ctx.translate(
          bar.billX + bar.billWidth * 0.50 + escapeShift,
          bar.billY + bar.billHeight * 0.50 + wearDrop
        );
        ctx.rotate(wearTilt);
        drawTrimmedImageContain(
          chapter3BillAtBarImage,
          -bar.billWidth * 0.50,
          -bar.billHeight * 0.50,
          bar.billWidth,
          bar.billHeight,
          0.5,
          1
        );
        ctx.restore();
      }

      // At $100 spent, the doctor briefly appears between Bill and the
      // bartender like a mirage, delivers his warning, then fades away.
      drawCravingDoctorMirage(now, bar);

      // Layer 4: foreground bar. This hides the lower edges of both sprites.
      if (imageReady(chapter3BarImage)) {
        drawTrimmedImageContain(
          chapter3BarImage,
          0,
          bar.barTop,
          width,
          bar.barBottom - bar.barTop,
          0.5,
          0
        );
      } else {
        ctx.fillStyle = "#6d351f";
        ctx.fillRect(0, bar.barTop, width, height - bar.barTop);
        ctx.fillStyle = "#b66b32";
        ctx.fillRect(0, bar.barTop, width, 14);
      }

      // Layer 5: bartender hands on top of the bar. The same sprite is
      // clipped to a narrow countertop band, so only the hands/forearms are
      // repainted in front.
      if (imageReady(activeBartenderImage)) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          bar.bartenderX,
          bar.barTop - height * 0.035,
          bar.bartenderWidth,
          height * 0.115
        );
        ctx.clip();
        ctx.translate(bar.bartenderX + bar.bartenderWidth, 0);
        ctx.scale(-1, 1);
        // Keep the bartender's original aspect ratio while anchoring both
        // expression sprites to the exact same center and bottom position.
        const bartenderAspect =
          activeBartenderImage.naturalWidth /
          activeBartenderImage.naturalHeight;

        let bartenderDrawWidth = bar.bartenderWidth;
        let bartenderDrawHeight =
          bartenderDrawWidth / bartenderAspect;

        if (bartenderDrawHeight > bar.bartenderHeight) {
          bartenderDrawHeight = bar.bartenderHeight;
          bartenderDrawWidth =
            bartenderDrawHeight * bartenderAspect;
        }

        const bartenderDrawX =
          (bar.bartenderWidth - bartenderDrawWidth) / 2;
        const bartenderDrawY =
          bar.bartenderY +
          bar.bartenderHeight -
          bartenderDrawHeight;

        ctx.drawImage(
          activeBartenderImage,
          bartenderDrawX,
          bartenderDrawY,
          bartenderDrawWidth,
          bartenderDrawHeight
        );
        ctx.restore();
      }

      // Brief motion streaks make each new beer look deliberately shot from
      // the bartender's hands rather than simply spawned on the counter.
      if (now >= cravingShotFlashUntil) {
        cravingShotSpeedLabel = "";
      }

      if (now < cravingShotFlashUntil) {
        const life = Math.max(
          0,
          Math.min(1, (cravingShotFlashUntil - now) / 240)
        );
        ctx.save();
        ctx.globalAlpha = life;
        ctx.strokeStyle = "#fff0a3";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        for (let streak = 0; streak < 3; streak += 1) {
          const yOffset = (streak - 1) * 7;
          ctx.beginPath();
          ctx.moveTo(cravingShotStartX + 20, cravingShotStartY + yOffset);
          ctx.lineTo(
            cravingShotStartX + 58 + (1 - life) * 26,
            cravingShotStartY + yOffset
          );
          ctx.stroke();
        }

        if (cravingShotSpeedLabel) {
          ctx.font = "900 17px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#000000";
          ctx.fillStyle = "#ffe46b";
          ctx.strokeText(
            cravingShotSpeedLabel,
            cravingShotStartX - 4,
            cravingShotStartY - 43
          );
          ctx.fillText(
            cravingShotSpeedLabel,
            cravingShotStartX - 4,
            cravingShotStartY - 43
          );
        }
        ctx.restore();
      }

      // Layer 6: a varied mix of drinks travels in a straight line.
      for (const item of cravingObjects) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${Math.floor(item.size)}px serif`;
        ctx.fillText(item.label || "🍺", item.x, item.y);
      }

      if (now < cravingSplitFlashUntil) {
        const life = (cravingSplitFlashUntil - now) / 520;
        ctx.save();
        ctx.translate(cravingSplitX, cravingSplitY);
        ctx.globalAlpha = Math.max(0, life);
        ctx.strokeStyle = "#fff2a8";
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i += 1) {
          const a = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
          ctx.lineTo(
            Math.cos(a) * (42 + (1 - life) * 22),
            Math.sin(a) * (42 + (1 - life) * 22)
          );
          ctx.stroke();
        }
        ctx.font = "900 28px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("×2", 0, -48);
        ctx.restore();
      }

      ctx.restore();

      // Floating arcade score for every drink.
      for (const score of cravingFloatingScores) {
        const progress = Math.min(1, (now - score.startedAt) / 950);
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(score.x, score.y - progress * 62);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(25, width * 0.062)}px monospace`;
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#ffe46b";
        ctx.strokeText("+1", 0, 0);
        ctx.fillText("+1", 0, 0);
        ctx.restore();
      }

      // Money leaves with every drink and disappears into the air.
      for (const money of cravingMoneyFloats) {
        const progress = Math.min(1, (now - money.startedAt) / 1200);
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(
          money.x - progress * width * 0.08,
          money.y - progress * height * 0.12
        );
        ctx.rotate(-0.18 + progress * 0.35);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(22, width * 0.052)}px monospace`;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#7dff83";
        ctx.strokeText(`-$${money.amount}`, 0, 0);
        ctx.fillText(`-$${money.amount}`, 0, 0);
        ctx.restore();
      }

      // Top scoreboard.
      const hudX = width * 0.055;
      const hudY = height * 0.025;
      const hudW = width * 0.89;
      const hudH = height * 0.085;
      ctx.save();
      ctx.fillStyle = "rgba(13, 8, 5, 0.91)";
      ctx.strokeStyle = "#d6a448";
      ctx.lineWidth = 4;
      ctx.fillRect(hudX, hudY, hudW, hudH);
      ctx.strokeRect(hudX, hudY, hudW, hudH);
      ctx.strokeStyle = "#5f371c";
      ctx.lineWidth = 2;
      ctx.strokeRect(hudX + 6, hudY + 6, hudW - 12, hudH - 12);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff2a8";

      ctx.font = `900 ${Math.max(13, width * 0.030)}px monospace`;
      ctx.fillText(
        "JUST ONE TURNED INTO",
        hudX + hudW * 0.31,
        hudY + hudH * 0.34,
        hudW * 0.56
      );
      ctx.font = `900 ${Math.max(19, width * 0.050)}px monospace`;
      ctx.fillText(
        String(cravingCollected),
        hudX + hudW * 0.31,
        hudY + hudH * 0.69
      );

      ctx.strokeStyle = "#5f371c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hudX + hudW * 0.61, hudY + 10);
      ctx.lineTo(hudX + hudW * 0.61, hudY + hudH - 10);
      ctx.stroke();

      ctx.font = `900 ${Math.max(12, width * 0.028)}px monospace`;
      ctx.fillText(
        "MONEY SPENT",
        hudX + hudW * 0.80,
        hudY + hudH * 0.34,
        hudW * 0.34
      );
      ctx.font = `900 ${Math.max(18, width * 0.046)}px monospace`;
      ctx.fillText(
        `$${cravingMoneySpent}`,
        hudX + hudW * 0.80,
        hudY + hudH * 0.69
      );
      ctx.restore();

      // Tug-of-war meter: Bill is pulled toward the bar unless GO HOME is
      // mashed repeatedly.
      const meterX = width * 0.08;
      const meterY = height * 0.765;
      const meterW = width * 0.84;
      const meterH = height * 0.042;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = `900 ${Math.max(13, width * 0.030)}px monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";
      ctx.strokeText("GET BILL TO THE DOOR", width / 2, meterY - 7);
      ctx.fillText("GET BILL TO THE DOOR", width / 2, meterY - 7);

      ctx.fillStyle = "rgba(0,0,0,0.86)";
      ctx.fillRect(meterX, meterY, meterW, meterH);
      ctx.strokeStyle = "#f1cf79";
      ctx.lineWidth = 3;
      ctx.strokeRect(meterX, meterY, meterW, meterH);

      ctx.fillStyle = "#d6a448";
      const escapeFill = Math.max(0, (meterW - 8) * cravingEscapeProgress);
      ctx.fillRect(
        meterX + meterW - 4 - escapeFill,
        meterY + 4,
        escapeFill,
        meterH - 8
      );

      ctx.font = `900 ${Math.max(15, width * 0.034)}px monospace`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("DOOR", meterX + 36, meterY + meterH / 2);
      ctx.fillText("BAR", meterX + meterW - 27, meterY + meterH / 2);
      ctx.restore();

      cravingGoHomeButton = {
        x: width * 0.09,
        y: height * 0.855,
        width: width * 0.82,
        height: height * 0.085
      };

      function drawCravingChoiceButton(button, label, fill) {
        ctx.save();
        ctx.fillStyle = fill;
        ctx.strokeStyle = "#f1cf79";
        ctx.lineWidth = 4;
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.strokeRect(button.x, button.y, button.width, button.height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(17, width * 0.040)}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          label,
          button.x + button.width / 2,
          button.y + button.height / 2,
          button.width - 16
        );
        ctx.restore();
      }

      const goHomeLabel =
        cravingMoneySpent >= 100
          ? `GO HOME  ${cravingPostHundredMashCount}/${cravingPostHundredMashGoal}`
          : "GO HOME";

      drawCravingChoiceButton(
        cravingGoHomeButton,
        goHomeLabel,
        "#285f3a"
      );

    }

    function drawDoctorsOpinionGame(now) {
      const width = getWidth();
      const height = getHeight();
      ctx.fillStyle = "#11131a";
      ctx.fillRect(0, 0, width, height);

      if (
        doctorPhase === "obsession" ||
        doctorPhase === "temporaryRelief" ||
        doctorPhase === "relief"
      ) {
        const layout = getDoctorLayout();
        const peaceful =
          doctorPhase === "relief" || doctorPhase === "temporaryRelief";
        const shaking = now < doctorShakeUntil;
        const shakeX = shaking ? (Math.random() - 0.5) * doctorShakeStrength * 2 : 0;
        const shakeY = shaking ? (Math.random() - 0.5) * doctorShakeStrength * 2 : 0;
        ctx.save();
        ctx.translate(shakeX, shakeY);
        drawStormEnvironment(layout, now, peaceful);

        for (const thought of doctorThoughts) {
          drawThoughtBubble(thought);
        }

        drawShatteredThought(doctorShatteredThought, now);

        const fighting =
          (doctorPhase === "obsession" || doctorPhase === "temporaryRelief") &&
          now < doctorFightUntil &&
          doctorFightEnergy > 0;
        const billCenterX = layout.playWidth * 0.52;
        const billGroundY = layout.sceneBottom - 8 - (fighting ? 28 : 0);

        drawPixelBill(billCenterX, billGroundY, peaceful);

        if (now < doctorImpactUntil) {
          const impactLife = Math.max(
            0,
            Math.min(1, (doctorImpactUntil - now) / 220)
          );

          ctx.save();
          ctx.globalAlpha = impactLife;
          ctx.strokeStyle = "#fff0aa";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            doctorImpactX,
            doctorImpactY,
            8 + (1 - impactLife) * 13,
            0,
            Math.PI * 2
          );
          ctx.stroke();

          ctx.strokeStyle = "#c7a55c";
          ctx.lineWidth = 2;
          for (let ray = 0; ray < 6; ray += 1) {
            const angle = (Math.PI * 2 * ray) / 6;
            const inner = 10;
            const outer = 17 + (1 - impactLife) * 9;
            ctx.beginPath();
            ctx.moveTo(
              doctorImpactX + Math.cos(angle) * inner,
              doctorImpactY + Math.sin(angle) * inner
            );
            ctx.lineTo(
              doctorImpactX + Math.cos(angle) * outer,
              doctorImpactY + Math.sin(angle) * outer
            );
            ctx.stroke();
          }
          ctx.restore();
        }

        drawBillRubble(
          billCenterX,
          layout.sceneBottom - 13,
          peaceful ? 0 : Math.min(doctorBurial, 92)
        );

        // Full-width, clipped-corner chapter title.
        drawBeveledWindow(ctx, {
          x: layout.outerMargin,
          y: layout.titleY,
          width: width - layout.outerMargin * 2,
          height: layout.titleHeight,
          fill: "#07151a",
          border: "#a87321",
          highlight: "#e2bd69",
          innerBorder: "#2a1a08",
          shadowOffset: 7,
          cut: 13,
          inset: 8
        });

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(22, Math.min(34, width * 0.035))}px monospace`;
        ctx.fillStyle = "#d9cbb0";
        ctx.fillText(
          "DOCTOR'S OPINION: THE OBSESSION",
          width / 2,
          layout.titleY + layout.titleHeight / 2 + 1,
          width - 90
        );

        // The top meter represents Bill's remaining willpower.
        // It drains backward as the Fight option wears out and reaches
        // empty exactly when Fight is exhausted.
        const willpowerProgress = Math.max(
          0,
          Math.min(1, doctorFightEnergy / 100)
        );

        const willpowerLabelWidth = Math.max(
          108,
          Math.min(150, width * 0.17)
        );
        const willpowerGap = 8;
        const willpowerMeterX =
          layout.outerMargin + willpowerLabelWidth + willpowerGap;
        const willpowerMeterWidth =
          width -
          layout.outerMargin * 2 -
          willpowerLabelWidth -
          willpowerGap;

        drawBeveledWindow(ctx, {
          x: layout.outerMargin,
          y: layout.progressY,
          width: willpowerLabelWidth,
          height: layout.progressHeight,
          fill: "#07151a",
          border: "#8d6527",
          highlight: "#d7b55f",
          innerBorder: "#25190c",
          shadowOffset: 3,
          cut: 8,
          inset: 5
        });

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(
          13,
          Math.min(20, layout.progressHeight * 0.44)
        )}px monospace`;
        ctx.fillStyle =
          doctorFightEnergy > 35
            ? "#efbd38"
            : doctorFightEnergy > 0
              ? "#d77b42"
              : "#8a8580";
        ctx.fillText(
          "WILLPOWER",
          layout.outerMargin + willpowerLabelWidth / 2,
          layout.progressY + layout.progressHeight / 2 + 1,
          willpowerLabelWidth - 14
        );

        drawSegmentedMeter(ctx, {
          x: willpowerMeterX,
          y: layout.progressY,
          width: willpowerMeterWidth,
          height: layout.progressHeight,
          progress: willpowerProgress,
          segments: 20,
          fill:
            doctorFightEnergy > 35
              ? "#c42b22"
              : doctorFightEnergy > 0
                ? "#9b4c35"
                : "#55504d",
          empty: "#071016",
          border: "#8d6527",
          highlight:
            doctorFightEnergy > 35
              ? "#ff7866"
              : doctorFightEnergy > 0
                ? "#c98570"
                : "#77716d"
        });

        // Right-side carved response column.
        drawBeveledWindow(ctx, {
          x: layout.panelX,
          y: layout.contentTop,
          width: layout.panelWidth,
          height: layout.panelHeight,
          fill: "#071016",
          border: "#7f5a22",
          highlight: "#d1aa58",
          innerBorder: "#271b0d",
          shadowOffset: 7,
          cut: 13,
          inset: 8
        });

        drawBeveledWindow(ctx, {
          x: layout.panelX + 8,
          y: layout.contentTop + 8,
          width: layout.panelWidth - 16,
          height: layout.menuHeaderHeight - 10,
          fill: "#102347",
          border: "#496da2",
          highlight: "#abc8ef",
          innerBorder: "#11182a",
          shadowOffset: 3,
          cut: 10,
          inset: 6
        });

        ctx.font = `900 ${Math.max(13, Math.min(19, layout.panelWidth * 0.058))}px monospace`;
        ctx.fillStyle = "#9fc2f1";
        ctx.fillText(
          "CHOOSE YOUR RESPONSE",
          layout.panelX + layout.panelWidth / 2,
          layout.contentTop + layout.menuHeaderHeight / 2 + 2,
          layout.panelWidth - 34
        );

        const buttonThemes = {
          drink: ["#8c5900", "#d99800", "#fff091", "#ffdf42"],
          meeting: ["#10274a", "#315d9b", "#8ab4ee", "#9ec4f6"],
          sponsor: ["#143b17", "#3b743e", "#99d57b", "#9dde7f"],
          asylum: ["#3b2043", "#81508d", "#d5a6e2", "#d7a7e9"],
          busy: ["#4c2603", "#a95a05", "#f4a63a", "#f2a33c"],
          isolate: ["#0c3437", "#3b7a7f", "#91cbd0", "#8bc8cb"],
          fight: ["#73130d", "#d22e20", "#ff7863", "#ff634f"]
        };

        function drawCodeIcon(id, x, y, size, disabled) {
          const scale = size / 32;
          ctx.save();
          ctx.translate(Math.round(x), Math.round(y));
          ctx.scale(scale, scale);
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = disabled ? 0.48 : 1;

          if (id === "drink") {
            ctx.fillStyle = "#f3a400";
            ctx.fillRect(7, 8, 17, 20);
            ctx.fillStyle = "#ffd75b";
            ctx.fillRect(9, 10, 4, 16);
            ctx.fillStyle = "#fff4d2";
            ctx.fillRect(5, 4, 19, 7);
            ctx.fillRect(9, 1, 12, 5);
            ctx.strokeStyle = "#7b3900";
            ctx.lineWidth = 3;
            ctx.strokeRect(7, 8, 17, 20);
            ctx.strokeRect(23, 12, 7, 11);
          } else if (id === "meeting") {
            ctx.fillStyle = "#3f78d5";
            ctx.fillRect(3, 17, 12, 11);
            ctx.fillRect(17, 17, 12, 11);
            ctx.fillRect(6, 6, 8, 9);
            ctx.fillRect(19, 6, 8, 9);
            ctx.fillStyle = "#78a7ef";
            ctx.fillRect(8, 7, 3, 4);
            ctx.fillRect(21, 7, 3, 4);
          } else if (id === "sponsor") {
            ctx.fillStyle = "#4d8c37";
            ctx.fillRect(5, 10, 22, 17);
            ctx.fillRect(2, 6, 28, 7);
            ctx.fillStyle = "#9ad77e";
            ctx.fillRect(10, 15, 12, 8);
            ctx.fillStyle = "#173316";
            ctx.fillRect(14, 16, 4, 4);
          } else if (id === "asylum") {
            ctx.fillStyle = "#d2c3d9";
            ctx.fillRect(5, 11, 23, 17);
            ctx.fillRect(10, 6, 13, 7);
            ctx.fillStyle = "#6f4c79";
            ctx.fillRect(14, 2, 4, 10);
            ctx.fillRect(11, 5, 10, 4);
            ctx.fillStyle = "#60416a";
            for (let ix = 8; ix < 26; ix += 6) ctx.fillRect(ix, 16, 3, 6);
          } else if (id === "busy") {
            ctx.fillStyle = "#ef8a16";
            ctx.fillRect(14, 4, 6, 7);
            ctx.fillRect(11, 11, 9, 10);
            ctx.fillRect(6, 17, 9, 5);
            ctx.fillRect(18, 17, 10, 5);
            ctx.fillRect(8, 22, 5, 8);
            ctx.fillRect(22, 21, 5, 9);
          } else if (id === "isolate") {
            ctx.fillStyle = "#60676d";
            ctx.fillRect(10, 4, 10, 10);
            ctx.fillRect(7, 14, 15, 12);
            ctx.fillRect(4, 22, 9, 7);
            ctx.fillStyle = "#9ea6aa";
            ctx.fillRect(12, 6, 4, 4);
          } else {
            ctx.fillStyle = "#e8aa16";
            ctx.fillRect(8, 8, 6, 15);
            ctx.fillRect(14, 4, 5, 18);
            ctx.fillRect(19, 7, 5, 16);
            ctx.fillRect(24, 11, 4, 12);
            ctx.fillRect(10, 21, 16, 8);
            ctx.fillStyle = "#fff06e";
            ctx.fillRect(10, 9, 2, 8);
          }

          ctx.restore();
        }

        for (const item of layout.buttons) {
          const disabled =
            item.button.id !== "drink" &&
            item.button.id !== "fight" &&
            doctorDisabledButtons[item.button.id];
          const fightEmpty =
            item.button.id === "fight" && doctorFightEnergy <= 0;
          const allOtherOptionsUsed =
            doctorOptionUsed.meeting &&
            doctorOptionUsed.sponsor &&
            doctorOptionUsed.asylum &&
            doctorOptionUsed.busy &&
            doctorOptionUsed.isolate;
          const drinkLocked = false;
          const inactive = disabled || fightEmpty;
          const finalDrink =
            item.button.id === "drink" &&
            allOtherOptionsUsed &&
            doctorFightEnergy <= 0;

          // Drink temptation grows in direct proportion to lost Fight energy.
          // At full Fight it is still. As Fight drains, the pulse becomes
          // brighter, deeper, and faster. At zero it flashes urgently.
          const fightDepletion = Math.max(
            0,
            Math.min(1, 1 - doctorFightEnergy / 100)
          );
          const drinkPulseSpeed =
            0.0022 + fightDepletion * 0.0105;
          const drinkPulseWave =
            (Math.sin(now * drinkPulseSpeed) + 1) / 2;
          const drinkPulseStrength =
            item.button.id === "drink" &&
            doctorPhase !== "relief"
              ? fightDepletion *
                (0.22 + drinkPulseWave * 0.78)
              : 0;
          const blink =
            item.button.id === "drink" &&
            drinkPulseStrength > 0.04;
          const pressed =
            item.button.id === "fight" &&
            now < doctorFightPressedUntil;
          const fightMashPulse =
            item.button.id === "fight"
              ? Math.min(1, doctorFightMashCount / 7)
              : 0;
          const inset = pressed ? 4 : 0;
          const pulseGrow =
            item.button.id === "fight" && !pressed
              ? fightMashPulse * 2
              : item.button.id === "drink"
                ? drinkPulseStrength * 2.6
                : 0;
          const bx = item.x + inset - pulseGrow;
          const by = item.y + inset - pulseGrow;
          const bw =
            item.width - inset * 2 + pulseGrow * 2;
          const bh =
            item.height - inset * 2 + pulseGrow * 2;
          let [fill, border, highlight, textColor] = buttonThemes[item.button.id];

          if (item.button.id === "drink" && blink) {
            const strength = drinkPulseStrength;
            const fillR = Math.round(59 + 108 * strength);
            const fillG = Math.round(44 + 66 * strength);
            const fillB = Math.round(11 - 6 * strength);
            const borderR = Math.round(111 + 144 * strength);
            const borderG = Math.round(86 + 110 * strength);
            const borderB = Math.round(28 - 15 * strength);

            fill = `rgb(${fillR}, ${fillG}, ${fillB})`;
            border = `rgb(${borderR}, ${borderG}, ${borderB})`;
            highlight =
              strength > 0.72 ? "#fff5ab" : "#c7a657";
            textColor =
              strength > 0.58 ? "#fff4bd" : "#d8c57e";
          }

          if (item.button.id === "fight" && !fightEmpty) {
            const fightFade = doctorFightEnergy / 100;
            const red = Math.round(62 + 70 * fightFade);
            const green = Math.round(49 - 29 * fightFade);
            const blue = Math.round(47 - 31 * fightFade);
            fill = `rgb(${red}, ${green}, ${blue})`;
            border =
              doctorFightEnergy > 35 ? "#d22e20" : "#70645f";
            highlight =
              doctorFightEnergy > 35 ? "#ff7863" : "#9a918d";
            textColor =
              doctorFightEnergy > 20 ? "#ff634f" : "#aaa29e";
          }

          if (drinkLocked && drinkPulseStrength <= 0.04) {
            fill = "#3b2c0b";
            border = "#6f561c";
            highlight = "#9b7d37";
            textColor = "#8f792f";
          } else if (inactive) {
            fill = "#101417";
            border = "#4f555a";
            highlight = "#777d82";
            textColor = "#747a7e";
          }

          drawBeveledWindow(ctx, {
            x: bx,
            y: by,
            width: bw,
            height: bh,
            fill,
            border,
            highlight,
            innerBorder: inactive ? "#1d2225" : "#27190a",
            shadowOffset: pressed ? 2 : 5,
            cut: Math.max(9, Math.round(bh * 0.12)),
            inset: 7
          });

          const iconSize = Math.min(bh * 0.48, bw * 0.18);
          const iconX = bx + 17;
          const iconY = by + bh * 0.20;

          drawCodeIcon(
            item.button.id,
            iconX,
            iconY,
            iconSize,
            inactive
          );

          const textX = bx + bw * 0.62;
          const isDrink = item.button.id === "drink";
          const isFight = item.button.id === "fight";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = Math.max(4, Math.round(bh * 0.055));
          ctx.strokeStyle = "#1b0803";
          ctx.fillStyle = textColor;

          const labelLines =
            item.button.id === "drink"
              ? ["HAVE", "JUST ONE"]
              : item.button.id === "meeting"
                ? ["GO TO", "A MEETING"]
                : item.button.id === "sponsor"
                  ? ["CALL A", "SPONSOR"]
                  : item.button.id === "asylum"
                    ? ["GO TO", "AN ASYLUM"]
                    : [item.button.label];

          const mainFont = isDrink
            ? Math.max(19, Math.min(29, bh * 0.265))
            : isFight
              ? Math.max(24, Math.min(36, bh * 0.30))
              : Math.max(15, Math.min(24, bh * 0.225));

          ctx.font = `900 ${mainFont}px monospace`;

          if (labelLines.length === 2) {
            const firstY = by + bh * 0.38;
            const secondY = by + bh * 0.65;
            for (const [index, line] of labelLines.entries()) {
              const ty = index === 0 ? firstY : secondY;
              ctx.strokeText(line, textX, ty, bw * 0.63);
              ctx.fillText(line, textX, ty, bw * 0.63);
            }
          } else {
            const ty = by + bh * (inactive ? 0.39 : 0.47);
            ctx.strokeText(labelLines[0], textX, ty, bw * 0.63);
            ctx.fillText(labelLines[0], textX, ty, bw * 0.63);
          }

          if (item.button.id === "busy" && !inactive) {
            ctx.font = `900 ${Math.max(11, bh * 0.16)}px monospace`;
            ctx.fillStyle = "#85d53e";
            ctx.fillText("AVAILABLE", bx + bw * 0.63, by + bh * 0.78);
          }

        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Permanent instruction bar.
        drawBeveledWindow(ctx, {
          x: layout.playX,
          y: layout.instructionY,
          width: layout.playWidth,
          height: layout.instructionHeight,
          fill: "#07171a",
          border: "#8d6527",
          highlight: "#d7b65f",
          innerBorder: "#25190c",
          shadowOffset: 5,
          cut: 10,
          inset: 7
        });

        ctx.font = `900 ${Math.max(19, Math.min(29, layout.playWidth * 0.043))}px monospace`;
        ctx.fillStyle = "#efbd38";
        ctx.fillText(
          doctorFightEnergy > 0
            ? "USE WILLPOWER TO STAY SOBER."
            : "ONLY ONE OPTION REMAINS.",
          layout.playX + layout.playWidth / 2,
          layout.instructionY + layout.instructionHeight / 2,
          layout.playWidth - 46
        );

        // Bottom chapter footer.
        drawBeveledWindow(ctx, {
          x: layout.outerMargin,
          y: layout.footerY,
          width: width - layout.outerMargin * 2,
          height: layout.footerHeight,
          fill: "#07151a",
          border: "#8d6527",
          highlight: "#d7b55f",
          innerBorder: "#25190c",
          shadowOffset: 5,
          cut: 10,
          inset: 7
        });

        const footerFont = Math.max(13, layout.footerHeight * 0.27);
        ctx.font = `900 ${footerFont}px monospace`;
        ctx.textBaseline = "middle";

        ctx.textAlign = "left";
        ctx.fillStyle = "#a68adf";
        ctx.fillText(
          "CHAPTER 3",
          layout.outerMargin + 24,
          layout.footerY + layout.footerHeight / 2 + 1,
          width * 0.24
        );

        ctx.textAlign = "center";
        ctx.fillStyle = "#dca72f";
        ctx.fillText(
          "DOCTOR'S OPINION",
          width * 0.53,
          layout.footerY + layout.footerHeight / 2 + 1,
          width * 0.34
        );

        ctx.textAlign = "right";
        ctx.fillStyle = "#6cb6e4";
        const seconds = Math.max(
          0,
          Math.floor((now - doctorObsessionStartedAt) / 1000)
        );
        ctx.fillText(
          `00:${String(seconds).padStart(2, "0")}`,
          width - layout.outerMargin - 24,
          layout.footerY + layout.footerHeight / 2 + 1,
          width * 0.16
        );

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.restore();

        // Draw notifications only after restoring the scene transform so
        // every message can use the full screen width.
        if (
          doctorMessageLarge &&
          (now < doctorMessageUntil || doctorMessageAwaitingTap)
        ) {
          drawLargeDoctorMessage(
            doctorMessage,
            ctx.canvas.width,
            ctx.canvas.height
          );
        } else if (
          doctorMessage &&
          now < doctorMessageUntil
        ) {
          drawWideDoctorNotification(
            doctorMessage,
            ctx.canvas.width,
            ctx.canvas.height
          );
        }

        return;
      }

      if (doctorPhase === "complete") {
        return;
      }

      if (doctorPhase === "cravingEnd") {
        const elapsed = Math.max(0, now - cravingEndAt);
        const cardAlpha = Math.min(1, elapsed / 650);

        ctx.save();
        ctx.globalAlpha = cardAlpha;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = `900 ${Math.max(30, width * 0.060)}px monospace`;
        ctx.fillStyle = "#ffe56b";
        ctx.fillText(
          "YOU DID IT THIS TIME!",
          width / 2,
          height * 0.30,
          width * 0.92
        );

        ctx.font = `900 ${Math.max(19, width * 0.038)}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          `ONE TURNED INTO ${cravingCollected}`,
          width / 2,
          height * 0.49,
          width * 0.90
        );
        ctx.fillText(
          `AND YOU SPENT $${cravingMoneySpent}`,
          width / 2,
          height * 0.59,
          width * 0.90
        );

        ctx.font = `900 ${Math.max(16, width * 0.030)}px monospace`;
        ctx.fillStyle = "#d7b65f";
        ctx.fillText(
          "TAP TO CONTINUE",
          width / 2,
          height * 0.78,
          width * 0.82
        );

        ctx.restore();
        return;
      }

      if (doctorPhase === "cravingReturn") {
        const remaining = Math.max(0, cravingReturnUntil - now);
        const total = 2300;
        const elapsed = total - remaining;
        const fade =
          elapsed < 550
            ? Math.min(1, elapsed / 550)
            : remaining < 550
              ? Math.min(1, remaining / 550)
              : 1;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(27, width * 0.055)}px monospace`;
        ctx.fillStyle = "#fff2a8";
        ctx.fillText(
          cravingReturnText,
          width / 2,
          height / 2,
          width * 0.90
        );
        ctx.restore();
        return;
      }

      drawCravingBarScene(now);

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

  window.RecoveryChapter3Gameplay = {
    createDoctorsOpinionGame
  };
})();