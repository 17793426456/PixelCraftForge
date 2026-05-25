/** 前端功能分类 → 后端 AssetCategory 枚举 */
const FUNC_TYPE_MAP = {
  角色类: 'CHARACTER',
  道具物品类: 'WEAPON',
  场景环境类: 'SCENE',
  UI交互类: 'SKILL',
  特效动作类: 'SKILL',
  地图瓦片类: 'SCENE',
}

const TEMPLATE_CATEGORY_MAP = {
  1: 'SCENE',
  2: 'SCENE',
  3: 'SCENE',
  4: 'SCENE',
}

export function funcTypeToAssetCategory(funcType) {
  return FUNC_TYPE_MAP[funcType] ?? 'CHARACTER'
}

export function templateIdToAssetCategory(templateId) {
  if (templateId == null) return null
  return TEMPLATE_CATEGORY_MAP[templateId] ?? null
}

export function resolveAssetCategory({ funcType, templateId, fallback = 'CHARACTER' } = {}) {
  return templateIdToAssetCategory(templateId)
    ?? (funcType ? funcTypeToAssetCategory(funcType) : null)
    ?? fallback
}
