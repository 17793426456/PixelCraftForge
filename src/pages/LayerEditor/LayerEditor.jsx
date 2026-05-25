import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button, Slider, Upload, ColorPicker, message, Tooltip, Select, Input, Dropdown,
} from '@/components/app/wrapped-ui'
import {
  DownloadOutlined, PlusOutlined, DeleteOutlined, BgColorsOutlined,
  UndoOutlined, RedoOutlined, SaveOutlined, ClearOutlined, CopyOutlined,
  EditOutlined, DragOutlined, ZoomInOutlined, ZoomOutOutlined,
  LockOutlined, UnlockOutlined, EyeOutlined, EyeInvisibleOutlined,
} from '@/lib/icons/antd-lucide'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import imageLayerEdit from '../../constants/features/image-layer-edit.js'
import assistRefTrace from '../../constants/features/assist-ref-trace.js'
import assistGridRuler from '../../constants/features/assist-grid-ruler.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import { saveCanvasToLibrary } from '../../lib/assets/saveToLibrary.js'
import JSZip from 'jszip'
import './LayerEditor.css'

const MAX_UNDO = 32
const CANVAS_SIZE = { w: 512, h: 512 }

const BLEND_MODES = [
  { label: '正常', value: 'source-over' },
  { label: '正片叠底', value: 'multiply' },
  { label: '滤色', value: 'screen' },
  { label: '叠加', value: 'overlay' },
  { label: '变暗', value: 'darken' },
  { label: '变亮', value: 'lighten' },
  { label: '颜色减淡', value: 'color-dodge' },
  { label: '颜色加深', value: 'color-burn' },
  { label: '强光', value: 'hard-light' },
  { label: '柔光', value: 'soft-light' },
  { label: '差值', value: 'difference' },
]

const TOOLS = [
  { id: 'brush', label: '画笔', shortcut: 'B', Icon: EditOutlined },
  { id: 'eraser', label: '橡皮', shortcut: 'E', Icon: ClearOutlined },
  { id: 'picker', label: '吸管', shortcut: 'I', Icon: BgColorsOutlined },
  { id: 'hand', label: '抓手', shortcut: 'H', Icon: DragOutlined },
]

function snapshotCanvas(canvas) {
  const snap = document.createElement('canvas')
  snap.width = canvas.width
  snap.height = canvas.height
  snap.getContext('2d').drawImage(canvas, 0, 0)
  return snap
}

function resolveColor(color) {
  if (typeof color === 'string') return color
  return color?.toHexString?.() ?? '#a855f7'
}

function createEmptyLayer(name, id = Date.now()) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE.w
  canvas.height = CANVAS_SIZE.h
  return {
    id,
    name,
    canvas,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'source-over',
  }
}

function drawThumb(el, canvas) {
  if (!el || !canvas) return
  const size = 44
  el.width = size
  el.height = size
  const ctx = el.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(canvas, 0, 0, size, size)
}

function LayerThumb({ canvas, revision }) {
  const ref = useRef(null)
  useEffect(() => {
    drawThumb(ref.current, canvas)
  }, [canvas, revision])
  return <canvas ref={ref} className="lyed-layer-thumb" aria-hidden="true" />
}

