import { useEffect, useState } from 'react'
import { Download, LayoutGrid, Save, Upload } from 'lucide-react'
import { Button } from '@/components/app/AppButton'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import FileDropzone from '@/components/app/FileDropzone'
import NumberInput from '@/components/app/NumberInput'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import uiDrawComponents from '../../constants/features/ui-draw-components.js'
import uiStateSprites from '../../constants/features/ui-state-sprites.js'
import uiPackExport from '../../constants/features/ui-pack-export.js'
import { UI_KIT_STATES, renderUiKitStatesFromSource } from '../../lib/assets/uiStateRender.js'
import { zipBlobs } from '../../lib/assets/imageExport.js'
import { saveBlobToLibrary } from '../../lib/assets/saveToLibrary.js'
import UiKitSequencePreview from './UiKitSequencePreview.jsx'
import './UiKitStudio.css'

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
      const out = await renderUiKitStatesFromSource(file, export2x ? 2 : 1)
      if (!cancelled) setPreviews(out)
    })()
    return () => { cancelled = true }
  }, [file, export2x, mode])

  const generateFromTemplate = async () => {
    const canvas = drawButtonTemplate({ width: templateW, height: templateH, label: templateLabel })
    const out = await renderUiKitStatesFromSource(canvas, export2x ? 2 : 1)
    setPreviews(out)
    message.success('已从模板生成三态预览（hover 含循环动效帧）')
  }

  const buildZipEntries = () => {
    const base = mode === 'template' ? templateLabel.replace(/\s+/g, '_') : (file?.name.replace(/\.[^.]+$/, '') ?? 'ui')
    const suffix = export2x ? '@2x' : ''
    const entries = []

    for (const s of UI_KIT_STATES) {
      const data = previews[s.key]
      if (!data?.blob && !data?.frames?.length) continue

      if (s.key === 'hover' && data.frames?.length) {
        entries.push({
          name: `${base}_hover${suffix}.png`,
          blob: data.blob,
        })
        data.frames.forEach((frame, i) => {
          entries.push({
            name: `${base}_hover_anim/${String(i + 1).padStart(2, '0')}${suffix}.png`,
            blob: frame.blob,
          })
        })
        continue
      }

      entries.push({
        name: `${base}_${s.key}${suffix}.png`,
        blob: data.blob,
      })
    }

    return entries
  }

  const handleExport = async () => {
    const entries = buildZipEntries()
    if (!entries.length) {
      message.warning('请先生成或上传 UI 切图')
      return
    }
    const base = mode === 'template' ? templateLabel.replace(/\s+/g, '_') : (file?.name.replace(/\.[^.]+$/, '') ?? 'ui')
    const suffix = export2x ? '@2x' : ''
    await zipBlobs(entries, `${base}_ui_states${suffix}.zip`)
    message.success('三态 UI 资源包已下载（含 hover 动效帧序列）')
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

  const renderStatePreview = (s) => {
    if (s.key === 'hover') {
      const hoverFrames = previews.hover?.frames
      if (!hoverFrames?.length) {
        return <div className="uikit-state-placeholder" aria-hidden />
      }
      return (
        <UiKitSequencePreview frames={hoverFrames} variant="compact" defaultFps={10} />
      )
    }

    const url = previews[s.key]?.previewUrl
    if (!url) {
      return <div className="uikit-state-placeholder" aria-hidden />
    }

    return (
      <div className="uikit-state-preview-wrap">
        <img src={url} alt={s.key} className="uikit-state-preview" />
      </div>
    )
  }

  return (
    <div className="vf-page atelier-page-wrap uikit-page">
      <div className="atelier-page atelier-page--wide uikit-page-inner">
        <header className="atelier-hero">
          <h1 className="atelier-title"><LayoutGrid className="inline size-5" /> UI 素材工作室</h1>
          <p className="atelier-subtitle">上传切图或绘制按钮模板，生成 normal / hover / disabled 三态并打包</p>
        </header>
        <div className="uikit-callouts" role="list" aria-label="相关能力">
          <FeatureCallout feature={uiDrawComponents} variant="compact" />
          <FeatureCallout feature={uiStateSprites} variant="compact" />
          <FeatureCallout feature={uiPackExport} variant="compact" />
        </div>
        <Stack wrap className="uikit-toolbar" align="center">
          <div className="uikit-mode-group" role="tablist" aria-label="工作模式">
            <Button
              type={mode === 'upload' ? 'primary' : 'default'}
              className={cn('uikit-control', mode === 'upload' && 'jm-generate-btn')}
              onClick={() => setMode('upload')}
            >
              上传模式
            </Button>
            <Button
              type={mode === 'template' ? 'primary' : 'default'}
              className={cn('uikit-control', mode === 'template' && 'jm-generate-btn')}
              onClick={() => setMode('template')}
            >
              模板绘制
            </Button>
          </div>
          <label className="uikit-check-row inline-flex items-center gap-2 text-sm">
            <Checkbox checked={export2x} onCheckedChange={setExport2x} />
            @2x 导出
          </label>
        </Stack>
        {mode === 'upload' ? (
          <FileDropzone
            className="uikit-upload-zone"
            accept="image/*"
            title="拖拽或点击上传 UI 切图"
            hint="支持 PNG / WebP，上传后自动生成三态预览"
            onFiles={(files) => { if (files[0]) setFile(files[0]) }}
          >
            <Button type="primary" className="uikit-control jm-generate-btn" icon={<Upload className="size-4" />}>
              上传 UI 图
            </Button>
          </FileDropzone>
        ) : (
          <Stack wrap className="uikit-toolbar uikit-template-bar" align="center">
            <span className="uikit-field inline-flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">宽</span>
              <NumberInput min={80} max={320} value={templateW} onChange={(v) => setTemplateW(v ?? 160)} />
            </span>
            <span className="uikit-field inline-flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">高</span>
              <NumberInput min={24} max={96} value={templateH} onChange={(v) => setTemplateH(v ?? 48)} />
            </span>
            <input
              className="uikit-template-input"
              value={templateLabel}
              onChange={(e) => setTemplateLabel(e.target.value)}
              placeholder="按钮文字"
            />
            <Button type="primary" className="uikit-control jm-generate-btn" onClick={() => { void generateFromTemplate() }}>
              生成三态
            </Button>
          </Stack>
        )}
        <div className="uikit-actions">
          <Button
            type="primary"
            className="uikit-control jm-generate-btn"
            icon={<Download className="size-4" />}
            onClick={() => { void handleExport() }}
          >
            导出三态 ZIP
          </Button>
          <Button className="uikit-control" icon={<Save className="size-4" />} onClick={() => { void saveToLibrary() }}>
            存入仓库
          </Button>
        </div>
        <div className="uikit-states-grid">
          {UI_KIT_STATES.map((s) => (
            <div key={s.key} className="uikit-state-cell">
              <strong className="uikit-state-label">{s.label}</strong>
              <span className="uikit-state-key">({s.key})</span>
              {renderStatePreview(s)}
            </div>
          ))}
        </div>
        {previews.hover?.frames?.length > 0 && (
          <section className="uikit-seq-panel" aria-labelledby="uikit-seq-heading">
            <h2 id="uikit-seq-heading" className="uikit-seq-panel-title">Hover 序列图 · 动画预览</h2>
            <p className="uikit-seq-panel-desc">
              基于 {previews.hover.frames.length} 帧序列播放，与导出 ZIP 中 hover_anim 文件夹一致
            </p>
            <UiKitSequencePreview frames={previews.hover.frames} variant="full" defaultFps={10} />
          </section>
        )}
      </div>
    </div>
  )
}
