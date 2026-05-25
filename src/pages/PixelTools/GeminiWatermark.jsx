import { useEffect, useState } from 'react'
import { Download, Eraser, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FileDropzone from '@/components/app/FileDropzone'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import { removeGeminiWatermarkFromBlob } from '../../lib/frameRonin/geminiWatermark.js'
import { triggerDownload } from '../../lib/frameRonin/gifUtils.js'

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp'

export default function GeminiWatermark() {
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [lastDetected, setLastDetected] = useState(null)

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
    setLastDetected(null)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  const processImage = async () => {
    if (!file) return
    setProcessing(true)
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    try {
      const { blob, detected, diff, config } = await removeGeminiWatermarkFromBlob(file)
      setResultUrl(URL.createObjectURL(blob))
      setLastDetected({ detected, diff, config })

      if (!detected) {
        message.warning(
          '未在右下角检测到 Gemini 可见水印。请确认图片由 Gemini 生成且带右下角星标；像素风/实拍图无法用本工具去水印。',
        )
      } else {
        message.success(
          config
            ? `水印已去除（${config.logoSize}×${config.logoSize}，边距 ${config.marginRight}px）`
            : '水印已去除',
        )
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '处理失败')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="pixel-tool-panel">
      <p className="pixel-tool-hint">
        仅适用于 <strong>Gemini / Nano Banana</strong> 生成图右下角的半透明星标水印（逆向 alpha 还原）。
        不支持普通文字水印、Logo 或 Seedream 等其它平台水印。
      </p>
      <p className="pixel-tool-hint pixel-tool-hint--sub">
        <Info className="mr-1 inline size-4" />
        自动匹配 36 / 48 / 96 像素水印及新版大边距布局；若无效请换原图导出尺寸或联系反馈。
      </p>
      <FileDropzone
        accept={IMAGE_ACCEPT}
        maxCount={1}
        title="上传 Gemini 生成图（PNG / JPG / WebP）"
        onFiles={(files) => setFile(files[0] ?? null)}
      />
      {file && (
        <p className="mt-2 text-sm text-muted-foreground">
          已选：{file.name}
          {' '}
          <button type="button" className="text-primary underline" onClick={() => setFile(null)}>清除</button>
        </p>
      )}

      {file && imageUrl && (
        <>
          <Stack wrap className="pixel-tool-actions">
            <Button disabled={processing} onClick={() => { void processImage() }}>
              {processing && <Loader2 className="animate-spin" />}
              <Eraser />
              去除水印
            </Button>
            {resultUrl && (
              <Button
                variant="outline"
                onClick={async () => {
                  const blob = await fetch(resultUrl).then((r) => r.blob())
                  triggerDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}-no-watermark.png`)
                }}
              >
                <Download />
                下载结果
              </Button>
            )}
          </Stack>

          {lastDetected && !lastDetected.detected && resultUrl && (
            <p className="pixel-matte-warn">
              本次处理未检测到有效水印区域（差异 {lastDetected.diff?.toFixed(1) ?? 0}），结果可能与原图几乎相同。
            </p>
          )}

          <div className="pixel-preview-row">
            <div className="pixel-preview-box">
              <strong>原图</strong>
              <img src={imageUrl} alt="原图" />
            </div>
            <div className="pixel-preview-box">
              <strong>处理后</strong>
              {resultUrl ? (
                <img src={resultUrl} alt="结果" />
              ) : (
                <p className="pixel-matte-placeholder">点击「去除水印」后预览</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
