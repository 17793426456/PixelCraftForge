const DB_NAME = 'pixelcraftforge_assets_v1'
const DB_VERSION = 1
const STORE = 'assets'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.objectStore
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        os.createIndex('funcType', 'funcType', { unique: false })
        os.createIndex('folder', 'folder', { unique: false })
      }
    }
  })
}

export async function listAssets() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

export async function addAssetFromFile(file, meta = {}) {
  const buffer = await file.arrayBuffer()
  const record = {
    name: meta.name ?? file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    funcType: meta.funcType ?? '道具物品类',
    matType: meta.matType ?? '卡通极简材质',
    folder: meta.folder ?? '默认',
    style: meta.style ?? '像素风',
    width: meta.width ?? null,
    height: meta.height ?? null,
    createdAt: new Date().toISOString(),
    data: buffer,
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).add(record)
    req.onsuccess = () => resolve({ ...record, id: req.result })
    req.onerror = () => reject(req.error)
  })
}

export async function updateAsset(id, patch) {
  const db = await openDb()
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  if (!existing) throw new Error('素材不存在')
  const next = { ...existing, ...patch, id }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(next)
    req.onsuccess = () => resolve(next)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteAsset(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export function assetToBlob(asset) {
  return new Blob([asset.data], { type: asset.mimeType })
}

export async function getImageDimensions(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    return { width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}
