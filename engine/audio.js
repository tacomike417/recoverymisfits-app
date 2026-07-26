(() => {
  "use strict";

  const AudioEngine = {};

  AudioEngine.hello = function () {
    console.log("RecoveryAudio module loaded.");
  };

  window.RecoveryAudio = AudioEngine;
})();