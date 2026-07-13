(() => {
  window.RecoveryEngine = {
    version: "0.2",

    getChapter(index = 0) {
      if (!Array.isArray(window.chapters)) {
        throw new Error("Recovery Engine could not find chapters.");
      }

      return window.chapters[index] || null;
    },

    getDurationMs(index = 0) {
      const chapter = this.getChapter(index);
      const seconds = chapter?.gameplay?.duration || 30;

      return seconds * 1000;
    },

    createTimer(chapterIndex = 0) {
      return {
        startedAt: performance.now(),
        duration: this.getDurationMs(chapterIndex),

        getRemainingSeconds() {
          const elapsed = performance.now() - this.startedAt;
          const remaining = Math.max(0, this.duration - elapsed);

          return Math.ceil(remaining / 1000);
        },

        isFinished() {
          return this.getRemainingSeconds() <= 0;
        }
      };
    }
  };
})();