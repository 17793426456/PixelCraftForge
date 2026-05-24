import { useEffect, useRef, useState } from 'react'
import { Button, Slider, Space, Select, message, Upload } from 'antd'
import { DownloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import vfxParticleParams from '../../constants/features/vfx-particle-params.js'
import vfxPresets from '../../constants/features/vfx-presets.js'
import vfxPreviewTiming from '../../constants/features/vfx-preview-timing.js'
import { triggerDownload, zipBlobs } from '../../lib/assets/imageExport.js'

const PRESETS = {
  sparkle: { count: 80, speed: 2, gravity: 0.05, life: 60, color: '#a855f7', size: 4 },
  rain: { count: 120, speed: 6, gravity: 0.2, life: 80, color: '#60a5fa', size: 2 },
  explosion: { count: 100, speed: 5, gravity: 0.08, life: 45, color: '#f59e0b', size: 6 },
  snow: { count: 90, speed: 1.5, gravity: 0.02, life: 120, color: '#f8fafc', size: 3 },
}

function spawnParticle(w, h, cfg, sprite) {
  return {
    x: Math.random() * w,
    y: Math.random() * h * 0.3,
    vx: (Math.random() - 0.5) * cfg.speed,
    vy: Math.random() * cfg.speed,
    life: cfg.life + Math.random() * 20,
    maxLife: cfg.life,
    size: cfg.size * (0.5 + Math.random()),
    color: cfg.color,
    sprite,
  }
}

export default function ParticleStudio() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const particlesRef = useRef([])
  const cfgRef = useRef(PRESETS.sparkle)
  const spriteRef = useRef(null)
  const playStartRef = useRef(null)
  const [preset, setPreset] = useState('sparkle')
  const [count, setCount] = useState(80)
  const [speed, setSpeed] = useState(2)
  const [duration, setDuration] = useState(3)
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    cfgRef.current = { ...PRESETS[preset], count, speed }
  }, [preset, count, speed])

  useEffect(() => {
    if (playing) playStartRef.current = Date.now()
    else playStartRef.current = null
  }, [playing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const w = 640
    const h = 360
    canvas.width = w
    canvas.height = h
    const cfg = cfgRef.current
    particlesRef.current = Array.from({ length: cfg.count }, () => spawnParticle(w, h, cfg, spriteRef.current))

    const tick = () => {
      const c = cfgRef.current
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(15,15,18,0.25)'
      ctx.fillRect(0, 0, w, h)

      if (playStartRef.current) {
        const sec = (Date.now() - playStartRef.current) / 1000
        setElapsed(sec)
        if (sec >= duration) {
          setPlaying(false)
          return
        }
      }

      const next = []
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += c.gravity
        p.life -= 1
        const alpha = Math.max(0, p.life / p.maxLife)
        ctx.globalAlpha = alpha
        if (p.sprite) {
          const s = p.size * 2
          ctx.drawImage(p.sprite, p.x - s / 2, p.y - s / 2, s, s)
        } else {
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        if (p.life > 0 && p.x >= 0 && p.x <= w && p.y <= h) {
          next.push(p)
        } else if (playing) {
          next.push(spawnParticle(w, h, c, spriteRef.current))
        }
      }
      particlesRef.current = next
      ctx.globalAlpha = 1
      if (playing) rafRef.current = requestAnimationFrame(tick)
    }

    if (playing) rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [count, speed, preset, playing, duration])

  const exportPreset = () => {
    const c = cfgRef.current
    const data = {
      preset,
      count,
      speed,
      duration,
      elapsed: Math.round(elapsed * 10) / 10,
      gravity: c.gravity,
      color: c.color,
      hasSprite: !!spriteRef.current,
      engine: 'pixelcraftforge-particle-v1',
      phaser: {
        x: 320,
        y: 180,
        blendMode: 'ADD',
        frequency: Math.max(50, 500 - count * 2),
        lifespan: duration * 1000,
      },
    }
    triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `particle_${preset}.json`)
    message.success('粒子预设 JSON 已导出（含 Phaser 参考字段）')
  }

  const exportFrame = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) triggerDownload(blob, `particle_${preset}.png`)
    })
  }

  const exportFrameSequence = async () => {
    setPlaying(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const frames = Math.min(12, Math.max(4, Math.floor(duration * 4)))
    const entries = []
    const w = canvas.width
    const h = canvas.height
    const cfg = cfgRef.current
    let simParticles = Array.from({ length: cfg.count }, () => spawnParticle(w, h, cfg, spriteRef.current))

    for (let i = 0; i < frames; i++) {
      const snap = document.createElement('canvas')
      snap.width = w
      snap.height = h
      const ctx = snap.getContext('2d')
      ctx.fillStyle = '#0f0f12'
      ctx.fillRect(0, 0, w, h)
      simParticles = simParticles.map((p) => {
        const next = { ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + cfg.gravity }
        ctx.fillStyle = next.color
        ctx.beginPath()
        ctx.arc(next.x, next.y, next.size, 0, Math.PI * 2)
        ctx.fill()
        return next
      })
      const blob = await new Promise((r) => snap.toBlob(r, 'image/png'))
      entries.push({ name: `particle_${String(i + 1).padStart(2, '0')}.png`, blob })
    }
    await zipBlobs(entries, `particle_${preset}_frames.zip`)
    message.success(`已导出 ${frames} 帧序列 ZIP`)
  }

  const loadSprite = async (file) => {
    const url = URL.createObjectURL(file)
    const img = await new Promise((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = rej
      el.src = url
    })
    URL.revokeObjectURL(url)
    spriteRef.current = img
    message.success('粒子精灵图已加载')
    setPlaying(true)
    setElapsed(0)
  }

  return (
    <div className="vf-page atelier-page-wrap">
      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero">
          <h1 className="atelier-title"><ThunderboltOutlined /> 特效粒子工作室</h1>
          <p className="atelier-subtitle">预设调节、时长控制、精灵图粒子、帧序列导出</p>
        </header>
        <FeatureCallout feature={vfxParticleParams} />
        <FeatureCallout feature={vfxPresets} />
        <FeatureCallout feature={vfxPreviewTiming} />
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            value={preset}
            onChange={(v) => {
              setPreset(v)
              setCount(PRESETS[v].count)
              setSpeed(PRESETS[v].speed)
              setElapsed(0)
              setPlaying(true)
            }}
            options={Object.keys(PRESETS).map((k) => ({ value: k, label: k }))}
          />
          <span>数量 {count}</span>
          <Slider min={20} max={200} value={count} onChange={setCount} style={{ width: 120 }} />
          <span>速度 {speed}</span>
          <Slider min={1} max={10} value={speed} onChange={setSpeed} style={{ width: 120 }} />
          <span>时长 {duration}s</span>
          <Slider min={1} max={10} value={duration} onChange={setDuration} style={{ width: 100 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{playing ? `播放 ${elapsed.toFixed(1)}s` : '已暂停'}</span>
          <Upload showUploadList={false} beforeUpload={(f) => { void loadSprite(f); return false }} accept="image/*">
            <Button>上传粒子精灵</Button>
          </Upload>
          <Button onClick={() => { setElapsed(0); setPlaying((p) => !p) }}>{playing ? '暂停' : '播放'}</Button>
          <Button onClick={() => { setElapsed(0); setPlaying(true) }}>重播</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportPreset}>导出 JSON</Button>
          <Button icon={<DownloadOutlined />} onClick={exportFrame}>导出 PNG</Button>
          <Button icon={<DownloadOutlined />} onClick={() => { void exportFrameSequence() }}>导出帧序列</Button>
        </Space>
        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 640, borderRadius: 8, background: '#0f0f12' }} />
      </div>
    </div>
  )
}
