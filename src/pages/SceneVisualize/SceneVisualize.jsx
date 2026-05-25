import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button, Tag, message, Input, Progress, Tooltip, Space, Segmented, Checkbox,
} from '@/components/app/wrapped-ui'
import {
  PictureOutlined, BulbOutlined, AppstoreOutlined, EditOutlined,
  PlaySquareOutlined, TableOutlined, ApartmentOutlined,
  ColumnWidthOutlined, BorderOuterOutlined, ColumnHeightOutlined,
  DownloadOutlined, ZoomInOutlined, ReloadOutlined, SwapOutlined,
  ThunderboltOutlined, RocketOutlined, FileTextOutlined,
} from '@/lib/icons/antd-lucide'
import IconFont from '../../components/IconFont/IconFont'
import sceneTileBuild from '../../constants/features/scene-tile-build.js'
import sceneObjectCollision from '../../constants/features/scene-object-collision.js'
import sceneLayerZ from '../../constants/features/scene-layer-z.js'
import sceneMapExport from '../../constants/features/scene-map-export.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import { exportSceneLayoutJson } from '../../lib/assetProject.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import { generateSceneLayout } from '../../lib/scene/sceneLayoutEngine.js'
import './SceneVisualize.css'

const EXPORT_W = 800
const EXPORT_H = 420

const SCENE_LAYERS = [
  { key: 'sky', label: '天空层（远景）' },
  { key: 'mid', label: '中景（建筑/植被）' },
  { key: 'near', label: '近景（角色/道具）' },
]

const LAYER_TYPES = {
  sky: ['天空'],
  mid: ['建筑', '植被', '地形'],
  near: ['角色', '道具'],
}

const { TextArea } = Input

const MAX_PROMPT_LEN = 200

const SCENE_EXAMPLE =
  '一片魔法森林，远处有古老城堡，近处有发光蘑菇和溪流'

const SCENE_TEMPLATES = [
  {
    key: 'forest',
    label: '魔法森林',
    Icon: () => <IconFont type="icon-tree" />,
    prompt: '一片幽暗的魔法森林，参天古木间漂浮着蓝色光点，远处可见尖顶城堡的轮廓，近处溪流潺潺，蘑菇散发着柔和荧光',
  },
  {
    key: 'castle',
    label: '中世纪城堡',
    Icon: () => <IconFont type="icon-castle" />,
    prompt: '中世纪石砌城堡矗立在悬崖之上，旗帜飘扬，护城河环绕，下方是繁忙的市集与农田',
  },
  {
    key: 'desert',
    label: '沙漠绿洲',
    Icon: () => <IconFont type="icon-mountain" />,
    prompt: '金色沙漠中一片碧蓝绿洲，棕榈树环绕清泉，远处金字塔剪影与骆驼商队',
  },
  {
    key: 'space',
    label: '太空科幻',
    Icon: RocketOutlined,
    prompt: '未来太空站内部，全息屏幕闪烁，舷窗外是星云与行星，金属走廊通向指挥舱',
  },
]

const VIEW_OPTIONS = [
  {
    value: '横版视角',
    Icon: ColumnWidthOutlined,
    tip: '横版视角：适合平台跳跃、横版动作游戏',
  },
  {
    value: '俯视视角',
    Icon: BorderOuterOutlined,
    tip: '俯视视角：适合 RPG 与策略游戏',
  },
  {
    value: '侧视视角',
    Icon: ColumnHeightOutlined,
    tip: '侧视视角：适合模拟经营与解谜游戏',
  },
]

const SCENE_ELEMENTS = [
  { key: '角色', icon: 'icon-wizard', color: '#a855f7', desc: '角色：添加玩家、NPC、敌人等可交互单位', example: '示例：骑士、法师、村民' },
  { key: '道具', icon: 'icon-sword', color: '#52c41a', desc: '道具：添加武器、宝箱、收集物等', example: '示例：宝剑、药水、钥匙' },
  { key: '植被', icon: 'icon-tree', color: '#13c2c2', desc: '植被：添加树木、花草、岩石等环境元素', example: '示例：发光蘑菇、古老橡树、藤蔓' },
  { key: '建筑', icon: 'icon-castle', color: '#fa541c', desc: '建筑：添加房屋、塔楼、桥梁等结构', example: '示例：城堡、木屋、石塔' },
  { key: '地形', icon: 'icon-mountain', color: '#faad14', desc: '地形：添加地面、水面、道路等基础地貌', example: '示例：河流、山丘、石板路' },
  { key: '天空', icon: 'icon-cloud', color: '#1890ff', desc: '天空：添加云层、日月、天气效果', example: '示例：晚霞、星空、雷云' },
]

