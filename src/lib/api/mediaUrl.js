import { API_BASE } from './config.js'

/** 将后端返回的 /uploads/... 转为可展示的完整 URL */
export function resolveMediaUrl(url) {
  if (!url) return url
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  const path = url.startsWith('/') ? url : `/${url}`
  return `${API_BASE}${path}`
}

export async function urlToBlob(url) {
  const full = resolveMediaUrl(url)
  const res = await fetch(full)
  if (!res.ok) throw new Error(`下载资源失败: ${res.status}`)
  return res.blob()
}
