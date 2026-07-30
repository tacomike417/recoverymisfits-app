(() => {
  "use strict";

  const AudioEngine = {};

  // =====================================
  // MUSIC FILES
  // =====================================

  const TITLE_THEME_PATH =
    "assets/sounds/music/title-theme.mp3";

  // =====================================
  // TITLE MUSIC
  // =====================================

  const titleTheme = new Audio(
    TITLE_THEME_PATH
  );

  titleTheme.preload = "auto";
  titleTheme.loop = true;
  titleTheme.volume = 0.75;

  let titleThemeWanted = false;
  let titleThemeFadeFrame = null;

  // =====================================
  // PLAY TITLE MUSIC
  // =====================================

  AudioEngine.playTitleTheme =
    async function ({
      restart = false
    } = {}) {
      titleThemeWanted = true;

      if (titleThemeFadeFrame) {
        cancelAnimationFrame(
          titleThemeFadeFrame
        );

        titleThemeFadeFrame = null;
      }

      titleTheme.volume = 0.75;

      if (restart) {
        titleTheme.currentTime = 0;
      }

      if (!titleTheme.paused) {
        return true;
      }

      try {
        await titleTheme.play();
        return true;
      } catch (error) {
        /*
          Browsers may block music until the
          player clicks, taps, or presses a key.
          The unlock listeners below will try
          again after the first interaction.
        */

        if (
          error?.name !==
          "NotAllowedError"
        ) {
          console.warn(
            "Could not play title theme:",
            error
          );
        }

        return false;
      }
    };

  // =====================================
  // PAUSE TITLE MUSIC
  // =====================================

  AudioEngine.pauseTitleTheme =
    function () {
      titleThemeWanted = false;
      titleTheme.pause();
    };

  // =====================================
  // STOP TITLE MUSIC
  // =====================================

  AudioEngine.stopTitleTheme =
    function ({
      reset = true
    } = {}) {
      titleThemeWanted = false;

      if (titleThemeFadeFrame) {
        cancelAnimationFrame(
          titleThemeFadeFrame
        );

        titleThemeFadeFrame = null;
      }

      titleTheme.pause();
      titleTheme.volume = 0.75;

      if (reset) {
        titleTheme.currentTime = 0;
      }
    };

  // =====================================
  // FADE OUT TITLE MUSIC
  // =====================================

  AudioEngine.fadeOutTitleTheme =
    function (
      duration = 900
    ) {
      titleThemeWanted = false;

      if (
        titleTheme.paused ||
        duration <= 0
      ) {
        AudioEngine.stopTitleTheme();
        return;
      }

      if (titleThemeFadeFrame) {
        cancelAnimationFrame(
          titleThemeFadeFrame
        );
      }

      const startingVolume =
        titleTheme.volume;

      const startedAt =
        performance.now();

      function fadeStep(now) {
        const elapsed =
          now - startedAt;

        const progress =
          Math.min(
            elapsed / duration,
            1
          );

        titleTheme.volume =
          startingVolume *
          (1 - progress);

        if (progress < 1) {
          titleThemeFadeFrame =
            requestAnimationFrame(
              fadeStep
            );

          return;
        }

        titleThemeFadeFrame = null;
        titleTheme.pause();
        titleTheme.currentTime = 0;
        titleTheme.volume = 0.75;
      }

      titleThemeFadeFrame =
        requestAnimationFrame(
          fadeStep
        );
    };

  // =====================================
  // MUSIC VOLUME
  // =====================================

  AudioEngine.setMusicVolume =
    function (volume) {
      const safeVolume =
        Math.max(
          0,
          Math.min(
            Number(volume) || 0,
            1
          )
        );

      titleTheme.volume =
        safeVolume;
    };

  // =====================================
  // BROWSER AUDIO UNLOCK
  // =====================================

  /*
    Chrome and mobile browsers often block
    music until the player interacts with
    the page.

    If the title theme was requested but
    blocked, clicking, tapping, or pressing
    a key will attempt to start it again.
  */

  async function unlockAudio() {
    if (!titleThemeWanted) {
      return;
    }

    await AudioEngine.playTitleTheme();
  }

  document.addEventListener(
    "pointerdown",
    unlockAudio
  );

  document.addEventListener(
    "keydown",
    unlockAudio
  );

  // =====================================
  // PRELOAD
  // =====================================

  AudioEngine.preload =
    function () {
      titleTheme.load();
    };

  // =====================================
  // DEBUG
  // =====================================

  AudioEngine.hello =
    function () {
      console.log(
        "RecoveryAudio module loaded."
      );
    };

  AudioEngine.getTitleTheme =
    function () {
      return titleTheme;
    };

  AudioEngine.preload();

  window.RecoveryAudio =
    AudioEngine;
})();