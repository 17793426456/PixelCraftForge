// FrameRonin-main/FrameRonin-main/frontend/src/lib/superSplitTransparent.ts
function findTransparentRows(imageData) {
  const { data, width, height } = imageData;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let allTransparent = true;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] !== 0) {
        allTransparent = false;
        break;
      }
    }
    if (allTransparent) rows.push(y);
  }
  return rows;
}
function findTransparentCols(imageData, y0, y1) {
  const { data, width } = imageData;
  const cols = [];
  for (let x = 0; x < width; x++) {
    let allTransparent = true;
    for (let y = y0; y < y1; y++) {
      if (data[(y * width + x) * 4 + 3] !== 0) {
        allTransparent = false;
        break;
      }
    }
    if (allTransparent) cols.push(x);
  }
  return cols;
}
function gapsFromRuns(runs, total) {
  if (runs.length === 0) return [[0, total - 1]];
  const regions = [];
  regions.push([0, runs[0][0] - 1]);
  for (let i = 0; i < runs.length - 1; i++) {
    regions.push([runs[i][1] + 1, runs[i + 1][0] - 1]);
  }
  regions.push([runs[runs.length - 1][1] + 1, total - 1]);
  return regions.filter(([a, b]) => a <= b);
}
function getRuns(arr) {
  if (arr.length === 0) return [];
  const runs = [];
  let runStart = arr[0];
  let runEnd = runStart;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === runEnd + 1) {
      runEnd = arr[i];
    } else {
      runs.push([runStart, runEnd]);
      runStart = arr[i];
      runEnd = runStart;
    }
  }
  runs.push([runStart, runEnd]);
  return runs;
}
async function superSplitByTransparent(img, baseName) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const srcData = ctx.getImageData(0, 0, w, h);
  const transparentRows = findTransparentRows(srcData);
  const rowRuns = getRuns(transparentRows);
  const rowRegions = gapsFromRuns(rowRuns, h);
  const frames = [];
  for (const [y0, y1] of rowRegions) {
    const rowHeight = y1 - y0 + 1;
    if (rowHeight <= 0) continue;
    const transparentCols = findTransparentCols(srcData, y0, y1 + 1);
    const colRuns = getRuns(transparentCols);
    const colRegions = gapsFromRuns(colRuns, w);
    for (const [x0, x1] of colRegions) {
      const colWidth = x1 - x0 + 1;
      if (colWidth <= 0) continue;
      frames.push({ x: x0, y: y0, w: colWidth, h: rowHeight });
    }
  }
  if (frames.length === 0) throw new Error("\u672A\u627E\u5230\u53EF\u62C6\u5206\u533A\u57DF");
  let maxW = 0;
  let maxH = 0;
  for (const f of frames) {
    maxW = Math.max(maxW, f.w);
    maxH = Math.max(maxH, f.h);
  }
  const outCanvas = document.createElement("canvas");
  outCanvas.width = maxW;
  outCanvas.height = maxH;
  const outCtx = outCanvas.getContext("2d");
  const outData = outCtx.createImageData(maxW, maxH);
  outData.data.fill(0);
  const files = [];
  let idx = 0;
  for (const f of frames) {
    outData.data.fill(0);
    const padTop = maxH - f.h;
    const padLeft = Math.floor((maxW - f.w) / 2);
    for (let dy = 0; dy < f.h; dy++) {
      for (let dx = 0; dx < f.w; dx++) {
        const srcIdx = ((f.y + dy) * w + (f.x + dx)) * 4;
        const dstIdx = ((padTop + dy) * maxW + (padLeft + dx)) * 4;
        outData.data[dstIdx] = srcData.data[srcIdx];
        outData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
        outData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
        outData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
      }
    }
    outCtx.putImageData(outData, 0, 0);
    const blob = await new Promise((resolve, reject) => {
      outCanvas.toBlob((b) => b ? resolve(b) : reject(new Error("canvas")), "image/png");
    });
    files.push(new File([blob], `${baseName}_super_${idx}.png`, { type: "image/png" }));
    idx++;
  }
  return files;
}
export {
  superSplitByTransparent
};
