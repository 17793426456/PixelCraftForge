/** 时间轴关键帧：插值 animatable 属性 */

export const ANIM_TRACKS = [
  { key: 'emitter.rate', get: (l) => l.emitter.rate, apply: (l, v) => ({ emitter: { rate: v } }) },
  { key: 'emitter.x', get: (l) => l.emitter.x, apply: (l, v) => ({ emitter: { x: v } }) },
  { key: 'emitter.y', get: (l) => l.emitter.y, apply: (l, v) => ({ emitter: { y: v } }) },
  { key: 'emitter.angle', get: (l) => l.emitter.angle, apply: (l, v) => ({ emitter: { angle: v } }) },
  { key: 'physics.speed', get: (l) => l.physics.speed, apply: (l, v) => ({ physics: { speed: v } }) },
  { key: 'physics.gravity', get: (l) => l.physics.gravity, apply: (l, v) => ({ physics: { gravity: v } }) },
  { key: 'appearance.sizeStart', get: (l) => l.appearance.sizeStart, apply: (l, v) => ({ appearance: { sizeStart: v } }) },
  { key: 'render.glow', get: (l) => l.render.glow, apply: (l, v) => ({ render: { glow: v } }) },
]

function deepMerge(target, patch) {
  const next = { ...target }
  for (const k of Object.keys(patch)) {
    if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
      next[k] = { ...target[k], ...patch[k] }
    } else {
      next[k] = patch[k]
    }
  }
  return next
}

export function snapshotAnimValues(layer) {
  const values = {}
  for (const t of ANIM_TRACKS) values[t.key] = t.get(layer)
  return values
}

export function applyAnimValues(layer, values) {
  let next = { ...layer }
  for (const t of ANIM_TRACKS) {
    if (values[t.key] !== undefined) next = deepMerge(next, t.apply(next, values[t.key]))
  }
  return next
}

function lerpKeyframes(a, b, t) {
  const values = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const va = a[key]
    const vb = b[key]
    if (typeof va === 'number' && typeof vb === 'number') {
      values[key] = va + (vb - va) * t
    } else {
      values[key] = t < 0.5 ? va : vb
    }
  }
  return values
}

export function resolveLayerAtTime(layer, timeSec) {
  const kfs = [...(layer.keyframes ?? [])].sort((a, b) => a.time - b.time)
  if (kfs.length === 0) return layer
  if (kfs.length === 1) return applyAnimValues(layer, kfs[0].values)
  if (timeSec <= kfs[0].time) return applyAnimValues(layer, kfs[0].values)
  if (timeSec >= kfs[kfs.length - 1].time) return applyAnimValues(layer, kfs[kfs.length - 1].values)

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (timeSec >= a.time && timeSec <= b.time) {
      const t = (timeSec - a.time) / (b.time - a.time)
      return applyAnimValues(layer, lerpKeyframes(a.values, b.values, t))
    }
  }
  return layer
}

export function resolveLayersAtTime(layers, timeSec) {
  return layers.map((l) => resolveLayerAtTime(l, timeSec))
}

export function addKeyframe(layer, timeSec) {
  const values = snapshotAnimValues(layer)
  const existing = (layer.keyframes ?? []).findIndex((k) => Math.abs(k.time - timeSec) < 0.05)
  const kf = { id: `kf_${Date.now()}`, time: timeSec, values }
  let keyframes = [...(layer.keyframes ?? [])]
  if (existing >= 0) keyframes[existing] = { ...keyframes[existing], values }
  else keyframes.push(kf)
  keyframes.sort((a, b) => a.time - b.time)
  return keyframes
}

export function removeKeyframe(layer, keyframeId) {
  return (layer.keyframes ?? []).filter((k) => k.id !== keyframeId)
}
