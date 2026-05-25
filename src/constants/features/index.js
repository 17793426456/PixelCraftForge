import imageSpriteCut from './image-sprite-cut.js'
import imageLayerEdit from './image-layer-edit.js'
import imageTransformFilter from './image-transform-filter.js'
import imageAtlasExport from './image-atlas-export.js'
import animFrameEdit from './anim-frame-edit.js'
import animBoneRig from './anim-bone-rig.js'
import animFpsLoop from './anim-fps-loop.js'
import animSequenceExport from './anim-sequence-export.js'
import sceneTileBuild from './scene-tile-build.js'
import sceneObjectCollision from './scene-object-collision.js'
import sceneLayerZ from './scene-layer-z.js'
import sceneMapExport from './scene-map-export.js'
import sceneMapExpand from './scene-map-expand.js'
import uiDrawComponents from './ui-draw-components.js'
import uiStateSprites from './ui-state-sprites.js'
import uiPackExport from './ui-pack-export.js'
import vfxParticleParams from './vfx-particle-params.js'
import vfxPresets from './vfx-presets.js'
import vfxPreviewTiming from './vfx-preview-timing.js'
import assetFolderArchive from './asset-folder-archive.js'
import assetFormatConvert from './asset-format-convert.js'
import assetCompressMobile from './asset-compress-mobile.js'
import assetProjectBackup from './asset-project-backup.js'
import assistRefTrace from './assist-ref-trace.js'
import assistGridRuler from './assist-grid-ruler.js'
import assistEngineExport from './assist-engine-export.js'
import assistPreviewMeta from './assist-preview-meta.js'

export { FEATURE_CATEGORIES } from './categories.js'

export const FEATURES = [
  imageSpriteCut,
  imageLayerEdit,
  imageTransformFilter,
  imageAtlasExport,
  animFrameEdit,
  animBoneRig,
  animFpsLoop,
  animSequenceExport,
  sceneTileBuild,
  sceneObjectCollision,
  sceneLayerZ,
  sceneMapExport,
  sceneMapExpand,
  uiDrawComponents,
  uiStateSprites,
  uiPackExport,
  vfxParticleParams,
  vfxPresets,
  vfxPreviewTiming,
  assetFolderArchive,
  assetFormatConvert,
  assetCompressMobile,
  assetProjectBackup,
  assistRefTrace,
  assistGridRuler,
  assistEngineExport,
  assistPreviewMeta,
]

export function getFeaturesByCategory(categoryId) {
  return FEATURES.filter((f) => f.categoryId === categoryId)
}

export function getFeatureById(id) {
  return FEATURES.find((f) => f.id === id)
}
