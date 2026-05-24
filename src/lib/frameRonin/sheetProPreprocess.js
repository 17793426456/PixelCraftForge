// FrameRonin-main/FrameRonin-main/frontend/src/components/ParamsStep/utils.ts
async function cropImageBlob(blob, crop) {
  const { left, top, right, bottom } = crop;
  if (left === 0 && top === 0 && right === 0 && bottom === 0) return blob;
  const img = await (typeof createImageBitmap === "function" ? createImageBitmap(blob) : new Promise((resolve, reject) => {
    const im = new Image();
    const url = URL.createObjectURL(blob);
    im.onload = () => {
      URL.revokeObjectURL(url);
      resolve(im);
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ERR_IMAGE_LOAD"));
    };
    im.src = url;
  }));
  const srcW = img.width;
  const srcH = img.height;
  const dstW = Math.max(1, srcW - left - right);
  const dstH = Math.max(1, srcH - top - bottom);
  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  ctx.drawImage(img, left, top, dstW, dstH, 0, 0, dstW, dstH);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("ERR_TOBLOB")), "image/png", 0.95);
  });
}
async function resizeImageToBlobNearestNeighborPS(blob, targetW, targetH, keepAspect) {
  const img = await (typeof createImageBitmap === "function" ? createImageBitmap(blob) : new Promise((resolve, reject) => {
    const im = new Image();
    const url = URL.createObjectURL(blob);
    im.onload = () => {
      URL.revokeObjectURL(url);
      resolve(im);
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ERR_IMAGE_LOAD"));
    };
    im.src = url;
  }));
  const srcW = img.width;
  const srcH = img.height;
  const tmp = document.createElement("canvas");
  tmp.width = srcW;
  tmp.height = srcH;
  const tmpCtx = tmp.getContext("2d");
  if (!tmpCtx) return blob;
  tmpCtx.drawImage(img, 0, 0);
  const srcData = tmpCtx.getImageData(0, 0, srcW, srcH).data;
  let cw, ch, cx, cy;
  if (keepAspect) {
    const scale = Math.min(targetW / srcW, targetH / srcH);
    cw = Math.max(1, Math.round(srcW * scale));
    ch = Math.max(1, Math.round(srcH * scale));
    cx = Math.round((targetW - cw) / 2);
    cy = Math.round((targetH - ch) / 2);
  } else {
    cw = targetW;
    ch = targetH;
    cx = 0;
    cy = 0;
  }
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return blob;
  const outImg = outCtx.createImageData(targetW, targetH);
  const dst = outImg.data;
  for (let dy = 0; dy < targetH; dy++) {
    for (let dx = 0; dx < targetW; dx++) {
      const dstIdx = (dy * targetW + dx) * 4;
      if (dx < cx || dx >= cx + cw || dy < cy || dy >= cy + ch) {
        dst[dstIdx] = 0;
        dst[dstIdx + 1] = 0;
        dst[dstIdx + 2] = 0;
        dst[dstIdx + 3] = 0;
        continue;
      }
      const rx = dx - cx;
      const ry = dy - cy;
      const sx = Math.min(srcW - 1, Math.max(0, Math.floor((rx + 0.5) * srcW / cw)));
      const sy = Math.min(srcH - 1, Math.max(0, Math.floor((ry + 0.5) * srcH / ch)));
      const srcIdx = (sy * srcW + sx) * 4;
      dst[dstIdx] = srcData[srcIdx];
      dst[dstIdx + 1] = srcData[srcIdx + 1];
      dst[dstIdx + 2] = srcData[srcIdx + 2];
      dst[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }
  outCtx.putImageData(outImg, 0, 0);
  return new Promise((resolve, reject) => {
    out.toBlob((b) => b ? resolve(b) : reject(new Error("ERR_TOBLOB")), "image/png", 0.95);
  });
}
async function getTopLeftPixelColor(blob) {
  const img = await (typeof createImageBitmap === "function" ? createImageBitmap(blob) : new Promise((resolve, reject) => {
    const im = new Image();
    const url = URL.createObjectURL(blob);
    im.onload = () => {
      URL.revokeObjectURL(url);
      resolve(im);
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ERR_IMAGE_LOAD"));
    };
    im.src = url;
  }));
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ERR_CANVAS_CREATE");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return { r: d[0] ?? 0, g: d[1] ?? 0, b: d[2] ?? 0 };
}
function applyChromaKey(dataUrl, bgR, bgG, bgB, tolerance, feather) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("ERR_CANVAS_CREATE"));
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (dist <= tolerance) {
          d[i + 3] = 0;
        } else if (feather > 0 && dist < tolerance + feather) {
          const t = (dist - tolerance) / feather;
          d[i + 3] = Math.round(255 * Math.min(1, t));
        }
      }
      ctx.putImageData(id, 0, 0);
      const resultDataUrl = canvas.toDataURL("image/png");
      canvas.toBlob(
        (blob) => blob ? resolve({ blob, dataUrl: resultDataUrl }) : reject(new Error("ERR_EXPORT")),
        "image/png",
        0.95
      );
    };
    img.onerror = () => reject(new Error("ERR_IMAGE_LOAD"));
    img.src = dataUrl;
  });
}
function applyChromaKeyContiguousFromTopLeft(dataUrl, bgR, bgG, bgB, tolerance, feather) {
  void feather;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("ERR_CANVAS_CREATE"));
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = id.data;
      const w = canvas.width;
      const h = canvas.height;
      const idx = (x, y) => (y * w + x) * 4;
      const dist = (i) => Math.sqrt(
        (d[i] - bgR) ** 2 + (d[i + 1] - bgG) ** 2 + (d[i + 2] - bgB) ** 2
      );
      const match = (i) => dist(i) <= tolerance;
      const toRemove = /* @__PURE__ */ new Set();
      const start = idx(0, 0);
      if (!match(start)) {
        ctx.putImageData(id, 0, 0);
        canvas.toBlob(
          (blob) => blob ? resolve({ blob, dataUrl: canvas.toDataURL("image/png") }) : reject(new Error("ERR_EXPORT")),
          "image/png",
          0.95
        );
        return;
      }
      const stack = [[0, 0]];
      toRemove.add(idx(0, 0));
      const vis = /* @__PURE__ */ new Set();
      vis.add(idx(0, 0));
      const dx = [0, 1, 0, -1];
      const dy = [-1, 0, 1, 0];
      while (stack.length > 0) {
        const [x, y] = stack.pop();
        for (let k = 0; k < 4; k++) {
          const nx = x + dx[k];
          const ny = y + dy[k];
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const i = idx(nx, ny);
          if (vis.has(i)) continue;
          vis.add(i);
          if (match(i)) {
            toRemove.add(i);
            stack.push([nx, ny]);
          }
        }
      }
      for (const i of toRemove) {
        d[i + 3] = 0;
      }
      ctx.putImageData(id, 0, 0);
      const resultDataUrl = canvas.toDataURL("image/png");
      canvas.toBlob(
        (blob) => blob ? resolve({ blob, dataUrl: resultDataUrl }) : reject(new Error("ERR_EXPORT")),
        "image/png",
        0.95
      );
    };
    img.onerror = () => reject(new Error("ERR_IMAGE_LOAD"));
    img.src = dataUrl;
  });
}

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

