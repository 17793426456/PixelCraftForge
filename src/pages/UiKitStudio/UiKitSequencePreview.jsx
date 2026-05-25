import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pause, Play, SkipBack } from 'lucide-react'
import { Button } from '@/components/app/AppButton'
import NumberInput from '@/components/app/NumberInput'

async function buildSpriteSheetUrl(frames) {
  if (!frames?.length) return null
  const imgs = await Promise.all(
    frames.map(
      (f) => new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = f.previewUrl
      }),
    ),
  )
  const fw = imgs[0].naturalWidth
  const fh = imgs[0].naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = fw * imgs.length
  canvas.height = fh
  const ctx = canvas.getContext('2d')
  imgs.forEach((img, i) => {
    ctx.drawImage(img, i * fw, 0, fw, fh)
  })
  return {
    url: canvas.toDataURL('image/png'),
    frameWidth: fw,
    frameHeight: fh,
  }
}

export default function UiKitSequencePreview({
  frames = [],
  variant = 'full',
  defaultFps = 10,
}) {
  const [playing, setPlaying] = useState(true)
  const [index, setIndex] = useState(0)
  const [fps, setFps] = useState(defaultFps)
  const [sheetMeta, setSheetMeta] = useState(null)

  const frameCount = frames.length
  const current = frames[index]

  useEffect(() => {
    setIndex(0)
    setPlaying(true)
  }, [frames])

  useEffect(() => {
    if (!frameCount) {
      setSheetMeta(null)
      return undefined
    }
    let cancelled = false
    void buildSpriteSheetUrl(frames).then((meta) => {
      if (!cancelled) setSheetMeta(meta)
    })
    return () => { cancelled = true }
  }, [frames, frameCount])

  useEffect(() => {
    if (!playing || frameCount < 2) return undefined
    const ms = Math.max(40, Math.round(1000 / Math.max(1, fps)))
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % frameCount)
    }, ms)
    return () => window.clearInterval(id)
  }, [playing, fps, frameCount])

  const selectFrame = useCallback((i) => {
    setIndex(i)
  }, [])

  const restart = useCallback(() => {
    setIndex(0)
    setPlaying(true)
  }, [])

  const progress = useMemo(() => {
    if (frameCount <= 1) return 100
    return Math.round(((index + 1) / frameCount) * 100)
  }, [index, frameCount])

  if (!frameCount || !current) return null

  const isCompact = variant === 'compact'

  return (
    <div
      className={`uikit-seq${isCompact ? ' uikit-seq--compact' : ''}`}
      aria-label="Hover 序列动画预览"
    >
      <div className="uikit-seq-player">
        <div className="uikit-seq-stage">
          <img
            src={current.previewUrl}
            alt={`hover 第 ${index + 1} 帧`}
            className="uikit-seq-frame-img"
          />
        </div>

        <div className="uikit-seq-controls">
          <Button
            type="default"
            size="small"
            className="uikit-control"
            icon={playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? '暂停' : '播放'}
          />
          <Button
            type="default"
            size="small"
            className="uikit-control"
            icon={<SkipBack className="size-3.5" />}
            onClick={restart}
            aria-label="回到第一帧"
          />
          {!isCompact && (
            <label className="uikit-seq-fps">
              <span>FPS</span>
              <NumberInput min={4} max={24} value={fps} onChange={(v) => setFps(v ?? defaultFps)} />
            </label>
          )}
          <span className="uikit-seq-meta">
            {index + 1} / {frameCount}
          </span>
        </div>

        {!isCompact && (
          <div
            className="uikit-seq-progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="uikit-seq-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {!isCompact && (
        <>
          <div className="uikit-seq-strip-wrap">
            <p className="uikit-seq-strip-title">序列帧 ({frameCount} 张 · 与 ZIP 内 hover_anim 一致)</p>
            <div className="uikit-seq-strip" role="list">
              {frames.map((frame, i) => (
                <button
                  key={`frame-${i}`}
                  type="button"
                  role="listitem"
                  className={`uikit-seq-thumb${i === index ? ' is-active' : ''}`}
                  onClick={() => selectFrame(i)}
                  title={`第 ${i + 1} 帧`}
                >
                  <img src={frame.previewUrl} alt="" />
                  <span>{String(i + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </div>

          {sheetMeta?.url && (
            <div className="uikit-seq-sheet">
              <p className="uikit-seq-strip-title">横向序列图（Sprite Sheet 预览）</p>
              <div className="uikit-seq-sheet-scroll">
                <img src={sheetMeta.url} alt="hover 序列图横向拼接" className="uikit-seq-sheet-img" />
              </div>
              <p className="uikit-seq-sheet-hint">
                共 {frameCount} 帧 · 单帧 {sheetMeta.frameWidth}×{sheetMeta.frameHeight}px · 可导入引擎做帧动画
              </p>
            </div>
          )}
        </>
      )}

      {isCompact && (
        <span className="uikit-state-hint">帧动画 · {frameCount} 帧循环</span>
      )}
    </div>
  )
}
