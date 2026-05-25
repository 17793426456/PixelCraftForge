import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import FileDropzone from '@/components/app/FileDropzone'
import NumberInput from '@/components/app/NumberInput'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import { runPixelliseRestore, maxSafeUpscaleForImage } from '../../lib/frameRonin/pixellise.js'
import { triggerDownload } from '../../lib/frameRonin/gifUtils.js'
import { revokeObjectUrl } from './pixelToolUtils.js'

const STATUS_ZH = {
  pixelateAdvancedProgressLoadImage: '加载图片…',
  pixelateAdvancedProgressOpenCv: '加载 OpenCV…',
  pixelateAdvancedProgressMesh: '计算网格…',
  pixelateAdvancedProgressWorker: '像素化处理…',
  pixelateAdvancedProgressEncode: '编码输出…',
}

const ACCEPT = ['.png', '.jpg', '.jpeg', '.webp']

export default function ImagePixelateTool() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [upscale, setUpscale] = useState(3)
  const [numColors, setNumColors] = useState(16)
  const [scaleResult, setScaleResult] = useState(1)
  const [transparentBg, setTransparentBg] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [resultUrl, setResultUrl] = useState(null)
  const [maxUpscale, setMaxUpscale] = useState(7)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      setMaxUpscale(7)
      return undefined
    }
    const u = URL.createObjectURL(file)
    setPreview(u)
    const img = new Image()
    img.onload = () => {
      setMaxUpscale(maxSafeUpscaleForImage(img.naturalWidth, img.naturalHeight))
    }
    img.src = u
    return () => revokeObjectUrl(u)
  }, [file])

  useEffect(() => () => revokeObjectUrl(resultUrl), [resultUrl])

  const run = async () => {
    if (!file) {
      message.warning('请先上传图片')
      return
    }
    setBusy(true)
    setStatus('准备…')
    try {
      const { blob, upscaleUsed, upscaleCapped } = await runPixelliseRestore(
        file,
        { upscale, numColors, scaleResult, transparentBackground: transparentBg },
        (key) => setStatus(STATUS_ZH[key] ?? key),
      )
      revokeObjectUrl(resultUrl)
      setResultUrl(URL.createObjectURL(blob))
      if (upscaleCapped) {
        message.info(`图片较大，放大倍数已限制为 ${upscaleUsed}`)
      } else {
        message.success('处理完成')
      }
    } catch (e) {
      message.error(e?.message || '处理失败')
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  return (
    <div className="pixel-tool-panel">
      <p className="pixel-tool-hint">
        基于 OpenCV.js 的高级像素化还原（浏览器端运行，首次加载 OpenCV 可能较慢）。
      </p>

      <FileDropzone
        accept={ACCEPT.join(',')}
        maxCount={1}
        title="拖拽或点击上传待像素化图片"
        hint="支持 PNG / JPG / WebP"
        onFiles={(files) => {
          const f = files[0]
          if (f) {
            setFile(f)
            revokeObjectUrl(resultUrl)
            setResultUrl(null)
          }
        }}
      />
      {file && (
        <p className="mt-2 text-sm text-muted-foreground">
          已选：{file.name}
          {' '}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => {
              setFile(null)
              revokeObjectUrl(resultUrl)
              setResultUrl(null)
            }}
          >
            清除
          </button>
        </p>
      )}

      {file && (
        <>
          <Stack wrap style={{ marginTop: 16 }} align="center">
            <span className="pt-brush-label">检测放大 {upscale}×（最大 {maxUpscale}）</span>
            <Slider
              min={1}
              max={maxUpscale}
              value={[upscale]}
              onValueChange={([v]) => setUpscale(v)}
              className="w-40"
            />
            <span className="pt-brush-label">颜色数 {numColors}</span>
            <Slider
              min={4}
              max={64}
              value={[numColors]}
              onValueChange={([v]) => setNumColors(v)}
              className="w-[120px]"
            />
            <span className="pt-brush-label">输出缩放</span>
            <NumberInput min={1} max={5} value={scaleResult} onChange={setScaleResult} />
            <div className="flex items-center gap-2">
              <Switch checked={transparentBg} onCheckedChange={setTransparentBg} id="transparent-bg" />
              <Label htmlFor="transparent-bg">{transparentBg ? '透明底' : '不透明'}</Label>
            </div>
          </Stack>

          <div className="pixel-tool-actions" style={{ marginTop: 12 }}>
            <Button disabled={busy} onClick={() => { void run() }}>
              {busy && <Loader2 className="animate-spin" />}
              {status || '开始像素化'}
            </Button>
            {resultUrl && (
              <Button
                variant="outline"
                onClick={async () => {
                  const res = await fetch(resultUrl)
                  triggerDownload(await res.blob(), 'pixelated.png')
                }}
              >
                <Download />
                下载结果
              </Button>
            )}
          </div>

          <div className="pixel-preview-row">
            {preview && (
              <div className="pixel-preview-box">
                <strong>原图</strong>
                <img src={preview} alt="原图" style={{ imageRendering: 'auto' }} />
              </div>
            )}
            {resultUrl && (
              <div className="pixel-preview-box">
                <strong>像素化结果</strong>
                <img src={resultUrl} alt="像素化结果" style={{ imageRendering: 'pixelated' }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
