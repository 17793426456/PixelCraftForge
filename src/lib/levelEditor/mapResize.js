/** 地图尺寸边界与扩展步长 */
export const MAP_SIZE_LIMITS = {
  minCols: 8,
  minRows: 8,
  maxCols: 128,
  maxRows: 64,
  stepCols: 4,
  stepRows: 4,
}

function padGrid(grid, cols, rows, { addLeft, addRight, addTop, addBottom }, fill = null) {
  const newCols = cols + addLeft + addRight
  let g = grid.map((row) => {
    const r = [...row]
    while (r.length < cols) r.push(fill)
    return r.slice(0, cols)
  })
  while (g.length < rows) g.push(Array(cols).fill(fill))
  g = g.slice(0, rows)

  g = g.map((row) => [
    ...Array(addLeft).fill(fill),
    ...row,
    ...Array(addRight).fill(fill),
  ])
  for (let i = 0; i < addTop; i += 1) {
    g.unshift(Array(newCols).fill(fill))
  }
  for (let i = 0; i < addBottom; i += 1) {
    g.push(Array(newCols).fill(fill))
  }
  return g
}

export function getExpandDelta(view, direction) {
  const stepC = MAP_SIZE_LIMITS.stepCols
  const stepR = MAP_SIZE_LIMITS.stepRows
  const delta = { addLeft: 0, addRight: 0, addTop: 0, addBottom: 0 }
  if (direction === 'left') delta.addLeft = stepC
  if (direction === 'right') delta.addRight = stepC
  if (direction === 'top') delta.addTop = stepR
  if (direction === 'bottom') delta.addBottom = stepR
  if (direction === 'wide' && view === 'side-scroll') delta.addRight = stepC * 2
  if (direction === 'tall' && view === 'top-down') delta.addBottom = stepR * 2
  return delta
}

export function canExpandMap(project, delta) {
  const { cols, rows } = project.meta
  const newCols = cols + (delta.addLeft ?? 0) + (delta.addRight ?? 0)
  const newRows = rows + (delta.addTop ?? 0) + (delta.addBottom ?? 0)
  return (
    newCols >= MAP_SIZE_LIMITS.minCols
    && newRows >= MAP_SIZE_LIMITS.minRows
    && newCols <= MAP_SIZE_LIMITS.maxCols
    && newRows <= MAP_SIZE_LIMITS.maxRows
  )
}

/**
 * 向指定方向扩展地图，保留已有瓦片与物件坐标（整体平移偏移）
 */
export function expandProjectMap(project, delta) {
  if (!canExpandMap(project, delta)) return null

  const { cols, rows } = project.meta
  const { addLeft = 0, addRight = 0, addTop = 0, addBottom = 0 } = delta
  const newCols = cols + addLeft + addRight
  const newRows = rows + addTop + addBottom
  const pad = { addLeft, addRight, addTop, addBottom }

  return {
    ...project,
    meta: { ...project.meta, cols: newCols, rows: newRows },
    layers: {
      background: padGrid(project.layers.background, cols, rows, pad, null),
      ground: padGrid(project.layers.ground, cols, rows, pad, null),
    },
    objects: project.objects.map((o) => ({
      ...o,
      x: o.x + addLeft,
      y: o.y + addTop,
    })),
    collisions: project.collisions.map((c) => ({
      ...c,
      x: c.x + addLeft,
      y: c.y + addTop,
    })),
  }
}
