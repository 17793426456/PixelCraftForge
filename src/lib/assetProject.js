const STORAGE_KEY = 'pixelcraftforge_project_snapshots'

export function loadProjectSnapshots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveProjectSnapshot({ name, assets, note = '' }) {
  const list = loadProjectSnapshots()
  const entry = {
    id: Date.now(),
    name,
    note,
    createdAt: new Date().toISOString(),
    assetCount: assets?.length ?? 0,
    assets,
  }
  list.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)))
  return entry
}

export function exportSceneLayoutJson(layout, meta = {}) {
  const payload = { version: 1, exportedAt: new Date().toISOString(), ...meta, layout }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}
