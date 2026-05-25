// Gemini 可见水印逆向 alpha 去除（参考 GeminiWatermarkTool / FrameRonin）

const BG_48_BASE64 = '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'

/** 官方常见导出尺寸 → 水印布局（Gemini 3.x / 2.5） */
const OFFICIAL_SIZE_CONFIGS = [
  [512, 512, 48, 32, 32],
  [1024, 1024, 96, 64, 64],
  [1344, 768, 96, 64, 64],
  [768, 1344, 96, 64, 64],
  [1408, 768, 96, 64, 64],
  [2816, 1536, 96, 192, 192],
  [1536, 2816, 96, 192, 192],
  [2048, 2048, 96, 64, 64],
]

function configKey(c) {
  return `${c.logoSize}:${c.marginRight}:${c.marginBottom}`
}

export function getWatermarkParams(imgWidth, imgHeight, logoSize) {
  const marginRight = logoSize >= 96 ? 64 : logoSize >= 48 ? 32 : 24
  const marginBottom = marginRight
  return {
    size: logoSize,
    margin: marginRight,
    x: imgWidth - marginRight - logoSize,
    y: imgHeight - marginBottom - logoSize,
    marginRight,
    marginBottom,
    logoSize,
  }
}

export function getWatermarkSize(imgWidth, imgHeight) {
  return imgWidth > 1024 && imgHeight > 1024 ? 96 : 48
}

export function getWatermarkPosition(imgWidth, imgHeight, size) {
  const { x, y } = getWatermarkParams(imgWidth, imgHeight, size)
  return { x, y }
}

/** 收集候选水印布局（自动 + 旧版 + Gemini 3.5 小标） */
export function getCandidateWatermarkConfigs(imgWidth, imgHeight) {
  const seen = new Set()
  const list = []
  const add = (logoSize, marginRight, marginBottom) => {
    const c = { logoSize, marginRight, marginBottom }
    const key = configKey(c)
    if (seen.has(key)) return
    if (imgWidth - marginRight - logoSize < 0 || imgHeight - marginBottom - logoSize < 0) return
    seen.add(key)
    list.push(c)
  }

  for (const [w, h, logo, mr, mb] of OFFICIAL_SIZE_CONFIGS) {
    if (w === imgWidth && h === imgHeight) add(logo, mr, mb)
  }

  if (imgWidth > 1024 && imgHeight > 1024) {
    add(96, 64, 64)
    add(48, 32, 32)
  } else {
    add(48, 32, 32)
    add(96, 64, 64)
  }

  add(36, 24, 24)
  add(36, 28, 28)
  add(36, 32, 32)
  add(96, 192, 192)

  return list
}

function alphaMapFromBgCapture(bgPixels, width, height, channels) {
  const alpha = new Float32Array(width * height)
  for (let i = 0; i < width * height; i += 1) {
    const off = i * channels
    const r = bgPixels[off] ?? 0
    const g = bgPixels[off + 1] ?? 0
    const b = bgPixels[off + 2] ?? 0
    const gray = Math.max(r, g, b)
    alpha[i] = gray / 255
  }
  return alpha
}

export function removeWatermarkReverseAlpha(imageData, alphaMap, mapWidth, mapHeight, x, y, logoValue = 255, alphaScale = 1) {
  const { data, width, height } = imageData
  const alphaThreshold = 2e-3
  const maxAlpha = 0.99
  const x1 = Math.max(0, x)
  const y1 = Math.max(0, y)
  const x2 = Math.min(width, x + mapWidth)
  const y2 = Math.min(height, y + mapHeight)

  for (let py = y1; py < y2; py += 1) {
    for (let px = x1; px < x2; px += 1) {
      const alphaIdx = (py - y) * mapWidth + (px - x)
      if (alphaIdx < 0 || alphaIdx >= alphaMap.length) continue
      let alpha = Math.min(alphaMap[alphaIdx] ?? 0, maxAlpha) * alphaScale
      if (alpha < alphaThreshold) continue
      alpha = Math.min(alpha, maxAlpha)
      const oneMinusAlpha = 1 - alpha
      if (oneMinusAlpha < 1e-6) continue
      const i = (py * width + px) * 4
      for (let c = 0; c < 3; c += 1) {
        const watermarked = data[i + c] ?? 0
        const original = (watermarked - alpha * logoValue) / oneMinusAlpha
        data[i + c] = Math.round(Math.max(0, Math.min(255, original)))
      }
    }
  }
}

