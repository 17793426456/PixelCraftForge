// FrameRonin-main/FrameRonin-main/frontend/src/lib/geminiWatermark.ts
var BG_48_BASE64 = "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";
function getWatermarkParams(imgWidth, imgHeight, sizeMode) {
  const logoSize = sizeMode;
  const marginRight = sizeMode === 48 ? 32 : 64;
  const marginBottom = sizeMode === 48 ? 32 : 64;
  return {
    size: logoSize,
    margin: marginRight,
    x: imgWidth - marginRight - logoSize,
    y: imgHeight - marginBottom - logoSize
  };
}
function getWatermarkSize(imgWidth, imgHeight) {
  return imgWidth > 1024 && imgHeight > 1024 ? 96 : 48;
}
function getWatermarkPosition(imgWidth, imgHeight, size) {
  const { x, y } = getWatermarkParams(imgWidth, imgHeight, size);
  return { x, y };
}
function alphaMapFromBgCapture(bgPixels, width, height, channels) {
  const alpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const off = i * channels;
    const r = bgPixels[off] ?? 0;
    const g = bgPixels[off + 1] ?? 0;
    const b = bgPixels[off + 2] ?? 0;
    const gray = Math.max(r, g, b);
    alpha[i] = gray / 255;
  }
  return alpha;
}
function removeWatermarkReverseAlpha(imageData, alphaMap, mapWidth, mapHeight, x, y, logoValue = 255, alphaScale = 1) {
  const { data, width, height } = imageData;
  const alphaThreshold = 2e-3;
  const maxAlpha = 0.99;
  const x1 = Math.max(0, x);
  const y1 = Math.max(0, y);
  const x2 = Math.min(width, x + mapWidth);
  const y2 = Math.min(height, y + mapHeight);
  for (let py = y1; py < y2; py++) {
    for (let px = x1; px < x2; px++) {
      const alphaIdx = (py - y) * mapWidth + (px - x);
      if (alphaIdx < 0 || alphaIdx >= alphaMap.length) continue;
      let alpha = Math.min(alphaMap[alphaIdx] ?? 0, maxAlpha) * alphaScale;
      if (alpha < alphaThreshold) continue;
      alpha = Math.min(alpha, maxAlpha);
      const oneMinusAlpha = 1 - alpha;
      const i = (py * width + px) * 4;
      for (let c = 0; c < 3; c++) {
        const watermarked = data[i + c] ?? 0;
        const original = (watermarked - alpha * logoValue) / oneMinusAlpha;
        if (original < 0) continue;
        data[i + c] = Math.round(Math.max(0, Math.min(255, original)));
      }
    }
  }
}
function scaleAlphaMap(source, srcSize, dstSize) {
  if (srcSize === dstSize) return source;
  const out = new Float32Array(dstSize * dstSize);
  for (let ty = 0; ty < dstSize; ty++) {
    for (let tx = 0; tx < dstSize; tx++) {
      const sx = (tx + 0.5) * (srcSize / dstSize) - 0.5;
      const sy = (ty + 0.5) * (srcSize / dstSize) - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(srcSize - 1, x0 + 1);
      const y0 = Math.max(0, Math.floor(sy));
      const y1 = Math.min(srcSize - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const v00 = source[y0 * srcSize + x0] ?? 0;
      const v10 = source[y0 * srcSize + x1] ?? 0;
      const v01 = source[y1 * srcSize + x0] ?? 0;
      const v11 = source[y1 * srcSize + x1] ?? 0;
      out[ty * dstSize + tx] = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
    }
  }
  return out;
}
async function getEmbeddedAlphaMask(size) {
  if (size === 96) {
    const small = await loadAlphaMaskFromUrl(`data:image/png;base64,${BG_48_BASE64}`);
    const scaled = scaleAlphaMap(small.alpha, 48, 96);
    return { alpha: scaled, width: 96, height: 96 };
  }
  const dataUrl = `data:image/png;base64,${BG_48_BASE64}`;
  return loadAlphaMaskFromUrl(dataUrl);
}
async function loadAlphaMaskFromUrl(url) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const alpha = alphaMapFromBgCapture(id.data, canvas.width, canvas.height, 4);
  return { alpha, width: canvas.width, height: canvas.height };
}
async function removeGeminiWatermarkFromBlob(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("ERR_READ"));
    r.readAsDataURL(blob);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const baseSize = getWatermarkSize(w, h);
  const params = getWatermarkParams(w, h, baseSize);
  let alphaMap;
  let mapW;
  let mapH;
  try {
    const loaded = await getEmbeddedAlphaMask(baseSize);
    alphaMap = loaded.alpha;
    mapW = loaded.width;
    mapH = loaded.height;
  } catch {
    alphaMap = createApproxAlphaMap(baseSize);
    mapW = mapH = baseSize;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  removeWatermarkReverseAlpha(imageData, alphaMap, mapW, mapH, params.x, params.y, 255, 1);
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("ERR_TOBLOB")), "image/png", 0.95);
  });
}
function createApproxAlphaMap(size) {
  const alpha = new Float32Array(size * size);
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const star = Math.abs(Math.sin(angle * 4)) * 0.5 + 0.5;
      const radial = Math.max(0, 1 - r * (1.2 - star * 0.3));
      alpha[y * size + x] = Math.min(1, radial * 0.6);
    }
  }
  return alpha;
}
export {
  createApproxAlphaMap,
  getEmbeddedAlphaMask,
  getWatermarkParams,
  getWatermarkPosition,
  getWatermarkSize,
  loadAlphaMaskFromUrl,
  removeGeminiWatermarkFromBlob,
  removeWatermarkReverseAlpha
};