const BUILD_TIPS = [
  { Icon: EditOutlined, text: '描述越具体，元素布局越合理' },
  { Icon: PlaySquareOutlined, text: '横版视角适合平台跳跃类游戏' },
  { Icon: TableOutlined, text: '俯视视角适合 RPG 与策略游戏' },
  { Icon: ApartmentOutlined, text: '侧视视角适合模拟经营与解谜游戏' },
]

const DEFAULT_LAYOUT = [
  { id: 1, type: '天空', x: 50, y: 12 },
  { id: 2, type: '建筑', x: 20, y: 40 },
  { id: 3, type: '角色', x: 50, y: 60 },
  { id: 4, type: '植被', x: 72, y: 55 },
  { id: 5, type: '道具', x: 38, y: 65 },
  { id: 6, type: '地形', x: 50, y: 85 },
]

function SceneWireframe() {
  return (
    <svg className="scene-wireframe" viewBox="0 0 800 420" aria-hidden="true">
      <defs>
        <linearGradient id="wf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(168,85,247,0.08)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0)" />
        </linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#wf-sky)" />
      <ellipse cx="400" cy="340" rx="360" ry="60" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="1.5" />
      <path d="M0 320 Q200 280 400 300 T800 320 L800 420 L0 420 Z" fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="1.5" />
      <path d="M120 320 L140 240 L160 320 Z M155 320 L175 220 L195 320 Z" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
      <path d="M580 320 L600 250 L620 320 M610 320 L630 230 L650 320" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
      <rect x="300" y="200" width="80" height="120" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="1.5" />
      <polygon points="340,200 340,170 380,185 420,170 420,200" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="1.5" />
      <rect x="325" y="240" width="20" height="30" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1" />
      <rect x="375" y="240" width="20" height="30" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1" />
      <circle cx="480" cy="290" r="18" fill="none" stroke="rgba(52,211,153,0.25)" strokeWidth="1.5" />
      <circle cx="510" cy="300" r="12" fill="none" stroke="rgba(52,211,153,0.2)" strokeWidth="1" />
      <path d="M60 320 Q100 310 140 320" fill="none" stroke="rgba(96,165,250,0.2)" strokeWidth="1.5" />
      <circle cx="680" cy="80" r="30" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="1" />
    </svg>
  )
}

function getElementMeta(type) {
  return SCENE_ELEMENTS.find((e) => e.key === type) ?? SCENE_ELEMENTS[0]
}

