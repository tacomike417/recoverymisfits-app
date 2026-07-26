(() => {
  "use strict";

  function createPlayer(settings = {}) {
    return {
      x: 40,
      y: 200,

      width:
        settings.width ||
        145,

      height:
        settings.height ||
        123,

      targetY: 200
    };
  }

  function resetPlayer(
    player,
    screenHeight
  ) {
    player.x = 40;

    player.y = Math.max(
      80,
      screenHeight / 2 -
        player.height / 2
    );

    player.targetY = player.y;
  }

  function keepPlayerOnScreen(
    player,
    screenHeight
  ) {
    const topLimit = 40;

    const bottomLimit =
      screenHeight -
      player.height -
      40;

    player.targetY = Math.max(
      topLimit,
      Math.min(
        bottomLimit,
        player.targetY
      )
    );
  }

  function setPlayerTargetY(
    player,
    targetY,
    screenHeight
  ) {
    player.targetY = targetY;

    keepPlayerOnScreen(
      player,
      screenHeight
    );
  }

  function movePlayerTarget(
    player,
    amount,
    screenHeight
  ) {
    player.targetY += amount;

    keepPlayerOnScreen(
      player,
      screenHeight
    );
  }

  function updatePlayer(player) {
    player.y +=
      (
        player.targetY -
        player.y
      ) *
      0.24;
  }

  function drawPlayer({
    ctx,
    player,
    image,
    pickupBounce = 0
  }) {
    ctx.imageSmoothingEnabled = false;

    const bounceScale =
      1 + pickupBounce * 0.08;

    const drawWidth =
      player.width * bounceScale;

    const drawHeight =
      player.height *
      (
        1 -
        pickupBounce * 0.05
      );

    const drawX =
      player.x -
      (
        drawWidth -
        player.width
      ) /
        2;

    const drawY =
      player.y +
      (
        player.height -
        drawHeight
      ) /
        2;

    if (
      image.complete &&
      image.naturalWidth > 0
    ) {
      ctx.drawImage(
        image,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      return;
    }

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  window.RecoveryPlayer = {
    createPlayer,
    resetPlayer,
    keepPlayerOnScreen,
    setPlayerTargetY,
    movePlayerTarget,
    updatePlayer,
    drawPlayer
  };
})();