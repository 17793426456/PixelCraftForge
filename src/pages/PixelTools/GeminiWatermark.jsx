import { useEffect, useState } from 'react'
import { Button, Radio, Space, Upload, message } from 'antd'
import { DownloadOutlined, ClearOutlined } from '@ant-design/icons'
import {
  getWatermarkSize,
  getWatermarkParams,
  removeWatermarkReverseAlpha,
  getEmbeddedAlphaMask,
  createApproxAlphaMap,
} from '../../lib/frameRonin/geminiWatermark.js'
import { triggerDownload } from '../../lib/frameRonin/gifUtils.js'

const { Dragger } = Upload
const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp'

export default function GeminiWatermark() {
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [sizeMode, setSizeMode] = useState('auto')

  useEffect(() => {
    if (!file) {
      setImageUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  const processImage = async () => {
    if (!imageUrl || !file) return
    setProcessing(true)
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = imageUrl
      })

      const w = img.naturalWidth
      const h = img.naturalHeight
      const baseSize = sizeMode === 'auto' ? getWatermarkSize(w, h) : sizeMode === '48' ? 48 : 96
      const params = getWatermarkParams(w, h, baseSize)

      let alphaMap
      let mapW
      let mapH
      try {
        const loaded = await getEmbeddedAlphaMask(baseSize)
        alphaMap = loaded.alpha
        mapW = loaded.width
        mapH = loaded.height
      } catch {
        alphaMap = createApproxAlphaMap(baseSize)
        mapW = baseSize
        mapH = baseSize
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const alphaScale = baseSize === 96 ? 0.85 : 1
      removeWatermarkReverseAlpha(imageData, alphaMap, mapW, mapH, params.x, params.y, 255, alphaScale)
      ctx.putImageData(imageData, 0, 0)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png')
      })
      setResultUrl(URL.createObjectURL(blob))
      message.success('水印已去除')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '处理失败')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="pixel-tool-panel">
      <p className="pixel-tool-hint">
        去除 Gemini 生成图片右下角可见水印（算法参考 GeminiWatermarkTool，仅处理可见水印）。
      </p>
      <Dragger
        accept={IMAGE_ACCEPT}
        maxCount={1}
        beforeUpload={(f) => { setFile(f); return false }}
        onRemove={() => setFile(null)}
      >
        <p>上传 PNG / JPG / WebP</p>
      </Dragger>

      {file && imageUrl && (
        <>
          <Space wrap style={{ margin: '16px 0' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>水印尺寸</span>
            <Radio.Group value={sizeMode} onChange={(e) => setSizeMode(e.target.value)} optionType="button" size="small">
              <Radio.Button value="auto">自动</Radio.Button>
              <Radio.Button value="48">48×48</Radio.Button>
              <Radio.Button value="96">96×96</Radio.Button>
            </Radio.Group>
          </Space>
          <Space wrap className="pixel-tool-actions">
            <Button type="primary" icon={<ClearOutlined />} loading={processing} onClick={() => { void processImage() }}>
              去除水印
            </Button>
            {resultUrl && (
              <Button
                icon={<DownloadOutlined />}
                onClick={async () => {
                  const blob = await fetch(resultUrl).then((r) => r.blob())
                  triggerDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}-no-watermark.png`)
                }}
              >
                下载结果
              </Button>
            )}
          </Space>
          <div className="pixel-preview-row">
            <div className="pixel-preview-box">
              <strong>原图</strong>
              <img src={imageUrl} alt="原图" />
            </div>
            {resultUrl && (
              <div className="pixel-preview-box">
                <strong>处理后</strong>
                <img src={resultUrl} alt="结果" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
