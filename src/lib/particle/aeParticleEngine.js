/** 仿 AE 粒子插件逻辑的 Canvas 2D 模拟引擎 */

export const CANVAS_W = 800
export const CANVAS_H = 450

export const EMITTER_SHAPES = ['point', 'circle', 'fan']
export const PARTICLE_SHAPES = ['circle', 'star', 'texture']
export const BLEND_MODES = ['normal', 'add']

export function createDefaultLayer(id, name) {
  return {
    id,
    name,
    visible: true,
    emitter: {
      x: CANVAS_W / 2,
      y: CANVAS_H * 0.65,
      rate: 28,
      shape: 'point',
      angle: -90,
      spread: 45,
      radius: 48,
    },
    appearance: {
      sizeStart: 7,
      sizeEnd: 1,
      colorStart: '#a855f7',
      colorEnd: '#ec4899',
      opacityStart: 1,
      opacityEnd: 0,
      shape: 'circle',
    },
    physics: {
      speed: 3.5,
      gravity: -0.04,
      drag: 0.015,
      turbulence: 0.35,
    },
    render: {
      blendMode: 'add',
      motionBlur: true,
      glow: 0.45,
    },
    animation: {
      lifetime: 72,
      loop: true,
    },
    keyframes: [],
    texture: null,
  }
}

