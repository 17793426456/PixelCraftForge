import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Palette, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import FileDropzone from '@/components/app/FileDropzone'
import ColorPickerField from '@/components/app/ColorPickerField'
import AppSegmented from '@/components/app/AppSegmented'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import { canvasToBlob, loadImageFromFile, triggerDownload } from '../../lib/frameRonin/gifUtils.js'
import imageLayerEdit from '../../constants/features/image-layer-edit.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'

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
  const autoPreviewRef = useRef(null)

  const resolveKeyColor = useCallback(() => {
    if (preset === 'custom') {
      const hex = customColor.replace('#', '')
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ]
    }
    return PRESETS[preset]
  }, [preset, customColor])

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

  const handleProcess = useCallback(async (silent = false) => {
    if (!file) {
      if (!silent) message.warning('请先上传图片')
      return
    }
    setLoading(true)
    try {
      const img = await loadImageFromFile(file)
      const canvas = chromaKeyCanvas(img, resolveKeyColor(), tolerance, smoothness, spill)
      const blob = await canvasToBlob(canvas)
      setResultUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
      if (!silent) message.success('抠图完成')
    } catch (error) {
      if (!silent) message.error(error instanceof Error ? error.message : '抠图失败')
    } finally {
      setLoading(false)
    }
  }, [file, resolveKeyColor, tolerance, smoothness, spill])

  useEffect(() => {
    if (!file) return undefined
    if (autoPreviewRef.current) clearTimeout(autoPreviewRef.current)
    autoPreviewRef.current = setTimeout(() => {
      void handleProcess(true)
    }, 400)
    return () => {
      if (autoPreviewRef.current) clearTimeout(autoPreviewRef.current)
    }
  }, [file, tolerance, smoothness, spill, preset, customColor, handleProcess])

  return (
    <div className="pixel-tool-panel">
      <FeatureCallout feature={imageLayerEdit} />
      <p className="pixel-tool-hint">绿幕/蓝幕色度键抠图；上传后调节参数将自动预览，也可手动重新抠图。</p>
      <FileDropzone
        accept=".png,.jpg,.jpeg,.webp"
        maxCount={1}
        title="上传带纯色背景的图片"
        onFiles={(files) => setFile(files[0] ?? null)}
      />
      {file && (
        <p className="mt-2 text-sm text-muted-foreground">
          <Palette className="mr-1 inline size-4" />
          {file.name}
        </p>
      )}

      {file && (
        <>
          <Stack direction="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
            <AppSegmented
              value={preset}
              onChange={setPreset}
              options={[
                { label: '绿幕', value: 'green' },
                { label: '蓝幕', value: 'blue' },
                { label: '自定义', value: 'custom' },
              ]}
            />
            {preset === 'custom' && (
              <Stack align="center">
                <span style={{ color: 'var(--color-text-secondary)' }}>取色</span>
                <ColorPickerField value={customColor} onChange={setCustomColor} />
              </Stack>
            )}
            <div>
              <span>容差 {tolerance}%</span>
              <Slider min={5} max={80} value={[tolerance]} onValueChange={([v]) => setTolerance(v)} />
            </div>
            <div>
              <span>羽化 {smoothness}%</span>
              <Slider min={0} max={100} value={[smoothness]} onValueChange={([v]) => setSmoothness(v)} />
            </div>
            <div>
              <span>溢色抑制 {spill}%</span>
              <Slider min={0} max={100} value={[spill]} onValueChange={([v]) => setSpill(v)} />
            </div>
          </Stack>

          <div className="pixel-tool-actions">
            <Button disabled={loading} onClick={() => { void handleProcess() }}>
              {loading && <Loader2 className="animate-spin" />}
              {resultUrl ? '重新抠图' : '执行抠图'}
            </Button>
            {resultUrl && (
              <Button
                variant="outline"
                onClick={async () => {
                  const blob = await fetch(resultUrl).then((r) => r.blob())
                  triggerDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}-matte.png`)
                }}
              >
                <Download />
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