// FrameRonin-main/FrameRonin-main/frontend/src/lib/roninProWorkflowGridOps.ts
async function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ERR_IMAGE_LOAD"));
    };
    img.src = url;
  });
}
function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("ERR_EXPORT")), "image/png", 0.95);
  });
}
async function wfPadExpand(blob, padTop, padRight, padBottom, padLeft) {
  const img = await blobToImage(blob);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const pt = Math.max(0, Math.round(padTop));
  const pr = Math.max(0, Math.round(padRight));
  const pb = Math.max(0, Math.round(padBottom));
  const pl = Math.max(0, Math.round(padLeft));
  const cw = w + pl + pr;
  const ch = h + pt + pb;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("ERR_CANVAS");
  ctx.drawImage(img, pl, pt);
  return canvasToPngBlob(c);
}

// FrameRonin-main/FrameRonin-main/frontend/src/lib/sheetProPreprocess.ts
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("ERR_READ"));
    r.readAsDataURL(blob);
  });
}
function sheetProPreprocessIsNoop(o) {
  if (o.watermark) return false;
  if (o.resizeEnabled) return false;
  if (o.matteMode !== "none") return false;
  if (o.cropTop + o.cropBottom + o.cropLeft + o.cropRight > 0) return false;
  if (o.padTop + o.padRight + o.padBottom + o.padLeft > 0) return false;
  return true;
}
async function applySheetProPreprocess(blob, o) {
  if (sheetProPreprocessIsNoop(o)) return blob;
  let b = blob;
  if (o.watermark) {
    b = await removeGeminiWatermarkFromBlob(b);
  }
  const ct = Math.max(0, Math.round(o.cropTop));
  const cb = Math.max(0, Math.round(o.cropBottom));
  const cl = Math.max(0, Math.round(o.cropLeft));
  const cr = Math.max(0, Math.round(o.cropRight));
  if (ct + cb + cl + cr > 0) {
    b = await cropImageBlob(b, { top: ct, bottom: cb, left: cl, right: cr });
  }
  const pt = Math.max(0, Math.round(o.padTop));
  const pr = Math.max(0, Math.round(o.padRight));
  const pb = Math.max(0, Math.round(o.padBottom));
  const pl = Math.max(0, Math.round(o.padLeft));
  if (pt + pr + pb + pl > 0) {
    b = await wfPadExpand(b, pt, pr, pb, pl);
  }
  if (o.resizeEnabled) {
    const rw = Math.max(1, Math.round(o.resizeW));
    const rh = Math.max(1, Math.round(o.resizeH));
    b = await resizeImageToBlobNearestNeighborPS(b, rw, rh, o.resizeKeepAspect);
  }
  if (o.matteMode === "contiguous" || o.matteMode === "global") {
    const { r, g, b: bb } = await getTopLeftPixelColor(b);
    const dataUrl = await blobToDataUrl(b);
    const tol = Math.max(0, o.matteTolerance);
    const fea = Math.max(0, o.matteFeather);
    const res = o.matteMode === "contiguous" ? await applyChromaKeyContiguousFromTopLeft(dataUrl, r, g, bb, tol, fea) : await applyChromaKey(dataUrl, r, g, bb, tol, fea);
    b = res.blob;
  }
  return b;
}
export {
  applySheetProPreprocess,
  sheetProPreprocessIsNoop
};
