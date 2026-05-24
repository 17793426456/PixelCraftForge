import { useEffect, useState } from 'react'
import { Button, InputNumber, message, Slider, Space, Switch, Typography, Upload } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { runPixelliseRestore, maxSafeUpscaleForImage } from '../../lib/frameRonin/pixellise.js'
import { triggerDownload } from '../../lib/frameRonin/gifUtils.js'

const { Dragger } = Upload
const { Text } = Typography

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
      return
    }
    const u = URL.createObjectURL(file)
    setPreview(u)
    const img = new Image()
    img.onload = () => {
      setMaxUpscale(maxSafeUpscaleForImage(img.naturalWidth, img.naturalHeight))
    }
    img.src = u
    return () => URL.revokeObjectURL(u)
  }, [file])

  useEffect(
    () => () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    },
    [resultUrl],
  )

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
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Text type="secondary">
        基于 OpenCV.js 的高级像素化还原（浏览器端运行，首次加载 OpenCV 可能较慢）。
      </Text>
      <Dragger
        accept={ACCEPT.join(',')}
        maxCount={1}
        beforeUpload={(f) => {
          setFile(f)
          return false
        }}
        showUploadList={!!file}
        onRemove={() => setFile(null)}
      >
        <p>上传待像素化图片</p>
      </Dragger>
      {preview && (
        <img src={preview} alt="" style={{ maxWidth: 320, maxHeight: 240, imageRendering: 'pixelated' }} />
      )}
      <div>
        <Text>检测放大倍数（1–{maxUpscale}）</Text>
        <Slider min={1} max={maxUpscale} value={upscale} onChange={setUpscale} />
      </div>
      <div>
        <Text>颜色数量</Text>
        <Slider min={4} max={64} value={numColors} onChange={setNumColors} />
      </div>
      <div>
        <Text>输出缩放</Text>
        <InputNumber min={1} max={5} value={scaleResult} onChange={(v) => setScaleResult(v ?? 1)} />
      </div>
      <Switch checked={transparentBg} onChange={setTransparentBg} checkedChildren="透明底" unCheckedChildren="不透明" />
      <Button type="primary" loading={busy} onClick={run} disabled={!file}>
        {status || '开始像素化'}
      </Button>
      {resultUrl && (
        <Space direction="vertical">
          <img src={resultUrl} alt="" style={{ maxWidth: '100%', imageRendering: 'pixelated' }} />
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              const res = await fetch(resultUrl)
              const blob = await res.blob()
              triggerDownload(blob, 'pixelated.png')
            }}
          >
            下载结果
          </Button>
        </Space>
      )}
    </Space>
  )
}