export default function LayerEditor() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const initialLayer = createEmptyLayer('图层 1')
  const [layers, setLayers] = useState([initialLayer])
  const [activeId, setActiveId] = useState(initialLayer.id)
  const [brushSize, setBrushSize] = useState(12)
  const [brushOpacity, setBrushOpacity] = useState(1)
  const [color, setColor] = useState('#a855f7')
  const [tool, setTool] = useState('brush')
  const [drawing, setDrawing] = useState(false)
  const [panning, setPanning] = useState(false)
  const [refOpacity, setRefOpacity] = useState(0.35)
  const [showGrid, setShowGrid] = useState(true)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [layersRevision, setLayersRevision] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [editingNameId, setEditingNameId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const refImgRef = useRef(null)
  const strokeStartedRef = useRef(false)
  const panStartRef = useRef(null)

  const activeLayer = layers.find((l) => l.id === activeId)

  const bumpRevision = () => setLayersRevision((v) => v + 1)

  const updateLayer = useCallback((id, patch) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    bumpRevision()
  }, [])

  const composite = useCallback(() => {
    const out = document.createElement('canvas')
    out.width = CANVAS_SIZE.w
    out.height = CANVAS_SIZE.h
    const ctx = out.getContext('2d')
    for (const layer of layers) {
      if (!layer.visible) continue
      ctx.globalAlpha = layer.opacity ?? 1
      ctx.globalCompositeOperation = layer.blendMode || 'source-over'
      ctx.drawImage(layer.canvas, 0, 0)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    return out
  }, [layers])

  const redrawPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_SIZE.w
    canvas.height = CANVAS_SIZE.h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_SIZE.w, CANVAS_SIZE.h)

    if (showGrid) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, CANVAS_SIZE.w, CANVAS_SIZE.h)
      ctx.strokeStyle = 'rgba(168,85,247,0.15)'
      const step = 32
      for (let x = 0; x <= CANVAS_SIZE.w; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_SIZE.h)
        ctx.stroke()
      }
      for (let y = 0; y <= CANVAS_SIZE.h; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_SIZE.w, y)
        ctx.stroke()
      }
    }

    if (refImgRef.current) {
      ctx.globalAlpha = refOpacity
      ctx.drawImage(refImgRef.current, 0, 0, CANVAS_SIZE.w, CANVAS_SIZE.h)
      ctx.globalAlpha = 1
    }

    ctx.drawImage(composite(), 0, 0)
  }, [composite, showGrid, refOpacity])

  useEffect(() => { redrawPreview() }, [redrawPreview, layersRevision])

  const pushUndo = (layerId, canvasSnap) => {
    setUndoStack((prev) => [...prev.slice(-MAX_UNDO + 1), { layerId, canvas: canvasSnap }])
    setRedoStack([])
  }

  const restoreLayerCanvas = (layerId, snap) => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== layerId) return l
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_SIZE.w
      canvas.height = CANVAS_SIZE.h
      canvas.getContext('2d').drawImage(snap, 0, 0)
      return { ...l, canvas }
    }))
    bumpRevision()
    requestAnimationFrame(redrawPreview)
  }

  const undo = useCallback(() => {
    if (!undoStack.length) return
    const last = undoStack[undoStack.length - 1]
    const layer = layers.find((l) => l.id === last.layerId)
    if (layer) {
      setRedoStack((r) => [...r, { layerId: last.layerId, canvas: snapshotCanvas(layer.canvas) }])
      restoreLayerCanvas(last.layerId, last.canvas)
      setUndoStack((u) => u.slice(0, -1))
      message.info('已撤销')
    }
  }, [undoStack, layers])

  const redo = useCallback(() => {
    if (!redoStack.length) return
    const last = redoStack[redoStack.length - 1]
    const layer = layers.find((l) => l.id === last.layerId)
    if (layer) {
      setUndoStack((u) => [...u, { layerId: last.layerId, canvas: snapshotCanvas(layer.canvas) }])
      restoreLayerCanvas(last.layerId, last.canvas)
      setRedoStack((r) => r.slice(0, -1))
      message.info('已重做')
    }
  }, [redoStack, layers])

  const addLayer = (name) => {
    const layer = createEmptyLayer(name ?? `图层 ${layers.length + 1}`)
    setLayers((prev) => [...prev, layer])
    setActiveId(layer.id)
    bumpRevision()
  }

  const duplicateLayer = (id) => {
    const src = layers.find((l) => l.id === id)
    if (!src) return
    const layer = {
      ...src,
      id: Date.now(),
      name: `${src.name} 副本`,
      canvas: snapshotCanvas(src.canvas),
      locked: false,
    }
    const idx = layers.findIndex((l) => l.id === id)
    setLayers((prev) => [...prev.slice(0, idx + 1), layer, ...prev.slice(idx + 1)])
    setActiveId(layer.id)
    bumpRevision()
    message.success('图层已复制')
  }

  const deleteLayer = (id) => {
    if (layers.length <= 1) {
      message.warning('至少保留一个图层')
      return
    }
    setLayers((prev) => prev.filter((l) => l.id !== id))
    if (activeId === id) {
      setActiveId(layers.find((l) => l.id !== id)?.id ?? null)
    }
    bumpRevision()
  }

  const moveLayer = (fromId, toId) => {
    if (fromId === toId) return
    setLayers((prev) => {
      const fromIdx = prev.findIndex((l) => l.id === fromId)
      const toIdx = prev.findIndex((l) => l.id === toId)
      if (fromIdx < 0 || toIdx < 0) return prev
      const next = [...prev]
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return next
    })
    bumpRevision()
  }

  const clientToCanvas = (clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * CANVAS_SIZE.w
    const y = ((clientY - rect.top) / rect.height) * CANVAS_SIZE.h
    if (x < 0 || y < 0 || x >= CANVAS_SIZE.w || y >= CANVAS_SIZE.h) return null
    return { x, y }
  }

  const pickColor = (clientX, clientY) => {
    const pt = clientToCanvas(clientX, clientY)
    if (!pt) return
    const merged = composite()
    const ctx = merged.getContext('2d')
    const p = ctx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data
    if (p[3] === 0) {
      message.info('该位置为透明，已跳过吸色')
      return
    }
    const hex = `#${[p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`
    setColor(hex)
    setTool('brush')
    message.success('已吸取颜色')
  }

  const paint = (clientX, clientY) => {
    if (!drawing || !activeLayer || activeLayer.locked) return
    if (tool === 'hand' || tool === 'picker') return

    if (!strokeStartedRef.current) {
      pushUndo(activeLayer.id, snapshotCanvas(activeLayer.canvas))
      strokeStartedRef.current = true
    }

    const pt = clientToCanvas(clientX, clientY)
    if (!pt) return

    const ctx = activeLayer.canvas.getContext('2d')
    const rgba = resolveColor(color)

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = brushOpacity
      ctx.fillStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = brushOpacity
      ctx.fillStyle = rgba
    }

    ctx.beginPath()
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    bumpRevision()
    redrawPreview()
  }

  const handlePointerDown = (e) => {
    if (tool === 'hand') {
      setPanning(true)
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      return
    }
    if (tool === 'picker') {
      pickColor(e.clientX, e.clientY)
      return
    }
    if (!activeId) addLayer()
    setDrawing(true)
    strokeStartedRef.current = false
    paint(e.clientX, e.clientY)
  }

  const handlePointerMove = (e) => {
    if (panning && panStartRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      })
      return
    }
    if (drawing) paint(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    setDrawing(false)
    setPanning(false)
    panStartRef.current = null
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.min(4, Math.max(0.25, Math.round((z + delta) * 100) / 100)))
  }

  const importImage = async (file) => {
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise((res, rej) => {
        const el = new Image()
        el.onload = () => res(el)
        el.onerror = rej
        el.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_SIZE.w
      canvas.height = CANVAS_SIZE.h
      canvas.getContext('2d').drawImage(img, 0, 0, CANVAS_SIZE.w, CANVAS_SIZE.h)
      const id = Date.now()
      setLayers((prev) => [...prev, {
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        canvas,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'source-over',
      }])
      setActiveId(id)
      bumpRevision()
      message.success('已导入为图层')
    } catch {
      message.error('导入失败')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const importRefImage = (file) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { refImgRef.current = img; bumpRevision(); redrawPreview() }
    img.onerror = () => message.error('参考图加载失败')
    img.src = url
    message.success('参考图已加载，可调节透明度临摹')
  }

  const clearActiveLayer = () => {
    if (!activeLayer || activeLayer.locked) return
    pushUndo(activeLayer.id, snapshotCanvas(activeLayer.canvas))
    activeLayer.canvas.getContext('2d').clearRect(0, 0, CANVAS_SIZE.w, CANVAS_SIZE.h)
    bumpRevision()
    redrawPreview()
    message.success('当前图层已清空')
  }

  const exportMerged = async () => {
    const blob = await new Promise((r) => composite().toBlob(r, 'image/png'))
    triggerDownload(blob, 'layer-merged.png')
    message.success('已导出合并图')
  }

  const exportLayersZip = async () => {
    const zip = new JSZip()
    let i = 0
    for (const layer of layers) {
      const blob = await new Promise((r) => layer.canvas.toBlob(r, 'image/png'))
      zip.file(`layer_${String(++i).padStart(2, '0')}_${layer.name.replace(/[^\w.-]/g, '_')}.png`, blob)
    }
    triggerDownload(await zip.generateAsync({ type: 'blob' }), 'layers.zip')
    message.success('分层 ZIP 已导出')
  }

  const saveToLibrary = async () => {
    try {
      await saveCanvasToLibrary(composite(), 'layer-merged.png', {
        funcType: '道具物品类',
        folder: '图层编辑',
        style: '像素风',
      })
      message.success('合并图已存入素材仓库')
    } catch {
      message.error('入库失败')
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      if (!e.ctrlKey && !e.metaKey) {
        const t = TOOLS.find((x) => x.shortcut.toLowerCase() === e.key.toLowerCase())
        if (t) setTool(t.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const fileMenu = {
    items: [
      {
        key: 'import',
        label: (
          <Upload showUploadList={false} beforeUpload={(f) => { void importImage(f); return false }} accept="image/*">
            导入图片为图层
          </Upload>
        ),
      },
      {
        key: 'ref',
        label: (
          <Upload showUploadList={false} beforeUpload={(f) => { importRefImage(f); return false }} accept="image/*">
            导入参考图
          </Upload>
        ),
      },
      { type: 'divider' },
      { key: 'export', label: '导出合并 PNG', onClick: () => { void exportMerged() } },
      { key: 'zip', label: '导出分层 ZIP', onClick: () => { void exportLayersZip() } },
      { key: 'lib', label: '存入素材仓库', onClick: () => { void saveToLibrary() } },
    ],
  }

  const viewportClass = [
    'lyed-viewport',
    tool === 'hand' ? 'is-hand' : '',
    panning ? 'is-panning' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="vf-page lyed-page">
      <div className="vf-page-bg pt-page-bg" aria-hidden="true" />

      <div className="lyed-page-inner">
        <header className="lyed-header">
          <h1><BgColorsOutlined /> 图层编辑器</h1>
          <p>Photoshop 风格多图层编辑 — 画笔、混合模式、图层面板、缩放平移与参考图临摹</p>
        </header>

        <div className="lyed-callouts">
          <FeatureCallout feature={imageLayerEdit} />
          <FeatureCallout feature={assistRefTrace} />
          <FeatureCallout feature={assistGridRuler} />
        </div>

        <div className="lyed-workspace">
          {/* 左侧工具栏 */}
          <aside className="lyed-tools" aria-label="工具">
            {TOOLS.map(({ id, label, shortcut, Icon }) => (
              <Tooltip key={id} title={`${label} (${shortcut})`} placement="right">
                <button
                  type="button"
                  className={`lyed-tool-btn${tool === id ? ' is-active' : ''}`}
                  onClick={() => setTool(id)}
                  aria-label={label}
                  aria-pressed={tool === id}
                >
                  <Icon />
                </button>
              </Tooltip>
            ))}
          </aside>

          {/* 中间画布区 */}
          <section className="lyed-center">
            <div className="lyed-menubar">
              <div className="lyed-menubar-group">
                <Dropdown menu={fileMenu} trigger={['click']}>
                  <Button size="small">文件</Button>
                </Dropdown>
              </div>
              <div className="lyed-menubar-group">
                <Tooltip title="撤销 (Ctrl+Z)">
                  <Button size="small" icon={<UndoOutlined />} onClick={undo} disabled={!undoStack.length} />
                </Tooltip>
                <Tooltip title="重做 (Ctrl+Shift+Z)">
                  <Button size="small" icon={<RedoOutlined />} onClick={redo} disabled={!redoStack.length} />
                </Tooltip>
              </div>
              <div className="lyed-menubar-group">
                <Button size="small" type={showGrid ? 'primary' : 'default'} onClick={() => setShowGrid((g) => !g)}>
                  网格
                </Button>
                <Button size="small" icon={<ClearOutlined />} onClick={clearActiveLayer} disabled={!activeLayer || activeLayer.locked}>
                  清空图层
                </Button>
              </div>
              <div className="lyed-menubar-group">
                <span className="lyed-menubar-label">参考图透明度</span>
                <Slider min={0.05} max={0.9} step={0.05} value={refOpacity} onChange={setRefOpacity} style={{ width: 80 }} />
              </div>
            </div>

            <div className="lyed-options">
              {(tool === 'brush' || tool === 'eraser') && (
                <>
                  <span className="lyed-options-label">大小 {brushSize}px</span>
                  <Slider min={1} max={64} value={brushSize} onChange={setBrushSize} style={{ width: 100 }} />
                  <span className="lyed-options-label">流量 {Math.round(brushOpacity * 100)}%</span>
                  <Slider min={0.05} max={1} step={0.05} value={brushOpacity} onChange={setBrushOpacity} style={{ width: 80 }} />
                </>
              )}
              {tool === 'brush' && (
                <>
                  <span className="lyed-options-label">颜色</span>
                  <ColorPicker
                    value={color}
                    onChange={(c) => setColor(typeof c === 'string' ? c : c.toHexString())}
                  />
                </>
              )}
              {tool === 'picker' && <span className="lyed-options-label">点击画布吸取颜色</span>}
              {tool === 'hand' && <span className="lyed-options-label">拖拽平移画布 · 滚轮缩放</span>}
              {activeLayer?.locked && (
                <span className="lyed-options-label" style={{ color: '#f59e0b' }}>当前图层已锁定</span>
              )}
            </div>

            <div
              className={viewportClass}
              onWheel={handleWheel}
              role="presentation"
            >
              <div
                ref={wrapRef}
                className="lyed-canvas-wrap"
                style={{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})` }}
              >
                <canvas
                  ref={canvasRef}
                  className="lyed-canvas"
                  style={{
                    width: CANVAS_SIZE.w,
                    height: CANVAS_SIZE.h,
                    touchAction: 'none',
                  }}
                  onMouseDown={handlePointerDown}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onMouseMove={handlePointerMove}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const t = e.touches[0]
                    if (!t) return
                    handlePointerDown({ clientX: t.clientX, clientY: t.clientY })
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault()
                    const t = e.touches[0]
                    if (!t) return
                    handlePointerMove({ clientX: t.clientX, clientY: t.clientY })
                  }}
                  onTouchEnd={handlePointerUp}
                />
              </div>
            </div>

            <div className="lyed-zoom-bar">
              <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} />
              <span>{Math.round(zoom * 100)}%</span>
              <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(4, z + 0.25))} />
              <Button size="small" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>适应窗口</Button>
            </div>
          </section>

          {/* 右侧图层面板 */}
          <aside className="lyed-layers-panel">
            <div className="lyed-panel-head">图层</div>

            {activeLayer && (
              <div className="lyed-blend-row">
                <Select
                  size="small"
                  style={{ width: '100%', marginBottom: 8 }}
                  value={activeLayer.blendMode}
                  onChange={(v) => updateLayer(activeLayer.id, { blendMode: v })}
                  options={BLEND_MODES}
                />
                <div className="lyed-panel-foot-label">不透明度 {Math.round((activeLayer.opacity ?? 1) * 100)}%</div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={activeLayer.opacity ?? 1}
                  onChange={(v) => updateLayer(activeLayer.id, { opacity: v })}
                />
              </div>
            )}

            <ul className="lyed-layer-list">
              {[...layers].reverse().map((layer) => (
                <li
                  key={layer.id}
                  className={[
                    'lyed-layer-item',
                    activeId === layer.id ? 'is-active' : '',
                    dragOverId === layer.id ? 'is-drag-over' : '',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/layer-id', String(layer.id))}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(layer.id) }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const fromId = Number(e.dataTransfer.getData('text/layer-id'))
                    moveLayer(fromId, layer.id)
                    setDragOverId(null)
                  }}
                  onClick={() => setActiveId(layer.id)}
                >
                  <LayerThumb canvas={layer.canvas} revision={layersRevision} />
                  <div className="lyed-layer-meta">
                    {editingNameId === layer.id ? (
                      <Input
                        size="small"
                        className="lyed-layer-name"
                        defaultValue={layer.name}
                        autoFocus
                        onBlur={(e) => {
                          updateLayer(layer.id, { name: e.target.value || layer.name })
                          setEditingNameId(null)
                        }}
                        onPressEnter={(e) => e.target.blur()}
                      />
                    ) : (
                      <button
                        type="button"
                        className="lyed-layer-name"
                        onDoubleClick={(e) => { e.stopPropagation(); setEditingNameId(layer.id) }}
                      >
                        {layer.name}
                      </button>
                    )}
                  </div>
                  <div className="lyed-layer-actions">
                    <button
                      type="button"
                      className={`lyed-icon-btn${layer.visible ? ' is-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
                      aria-label={layer.visible ? '隐藏' : '显示'}
                    >
                      {layer.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </button>
                    <button
                      type="button"
                      className={`lyed-icon-btn${layer.locked ? ' is-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }}
                      aria-label={layer.locked ? '解锁' : '锁定'}
                    >
                      {layer.locked ? <LockOutlined /> : <UnlockOutlined />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="lyed-panel-btns">
              <Tooltip title="新建图层">
                <Button size="small" icon={<PlusOutlined />} onClick={() => addLayer()} />
              </Tooltip>
              <Tooltip title="复制图层">
                <Button size="small" icon={<CopyOutlined />} onClick={() => activeId && duplicateLayer(activeId)} disabled={!activeId} />
              </Tooltip>
              <Tooltip title="删除图层">
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => activeId && deleteLayer(activeId)} disabled={!activeId || layers.length <= 1} />
              </Tooltip>
              <Tooltip title="导出">
                <Button size="small" icon={<DownloadOutlined />} onClick={() => { void exportMerged() }} />
              </Tooltip>
              <Tooltip title="入库">
                <Button size="small" icon={<SaveOutlined />} onClick={() => { void saveToLibrary() }} />
              </Tooltip>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
