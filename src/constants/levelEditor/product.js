/**
 * 2D 地图编辑器 — 产品目标与边界（Single Source of Truth）
 *
 * 核心能力：「模板 + 拖拽编辑 + 地图扩展」→ 可导出 2D 游戏地图 JSON
 * 非目标（当前版本）：真实 AI 后端、Tiled .tmx、多人协作
 */

export const PRODUCT = {
  name: 'PixelCraft 地图编辑器',
  tagline: '拖拽搭建 + 四向扩展 → 引擎可导入的 2D 地图数据',
  specVersion: '1.0',
  exportFormat: 'pixelcraftforge-level-v1',
}

/** 支持的视角（固定三种） */
export const VIEW_MODES = {
  'side-scroll': {
    id: 'side-scroll',
    label: '横版视角',
    desc: '左右延伸长条画布，适合平台跳跃',
    gameTypes: ['platformer'],
    defaultCols: 48,
    defaultRows: 14,
    aspect: 'wide',
  },
  'top-down': {
    id: 'top-down',
    label: '俯视视角',
    desc: '方形网格，适合 RPG / 策略',
    gameTypes: ['rpg'],
    defaultCols: 24,
    defaultRows: 24,
    aspect: 'square',
  },
  'side-view': {
    id: 'side-view',
    label: '侧视视角',
    desc: '前后层级深度，适合解谜 / 经营',
    gameTypes: ['puzzle', 'sim'],
    defaultCols: 20,
    defaultRows: 16,
    aspect: 'depth',
  },
}

/** 支持的游戏类型 */
export const GAME_TYPES = {
  platformer: { id: 'platformer', label: '平台跳跃', defaultView: 'side-scroll' },
  rpg: { id: 'rpg', label: 'RPG / 策略', defaultView: 'top-down' },
  puzzle: { id: 'puzzle', label: '解谜', defaultView: 'side-view' },
  sim: { id: 'sim', label: '模拟经营', defaultView: 'side-view' },
}

/** 统一瓦片尺寸规范 */
export const TILE_SIZES = [32, 64]

/** 编辑器图层（固定四层） */
export const EDITOR_LAYERS = [
  { id: 'background', label: '背景层', paintable: true, zIndex: 0 },
  { id: 'ground', label: '地面层', paintable: true, zIndex: 1 },
  { id: 'decor', label: '装饰/物件', paintable: false, zIndex: 2 },
  { id: 'collision', label: '碰撞体', paintable: true, zIndex: 3 },
]

/** 兼容引擎及导出适配器 */
export const ENGINE_TARGETS = [
  { id: 'phaser', label: 'Phaser 3', ext: 'phaser-level.json' },
  { id: 'godot', label: 'Godot 4', ext: 'godot-level.json' },
  { id: 'unity-2d', label: 'Unity 2D', ext: 'unity-level.json' },
  { id: 'cocos', label: 'Cocos Creator', ext: 'cocos-level.json' },
]

export const BUILD_TIPS = {
  'side-scroll': [
    '横版地图可用「向右扩展」加长跑道，已有地块会保留',
    '横版地图建议地面层保持同一高度，方便跳跃判定',
    '碰撞体层标注平台边缘，导出后可直接用于物理引擎',
    '装饰层放置背景树、建筑，不要与地面层混用',
  ],
  'top-down': [
    '俯视地图按行列对齐，tileSize 建议 32 或 64 统一',
    '角色与道具放在 decor 物件层，便于引擎单独管理',
    'RPG 地图可用模板一键铺草地再手动改细节',
  ],
  'side-view': [
    '侧视视角用 depth 字段区分前后景，数值越大越靠前',
    '适合解谜场景的层级遮挡，导出 JSON 含 depth 字段',
    '建筑模块建议 snap 到网格交点',
  ],
}

export const EXAMPLE_PROMPTS = [
  '魔法森林，古老城堡，发光蘑菇和溪流',
  '地下城入口，火把照明，石砖地面',
  '中世纪城镇，市集广场，木栅栏',
]
