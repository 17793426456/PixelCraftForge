const STORAGE_KEY = 'pcf_level_projects_v1'

export function loadLevelProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLevelProject(project) {
  const list = loadLevelProjects()
  const entry = {
    id: project.id ?? `level_${Date.now()}`,
    name: project.meta?.name ?? '未命名地图',
    savedAt: new Date().toISOString(),
    project,
  }
  const idx = list.findIndex((p) => p.id === entry.id)
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 15)))
  return entry
}

export function deleteLevelProject(id) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loadLevelProjects().filter((p) => p.id !== id)))
}

export function createEmptyProject({ view, gameType, tileSize, cols, rows }) {
  const empty = (fill) => Array.from({ length: rows }, () => Array(cols).fill(fill))
  return {
    id: `level_${Date.now()}`,
    meta: { name: '未命名地图', view, gameType, tileSize, cols, rows },
    layers: { background: empty(null), ground: empty(null) },
    layerState: {
      background: { visible: true, locked: false },
      ground: { visible: true, locked: false },
      decor: { visible: true, locked: false },
      collision: { visible: true, locked: false },
    },
    objects: [],
    collisions: [],
    aiRecommendations: [],
  }
}
