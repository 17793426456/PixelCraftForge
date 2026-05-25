import { useEffect, useState } from 'react'
import { Download, LayoutGrid, Save } from 'lucide-react'
import { Button } from '@/components/app/AppButton'
import { Checkbox } from '@/components/ui/checkbox'
import FileDropzone from '@/components/app/FileDropzone'
import NumberInput from '@/components/app/NumberInput'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import uiDrawComponents from '../../constants/features/ui-draw-components.js'
import uiStateSprites from '../../constants/features/ui-state-sprites.js'
import uiPackExport from '../../constants/features/ui-pack-export.js'
import { convertImageBlob, zipBlobs } from '../../lib/assets/imageExport.js'
import { saveBlobToLibrary } from '../../lib/assets/saveToLibrary.js'

const STATES = [
  { key: 'normal', label: '普通', filter: 'none' },
  { key: 'hover', label: '选中', filter: 'brightness(1.15) saturate(1.2)' },
  { key: 'disabled', label: '禁用', filter: 'grayscale(1) opacity(0.55)' },
]

function drawButtonTemplate({ width, height, label, variant = 'primary' }) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const r = Math.min(12, height / 3)
  ctx.fillStyle = variant === 'primary' ? '#7c3aed' : '#2d2d3a'
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(width - r, 0)
  ctx.quadraticCurveTo(width, 0, width, r)
  ctx.lineTo(width, height - r)
  ctx.quadraticCurveTo(width, height, width - r, height)
  ctx.lineTo(r, height)
  ctx.quadraticCurveTo(0, height, 0, height - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${Math.floor(height * 0.38)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, width / 2, height / 2)
  return canvas
}

async function renderStatesFromSource(source, scale = 1) {
  const out = {}
  let blob = source
  if (source instanceof HTMLCanvasElement) {
    blob = await new Promise((r) => source.toBlob(r, 'image/png'))
  }
  for (const s of STATES) {
    const converted = await convertImageBlob(blob, { format: 'image/png', maxEdge: scale > 1 ? null : undefined })
    const url = URL.createObjectURL(converted)
    const img = await new Promise((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = rej
      el.src = url
    })
    URL.revokeObjectURL(url)
    let w = img.naturalWidth * scale
    let h = img.naturalHeight * scale
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.filter = s.filter
    ctx.drawImage(img, 0, 0, w, h)
    const previewUrl = canvas.toDataURL('image/png')
    const pngBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
    out[s.key] = { previewUrl, blob: pngBlob, label: s.label }
  }
  return out
}

export default function UiKitStudio() {
  const [file, setFile] = useState(null)
  const [previews, setPreviews] = useState({})
  const [export2x, setExport2x] = useState(false)
  const [templateLabel, setTemplateLabel] = useState('开始游戏')
  const [templateW, setTemplateW] = useState(160)
  const [templateH, setTemplateH] = useState(48)
  const [mode, setMode] = useState('upload')

  useEffect(() => {
    if (mode !== 'upload' || !file) {
      if (mode === 'upload') setPreviews({})
      return undefined
    }
    let cancelled = false
    void (async () => {
      const out = await renderStatesFromSource(file, export2x ? 2 : 1)
      if (!cancelled) setPreviews(out)
    })()
    return () => { cancelled = true }
  }, [file, export2x, mode])

  const generateFromTemplate = async () => {
    const canvas = drawButtonTemplate({ width: templateW, height: templateH, label: templateLabel })
    const out = await renderStatesFromSource(canvas, export2x ? 2 : 1)
    setPreviews(out)
    message.success('已从模板生成三态预览')
  }

  const handleExport = async () => {
    if (!Object.keys(previews).length) {
      message.warning('请先生成或上传 UI 切图')
      return
    }
    const base = mode === 'template' ? templateLabel.replace(/\s+/g, '_') : (file?.name.replace(/\.[^.]+$/, '') ?? 'ui')
    const suffix = export2x ? '@2x' : ''
    const entries = STATES.filter((s) => previews[s.key]?.blob).map((s) => ({
      name: `${base}_${s.key}${suffix}.png`,
      blob: previews[s.key].blob,
    }))
    await zipBlobs(entries, `${base}_ui_states${suffix}.zip`)
    message.success('三态 UI 资源包已下载')
  }

  const saveToLibrary = async () => {
    const normal = previews.normal?.blob
    if (!normal) {
      message.warning('请先生成三态图')
      return
    }
    await saveBlobToLibrary(normal, `ui_${templateLabel || 'button'}_normal.png`, {
      funcType: 'UI交互类',
      folder: 'UI工作室',
    })
    message.success('normal 态已存入素材仓库')
  }

  return (
    <div className="vf-page atelier-page-wrap">
      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero">
          <h1 className="atelier-title"><LayoutGrid className="inline size-5" /> UI 素材工作室</h1>
          <p className="atelier-subtitle">上传切图或绘制按钮模板，生成 normal / hover / disabled 三态并打包</p>
        </header>
        <FeatureCallout feature={uiDrawComponents} />
        <FeatureCallout feature={uiStateSprites} />
        <FeatureCallout feature={uiPackExport} />
        <Stack wrap style={{ marginBottom: 16 }}>
          <Button type={mode === 'upload' ? 'primary' : 'default'} onClick={() => setMode('upload')}>上传模式</Button>
          <Button type={mode === 'template' ? 'primary' : 'default'} onClick={() => setMode('template')}>模板绘制</Button>
          <label className="inline-flex items-center gap-2 text-sm">
            <Checkbox checked={export2x} onCheckedChange={setExport2x} />
            @2x 导出
          </label>
        </Stack>
        {mode === 'upload' ? (
          <FileDropzone accept="image/*" onFiles={(files) => { if (files[0]) setFile(files[0]) }}>
            <Button>上传 UI 图</Button>
          </FileDropzone>
        ) : (
          <Stack wrap style={{ marginBottom: 16 }}>
            <span className="inline-flex items-center gap-2 text-sm"><span className="text-muted-foreground">宽</span><NumberInput min={80} max={320} value={templateW} onChange={(v) => setTemplateW(v ?? 160)} /></span>
            <span className="inline-flex items-center gap-2 text-sm"><span className="text-muted-foreground">高</span><NumberInput min={24} max={96} value={templateH} onChange={(v) => setTemplateH(v ?? 48)} /></span>
            <input
              value={templateLabel}
              onChange={(e) => setTemplateLabel(e.target.value)}
              placeholder="按钮文字"
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff' }}
            />
            <Button type="primary" onClick={() => { void generateFromTemplate() }}>生成三态</Button>
          </Stack>
        )}
        <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
          <Button type="primary" icon={<Download />} onClick={() => { void handleExport() }}>导出三态 ZIP</Button>
          <Button icon={<Save />} onClick={() => { void saveToLibrary() }}>存入仓库</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {STATES.map((s) => (
            <div key={s.key} style={{ textAlign: 'center' }}>
              <strong>{s.label} ({s.key})</strong>
              {previews[s.key]?.previewUrl ? (
                <img src={previews[s.key].previewUrl} alt={s.key} style={{ width: '100%', maxWidth: 160, marginTop: 8, background: '#1a1a22', borderRadius: 8 }} />
              ) : (
                <div style={{ height: 120, marginTop: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
