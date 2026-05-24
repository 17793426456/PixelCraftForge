/** 本地 Canvas 滤镜预览（无需后端 API） */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export async function applyLocalTransform(imageUrl, { activeAttr, prompt, targetColor, keepStructure = true }) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = imageUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  const text = `${prompt} ${activeAttr}`.toLowerCase()
  const intensity = keepStructure ? 1 : 1.35

  if (activeAttr === 'color' || text.includes('蓝') || text.includes('红') || text.includes('金')) {
    if (targetColor && typeof targetColor === 'string') {
      const { r, g, b } = hexToRgb(targetColor)
      ctx.filter = `sepia(0.4) saturate(1.5) hue-rotate(${Math.atan2(b - 128, r - 128) * 57}deg)`
    } else if (text.includes('蓝')) ctx.filter = `hue-rotate(200deg) saturate(${1.25 * intensity})`
    else if (text.includes('红')) ctx.filter = `hue-rotate(-30deg) saturate(${1.3 * intensity})`
    else if (text.includes('金')) ctx.filter = 'sepia(0.35) saturate(1.4) brightness(1.1)'
    else ctx.filter = `saturate(${1.4 * intensity}) contrast(1.1)`
  } else if (activeAttr === 'style' || text.includes('像素')) {
    ctx.filter = `contrast(${1.2 * intensity}) saturate(0.9)`
    ctx.imageSmoothingEnabled = false
  } else if (activeAttr === 'material' || text.includes('金属') || text.includes('冰')) {
    if (text.includes('冰')) ctx.filter = `hue-rotate(180deg) brightness(1.12) saturate(${0.9 * intensity})`
    else if (text.includes('金属')) ctx.filter = 'contrast(1.35) brightness(1.05) saturate(0.7)'
    else ctx.filter = 'contrast(1.25) brightness(1.08) saturate(0.85)'
  } else if (activeAttr === 'pose') {
    ctx.filter = `brightness(1.03) contrast(${1.05 * intensity})`
  } else if (activeAttr === 'function') {
    ctx.filter = 'saturate(1.2) drop-shadow(0 0 6px rgba(168,85,247,0.35))'
  } else if (activeAttr === 'appearance') {
    ctx.filter = `brightness(${1.05 * intensity}) contrast(1.08)`
  } else {
    ctx.filter = `brightness(${1.02 * intensity})`
  }

  ctx.drawImage(img, 0, 0)

  if (targetColor && typeof targetColor === 'string' && activeAttr === 'color') {
    const { r, g, b } = hexToRgb(targetColor)
    ctx.globalCompositeOperation = keepStructure ? 'soft-light' : 'color'
    ctx.fillStyle = `rgba(${r},${g},${b},${keepStructure ? 0.35 : 0.55})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'
  }

  return canvas.toDataURL('image/png')
}
