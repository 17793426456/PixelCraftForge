import { apiRequest } from './client.js'

let cached = null

/** 拉取后端 /api/config（存储类型、媒体基址、轮询参数等） */
export async function fetchAppConfig({ force = false } = {}) {
  if (cached && !force) return cached
  try {
    cached = await apiRequest('/api/config')
  } catch {
    cached = null
  }
  return cached
}

export function getAppConfig() {
  return cached
}

export function clearAppConfigCache() {
  cached = null
}
