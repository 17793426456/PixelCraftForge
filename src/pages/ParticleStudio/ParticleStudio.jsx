import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button, Slider, Select, message, Collapse, Input, Space, ColorPicker, Switch, Modal,
} from '@/components/app/wrapped-ui'
import FileDropzone from '@/components/app/FileDropzone'
import {
  DownloadOutlined, ThunderboltOutlined, PlayCircleOutlined, PauseCircleOutlined,
  ReloadOutlined, SaveOutlined, FolderOpenOutlined, PlusOutlined, DeleteOutlined,
  EyeOutlined, EyeInvisibleOutlined, DragOutlined, ZoomInOutlined, ZoomOutOutlined,
  KeyOutlined, CodeOutlined, StepBackwardOutlined, StepForwardOutlined,
} from '@/lib/icons/antd-lucide'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import vfxParticleParams from '../../constants/features/vfx-particle-params.js'
import vfxPresets from '../../constants/features/vfx-presets.js'
import vfxPreviewTiming from '../../constants/features/vfx-preview-timing.js'
import { triggerDownload, zipBlobs } from '../../lib/assets/imageExport.js'
import {
  BUILTIN_PRESETS,
  createExampleParticleTexture,
  getBuiltinPresetTextureKey,
  BLEND_MODES,
  CANVAS_H,
  CANVAS_W,
  EMITTER_SHAPES,
  PARTICLE_SHAPES,
  createDefaultLayer,
  exportProjectConfig,
  renderFrame,
  simulateStep,
  spawnParticle,
  updateParticle,
  drawParticle,
} from '../../lib/particle/aeParticleEngine.js'
import { deletePreset, loadSavedPresets, savePreset } from '../../lib/particle/aeParticleStorage.js'
import {
  addKeyframe, removeKeyframe, resolveLayersAtTime, ANIM_TRACKS,
} from '../../lib/particle/aeKeyframe.js'
import {
  exportEngineBundle, exportPhaserReadme, exportUnityReadme,
} from '../../lib/particle/aeEngineExport.js'
import JSZip from 'jszip'
import './ParticleStudio.css'

const PRESET_PREVIEW_W = 960
const PRESET_PREVIEW_H = 540

function ParamSlider({ label, min, max, step = 1, value, onChange }) {
  return (
    <div className="ae-param-row">
      <div className="ae-param-label"><span>{label}</span><span>{typeof value === 'number' ? (step < 1 ? value.toFixed(2) : value) : value}</span></div>
      <Slider min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  )
}

function deepMergeLayer(layer, patch) {
  const next = { ...layer }
  for (const key of Object.keys(patch)) {
    if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
      next[key] = { ...layer[key], ...patch[key] }
    } else {
      next[key] = patch[key]
    }
  }
  return next
}

