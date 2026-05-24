import { useEffect, useState } from 'react'
import { Button, InputNumber, message, Slider, Space, Tabs, Upload } from 'antd'
import { DownloadOutlined, ScissorOutlined } from '@ant-design/icons'
import JSZip from 'jszip'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import {
  canvasToBlob,
  loadImageFromFile,
  splitImageGrid,
  triggerDownload,
} from '../../lib/frameRonin/gifUtils.js'
import { buildAtlasJson, downloadAtlasJson } from '../../lib/assets/atlasExport.js'
import imageAtlasExport from '../../constants/features/image-atlas-export.js'
import imageSpriteCut from '../../constants/features/image-sprite-cut.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'

const { Dragger } = Upload

function buildGifFromImageDataList(frames, delayMs) {
  const gif = GIFEncoder()
  for (const frame of frames) {
    const { data, width, height } = frame
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, {
      palette,
      delay: Math.max(20, delayMs),
      transparent: true,
      transparentIndex: 0,
    })
  }
  gif.finish()
  return new Blob([gif.bytes()], { type: 'image/gif' })
}

export default function SpriteSheetTool() {
  const [spriteFile, setSpriteFile] = useState(null)
  const [columns, setColumns] = useState(8)
  const [rows, setRows] = useState(4)
  const [frameDelay, setFrameDelay] = useState(100)
  const [gifFrames, setGifFrames] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastSplit, setLastSplit] = useState(null)

  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls])

  const exportAtlasJson = () => {
    if (!lastSplit) {
      message.warning('请先拆分精灵图')
      return
    }
    const { img, fileName } = lastSplit
    const cellW = Math.floor(img.naturalWidth / columns)
    const cellH = Math.floor(img.naturalHeight / rows)
    const frames = lastSplit.cells.map(({ index }) => ({
      name: `frame_${String(index + 1).padStart(3, '0')}`,
      x: (index % columns) * cellW,
      y: Math.floor(index / columns) * cellH,
      w: cellW,
      h: cellH,
    }))
    const desc = buildAtlasJson({
      imageName: `${fileName.replace(/\.[^.]+$/, '')}.png`,
      sheetWidth: img.naturalWidth,
      sheetHeight: img.naturalHeight,
      frames,
    })
    downloadAtlasJson(desc, `${fileName.replace(/\.[^.]+$/, '')}_atlas.json`)
    message.success('图集 JSON 已导出（Unity / Godot 可用）')
  }

  const handleSplit = async () => {
    if (!spriteFile) {
      message.warning('请上传精灵图')
      return
    }
    setLoading(true)
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
    try {
      const img = await loadImageFromFile(spriteFile)
      const cells = splitImageGrid(img, columns, rows)
      const cellW = Math.floor(img.naturalWidth / columns)
      const cellH = Math.floor(img.naturalHeight / rows)
      const cellsWithPos = cells.map(({ canvas, index }) => ({
        canvas,
        index,
        x: (index % columns) * cellW,
        y: Math.floor(index / columns) * cellH,
      }))
      setLastSplit({ cells: cellsWithPos, img, fileName: spriteFile.name })
      const zip = new JSZip()
      const urls = []
      for (const { canvas, index } of cells) {
        const blob = await canvasToBlob(canvas)
        const name = `frame_${String(index + 1).padStart(3, '0')}.png`
        zip.file(name, blob)
        urls.push(URL.createObjectURL(blob))
      }
      triggerDownload(await zip.generateAsync({ type: 'blob' }), `${spriteFile.name.replace(/\.[^.]+$/, '')}-split.zip`)
      setPreviewUrls(urls)
      message.success(`已拆分 ${cells.length} 帧`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '拆分失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFramesToGif = async () => {
    if (!gifFrames.length) {
      message.warning('请上传序列帧')
      return
    }
    setLoading(true)
    try {
      const imageDataList = []
      for (const file of gifFrames) {
        const img = await loadImageFromFile(file)
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        imageDataList.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
      }
      const blob = buildGifFromImageDataList(imageDataList, frameDelay)
      triggerDownload(blob, 'spritesheet.gif')
      message.success('GIF 已生成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'GIF 生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
  <>
    <FeatureCallout feature={imageSpriteCut} />
    <FeatureCallout feature={imageAtlasExport} />
    <Tabs
      items={[
        {
          key: 'split',
          label: '拆分精灵图',
          children: (
            <>
              <p className="pixel-tool-hint">按行列将一张精灵图拆分为独立 PNG 帧。</p>
              <Space wrap style={{ marginBottom: 12 }}>
                <span>列</span>
                <InputNumber min={1} max={32} value={columns} onChange={(v) => setColumns(v ?? 8)} />
                <span>行</span>
                <InputNumber min={1} max={32} value={rows} onChange={(v) => setRows(v ?? 4)} />
              </Space>
              <Dragger accept=".png,.jpg,.jpeg,.webp" maxCount={1} beforeUpload={(f) => { setSpriteFile(f); return false }} onRemove={() => setSpriteFile(null)}>
                <p><ScissorOutlined /> 上传精灵图</p>
              </Dragger>
              <div className="pixel-tool-actions">
                <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={() => { void handleSplit() }}>
                  下载帧 ZIP
                </Button>
                <Button loading={loading} onClick={exportAtlasJson}>导出图集 JSON</Button>
              </div>
            </>
          ),
        },
        {
          key: 'togif',
          label: '序列帧转 GIF',
          children: (
            <>
              <p className="pixel-tool-hint">将多张序列帧合成为 GIF 动图。</p>
              <Dragger multiple accept=".png,.jpg,.jpeg,.webp" beforeUpload={() => false} onChange={({ fileList }) => setGifFrames(fileList.map((item) => item.originFileObj).filter(Boolean))}>
                <p>上传序列帧</p>
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
      ]}
    />
  </>
  )
}
