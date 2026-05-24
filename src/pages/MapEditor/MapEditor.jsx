import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, InputNumber, Select, Space, Upload, message } from 'antd'
import { DownloadOutlined, BorderOutlined, DeleteOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import sceneTileBuild from '../../constants/features/scene-tile-build.js'
import sceneMapExport from '../../constants/features/scene-map-export.js'
import { exportSceneLayoutJson } from '../../lib/assetProject.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'

const TILE_COLORS = ['#2d2d3a', '#4a3728', '#3d6b4f', '#5b7cba', '#8b5cf6', '#f59e0b']

function emptyGrid(r, c, fill = 0) {
  return Array.from({ length: r }, () => Array(c).fill(fill))
}

export default function MapEditor() {
  const [cols, setCols] = useState(16)
  const [rows, setRows] = useState(12)
  const [tileSize, setTileSize] = useState(32)
  const [brush, setBrush] = useState(1)
  const [layer, setLayer] = useState('ground')
  const [groundGrid, setGroundGrid] = useState(() => emptyGrid(12, 16))
  const [decorGrid, setDecorGrid] = useState(() => emptyGrid(12, 16))
  const [collisions, setCollisions] = useState(() => emptyGrid(12, 16, false))
  const [paintCollision, setPaintCollision] = useState(false)
  const [collisionErase, setCollisionErase] = useState(false)
  const [isPainting, setIsPainting] = useState(false)
  const [tileImages, setTileImages] = useState(() => Array(TILE_COLORS.length).fill(null))
  const canvasRef = useRef(null)

  const setActiveGrid = layer === 'decor' ? setDecorGrid : setGroundGrid

  const resizeGrid = useCallback((c, r) => {
    const resize = (prev, fill) => Array.from({ length: r }, (_, y) =>
      Array.from({ length: c }, (_, x) => prev[y]?.[x] ?? fill))
    setGroundGrid((prev) => resize(prev, 0))
    setDecorGrid((prev) => resize(prev, 0))
    setCollisions((prev) => resize(prev, false))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = cols * tileSize
    canvas.height = rows * tileSize
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0f0f12'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const drawLayer = (grid) => {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const t = grid[y][x]
          if (t === 0 && grid === decorGrid) continue
          const img = tileImages[t]
          if (img) {
            ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize)
          } else {
            ctx.fillStyle = TILE_COLORS[t] ?? TILE_COLORS[0]
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
          }
        }
      }
    }

    drawLayer(groundGrid)
    drawLayer(decorGrid)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
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
  }, [cols, rows, tileSize, groundGrid, decorGrid, collisions, tileImages])

  useEffect(() => { draw() }, [draw])

  const paintAt = (e, erase = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * cols)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * rows)
    if (x < 0 || y < 0 || x >= cols || y >= rows) return

    if (paintCollision) {
      setCollisions((prev) => {
        const next = prev.map((row) => [...row])
        next[y][x] = collisionErase || erase ? false : true
        return next
      })
    } else {
      setActiveGrid((prev) => {
        const next = prev.map((row) => [...row])
        next[y][x] = erase ? 0 : brush
        return next
      })
    }
    requestAnimationFrame(draw)
  }

  const importTileTexture = async (file, index) => {
    const url = URL.createObjectURL(file)
    const img = await new Promise((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = rej
      el.src = url
    })
    URL.revokeObjectURL(url)
    setTileImages((prev) => {
      const next = [...prev]
      next[index] = img
      return next
    })
    message.success(`地砖 ${index} 贴图已加载`)
  }

  const exportMap = () => {
    const payload = {
      format: 'pixelcraftforge-tilemap-v2',
      cols,
      rows,
      tileSize,
      layers: {
        ground: groundGrid,
        decor: decorGrid,
      },
      collisions,
      tileColors: TILE_COLORS,
    }
    triggerDownload(exportSceneLayoutJson([], payload), 'tilemap.json')
    canvasRef.current?.toBlob((blob) => blob && triggerDownload(blob, 'tilemap-preview.png'))
    message.success('已导出 tilemap.json（含地面/装饰双图层）与预览图')
  }

  return (
    <div className="vf-page atelier-page-wrap">
      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero">
          <h1 className="atelier-title"><BorderOutlined /> 地图瓦片编辑器</h1>
          <p className="atelier-subtitle">双图层绘制、自定义贴图、碰撞标注与擦除，导出 JSON + PNG</p>
        </header>
        <FeatureCallout feature={sceneTileBuild} />
        <FeatureCallout feature={sceneMapExport} />
        <Space wrap style={{ marginBottom: 16 }}>
          <span>列</span><InputNumber min={4} max={64} value={cols} onChange={(v) => { setCols(v ?? 16); resizeGrid(v ?? 16, rows) }} />
          <span>行</span><InputNumber min={4} max={64} value={rows} onChange={(v) => { setRows(v ?? 12); resizeGrid(cols, v ?? 12) }} />
          <span>格</span><InputNumber min={8} max={128} value={tileSize} onChange={(v) => setTileSize(v ?? 32)} />
          <Select value={brush} onChange={setBrush} style={{ width: 100 }} options={TILE_COLORS.map((c, i) => ({ value: i, label: `地砖 ${i}` }))} />
          <Select value={layer} onChange={setLayer} options={[{ value: 'ground', label: '地面层' }, { value: 'decor', label: '装饰层' }]} />
          <Upload showUploadList={false} beforeUpload={(f) => { void importTileTexture(f, brush); return false }} accept="image/*">
            <Button>为当前笔刷上传贴图</Button>
          </Upload>
          <Button type={paintCollision ? 'primary' : 'default'} onClick={() => { setPaintCollision((p) => !p); setCollisionErase(false) }}>碰撞绘制</Button>
          <Button type={collisionErase ? 'primary' : 'default'} disabled={!paintCollision} onClick={() => setCollisionErase((e) => !e)} icon={<DeleteOutlined />}>碰撞擦除</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportMap}>导出地图</Button>
        </Space>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>右键擦除瓦片 · 当前编辑：{layer === 'ground' ? '地面层' : '装饰层'}</p>
        <canvas
          ref={(el) => { canvasRef.current = el; if (el) draw() }}
          onMouseDown={(e) => { setIsPainting(true); paintAt(e, e.button === 2) }}
          onMouseMove={(e) => { if (isPainting) paintAt(e, e.buttons === 2) }}
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ width: '100%', maxWidth: cols * tileSize, borderRadius: 8, cursor: 'crosshair' }}
        />
      </div>
    </div>
  )
}
