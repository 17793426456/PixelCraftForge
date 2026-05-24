import { useEffect, useMemo, useState } from 'react'
import { Button, InputNumber, message, Radio, Slider, Space, Tabs, Upload } from 'antd'
import { DownloadOutlined, FileImageOutlined } from '@ant-design/icons'
import JSZip from 'jszip'
import { superSplitByTransparent } from '../../lib/frameRonin/superSplitTransparent.js'
import { stitchImageBlobs } from '../../lib/frameRonin/simpleStitchVertical.js'
import {
  buildGifFromCanvases,
  canvasToBlob,
  combineCanvasesToSheet,
  extractGifFrames,
  loadImageFromFile,
  loadImagesFromFiles,
  splitImageGrid,
  triggerDownload,
} from '../../lib/frameRonin/gifUtils.js'

const { Dragger } = Upload

export default function GifFrameTool() {
  const [gifFile, setGifFile] = useState(null)
  const [frameFiles, setFrameFiles] = useState([])
  const [gridFile, setGridFile] = useState(null)
  const [gridCols, setGridCols] = useState(4)
  const [gridRows, setGridRows] = useState(4)
  const [sheetCols, setSheetCols] = useState(6)
  const [frameDelay, setFrameDelay] = useState(100)
  const [stitchFiles, setStitchFiles] = useState([])
  const [stitchMode, setStitchMode] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState([])

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  const clearPreviews = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
  }

  const handleGifExtract = async () => {
    if (!gifFile) {
      message.warning('请先上传 GIF')
      return
    }
    setLoading(true)
    clearPreviews()
    try {
      const frames = await extractGifFrames(gifFile)
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
      const blob = await buildGifFromCanvases(canvases, frameDelay)
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

  const tabs = useMemo(() => [
    {
      key: 'gif2frames',
      label: 'GIF 拆帧',
      children: (
        <>
          <p className="pixel-tool-hint">将 GIF 动画拆分为 PNG 序列并打包 ZIP 下载。</p>
          <Dragger accept=".gif" maxCount={1} beforeUpload={(f) => { setGifFile(f); return false }} onRemove={() => setGifFile(null)}>
            <p><FileImageOutlined /> 上传 GIF 文件</p>
          </Dragger>
          <div className="pixel-tool-actions">
            <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={() => { void handleGifExtract() }}>
              导出帧 ZIP
            </Button>
          </div>
        </>
      ),
    },
    {
      key: 'frames2gif',
      label: '序列帧转 GIF',
      children: (
        <>
          <p className="pixel-tool-hint">上传多张 PNG/JPG，按文件名排序后合成 GIF。</p>
          <Dragger multiple accept=".png,.jpg,.jpeg,.webp" beforeUpload={() => false} fileList={frameFiles.map((f, i) => ({ uid: String(i), name: f.name, originFileObj: f }))} onChange={({ fileList }) => setFrameFiles(fileList.map((item) => item.originFileObj).filter(Boolean))}>
            <p>拖拽或选择多张图片</p>
          </Dragger>
          <div style={{ marginTop: 12 }}>
            <span>帧间隔 {frameDelay} ms</span>
            <Slider min={20} max={500} value={frameDelay} onChange={setFrameDelay} />
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
          <Dragger multiple accept=".png,.jpg,.jpeg,.webp" style={{ marginTop: 12 }} beforeUpload={() => false} onChange={({ fileList }) => setFrameFiles(fileList.map((item) => item.originFileObj).filter(Boolean))}>
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
          <Dragger multiple accept=".png,.jpg,.jpeg,.webp" beforeUpload={() => false} onChange={({ fileList }) => setStitchFiles(fileList.map((item) => item.originFileObj).filter(Boolean))}>
            <p>上传 2 张及以上图片</p>
          </Dragger>
          <div className="pixel-tool-actions">
            <Button type="primary" loading={loading} onClick={() => { void handleStitch() }}>拼接导出</Button>
          </div>
        </>
      ),
    },
  ], [frameDelay, frameFiles, gifFile, gridCols, gridFile, gridRows, loading, sheetCols, stitchFiles, stitchMode])

  return (
    <>
      <Tabs items={tabs} />
      {previewUrls.length > 0 && (
        <div className="pixel-frame-grid">
          {previewUrls.map((url, index) => (
            <div key={url} className="pixel-frame-thumb">
              <img src={url} alt={`帧 ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
