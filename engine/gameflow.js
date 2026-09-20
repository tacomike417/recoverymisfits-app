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

    /* ?perf=1 -- FRAME LOGGER.

       An on-screen readout was tried first and was a bad idea: it asked
       somebody to read four numbers off a phone while failing a reflex
       minigame. This writes to localStorage instead, once a second, and
       test.html reads it back with a copy button.

       It records more than frame rate, because frame rate alone never told
       us anything: how long update and draw each took, the worst single
       frame in the second, how many frames blew past 33ms, and the state
       of the music element -- readyState and networkState are how a
       starved audio decoder shows itself. */
    const PERF_ON = new URLSearchParams(location.search).get("perf") === "1";
    const PERF_KEY = "rm-perf-log";
    const PERF_ENDPOINT =
      "https://rrkyvcouxdmurwdyuugv.supabase.co/rest/v1/perf_logs";
    const PERF_KEYSTR = "sb_publishable_SJEQDnQAEqCcIooFfDUjwg_jhYgUTe_";
    let perfLastPost = 0;
    let perfLastSfx = 0;

    let perfSamples = [];
    let perfFrames = 0;
    let perfUpdateMs = 0;
    let perfDrawMs = 0;
    let perfWorstMs = 0;
    let perfJank = 0;          // frames over 33ms -- a visible hitch
    let perfWindowStart = 0;
    let perfRunStart = 0;

    function perfMusicState() {
      const a = document.querySelector("audio") ||
                (window.RecoveryDebugMusic || null);
      if (!a) return null;
      return {
        paused: a.paused,
        ready: a.readyState,      // 0 = nothing decoded, 4 = plenty
        net: a.networkState,      // 2 = still loading, 3 = no source
        rate: Number((a.playbackRate || 1).toFixed(3)),
        t: Number((a.currentTime || 0).toFixed(1))
      };
    }

    function perfFlush(now) {
      const secs = (now - perfWindowStart) / 1000;
      if (secs <= 0 || perfFrames === 0) return;
      const canvas = document.querySelector("canvas");

      // how many sound effects fired in this one second -- see playSound
      const sfxNow = window.RecoverySfxCount || 0;
      const sfxThisSecond = sfxNow - perfLastSfx;
      perfLastSfx = sfxNow;

      perfSamples.push({
        at: Math.round((now - perfRunStart) / 1000),        // seconds into the run
        fps: Math.round(perfFrames / secs),
        sfx: sfxThisSecond,
        upd: Number((perfUpdateMs / perfFrames).toFixed(2)),
        draw: Number((perfDrawMs / perfFrames).toFixed(2)),
        worst: Math.round(perfWorstMs),
        jank: perfJank,
        state: getGameState(),
        music: perfMusicState()
      });

      const payload = {
        when: new Date().toISOString(),
        url: location.search,
        dpr: window.devicePixelRatio,
        canvas: canvas ? canvas.width + "x" + canvas.height : null,
        ua: navigator.userAgent.slice(0, 90),
        samples: perfSamples.slice(-90)
      };

      /* SEND IT SOMEWHERE READABLE.

         The log is generated on a phone and read on a desktop, so keeping
         it in localStorage was useless. Every 5 seconds the run so far is
         posted to a throwaway perf_logs table. keepalive lets the last one
         survive the page being closed. Failures are ignored on purpose --
         a diagnostic that breaks the thing it is diagnosing is worse than
         no diagnostic. */
      if (now - perfLastPost > 5000) {
        perfLastPost = now;
        try {
          fetch(PERF_ENDPOINT, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              apikey: PERF_KEYSTR,
              Authorization: "Bearer " + PERF_KEYSTR,
              Prefer: "return=minimal"
            },
            body: JSON.stringify({ tag: location.search || "(no flags)", payload })
          }).catch(() => {});
        } catch (e) { /* ignore */ }
      }

      try {
        localStorage.setItem(PERF_KEY, JSON.stringify(payload));
      } catch (e) { /* private mode, full quota -- not worth failing over */ }

      perfFrames = 0; perfUpdateMs = 0; perfDrawMs = 0;
      perfWorstMs = 0; perfJank = 0; perfWindowStart = now;
    }

    function gameLoop(now) {
      if (!PERF_ON) {
        update(now);
        draw(now);
        requestAnimationFrame(gameLoop);
        return;
      }

      if (!perfRunStart) { perfRunStart = now; perfWindowStart = now; }

      const a = performance.now();
      update(now);
      const b = performance.now();
      draw(now);
      const c = performance.now();

      const frameMs = c - a;
      perfFrames++;
      perfUpdateMs += b - a;
      perfDrawMs += c - b;
      if (frameMs > perfWorstMs) perfWorstMs = frameMs;
      if (frameMs > 33) perfJank++;

      if (now - perfWindowStart >= 1000) perfFlush(now);

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