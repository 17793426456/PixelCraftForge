/** 本地演示用占位图（无 AI API 时生成可入库的 PNG） */
export function ratioToDimensions(ratio, base = 256) {
  const parts = String(ratio || '1:1').split(':').map(Number)
  const w = parts[0] || 1
  const h = parts[1] || 1
  if (w >= h) return { width: base, height: Math.max(32, Math.round((base * h) / w)) }
  return { width: Math.max(32, Math.round((base * w) / h)), height: base }
}

export function createPlaceholderPngBlob({ name, style, sizePx = 64, seed = 0, prompt = '', width, height }) {
  const fromRatio = width && height ? { width, height } : null
  const n = fromRatio?.width ?? Math.min(512, Math.max(32, parseInt(String(sizePx).replace(/\D/g, ''), 10) || 64))
  const nh = fromRatio?.height ?? n
  const canvas = document.createElement('canvas')
  canvas.width = n
  canvas.height = nh
  const ctx = canvas.getContext('2d')
  const hue = (seed * 47 + name.length * 13 + (prompt.length * 3)) % 360
  ctx.fillStyle = `hsl(${hue} 45% 18%)`
  ctx.fillRect(0, 0, n, nh)
  const grad = ctx.createLinearGradient(0, 0, n, nh)
  grad.addColorStop(0, `hsl(${hue} 55% 35%)`)
  grad.addColorStop(1, `hsl(${(hue + 40) % 360} 50% 28%)`)
  ctx.fillStyle = grad
  const pad = Math.floor(Math.min(n, nh) * 0.12)
  ctx.fillRect(pad, pad, n - pad * 2, nh - pad * 2)
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${Math.max(10, Math.floor(Math.min(n, nh) / 6))}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.slice(0, 6), n / 2, nh / 2 - 8)
  ctx.font = `${Math.max(8, Math.floor(Math.min(n, nh) / 10))}px sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText(style?.slice(0, 6) ?? '像素风', n / 2, nh / 2 + 12)
  if (prompt) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `${Math.max(7, Math.floor(Math.min(n, nh) / 14))}px sans-serif`
    ctx.fillText(prompt.slice(0, 10), n / 2, nh - pad - 6)
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('生成失败'))), 'image/png')
  })
}

export async function placeholderBlobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
