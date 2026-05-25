/** 开发环境走 Vite 代理时留空；生产可设 VITE_API_BASE=https://api.example.com */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export const VIDEO_POLL_INTERVAL_MS = 10_000
export const VIDEO_POLL_MAX_ATTEMPTS = 120
