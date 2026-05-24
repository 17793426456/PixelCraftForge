/**
 * 生成类 TexturePacker 的 JSON，兼容 Unity / Godot 等引擎导入流程
 */
export function buildAtlasJson({ imageName, sheetWidth, sheetHeight, frames }) {
  const frameEntries = {}
  for (const f of frames) {
    frameEntries[f.name] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
    }
  }
  return {
    textures: [
      {
        image: imageName,
        format: 'RGBA8888',
        size: { w: sheetWidth, h: sheetHeight },
        scale: 1,
        frames: frameEntries,
      },
    ],
    meta: {
      app: 'PixelCraftForge',
      version: '1.0',
      target: 'unity-godot-web',
    },
  }
}

export function downloadAtlasJson(descriptor, filename = 'atlas.json') {
  const blob = new Blob([JSON.stringify(descriptor, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
