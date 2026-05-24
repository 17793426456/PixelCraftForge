import { addAssetFromFile } from './localAssetStore.js'

export async function saveBlobToLibrary(blob, filename, meta = {}) {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
  return addAssetFromFile(file, meta)
}

export async function saveDataUrlToLibrary(dataUrl, filename, meta = {}) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return saveBlobToLibrary(blob, filename, meta)
}

export async function saveCanvasToLibrary(canvas, filename, meta = {}) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png')
  })
  return saveBlobToLibrary(blob, filename, meta)
}
