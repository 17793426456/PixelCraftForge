import { addAssetFromFile } from './localAssetStore.js'
import { ensureResultBlob, guessMediaExtension } from '../api/mediaUrl.js'

export async function saveBlobToLibrary(blob, filename, meta = {}) {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
  return addAssetFromFile(file, meta)
}

/** 图片/视频生成结果一键入库 */
export async function saveGeneratedItemToLibrary(item, options = {}) {
  const blob = await ensureResultBlob(item)
  const ext = guessMediaExtension(blob, options.defaultExt ?? 'png')
  const baseName = options.name ?? item?.name ?? `素材_${Date.now()}`
  const filename = baseName.includes('.') ? baseName : `${baseName}.${ext}`
  const isVideo = (blob.type || '').startsWith('video/') || ext === 'mp4' || ext === 'webm'
  return saveBlobToLibrary(blob, filename, {
    name: baseName.replace(/\.[^.]+$/, ''),
    funcType: isVideo ? '动态类' : (options.funcType ?? '角色类'),
    matType: isVideo ? '视频素材' : (options.matType ?? '卡通极简材质'),
    folder: options.folder ?? (isVideo ? '视频生成' : '图片生成'),
    style: options.style ?? item?.model ?? '像素风',
    ...options.meta,
  })
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
