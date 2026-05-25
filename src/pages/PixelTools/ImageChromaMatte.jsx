import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Palette, Loader2, Pipette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import FileDropzone from '@/components/app/FileDropzone'
import ColorPickerField from '@/components/app/ColorPickerField'
import AppSegmented from '@/components/app/AppSegmented'
import Stack from '@/components/app/Stack'
import { message } from '@/lib/ui/notify'
import { sampleCanvasColor } from '../../lib/videoFrame/chromaKey.js'
import { canvasToBlob, loadImageFromFile, triggerDownload } from '../../lib/frameRonin/gifUtils.js'
import imageLayerEdit from '../../constants/features/image-layer-edit.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'

const PRESETS = {
  green: { r: 0, g: 255, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
}

function rgbToHex(r, g, b) {
  const ch = (n) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0')
  return `#${ch(r)}${ch(g)}${ch(b)}`
}

function parseHexColor(hex) {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    }
  }
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  }
}

function colorDistance(r, g, b, kr, kg, kb) {
  return Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
}

/** 从四角与四边中点采样，估计纯色背景色 */
function detectBackgroundFromImage(img) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return { r: 0, g: 255, b: 0 }
  ctx.drawImage(img, 0, 0)
  const w = canvas.width
  const h = canvas.height
  const points = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
  ]
  let r = 0
  let g = 0
  let b = 0
  for (const [x, y] of points) {
    const d = ctx.getImageData(x, y, 1, 1).data
    r += d[0]
    g += d[1]
    b += d[2]
  }
  const n = points.length
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

function imageToSourceCanvas(img) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(img, 0, 0)
  return canvas
}

/**
 * 色度键抠图：欧氏距离 + 从画面边缘种子点泛洪（与 frameRonin 一致，容差为 0–255 尺度）
 */
function chromaKeyOnCanvas(sourceCanvas, keyRgb, tolerancePct, smoothnessPct) {
  const out = document.createElement('canvas')
  out.width = sourceCanvas.width
  out.height = sourceCanvas.height
  const outCtx = out.getContext('2d')
  const srcCtx = sourceCanvas.getContext('2d')
  if (!outCtx || !srcCtx) throw new Error('无法读取图像像素')

  outCtx.drawImage(sourceCanvas, 0, 0)
  const id = outCtx.getImageData(0, 0, out.width, out.height)
  const d = id.data
  const { r: kr, g: kg, b: kb } = keyRgb
  const tol = Math.round(10 + (tolerancePct / 100) * 90)
  const feather = smoothnessPct > 0 ? Math.round(4 + (smoothnessPct / 100) * 40) : 0

  const w = out.width
  const h = out.height
  const idx = (x, y) => (y * w + x) * 4
  const distAt = (i) => colorDistance(d[i], d[i + 1], d[i + 2], kr, kg, kb)
  const matchesKey = (i) => distAt(i) <= tol

  const seeds = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
  ]

  const toRemove = new Set()
  const visited = new Set()
  const stack = []

  for (const [sx, sy] of seeds) {
    const si = idx(sx, sy)
    if (visited.has(si) || !matchesKey(si)) continue
    visited.add(si)
    toRemove.add(si)
    stack.push([sx, sy])
  }

  const dx = [0, 1, 0, -1]
  const dy = [-1, 0, 1, 0]
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    for (let k = 0; k < 4; k += 1) {
      const nx = x + dx[k]
      const ny = y + dy[k]
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const i = idx(nx, ny)
      if (visited.has(i)) continue
      visited.add(i)
      if (matchesKey(i)) {
        toRemove.add(i)
        stack.push([nx, ny])
      }
    }
  }

  for (let i = 0; i < d.length; i += 4) {
    if (toRemove.has(i)) {
      d[i + 3] = 0
      continue
    }
    if (feather > 0) {
      const dist = distAt(i)
      if (dist > tol && dist < tol + feather) {
        d[i + 3] = Math.round(255 * Math.min(1, (dist - tol) / feather))
      }
    }
  }

  outCtx.putImageData(id, 0, 0)
  return out
}

