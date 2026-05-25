import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button, Input, Select, Space, message, Tooltip,
} from '@/components/app/wrapped-ui'
import {
  DownloadOutlined, SaveOutlined, DeleteOutlined, ZoomInOutlined, ZoomOutOutlined,
  BorderOutlined, FileTextOutlined, UploadOutlined, UndoOutlined, ExpandOutlined,
} from '@/lib/icons/antd-lucide'
import JSZip from 'jszip'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import sceneTileBuild from '../../constants/features/scene-tile-build.js'
import sceneMapExport from '../../constants/features/scene-map-export.js'
import sceneMapExpand from '../../constants/features/scene-map-expand.js'
import sceneObjectCollision from '../../constants/features/scene-object-collision.js'
import {
  PRODUCT, VIEW_MODES, GAME_TYPES, TILE_SIZES, EDITOR_LAYERS, BUILD_TIPS,
} from '../../constants/levelEditor/product.js'
import { ASSET_CATEGORIES, LEVEL_ASSETS, getAssetById } from '../../constants/levelEditor/assetCatalog.js'
import { SCENE_TEMPLATES, applyTemplate } from '../../lib/levelEditor/sceneTemplates.js'
import { buildEngineExportPack, buildLevelDocument } from '../../lib/levelEditor/levelExport.js'
import {
  createEmptyProject, saveLevelProject, loadLevelProjects,
} from '../../lib/levelEditor/levelStorage.js'
import {
  MAP_SIZE_LIMITS, canExpandMap, expandProjectMap, getExpandDelta,
} from '../../lib/levelEditor/mapResize.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import './LevelEditor.css'

const MIN_VIEW_SCALE = 0.5
const MAX_VIEW_SCALE = 4
const DEFAULT_VIEW_SCALE = 1.5

function initProject(view, gameType, tileSize) {
  const cfg = VIEW_MODES[view]
  return createEmptyProject({
    view,
    gameType,
    tileSize,
    cols: cfg.defaultCols,
    rows: cfg.defaultRows,
  })
}

