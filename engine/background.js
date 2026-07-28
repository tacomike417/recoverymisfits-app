(() => {
  "use strict";

  function createBackground(options = {}) {
    const ctx = options.ctx;
    const image = options.image;
    const getWidth = options.getWidth;
    const getHeight = options.getHeight;
    const scrollSpeed = Number(options.scrollSpeed) || 1.2;

    let offset = 0;

    function imageIsReady() {
      return Boolean(
        image &&
        image.complete &&
        image.naturalWidth > 0 &&
        image.naturalHeight > 0
      );
    }

    function getDrawSize() {
      if (!imageIsReady()) {
        return { width: 0, height: 0 };
      }

      const height = getHeight();
      const scale = height / image.naturalHeight;

      return {
        width: image.naturalWidth * scale,
        height
      };
    }

    function reset() {
      offset = 0;
    }

    function update() {
      offset -= scrollSpeed;

      if (!imageIsReady()) {
        if (offset <= -140) {
          offset += 140;
        }
        return;
      }

      const backgroundSize = getDrawSize();

      if (backgroundSize.width <= 0) {
        return;
      }

      while (offset <= -backgroundSize.width) {
        offset += backgroundSize.width;
      }
    }

    function drawImageBackground() {
      const width = getWidth();
      const backgroundSize = getDrawSize();

      if (backgroundSize.width <= 0 || backgroundSize.height <= 0) {
        return false;
      }

      ctx.imageSmoothingEnabled = false;

      let drawX = offset;

      while (drawX > 0) {
        drawX -= backgroundSize.width;
      }

      while (drawX < width) {
        ctx.drawImage(
          image,
          drawX,
          0,
          backgroundSize.width,
          backgroundSize.height
        );

        drawX += backgroundSize.width;
      }

      return true;
    }

    function drawFallbackBackground() {
      const width = getWidth();
      const height = getHeight();

      ctx.fillStyle = "#172330";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#263747";
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      ctx.fillStyle = "#10171d";

      let buildingNumber = 0;

      for (let x = offset - 140; x < width + 140; x += 140) {
        const buildingHeight =
          130 + (Math.abs(buildingNumber) % 3) * 40;

        ctx.fillRect(
          x,
          height * 0.65 - buildingHeight,
          110,
          buildingHeight
        );

        buildingNumber += 1;
      }

      ctx.fillStyle = "#ffd66b";

      for (let x = offset - 115; x < width + 140; x += 140) {
        ctx.fillRect(x, height * 0.65 - 95, 15, 20);
        ctx.fillRect(x + 40, height * 0.65 - 60, 15, 20);
      }
    }

    function draw() {
      if (!drawImageBackground()) {
        drawFallbackBackground();
      }
    }

    return {
      reset,
      update,
      draw,
      imageIsReady,
      getDrawSize
    };
  }

  window.RecoveryBackground = {
    createBackground
  };
})();