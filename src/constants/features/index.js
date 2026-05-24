import imageSpriteCut from './image-sprite-cut.js'
import imageLayerEdit from './image-layer-edit.js'

export { FEATURE_CATEGORIES } from './categories.js'

export const FEATURES = [imageSpriteCut, imageLayerEdit]

export function getFeaturesByCategory(categoryId) {
  return FEATURES.filter((f) => f.categoryId === categoryId)
}

export function getFeatureById(id) {
  return FEATURES.find((f) => f.id === id)
}
