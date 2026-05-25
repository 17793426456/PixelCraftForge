/** 开发环境走 Vite 代理时留空；生产可设 VITE_API_BASE=https://api.example.com */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export const VIDEO_POLL_INTERVAL_MS = Number(import.meta.env.VITE_VIDEO_POLL_INTERVAL_MS) || 10_000
export const VIDEO_POLL_MAX_ATTEMPTS = Number(import.meta.env.VITE_VIDEO_POLL_MAX_ATTEMPTS) || 120

/** 运行时由 /api/config 覆盖的轮询参数 */
export function applyRuntimeConfig(cfg) {
  if (!cfg) return
  if (cfg.videoPollIntervalMs) runtime.videoPollIntervalMs = cfg.videoPollIntervalMs
  if (cfg.videoPollMaxAttempts) runtime.videoPollMaxAttempts = cfg.videoPollMaxAttempts
  if (cfg.mediaBaseUrl != null) runtime.mediaBaseUrl = cfg.mediaBaseUrl
  if (cfg.storageType) runtime.storageType = cfg.storageType
}

const runtime = {
  videoPollIntervalMs: VIDEO_POLL_INTERVAL_MS,
  videoPollMaxAttempts: VIDEO_POLL_MAX_ATTEMPTS,
  mediaBaseUrl: '',
  storageType: 'local',
}

export function getRuntimeConfig() {
  return runtime
}

export function getVideoPollIntervalMs() {
  return runtime.videoPollIntervalMs
}

export function getVideoPollMaxAttempts() {
  return runtime.videoPollMaxAttempts
}

export function getMediaBaseUrl() {
  return runtime.mediaBaseUrl
}
