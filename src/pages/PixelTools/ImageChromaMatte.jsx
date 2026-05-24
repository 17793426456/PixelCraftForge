import { useEffect, useState } from 'react'
import { Button, ColorPicker, Segmented, Slider, Space, Upload, message } from 'antd'
import { DownloadOutlined, BgColorsOutlined } from '@ant-design/icons'
import { canvasToBlob, loadImageFromFile, triggerDownload } from '../../lib/frameRonin/gifUtils.js'

const { Dragger } = Upload

const PRESETS = {
  green: [0, 255, 0],
  blue: [0, 0, 255],
}

function chromaKeyCanvas(img, keyColor, tolerance, smoothness, spill) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const [kr, kg, kb] = keyColor
  const thresh = (tolerance / 100) * 100
  const smooth = 50 + (smoothness / 100) * 120
  const spillStr = spill / 100

  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    const dr = r - kr
    const dg = g - kg
    const db = b - kb
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    let alpha
    if (dist <= thresh) {
      alpha = 0
    } else if (dist < thresh + smooth) {
      alpha = (dist - thresh) / smooth
    } else {
      alpha = 1
    }

    if (spillStr > 0 && alpha > 0) {
      const spillVal = Math.pow(Math.min(1, Math.max(0, dist - thresh) / Math.max(1, spillStr * 120)), 1.5)
      const gray = r * 0.2126 + g * 0.7152 + b * 0.0722
      let rr = gray * (1 - spillVal) + r * spillVal
      let gg = gray * (1 - spillVal) + g * spillVal
      let bb = gray * (1 - spillVal) + b * spillVal
      if (kg >= kr && kg >= kb) {
        gg = Math.min(gg, (rr + bb) / 2)
      } else if (kb >= kr && kb >= kg) {
        bb = Math.min(bb, (rr + gg) / 2)
      }
      data.data[i] = rr
      data.data[i + 1] = gg
      data.data[i + 2] = bb
    }
    data.data[i + 3] = Math.round(alpha * 255)
  }

  ctx.putImageData(data, 0, 0)
  return canvas
}

export default function ImageChromaMatte() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [preset, setPreset] = useState('green')
  const [customColor, setCustomColor] = useState('#00ff00')
  const [tolerance, setTolerance] = useState(35)
  const [smoothness, setSmoothness] = useState(40)
  const [spill, setSpill] = useState(50)
  const [loading, setLoading] = useState(false)

  const keyColor = preset === 'custom'
    ? (() => {
      const hex = customColor.replace('#', '')
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ]
    })()
    : PRESETS[preset]

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  const handleProcess = async () => {
    if (!file) {
      message.warning('请先上传图片')
      return
    }
    setLoading(true)
    try {
      const img = await loadImageFromFile(file)
      const canvas = chromaKeyCanvas(img, keyColor, tolerance, smoothness, spill)
      const blob = await canvasToBlob(canvas)
      setResultUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
      message.success('抠图完成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '抠图失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pixel-tool-panel">
      <p className="pixel-tool-hint">绿幕/蓝幕色度键抠图，支持容差、边缘羽化与溢色抑制，导出透明 PNG。</p>
      <Dragger accept=".png,.jpg,.jpeg,.webp" maxCount={1} beforeUpload={(f) => { setFile(f); return false }} onRemove={() => setFile(null)}>
        <p><BgColorsOutlined /> 上传带纯色背景的图片</p>
      </Dragger>

      {file && (
        <>
          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
            <Segmented
              value={preset}
              onChange={setPreset}
              options={[
                { label: '绿幕', value: 'green' },
                { label: '蓝幕', value: 'blue' },
                { label: '自定义', value: 'custom' },
              ]}
            />
            {preset === 'custom' && (
              <Space>
                <span style={{ color: 'var(--color-text-secondary)' }}>取色</span>
                <ColorPicker value={customColor} onChange={(_, hex) => setCustomColor(hex)} />
              </Space>
            )}
            <div>
              <span>容差 {tolerance}%</span>
              <Slider min={5} max={80} value={tolerance} onChange={setTolerance} />
            </div>
            <div>
              <span>羽化 {smoothness}%</span>
              <Slider min={0} max={100} value={smoothness} onChange={setSmoothness} />
            </div>
            <div>
              <span>溢色抑制 {spill}%</span>
              <Slider min={0} max={100} value={spill} onChange={setSpill} />
            </div>
          </Space>

          <div className="pixel-tool-actions">
            <Button type="primary" loading={loading} onClick={() => { void handleProcess() }}>
              执行抠图
            </Button>
            {resultUrl && (
              <Button
                icon={<DownloadOutlined />}
                onClick={async () => {
                  const blob = await fetch(resultUrl).then((r) => r.blob())
                  triggerDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}-matte.png`)
                }}
              >
                下载 PNG
              </Button>
            )}
          </div>

          <div className="pixel-preview-row">
            {previewUrl && (
              <div className="pixel-preview-box">
                <strong>原图</strong>
                <img src={previewUrl} alt="原图" />
              </div>
            )}
            {resultUrl && (
              <div className="pixel-preview-box">
                <strong>抠图结果</strong>
                <img src={resultUrl} alt="结果" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
