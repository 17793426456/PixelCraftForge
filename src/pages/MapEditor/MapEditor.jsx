import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, InputNumber, Select, Space, message } from 'antd'
import { DownloadOutlined, BorderOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import sceneTileBuild from '../../constants/features/scene-tile-build.js'
import sceneMapExport from '../../constants/features/scene-map-export.js'
import { exportSceneLayoutJson } from '../../lib/assetProject.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'

const TILE_COLORS = ['#2d2d3a', '#4a3728', '#3d6b4f', '#5b7cba', '#8b5cf6', '#f59e0b']

export default function MapEditor() {
  const [cols, setCols] = useState(16)
  const [rows, setRows] = useState(12)
  const [tileSize, setTileSize] = useState(32)
  const [brush, setBrush] = useState(1)
  const [layer, setLayer] = useState('ground')
  const [grid, setGrid] = useState(() => Array.from({ length: 12 }, () => Array(16).fill(0)))
  const [collisions, setCollisions] = useState(() => Array.from({ length: 12 }, () => Array(16).fill(false)))
  const [paintCollision, setPaintCollision] = useState(false)
  const [isPainting, setIsPainting] = useState(false)
  const canvasRef = useRef(null)

  const resizeGrid = useCallback((c, r) => {
    setGrid((prev) => {
      const next = Array.from({ length: r }, (_, y) =>
        Array.from({ length: c }, (_, x) => prev[y]?.[x] ?? 0))
      return next
    })
    setCollisions((prev) => {
      const next = Array.from({ length: r }, (_, y) =>
        Array.from({ length: c }, (_, x) => prev[y]?.[x] ?? false))
      return next
    })
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = cols * tileSize
    canvas.height = rows * tileSize
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0f0f12'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = grid[y][x]
        ctx.fillStyle = TILE_COLORS[t] ?? TILE_COLORS[0]
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
        if (collisions[y][x]) {
          ctx.strokeStyle = 'rgba(250,84,28,0.9)'
          ctx.strokeRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4)
        }
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath()
      ctx.moveTo(x * tileSize, 0)
      ctx.lineTo(x * tileSize, rows * tileSize)
      ctx.stroke()
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * tileSize)
      ctx.lineTo(cols * tileSize, y * tileSize)
      ctx.stroke()
    }
  }, [cols, rows, tileSize, grid, collisions])

  useEffect(() => { draw() }, [draw])

  const paintAt = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * cols)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * rows)
    if (x < 0 || y < 0 || x >= cols || y >= rows) return
    if (paintCollision) {
      setCollisions((prev) => {
        const next = prev.map((row) => [...row])
        next[y][x] = true
        return next
      })
    } else {
      setGrid((prev) => {
        const next = prev.map((row) => [...row])
        next[y][x] = brush
        return next
      })
    }
    requestAnimationFrame(draw)
  }

  const exportMap = () => {
    const payload = {
      format: 'pixelcraftforge-tilemap-v1',
      cols,
      rows,
      tileSize,
      layer,
      tiles: grid,
      collisions,
    }
    triggerDownload(exportSceneLayoutJson([], payload), 'tilemap.json')
    const canvas = canvasRef.current
    if (canvas) {
      canvas.toBlob((blob) => blob && triggerDownload(blob, 'tilemap-preview.png'))
    }
    message.success('已导出 tilemap.json 与预览图')
  }

  return (
    <div className="vf-page atelier-page-wrap">
      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero">
          <h1 className="atelier-title"><BorderOutlined /> 地图瓦片编辑器</h1>
          <p className="atelier-subtitle">网格绘制地砖、标注碰撞层，导出 JSON + 预览 PNG</p>
        </header>
        <FeatureCallout feature={sceneTileBuild} />
        <FeatureCallout feature={sceneMapExport} />
        <Space wrap style={{ marginBottom: 16 }}>
          <span>列</span><InputNumber min={4} max={64} value={cols} onChange={(v) => { setCols(v ?? 16); resizeGrid(v ?? 16, rows) }} />
          <span>行</span><InputNumber min={4} max={64} value={rows} onChange={(v) => { setRows(v ?? 12); resizeGrid(cols, v ?? 12) }} />
          <span>格</span><InputNumber min={8} max={128} value={tileSize} onChange={(v) => setTileSize(v ?? 32)} />
          <Select value={brush} onChange={setBrush} style={{ width: 100 }} options={TILE_COLORS.map((c, i) => ({ value: i, label: `地砖 ${i}` }))} />
          <Select value={layer} onChange={setLayer} options={[{ value: 'ground', label: '地面层' }, { value: 'decor', label: '装饰层' }]} />
          <Button type={paintCollision ? 'primary' : 'default'} onClick={() => setPaintCollision((p) => !p)}>碰撞绘制</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportMap}>导出地图</Button>
        </Space>
        <canvas
          ref={(el) => { canvasRef.current = el; if (el) draw() }}
          onMouseDown={(e) => { setIsPainting(true); paintAt(e) }}
          onMouseMove={(e) => { if (isPainting) paintAt(e) }}
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
          style={{ width: '100%', maxWidth: cols * tileSize, borderRadius: 8, cursor: 'crosshair' }}
        />
      </div>
    </div>
  )
}
