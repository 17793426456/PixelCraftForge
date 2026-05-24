/** 本地 Canvas 滤镜预览（无需后端 API） */
export async function applyLocalTransform(imageUrl, { activeAttr, prompt }) {
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

  if (activeAttr === 'color' || text.includes('蓝') || text.includes('红') || text.includes('金')) {
    if (text.includes('蓝')) ctx.filter = 'hue-rotate(200deg) saturate(1.25)'
    else if (text.includes('红')) ctx.filter = 'hue-rotate(-30deg) saturate(1.3)'
    else if (text.includes('金')) ctx.filter = 'sepia(0.35) saturate(1.4) brightness(1.1)'
    else ctx.filter = 'saturate(1.4) contrast(1.1)'
  } else if (activeAttr === 'style' || text.includes('像素')) {
    ctx.filter = 'contrast(1.2) saturate(0.9)'
    ctx.imageSmoothingEnabled = false
  } else if (activeAttr === 'material' || text.includes('金属') || text.includes('冰')) {
    ctx.filter = 'contrast(1.25) brightness(1.08) saturate(0.85)'
  } else if (activeAttr === 'appearance') {
    ctx.filter = 'brightness(1.05) contrast(1.08)'
  } else {
    ctx.filter = 'brightness(1.02)'
  }

  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}
