import { useEffect, useState } from 'react'
import { Download, Scissors, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FileDropzone from '@/components/app/FileDropzone'
import NumberInput from '@/components/app/NumberInput'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
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
import { sortFilesByName } from './pixelToolUtils.js'

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
      const sorted = sortFilesByName(gifFrames)
      for (const file of sorted) {
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
    <div className="pixel-tool-panel">
      <FeatureCallout feature={imageSpriteCut} />
      <FeatureCallout feature={imageAtlasExport} />
      <Tabs defaultValue="split">
        <TabsList>
          <TabsTrigger value="split">拆分精灵图</TabsTrigger>
          <TabsTrigger value="togif">序列帧转 GIF</TabsTrigger>
        </TabsList>
        <TabsContent value="split">
          <p className="pixel-tool-hint">按行列将一张精灵图拆分为独立 PNG 帧。</p>
          <Stack wrap style={{ marginBottom: 12 }} align="center">
            <span>列</span>
            <NumberInput min={1} max={32} value={columns} onChange={setColumns} />
            <span>行</span>
            <NumberInput min={1} max={32} value={rows} onChange={setRows} />
          </Stack>
          <FileDropzone
            accept=".png,.jpg,.jpeg,.webp"
            maxCount={1}
            title="上传精灵图"
            onFiles={(files) => setSpriteFile(files[0] ?? null)}
          />
          {spriteFile && (
            <p className="mt-2 text-sm text-muted-foreground">
              <Scissors className="mr-1 inline size-4" />
              {spriteFile.name}
            </p>
          )}
          <div className="pixel-tool-actions">
            <Button disabled={loading} onClick={() => { void handleSplit() }}>
              {loading && <Loader2 className="animate-spin" />}
              <Download />
              下载帧 ZIP
            </Button>
            <Button variant="outline" disabled={loading} onClick={exportAtlasJson}>导出图集 JSON</Button>
          </div>
          {previewUrls.length > 0 && (
            <div className="sprite-preview-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(48px, 1fr))`, gap: 8, marginTop: 16, maxWidth: 640 }}>
              {previewUrls.map((url, i) => (
                <div key={url} style={{ textAlign: 'center' }}>
                  <img src={url} alt={`帧 ${i + 1}`} style={{ width: '100%', background: '#1a1a22', borderRadius: 4 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="togif">
          <p className="pixel-tool-hint">将多张序列帧合成为 GIF 动图。</p>
          <FileDropzone
            multiple
            accept=".png,.jpg,.jpeg,.webp"
            title="上传序列帧"
            onFiles={(files) => setGifFrames(sortFilesByName(files))}
          />
          {gifFrames.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">已选 {gifFrames.length} 个文件</p>
          )}
          <div style={{ marginTop: 12 }}>
            <span>帧间隔 {frameDelay} ms</span>
            <Slider min={20} max={500} value={[frameDelay]} onValueChange={([v]) => setFrameDelay(v)} />
          </div>
          <div className="pixel-tool-actions">
            <Button disabled={loading} onClick={() => { void handleFramesToGif() }}>
              {loading && <Loader2 className="animate-spin" />}
              <Download />
              生成 GIF
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
