import { useEffect, useRef, useState } from 'react'
import { Button, Slider, Space, Select, message } from 'antd'
import { DownloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import vfxParticleParams from '../../constants/features/vfx-particle-params.js'
import vfxPresets from '../../constants/features/vfx-presets.js'
import vfxPreviewTiming from '../../constants/features/vfx-preview-timing.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'

const PRESETS = {
  sparkle: { count: 80, speed: 2, gravity: 0.05, life: 60, color: '#a855f7', size: 4 },
  rain: { count: 120, speed: 6, gravity: 0.2, life: 80, color: '#60a5fa', size: 2 },
  explosion: { count: 100, speed: 5, gravity: 0.08, life: 45, color: '#f59e0b', size: 6 },
  snow: { count: 90, speed: 1.5, gravity: 0.02, life: 120, color: '#f8fafc', size: 3 },
}

function spawnParticle(w, h, cfg) {
  return {
    x: Math.random() * w,
    y: Math.random() * h * 0.3,
    vx: (Math.random() - 0.5) * cfg.speed,
    vy: Math.random() * cfg.speed,
    life: cfg.life + Math.random() * 20,
    maxLife: cfg.life,
    size: cfg.size * (0.5 + Math.random()),
    color: cfg.color,
  }
}

export default function ParticleStudio() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const particlesRef = useRef([])
  const cfgRef = useRef(PRESETS.sparkle)
  const [preset, setPreset] = useState('sparkle')
  const [count, setCount] = useState(80)
  const [speed, setSpeed] = useState(2)
  const [duration, setDuration] = useState(3)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    cfgRef.current = { ...PRESETS[preset], count, speed }
  }, [preset, count, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const w = 640
    const h = 360
    canvas.width = w
    canvas.height = h
    const cfg = cfgRef.current
    particlesRef.current = Array.from({ length: cfg.count }, () => spawnParticle(w, h, cfg))

    const tick = () => {
      const c = cfgRef.current
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(15,15,18,0.25)'
      ctx.fillRect(0, 0, w, h)
      const next = []
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += c.gravity
        p.life -= 1
        const alpha = Math.max(0, p.life / p.maxLife)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        if (p.life > 0 && p.x >= 0 && p.x <= w && p.y <= h) {
          next.push(p)
        } else if (playing) {
          next.push(spawnParticle(w, h, c))
        }
      }
      particlesRef.current = next
      ctx.globalAlpha = 1
      if (playing) rafRef.current = requestAnimationFrame(tick)
    }

    if (playing) rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [count, speed, preset, playing])

  const exportPreset = () => {
    const c = cfgRef.current
    const data = { preset, count, speed, duration, gravity: c.gravity, color: c.color, engine: 'pixelcraftforge-particle-v1' }
    triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `particle_${preset}.json`)
    message.success('粒子预设 JSON 已导出')
  }

  const exportFrame = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) triggerDownload(blob, `particle_${preset}.png`)
    })
  }

  return (
    <div className="vf-page atelier-page-wrap">
      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero">
          <h1 className="atelier-title"><ThunderboltOutlined /> 特效粒子工作室</h1>
          <p className="atelier-subtitle">调节粒子数量、速度、轨迹与时长，预览并导出 JSON 预设 / PNG 快照</p>
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
            }}
            options={Object.keys(PRESETS).map((k) => ({ value: k, label: k }))}
          />
          <span>数量 {count}</span>
          <Slider min={20} max={200} value={count} onChange={setCount} style={{ width: 120 }} />
          <span>速度 {speed}</span>
          <Slider min={1} max={10} value={speed} onChange={setSpeed} style={{ width: 120 }} />
          <span>时长 {duration}s</span>
          <Slider min={1} max={10} value={duration} onChange={setDuration} style={{ width: 100 }} />
          <Button onClick={() => setPlaying((p) => !p)}>{playing ? '暂停' : '播放'}</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportPreset}>导出 JSON</Button>
          <Button icon={<DownloadOutlined />} onClick={exportFrame}>导出 PNG</Button>
        </Space>
        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 640, borderRadius: 8, background: '#0f0f12' }} />
      </div>
    </div>
  )
}
