(() => {
  "use strict";

  // =====================================
  // RECOVERY MISFITS CHAPTER RUNTIME
  // Builds the shared object supplied to
  // chapter update and drawing functions.
  // =====================================

  function createChapterRuntime(
    context,
    now = performance.now(),
    options = {}
  ) {
    if (!context) {
      throw new Error(
        "RecoveryRuntime requires an engine context."
      );
    }

    return {
      now,

      width:
        context.getWidth(),

      height:
        context.getHeight(),

      ctx:
        context.ctx,

      bill:
        context.bill,

      activeEntities:
        context.activeEntities,

      obstacleDefinitions:
        context.obstacleDefinitions,

      obstacleImages:
        context.obstacleImages,

      collectibleDefinitions:
        context.collectibleDefinitions,

      collectibleImages:
        context.collectibleImages,

      easierRetry:
        context.isEasierRetry(),

      screenShake:
        options.screenShake ??
        context.getScreenShake(),

      updateBackground:
        context.updateBackground,

      updatePickupEffects:
        context.updatePickupEffects,

      drawBackground:
        context.drawBackground,

      drawBill:
        context.drawBill,

      drawPickupEffects:
        context.drawPickupEffects,

      floatingNumbers:
        context.floatingNumbers,

      pickupParticles:
        context.pickupParticles,

      getScreenShake:
        context.getScreenShake,

      setScreenShake:
        context.setScreenShake,

      getBillPickupBounce:
        context.getBillPickupBounce,

      setBillPickupBounce:
        context.setBillPickupBounce,

      setEasierRetry:
        context.setEasierRetry,

      playCrashFeedback:
        context.playCrashFeedback,

      restartGameplay:
        context.restartGameplay,

      addScore:
        context.addScore,

      playPickupFeedback:
        context.playPickupFeedback,

      createPickupEffects:
        context.createPickupEffects
    };
  }

  window.RecoveryRuntime = {
    createChapterRuntime
  };
})();
