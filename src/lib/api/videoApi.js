import { apiRequest } from './client.js'
import { getVideoPollIntervalMs, getVideoPollMaxAttempts } from './config.js'

export function createTextToVideo(body) {
  return apiRequest('/api/video/generate', {
    method: 'POST',
    body,
  })
}

export function createImageToVideo({ image, lastImage, prompt, ratio, duration, resolution, generateAudio, watermark, category }) {
  const form = new FormData()
  form.append('image', image)
  if (lastImage) form.append('lastImage', lastImage)
  form.append('prompt', prompt)
  form.append('ratio', ratio)
  form.append('duration', String(duration))
  form.append('resolution', resolution)
  form.append('generateAudio', String(generateAudio ?? true))
  form.append('watermark', String(watermark ?? false))
  form.append('category', category)
  return apiRequest('/api/video/image-to-video', {
    method: 'POST',
    body: form,
  })
}

export function getVideoTask(taskId) {
  return apiRequest(`/api/video/tasks/${encodeURIComponent(taskId)}`)
}

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'expired'])

export function pollVideoTask(taskId, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    let attempts = 0

    const tick = async () => {
      if (signal?.aborted) {
        reject(new DOMException('已取消', 'AbortError'))
        return
      }
      attempts += 1
      try {
        const task = await getVideoTask(taskId)
        onProgress?.(task, attempts)
        const status = (task.status ?? '').toLowerCase()
        if (TERMINAL.has(status)) {
          if (status === 'succeeded') resolve(task)
          else reject(new Error(task.errorMessage || '视频生成失败'))
          return
        }
        if (attempts >= getVideoPollMaxAttempts()) {
          reject(new Error('视频生成超时，请稍后在历史记录中查看'))
          return
        }
        setTimeout(tick, getVideoPollIntervalMs())
      } catch (err) {
        reject(err)
      }
    }

    tick()
  })
}

export function parseDurationSeconds(label) {
  const n = parseInt(String(label).replace(/\D/g, ''), 10)
  if (Number.isNaN(n)) return 5
  return Math.min(10, Math.max(5, n))
}

export function parseResolutionApi(label) {
  const s = String(label).toLowerCase()
  if (s.includes('720')) return '720p'
  if (s.includes('480')) return '480p'
  return '1080p'
}
