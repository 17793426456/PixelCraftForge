// FrameRonin-main/FrameRonin-main/frontend/src/lib/pixellise/imageDataOps.ts
function cloneImageData(src) {
  const out = new ImageData(src.width, src.height);
  out.data.set(src.data);
  return out;
}
function scaleNearestToSize(img, nw, nh) {
  const out = new ImageData(nw, nh);
  const iw = img.width;
  const ih = img.height;
  if (iw < 1 || ih < 1) return out;
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(ih - 1, Math.floor(y * ih / nh));
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(iw - 1, Math.floor(x * iw / nw));
      const si = (sy * iw + sx) * 4;
      const oi = (y * nw + x) * 4;
      out.data[oi] = img.data[si];
      out.data[oi + 1] = img.data[si + 1];
      out.data[oi + 2] = img.data[si + 2];
      out.data[oi + 3] = img.data[si + 3];
    }
  }
  return out;
}
function cropBorder(img, n) {
  const nw = img.width - 2 * n;
  const nh = img.height - 2 * n;
  if (nw < 1 || nh < 1) return cloneImageData(img);
  const out = new ImageData(nw, nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const si = ((y + n) * img.width + (x + n)) * 4;
      const oi = (y * nw + x) * 4;
      out.data.set(img.data.subarray(si, si + 4), oi);
    }
  }
  return out;
}
var ALPHA_THRESHOLD = 128;
function rgbDist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}
var BG_CANDIDATES = [
  [0, 255, 255],
  [255, 255, 255],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [255, 0, 255],
  [255, 128, 0],
  [128, 0, 255],
  [0, 128, 255],
  [0, 255, 128],
  [255, 0, 128]
];
function clampAlphaCompositeForEdges(img) {
  const w = img.width;
  const h = img.height;
  const counts = /* @__PURE__ */ new Map();
  const stepX = Math.max(1, Math.floor(w / 160));
  const stepY = Math.max(1, Math.floor(h / 160));
  for (let y = 0; y < h; y += stepY) {
    for (let x = 0; x < w; x += stepX) {
      const i = (y * w + x) * 4;
      if (img.data[i + 3] < ALPHA_THRESHOLD) continue;
      const key = `${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const top = [];
  for (const [k, _] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    const p = k.split(",").map(Number);
    top.push(p);
  }
  let bg = [255, 255, 255];
  if (top.length > 0) {
    let best = BG_CANDIDATES[0];
    let bestScore = -1;
    for (const c of BG_CANDIDATES) {
      const score = Math.min(...top.map((t) => rgbDist(c, t)));
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    bg = best;
  }
  const out = new ImageData(w, h);
  for (let i = 0; i < out.data.length; i += 4) {
    if (img.data[i + 3] >= ALPHA_THRESHOLD) {
      out.data[i] = img.data[i];
      out.data[i + 1] = img.data[i + 1];
      out.data[i + 2] = img.data[i + 2];
      out.data[i + 3] = 255;
    } else {
      out.data[i] = bg[0];
      out.data[i + 1] = bg[1];
      out.data[i + 2] = bg[2];
      out.data[i + 3] = 255;
    }
  }
  return out;
}
async function fileToImageData(file) {
  const bmp = await createImageBitmap(file);
  try {
    const w = bmp.width;
    const h = bmp.height;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    return ctx.getImageData(0, 0, w, h);
  } finally {
    bmp.close();
  }
}
function imageDataToPngBlob(data) {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d").putImageData(data, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), "image/png");
  });
}
function copyImageDataBuffer(data) {
  const len = data.data.byteLength;
  const ab = new ArrayBuffer(len);
  new Uint8Array(ab).set(new Uint8Array(data.data.buffer, data.data.byteOffset, len));
  return ab;
}

// FrameRonin-main/FrameRonin-main/frontend/src/lib/pixellise/opencv.ts
async function waitUntilMatUsable(cv, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const m = new cv.Mat(1, 1, cv.CV_8UC1);
      m.delete();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 40));
    }
  }
  throw new Error("OpenCV Mat not usable (timeout)");
}
async function resolveImportedCv() {
  const opencvStar = await import("@techstark/opencv-js");
  const cvModuleRaw = opencvStar.default ?? opencvStar;
  let cv;
  if (cvModuleRaw instanceof Promise) {
    cv = await cvModuleRaw;
  } else if (cvModuleRaw.Mat) {
    cv = cvModuleRaw;
  } else {
    const mod = cvModuleRaw;
    try {
      await Promise.race([
        new Promise((resolve) => {
          const prev = mod.onRuntimeInitialized;
          mod.onRuntimeInitialized = () => {
            prev?.();
            resolve();
          };
        }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("opencv init timeout")), 15e3)
        )
      ]);
    } catch {
      await waitUntilMatUsable(mod, 15e3);
    }
    cv = mod;
  }
  if (typeof cv?.then === "function") {
    delete cv.then;
  }
  return cv;
}
var loadOpenCvPromise = null;
function loadOpenCv() {
  if (!loadOpenCvPromise) {
    loadOpenCvPromise = resolveImportedCv();
  }
  return loadOpenCvPromise;
}

// FrameRonin-main/FrameRonin-main/frontend/src/lib/pixellise/mesh.ts
function median(sortedOrArr) {
  const s = [...sortedOrArr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = p / 100 * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}
function clusterLines(lines, threshold = 4) {
  if (lines.length === 0) return [];
  const sorted = [...lines].sort((a, b) => a - b);
  const clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i];
    const last = clusters[clusters.length - 1];
    const lastVal = last[last.length - 1];
    if (Math.abs(p - lastVal) <= threshold) last.push(p);
    else clusters.push([p]);
  }
  return clusters.map((c) => Math.round(median(c)));
}
function detectGridLines(cv, closed) {
  const width = closed.cols;
  const height = closed.rows;
  const lines = new cv.Mat();
  const houghThreshold = 100;
  const minLineLength = 50;
  const maxLineGap = 10;
  const deg15 = 15 * Math.PI / 180;
  const deg75 = 75 * Math.PI / 180;
  let linesX = [0, width - 1];
  let linesY = [0, height - 1];
  try {
    cv.HoughLinesP(closed, lines, 1, Math.PI / 180, houghThreshold, minLineLength, maxLineGap);
    if (lines.rows > 0 && lines.data32S) {
      const d = lines.data32S;
      const rowStride = 4;
      for (let i = 0; i < lines.rows; i++) {
        const o = i * rowStride;
        if (o + 3 >= d.length) break;
        const x1 = d[o];
        const y1 = d[o + 1];
        const x2 = d[o + 2];
        const y2 = d[o + 3];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.abs(Math.atan2(dy, dx));
        if (angle > deg75) {
          linesX.push(Math.round((x1 + x2) / 2));
        } else if (angle < deg15) {
          linesY.push(Math.round((y1 + y2) / 2));
        }
      }
    }
    linesX = clusterLines(linesX, 4);
    linesY = clusterLines(linesY, 4);
    return [linesX, linesY];
  } finally {
    lines.delete();
  }
}
function getPixelWidth(mesh, trimOutlierFraction = 0.2) {
  const gaps = [];
  for (const L of mesh) {
    for (let i = 0; i < L.length - 1; i++) gaps.push(L[i + 1] - L[i]);
  }
  if (gaps.length === 0) return 8;
  gaps.sort((a, b) => a - b);
  const low = percentile(gaps, 100 * trimOutlierFraction);
  const hi = percentile(gaps, 100 * (1 - trimOutlierFraction));
  const middle = gaps.filter((g) => g >= low && g <= hi);
  const use = middle.length > 0 ? middle : gaps;
  return median(use);
}
function homogenizeLines(lines, pixelWidth) {
  const n = lines.length;
  if (n < 2) return [...lines];
  const sectionWidths = [];
  for (let i = 0; i < n - 1; i++) sectionWidths.push(lines[i + 1] - lines[i]);
  const pieces = [];
  for (let index = 0; index < n - 1; index++) {
    const lineStart = lines[index];
    const sectionWidth = sectionWidths[index];
    let numPixels = Math.round(sectionWidth / pixelWidth);
    if (numPixels <= 0) {
      pieces.push([]);
      continue;
    }
    const sectionPixelWidth = sectionWidth / numPixels;
    const sectionLines = [];
    for (let nn = 0; nn < numPixels; nn++) {
      sectionLines.push(lineStart + Math.floor(nn * sectionPixelWidth));
    }
    pieces.push(sectionLines);
  }
  const flat = pieces.flat();
  flat.push(lines[n - 1]);
  return [...new Set(flat)].sort((a, b) => a - b);
}
function isTrivialMesh(mesh) {
  const xn = mesh[0].length;
  const yn = mesh[1].length;
  return (xn === 2 || xn === 3) && (yn === 2 || yn === 3);
}
function computeMeshOnImage(cv, rgba, closureKernelSize = 8) {
  const cropped = cropBorder(rgba, 2);
  const cw = cropped.width;
  const ch = cropped.height;
  if (cw < 16 || ch < 16) {
    return [
      [0, cw - 1],
      [0, ch - 1]
    ];
  }
  const composite = clampAlphaCompositeForEdges(cropped);
  const src = cv.matFromImageData(composite);
  const gray = new cv.Mat();
  const edges = new cv.Mat();
  const closed = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(closureKernelSize, closureKernelSize));
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, 50, 200);
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
    let meshInitial = detectGridLines(cv, closed);
    const pixelWidth = Math.max(2, Math.round(getPixelWidth(meshInitial)));
    let linesX = homogenizeLines(meshInitial[0], pixelWidth);
    let linesY = homogenizeLines(meshInitial[1], pixelWidth);
    return [linesX, linesY];
  } finally {
    src.delete();
    gray.delete();
    edges.delete();
    kernel.delete();
    closed.delete();
  }
}
function shiftCroppedMeshToFull(mesh, fullW, fullH) {
  const vx = /* @__PURE__ */ new Set([0]);
  for (const x of mesh[0]) vx.add(x + 2);
  vx.add(fullW);
  const hy = /* @__PURE__ */ new Set([0]);
  for (const y of mesh[1]) hy.add(y + 2);
  hy.add(fullH);
  return [[...vx].sort((a, b) => a - b), [...hy].sort((a, b) => a - b)];
}
function fallbackUniformMesh(fullW, fullH, cell) {
  const c = Math.max(4, Math.floor(cell));
  const vx = [0];
  for (let x = c; x < fullW; x += c) vx.push(x);
  if (vx[vx.length - 1] < fullW) vx.push(fullW);
  const ys = [0];
  for (let y = c; y < fullH; y += c) ys.push(y);
  if (ys[ys.length - 1] < fullH) ys.push(fullH);
  return [vx, ys];
}
function computeMeshWithScaling(cv, input, upscale) {
  const W = input.width;
  const H = input.height;
  const u = Math.max(1, Math.min(7, Math.floor(upscale)));
  const scaledW = Math.round(W * u);
  const scaledH = Math.round(H * u);
  const upscaled = scaleNearestToSize(input, scaledW, scaledH);
  let meshCrop = computeMeshOnImage(cv, upscaled);
  let scaleUsed = u;
  if (isTrivialMesh(meshCrop)) {
    meshCrop = computeMeshOnImage(cv, input);
    scaleUsed = 1;
  }
  const fw = scaleUsed === 1 ? W : scaledW;
  const fh = scaleUsed === 1 ? H : scaledH;
  let mesh = shiftCroppedMeshToFull(meshCrop, fw, fh);
  if (mesh[0].length < 3 || mesh[1].length < 3) {
    mesh = fallbackUniformMesh(fw, fh, Math.max(8, Math.min(fw, fh) / 24));
  }
  return { mesh, scaleUsed, scaledWidth: fw, scaledHeight: fh };
}

// FrameRonin-main/FrameRonin-main/frontend/src/lib/pixellise/workerBridge.ts
var WORKER_TIMEOUT_MS = 5 * 60 * 1e3;
function runWorkerProcessing(imageData, mesh, opts, bridgeOpts) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./pixelliseWorker.js", import.meta.url), { type: "module" });
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Worker timeout"));
    }, WORKER_TIMEOUT_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };
    worker.onerror = (ev) => {
      cleanup();
      reject(new Error(ev.message || "Worker error"));
    };
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "progress") {
        bridgeOpts?.onProgress?.(msg.message, msg.percent);
        return;
      }
      if (msg.type === "error") {
        cleanup();
        reject(new Error(msg.message));
        return;
      }
      if (msg.type === "result") {
        cleanup();
        const arr = new Uint8ClampedArray(msg.imageBuffer);
        resolve(new ImageData(arr, msg.width, msg.height));
      }
    };
    const imageBuffer = copyImageDataBuffer(imageData);
    const input = {
      imageBuffer,
      width: imageData.width,
      height: imageData.height,
      mesh,
      scaledWidth: opts.scaledWidth,
      scaledHeight: opts.scaledHeight,
      numColors: opts.numColors,
      scaleResult: opts.scaleResult,
      transparentBackground: opts.transparentBackground
    };
    worker.postMessage(input, [imageBuffer]);
  });
}

// FrameRonin-main/FrameRonin-main/frontend/src/lib/pixellise/safeUpscale.ts
var PIXELLISE_MAX_SCALED_PIXELS = 42e6;
function maxSafeUpscaleForImage(width, height, cap = PIXELLISE_MAX_SCALED_PIXELS) {
  for (let u = 7; u >= 1; u--) {
    const sw = Math.round(width * u);
    const sh = Math.round(height * u);
    if (sw > 0 && sh > 0 && sw * sh <= cap) return u;
  }
  return 1;
}

// FrameRonin-main/FrameRonin-main/frontend/src/lib/pixellise/pipeline.ts
function yieldToBrowser() {
  return new Promise((r) => setTimeout(r, 0));
}
async function runPixelliseRestore(file, options, onStatus) {
  onStatus("pixelateAdvancedProgressLoadImage");
  await yieldToBrowser();
  const input = await fileToImageData(file);
  onStatus("pixelateAdvancedProgressOpenCv");
  await yieldToBrowser();
  const cv = await loadOpenCv();
  onStatus("pixelateAdvancedProgressMesh");
  await yieldToBrowser();
  const requested = Math.max(1, Math.min(7, Math.floor(options.upscale)));
  const maxU = maxSafeUpscaleForImage(input.width, input.height);
  const u = Math.min(requested, maxU);
  const upscaleCapped = u < requested;
  const { mesh, scaledWidth, scaledHeight } = computeMeshWithScaling(cv, input, u);
  onStatus("pixelateAdvancedProgressWorker");
  await yieldToBrowser();
  const resultImage = await runWorkerProcessing(input, mesh, {
    scaledWidth,
    scaledHeight,
    numColors: options.numColors,
    scaleResult: Math.max(1, Math.min(5, Math.floor(options.scaleResult))),
    transparentBackground: options.transparentBackground
  });
  onStatus("pixelateAdvancedProgressEncode");
  await yieldToBrowser();
  const blob = await imageDataToPngBlob(resultImage);
  return { blob, upscaleUsed: u, upscaleCapped, upscaleRequested: requested };
}
export {
  PIXELLISE_MAX_SCALED_PIXELS,
  maxSafeUpscaleForImage,
  runPixelliseRestore
};
