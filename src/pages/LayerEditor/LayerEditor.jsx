import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Slider, Space, Upload, ColorPicker, message } from 'antd'
import { DownloadOutlined, PlusOutlined, DeleteOutlined, BgColorsOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import imageLayerEdit from '../../constants/features/image-layer-edit.js'
import assistRefTrace from '../../constants/features/assist-ref-trace.js'
import assistGridRuler from '../../constants/features/assist-grid-ruler.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import JSZip from 'jszip'
import '../PixelTools/PixelTools.css'

export default function LayerEditor() {
  const canvasRef = useRef(null)
  const [layers, setLayers] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [brushSize, setBrushSize] = useState(8)
  const [color, setColor] = useState('#a855f7')
  const [drawing, setDrawing] = useState(false)
  const [refImage, setRefImage] = useState(null)
  const [refOpacity, setRefOpacity] = useState(0.35)
  const [showGrid, setShowGrid] = useState(true)
  const refImgRef = useRef(null)
  const size = { w: 512, h: 512 }

  const activeLayer = layers.find((l) => l.id === activeId)

  const composite = useCallback(() => {
    const out = document.createElement('canvas')
    out.width = size.w
    out.height = size.h
    const ctx = out.getContext('2d')
    for (const layer of layers) {
      if (!layer.visible) continue
      ctx.globalAlpha = layer.opacity
      ctx.drawImage(layer.canvas, 0, 0)
    }
    ctx.globalAlpha = 1
    return out
  }, [layers])

  const redrawPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = size.w
    canvas.height = size.h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1a1a22'
    ctx.fillRect(0, 0, size.w, size.h)
    if (showGrid) {
      ctx.strokeStyle = 'rgba(168,85,247,0.12)'
      const step = 32
      for (let x = 0; x <= size.w; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, size.h)
        ctx.stroke()
      }
      for (let y = 0; y <= size.h; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(size.w, y)
        ctx.stroke()
      }
    }
    if (refImgRef.current) {
      ctx.globalAlpha = refOpacity
      ctx.drawImage(refImgRef.current, 0, 0, size.w, size.h)
      ctx.globalAlpha = 1
    }
    const merged = composite()
    ctx.drawImage(merged, 0, 0)
  }, [composite, showGrid, refOpacity])

  useEffect(() => { redrawPreview() }, [redrawPreview])

  const addLayer = (name = `图层 ${layers.length + 1}`) => {
    const canvas = document.createElement('canvas')
    canvas.width = size.w
    canvas.height = size.h
    const id = Date.now()
    setLayers((prev) => [...prev, { id, name, canvas, visible: true, opacity: 1 }])
    setActiveId(id)
  }

  const paint = (e) => {
    if (!drawing || !activeLayer) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * size.w
    const y = ((e.clientY - rect.top) / rect.height) * size.h
    const ctx = activeLayer.canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    redrawPreview()
  }

  const importImage = async (file) => {
    const url = URL.createObjectURL(file)
    const img = await new Promise((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = rej
      el.src = url
    })
    URL.revokeObjectURL(url)
    const canvas = document.createElement('canvas')
    canvas.width = size.w
    canvas.height = size.h
    canvas.getContext('2d').drawImage(img, 0, 0, size.w, size.h)
    const id = Date.now()
    setLayers((prev) => [...prev, { id, name: file.name, canvas, visible: true, opacity: 1 }])
    setActiveId(id)
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
  }

  return (
    <div className="vf-page atelier-page-wrap pt-page">
      <div className="vf-page-bg pt-page-bg" aria-hidden="true" />
      <div className="atelier-page atelier-page--wide pt-page-inner">
        <header className="atelier-hero">
          <h1 className="atelier-title"><BgColorsOutlined /> 图层编辑器</h1>
          <p className="atelier-subtitle">多图层涂色、抠图底图导入，导出合并 PNG 或分层 ZIP</p>
        </header>
        <FeatureCallout feature={imageLayerEdit} />
        <FeatureCallout feature={assistRefTrace} />
        <FeatureCallout feature={assistGridRuler} />
        <Space wrap style={{ marginBottom: 16 }}>
          <Button icon={<PlusOutlined />} onClick={() => addLayer()}>新建图层</Button>
          <Upload showUploadList={false} beforeUpload={(f) => { void importImage(f); return false }} accept="image/*">
            <Button>导入图片为图层</Button>
          </Upload>
          <Upload showUploadList={false} beforeUpload={(f) => {
            const url = URL.createObjectURL(f)
            const img = new Image()
            img.onload = () => { refImgRef.current = img; setRefImage(url) }
            img.src = url
            return false
          }} accept="image/*"
          >
            <Button>参考图临摹</Button>
          </Upload>
          <Button type={showGrid ? 'primary' : 'default'} onClick={() => setShowGrid((g) => !g)}>网格</Button>
          <span>参考透明度</span>
          <Slider min={0.1} max={0.8} step={0.05} value={refOpacity} onChange={setRefOpacity} style={{ width: 100 }} />
          <ColorPicker value={color} onChange={setColor} />
          <span>笔刷 {brushSize}px</span>
          <Slider min={2} max={48} value={brushSize} onChange={setBrushSize} style={{ width: 120 }} />
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => { void exportMerged() }}>导出合并图</Button>
          <Button icon={<DownloadOutlined />} onClick={() => { void exportLayersZip() }}>导出分层 ZIP</Button>
        </Space>
        <div style={{ display: 'flex', gap: 16 }}>
          <ul style={{ listStyle: 'none', padding: 0, minWidth: 140 }}>
            {layers.map((l) => (
              <li key={l.id} style={{ marginBottom: 8 }}>
                <button type="button" className={`jm-pill ${activeId === l.id ? 'active' : ''}`} onClick={() => setActiveId(l.id)}>{l.name}</button>
                <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => setLayers((p) => p.filter((x) => x.id !== l.id))} />
              </li>
            ))}
          </ul>
          <canvas
            ref={canvasRef}
            className="layer-editor-canvas"
            style={{ width: '100%', maxWidth: 512, aspectRatio: '1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'crosshair' }}
            onMouseDown={() => { if (!activeId) addLayer(); setDrawing(true) }}
            onMouseUp={() => setDrawing(false)}
            onMouseLeave={() => setDrawing(false)}
            onMouseMove={paint}
          />
        </div>
      </div>
    </div>
  )
}
