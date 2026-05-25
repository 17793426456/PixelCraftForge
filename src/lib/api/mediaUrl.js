import { API_BASE, getMediaBaseUrl } from './config.js'

/** 将后端返回路径转为可访问的原始 URL（不经代理） */
export function resolveMediaUrlRaw(url) {
  if (!url) return url
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  const ossBase = getMediaBaseUrl()
  if (ossBase && !url.startsWith('/uploads')) {
    const path = url.startsWith('/') ? url.slice(1) : url
    return `${ossBase.replace(/\/$/, '')}/${path}`
  }
  const path = url.startsWith('/') ? url : `/${url}`
  return `${API_BASE}${path}`
}

/** 是否需走后端代理（OSS 等跨域 fetch） */
export function isCrossOriginMediaUrl(url) {
  if (!url || /^(data:|blob:)/i.test(url)) return false
  if (url.includes('/api/media/proxy')) return false
  const full = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
  if (typeof window === 'undefined') {
    const ossBase = getMediaBaseUrl()
    return ossBase && full.startsWith(ossBase)
  }
  try {
    return new URL(full, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
}

/** 跨域资源转为同源代理地址 */
export function toMediaProxyUrl(url) {
  if (!url || !isCrossOriginMediaUrl(url)) return url
  const raw = url.startsWith('http') ? url : resolveMediaUrlRaw(url)
  return `${API_BASE}/api/media/proxy?url=${encodeURIComponent(raw)}`
}

/** 展示 / fetch 用 URL（跨域 OSS 自动走代理） */
export function resolveMediaUrl(url) {
  if (!url) return url
  return toMediaProxyUrl(resolveMediaUrlRaw(url))
}

export async function urlToBlob(url) {
  const full = resolveMediaUrl(url)
  const res = await fetch(full)
  if (!res.ok) throw new Error(`下载资源失败: ${res.status}`)
  return res.blob()
}
