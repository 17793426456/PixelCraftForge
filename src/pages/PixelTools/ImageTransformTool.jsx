import { useEffect, useState } from 'react'
import { Download, RotateCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import FileDropzone from '@/components/app/FileDropzone'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import imageTransformFilter from '../../constants/features/image-transform-filter.js'
import { convertImageBlob, FORMAT_OPTIONS, triggerDownload } from '../../lib/assets/imageExport.js'
import { revokeObjectUrl } from './pixelToolUtils.js'

export default function ImageTransformTool() {
  const [file, setFile] = useState(null)
  const [sourcePreview, setSourcePreview] = useState(null)
  const [resultPreview, setResultPreview] = useState(null)
  const [rotate, setRotate] = useState(0)
  const [quality, setQuality] = useState(92)
  const [maxEdge, setMaxEdge] = useState(512)
  const [format, setFormat] = useState('image/png')
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [loading, setLoading] = useState(false)

  const transformOpts = { format, quality: quality / 100, maxEdge, rotate, flipH, flipV }

  useEffect(() => {
    if (!file) {
      setSourcePreview(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setSourcePreview(url)
    return () => revokeObjectUrl(url)
  }, [file])

  useEffect(() => () => revokeObjectUrl(resultPreview), [resultPreview])

  const apply = async () => {
    if (!file) {
      message.warning('请先上传图片')
      return
    }
    setLoading(true)
    try {
      const blob = await convertImageBlob(file, transformOpts)
      revokeObjectUrl(resultPreview)
      setResultPreview(URL.createObjectURL(blob))
      message.success('预览已更新')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '处理失败')
    } finally {
      setLoading(false)
    }
  }

  const download = async () => {
    if (!file) {
      message.warning('请先上传图片')
      return
    }
    setLoading(true)
    try {
      const blob = await convertImageBlob(file, transformOpts)
      const ext = FORMAT_OPTIONS.find((f) => f.value === format)?.ext ?? 'png'
      triggerDownload(blob, `transform.${ext}`)
      message.success('已导出')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导出失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pixel-tool-panel">
      <FeatureCallout feature={imageTransformFilter} />
      <p className="pixel-tool-hint">旋转、缩放、翻转与格式转换，适合贴图预处理与引擎导入前整理。</p>

      <FileDropzone
        accept="image/*"
        maxCount={1}
        title="拖拽或点击上传贴图"
        hint="支持 PNG / JPG / WebP"
        onFiles={(files) => {
          const f = files[0]
          if (f) {
            setFile(f)
            revokeObjectUrl(resultPreview)
            setResultPreview(null)
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
              revokeObjectUrl(resultPreview)
              setResultPreview(null)
            }}
          >
            移除
          </button>
        </p>
      )}

      {file && (
        <>
          <Stack wrap style={{ marginTop: 16 }} align="center">
            <span className="pt-brush-label">旋转 {rotate}°</span>
            <Slider
              min={0}
              max={360}
              value={[rotate]}
              onValueChange={([v]) => setRotate(v)}
              className="w-40"
            />
            <span className="pt-brush-label">最长边 {maxEdge}px</span>
            <Slider
              min={64}
              max={2048}
              step={64}
              value={[maxEdge]}
              onValueChange={([v]) => setMaxEdge(v)}
              className="w-[140px]"
            />
            <span className="pt-brush-label">质量 {quality}%</span>
            <Slider
              min={40}
              max={100}
              value={[quality]}
              onValueChange={([v]) => setQuality(v)}
              className="w-[100px]"
            />
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={flipH ? 'default' : 'outline'} onClick={() => setFlipH((v) => !v)}>水平翻转</Button>
            <Button variant={flipV ? 'default' : 'outline'} onClick={() => setFlipV((v) => !v)}>垂直翻转</Button>
          </Stack>

          <div className="pixel-tool-actions" style={{ marginTop: 12 }}>
            <Button variant="outline" disabled={loading} onClick={() => { void apply() }}>
              {loading && <Loader2 className="animate-spin" />}
              <RotateCw />
              预览效果
            </Button>
            <Button disabled={loading} onClick={() => { void download() }}>
              {loading && <Loader2 className="animate-spin" />}
              <Download />
              导出
            </Button>
          </div>

          <div className="pixel-preview-row">
            {sourcePreview && (
              <div className="pixel-preview-box">
                <strong>原图</strong>
                <img src={sourcePreview} alt="原图" />
              </div>
            )}
            {resultPreview && (
              <div className="pixel-preview-box">
                <strong>处理后</strong>
                <img src={resultPreview} alt="处理后" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
