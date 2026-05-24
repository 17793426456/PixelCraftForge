import { PRODUCT, ENGINE_TARGETS } from '../../constants/levelEditor/product.js'
import { getAssetById } from '../../constants/levelEditor/assetCatalog.js'

function tileLayerToFlat(grid, cols, rows) {
  const data = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      data.push(grid[y]?.[x] ?? null)
    }
  }
  return data
}

export function buildLevelDocument(project) {
  const { meta, layers, objects, collisions } = project
  return {
    format: PRODUCT.exportFormat,
    specVersion: PRODUCT.specVersion,
    exportedAt: new Date().toISOString(),
    engines: ENGINE_TARGETS.map((e) => e.id),
    meta: {
      name: meta.name,
      view: meta.view,
      gameType: meta.gameType,
      tileSize: meta.tileSize,
      cols: meta.cols,
      rows: meta.rows,
    },
    tileLayers: [
      { name: 'background', width: meta.cols, height: meta.rows, data: tileLayerToFlat(layers.background, meta.cols, meta.rows) },
      { name: 'ground', width: meta.cols, height: meta.rows, data: tileLayerToFlat(layers.ground, meta.cols, meta.rows) },
    ],
    objects: objects.map((o) => {
      const asset = getAssetById(o.assetId)
      return {
        id: o.id,
        assetId: o.assetId,
        type: asset?.category ?? 'decor',
        x: o.x,
        y: o.y,
        depth: o.depth ?? 0,
        rotation: o.rotation ?? 0,
        scale: o.scale ?? 1,
        collision: asset?.collision ?? false,
        size: asset?.size ?? meta.tileSize,
      }
    }),
    collisions: collisions.map((c) => ({
      id: c.id,
      shape: 'rect',
      x: c.x,
      y: c.y,
      w: c.w,
      h: c.h,
      unit: 'tile',
    })),
  }
}

export function exportPhaserLevel(doc) {
  return {
    format: 'phaser-level-v1',
    tilemap: {
      tileWidth: doc.meta.tileSize,
      tileHeight: doc.meta.tileSize,
      width: doc.meta.cols,
      height: doc.meta.rows,
      layers: doc.tileLayers.map((l) => ({ name: l.name, data: l.data })),
    },
    sprites: doc.objects.map((o) => ({
      key: o.assetId,
      x: o.x * doc.meta.tileSize,
      y: o.y * doc.meta.tileSize,
      depth: o.depth,
    })),
    colliders: doc.collisions.map((c) => ({
      x: c.x * doc.meta.tileSize,
      y: c.y * doc.meta.tileSize,
      width: c.w * doc.meta.tileSize,
      height: c.h * doc.meta.tileSize,
    })),
  }
}

export function exportGodotLevel(doc) {
  return {
    format: 'godot-tilemap-v1',
    tile_set: { tile_size: doc.meta.tileSize, sources: doc.tileLayers[0]?.data.filter(Boolean) ?? [] },
    tile_map: doc.tileLayers.map((l) => ({ name: l.name, layer: 0, data: l.data })),
    nodes: doc.objects.map((o) => ({
      type: 'Sprite2D',
      name: o.id,
      position: { x: o.x * doc.meta.tileSize, y: o.y * doc.meta.tileSize },
      texture: o.assetId,
      z_index: o.depth,
    })),
    static_bodies: doc.collisions,
  }
}

export function exportUnityLevel(doc) {
  return {
    format: 'unity-tilemap-reference-v1',
    grid: { cellSize: { x: doc.meta.tileSize, y: doc.meta.tileSize }, cellGap: { x: 0, y: 0 } },
    tilemapLayers: doc.tileLayers.map((l) => ({ name: l.name, tiles: l.data })),
    gameObjects: doc.objects.map((o) => ({
      name: o.id,
      sprite: o.assetId,
      transform: { position: { x: o.x * doc.meta.tileSize, y: o.y * doc.meta.tileSize, z: -o.depth }, rotation: o.rotation, scale: o.scale },
    })),
    boxColliders2D: doc.collisions,
  }
}

export function exportCocosLevel(doc) {
  return {
    format: 'cocos-tiled-v1',
    designResolution: { width: doc.meta.cols * doc.meta.tileSize, height: doc.meta.rows * doc.meta.tileSize },
    tileLayers: doc.tileLayers,
    prefabs: doc.objects,
    physics: doc.collisions,
  }
}

export function buildEngineExportPack(project) {
  const doc = buildLevelDocument(project)
  return {
    master: doc,
    phaser: exportPhaserLevel(doc),
    godot: exportGodotLevel(doc),
    unity: exportUnityLevel(doc),
    cocos: exportCocosLevel(doc),
  }
}
