/** @param {{ route: string, tab?: string, hash?: string }} feature */
export function buildFeaturePath(feature) {
  if (!feature?.route) return '/'
  const params = new URLSearchParams()
  if (feature.tab) params.set('tab', feature.tab)
  const qs = params.toString()
  const hash = feature.hash ? `#${feature.hash}` : ''
  return `${feature.route}${qs ? `?${qs}` : ''}${hash}`
}

export function applyFeatureTab(searchParams, setTab, tabKey = 'tab') {
  const tab = searchParams.get(tabKey)
  if (tab) setTab(tab)
}
