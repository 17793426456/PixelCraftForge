import { useEffect, useState } from 'react'
import { assetToBlob } from '../lib/assets/localAssetStore.js'

export function useAssetThumbnails(assets) {
  const [thumbMap, setThumbMap] = useState({})

  useEffect(() => {
    const urls = []
    const map = {}
    for (const asset of assets) {
      if (!asset.mimeType?.startsWith('image/')) continue
      const url = URL.createObjectURL(assetToBlob(asset))
      map[asset.id] = url
      urls.push(url)
    }
    setThumbMap(map)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [assets])

  return thumbMap
}
