import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button, Collapse, ColorPicker, InputNumber, message, Radio, Segmented, Slider, Space, Tabs, Upload,
} from '@/components/app/wrapped-ui'
import {
  CheckCircleOutlined, CloudUploadOutlined, DownloadOutlined, DownOutlined,
  FileImageOutlined, PictureOutlined, ReloadOutlined,
} from '@/lib/icons/antd-lucide'
import JSZip from 'jszip'
import { superSplitByTransparent } from '../../lib/frameRonin/superSplitTransparent.js'
import { stitchImageBlobs } from '../../lib/frameRonin/simpleStitchVertical.js'
import {
  buildGifFromCanvases,
  canvasToBlob,
  combineCanvasesToSheet,
  extractGifFramesWithOptions,
  getGifInfo,
  loadImageFromFile,
  loadImagesFromFiles,
  previewGifFrames,
  splitImageGrid,
  triggerDownload,
} from '../../lib/frameRonin/gifUtils.js'
import animFpsLoop from '../../constants/features/anim-fps-loop.js'
import animSequenceExport from '../../constants/features/anim-sequence-export.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import { sortFilesByName } from './pixelToolUtils.js'

const { Dragger } = Upload
const MAX_GIF_SIZE = 50 * 1024 * 1024

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function GifUploadZone({ file, onFile, onClear, parsing }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const validate = (f) => {
    if (!f.name.toLowerCase().endsWith('.gif')) {
      setError('仅支持 .gif 格式')
      return false
    }
    if (f.size > MAX_GIF_SIZE) {
      setError('单文件最大 50MB')
      return false
    }
    setError('')
    return true
  }

  const pick = (f) => {
    if (validate(f)) onFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pick(f)
  }

  return (
    <div className="pt-upload-zone-wrap">
      <div
        className={[
          'pt-upload-zone',
          dragOver && 'is-dragging',
          file && 'is-success',
          error && 'is-error',
        ].filter(Boolean).join(' ')}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".gif"
          className="pt-upload-input"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) pick(f)
            e.target.value = ''
          }}
        />

        {!file ? (
          <>
            <div className={`pt-upload-icon-wrap ${dragOver ? 'is-float' : ''}`}>
              <CloudUploadOutlined className="pt-upload-icon" />
              <FileImageOutlined className="pt-upload-badge" />
            </div>
            <p className="pt-upload-main">
              {dragOver ? '松手即可上传' : '拖拽 GIF 文件到此处，或点击上传'}
            </p>
            <p className="pt-upload-sub">支持 .gif 格式，单文件最大 50MB</p>
            {error && <p className="pt-upload-error">{error}</p>}
          </>
        ) : (
          <div className="pt-upload-success" onClick={(e) => e.stopPropagation()}>
            <div className="pt-upload-file-icon">
              <FileImageOutlined />
              <CheckCircleOutlined className="pt-upload-check" />
            </div>
            <div className="pt-upload-meta">
              <p className="pt-upload-name">{file.name}</p>
              <p className="pt-upload-tags">
                <span>{formatSize(file.size)}</span>
                {parsing && <span>解析中…</span>}
              </p>
            </div>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => { onClear(); setError('') }}>
              重新上传
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FramePreviewSection({ urls, totalFrames, loading }) {
  if (loading) {
    return (
      <section className="pt-preview-section">
        <header className="pt-preview-head">
          <h4><PictureOutlined /> 帧预览</h4>
        </header>
        <div className="pt-preview-loading">正在解析 GIF 帧…</div>
      </section>
    )
  }

  if (urls.length === 0) {
    return (
      <section className="pt-preview-section pt-preview-section--empty">
        <header className="pt-preview-head">
          <h4><PictureOutlined /> 帧预览</h4>
        </header>
        <div className="pt-preview-placeholder">
          <div className="pt-preview-placeholder-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="pt-preview-placeholder-cell" />
            ))}
          </div>
          <p>上传 GIF 后，帧序列将在此处预览</p>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-preview-section">
      <header className="pt-preview-head">
        <h4><PictureOutlined /> 帧预览</h4>
        {totalFrames > 0 && (
          <span className="pt-preview-count">
            预览 {urls.length} / 共 {totalFrames} 帧
          </span>
        )}
      </header>
      <div className="pixel-frame-grid pt-frame-grid--scroll">
        {urls.map((url, index) => (
          <div key={url} className="pixel-frame-thumb">
            <span className="pt-frame-index">{index + 1}</span>
            <img src={url} alt={`帧 ${index + 1}`} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function GifFrameTool({ onStatusChange, onRegisterTemplate }) {
  const [gifFile, setGifFile] = useState(null)
  const [gifInfo, setGifInfo] = useState(null)
  const [gifParsing, setGifParsing] = useState(false)
  const [frameStep, setFrameStep] = useState(1)
  const [frameRange, setFrameRange] = useState([1, 1])
  const [bgMode, setBgMode] = useState('transparent')
  const [bgColor, setBgColor] = useState('#000000')
  const [optionsOpen, setOptionsOpen] = useState(false)

  const [frameFiles, setFrameFiles] = useState([])
  const [gridFile, setGridFile] = useState(null)
  const [gridCols, setGridCols] = useState(4)
  const [gridRows, setGridRows] = useState(4)
  const [sheetCols, setSheetCols] = useState(6)
  const [frameDelay, setFrameDelay] = useState(100)
  const [gifLoopCount, setGifLoopCount] = useState(0)
  const [stitchFiles, setStitchFiles] = useState([])
  const [stitchMode, setStitchMode] = useState(0)
  const [activeTab, setActiveTab] = useState('gif2frames')
  const [loading, setLoading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState([])
  const [gifPreviewUrls, setGifPreviewUrls] = useState([])

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    gifPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls, gifPreviewUrls])

  const clearPreviews = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
  }

  const clearGifPreviews = () => {
    gifPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setGifPreviewUrls([])
  }

  const applyTemplate = useCallback((preset) => {
    if (preset.frameStep) setFrameStep(preset.frameStep)
    if (preset.bgMode) setBgMode(preset.bgMode)
    if (preset.optionsOpen) setOptionsOpen(true)
    message.info(`已套用「${preset.label}」推荐设置`)
  }, [])

  useEffect(() => {
    onRegisterTemplate?.(applyTemplate)
  }, [applyTemplate, onRegisterTemplate])

  useEffect(() => {
    onStatusChange?.({
      gifFile,
      gifInfo,
      loading,
      frameStep,
      bgMode,
    })
  }, [gifFile, gifInfo, loading, frameStep, bgMode, onStatusChange])

  const handleGifPick = async (file) => {
    clearGifPreviews()
    setGifFile(file)
    setGifParsing(true)
    setGifInfo(null)
    try {
      const info = await getGifInfo(file)
      setGifInfo(info)
      setFrameRange([1, info.frameCount])
      const previews = await previewGifFrames(file, 12)
      setGifPreviewUrls(previews.map((f) => URL.createObjectURL(f.blob)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'GIF 解析失败')
      setGifFile(null)
    } finally {
      setGifParsing(false)
    }
  }

  const handleGifClear = () => {
    setGifFile(null)
    setGifInfo(null)
    clearGifPreviews()
    setFrameRange([1, 1])
  }

  const handleGifExtract = async () => {
    if (!gifFile) {
      message.warning('请先上传 GIF')
      return
    }
    setLoading(true)
    clearPreviews()
    try {
      const frames = await extractGifFramesWithOptions(gifFile, {
        frameStep,
        startFrame: frameRange[0],
        endFrame: frameRange[1],
        bgMode,
        bgColor: typeof bgColor === 'string' ? bgColor : bgColor.toHexString?.() ?? '#000000',
      })
      const zip = new JSZip()
      frames.forEach((frame, index) => {
        zip.file(`frame_${String(index + 1).padStart(3, '0')}.png`, frame.blob)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      triggerDownload(zipBlob, `${gifFile.name.replace(/\.[^.]+$/, '')}-frames.zip`)
      setPreviewUrls(frames.map((f) => URL.createObjectURL(f.blob)))
      message.success(`已导出 ${frames.length} 帧`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'GIF 解析失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFramesToGif = async () => {
    if (!frameFiles.length) {
      message.warning('请上传序列帧图片')
      return
    }
    setLoading(true)
    try {
      const images = await loadImagesFromFiles(frameFiles)
      const canvases = images.map((img) => {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        c.getContext('2d').drawImage(img, 0, 0)
        return c
      })
      const blob = await buildGifFromCanvases(canvases, frameDelay, gifLoopCount)
      triggerDownload(blob, 'frames.gif')
      message.success('GIF 已生成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'GIF 合成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGridSplit = async () => {
    if (!gridFile) {
      message.warning('请上传精灵图')
      return
    }
    setLoading(true)
    clearPreviews()
    try {
      const img = await loadImageFromFile(gridFile)
      let files
      if (gridFile.type === 'image/png') {
        try {
          files = await superSplitByTransparent(img, gridFile.name.replace(/\.[^.]+$/, ''))
        } catch {
          files = null
        }
      }
      if (!files?.length) {
        const cells = splitImageGrid(img, gridCols, gridRows)
        files = await Promise.all(
          cells.map(async ({ canvas }, index) => new File(
            [await canvasToBlob(canvas)],
            `frame_${String(index + 1).padStart(3, '0')}.png`,
            { type: 'image/png' },
          )),
        )
      }
      const zip = new JSZip()
      for (const file of files) {
        zip.file(file.name, file)
      }
      triggerDownload(await zip.generateAsync({ type: 'blob' }), `${gridFile.name.replace(/\.[^.]+$/, '')}-split.zip`)
      setPreviewUrls(files.map((f) => URL.createObjectURL(f)))
      message.success(`已拆分 ${files.length} 帧`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '拆分失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGridMerge = async () => {
    if (!frameFiles.length) {
      message.warning('请上传序列帧')
      return
    }
    setLoading(true)
    try {
      const images = await loadImagesFromFiles(frameFiles)
      const canvases = images.map((img) => {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        c.getContext('2d').drawImage(img, 0, 0)
        return c
      })
      const sheet = combineCanvasesToSheet(canvases, sheetCols, 2)
      triggerDownload(await canvasToBlob(sheet), 'sprite-sheet.png')
      message.success('精灵图已合成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '合成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStitch = async () => {
    if (!stitchFiles.length) {
      message.warning('请上传至少 2 张图片')
      return
    }
    setLoading(true)
    try {
      const blobs = await Promise.all(stitchFiles.map((f) => f.arrayBuffer().then((buf) => new Blob([buf], { type: f.type }))))
      const result = await stitchImageBlobs(blobs, stitchMode)
      triggerDownload(result, `stitch-${stitchMode === 0 ? 'vertical' : stitchMode === 1 ? 'horizontal' : 'overlay'}.png`)
      message.success('拼接完成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '拼接失败')
    } finally {
      setLoading(false)
    }
  }

  const gif2framesPanel = (
    <div className="pt-gif-workspace">
      <GifUploadZone
        file={gifFile}
        onFile={handleGifPick}
        onClear={handleGifClear}
        parsing={gifParsing}
      />

      <Collapse
        ghost
        className="pt-options-collapse"
        activeKey={optionsOpen ? ['opts'] : []}
        onChange={(keys) => setOptionsOpen(keys.includes('opts'))}
        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
        items={[{
          key: 'opts',
          label: '处理选项',
          children: (
            <div className="pt-options-panel">
              <div className="pt-option-block">
                <span className="pt-option-label">提取帧间隔</span>
                <Segmented
                  value={frameStep}
                  onChange={setFrameStep}
                  options={[
                    { label: '每 1 帧', value: 1 },
                    { label: '每 2 帧', value: 2 },
                    { label: '每 5 帧', value: 5 },
                  ]}
                />
              </div>
              {gifInfo && (
                <div className="pt-option-block">
                  <span className="pt-option-label">
                    提取范围：第 {frameRange[0]} — {frameRange[1]} 帧（共 {gifInfo.frameCount} 帧）
                  </span>
                  <Slider
                    range
                    min={1}
                    max={gifInfo.frameCount}
                    value={frameRange}
                    onChange={setFrameRange}
                  />
                </div>
              )}
              <div className="pt-option-block">
                <span className="pt-option-label">背景处理</span>
                <Radio.Group value={bgMode} onChange={(e) => setBgMode(e.target.value)}>
                  <Radio.Button value="transparent">透明背景</Radio.Button>
                  <Radio.Button value="original">保留原背景</Radio.Button>
                  <Radio.Button value="solid">填充纯色</Radio.Button>
                </Radio.Group>
                {bgMode === 'solid' && (
                  <ColorPicker value={bgColor} onChange={setBgColor} showText className="pt-bg-picker" />
                )}
              </div>
            </div>
          ),
        }]}
      />

      <div className="pt-export-bar">
        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined />}
          loading={loading}
          disabled={!gifFile}
          onClick={() => { void handleGifExtract() }}
        >
          导出帧 ZIP
        </Button>
      </div>

      <FramePreviewSection
        urls={previewUrls.length > 0 ? previewUrls : gifPreviewUrls}
        totalFrames={gifInfo?.frameCount ?? 0}
        loading={gifParsing}
      />
    </div>
  )

  const tabs = useMemo(() => [
    { key: 'gif2frames', label: 'GIF 拆帧', children: gif2framesPanel },
    {
      key: 'frames2gif',
      label: '序列帧转 GIF',
      children: (
        <>
          <p className="pixel-tool-hint">上传多张 PNG/JPG，按文件名排序后合成 GIF。</p>
          <Dragger multiple accept=".png,.jpg,.jpeg,.webp" beforeUpload={() => false} fileList={frameFiles.map((f, i) => ({ uid: String(i), name: f.name, originFileObj: f }))} onChange={({ fileList }) => setFrameFiles(sortFilesByName(fileList.map((item) => item.originFileObj).filter(Boolean)))}>
            <p>拖拽或选择多张图片</p>
          </Dragger>
          <div style={{ marginTop: 12 }}>
            <span>帧间隔 {frameDelay} ms（约 {Math.round(1000 / Math.max(frameDelay, 20))} FPS）</span>
            <Slider min={20} max={500} value={frameDelay} onChange={setFrameDelay} />
          </div>
          <div style={{ marginTop: 12 }}>
            <span>循环次数（0 = 无限循环）</span>
            <InputNumber min={0} max={99} value={gifLoopCount} onChange={(v) => setGifLoopCount(v ?? 0)} style={{ marginLeft: 8 }} />
          </div>
          <div className="pixel-tool-actions">
            <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={() => { void handleFramesToGif() }}>
              生成 GIF
            </Button>
          </div>
        </>
      ),
    },
    {
      key: 'images2single',
      label: '精灵图拆分/合成',
      children: (
        <>
          <p className="pixel-tool-hint">按行列拆分精灵图（透明 PNG 优先按透明间隙拆分），或将多帧合成为一张精灵图。</p>
          <Space wrap style={{ marginBottom: 12 }}>
            <span>列</span>
            <InputNumber min={1} max={32} value={gridCols} onChange={(v) => setGridCols(v ?? 4)} />
            <span>行</span>
            <InputNumber min={1} max={32} value={gridRows} onChange={(v) => setGridRows(v ?? 4)} />
            <span>合成列数</span>
            <InputNumber min={1} max={16} value={sheetCols} onChange={(v) => setSheetCols(v ?? 6)} />
          </Space>
          <Dragger accept=".png,.jpg,.jpeg,.webp" maxCount={1} beforeUpload={(f) => { setGridFile(f); return false }} onRemove={() => setGridFile(null)}>
            <p>上传精灵图（拆分）</p>
          </Dragger>
          <Dragger multiple accept=".png,.jpg,.jpeg,.webp" style={{ marginTop: 12 }} beforeUpload={() => false} onChange={({ fileList }) => setFrameFiles(sortFilesByName(fileList.map((item) => item.originFileObj).filter(Boolean)))}>
            <p>上传序列帧（合成精灵图）</p>
          </Dragger>
          <div className="pixel-tool-actions">
            <Space wrap>
              <Button loading={loading} onClick={() => { void handleGridSplit() }}>拆分 ZIP</Button>
              <Button type="primary" loading={loading} onClick={() => { void handleGridMerge() }}>合成精灵图</Button>
            </Space>
          </div>
        </>
      ),
    },
    {
      key: 'stitch',
      label: '简易拼接',
      children: (
        <>
          <p className="pixel-tool-hint">将多张图片上下、左右或叠画拼接为一张图。</p>
          <Radio.Group value={stitchMode} onChange={(e) => setStitchMode(e.target.value)} style={{ marginBottom: 12 }}>
            <Radio.Button value={0}>上下</Radio.Button>
            <Radio.Button value={1}>左右</Radio.Button>
            <Radio.Button value={2}>叠画</Radio.Button>
          </Radio.Group>
          <Dragger multiple accept=".png,.jpg,.jpeg,.webp" beforeUpload={() => false} onChange={({ fileList }) => setStitchFiles(sortFilesByName(fileList.map((item) => item.originFileObj).filter(Boolean)))}>
            <p>上传 2 张及以上图片</p>
          </Dragger>
          <div className="pixel-tool-actions">
            <Button type="primary" loading={loading} onClick={() => { void handleStitch() }}>拼接导出</Button>
          </div>
        </>
      ),
    },
  ], [
    bgColor, bgMode, frameDelay, gifLoopCount, frameFiles, frameRange, frameStep, gif2framesPanel,
    gifInfo, gridCols, gridFile, gridRows, loading, sheetCols, stitchFiles, stitchMode,
  ])

  return (
    <>
      <FeatureCallout feature={animSequenceExport} />
      <FeatureCallout feature={animFpsLoop} />
      <Tabs items={tabs} className="pt-inner-tabs" activeKey={activeTab} onChange={setActiveTab} />
      {previewUrls.length > 0 && activeTab !== 'gif2frames' && (
        <div className="pt-other-preview">
          <header className="pt-preview-head">
            <h4><PictureOutlined /> 处理结果预览</h4>
          </header>
          <div className="pixel-frame-grid">
            {previewUrls.map((url, index) => (
              <div key={url} className="pixel-frame-thumb">
                <img src={url} alt={`帧 ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