export const BUILTIN_PRESETS = {
  magic_spark: {
    name: '魔法火花',
    layer: {
      emitter: { shape: 'fan', angle: -90, spread: 60, rate: 35 },
      appearance: { sizeStart: 8, sizeEnd: 0.5, colorStart: '#c084fc', colorEnd: '#f472b6', shape: 'star' },
      physics: { speed: 4, gravity: -0.06, turbulence: 0.5 },
      render: { blendMode: 'add', glow: 0.6 },
    },
  },
  rain: {
    name: '细雨',
    layer: {
      emitter: { shape: 'circle', radius: 400, x: CANVAS_W / 2, y: -20, rate: 45, angle: 90, spread: 8 },
      appearance: { sizeStart: 2, sizeEnd: 2, colorStart: '#93c5fd', colorEnd: '#60a5fa', shape: 'circle' },
      physics: { speed: 8, gravity: 0.15, drag: 0, turbulence: 0.1 },
      render: { blendMode: 'normal', glow: 0 },
    },
  },
  explosion: {
    name: '爆炸',
    layer: {
      emitter: { shape: 'circle', radius: 8, rate: 80, angle: 0, spread: 360 },
      appearance: { sizeStart: 10, sizeEnd: 0, colorStart: '#fbbf24', colorEnd: '#ef4444', shape: 'circle' },
      physics: { speed: 6, gravity: 0.08, turbulence: 0.8 },
      render: { blendMode: 'add', glow: 0.7, motionBlur: true },
      animation: { lifetime: 48 },
    },
  },
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function lerpColor(a, b, t) {
  const c1 = hexToRgb(a)
  const c2 = hexToRgb(b)
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const bl = Math.round(c1.b + (c2.b - c1.b) * t)
  return `rgb(${r},${g},${bl})`
}

function degToRad(d) {
  return (d * Math.PI) / 180
}

function spawnPosition(emitter) {
  const { x, y, shape, radius, angle, spread } = emitter
  if (shape === 'point') return { x, y }
  if (shape === 'circle') {
    const t = Math.random() * Math.PI * 2
    const r = Math.random() * radius
    return { x: x + Math.cos(t) * r, y: y + Math.sin(t) * r }
  }
  const half = spread / 2
  const dir = degToRad(angle + (Math.random() * spread - half))
  const dist = Math.random() * radius * 0.3
  return { x: x + Math.cos(dir) * dist, y: y + Math.sin(dir) * dist }
}

function spawnVelocity(emitter, speed) {
  const half = emitter.spread / 2
  const base = degToRad(emitter.angle)
  const dir = emitter.shape === 'fan' || emitter.shape === 'point'
    ? base + degToRad(Math.random() * emitter.spread - half)
    : Math.random() * Math.PI * 2
  const mag = speed * (0.6 + Math.random() * 0.8)
  return { vx: Math.cos(dir) * mag, vy: Math.sin(dir) * mag }
}

export function spawnParticle(layer) {
  const pos = spawnPosition(layer.emitter)
  const vel = spawnVelocity(layer.emitter, layer.physics.speed)
  const life = layer.animation.lifetime * (0.85 + Math.random() * 0.3)
  return {
    x: pos.x,
    y: pos.y,
    vx: vel.vx,
    vy: vel.vy,
    life,
    maxLife: life,
    prevX: pos.x,
    prevY: pos.y,
  }
}

export function updateParticle(p, layer) {
  const { physics } = layer
  p.prevX = p.x
  p.prevY = p.y
  p.vx += (Math.random() - 0.5) * physics.turbulence
  p.vy += (Math.random() - 0.5) * physics.turbulence
  p.vy += physics.gravity
  p.vx *= 1 - physics.drag
  p.vy *= 1 - physics.drag
  p.x += p.vx
  p.y += p.vy
  p.life -= 1
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

export function drawParticle(ctx, p, layer, textureImg) {
  const t = 1 - p.life / p.maxLife
  const { appearance, render } = layer
  const size = appearance.sizeStart + (appearance.sizeEnd - appearance.sizeStart) * t
  const alpha = appearance.opacityStart + (appearance.opacityEnd - appearance.opacityStart) * t
  if (alpha <= 0.01 || size <= 0.05) return

  ctx.save()
  ctx.globalCompositeOperation = render.blendMode === 'add' ? 'lighter' : 'source-over'
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
  ctx.fillStyle = lerpColor(appearance.colorStart, appearance.colorEnd, t)

  if (render.glow > 0) {
    ctx.shadowBlur = size * render.glow * 3
    ctx.shadowColor = ctx.fillStyle
  }

  if (render.motionBlur) {
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = size * 0.6
    ctx.globalAlpha *= 0.35
    ctx.beginPath()
    ctx.moveTo(p.prevX, p.prevY)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
  }

  if (appearance.shape === 'texture' && textureImg) {
    const s = size * 2
    ctx.drawImage(textureImg, p.x - s / 2, p.y - s / 2, s, s)
  } else if (appearance.shape === 'star') {
    drawStar(ctx, p.x, p.y, size)
  } else {
    ctx.beginPath()
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function drawEmitterGizmo(ctx, layer, selected) {
  const { emitter } = layer
  ctx.save()
  ctx.strokeStyle = selected ? '#a855f7' : 'rgba(168,85,247,0.45)'
  ctx.fillStyle = selected ? 'rgba(168,85,247,0.35)' : 'rgba(168,85,247,0.15)'
  ctx.lineWidth = selected ? 2 : 1
  ctx.beginPath()
  ctx.arc(emitter.x, emitter.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  if (emitter.shape === 'circle' || emitter.shape === 'fan') {
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(emitter.x, emitter.y, emitter.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (emitter.shape === 'fan' || emitter.shape === 'point') {
    const rad = degToRad(emitter.angle)
    const len = 36
    ctx.beginPath()
    ctx.moveTo(emitter.x, emitter.y)
    ctx.lineTo(emitter.x + Math.cos(rad) * len, emitter.y + Math.sin(rad) * len)
    ctx.stroke()
  }
  ctx.restore()
}

export function simulateStep(layers, particlesByLayer, spawnAcc, w, h) {
  const nextAcc = { ...spawnAcc }
  const nextParticles = { ...particlesByLayer }

  for (const layer of layers) {
    if (!layer.visible) continue
    let list = [...(nextParticles[layer.id] ?? [])]
    nextAcc[layer.id] = (nextAcc[layer.id] ?? 0) + layer.emitter.rate / 60

    while (nextAcc[layer.id] >= 1) {
      list.push(spawnParticle(layer))
      nextAcc[layer.id] -= 1
    }

    list = list
      .map((p) => {
        updateParticle(p, layer)
        return p
      })
      .filter((p) => p.life > 0 && p.x > -40 && p.x < w + 40 && p.y > -40 && p.y < h + 40)

    if (layer.animation.loop && list.length < layer.emitter.rate * 2) {
      // keep sim alive
    }
    nextParticles[layer.id] = list
  }
  return { particlesByLayer: nextParticles, spawnAcc: nextAcc }
}

export function renderFrame(ctx, layers, particlesByLayer, textureMap, opts = {}) {
  const { w, h, showGizmo = true, activeLayerId, viewScale = 1, viewPanX = 0, viewPanY = 0, trail = true } = opts
  if (trail) {
    ctx.fillStyle = 'rgba(12,12,16,0.22)'
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.fillStyle = '#0c0c10'
    ctx.fillRect(0, 0, w, h)
  }

  ctx.save()
  ctx.translate(viewPanX, viewPanY)
  ctx.scale(viewScale, viewScale)

  for (const layer of layers) {
    if (!layer.visible) continue
    const list = particlesByLayer[layer.id] ?? []
    const tex = textureMap[layer.id] ?? null
    for (const p of list) drawParticle(ctx, p, layer, tex)
    if (showGizmo) drawEmitterGizmo(ctx, layer, layer.id === activeLayerId)
  }
  ctx.restore()
}

export function exportProjectConfig(layers, global) {
  return {
    format: 'pixelcraftforge-ae-particle-v3',
    version: '3.0',
    canvas: { width: CANVAS_W, height: CANVAS_H },
    global,
    layers: layers.map(({ texture, ...rest }) => ({
      ...rest,
      hasTexture: !!texture,
    })),
    exportedAt: new Date().toISOString(),
  }
}
