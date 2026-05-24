/** 内置素材库：唯一 ID、尺寸、标签、碰撞、层级 */

export const ASSET_CATEGORIES = [
  { id: 'terrain', label: '地形瓦片' },
  { id: 'building', label: '建筑模块' },
  { id: 'character', label: '角色' },
  { id: 'prop', label: '道具' },
  { id: 'decor', label: '装饰' },
]

export const LEVEL_ASSETS = [
  { id: 'tile_grass', category: 'terrain', name: '草地', tags: ['森林', '自然', '魔法'], size: 32, collision: false, layer: 'ground', color: '#3d6b4f', desc: '基础草地瓦片' },
  { id: 'tile_stone', category: 'terrain', name: '石砖', tags: ['地下城', '城堡', '危险'], size: 32, collision: false, layer: 'ground', color: '#4a5568', desc: '地下城石砖地面' },
  { id: 'tile_water', category: 'terrain', name: '水面', tags: ['森林', '自然', '溪流'], size: 32, collision: true, layer: 'ground', color: '#3182ce', desc: '不可通行的水面' },
  { id: 'tile_sand', category: 'terrain', name: '沙地', tags: ['沙漠', '城镇'], size: 32, collision: false, layer: 'ground', color: '#d69e2e', desc: '沙漠或海滩' },
  { id: 'tile_path', category: 'terrain', name: '土路', tags: ['城镇', '自然'], size: 32, collision: false, layer: 'ground', color: '#8b6914', desc: '城镇土路' },
  { id: 'build_castle', category: 'building', name: '城堡', tags: ['城堡', '建筑', '魔法'], size: 64, collision: true, layer: 'decor', color: '#6b46c1', desc: '中世纪城堡模块' },
  { id: 'build_house', category: 'building', name: '木屋', tags: ['城镇', '建筑', '森林'], size: 64, collision: true, layer: 'decor', color: '#975a16', desc: '城镇住宅' },
  { id: 'build_tower', category: 'building', name: '石塔', tags: ['城堡', '地下城', '危险'], size: 32, collision: true, layer: 'decor', color: '#718096', desc: '防御塔楼' },
  { id: 'deco_tree', category: 'decor', name: '古树', tags: ['森林', '自然', '魔法'], size: 32, collision: true, layer: 'decor', color: '#276749', desc: '森林装饰树' },
  { id: 'deco_mushroom', category: 'decor', name: '发光蘑菇', tags: ['森林', '魔法', '自然'], size: 32, collision: false, layer: 'decor', color: '#9f7aea', desc: '魔法森林蘑菇' },
  { id: 'deco_torch', category: 'decor', name: '火把', tags: ['地下城', '危险', '城堡'], size: 32, collision: false, layer: 'decor', color: '#ed8936', desc: '地下城照明' },
  { id: 'prop_chest', category: 'prop', name: '宝箱', tags: ['地下城', '道具', '危险'], size: 32, collision: true, layer: 'decor', color: '#ecc94b', desc: '可交互宝箱' },
  { id: 'prop_sword', category: 'prop', name: '宝剑', tags: ['道具', '城堡', '危险'], size: 32, collision: false, layer: 'decor', color: '#cbd5e0', desc: '武器道具' },
  { id: 'char_knight', category: 'character', name: '骑士', tags: ['城堡', '角色'], size: 32, collision: true, layer: 'decor', color: '#667eea', desc: '玩家或 NPC 骑士' },
  { id: 'char_slime', category: 'character', name: '史莱姆', tags: ['地下城', '危险', '角色'], size: 32, collision: true, layer: 'decor', color: '#48bb78', desc: '敌人单位' },
  { id: 'bg_sky', category: 'terrain', name: '天空渐变', tags: ['自然'], size: 32, collision: false, layer: 'background', color: '#1a365d', desc: '背景天空色' },
  { id: 'bg_cave', category: 'terrain', name: '洞穴壁', tags: ['地下城', '危险'], size: 32, collision: false, layer: 'background', color: '#2d3748', desc: '地下城背景' },
]

export function getAssetById(id) {
  return LEVEL_ASSETS.find((a) => a.id === id) ?? null
}

export function assetsByCategory(category) {
  if (!category || category === 'all') return LEVEL_ASSETS
  return LEVEL_ASSETS.filter((a) => a.category === category)
}