export default function SceneVisualize() {
  const [scenePrompt, setScenePrompt] = useState('')
  const [selectedView, setSelectedView] = useState('横版视角')
  const [activeElements, setActiveElements] = useState(() => SCENE_ELEMENTS.map((e) => e.key))
  const [customElement, setCustomElement] = useState('')
  const [customElements, setCustomElements] = useState([])
  const [highlightElement, setHighlightElement] = useState(null)
  const [placedElements, setPlacedElements] = useState([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildProgress, setBuildProgress] = useState(0)
  const [sceneGenerated, setSceneGenerated] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [promptFocus, setPromptFocus] = useState(true)
  const [activeLayer, setActiveLayer] = useState('mid')
  const [showCollision, setShowCollision] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [layoutSummary, setLayoutSummary] = useState('')
  const progressTimer = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setPromptFocus(false), 2400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => () => {
    if (progressTimer.current) clearInterval(progressTimer.current)
  }, [])

  const toggleElement = useCallback((key) => {
    setActiveElements((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
    setHighlightElement(key)
    setTimeout(() => setHighlightElement(null), 1200)
  }, [])

  const applyTemplate = (prompt) => {
    setScenePrompt(prompt.slice(0, MAX_PROMPT_LEN))
    setSceneGenerated(false)
    setPlacedElements([])
  }

  const addCustomElement = () => {
    const trimmed = customElement.trim()
    if (!trimmed) return
    if (customElements.includes(trimmed)) {
      message.info('该元素已添加')
      return
    }
    setCustomElements((prev) => [...prev, trimmed])
    setCustomElement('')
  }

  const handleBuildScene = () => {
    if (!scenePrompt.trim()) {
      message.warning('请输入场景描述')
      return
    }
    if (activeElements.length === 0 && customElements.length === 0) {
      message.warning('请至少选择一个场景元素')
      return
    }

    setIsBuilding(true)
    setBuildProgress(0)
    setSceneGenerated(false)
    setPlacedElements([])
    setZoomed(false)

    progressTimer.current = setInterval(() => {
      setBuildProgress((p) => (p >= 92 ? p : p + Math.random() * 12))
    }, 180)

    setTimeout(() => {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setBuildProgress(100)
      const layout = generateSceneLayout({
        prompt: scenePrompt.trim(),
        activeElements,
        customElements,
        view: selectedView,
      })
      setPlacedElements(layout.elements)
      setLayoutSummary(layout.summary)
      setIsBuilding(false)
      setSceneGenerated(true)
      message.success(`场景搭建完成 · ${layout.summary}`)
    }, 1600)
  }

  const renderSceneToCanvas = () => {
    const canvas = document.createElement('canvas')
    canvas.width = EXPORT_W
    canvas.height = EXPORT_H
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, EXPORT_H)
    grad.addColorStop(0, '#1a1028')
    grad.addColorStop(1, '#0f0f12')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, EXPORT_W, EXPORT_H)
    for (const el of placedElements) {
      const meta = getElementMeta(el.type)
      const x = (el.x / 100) * EXPORT_W
      const y = (el.y / 100) * EXPORT_H
      const w = 72
      const h = 48
      ctx.fillStyle = `${meta.color}33`
      ctx.strokeStyle = meta.color
      ctx.lineWidth = 2
      ctx.fillRect(x - w / 2, y - h / 2, w, h)
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      if (showCollision) {
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = '#fa541c'
        ctx.strokeRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12)
        ctx.setLineDash([])
      }
      ctx.fillStyle = meta.color
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(el.label || el.type, x, y + 4)
    }
    return canvas
  }

  const handleDownload = () => {
    if (!placedElements.length) {
      message.warning('请先生成场景')
      return
    }
    renderSceneToCanvas().toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, 'scene-preview.png')
        message.success('场景预览图已下载')
      }
    })
  }

  const handleExportMapJson = () => {
    if (!placedElements.length) {
      message.warning('请先生成场景')
      return
    }
    const elements = placedElements.map((el) => ({
      ...el,
      collision: showCollision
        ? { x: el.x, y: el.y, w: 12, h: 10, unit: 'percent' }
        : null,
    }))
    const blob = exportSceneLayoutJson(elements, {
      view: selectedView,
      prompt: scenePrompt,
      layers: SCENE_LAYERS.map((l) => l.key),
      activeLayer,
      collisionEnabled: showCollision,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scene-layout.json'
    a.click()
    URL.revokeObjectURL(url)
    message.success('地图布局 JSON 已导出')
  }

  const visiblePlaced = placedElements.filter((el) => {
    if (el.layer) return el.layer === activeLayer
    const types = LAYER_TYPES[activeLayer] ?? []
    return types.includes(el.type)
  })

  const handleCanvasPointerMove = (e) => {
    if (!dragId || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.min(95, Math.max(5, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(95, Math.max(5, ((e.clientY - rect.top) / rect.height) * 100))
    setPlacedElements((prev) => prev.map((el) => (el.id === dragId ? { ...el, x, y } : el)))
  }

  const stopDrag = () => setDragId(null)

  const handleSwitchView = () => {
    const idx = VIEW_OPTIONS.findIndex((v) => v.value === selectedView)
    const next = VIEW_OPTIONS[(idx + 1) % VIEW_OPTIONS.length]
    setSelectedView(next.value)
    message.info(`已切换至${next.value}`)
  }

  const previewState = isBuilding ? 'loading' : sceneGenerated ? 'result' : 'idle'

  return (
    <div className="vf-page vf-page--centered atelier-page-wrap scene-page">
      <div className="vf-page-bg scene-page-bg" aria-hidden="true" />
      <div className="vf-page-grid" aria-hidden="true" />

      <div className="atelier-page atelier-page--wide scene-page-inner">
        <header className="atelier-hero atelier-enter scene-hero">
          <div className="atelier-title-row">
            <PictureOutlined />
            <h1 className="atelier-title">AI 游戏场景可视化搭建</h1>
          </div>
          <p className="atelier-subtitle scene-subtitle">
            地砖拼接、物件摆放与多层级场景管理 — 输入描述搭建关卡原型并导出地图 JSON
          </p>
        </header>

        <FeatureCallout feature={sceneTileBuild} />

        <div className="scene-studio-row atelier-enter atelier-enter--1">
          <aside className="scene-config-panel atelier-panel">
            <div className="scene-step-label">1. 描述你的游戏场景</div>
            <div className={`scene-prompt-wrap ${promptFocus ? 'is-highlight' : ''}`}>
              <TextArea
                rows={4}
                maxLength={MAX_PROMPT_LEN}
                placeholder="描述游戏场景，如：一片魔法森林，远处有古老城堡..."
                value={scenePrompt}
                onChange={(e) => {
                  setScenePrompt(e.target.value)
                  setSceneGenerated(false)
                }}
                className="scene-prompt-input"
              />
              <div className="scene-prompt-footer">
                <button
                  type="button"
                  className="scene-example-btn"
                  onClick={() => applyTemplate(SCENE_EXAMPLE)}
                >
                  <FileTextOutlined /> 试试示例
                </button>
                <span className="scene-char-count">{scenePrompt.length}/{MAX_PROMPT_LEN}</span>
              </div>
            </div>
            <p className="scene-example-hint">试试：{SCENE_EXAMPLE}</p>

            <div className="scene-step-label">2. 选择视角与场景元素</div>

            <div className="scene-field">
              <span className="scene-field-label">视角</span>
              <div className="scene-view-grid">
                {VIEW_OPTIONS.map(({ value, Icon, tip }) => (
                  <Tooltip key={value} title={tip}>
                    <button
                      type="button"
                      className={`scene-view-btn ${selectedView === value ? 'is-active' : ''}`}
                      onClick={() => setSelectedView(value)}
                    >
                      <Icon className="scene-view-icon" />
                      <span>{value.replace('视角', '')}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="scene-field">
              <span className="scene-field-label">场景元素</span>
              <div className="scene-element-tags">
                {SCENE_ELEMENTS.map(({ key, icon, color, desc }) => (
                  <Tooltip key={key} title={desc}>
                    <Tag
                      className={`scene-el-tag ${activeElements.includes(key) ? 'is-active' : ''} ${highlightElement === key ? 'is-highlight' : ''}`}
                      color={activeElements.includes(key) ? 'purple' : 'default'}
                      onClick={() => toggleElement(key)}
                      style={{ '--el-color': color }}
                    >
                      <IconFont type={icon} /> {key}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
              <div className="scene-custom-element">
                <Input
                  placeholder="自定义元素，如：瀑布、飞艇..."
                  value={customElement}
                  onChange={(e) => setCustomElement(e.target.value)}
                  onPressEnter={addCustomElement}
                  maxLength={20}
                />
                <Button size="small" onClick={addCustomElement}>添加</Button>
              </div>
              {customElements.length > 0 && (
                <Space wrap size={[4, 4]} className="scene-custom-tags">
                  {customElements.map((el) => (
                    <Tag key={el} closable onClose={() => setCustomElements((p) => p.filter((x) => x !== el))}>
                      {el}
                    </Tag>
                  ))}
                </Space>
              )}
            </div>

            <div className="scene-field">
              <span className="scene-field-label">场景层级</span>
              <FeatureCallout feature={sceneLayerZ} />
              <Segmented
                options={SCENE_LAYERS.map((l) => ({ label: l.label, value: l.key }))}
                value={activeLayer}
                onChange={setActiveLayer}
                block
              />
            </div>

            <div className="scene-field">
              <FeatureCallout feature={sceneObjectCollision} />
              <Checkbox checked={showCollision} onChange={(e) => setShowCollision(e.target.checked)}>
                显示碰撞 / 交互区域示意
              </Checkbox>
            </div>

            <div className="scene-step-label">3. 点击生成场景预览</div>
            <Button
              type="primary"
              size="large"
              icon={<IconFont type="icon-magic" />}
              onClick={handleBuildScene}
              loading={isBuilding}
              disabled={isBuilding}
              block
              className="scene-build-btn"
            >
              {isBuilding ? '生成中...' : '智能搭建场景'}
            </Button>
            <p className="scene-build-hint">生成预计需要 3–5 秒，请稍候</p>
          </aside>

          <main className="scene-preview-panel atelier-panel">
            <div className="scene-step-label scene-step-label--preview">4. 查看并导出场景</div>
            <div className="scene-canvas-header">
              <span>场景预览</span>
              <Tag color="purple">{selectedView}</Tag>
            </div>
            <div
              ref={canvasRef}
              className={`canvas-area canvas-area--${previewState} ${zoomed ? 'is-zoomed' : ''}`}
              onMouseMove={handleCanvasPointerMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
            >
              {previewState === 'idle' && (
                <div className="scene-idle-state">
                  <SceneWireframe />
                  <div className="scene-idle-overlay">
                    <PictureOutlined className="scene-idle-icon" />
                    <p className="scene-idle-title">场景预览区</p>
                    <p className="scene-idle-desc">
                      输入场景描述并点击【智能搭建场景】，生成的预览将在这里展示
                    </p>
                  </div>
                </div>
              )}

              {previewState === 'loading' && (
                <div className="scene-loading-state">
                  <div className="scene-loading-skeleton">
                    <div className="scene-skeleton-line scene-skeleton-line--wide" />
                    <div className="scene-skeleton-grid">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="scene-skeleton-block" />
                      ))}
                    </div>
                  </div>
                  <div className="scene-loading-info">
                    <ThunderboltOutlined className="scene-loading-icon" />
                    <p>AI 正在生成场景中...</p>
                    <Progress
                      percent={Math.round(buildProgress)}
                      showInfo={false}
                      strokeColor={{ from: '#a855f7', to: '#ec4899' }}
                      trailColor="rgba(255,255,255,0.08)"
                    />
                  </div>
                </div>
              )}

              {previewState === 'result' && (
                <div className="scene-result-state atelier-stagger">
                  {visiblePlaced.map((el) => {
                    const meta = getElementMeta(el.type)
                    return (
                      <div
                        key={el.id}
                        className="scene-element"
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          borderColor: meta.color,
                          background: `${meta.color}18`,
                          cursor: 'grab',
                        }}
                        onMouseDown={() => setDragId(el.id)}
                      >
                        {showCollision && (
                          <span className="scene-collision-box" aria-hidden="true" />
                        )}
                        <IconFont type={meta.icon} className="scene-icon" style={{ color: meta.color }} />
                        <span style={{ color: meta.color, fontWeight: 500 }}>{el.label || el.type}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {previewState === 'result' && (
              <div className="scene-preview-actions">
                {layoutSummary && <span className="scene-layout-summary">{layoutSummary}</span>}
                <FeatureCallout feature={sceneMapExport} />
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载场景图</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportMapJson}>导出地图 JSON</Button>
                <Button icon={<ZoomInOutlined />} onClick={() => setZoomed((z) => !z)}>
                  {zoomed ? '还原' : '放大'}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleBuildScene}>重新生成</Button>
                <Button icon={<SwapOutlined />} onClick={handleSwitchView}>切换视角</Button>
              </div>
            )}
          </main>

          <aside className="scene-side-widgets">
            <section className="scene-widget">
              <header className="scene-widget-head">
                <h3><BulbOutlined /> 搭建技巧</h3>
              </header>
              <ul className="scene-tip-list">
                {BUILD_TIPS.map(({ Icon, text }) => (
                  <li key={text}>
                    <span className="scene-tip-icon"><Icon /></span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="scene-widget">
              <header className="scene-widget-head">
                <h3><AppstoreOutlined /> 元素类型</h3>
              </header>
              <p className="scene-widget-hint">点击标签与左侧联动高亮</p>
              <div className="scene-side-element-grid">
                {SCENE_ELEMENTS.map(({ key, icon, color, example }) => (
                  <Tooltip key={key} title={example}>
                    <button
                      type="button"
                      className={`scene-side-el-btn ${activeElements.includes(key) ? 'is-active' : ''} ${highlightElement === key ? 'is-highlight' : ''}`}
                      onClick={() => toggleElement(key)}
                      style={{ '--el-color': color }}
                    >
                      <IconFont type={icon} />
                      <span>{key}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </section>

            <section className="scene-widget scene-widget--templates">
              <header className="scene-widget-head">
                <h3><RocketOutlined /> 快速场景模板</h3>
              </header>
              <div className="scene-template-grid">
                {SCENE_TEMPLATES.map(({ key, label, Icon, prompt }) => (
                  <button
                    key={key}
                    type="button"
                    className="scene-template-btn"
                    onClick={() => applyTemplate(prompt)}
                  >
                    <span className="scene-template-icon"><Icon /></span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
