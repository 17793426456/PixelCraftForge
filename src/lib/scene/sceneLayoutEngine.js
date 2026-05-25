/** 根据描述、视角与元素类型生成场景布局（规则引擎，可后续替换 LLM） */

const KEYWORD_TYPES = [
  { words: ['森林', '树', '蘑菇', '花', '草', '植被', '丛林'], type: '植被' },
  { words: ['城堡', '塔', '房屋', '建筑', '市集', '桥', '神殿'], type: '建筑' },
  { words: ['骑士', '法师', '角色', 'NPC', '敌人', '玩家'], type: '角色' },
  { words: ['剑', '宝箱', '道具', '武器', '药水', '钥匙'], type: '道具' },
  { words: ['河', '溪', '山', '路', '地形', '沙漠', '绿洲'], type: '地形' },
  { words: ['云', '天空', '星', '月', '日', '雷', '雨'], type: '天空' },
]

const VIEW_LAYOUT = {
  横版视角: { skyY: 10, groundY: 82, spreadX: 0.85 },
  俯视视角: { skyY: 8, groundY: 50, spreadX: 1 },
  侧视视角: { skyY: 15, groundY: 75, spreadX: 0.6 },
}

function hashPrompt(text) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

function typesFromPrompt(prompt) {
  const found = new Set()
  for (const { words, type } of KEYWORD_TYPES) {
    if (words.some((w) => prompt.includes(w))) found.add(type)
  }
  return found
}

function layerForType(type) {
  if (type === '天空') return 'sky'
  if (type === '角色' || type === '道具') return 'near'
  return 'mid'
}

export function generateSceneLayout({
  prompt = '',
  activeElements = [],
  customElements = [],
  view = '横版视角',
}) {
  const viewCfg = VIEW_LAYOUT[view] ?? VIEW_LAYOUT['横版视角']
  const seed = hashPrompt(prompt)
  const promptTypes = typesFromPrompt(prompt)
  let types = [...activeElements]

  for (const t of promptTypes) {
    if (!types.includes(t)) types.push(t)
  }

  if (types.length === 0) types = ['天空', '地形', '植被']

  const items = []
  let id = 1

  if (types.includes('天空')) {
    items.push({
      id: id++,
      type: '天空',
      layer: 'sky',
      x: 50 + ((seed % 7) - 3),
      y: viewCfg.skyY,
      collision: false,
      label: '天空层',
    })
  }

  if (types.includes('地形')) {
    items.push({
      id: id++,
      type: '地形',
      layer: 'mid',
      x: 50,
      y: viewCfg.groundY,
      collision: true,
      label: '地面',
    })
  }

  const midTypes = types.filter((t) => !['天空', '地形'].includes(t))
  const count = Math.min(midTypes.length + customElements.length, 12)
  const slots = midTypes.length + customElements.length || 1

  midTypes.forEach((type, i) => {
    const angle = (i / slots) * Math.PI * viewCfg.spreadX
    const radiusX = 28 + (seed % 15)
    const x = 50 + Math.cos(angle + seed * 0.01) * radiusX
    const yBase = type === '角色' || type === '道具' ? viewCfg.groundY - 18 : viewCfg.groundY - 28
    const y = yBase + ((seed + i * 17) % 12) - 6
    items.push({
      id: id++,
      type,
      layer: layerForType(type),
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(12, Math.min(88, y)),
      collision: type === '建筑' || type === '地形',
      label: type,
    })
  })

  customElements.forEach((name, i) => {
    const x = 15 + ((seed + i * 23) % 70)
    const y = viewCfg.groundY - 22 - (i % 3) * 8
    items.push({
      id: id++,
      type: '道具',
      layer: 'near',
      x,
      y: Math.max(20, Math.min(80, y)),
      collision: false,
      label: name,
      custom: true,
    })
  })

  while (items.length < count && items.length < 8) {
    const extra = midTypes[(items.length + seed) % midTypes.length] ?? '植被'
    items.push({
      id: id++,
      type: extra,
      layer: layerForType(extra),
      x: 20 + ((seed * items.length * 13) % 60),
      y: viewCfg.groundY - 30 - (items.length % 4) * 5,
      collision: extra === '建筑',
      label: extra,
    })
  }

  return {
    prompt,
    view,
    generatedAt: new Date().toISOString(),
    elements: items,
    summary: `共 ${items.length} 个元素 · ${view} · 关键词匹配 ${promptTypes.size} 类`,
  }
}
