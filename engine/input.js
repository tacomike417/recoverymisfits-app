(() => {
  "use strict";

  function installInputHandlers({
    canvas,
    getGameState,
    isTreatmentLevel,
    isDoctorsOpinionLevel,
    handlePrimaryAction,
    beginRecoveryMisfitsSplash,
    player,
    getHeight
  }) {
    canvas.style.touchAction = "none";

    /*
      Chrome may reject audio started from pointerdown while mobile
      device emulation is active. Use a real click to unlock and start
      the Recovery Misfits splash sound.
    */
    canvas.addEventListener(
      "click",
      (event) => {
        if (getGameState() !== "openingSplash") {
          return;
        }

        event.preventDefault();
        beginRecoveryMisfitsSplash();
      },
      { passive: false }
    );

    canvas.addEventListener(
      "pointerdown",
      (event) => {
        event.preventDefault();

        /*
          The opening splash is handled by the click listener above,
          because Chrome recognizes click more reliably for audio unlock.
        */
        if (getGameState() === "openingSplash") {
          return;
        }

        handlePrimaryAction(event);

        try {
          if (
            canvas.hasPointerCapture &&
            !canvas.hasPointerCapture(event.pointerId)
          ) {
            canvas.setPointerCapture(event.pointerId);
          }
        } catch (error) {
          // Pointer capture is optional; the game still responds to the tap.
        }
      },
      { passive: false }
    );

    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (
          getGameState() !== "playing" ||
          isTreatmentLevel ||
          isDoctorsOpinionLevel
        ) {
          return;
        }

        if (
          event.pointerType === "mouse" &&
          event.buttons === 0
        ) {
          return;
        }

        event.preventDefault();

        window.RecoveryPlayer.setPlayerTargetY(
          player,
          event.clientY -
            player.height / 2,
          getHeight()
        );
      }
    );

    window.addEventListener(
      "keydown",
      (event) => {
        const gameState = getGameState();

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          if (
            gameState === "openingSplash" ||
            gameState === "chapter1CutScene" ||
            gameState === "title" ||
            gameState === "story" ||
            gameState === "finished"
          ) {
            event.preventDefault();

            handlePrimaryAction();

            return;
          }
        }

        if (gameState !== "playing") {
          return;
        }

        if (event.key === "ArrowUp") {
          window.RecoveryPlayer.movePlayerTarget(
            player,
            -70,
            getHeight()
          );
        }

        if (event.key === "ArrowDown") {
          window.RecoveryPlayer.movePlayerTarget(
            player,
            70,
            getHeight()
          );
        }
      }
    );
  }

  window.RecoveryInput = {
    installInputHandlers
  };
})();