function scaleAlphaMap(source, srcSize, dstSize) {
  if (srcSize === dstSize) return source
  const out = new Float32Array(dstSize * dstSize)
  for (let ty = 0; ty < dstSize; ty += 1) {
    for (let tx = 0; tx < dstSize; tx += 1) {
      const sx = (tx + 0.5) * (srcSize / dstSize) - 0.5
      const sy = (ty + 0.5) * (srcSize / dstSize) - 0.5
      const x0 = Math.max(0, Math.floor(sx))
      const x1 = Math.min(srcSize - 1, x0 + 1)
      const y0 = Math.max(0, Math.floor(sy))
      const y1 = Math.min(srcSize - 1, y0 + 1)
      const fx = sx - x0
      const fy = sy - y0
      const v00 = source[y0 * srcSize + x0] ?? 0
      const v10 = source[y0 * srcSize + x1] ?? 0
      const v01 = source[y1 * srcSize + x0] ?? 0
      const v11 = source[y1 * srcSize + x1] ?? 0
      out[ty * dstSize + tx] = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy
    }
  }
  return out
}

let alpha48Cache = null

async function loadAlpha48() {
  if (alpha48Cache) return alpha48Cache
  alpha48Cache = await loadAlphaMaskFromUrl(`data:image/png;base64,${BG_48_BASE64}`)
  return alpha48Cache
}

export async function getEmbeddedAlphaMask(size) {
  const base = await loadAlpha48()
  if (size === 48) {
    return { alpha: base.alpha, width: 48, height: 48 }
  }
  if (size === 96) {
    return { alpha: scaleAlphaMap(base.alpha, 48, 96), width: 96, height: 96 }
  }
  if (size === 36) {
    return { alpha: scaleAlphaMap(base.alpha, 48, 36), width: 36, height: 36 }
  }
  const scaled = scaleAlphaMap(base.alpha, 48, size)
  return { alpha: scaled, width: size, height: size }
}

export async function loadAlphaMaskFromUrl(url) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.crossOrigin = 'anonymous'
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const alpha = alphaMapFromBgCapture(id.data, canvas.width, canvas.height, 4)
  return { alpha, width: canvas.width, height: canvas.height }
}

function cloneImageData(imageData) {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  )
}

function measureRegionDiff(before, after, x, y, regionW, regionH, imgWidth) {
  let sum = 0
  let n = 0
  const x2 = Math.min(imgWidth, x + regionW)
  const y2 = Math.min(before.height, y + regionH)
  for (let py = Math.max(0, y); py < y2; py += 1) {
    for (let px = Math.max(0, x); px < x2; px += 1) {
      const i = (py * imgWidth + px) * 4
      for (let c = 0; c < 3; c += 1) {
        sum += Math.abs((before.data[i + c] ?? 0) - (after.data[i + c] ?? 0))
        n += 1
      }
    }
  }
  return n > 0 ? sum / n : 0
}

async function applyConfigToImageData(imageData, config) {
  const { logoSize, marginRight, marginBottom } = config
  const w = imageData.width
  const h = imageData.height
  const x = w - marginRight - logoSize
  const y = h - marginBottom - logoSize
  if (x < 0 || y < 0) return null

  let alphaMap
  let mapW
  let mapH
  try {
    const loaded = await getEmbeddedAlphaMask(logoSize)
    alphaMap = loaded.alpha
    mapW = loaded.width
    mapH = loaded.height
  } catch {
    alphaMap = createApproxAlphaMap(logoSize)
    mapW = logoSize
    mapH = logoSize
  }

  const clone = cloneImageData(imageData)
  removeWatermarkReverseAlpha(clone, alphaMap, mapW, mapH, x, y, 255, 1)
  const diff = measureRegionDiff(imageData, clone, x, y, logoSize, logoSize, w)
  return { imageData: clone, diff, config, position: { x, y, width: logoSize, height: logoSize } }
}

/**
 * 自动尝试多种 Gemini 水印布局，选取右下角变化最明显且合理的一项
 */
export async function removeGeminiWatermarkFromImageData(sourceImageData) {
  const configs = getCandidateWatermarkConfigs(sourceImageData.width, sourceImageData.height)
  let best = null

  for (const config of configs) {
    const result = await applyConfigToImageData(sourceImageData, config)
    if (!result) continue
    if (!best || result.diff > best.diff) {
      best = result
    }
  }

  if (!best || best.diff < 2.5) {
    return {
      imageData: cloneImageData(sourceImageData),
      detected: false,
      diff: best?.diff ?? 0,
      config: null,
    }
  }

  return {
    imageData: best.imageData,
    detected: true,
    diff: best.diff,
    config: best.config,
    position: best.position,
  }
}

export async function removeGeminiWatermarkFromBlob(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('ERR_READ'))
    r.readAsDataURL(blob)
  })
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const result = await removeGeminiWatermarkFromImageData(source)
  ctx.putImageData(result.imageData, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          reject(new Error('ERR_TOBLOB'))
          return
        }
        resolve({ blob: b, ...result })
      },
      'image/png',
      0.95,
    )
  })
}

export function createApproxAlphaMap(size) {
  const alpha = new Float32Array(size * size)
  const cx = size / 2
  const cy = size / 2
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      const r = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      const star = Math.abs(Math.sin(angle * 4)) * 0.5 + 0.5
      const radial = Math.max(0, 1 - r * (1.2 - star * 0.3))
      alpha[y * size + x] = Math.min(1, radial * 0.6)
    }
  }
  return alpha
}
