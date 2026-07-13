(() => {
  window.RecoveryEngine = {
    version: "0.1",

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
    }
  };
})();