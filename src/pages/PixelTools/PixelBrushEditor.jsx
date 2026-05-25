import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button, Slider, Space, Upload, ColorPicker, Select, Tooltip, message, Divider,
} from '@/lib/ui/antd-compat'
import {
  DownloadOutlined, UndoOutlined, ClearOutlined, SaveOutlined, UploadOutlined,
  BorderOutlined, EditOutlined, FormatPainterOutlined, BgColorsOutlined,
  ColumnWidthOutlined, EyeOutlined,
} from '@ant-design/icons'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import { saveCanvasToLibrary } from '../../lib/assets/saveToLibrary.js'

const MAX_UNDO = 32

const SIZE_PRESETS = [
  { label: '16 × 16', w: 16, h: 16 },
  { label: '32 × 32', w: 32, h: 32 },
  { label: '64 × 64', w: 64, h: 64 },
  { label: '128 × 128', w: 128, h: 128 },
  { label: '256 × 256', w: 256, h: 256 },
]

const PALETTE = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#78716c', '#1e293b',
]

const TOOL_LABELS = {
  pencil: '铅笔',
  brush: '画笔',
  eraser: '橡皮',
  fill: '油漆桶',
  picker: '吸色器',
}

function cloneImageData(data) {
  return new ImageData(new Uint8ClampedArray(data.data), data.width, data.height)
}

function hexToRgba(hex, alpha = 255) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha]
}

function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}

function resolveColor(color) {
  if (typeof color === 'string') return color
  return color?.toHexString?.() ?? '#a855f7'
}

