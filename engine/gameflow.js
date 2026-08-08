(() => {
  "use strict";

  function hasPointerCoordinates(event) {
    return Boolean(
      event &&
      typeof event.clientX === "number" &&
      typeof event.clientY === "number"
    );
  }

  function createController(options) {
    const {
      canvas,
      ctx,
      getGameState,
      getFinishedInputReadyAt,
      getHeight,
      isTreatmentLevel,
      isCustomGameplayLevel,
      beginRecoveryMisfitsSplash,
      startCutsceneMusic,
      finishChapter1CutScene,
      chapter1CutSceneSpeedButtonContains,
      chapter1CutSceneSkipButtonContains,
      toggleChapter1CutSceneSpeed,
      playClickFeedback,
      showStoryCards,
      advanceStoryCard,
      continueToNextChapter,
      startGameplay,
      tapCustomGameplay,
      tapTreatmentSlot,
      player,
      updateSplash,
      updateChapter1CutScene,
      updateCustomGameplay,
      updateTreatmentGame,
      updateTreatmentMusic,
      finishChapter,
      chapterTimerIsFinished,
      updateChapterEntities,
      drawOpeningSplashScreen,
      drawSplashScreen,
      drawChapter1CutScene,
      drawTitleScreen,
      drawStoryCard,
      drawCustomGameplay,
      drawTreatmentGame,
      drawGameplayHud,
      drawTreatmentFailed,
      drawChapter3PreviewFinished,
      drawChapterFinished,
      drawChapterEntities,
      backgroundMusic,
      cutsceneMusic,
      isAudioUnlocked,
      playAudio
    } = options;

    function handlePrimaryAction(event) {
      const gameState = getGameState();

      if (gameState === "openingSplash") {
        beginRecoveryMisfitsSplash();
        return;
      }

      if (gameState === "chapter1CutScene") {
        startCutsceneMusic();

        if (!hasPointerCoordinates(event)) {
          playClickFeedback();
          finishChapter1CutScene();
          return;
        }

        if (
          chapter1CutSceneSpeedButtonContains(
            event.clientX,
            event.clientY
          )
        ) {
          toggleChapter1CutSceneSpeed();
          return;
        }

        if (
          chapter1CutSceneSkipButtonContains(
            event.clientX,
            event.clientY
          )
        ) {
          playClickFeedback();
          finishChapter1CutScene();
        }

        return;
      }

      if (gameState === "title") {
        playClickFeedback();
        showStoryCards();
        return;
      }

      if (gameState === "story") {
        playClickFeedback();
        advanceStoryCard();
        return;
      }

      if (gameState === "finished") {
        if (performance.now() < getFinishedInputReadyAt()) {
          return;
        }

        playClickFeedback();
        continueToNextChapter();
        return;
      }

      if (gameState === "treatmentFailed") {
        playClickFeedback();
        startGameplay();
        return;
      }

      if (gameState !== "playing") {
        return;
      }

      if (isCustomGameplayLevel && hasPointerCoordinates(event)) {
        const result = tapCustomGameplay(
          event.clientX,
          event.clientY
        );

        // Custom gameplay modules (like chapter 5's town map) signal
        // completion by returning { complete: true, nextChapter }
        // from tap(). gameFlow previously ignored this return value
        // entirely, so tap() could report completion correctly and
        // nothing would ever act on it. This is what actually advances
        // the chapter.
        if (result && result.complete) {
          playClickFeedback();
          continueToNextChapter();
        }

        return;
      }

      if (isTreatmentLevel && hasPointerCoordinates(event)) {
        tapTreatmentSlot(event.clientX, event.clientY);
        return;
      }

      if (event && typeof event.clientY === "number") {
        window.RecoveryPlayer.setPlayerTargetY(
          player,
          event.clientY - player.height / 2,
          getHeight()
        );
      }
    }

    function update(now) {
      switch (getGameState()) {
        case "openingSplash":
          break;

        case "splash":
          updateSplash(now);
          break;

        case "chapter1CutScene":
          updateChapter1CutScene(now);
          break;

        case "playing":
          if (isCustomGameplayLevel) {
            updateCustomGameplay(now);
            break;
          }

          if (chapterTimerIsFinished()) {
            finishChapter();
            break;
          }

          if (isTreatmentLevel) {
            updateTreatmentGame(now);
            updateTreatmentMusic(now);
            break;
          }

          updateChapterEntities(now);
          break;

        default:
          break;
      }
    }

    function draw(now) {
      switch (getGameState()) {
        case "openingSplash":
          drawOpeningSplashScreen(now);
          break;

        case "splash":
          drawSplashScreen(now);
          break;

        case "chapter1CutScene":
          drawChapter1CutScene(now);
          break;

        case "title":
          drawTitleScreen();
          break;

        case "story":
          drawStoryCard();
          break;

        case "playing":
          if (isCustomGameplayLevel) {
            drawCustomGameplay(now);
            break;
          }

          if (isTreatmentLevel) {
            drawTreatmentGame();
            drawGameplayHud();
            break;
          }

          drawChapterEntities(now);
          drawGameplayHud();
          break;

        case "treatmentFailed":
          drawTreatmentGame();
          drawGameplayHud();
          drawTreatmentFailed();
          break;

        case "chapter3PreviewFinished":
          drawChapter3PreviewFinished();
          break;

        case "finished":
          if (isCustomGameplayLevel) {
            drawCustomGameplay(now);
          } else if (isTreatmentLevel) {
            drawTreatmentGame();
          } else {
            drawChapterEntities(now, { screenShake: 0 });
          }

          drawGameplayHud();
          drawChapterFinished();
          break;

        default:
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
          break;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        backgroundMusic.pause();
        cutsceneMusic.pause();
        return;
      }

      if (!isAudioUnlocked()) {
        return;
      }

      if (getGameState() === "playing") {
        playAudio(backgroundMusic);
      } else if (getGameState() === "chapter1CutScene") {
        playAudio(cutsceneMusic);
      }
    }

    function gameLoop(now) {
      update(now);
      draw(now);
      requestAnimationFrame(gameLoop);
    }

    function start() {
      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      requestAnimationFrame(gameLoop);
    }

    return {
      handlePrimaryAction,
      update,
      draw,
      start
    };
  }

  window.RecoveryGameFlow = {
    createController
  };
})();