export default function ParticleStudio() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const particlesRef = useRef({})
  const spawnAccRef = useRef({})
  const textureMapRef = useRef({})
  const playingRef = useRef(true)
  const elapsedRef = useRef(0)
  const dragModeRef = useRef(null)

  const [layers, setLayers] = useState(() => [createDefaultLayer('layer-1', '粒子层 1')])
  const [activeLayerId, setActiveLayerId] = useState('layer-1')
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [global, setGlobal] = useState({ fps: 60, loop: true, duration: 5 })
  const [view, setView] = useState({ scale: 1, panX: 0, panY: 0 })
  const [panMode, setPanMode] = useState(false)
  const [savedPresets, setSavedPresets] = useState(() => loadSavedPresets())
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [selectedKeyframeId, setSelectedKeyframeId] = useState(null)
  const [presetPreviewUrl, setPresetPreviewUrl] = useState(null)
  const [presetPreviewTitle, setPresetPreviewTitle] = useState('')

  const layersRef = useRef(layers)
  const globalRef = useRef(global)
  const viewRef = useRef(view)
  const activeLayerIdRef = useRef(activeLayerId)

  useEffect(() => { layersRef.current = layers }, [layers])
  useEffect(() => { globalRef.current = global }, [global])
  useEffect(() => { viewRef.current = view }, [view])
  useEffect(() => { activeLayerIdRef.current = activeLayerId }, [activeLayerId])
  useEffect(() => { playingRef.current = playing }, [playing])

  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? layers[0]

  const updateActiveLayer = useCallback((patch) => {
    setLayers((prev) => prev.map((l) => (l.id === activeLayerId ? deepMergeLayer(l, patch) : l)))
  }, [activeLayerId])

  const resetSimulation = useCallback(() => {
    particlesRef.current = {}
    spawnAccRef.current = {}
    elapsedRef.current = 0
    setElapsed(0)
  }, [])

  const canvasToWorld = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const v = viewRef.current
    const sx = (clientX - rect.left) / rect.width * CANVAS_W
    const sy = (clientY - rect.top) / rect.height * CANVAS_H
    return {
      x: (sx - v.panX) / v.scale,
      y: (sy - v.panY) / v.scale,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    let lastFrame = performance.now()

    const tick = (now) => {
      const ctx = canvas.getContext('2d')
      const g = globalRef.current
      const frameMs = 1000 / g.fps
      const delta = now - lastFrame

      if (playingRef.current && delta >= frameMs * 0.85) {
        lastFrame = now
        elapsedRef.current += delta / 1000
        if (!g.loop && elapsedRef.current >= g.duration) {
          playingRef.current = false
          setPlaying(false)
        } else if (g.loop && elapsedRef.current >= g.duration) {
          elapsedRef.current = 0
        }
        const resolved = resolveLayersAtTime(layersRef.current, elapsedRef.current)
        const step = simulateStep(
          resolved,
          particlesRef.current,
          spawnAccRef.current,
          CANVAS_W,
          CANVAS_H,
        )
        particlesRef.current = step.particlesByLayer
        spawnAccRef.current = step.spawnAcc
        setElapsed(elapsedRef.current)
      }

      const resolvedForRender = resolveLayersAtTime(layersRef.current, elapsedRef.current)
      renderFrame(ctx, resolvedForRender, particlesRef.current, textureMapRef.current, {
        w: CANVAS_W,
        h: CANVAS_H,
        showGizmo: true,
        activeLayerId: activeLayerIdRef.current,
        viewScale: viewRef.current.scale,
        viewPanX: viewRef.current.panX,
        viewPanY: viewRef.current.panY,
        trail: true,
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const handleCanvasPointerDown = (e) => {
    const world = canvasToWorld(e.clientX, e.clientY)
    if (panMode) {
      dragModeRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, panX: view.panX, panY: view.panY }
      return
    }
    const layer = layersRef.current.find((l) => l.id === activeLayerIdRef.current)
    if (layer) {
      const dx = world.x - layer.emitter.x
      const dy = world.y - layer.emitter.y
      if (Math.hypot(dx, dy) < 20) {
        dragModeRef.current = { type: 'emitter', layerId: layer.id }
        return
      }
    }
    dragModeRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, panX: view.panX, panY: view.panY }
  }

  const handleCanvasPointerMove = (e) => {
    const drag = dragModeRef.current
    if (!drag) return
    if (drag.type === 'pan') {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_W / rect.width
      const scaleY = CANVAS_H / rect.height
      setView({
        ...viewRef.current,
        panX: drag.panX + (e.clientX - drag.startX) * scaleX,
        panY: drag.panY + (e.clientY - drag.startY) * scaleY,
      })
    } else if (drag.type === 'emitter') {
      const world = canvasToWorld(e.clientX, e.clientY)
      setLayers((prev) => prev.map((l) => (
        l.id === drag.layerId
          ? deepMergeLayer(l, { emitter: { x: Math.round(world.x), y: Math.round(world.y) } })
          : l
      )))
    }
  }

  const handleCanvasPointerUp = () => {
    dragModeRef.current = null
  }

  const addLayer = () => {
    const id = `layer-${Date.now()}`
    setLayers((prev) => [...prev, createDefaultLayer(id, `粒子层 ${prev.length + 1}`)])
    setActiveLayerId(id)
  }

  const removeLayer = (id) => {
    if (layers.length <= 1) {
      message.warning('至少保留一个粒子层')
      return
    }
    setLayers((prev) => prev.filter((l) => l.id !== id))
    delete particlesRef.current[id]
    if (activeLayerId === id) setActiveLayerId(layers.find((l) => l.id !== id)?.id ?? 'layer-1')
  }

  const assignTextureToActiveLayer = useCallback(async (img, label) => {
    textureMapRef.current = { ...textureMapRef.current, [activeLayerIdRef.current]: img }
    setLayers((prev) => prev.map((l) => (
      l.id === activeLayerIdRef.current
        ? deepMergeLayer(l, { appearance: { shape: 'texture' }, texture: label })
        : l
    )))
    resetSimulation()
  }, [resetSimulation])

  const loadTexture = async (file) => {
    if (!file) return
    try {
      const url = URL.createObjectURL(file)
      const img = await new Promise((res, rej) => {
        const el = new Image()
        el.onload = () => res(el)
        el.onerror = () => rej(new Error('load failed'))
        el.src = url
      })
      URL.revokeObjectURL(url)
      await assignTextureToActiveLayer(img, file.name || '贴图')
      message.success('粒子贴图已载入当前层，粒子样式已切换为「纹理贴图」')
    } catch {
      message.error('贴图加载失败，请使用 PNG / WebP 图片')
    }
  }

  const importExampleTexture = async (key) => {
    const preset = BUILTIN_PRESETS[key]
    if (!preset) return
    try {
      const texKey = getBuiltinPresetTextureKey(preset)
      const img = await createExampleParticleTexture(texKey)
      await assignTextureToActiveLayer(img, `示例-${preset.name}.png`)
      message.success(`已导入示例贴图：${preset.name}`)
    } catch {
      message.error('示例贴图生成失败，请重试或手动上传')
    }
  }

  const applyBuiltinPreset = async (key) => {
    const preset = BUILTIN_PRESETS[key]
    if (!preset) return
    setLayers((prev) => prev.map((l) => (
      l.id === activeLayerIdRef.current ? deepMergeLayer(l, preset.layer) : l
    )))
    const needsTexture = preset.layer?.appearance?.shape === 'texture'
      || getBuiltinPresetTextureKey(preset)
    if (needsTexture) {
      try {
        const img = await createExampleParticleTexture(getBuiltinPresetTextureKey(preset))
        await assignTextureToActiveLayer(img, `示例贴图-${preset.name}`)
      } catch {
        message.warning('示例贴图加载失败，可点击「导入示例」重试')
      }
    } else {
      resetSimulation()
    }
    message.success(`已应用预设：${preset.name}`)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      message.warning('请输入方案名称')
      return
    }
    const project = exportProjectConfig(layers, global)
    savePreset(presetName.trim(), project)
    setSavedPresets(loadSavedPresets())
    setSaveModalOpen(false)
    setPresetName('')
    message.success('特效方案已保存')
  }

  const handleLoadPreset = (entry) => {
    const { project } = entry
    if (!project?.layers?.length) return
    setLayers(project.layers.map((l) => {
      const base = createDefaultLayer(l.id, l.name || '粒子层')
      return {
        ...base,
        ...l,
        emitter: { ...base.emitter, ...l.emitter },
        appearance: { ...base.appearance, ...l.appearance },
        physics: { ...base.physics, ...l.physics },
        render: { ...base.render, ...l.render },
        animation: { ...base.animation, ...l.animation },
        keyframes: l.keyframes ?? [],
      }
    }))
    if (project.global) setGlobal(project.global)
    setActiveLayerId(project.layers[0].id)
    resetSimulation()
    setPlaying(true)
    message.success(`已加载：${entry.name}`)
  }

  const exportConfig = () => {
    const data = exportProjectConfig(layers, global)
    triggerDownload(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      'ae_particle_effect.json',
    )
    message.success('特效配置文件已导出')
  }

  const exportPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) triggerDownload(blob, 'ae_particle_frame.png')
    })
  }

  const exportSequence = async () => {
    setPlaying(false)
    const frames = Math.min(120, Math.max(8, Math.floor(global.duration * global.fps)))
    const entries = []
    const simParticles = {}
    const simAcc = {}
    const simLayers = layers.map((l) => ({ ...l }))

    for (let f = 0; f < frames; f++) {
      const snap = document.createElement('canvas')
      snap.width = CANVAS_W
      snap.height = CANVAS_H
      const ctx = snap.getContext('2d')
      ctx.fillStyle = '#0c0c10'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      for (const layer of simLayers) {
        if (!layer.visible) continue
        simAcc[layer.id] = (simAcc[layer.id] ?? 0) + layer.emitter.rate / global.fps
        let list = simParticles[layer.id] ?? []
        while (simAcc[layer.id] >= 1) {
          list = [...list, spawnParticle(layer)]
          simAcc[layer.id] -= 1
        }
        list = list.map((p) => {
          const copy = { ...p }
          updateParticle(copy, layer)
          return copy
        }).filter((p) => p.life > 0)
        simParticles[layer.id] = list
        const tex = textureMapRef.current[layer.id]
        for (const p of list) drawParticle(ctx, p, layer, tex)
      }

      const blob = await new Promise((r) => snap.toBlob(r, 'image/png'))
      entries.push({ name: `frame_${String(f + 1).padStart(4, '0')}.png`, blob })
    }

    await zipBlobs(entries, `ae_particle_${frames}f.zip`)
    resetSimulation()
    setPlaying(true)
    message.success(`已导出 ${frames} 帧 PNG 序列`)
  }

  const seekToTime = (t) => {
    const clamped = Math.max(0, Math.min(global.duration, t))
    elapsedRef.current = clamped
    setElapsed(clamped)
  }

  const stepFrame = (dir) => {
    setPlaying(false)
    playingRef.current = false
    const dt = 1 / Math.max(global.fps, 1)
    seekToTime(elapsedRef.current + dir * dt)
  }

  const goToStart = () => {
    setPlaying(false)
    playingRef.current = false
    resetSimulation()
  }

  const renderPresetPreview = async (presetKey) => {
    const preset = BUILTIN_PRESETS[presetKey]
    if (!preset) return
    const layer = deepMergeLayer(createDefaultLayer('preview', preset.name), preset.layer)
    const texMap = {}
    if (layer.appearance?.shape === 'texture' || getBuiltinPresetTextureKey(preset)) {
      try {
        texMap[layer.id] = await createExampleParticleTexture(getBuiltinPresetTextureKey(preset))
      } catch { /* ignore */ }
    }
    const off = document.createElement('canvas')
    off.width = PRESET_PREVIEW_W
    off.height = PRESET_PREVIEW_H
    const particles = { [layer.id]: [] }
    const spawnAcc = { [layer.id]: 0 }
    for (let i = 0; i < 90; i += 1) {
      const step = simulateStep([layer], particles, spawnAcc, PRESET_PREVIEW_W, PRESET_PREVIEW_H)
      particles[layer.id] = step.particlesByLayer[layer.id] ?? []
      spawnAcc[layer.id] = step.spawnAcc[layer.id] ?? 0
    }
    renderFrame(off.getContext('2d'), [layer], particles, texMap, {
      w: PRESET_PREVIEW_W,
      h: PRESET_PREVIEW_H,
      showGizmo: false,
      viewScale: 1,
      viewPanX: 0,
      viewPanY: 0,
      trail: true,
    })
    setPresetPreviewTitle(preset.name)
    setPresetPreviewUrl(off.toDataURL('image/png'))
  }

  const handleAddKeyframe = () => {
    setLayers((prev) => prev.map((l) => (
      l.id === activeLayerId
        ? { ...l, keyframes: addKeyframe(l, elapsed) }
        : l
    )))
    message.success(`已在 ${elapsed.toFixed(2)}s 添加关键帧`)
  }

  const handleRemoveKeyframe = (kfId) => {
    setLayers((prev) => prev.map((l) => (
      l.id === activeLayerId
        ? { ...l, keyframes: removeKeyframe(l, kfId) }
        : l
    )))
    setSelectedKeyframeId(null)
  }

  const exportEnginePack = async () => {
    const bundle = exportEngineBundle(layers, global)
    const zip = new JSZip()
    zip.file('ae_particle_effect.json', JSON.stringify(exportProjectConfig(layers, global), null, 2))
    zip.file('engine_bundle.json', JSON.stringify(bundle, null, 2))
    zip.file('phaser_particle.json', JSON.stringify(bundle.phaser, null, 2))
    zip.file('README.txt', bundle.readme)
    zip.file('unity/README.md', exportUnityReadme())
    zip.file('phaser/README.md', exportPhaserReadme())
    bundle.unity.forEach((u, i) => {
      zip.file(`unity/unity_layer_${i}.json`, JSON.stringify(u, null, 2))
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(blob, 'particle_engine_pack.zip')
    message.success('Unity / Phaser 引擎导出包已下载')
  }

  const activeKeyframes = activeLayer?.keyframes ?? []

  const collapseItems = activeLayer ? [
    {
      key: 'emitter',
      label: '1. 发射器基础设置',
      children: (
        <>
          <ParamSlider label="发射 X" min={0} max={CANVAS_W} value={activeLayer.emitter.x} onChange={(v) => updateActiveLayer({ emitter: { x: v } })} />
          <ParamSlider label="发射 Y" min={0} max={CANVAS_H} value={activeLayer.emitter.y} onChange={(v) => updateActiveLayer({ emitter: { y: v } })} />
          <ParamSlider label="发射速率 (粒子/秒)" min={1} max={120} value={activeLayer.emitter.rate} onChange={(v) => updateActiveLayer({ emitter: { rate: v } })} />
          <div className="ae-param-row">
            <div className="ae-param-label">发射形态</div>
            <Select
              value={activeLayer.emitter.shape}
              onChange={(v) => updateActiveLayer({ emitter: { shape: v } })}
              options={EMITTER_SHAPES.map((s) => ({ value: s, label: s === 'point' ? '点状' : s === 'circle' ? '圆形' : '扇形' }))}
              style={{ width: '100%' }}
            />
          </div>
          <ParamSlider label="发射角度 (°)" min={-180} max={180} value={activeLayer.emitter.angle} onChange={(v) => updateActiveLayer({ emitter: { angle: v } })} />
          <ParamSlider label="扇形扩散 (°)" min={0} max={360} value={activeLayer.emitter.spread} onChange={(v) => updateActiveLayer({ emitter: { spread: v } })} />
          <ParamSlider label="发射半径" min={4} max={200} value={activeLayer.emitter.radius} onChange={(v) => updateActiveLayer({ emitter: { radius: v } })} />
        </>
      ),
    },
    {
      key: 'appearance',
      label: '2. 粒子外观属性',
      children: (
        <>
          <ParamSlider label="初始尺寸" min={0.5} max={24} step={0.5} value={activeLayer.appearance.sizeStart} onChange={(v) => updateActiveLayer({ appearance: { sizeStart: v } })} />
          <ParamSlider label="消亡尺寸" min={0} max={24} step={0.5} value={activeLayer.appearance.sizeEnd} onChange={(v) => updateActiveLayer({ appearance: { sizeEnd: v } })} />
          <div className="ae-param-row">
            <div className="ae-param-label">起始色 / 结束色</div>
            <Space>
              <ColorPicker value={activeLayer.appearance.colorStart} onChange={(c) => updateActiveLayer({ appearance: { colorStart: c.toHexString() } })} />
              <ColorPicker value={activeLayer.appearance.colorEnd} onChange={(c) => updateActiveLayer({ appearance: { colorEnd: c.toHexString() } })} />
            </Space>
          </div>
          <ParamSlider label="初始透明度" min={0} max={1} step={0.05} value={activeLayer.appearance.opacityStart} onChange={(v) => updateActiveLayer({ appearance: { opacityStart: v } })} />
          <ParamSlider label="结束透明度" min={0} max={1} step={0.05} value={activeLayer.appearance.opacityEnd} onChange={(v) => updateActiveLayer({ appearance: { opacityEnd: v } })} />
          <div className="ae-param-row">
            <div className="ae-param-label">粒子样式</div>
            <Select
              value={activeLayer.appearance.shape}
              onChange={(v) => {
                updateActiveLayer({ appearance: { shape: v } })
                if (v === 'texture' && !textureMapRef.current[activeLayerId]) {
                  message.info('请在下方「素材与方案」上传贴图，或点击示例预设的「导入示例」')
                }
              }}
              options={PARTICLE_SHAPES.map((s) => ({ value: s, label: s === 'circle' ? '圆形' : s === 'star' ? '星形' : '纹理贴图' }))}
              style={{ width: '100%' }}
            />
          </div>
          {activeLayer.appearance.shape === 'texture' && (
            <p className="ae-texture-hint">
              当前贴图：{activeLayer.texture || '未导入'}
              {!activeLayer.texture && ' — 请在「素材与方案」导入贴图或示例'}
            </p>
          )}
        </>
      ),
    },
    {
      key: 'physics',
      label: '3. 物理运动参数',
      children: (
        <>
          <ParamSlider label="飞行速度" min={0.5} max={15} step={0.1} value={activeLayer.physics.speed} onChange={(v) => updateActiveLayer({ physics: { speed: v } })} />
          <ParamSlider label="重力 (负值上浮)" min={-0.3} max={0.3} step={0.01} value={activeLayer.physics.gravity} onChange={(v) => updateActiveLayer({ physics: { gravity: v } })} />
          <ParamSlider label="空气阻力" min={0} max={0.15} step={0.005} value={activeLayer.physics.drag} onChange={(v) => updateActiveLayer({ physics: { drag: v } })} />
          <ParamSlider label="湍流扰动" min={0} max={2} step={0.05} value={activeLayer.physics.turbulence} onChange={(v) => updateActiveLayer({ physics: { turbulence: v } })} />
        </>
      ),
    },
    {
      key: 'render',
      label: '4. 渲染特效模式',
      children: (
        <>
          <div className="ae-param-row">
            <div className="ae-param-label">混合模式</div>
            <Select
              value={activeLayer.render.blendMode}
              onChange={(v) => updateActiveLayer({ render: { blendMode: v } })}
              options={BLEND_MODES.map((m) => ({
                value: m,
                label: m === 'add' ? '光亮叠加 (Add)' : m === 'screen' ? '滤色 (Screen)' : '常规叠加',
              }))}
              style={{ width: '100%' }}
            />
          </div>
          <div className="ae-param-row">
            <div className="ae-param-label">运动模糊</div>
            <Switch checked={activeLayer.render.motionBlur} onChange={(v) => updateActiveLayer({ render: { motionBlur: v } })} />
          </div>
          <ParamSlider label="光晕强度" min={0} max={1} step={0.05} value={activeLayer.render.glow} onChange={(v) => updateActiveLayer({ render: { glow: v } })} />
        </>
      ),
    },
    {
      key: 'animation',
      label: '5. 动画周期管控',
      children: (
        <>
          <ParamSlider label="生命周期 (帧)" min={12} max={240} value={activeLayer.animation.lifetime} onChange={(v) => updateActiveLayer({ animation: { lifetime: v } })} />
          <div className="ae-param-row">
            <div className="ae-param-label">层内持续发射</div>
            <Switch checked={activeLayer.animation.loop} onChange={(v) => updateActiveLayer({ animation: { loop: v } })} />
          </div>
          <ParamSlider label="全局帧率 FPS" min={12} max={60} value={global.fps} onChange={(v) => setGlobal((g) => ({ ...g, fps: v }))} />
          <ParamSlider label="预览时长 (秒)" min={1} max={15} value={global.duration} onChange={(v) => setGlobal((g) => ({ ...g, duration: v }))} />
          <div className="ae-param-row">
            <div className="ae-param-label">循环播放</div>
            <Switch checked={global.loop} onChange={(v) => setGlobal((g) => ({ ...g, loop: v }))} />
          </div>
        </>
      ),
    },
    {
      key: 'timeline',
      label: '7. 时间轴关键帧',
      children: (
        <>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '0 12px' }}>
            可动画属性：{ANIM_TRACKS.map((t) => t.key.split('.').pop()).join('、')}
          </p>
          <div className="ae-param-row">
            <Button block icon={<KeyOutlined />} onClick={handleAddKeyframe}>在当前时间添加关键帧</Button>
          </div>
          {activeKeyframes.length > 0 ? (
            <div className="ae-keyframe-list">
              {activeKeyframes.map((kf) => (
                <div
                  key={kf.id}
                  className={`ae-keyframe-item ${selectedKeyframeId === kf.id ? 'active' : ''}`}
                >
                  <button type="button" onClick={() => { setSelectedKeyframeId(kf.id); seekToTime(kf.time) }}>
                    {kf.time.toFixed(2)}s
                  </button>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveKeyframe(kf.id)} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', padding: '0 12px' }}>暂无关键帧，调节参数后点击上方按钮添加</p>
          )}
        </>
      ),
    },
    {
      key: 'import',
      label: '8. 素材与方案',
      children: (
        <>
          <div className="ae-param-row">
            <FileDropzone
              className="ae-texture-upload"
              accept="image/*"
              title="点击或拖拽导入粒子贴图"
              hint="PNG / WebP · 应用于当前选中粒子层"
              onFiles={(files) => { if (files[0]) void loadTexture(files[0]) }}
            />
          </div>
          <p className="ae-preset-section-label">内置示例贴图（魔法火花 / 细雨 / 爆炸）</p>
          <div className="ae-presets-row">
            {Object.entries(BUILTIN_PRESETS).map(([k, p]) => (
              <div key={k} className="ae-preset-chip">
                <button
                  type="button"
                  className="ae-preset-preview-btn"
                  title="放大预览"
                  onClick={() => { void renderPresetPreview(k) }}
                >
                  预览
                </button>
                <Button size="small" type="default" onClick={() => { void importExampleTexture(k) }}>
                  导入示例
                </Button>
                <Button size="small" type="primary" className="jm-generate-btn" onClick={() => { void applyBuiltinPreset(k) }}>
                  {p.name}
                </Button>
              </div>
            ))}
          </div>
          {savedPresets.length > 0 && (
            <div className="ae-param-row">
              <div className="ae-param-label">已保存方案</div>
              {savedPresets.map((p) => (
                <Space key={p.id} style={{ marginBottom: 6 }}>
                  <Button size="small" icon={<FolderOpenOutlined />} onClick={() => handleLoadPreset(p)}>{p.name}</Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { deletePreset(p.id); setSavedPresets(loadSavedPresets()) }} />
                </Space>
              ))}
            </div>
          )}
        </>
      ),
    },
  ] : []

  return (
    <div className="ae-particle-studio vf-page">
      <div className="ae-callouts">
        <FeatureCallout feature={vfxParticleParams} />
        <FeatureCallout feature={vfxPresets} />
        <FeatureCallout feature={vfxPreviewTiming} />
      </div>

      <div className="ae-toolbar">
        <span className="ae-toolbar-title"><ThunderboltOutlined /> AE 粒子特效制作器</span>
        <Button size="small" icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => { resetSimulation(); setPlaying(true) }}>重置</Button>
        <Button size="small" icon={<SaveOutlined />} onClick={() => setSaveModalOpen(true)}>保存方案</Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={exportConfig}>导出配置</Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={exportPng}>导出 PNG</Button>
        <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => { void exportSequence() }}>导出序列帧</Button>
        <Button size="small" icon={<CodeOutlined />} onClick={() => { void exportEnginePack() }}>Unity/Phaser</Button>
        <span className="ae-toolbar-spacer" />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{elapsed.toFixed(1)}s / {global.duration}s · {global.fps} FPS</span>
      </div>

      <div className="ae-body">
        <aside className="ae-layers-panel">
          <h3>图层管理</h3>
          <Button block icon={<PlusOutlined />} size="small" onClick={addLayer} style={{ marginBottom: 10 }}>添加粒子层</Button>
          {layers.map((l) => (
            <div key={l.id} className={`ae-layer-item ${l.id === activeLayerId ? 'active' : ''}`}>
              <button type="button" onClick={() => setLayers((prev) => prev.map((x) => (x.id === l.id ? { ...x, visible: !x.visible } : x)))}>
                {l.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>
              <button type="button" className="ae-layer-name" onClick={() => setActiveLayerId(l.id)}>{l.name}</button>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeLayer(l.id)} />
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>拖拽画布上的紫色圆点可移动发射器</p>
        </aside>

        <div className="ae-canvas-wrap">
          <div className={`ae-canvas-viewport ${panMode ? 'pan-mode' : ''}`}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasPointerDown}
              onMouseMove={handleCanvasPointerMove}
              onMouseUp={handleCanvasPointerUp}
              onMouseLeave={handleCanvasPointerUp}
            />
          </div>
          <div className="ae-view-controls">
            <Button size="small" icon={<DragOutlined />} type={panMode ? 'primary' : 'default'} onClick={() => setPanMode((p) => !p)}>平移视图</Button>
            <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setView((v) => ({ ...v, scale: Math.max(0.5, v.scale - 0.1) }))} />
            <span>{Math.round(view.scale * 100)}%</span>
            <Button size="small" icon={<ZoomInOutlined />} onClick={() => setView((v) => ({ ...v, scale: Math.min(2, v.scale + 0.1) }))} />
            <Button size="small" onClick={() => setView({ scale: 1, panX: 0, panY: 0 })}>重置视图</Button>
          </div>

          <div className="ae-timeline">
            <div className="ae-timeline-header">
              <span>时间轴</span>
              <span>{elapsed.toFixed(2)}s / {global.duration}s · {playing ? '播放中' : '已暂停'}</span>
            </div>
            <div className="ae-timeline-transport">
              <Button
                size="small"
                type={playing ? 'primary' : 'default'}
                icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? '暂停' : '播放'}
              </Button>
              <Button size="small" onClick={goToStart}>回到起点</Button>
              <Button size="small" icon={<StepBackwardOutlined />} onClick={() => stepFrame(-1)} title="上一帧" />
              <Button size="small" icon={<StepForwardOutlined />} onClick={() => stepFrame(1)} title="下一帧" />
            </div>
            <Slider
              min={0}
              max={global.duration}
              step={0.01}
              value={elapsed}
              onChange={(v) => { setPlaying(false); seekToTime(v) }}
              tooltip={{ formatter: (v) => `${v?.toFixed(2)}s` }}
            />
            <div className="ae-timeline-track">
              {activeKeyframes.map((kf) => (
                <button
                  key={kf.id}
                  type="button"
                  className={`ae-timeline-marker ${selectedKeyframeId === kf.id ? 'active' : ''}`}
                  style={{ left: `${(kf.time / global.duration) * 100}%` }}
                  onClick={() => { setSelectedKeyframeId(kf.id); seekToTime(kf.time) }}
                  title={`${kf.time.toFixed(2)}s`}
                >
                  <KeyOutlined />
                </button>
              ))}
              <div className="ae-timeline-playhead" style={{ left: `${(elapsed / global.duration) * 100}%` }} />
            </div>
          </div>
        </div>

        <aside className="ae-params-panel">
          <Collapse defaultActiveKey={['emitter', 'appearance', 'import', 'physics', 'render', 'animation']} items={collapseItems} />
        </aside>
      </div>

      <Modal title="保存特效方案" open={saveModalOpen} onOk={handleSavePreset} onCancel={() => setSaveModalOpen(false)}>
        <Input placeholder="方案名称，如：火球术尾迹" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
      </Modal>

      <Modal
        title={`预设预览 · ${presetPreviewTitle}`}
        open={!!presetPreviewUrl}
        footer={(
          <Button type="primary" onClick={() => setPresetPreviewUrl(null)}>关闭</Button>
        )}
        onCancel={() => setPresetPreviewUrl(null)}
        width={Math.min(PRESET_PREVIEW_W + 48, window.innerWidth - 40)}
      >
        {presetPreviewUrl && (
          <img src={presetPreviewUrl} alt={presetPreviewTitle} className="ae-preset-preview-img" />
        )}
      </Modal>
    </div>
  )
}