export default function PixelBrushEditor() {
  const displayRef = useRef(null)
  const workRef = useRef(null)
  const [size, setSize] = useState({ w: 64, h: 64 })
  const [zoom, setZoom] = useState(8)
  const [tool, setTool] = useState('pencil')
  const [brushSize, setBrushSize] = useState(1)
  const [color, setColor] = useState('#a855f7')
  const [showGrid, setShowGrid] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const strokeStartedRef = useRef(false)
  const lastCellRef = useRef(null)

  const ensureWorkCanvas = useCallback(() => {
    if (!workRef.current) {
      workRef.current = document.createElement('canvas')
    }
    const c = workRef.current
    if (c.width !== size.w || c.height !== size.h) {
      c.width = size.w
      c.height = size.h
      c.getContext('2d').clearRect(0, 0, size.w, size.h)
      setUndoStack([])
    }
    return c
  }, [size.w, size.h])

  const pushUndo = useCallback(() => {
    const c = workRef.current
    if (!c) return
    const snap = c.getContext('2d').getImageData(0, 0, c.width, c.height)
    setUndoStack((prev) => [...prev.slice(-MAX_UNDO + 1), snap])
  }, [])

  const redraw = useCallback(() => {
    const display = displayRef.current
    const work = workRef.current
    if (!display || !work) return

    display.width = size.w * zoom
    display.height = size.h * zoom
    const ctx = display.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, display.width, display.height)

    for (let y = 0; y < size.h; y += 1) {
      for (let x = 0; x < size.w; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a32' : '#1e1e26'
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom)
      }
    }

    ctx.drawImage(work, 0, 0, display.width, display.height)

    if (showGrid) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)'
      ctx.lineWidth = 1
      for (let x = 0; x <= size.w; x += 1) {
        ctx.beginPath()
        ctx.moveTo(x * zoom + 0.5, 0)
        ctx.lineTo(x * zoom + 0.5, display.height)
        ctx.stroke()
      }
      for (let y = 0; y <= size.h; y += 1) {
        ctx.beginPath()
        ctx.moveTo(0, y * zoom + 0.5)
        ctx.lineTo(display.width, y * zoom + 0.5)
        ctx.stroke()
      }
    }
  }, [size.w, size.h, zoom, showGrid])

  useEffect(() => {
    ensureWorkCanvas()
    redraw()
  }, [ensureWorkCanvas, redraw])

  const cellFromClient = (clientX, clientY) => {
    const el = displayRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * size.w)
    const y = Math.floor(((clientY - rect.top) / rect.height) * size.h)
    if (x < 0 || y < 0 || x >= size.w || y >= size.h) return null
    return { x, y }
  }

  const cellFromEvent = (e) => cellFromClient(e.clientX, e.clientY)

  const setPixel = (ctx, x, y, rgba, erase = false) => {
    if (erase) {
      ctx.clearRect(x, y, 1, 1)
      return
    }
    ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 255})`
    ctx.fillRect(x, y, 1, 1)
  }

  const paintBrush = (ctx, cx, cy, rgba, erase) => {
    const half = Math.floor(brushSize / 2)
    for (let dy = -half; dy < brushSize - half; dy += 1) {
      for (let dx = -half; dx < brushSize - half; dx += 1) {
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && y >= 0 && x < size.w && y < size.h) setPixel(ctx, x, y, rgba, erase)
      }
    }
  }

  const floodFill = (ctx, sx, sy, fillRgba) => {
    const { width, height } = ctx.canvas
    const img = ctx.getImageData(0, 0, width, height)
    const { data } = img
    const startIdx = (sy * width + sx) * 4
    const target = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]]
    if (colorsMatch(target, fillRgba)) return

    const stack = [[sx, sy]]
    const visited = new Uint8Array(width * height)

    while (stack.length) {
      const [x, y] = stack.pop()
      if (x < 0 || y < 0 || x >= width || y >= height) continue
      const vi = y * width + x
      if (visited[vi]) continue
      visited[vi] = 1
      const i = vi * 4
      const cur = [data[i], data[i + 1], data[i + 2], data[i + 3]]
      if (!colorsMatch(cur, target)) continue
      data[i] = fillRgba[0]
      data[i + 1] = fillRgba[1]
      data[i + 2] = fillRgba[2]
      data[i + 3] = fillRgba[3]
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    ctx.putImageData(img, 0, 0)
  }

  const applyTool = (cell) => {
    const work = ensureWorkCanvas()
    const ctx = work.getContext('2d')
    const { x, y } = cell
    const rgba = hexToRgba(resolveColor(color))

    if (tool === 'picker') {
      const p = ctx.getImageData(x, y, 1, 1).data
      if (p[3] === 0) {
        message.info('该像素为透明，已跳过吸色')
        return
      }
      const hex = `#${[p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`
      setColor(hex)
      setTool('pencil')
      message.success('已吸取颜色')
      return
    }

    if (tool === 'fill') {
      floodFill(ctx, x, y, rgba)
      redraw()
      return
    }

    const erase = tool === 'eraser'
    if (tool === 'pencil') {
      setPixel(ctx, x, y, rgba, false)
    } else if (tool === 'eraser' && brushSize === 1) {
      setPixel(ctx, x, y, rgba, true)
    } else {
      paintBrush(ctx, x, y, rgba, erase)
    }
    redraw()
  }

  const handlePointer = (e) => {
    const cell = cellFromEvent(e)
    if (!cell) return

    if (tool === 'fill' || tool === 'picker') {
      if (!strokeStartedRef.current) {
        pushUndo()
        strokeStartedRef.current = true
      }
      applyTool(cell)
      return
    }

    const key = `${cell.x},${cell.y}`
    if (lastCellRef.current === key && tool !== 'brush' && tool !== 'eraser') return
    lastCellRef.current = key

    if (!strokeStartedRef.current) {
      pushUndo()
      strokeStartedRef.current = true
    }
    applyTool(cell)
  }

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev
      const last = prev[prev.length - 1]
      const work = ensureWorkCanvas()
      work.getContext('2d').putImageData(cloneImageData(last), 0, 0)
      requestAnimationFrame(redraw)
      message.info('已撤销')
      return prev.slice(0, -1)
    })
  }, [ensureWorkCanvas, redraw])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  const clearCanvas = () => {
    pushUndo()
    const work = ensureWorkCanvas()
    work.getContext('2d').clearRect(0, 0, size.w, size.h)
    redraw()
    message.success('画布已清空')
  }

  const changeSize = (preset) => {
    setSize({ w: preset.w, h: preset.h })
    workRef.current = null
    setUndoStack([])
    message.info(`画布已调整为 ${preset.w}×${preset.h}`)
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
      pushUndo()
      const work = ensureWorkCanvas()
      const ctx = work.getContext('2d')
      ctx.clearRect(0, 0, size.w, size.h)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, size.w, size.h)
      redraw()
      message.success('图片已导入画布')
    } catch {
      message.error('图片导入失败')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const exportPng = async () => {
    const work = ensureWorkCanvas()
    const blob = await new Promise((r) => work.toBlob(r, 'image/png'))
    triggerDownload(blob, `pixel-art-${size.w}x${size.h}.png`)
    message.success('PNG 已导出')
  }

  const saveToLibrary = async () => {
    try {
      const work = ensureWorkCanvas()
      await saveCanvasToLibrary(work, `pixel-art-${size.w}x${size.h}.png`, {
        funcType: '道具物品类',
        folder: '像素画笔',
        style: '像素风',
      })
      message.success('已存入素材仓库')
    } catch {
      message.error('入库失败')
    }
  }

  const presetValue = `${size.w}x${size.h}`

  return (
    <div className="pixel-tool-panel pt-brush-editor">
      <p className="pixel-tool-hint">
        像素级画笔编辑器：逐格绘制、油漆桶填充与吸色，适合图标、道具与精灵草图。所有操作在本地完成。
      </p>

      <div className="pt-brush-toolbar">
        <Space wrap size={[8, 8]}>
          <Select
            value={presetValue}
            style={{ width: 130 }}
            options={SIZE_PRESETS.map((p) => ({ value: `${p.w}x${p.h}`, label: p.label }))}
            onChange={(v) => {
              const p = SIZE_PRESETS.find((x) => `${x.w}x${x.h}` === v)
              if (p) changeSize(p)
            }}
          />
          <Tooltip title="铅笔（1 像素）">
            <Button type={tool === 'pencil' ? 'primary' : 'default'} icon={<EditOutlined />} onClick={() => setTool('pencil')}>铅笔</Button>
          </Tooltip>
          <Tooltip title="画笔（可调大小）">
            <Button type={tool === 'brush' ? 'primary' : 'default'} icon={<FormatPainterOutlined />} onClick={() => setTool('brush')}>画笔</Button>
          </Tooltip>
          <Tooltip title="橡皮擦">
            <Button type={tool === 'eraser' ? 'primary' : 'default'} icon={<ClearOutlined />} onClick={() => setTool('eraser')}>橡皮</Button>
          </Tooltip>
          <Tooltip title="油漆桶填充">
            <Button type={tool === 'fill' ? 'primary' : 'default'} icon={<BgColorsOutlined />} onClick={() => setTool('fill')}>填充</Button>
          </Tooltip>
          <Tooltip title="吸色器">
            <Button type={tool === 'picker' ? 'primary' : 'default'} icon={<EyeOutlined />} onClick={() => setTool('picker')}>吸色</Button>
          </Tooltip>
          <Button type={showGrid ? 'primary' : 'default'} icon={<BorderOutlined />} onClick={() => setShowGrid((g) => !g)}>网格</Button>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button icon={<UndoOutlined />} onClick={undo} disabled={!undoStack.length}>撤销</Button>
          </Tooltip>
          <Button icon={<ClearOutlined />} onClick={clearCanvas}>清空</Button>
        </Space>

        <Divider style={{ margin: '14px 0', borderColor: 'rgba(255,255,255,0.06)' }} />

        <Space wrap size={[12, 8]} align="center">
          <span className="pt-brush-label">颜色</span>
          <ColorPicker
            value={color}
            onChange={(c) => setColor(typeof c === 'string' ? c : c.toHexString())}
          />
          <div className="pt-brush-palette">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`pt-brush-swatch${resolveColor(color).toLowerCase() === c.toLowerCase() ? ' is-active' : ''}`}
                style={{ background: c }}
                aria-label={`颜色 ${c}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          {(tool === 'brush' || tool === 'eraser') && (
            <>
              <span className="pt-brush-label"><ColumnWidthOutlined /> 笔刷 {brushSize}px</span>
              <Slider min={1} max={8} value={brushSize} onChange={setBrushSize} style={{ width: 120 }} />
            </>
          )}
          <span className="pt-brush-label">缩放 {zoom}×</span>
          <Slider min={4} max={24} value={zoom} onChange={setZoom} style={{ width: 120 }} />
        </Space>

        <div className="pixel-tool-actions pt-brush-actions">
          <Upload showUploadList={false} accept="image/*" beforeUpload={(f) => { void importImage(f); return false }}>
            <Button icon={<UploadOutlined />}>导入图片</Button>
          </Upload>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => { void exportPng() }}>导出 PNG</Button>
          <Button icon={<SaveOutlined />} onClick={() => { void saveToLibrary() }}>存入仓库</Button>
        </div>
      </div>

      <div className="pt-brush-stage">
        <canvas
          ref={displayRef}
          className="pt-brush-canvas"
          style={{ width: size.w * zoom, height: size.h * zoom, touchAction: 'none' }}
          onMouseDown={(e) => { setDrawing(true); strokeStartedRef.current = false; lastCellRef.current = null; handlePointer(e) }}
          onMouseUp={() => { setDrawing(false); lastCellRef.current = null }}
          onMouseLeave={() => { setDrawing(false); lastCellRef.current = null }}
          onMouseMove={(e) => { if (drawing) handlePointer(e) }}
          onTouchStart={(e) => {
            e.preventDefault()
            const t = e.touches[0]
            if (!t) return
            setDrawing(true)
            strokeStartedRef.current = false
            lastCellRef.current = null
            const cell = cellFromClient(t.clientX, t.clientY)
            if (cell) handlePointer({ clientX: t.clientX, clientY: t.clientY })
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            if (!drawing) return
            const t = e.touches[0]
            if (!t) return
            handlePointer({ clientX: t.clientX, clientY: t.clientY })
          }}
          onTouchEnd={() => { setDrawing(false); lastCellRef.current = null }}
        />
        <div className="pt-brush-meta">
          <span>画布 {size.w} × {size.h} px</span>
          <span>当前工具：{TOOL_LABELS[tool]}</span>
        </div>
      </div>
    </div>
  )
}
