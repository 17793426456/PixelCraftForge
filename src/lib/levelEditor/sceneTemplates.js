function emptyGrid(cols, rows, fill = null) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill))
}

export const SCENE_TEMPLATES = {
  forest: {
    id: 'forest',
    name: '魔法森林',
    prompt: '魔法森林，发光蘑菇，古老树木',
    tags: ['森林', '魔法'],
    apply: (cols, rows) => {
      const ground = emptyGrid(cols, rows, 'tile_grass')
      const background = emptyGrid(cols, rows, 'bg_sky')
      const objects = []
      for (let x = 2; x < cols - 2; x += 4) {
        objects.push({ id: `obj_${x}`, assetId: 'deco_tree', x, y: rows - 3, depth: 1, rotation: 0, scale: 1 })
      }
      objects.push({ id: 'obj_castle', assetId: 'build_castle', x: Math.floor(cols * 0.75), y: rows - 5, depth: 2, rotation: 0, scale: 1 })
      for (let i = 0; i < 5; i++) {
        objects.push({ id: `mush_${i}`, assetId: 'deco_mushroom', x: 3 + i * 3, y: rows - 2, depth: 1, rotation: 0, scale: 1 })
      }
      return { ground, background, objects, collisions: [] }
    },
  },
  dungeon: {
    id: 'dungeon',
    name: '地下城',
    prompt: '地下城，石砖，火把',
    tags: ['地下城', '危险'],
    apply: (cols, rows) => {
      const ground = emptyGrid(cols, rows, 'tile_stone')
      const background = emptyGrid(cols, rows, 'bg_cave')
      const objects = []
      for (let x = 2; x < cols - 1; x += 5) {
        objects.push({ id: `torch_${x}`, assetId: 'deco_torch', x, y: Math.floor(rows / 2), depth: 1, rotation: 0, scale: 1 })
      }
      objects.push({ id: 'chest', assetId: 'prop_chest', x: Math.floor(cols / 2), y: Math.floor(rows / 2), depth: 2, rotation: 0, scale: 1 })
      objects.push({ id: 'slime', assetId: 'char_slime', x: 4, y: Math.floor(rows / 2), depth: 2, rotation: 0, scale: 1 })
      return { ground, background, objects, collisions: [{ id: 'c1', x: 0, y: rows - 1, w: cols, h: 1 }] }
    },
  },
  castle: {
    id: 'castle',
    name: '中世纪城堡',
    prompt: '城堡，石塔，骑士',
    tags: ['城堡'],
    apply: (cols, rows) => {
      const ground = emptyGrid(cols, rows, 'tile_stone')
      const background = emptyGrid(cols, rows, 'bg_sky')
      const objects = [
        { id: 'castle', assetId: 'build_castle', x: Math.floor(cols / 2) - 2, y: rows - 6, depth: 2, rotation: 0, scale: 1 },
        { id: 'tower_l', assetId: 'build_tower', x: 2, y: rows - 4, depth: 2, rotation: 0, scale: 1 },
        { id: 'tower_r', assetId: 'build_tower', x: cols - 3, y: rows - 4, depth: 2, rotation: 0, scale: 1 },
        { id: 'knight', assetId: 'char_knight', x: Math.floor(cols / 2), y: rows - 2, depth: 3, rotation: 0, scale: 1 },
      ]
      return { ground, background, objects, collisions: [] }
    },
  },
  town: {
    id: 'town',
    name: '城镇市集',
    prompt: '城镇，市集，土路',
    tags: ['城镇'],
    apply: (cols, rows) => {
      const ground = emptyGrid(cols, rows, 'tile_grass')
      for (let x = Math.floor(cols * 0.3); x < Math.floor(cols * 0.7); x++) {
        for (let y = Math.floor(rows * 0.4); y < Math.floor(rows * 0.7); y++) {
          ground[y][x] = 'tile_path'
        }
      }
      const background = emptyGrid(cols, rows, 'bg_sky')
      const objects = []
      for (let i = 0; i < 4; i++) {
        objects.push({ id: `house_${i}`, assetId: 'build_house', x: 2 + i * 5, y: rows - 5, depth: 2, rotation: 0, scale: 1 })
      }
      return { ground, background, objects, collisions: [] }
    },
  },
}

export function applyTemplate(templateId, cols, rows) {
  const tpl = SCENE_TEMPLATES[templateId]
  if (!tpl) return null
  return tpl.apply(cols, rows)
}
