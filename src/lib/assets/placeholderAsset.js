/** 本地演示用占位图（无 AI API 时生成可入库的 PNG） */
export function createPlaceholderPngBlob({ name, style, sizePx = 64, seed = 0 }) {
  const n = Math.min(512, Math.max(32, parseInt(String(sizePx).replace(/\D/g, ''), 10) || 64))
  const canvas = document.createElement('canvas')
  canvas.width = n
  canvas.height = n
  const ctx = canvas.getContext('2d')
  const hue = (seed * 47 + name.length * 13) % 360
  ctx.fillStyle = `hsl(${hue} 45% 22%)`
  ctx.fillRect(0, 0, n, n)
  ctx.fillStyle = `hsl(${hue} 70% 55%)`
  const pad = Math.floor(n * 0.15)
  ctx.fillRect(pad, pad, n - pad * 2, n - pad * 2)
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${Math.max(10, Math.floor(n / 6))}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.slice(0, 4), n / 2, n / 2)
  ctx.font = `${Math.max(8, Math.floor(n / 10))}px sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText(style?.slice(0, 4) ?? '像素', n / 2, n * 0.78)
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
