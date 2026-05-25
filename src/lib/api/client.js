import { API_BASE } from './config.js'

export class ApiError extends Error {
  constructor(status, body, path) {
    super(body?.message ?? `请求失败 (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.path = path
  }
}

function buildUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

export async function apiRequest(path, options = {}) {
  const { body, headers: extraHeaders, ...rest } = options
  const isForm = body instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...(isForm ? {} : body != null ? { 'Content-Type': 'application/json' } : {}),
    ...extraHeaders,
  }

  const res = await fetch(buildUrl(path), {
    ...rest,
    headers,
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let errBody = null
    try {
      errBody = await res.json()
    } catch {
      /* 非 JSON 错误体 */
    }
    throw new ApiError(res.status, errBody, path)
  }

  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

export async function fetchBlobFromApiPath(path) {
  const res = await fetch(buildUrl(path))
  if (!res.ok) throw new ApiError(res.status, null, path)
  return res.blob()
}
