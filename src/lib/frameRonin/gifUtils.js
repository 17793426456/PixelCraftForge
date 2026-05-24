import { parseGIF, decompressFrames } from 'gifuct-js'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

export function compositeGifFrame(prevBuf, frame, width, height) {
  const buf = new Uint8ClampedArray(prevBuf)
  const { patch, dims, disposalType = 1 } = frame
  const { top, left, width: pw, height: ph } = dims

  if (disposalType === 2) {
    buf.fill(0)
  }

  for (let py = 0; py < ph; py += 1) {
    for (let px = 0; px < pw; px += 1) {
      const idx = (py * pw + px) * 4
      const a = patch[idx + 3]
      const outY = top + py
      const outX = left + px
      if (outY >= 0 && outY < height && outX >= 0 && outX < width) {
        const outIdx = (outY * width + outX) * 4
        if (a === 0) {
          buf[outIdx] = 0
          buf[outIdx + 1] = 0
          buf[outIdx + 2] = 0
          buf[outIdx + 3] = 0
        } else {
          buf[outIdx] = patch[idx]
          buf[outIdx + 1] = patch[idx + 1]
          buf[outIdx + 2] = patch[idx + 2]
          buf[outIdx + 3] = a
        }
      }
    }
  }
  return buf
}

export async function extractGifFrames(file) {
  const buffer = await file.arrayBuffer()
  const gif = parseGIF(buffer)
  const frames = decompressFrames(gif, true)
  const { width, height } = gif.lsd
  let composite = new Uint8ClampedArray(width * height * 4)
  const results = []

  for (const frame of frames) {
    composite = compositeGifFrame(composite, frame, width, height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const imageData = new ImageData(new Uint8ClampedArray(composite), width, height)
    ctx.putImageData(imageData, 0, 0)
    results.push({
      canvas,
      delay: frame.delay ?? 100,
      blob: await canvasToBlob(canvas),
    })
  }
  return results
}

export async function getGifInfo(file) {
  const buffer = await file.arrayBuffer()
  const gif = parseGIF(buffer)
  const frames = decompressFrames(gif, true)
  return {
    width: gif.lsd.width,
    height: gif.lsd.height,
    frameCount: frames.length,
  }
}

function canvasWithBackground(canvas, mode, bgColor = '#000000') {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (mode === 'solid') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, out.width, out.height)
  } else if (mode === 'original') {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, out.width, out.height)
  }
  ctx.drawImage(canvas, 0, 0)
  return out
}

export async function extractGifFramesWithOptions(file, options = {}) {
  const {
    frameStep = 1,
    startFrame = 1,
    endFrame = Infinity,
    bgMode = 'transparent',
    bgColor = '#000000',
  } = options

  const allFrames = await extractGifFrames(file)
  const start = Math.max(1, startFrame) - 1
  const end = Math.min(allFrames.length, endFrame === Infinity ? allFrames.length : endFrame)

  const picked = allFrames
    .slice(start, end)
    .filter((_, index) => index % Math.max(1, frameStep) === 0)

  if (bgMode === 'transparent') {
    return picked
  }

  return Promise.all(
    picked.map(async (frame) => {
      const canvas = canvasWithBackground(frame.canvas, bgMode, bgColor)
      return {
        ...frame,
        canvas,
        blob: await canvasToBlob(canvas),
      }
    }),
  )
}

export async function previewGifFrames(file, maxFrames = 12) {
  const frames = await extractGifFrames(file)
  return frames.slice(0, maxFrames)
}

export async function buildGifFromCanvases(canvases, delayMs = 100) {
  if (!canvases.length) throw new Error('没有可用帧')
  const width = canvases[0].width
  const height = canvases[0].height
  const gif = GIFEncoder()

  for (const canvas of canvases) {
    const ctx = canvas.getContext('2d')
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, canvas.width, canvas.height, {
      palette,
      delay: Math.max(20, delayMs),
      transparent: true,
      transparentIndex: 0,
    })
  }

  gif.finish()
  return new Blob([gif.bytes()], { type: 'image/gif' })
}

export async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function loadImagesFromFiles(files) {
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  return Promise.all(sorted.map((file) => loadImageFromFile(file)))
}

export function splitImageGrid(img, cols, rows) {
  const fullW = img.naturalWidth
  const fullH = img.naturalHeight
  const colsNum = Math.max(1, Math.floor(cols))
  const rowsNum = Math.max(1, Math.floor(rows))
  const results = []

  let idx = 0
  for (let row = 0; row < rowsNum; row += 1) {
    for (let col = 0; col < colsNum; col += 1) {
      const sx = Math.floor((col * fullW) / colsNum)
      const ex = Math.floor(((col + 1) * fullW) / colsNum)
      const sy = Math.floor((row * fullH) / rowsNum)
      const ey = Math.floor(((row + 1) * fullH) / rowsNum)
      const w = Math.max(1, ex - sx)
      const h = Math.max(1, ey - sy)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, sx, sy, w, h, 0, 0, w, h)
      results.push({ canvas, index: idx })
      idx += 1
    }
  }
  return results
}

export function combineCanvasesToSheet(canvases, columns, gap = 0) {
  if (!canvases.length) throw new Error('没有帧可合成')
  const cols = Math.max(1, columns)
  const rows = Math.ceil(canvases.length / cols)
  const cellW = Math.max(...canvases.map((c) => c.width))
  const cellH = Math.max(...canvases.map((c) => c.height))
  const sheet = document.createElement('canvas')
  sheet.width = cols * cellW + (cols - 1) * gap
  sheet.height = rows * cellH + (rows - 1) * gap
  const ctx = sheet.getContext('2d')
  canvases.forEach((canvas, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = col * (cellW + gap)
    const y = row * (cellH + gap)
    ctx.drawImage(canvas, x, y)
  })
  return sheet
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('导出失败'))
    }, type)
  })
}

export function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
