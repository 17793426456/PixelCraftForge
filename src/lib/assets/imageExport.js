import JSZip from 'jszip'

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function blobToImage(blob) {
  const url = URL.createObjectURL(blob)
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

export async function convertImageBlob(blob, { format = 'image/png', quality = 0.92, maxEdge = null, rotate = 0 } = {}) {
  const img = await blobToImage(blob)
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (maxEdge && Math.max(w, h) > maxEdge) {
    const scale = maxEdge / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  const canvas = document.createElement('canvas')
  const rad = (rotate * Math.PI) / 180
  if (rotate % 180 !== 0) {
    canvas.width = h
    canvas.height = w
  } else {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  const out = await new Promise((resolve) => canvas.toBlob(resolve, format, quality))
  if (!out) throw new Error('转换失败')
  return out
}

export async function zipBlobs(entries, zipName = 'assets.zip') {
  const zip = new JSZip()
  for (const { name, blob } of entries) {
    zip.file(name, blob)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, zipName)
}

export const FORMAT_OPTIONS = [
  { label: 'PNG', value: 'image/png', ext: 'png' },
  { label: 'WebP', value: 'image/webp', ext: 'webp' },
  { label: 'JPEG', value: 'image/jpeg', ext: 'jpg' },
]
