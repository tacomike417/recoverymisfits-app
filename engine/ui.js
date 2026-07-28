/**
 * Recovery Misfits shared SNES-style UI drawing tools.
 *
 * Code-drawn UI only. No PNG artwork is required.
 */

function makeBeveledPath(ctx, x, y, width, height, cut = 10) {
  const px = Math.round(x);
  const py = Math.round(y);
  const pw = Math.round(width);
  const ph = Math.round(height);
  const pc = Math.max(3, Math.round(Math.min(cut, pw / 4, ph / 4)));

  ctx.beginPath();
  ctx.moveTo(px + pc, py);
  ctx.lineTo(px + pw - pc, py);
  ctx.lineTo(px + pw, py + pc);
  ctx.lineTo(px + pw, py + ph - pc);
  ctx.lineTo(px + pw - pc, py + ph);
  ctx.lineTo(px + pc, py + ph);
  ctx.lineTo(px, py + ph - pc);
  ctx.lineTo(px, py + pc);
  ctx.closePath();
}

function drawBeveledWindow(
  ctx,
  {
    x,
    y,
    width,
    height,
    fill = "#101820",
    border = "#a77a32",
    highlight = "#efd28a",
    innerBorder = "#332818",
    shadow = "rgba(0, 0, 0, 0.68)",
    shadowOffset = 6,
    cut = 10,
    inset = 7
  }
) {
  if (!ctx || width <= 0 || height <= 0) return;

  const px = Math.round(x);
  const py = Math.round(y);
  const pw = Math.round(width);
  const ph = Math.round(height);
  const offset = Math.round(shadowOffset);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  makeBeveledPath(ctx, px + offset, py + offset, pw, ph, cut);
  ctx.fillStyle = shadow;
  ctx.fill();

  makeBeveledPath(ctx, px - 4, py - 4, pw + 8, ph + 8, cut + 4);
  ctx.fillStyle = "#030303";
  ctx.fill();

  makeBeveledPath(ctx, px, py, pw, ph, cut);
  ctx.fillStyle = border;
  ctx.fill();

  makeBeveledPath(ctx, px + 4, py + 4, pw - 8, ph - 8, Math.max(3, cut - 3));
  ctx.fillStyle = innerBorder;
  ctx.fill();

  makeBeveledPath(
    ctx,
    px + inset,
    py + inset,
    pw - inset * 2,
    ph - inset * 2,
    Math.max(3, cut - 5)
  );
  ctx.fillStyle = fill;
  ctx.fill();

  // Bright top-left bevel.
  ctx.strokeStyle = highlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + cut + 2, py + 2);
  ctx.lineTo(px + pw - cut - 2, py + 2);
  ctx.moveTo(px + 2, py + cut + 2);
  ctx.lineTo(px + 2, py + ph - cut - 2);
  ctx.stroke();

  // Dark bottom-right bevel.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.62)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + cut + 3, py + ph - 3);
  ctx.lineTo(px + pw - cut - 3, py + ph - 3);
  ctx.moveTo(px + pw - 3, py + cut + 3);
  ctx.lineTo(px + pw - 3, py + ph - cut - 3);
  ctx.stroke();

  // Pixel corner caps.
  ctx.fillStyle = highlight;
  ctx.fillRect(px + 5, py + cut - 1, 3, 5);
  ctx.fillRect(px + cut - 1, py + 5, 5, 3);

  ctx.restore();
}

function drawWindow(ctx, options) {
  drawBeveledWindow(ctx, {
    cut: 7,
    ...options
  });
}

function drawSegmentedMeter(
  ctx,
  {
    x,
    y,
    width,
    height,
    progress,
    segments = 12,
    fill = "#2c66d6",
    empty = "#091018",
    border = "#a77a32",
    highlight = "#79a5ff"
  }
) {
  const px = Math.round(x);
  const py = Math.round(y);
  const pw = Math.round(width);
  const ph = Math.round(height);
  const safeProgress = Math.max(0, Math.min(1, progress));
  const gap = 3;
  const innerX = px + 6;
  const innerY = py + 6;
  const innerW = pw - 12;
  const innerH = ph - 12;
  const segmentW = (innerW - gap * (segments - 1)) / segments;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  drawBeveledWindow(ctx, {
    x: px,
    y: py,
    width: pw,
    height: ph,
    fill: "#070d12",
    border,
    highlight: "#e0bd6f",
    innerBorder: "#241c10",
    shadowOffset: 3,
    cut: 7,
    inset: 5
  });

  const lit = safeProgress * segments;
  for (let i = 0; i < segments; i += 1) {
    const sx = innerX + i * (segmentW + gap);
    const amount = Math.max(0, Math.min(1, lit - i));

    ctx.fillStyle = empty;
    ctx.fillRect(Math.round(sx), innerY, Math.ceil(segmentW), innerH);

    if (amount > 0) {
      ctx.fillStyle = fill;
      ctx.fillRect(
        Math.round(sx),
        innerY,
        Math.max(1, Math.round(segmentW * amount)),
        innerH
      );

      ctx.fillStyle = highlight;
      ctx.fillRect(
        Math.round(sx) + 2,
        innerY + 2,
        Math.max(1, Math.round((segmentW - 4) * amount)),
        3
      );
    }
  }

  ctx.restore();
}

window.RecoveryUI = {
  drawWindow,
  drawBeveledWindow,
  drawSegmentedMeter
};