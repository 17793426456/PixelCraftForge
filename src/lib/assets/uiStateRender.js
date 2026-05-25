export const HOVER_FRAME_COUNT = 8

export const UI_KIT_STATES = [
  { key: 'normal', label: '普通', filter: 'none' },
  { key: 'hover', label: '选中', animated: true },
  { key: 'disabled', label: '禁用', filter: 'grayscale(1) opacity(0.55)' },
]

function loadImageFromBlob(blob) {
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => {
      URL.revokeObjectURL(url)
      resolve(el)
    }
    el.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    el.src = url
  })
}

async function canvasToOutputs(canvas) {
  const previewUrl = canvas.toDataURL('image/png')
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  return { previewUrl, blob }
}

function drawFilteredFrame(img, w, h, { filter = 'none', scale = 1 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const sw = w * scale
  const sh = h * scale
  const dx = (w - sw) / 2
  const dy = (h - sh) / 2
  ctx.filter = filter
  ctx.drawImage(img, dx, dy, sw, sh)
  return canvas
}

/** 生成 hover 循环动效帧（正弦呼吸：亮度 / 饱和度 / 微缩放） */
export function renderHoverAnimationFrames(img, w, h, frameCount = HOVER_FRAME_COUNT) {
  const frames = []
  for (let i = 0; i < frameCount; i++) {
    const phase = (i / frameCount) * Math.PI * 2
    const t = 0.5 + 0.5 * Math.sin(phase)
    const brightness = 1 + 0.14 * t
    const saturate = 1 + 0.22 * t
    const scale = 1 + 0.06 * t
    const filter = `brightness(${brightness}) saturate(${saturate})`
    frames.push(drawFilteredFrame(img, w, h, { filter, scale }))
  }
  return frames
}

export async function renderUiKitStatesFromSource(source, scale = 1) {
  let blob = source
  if (source instanceof HTMLCanvasElement) {
    blob = await new Promise((r) => source.toBlob(r, 'image/png'))
  }

  const img = await loadImageFromBlob(blob)
  let w = img.naturalWidth * scale
  let h = img.naturalHeight * scale

  const out = {}

  for (const s of UI_KIT_STATES) {
    if (s.key === 'hover' && s.animated) {
      const canvases = renderHoverAnimationFrames(img, w, h)
      const frames = await Promise.all(canvases.map((c) => canvasToOutputs(c)))
      const peak = frames[Math.floor(frames.length / 4)] ?? frames[0]
      out.hover = {
        label: s.label,
        animated: true,
        frames,
        previewUrl: peak.previewUrl,
        blob: peak.blob,
      }
      continue
    }

    const canvas = drawFilteredFrame(img, w, h, { filter: s.filter ?? 'none' })
    const { previewUrl, blob: pngBlob } = await canvasToOutputs(canvas)
    out[s.key] = { previewUrl, blob: pngBlob, label: s.label }
  }

  return out
}