export default function LevelEditor() {
  const canvasRef = useRef(null)
  const replaceInputRef = useRef(null)
  const assetImageCache = useRef(new Map())
  const [project, setProject] = useState(() => initProject('side-scroll', 'platformer', 32))
  const [activeLayer, setActiveLayer] = useState('ground')
  const [selectedAssetId, setSelectedAssetId] = useState('tile_grass')
  const [selectedObjectId, setSelectedObjectId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [assetOverrides, setAssetOverrides] = useState({})
  const [viewScale, setViewScale] = useState(DEFAULT_VIEW_SCALE)
  const [isPainting, setIsPainting] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  const { meta } = project
  const tileSize = meta.tileSize
  const canvasW = meta.cols * tileSize
  const canvasH = meta.rows * tileSize

  const filteredAssets = LEVEL_ASSETS.filter((a) => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
    if (searchText && !a.name.includes(searchText) && !a.tags.some((t) => t.includes(searchText))) return false
    return true
  })

  const drawAssetRect = useCallback((ctx, assetId, px, py, size) => {
    const asset = getAssetById(assetId)
    const img = assetImageCache.current.get(assetId)
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, px, py, size, size)
      return
    }
    ctx.fillStyle = asset?.color ?? '#444'
    ctx.fillRect(px, py, size, size)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const p = project
    canvas.width = canvasW
    canvas.height = canvasH
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0c0c10'
    ctx.fillRect(0, 0, canvasW, canvasH)

    const drawTileLayer = (grid, visible) => {
      if (!visible) return
      for (let y = 0; y < p.meta.rows; y++) {
        for (let x = 0; x < p.meta.cols; x++) {
          const id = grid[y]?.[x]
          if (!id) continue
          drawAssetRect(ctx, id, x * tileSize, y * tileSize, tileSize)
        }
      }
    }

    drawTileLayer(p.layers.background, p.layerState.background.visible)
    drawTileLayer(p.layers.ground, p.layerState.ground.visible)

    if (p.layerState.decor.visible) {
      const sorted = [...p.objects].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
      for (const obj of sorted) {
        const asset = getAssetById(obj.assetId)
        const sz = asset?.size ?? tileSize
        drawAssetRect(ctx, obj.assetId, obj.x * tileSize, obj.y * tileSize, sz)
        if (obj.id === selectedObjectId) {
          ctx.strokeStyle = '#f472b6'
          ctx.lineWidth = 2
          ctx.strokeRect(obj.x * tileSize, obj.y * tileSize, sz, sz)
        }
      }
    }

    if (p.layerState.collision.visible) {
      ctx.fillStyle = 'rgba(250,84,28,0.25)'
      ctx.strokeStyle = 'rgba(250,84,28,0.8)'
      for (const c of p.collisions) {
        ctx.fillRect(c.x * tileSize, c.y * tileSize, c.w * tileSize, c.h * tileSize)
        ctx.strokeRect(c.x * tileSize + 1, c.y * tileSize + 1, c.w * tileSize - 2, c.h * tileSize - 2)
      }
    }

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      for (let x = 0; x <= p.meta.cols; x++) {
        ctx.beginPath()
        ctx.moveTo(x * tileSize, 0)
        ctx.lineTo(x * tileSize, canvasH)
        ctx.stroke()
      }
      for (let y = 0; y <= p.meta.rows; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * tileSize)
        ctx.lineTo(canvasW, y * tileSize)
        ctx.stroke()
      }
    }
  }, [canvasW, canvasH, tileSize, selectedObjectId, showGrid, project, drawAssetRect])

  useEffect(() => { draw() }, [draw, project])

  useEffect(() => {
    Object.entries(assetOverrides).forEach(([id, url]) => {
      const cached = assetImageCache.current.get(id)
      if (cached?.src === url) return
      const img = new Image()
      img.onload = () => draw()
      img.src = url
      assetImageCache.current.set(id, img)
    })
  }, [assetOverrides, draw])

  const paintCell = (gx, gy, erase = false) => {
    if (gx < 0 || gy < 0 || gx >= meta.cols || gy >= meta.rows) return
    const layerCfg = project.layerState[activeLayer]
    if (layerCfg?.locked) return

    setProject((prev) => {
      const next = { ...prev, layers: { ...prev.layers }, objects: [...prev.objects], collisions: [...prev.collisions] }

      if (activeLayer === 'background' || activeLayer === 'ground') {
        const grid = next.layers[activeLayer].map((row) => [...row])
        grid[gy][gx] = erase ? null : selectedAssetId
        next.layers[activeLayer] = grid
      } else if (activeLayer === 'decor') {
        if (erase) {
          next.objects = next.objects.filter((o) => !(o.x === gx && o.y === gy))
        } else {
          next.objects.push({
            id: `obj_${Date.now()}`,
            assetId: selectedAssetId,
            x: gx,
            y: gy,
            depth: meta.view === 'side-view' ? 1 : 0,
            rotation: 0,
            scale: 1,
          })
        }
      } else if (activeLayer === 'collision') {
        if (erase) {
          next.collisions = next.collisions.filter((c) => !(c.x === gx && c.y === gy))
        } else {
          next.collisions.push({ id: `col_${Date.now()}`, x: gx, y: gy, w: 1, h: 1 })
        }
      }
      return next
    })
  }

  const handleCanvasDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const gx = Math.floor(((e.clientX - rect.left) / rect.width) * meta.cols)
    const gy = Math.floor(((e.clientY - rect.top) / rect.height) * meta.rows)

    if (activeLayer === 'decor' && e.button !== 2) {
      const hit = project.objects.find((o) => o.x === gx && o.y === gy)
      if (hit) {
        setSelectedObjectId(hit.id)
        return
      }
    }
    setSelectedObjectId(null)
    setIsPainting(true)
    paintCell(gx, gy, e.button === 2)
  }

  const handleCanvasMove = (e) => {
    if (!isPainting) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const gx = Math.floor(((e.clientX - rect.left) / rect.width) * meta.cols)
    const gy = Math.floor(((e.clientY - rect.top) / rect.height) * meta.rows)
    paintCell(gx, gy, e.buttons === 2)
  }

  const changeView = (view) => {
    const cfg = VIEW_MODES[view]
    const gameType = cfg.gameTypes[0]
    setProject(initProject(view, gameType, meta.tileSize))
    message.info(`已切换为${cfg.label}，画布 ${cfg.defaultCols}×${cfg.defaultRows}`)
  }

  const handleExpandMap = (direction) => {
    const delta = getExpandDelta(meta.view, direction)
    if (!canExpandMap(project, delta)) {
      message.warning(`已达地图尺寸上限（${MAP_SIZE_LIMITS.maxCols}×${MAP_SIZE_LIMITS.maxRows} 格）`)
      return
    }
    const next = expandProjectMap(project, delta)
    if (!next) return
    setProject(next)
    const parts = []
    if (delta.addLeft) parts.push(`左 +${delta.addLeft}`)
    if (delta.addRight) parts.push(`右 +${delta.addRight}`)
    if (delta.addTop) parts.push(`上 +${delta.addTop}`)
    if (delta.addBottom) parts.push(`下 +${delta.addBottom}`)
    message.success(`地图已扩展（${parts.join('，')}）→ ${next.meta.cols}×${next.meta.rows}`)
  }

  const applySceneTemplate = (templateId) => {
    const result = applyTemplate(templateId, meta.cols, meta.rows)
    if (!result) return
    setProject((p) => ({
      ...p,
      layers: { background: result.background, ground: result.ground },
      objects: result.objects,
      collisions: result.collisions,
    }))
    message.success(`已应用模板：${SCENE_TEMPLATES[templateId].name}`)
  }

  const handleReplaceAssetFile = (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedAssetId) return
    const url = URL.createObjectURL(file)
    setAssetOverrides((prev) => ({ ...prev, [selectedAssetId]: url }))
    message.success(`已替换「${getAssetById(selectedAssetId)?.name ?? '素材'}」图片`)
    e.target.value = ''
  }

  const resetAssetOverride = () => {
    if (!selectedAssetId || !assetOverrides[selectedAssetId]) return
    setAssetOverrides((prev) => {
      const next = { ...prev }
      delete next[selectedAssetId]
      return next
    })
    assetImageCache.current.delete(selectedAssetId)
    message.info('已恢复默认素材')
  }

  const exportJson = () => {
    const doc = buildLevelDocument(project)
    triggerDownload(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), `${meta.name || 'level'}.json`)
    message.success(`已导出 ${PRODUCT.exportFormat}`)
  }

  const exportEnginePack = async () => {
    const pack = buildEngineExportPack(project)
    const zip = new JSZip()
    zip.file('level.json', JSON.stringify(pack.master, null, 2))
    zip.file('phaser/phaser-level.json', JSON.stringify(pack.phaser, null, 2))
    zip.file('godot/godot-level.json', JSON.stringify(pack.godot, null, 2))
    zip.file('unity/unity-level.json', JSON.stringify(pack.unity, null, 2))
    zip.file('cocos/cocos-level.json', JSON.stringify(pack.cocos, null, 2))
    zip.file('README.txt', [
      'PixelCraftForge 地图导出包',
      '兼容: Phaser 3 / Godot 4 / Unity 2D / Cocos Creator',
      `规格: ${PRODUCT.exportFormat} v${PRODUCT.specVersion}`,
      `tileSize: ${meta.tileSize}px  view: ${meta.view}`,
    ].join('\n'))
    triggerDownload(await zip.generateAsync({ type: 'blob' }), `${meta.name || 'level'}_engine_pack.zip`)
    message.success('引擎导出包已下载')
  }

  const exportPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) triggerDownload(blob, `${meta.name || 'level'}_preview.png`)
    })
  }

  const saveProject = () => {
    saveLevelProject(project)
    message.success('地图工程已保存到本地')
  }

  const deleteSelectedObject = () => {
    if (!selectedObjectId) return
    setProject((p) => ({ ...p, objects: p.objects.filter((o) => o.id !== selectedObjectId) }))
    setSelectedObjectId(null)
  }

  const tips = BUILD_TIPS[meta.view] ?? []

  return (
    <div className="le-root vf-page">
      <div className="le-callout">
        <FeatureCallout feature={sceneTileBuild} />
      </div>

      <div className="le-toolbar">
        <span className="le-toolbar-title"><BorderOutlined /> {PRODUCT.name}</span>
        <Select
          className="le-control"
          value={meta.view}
          onChange={changeView}
          options={Object.values(VIEW_MODES).map((v) => ({ value: v.id, label: v.label }))}
          style={{ width: 128 }}
        />
        <Select
          className="le-control"
          value={meta.gameType}
          onChange={(v) => setProject((p) => ({ ...p, meta: { ...p.meta, gameType: v } }))}
          options={Object.values(GAME_TYPES).map((g) => ({ value: g.id, label: g.label }))}
          style={{ width: 128 }}
        />
        <Select
          className="le-control"
          value={meta.tileSize}
          onChange={(v) => setProject((p) => ({ ...p, meta: { ...p.meta, tileSize: v } }))}
          options={TILE_SIZES.map((s) => ({ value: s, label: `${s}×${s}` }))}
          style={{ width: 96 }}
        />
        <Input
          className="le-control"
          value={meta.name}
          onChange={(e) => setProject((p) => ({ ...p, meta: { ...p.meta, name: e.target.value } }))}
          placeholder="地图名称"
          style={{ width: 148 }}
        />
        <Button className="le-control" size="small" icon={<SaveOutlined />} onClick={saveProject}>保存工程</Button>
        <Button className="le-control" size="small" icon={<DownloadOutlined />} onClick={exportJson}>导出 JSON</Button>
        <Button className="le-control" size="small" icon={<DownloadOutlined />} onClick={() => { void exportEnginePack() }}>引擎包</Button>
        <Button className="le-control" size="small" icon={<DownloadOutlined />} onClick={exportPng}>预览 PNG</Button>
      </div>

      <div className="le-body">
        <aside className="le-palette">
          <h3>素材库</h3>
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleReplaceAssetFile}
          />
          <div className="le-asset-actions">
            <Button
              block
              className="le-control"
              size="small"
              icon={<UploadOutlined />}
              onClick={() => replaceInputRef.current?.click()}
            >
              替换当前素材
            </Button>
            {assetOverrides[selectedAssetId] && (
              <Button block className="le-control" size="small" icon={<UndoOutlined />} onClick={resetAssetOverride}>
                恢复默认
              </Button>
            )}
          </div>
          <div className="le-template-row">
            {Object.values(SCENE_TEMPLATES).map((t) => (
              <Button key={t.id} className="le-control" size="small" onClick={() => applySceneTemplate(t.id)}>{t.name}</Button>
            ))}
          </div>
          <Select
            className="le-control"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: '100%' }}
            options={[{ value: 'all', label: '全部分类' }, ...ASSET_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
          />
          <Input
            className="le-control"
            placeholder="搜索标签/名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="le-asset-grid">
            {filteredAssets.map((a) => (
              <Tooltip key={a.id} title={`${a.desc} · ${a.tags.join(' ')}`}>
                <button
                  type="button"
                  className={`le-asset-card ${selectedAssetId === a.id ? 'active' : ''}${assetOverrides[a.id] ? ' customized' : ''}`}
                  onClick={() => setSelectedAssetId(a.id)}
                >
                  {assetOverrides[a.id] ? (
                    <img src={assetOverrides[a.id]} alt="" className="le-asset-swatch le-asset-swatch--img" />
                  ) : (
                    <div className="le-asset-swatch" style={{ background: a.color }} />
                  )}
                  <div className="le-asset-name">{a.name}</div>
                </button>
              </Tooltip>
            ))}
          </div>
        </aside>

        <div className="le-canvas-area">
          <div className="le-layer-bar">
            {EDITOR_LAYERS.map((l) => {
              const st = project.layerState[l.id]
              return (
                <Space key={l.id} size={4}>
                  <Button
                    type={activeLayer === l.id ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setActiveLayer(l.id)}
                  >
                    {l.label}
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setProject((p) => ({
                      ...p,
                      layerState: { ...p.layerState, [l.id]: { ...p.layerState[l.id], visible: !st.visible } },
                    }))}
                  >
                    {st.visible ? '显' : '隐'}
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setProject((p) => ({
                      ...p,
                      layerState: { ...p.layerState, [l.id]: { ...p.layerState[l.id], locked: !st.locked } },
                    }))}
                  >
                    {st.locked ? '锁' : '解'}
                  </Button>
                </Space>
              )
            })}
            <Button size="small" type={showGrid ? 'primary' : 'default'} onClick={() => setShowGrid((g) => !g)}>网格</Button>
            {selectedObjectId && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={deleteSelectedObject}>删除物件</Button>
            )}
          </div>

          <div className="le-canvas-viewport" title="拖拽右下角可调整地图容器大小">
            <div className="le-canvas-wrap" style={{ transform: `scale(${viewScale})`, transformOrigin: 'top center' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasDown}
                onMouseMove={handleCanvasMove}
                onMouseUp={() => setIsPainting(false)}
                onMouseLeave={() => setIsPainting(false)}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>

          <div className="le-view-bar">
            <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setViewScale((s) => Math.max(MIN_VIEW_SCALE, s - 0.2))} />
            <span>{Math.round(viewScale * 100)}%</span>
            <Button size="small" onClick={() => setViewScale(DEFAULT_VIEW_SCALE)}>重置</Button>
            <Button size="small" icon={<ZoomInOutlined />} onClick={() => setViewScale((s) => Math.min(MAX_VIEW_SCALE, s + 0.2))} />
            <span>左键绘制 · 右键擦除 · {meta.cols}×{meta.rows} @ {tileSize}px</span>
          </div>
        </div>

        <aside className="le-tips">
          <h3><ExpandOutlined /> 地图扩展</h3>
          <FeatureCallout feature={sceneMapExpand} />
          <p className="le-expand-hint">
            当前 {meta.cols}×{meta.rows} 格 · 上限 {MAP_SIZE_LIMITS.maxCols}×{MAP_SIZE_LIMITS.maxRows}
          </p>
          <div className="le-expand-grid">
            <Button className="le-control" size="small" onClick={() => handleExpandMap('top')}>↑ 上 +{MAP_SIZE_LIMITS.stepRows}</Button>
            <Button className="le-control" size="small" onClick={() => handleExpandMap('left')}>← 左 +{MAP_SIZE_LIMITS.stepCols}</Button>
            <Button className="le-control" size="small" onClick={() => handleExpandMap('right')}>右 +{MAP_SIZE_LIMITS.stepCols} →</Button>
            <Button className="le-control" size="small" onClick={() => handleExpandMap('bottom')}>↓ 下 +{MAP_SIZE_LIMITS.stepRows}</Button>
          </div>
          {meta.view === 'side-scroll' && (
            <Button block className="le-control le-expand-wide" type="primary" onClick={() => handleExpandMap('wide')}>
              横版加宽 +{MAP_SIZE_LIMITS.stepCols * 2} 列
            </Button>
          )}
          {meta.view === 'top-down' && (
            <Button block className="le-control le-expand-wide" type="primary" onClick={() => handleExpandMap('tall')}>
              俯视加高 +{MAP_SIZE_LIMITS.stepRows * 2} 行
            </Button>
          )}
          <h3 className="le-tips-sub"><FileTextOutlined /> 搭建技巧</h3>
          <FeatureCallout feature={sceneMapExport} />
          <FeatureCallout feature={sceneObjectCollision} />
          <ul className="le-tip-list">
            {tips.map((t) => <li key={t}>{t}</li>)}
          </ul>
<p className="le-selected-info">
            当前素材：{getAssetById(selectedAssetId)?.name ?? '-'}
            <br />
            物件数：{project.objects.length} · 碰撞块：{project.collisions.length}
            <br />
            已存工程：{loadLevelProjects().length} 个
          </p>
        </aside>
      </div>
    </div>
  )
}
