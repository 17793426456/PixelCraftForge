import { apiRequest } from './client.js'

export function generateTextToImage({ prompt, width, height, style, category }) {
  return apiRequest('/api/element/generate', {
    method: 'POST',
    body: { prompt, width, height, style: style || undefined, category },
  })
}

export function generateImageToImage({ image, prompt, width, height, style, category }) {
  const form = new FormData()
  form.append('image', image)
  form.append('prompt', prompt)
  form.append('width', String(width))
  form.append('height', String(height))
  if (style) form.append('style', style)
  form.append('category', category)
  return apiRequest('/api/element/image-to-image', {
    method: 'POST',
    body: form,
  })
}

export function listGenerations({ page = 0, size = 20, type, category } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (type) params.set('type', type)
  if (category) params.set('category', category)
  return apiRequest(`/api/generations?${params}`)
}
