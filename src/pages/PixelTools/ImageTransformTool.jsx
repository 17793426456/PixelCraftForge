import { useState } from 'react'
import { Button, Slider, Space, Upload, Select, message } from 'antd'
import { DownloadOutlined, RotateRightOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import imageTransformFilter from '../../constants/features/image-transform-filter.js'
import { convertImageBlob, FORMAT_OPTIONS, triggerDownload } from '../../lib/assets/imageExport.js'

export default function ImageTransformTool() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [rotate, setRotate] = useState(0)
  const [quality, setQuality] = useState(92)
  const [maxEdge, setMaxEdge] = useState(512)
  const [format, setFormat] = useState('image/png')
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [loading, setLoading] = useState(false)

  const transformOpts = { format, quality: quality / 100, maxEdge, rotate, flipH, flipV }

  const apply = async () => {
    if (!file) {
      message.warning('请上传图片')
      return
    }
    setLoading(true)
    try {
      const blob = await convertImageBlob(file, transformOpts)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(URL.createObjectURL(blob))
    } catch (e) {
      message.error(e instanceof Error ? e.message : '处理失败')
    } finally {
      setLoading(false)
    }
  }

  const download = async () => {
    if (!file) return
    const blob = await convertImageBlob(file, transformOpts)
    const ext = FORMAT_OPTIONS.find((f) => f.value === format)?.ext ?? 'png'
    triggerDownload(blob, `transform.${ext}`)
  }

  return (
    <div className="pixel-tool-panel">
      <FeatureCallout feature={imageTransformFilter} />
      <Upload beforeUpload={(f) => { setFile(f); return false }} showUploadList={false} accept="image/*">
        <Button>上传贴图</Button>
      </Upload>
      <Space wrap style={{ marginTop: 12 }}>
        <span>旋转 {rotate}°</span>
        <Slider min={0} max={360} value={rotate} onChange={setRotate} style={{ width: 160 }} />
        <span>最长边 {maxEdge}px</span>
        <Slider min={64} max={2048} step={64} value={maxEdge} onChange={setMaxEdge} style={{ width: 120 }} />
        <span>质量 {quality}%</span>
        <Slider min={40} max={100} value={quality} onChange={setQuality} style={{ width: 100 }} />
        <Select value={format} onChange={setFormat} options={FORMAT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))} />
        <Button type={flipH ? 'primary' : 'default'} onClick={() => setFlipH((v) => !v)}>水平翻转</Button>
        <Button type={flipV ? 'primary' : 'default'} onClick={() => setFlipV((v) => !v)}>垂直翻转</Button>
      </Space>
      <div className="pixel-tool-actions" style={{ marginTop: 12 }}>
        <Button icon={<RotateRightOutlined />} loading={loading} onClick={() => { void apply() }}>预览</Button>
        <Button type="primary" icon={<DownloadOutlined />} onClick={() => { void download() }}>导出</Button>
      </div>
      {preview && <img src={preview} alt="预览" style={{ maxWidth: '100%', marginTop: 16, borderRadius: 8 }} />}
    </div>
  )
}
