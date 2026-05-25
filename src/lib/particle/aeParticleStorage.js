const STORAGE_KEY = 'pcf_ae_particle_presets_v1'

export function loadSavedPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePreset(name, project) {
  const list = loadSavedPresets()
  const entry = {
    id: `preset_${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    project,
  }
  list.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)))
  return entry
}

export function deletePreset(id) {
  const list = loadSavedPresets().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
