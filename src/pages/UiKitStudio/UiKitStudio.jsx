import { useEffect, useState } from 'react'
import { Button, Upload, message } from 'antd'
import { DownloadOutlined, AppstoreOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import uiDrawComponents from '../../constants/features/ui-draw-components.js'
import uiStateSprites from '../../constants/features/ui-state-sprites.js'
import uiPackExport from '../../constants/features/ui-pack-export.js'
import { convertImageBlob, zipBlobs } from '../../lib/assets/imageExport.js'

const STATES = [
  { key: 'normal', label: '普通', filter: 'none' },
  { key: 'hover', label: '选中', filter: 'brightness(1.15) saturate(1.2)' },
  { key: 'disabled', label: '禁用', filter: 'grayscale(1) opacity(0.55)' },
]

export default function UiKitStudio() {
  const [file, setFile] = useState(null)
  const [previews, setPreviews] = useState({})

  useEffect(() => {
    if (!file) {
      setPreviews({})
      return undefined
    }
    let cancelled = false
    void (async () => {
      const out = {}
      for (const s of STATES) {
        const blob = await convertImageBlob(file, { format: 'image/png' })
        const url = URL.createObjectURL(blob)
        const img = await new Promise((res, rej) => {
          const el = new Image()
          el.onload = () => res(el)
          el.onerror = rej
          el.src = url
        })
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.filter = s.filter
        ctx.drawImage(img, 0, 0)
        const previewUrl = canvas.toDataURL('image/png')
        const pngBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
        out[s.key] = { previewUrl, blob: pngBlob, label: s.label }
      }
      if (!cancelled) setPreviews(out)
    })()
    return () => { cancelled = true }
  }, [file])

  const handleExport = async () => {
    if (!Object.keys(previews).length) {
      message.warning('请先上传 UI 切图')
      return
    }
    const base = file.name.replace(/\.[^.]+$/, '')
    const entries = STATES.filter((s) => previews[s.key]?.blob).map((s) => ({
      name: `${base}_${s.key}.png`,
      blob: previews[s.key].blob,
    }))
    await zipBlobs(entries, `${base}_ui_states.zip`)
    message.success('三态 UI 资源包已下载')
  }

  return (
    <div className="vf-page atelier-page-wrap">
      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero">
          <h1 className="atelier-title"><AppstoreOutlined /> UI 素材工作室</h1>
          <p className="atelier-subtitle">上传按钮/图标，自动生成 normal / hover / disabled 三态切图并 ZIP 打包</p>
        </header>
        <FeatureCallout feature={uiDrawComponents} />
        <FeatureCallout feature={uiStateSprites} />
        <FeatureCallout feature={uiPackExport} />
        <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
          <Upload beforeUpload={(f) => { setFile(f); return false }} showUploadList={false} accept="image/*">
            <Button>上传 UI 图</Button>
          </Upload>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => { void handleExport() }}>导出三态 ZIP</Button>
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
