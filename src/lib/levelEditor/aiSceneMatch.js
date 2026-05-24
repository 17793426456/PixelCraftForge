import { LEVEL_ASSETS } from '../../constants/levelEditor/assetCatalog.js'

const TAG_ALIASES = {
  森林: ['森林', '自然', '魔法', '蘑菇', '树'],
  城堡: ['城堡', '建筑', '塔'],
  地下城: ['地下城', '危险', '火把', '石砖'],
  城镇: ['城镇', '市集', '木栅栏', '路'],
  魔法: ['魔法', '发光', '蘑菇'],
}

export function matchAssetsFromPrompt(prompt, limit = 12) {
  const text = prompt.toLowerCase()
  const scores = new Map()

  for (const asset of LEVEL_ASSETS) {
    let score = 0
    for (const tag of asset.tags) {
      if (text.includes(tag.toLowerCase()) || prompt.includes(tag)) score += 3
    }
    if (text.includes(asset.name.toLowerCase()) || prompt.includes(asset.name)) score += 5
    if (asset.desc && prompt.split(/\s+/).some((w) => asset.desc.includes(w) && w.length > 1)) score += 1
    for (const [, aliases] of Object.entries(TAG_ALIASES)) {
      if (aliases.some((a) => prompt.includes(a)) && asset.tags.some((t) => aliases.includes(t))) score += 2
    }
    if (score > 0) scores.set(asset.id, score)
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => LEVEL_ASSETS.find((a) => a.id === id))
    .filter(Boolean)
}

export function explainMatch(prompt, matched) {
  if (!matched.length) return '未匹配到素材，请尝试：森林、城堡、地下城、城镇等关键词'
  return `根据「${prompt.slice(0, 24)}${prompt.length > 24 ? '…' : ''}」推荐 ${matched.length} 个素材`
}