export default function ImageChromaMatte() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [preset, setPreset] = useState('custom')
  const [customColor, setCustomColor] = useState('#00ff00')
  const [tolerance, setTolerance] = useState(40)
  const [smoothness, setSmoothness] = useState(30)
  const [loading, setLoading] = useState(false)
  const [colorReady, setColorReady] = useState(false)
  const autoPreviewRef = useRef(null)
  const detectGenRef = useRef(0)

  const resolveKeyRgb = useCallback(() => {
    if (preset === 'custom') return parseHexColor(customColor)
    return PRESETS[preset]
  }, [preset, customColor])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setColorReady(false)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    setColorReady(false)

    const gen = detectGenRef.current + 1
    detectGenRef.current = gen
    loadImageFromFile(file)
      .then((img) => {
        if (detectGenRef.current !== gen) return
        const bg = detectBackgroundFromImage(img)
        setPreset('custom')
        setCustomColor(rgbToHex(bg.r, bg.g, bg.b))
        setColorReady(true)
      })
      .catch(() => {
        if (detectGenRef.current === gen) setColorReady(true)
      })

    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  const handleProcess = useCallback(async (silent = false) => {
    if (!file) {
      if (!silent) message.warning('请先上传图片')
      return
    }
    setLoading(true)
    try {
      const img = await loadImageFromFile(file)
      const sourceCanvas = imageToSourceCanvas(img)
      const keyRgb = resolveKeyRgb()
      const resultCanvas = chromaKeyOnCanvas(sourceCanvas, keyRgb, tolerance, smoothness)
      const blob = await canvasToBlob(resultCanvas)
      setResultUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
      if (!silent) message.success('抠图完成')
    } catch (error) {
      if (!silent) message.error(error instanceof Error ? error.message : '抠图失败')
    } finally {
      setLoading(false)
    }
  }, [file, resolveKeyRgb, tolerance, smoothness])

  useEffect(() => {
    if (!file || !colorReady) return undefined
    if (autoPreviewRef.current) clearTimeout(autoPreviewRef.current)
    autoPreviewRef.current = setTimeout(() => {
      void handleProcess(true)
    }, 300)
    return () => {
      if (autoPreviewRef.current) clearTimeout(autoPreviewRef.current)
    }
  }, [file, colorReady, tolerance, smoothness, preset, customColor, handleProcess])

  const handlePickFromPreview = useCallback(async (event) => {
    if (!file) return
    const el = event.currentTarget
    if (!el.naturalWidth) return
    const rect = el.getBoundingClientRect()
    const x = Math.round(((event.clientX - rect.left) / rect.width) * el.naturalWidth)
    const y = Math.round(((event.clientY - rect.top) / rect.height) * el.naturalHeight)
    try {
      const img = await loadImageFromFile(file)
      const canvas = imageToSourceCanvas(img)
      const sample = sampleCanvasColor(canvas, x, y, 2)
      setPreset('custom')
      setCustomColor(sample.hex)
      setColorReady(true)
      message.success(`已取背景色 ${sample.hex}`)
    } catch {
      message.error('取色失败')
    }
  }, [file])

  const keyRgb = resolveKeyRgb()
  const keyHex = rgbToHex(keyRgb.r, keyRgb.g, keyRgb.b)

  return (
    <div className="pixel-tool-panel">
      <FeatureCallout feature={imageLayerEdit} />
      <p className="pixel-tool-hint">
        上传后自动识别背景色；点击原图背景可取色。容差越大抠除范围越宽，角色边缘发虚时请略降低容差或增加羽化。
      </p>
      <FileDropzone
        accept=".png,.jpg,.jpeg,.webp"
        maxCount={1}
        title="上传带纯色背景的图片"
        onFiles={(files) => setFile(files[0] ?? null)}
      />
      {file && (
        <p className="mt-2 text-sm text-muted-foreground">
          <Palette className="mr-1 inline size-4" />
          {file.name}
        </p>
      )}

      {file && (
        <>
          <Stack direction="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
            <AppSegmented
              value={preset}
              onChange={setPreset}
              options={[
                { label: '绿幕', value: 'green' },
                { label: '蓝幕', value: 'blue' },
                { label: '自定义', value: 'custom' },
              ]}
            />
            <Stack align="center" wrap>
              <span style={{ color: 'var(--color-text-secondary)' }}>背景色</span>
              <span
                className="pixel-matte-swatch"
                style={{ background: keyHex }}
                title={keyHex}
              />
              {preset === 'custom' && (
                <ColorPickerField value={customColor} onChange={setCustomColor} />
              )}
              <span className="text-xs text-muted-foreground">
                <Pipette className="mr-0.5 inline size-3.5" />
                点击原图背景取色
              </span>
            </Stack>
            <div>
              <span>容差 {tolerance}%</span>
              <Slider
                min={5}
                max={80}
                value={[tolerance]}
                onValueChange={([v]) => setTolerance(typeof v === 'number' ? v : tolerance)}
              />
            </div>
            <div>
              <span>羽化 {smoothness}%</span>
              <Slider
                min={0}
                max={100}
                value={[smoothness]}
                onValueChange={([v]) => setSmoothness(typeof v === 'number' ? v : smoothness)}
              />
            </div>
          </Stack>

          <div className="pixel-tool-actions">
            <Button disabled={loading || !colorReady} onClick={() => { void handleProcess() }}>
              {loading && <Loader2 className="animate-spin" />}
              {resultUrl ? '重新抠图' : '执行抠图'}
            </Button>
            {resultUrl && (
              <Button
                variant="outline"
                onClick={async () => {
                  const blob = await fetch(resultUrl).then((r) => r.blob())
                  triggerDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}-matte.png`)
                }}
              >
                <Download />
                下载 PNG
              </Button>
            )}
          </div>

          <div className="pixel-preview-row">
            {previewUrl && (
              <div className="pixel-preview-box">
                <strong>原图（点击背景取色）</strong>
                <img
                  src={previewUrl}
                  alt="原图"
                  className="pixel-preview-pickable"
                  onClick={(e) => { void handlePickFromPreview(e) }}
                />
              </div>
            )}
            <div className="pixel-preview-box">
              <strong>抠图结果</strong>
              {(loading || !colorReady) && !resultUrl && (
                <p className="pixel-matte-placeholder">
                  {!colorReady ? '正在识别背景色…' : '处理中…'}
                </p>
              )}
              {resultUrl && (
                <img src={resultUrl} alt="抠图结果" />
              )}
              {colorReady && !loading && !resultUrl && (
                <p className="pixel-matte-placeholder">调节参数后自动预览</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
