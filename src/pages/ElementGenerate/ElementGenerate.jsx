import { useState } from 'react'
import {
  Button, Upload, Checkbox, Tag, message, Space, Badge, Input, Tooltip, Dropdown,
} from 'antd'
import {
  ThunderboltOutlined, HighlightOutlined, PictureOutlined, EditOutlined,
  ReloadOutlined, InfoCircleOutlined, RightOutlined, DownOutlined,
} from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
import uiDrawComponents from '../../constants/features/ui-draw-components.js'
import uiStateSprites from '../../constants/features/ui-state-sprites.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import './ElementGenerate.css'

const UI_STATE_PRESETS = ['normal', 'hover', 'disabled']

const { TextArea } = Input

const templates = [
  { id: 1, name: '仙侠世界', icon: 'icon-sword' },
  { id: 2, name: '末日废土', icon: 'icon-radiation' },
  { id: 3, name: '田园牧歌', icon: 'icon-wheat' },
  { id: 4, name: '地牢冒险', icon: 'icon-castle' },
]

const poseOptions = ['站立', '行走', '攻击', '待机', '死亡', '跳跃', '施法']

const modelOptions = [
  { id: 'pixel-x', name: '像素风-X 模型', desc: '专精低多边形像素角色与道具', preview: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { id: 'oriental-v2', name: '国风二次元 V2', desc: '水墨笔触与仙侠题材最佳', preview: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' },
  { id: 'realistic-pro', name: '暗黑写实 PRO', desc: '高细节金属铠甲 / 怪物', preview: 'linear-gradient(135deg, #374151 0%, #6366f1 100%)' },
]

const resolutionOptions = ['1K', '2K']
const ratioRow1 = ['1:1', '4:3', '3:4', '3:2', '2:3']
const ratioRow2 = ['16:9', '9:16', '21:9', '9:21']
const countOptions = [1, 2, 3, 4]
const modeOptions = [
  { label: '文生图', value: '文生图', icon: <HighlightOutlined /> },
  { label: '图生图', value: '图生图', icon: <PictureOutlined /> },
  { label: '二次修改', value: '二次修改', icon: <EditOutlined /> },
]

const DEFAULTS = {
  mode: '文生图', prompt: '', selectedTemplate: null, selectedPoses: [], layered: true,
  modelId: 'pixel-x', resolution: '1K', ratio: '9:16', count: 4,
}

export default function ElementGenerate() {
  const [mode, setMode] = useState(DEFAULTS.mode)
  const [prompt, setPrompt] = useState(DEFAULTS.prompt)
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULTS.selectedTemplate)
  const [selectedPoses, setSelectedPoses] = useState(DEFAULTS.selectedPoses)
  const [layered, setLayered] = useState(DEFAULTS.layered)
  const [modelId, setModelId] = useState(DEFAULTS.modelId)
  const [resolution, setResolution] = useState(DEFAULTS.resolution)
  const [ratio, setRatio] = useState(DEFAULTS.ratio)
  const [count, setCount] = useState(DEFAULTS.count)
  const [credits] = useState(40)
  const [results, setResults] = useState([])
  const [filterTime, setFilterTime] = useState('全部时间')
  const [filterType, setFilterType] = useState('全部类型')
  const [uiStateMode, setUiStateMode] = useState('normal')

  const currentModel = modelOptions.find(m => m.id === modelId) || modelOptions[0]

  const togglePose = (pose) => {
    setSelectedPoses(prev => prev.includes(pose) ? prev.filter(p => p !== pose) : [...prev, pose])
  }

  const cycleModel = () => {
    const idx = modelOptions.findIndex(m => m.id === modelId)
    setModelId(modelOptions[(idx + 1) % modelOptions.length].id)
  }

  const handleReset = () => {
    setMode(DEFAULTS.mode)
    setPrompt(DEFAULTS.prompt)
    setSelectedTemplate(DEFAULTS.selectedTemplate)
    setSelectedPoses(DEFAULTS.selectedPoses)
    setLayered(DEFAULTS.layered)
    setModelId(DEFAULTS.modelId)
    setResolution(DEFAULTS.resolution)
    setRatio(DEFAULTS.ratio)
    setCount(DEFAULTS.count)
    message.info('已重置所有参数')
  }

  const handleGenerate = () => {
    if (mode === '文生图' && !prompt.trim()) {
      message.warning('请输入描述后再生成')
      return
    }
    setResults(prev => [...prev, ...Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      name: `生成素材_${prev.length + i + 1}`,
      layered, ratio, resolution, model: currentModel.name,
    }))])
    message.success(`已生成 ${count} 个素材`)
  }

  const timeMenu = {
    items: ['全部时间', '今天', '本周', '本月'].map(t => ({ key: t, label: t, onClick: () => setFilterTime(t) })),
  }
  const typeMenu = {
    items: ['全部类型', '文生图', '图生图', '二次修改'].map(t => ({ key: t, label: t, onClick: () => setFilterType(t) })),
  }

  return (
    <div className="jm-workspace">
      <aside className="jm-panel">
        <div className="jm-panel-header">
          <h1 className="jm-panel-title">图片生成</h1>
          <Tooltip title="重置参数">
            <button type="button" className="jm-icon-btn" onClick={handleReset}>
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>
        <FeatureCallout feature={uiDrawComponents} />

        <div className="jm-mode-tabs">
          {modeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`jm-mode-tab ${mode === opt.value ? 'active' : ''}`}
              onClick={() => setMode(opt.value)}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="jm-panel-scroll">
          <div className="jm-model-card" onClick={cycleModel}>
            <div className="jm-model-preview" style={{ background: currentModel.preview }}>
              <IconFont type="icon-model" className="jm-model-icon" />
            </div>
            <div className="jm-model-info">
              <div className="jm-model-name">
                {currentModel.name}
                <Tooltip title={currentModel.desc}>
                  <InfoCircleOutlined className="jm-model-tip" onClick={e => e.stopPropagation()} />
                </Tooltip>
              </div>
              <div className="jm-model-desc">{currentModel.desc}</div>
            </div>
            <RightOutlined className="jm-model-arrow" />
          </div>

          {mode === '文生图' && (
            <TextArea
              rows={5}
              placeholder="请用简短的话描述您想要生成的游戏元素画面..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="jm-prompt"
              variant="borderless"
            />
          )}
          {mode === '图生图' && (
            <Upload.Dragger accept="image/*" showUploadList={false} beforeUpload={() => false} className="jm-upload">
              <p className="jm-upload-icon"><IconFont type="icon-folder" /></p>
              <p className="jm-upload-text">点击或拖拽上传参考图片</p>
            </Upload.Dragger>
          )}
          {mode === '二次修改' && (
            <>
              <Upload.Dragger accept="image/*" showUploadList={false} beforeUpload={() => false} className="jm-upload jm-upload-sm">
                <p className="jm-upload-icon"><IconFont type="icon-image" /></p>
                <p className="jm-upload-text">导入待修改素材</p>
              </Upload.Dragger>
              <TextArea rows={3} placeholder="描述修改需求..." className="jm-prompt" variant="borderless" />
            </>
          )}

          <div className="jm-options">
            <div className="jm-opt-group">
              <span className="jm-opt-label">题材模板</span>
              <Space wrap size={[6, 6]}>
                {templates.map(t => (
                  <Tag
                    key={t.id}
                    className={`jm-tag ${selectedTemplate === t.id ? 'jm-tag-active' : ''}`}
                    onClick={() => setSelectedTemplate(t.id)}
                  >
                    <IconFont type={t.icon} className="jm-tag-icon" /> {t.name}
                  </Tag>
                ))}
              </Space>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">批量姿态</span>
              <Space wrap size={[6, 6]}>
                {poseOptions.map(p => (
                  <Tag
                    key={p}
                    className={`jm-tag ${selectedPoses.includes(p) ? 'jm-tag-active' : ''}`}
                    onClick={() => togglePose(p)}
                  >
                    {p}
                  </Tag>
                ))}
              </Space>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">清晰度</span>
              <div className="jm-pills">
                {resolutionOptions.map(r => (
                  <button key={r} type="button" className={`jm-pill ${resolution === r ? 'active' : ''}`} onClick={() => setResolution(r)}>{r}</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">比例</span>
              <div className="jm-pills">
                {[...ratioRow1, ...ratioRow2].map(r => (
                  <button key={r} type="button" className={`jm-pill ${ratio === r ? 'active' : ''}`} onClick={() => setRatio(r)}>{r}</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">生成数量</span>
              <div className="jm-pills">
                {countOptions.map(c => (
                  <button key={c} type="button" className={`jm-pill ${count === c ? 'active' : ''}`} onClick={() => setCount(c)}>{c}</button>
                ))}
              </div>
            </div>

            <FeatureCallout feature={uiStateSprites} />
            <div className="jm-opt-group">
              <span className="jm-opt-label">UI 状态图（切图命名）</span>
              <div className="jm-pills">
                {UI_STATE_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`jm-pill ${uiStateMode === s ? 'active' : ''}`}
                    onClick={() => setUiStateMode(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Checkbox checked={layered} onChange={e => setLayered(e.target.checked)} className="jm-checkbox">
              分层结构化输出（自动拆分图层）
            </Checkbox>
          </div>
        </div>

        <div className="jm-panel-footer">
          <Button type="primary" size="large" block className="jm-generate-btn" onClick={handleGenerate}>
            <span className="jm-generate-text">
              <ThunderboltOutlined /> 免费创作
            </span>
            <span className="jm-generate-credit">
              <IconFont type="icon-flash" /> {credits}
            </span>
          </Button>
        </div>
      </aside>

      <main className="jm-canvas">
        <div className="jm-canvas-toolbar">
          <Dropdown menu={timeMenu} trigger={['click']}>
            <button type="button" className="jm-filter-btn">{filterTime} <DownOutlined /></button>
          </Dropdown>
          <Dropdown menu={typeMenu} trigger={['click']}>
            <button type="button" className="jm-filter-btn">{filterType} <DownOutlined /></button>
          </Dropdown>
          <button type="button" className="jm-filter-btn">
            <IconFont type="icon-task" /> 任务视图
          </button>
        </div>

        <div className="jm-canvas-body">
          {results.length === 0 ? (
            <div className="jm-welcome">
              <div className="jm-welcome-art">
                <IconFont type="icon-monitor" />
                <IconFont type="icon-sparkle" className="jm-welcome-sparkle" />
              </div>
              <p className="jm-welcome-title">欢迎来到 像素造物 PixelCraft Forge</p>
              <p className="jm-welcome-desc">开始你的第一次创作吧！</p>
            </div>
          ) : (
            <div className="jm-results-grid">
              {results.map(r => (
                <div key={r.id} className="jm-result-card">
                  <div className="jm-result-cover">
                    <IconFont type="icon-game" />
                  </div>
                  <div className="jm-result-meta">
                    <span className="jm-result-name">{r.name}</span>
                    <span className="jm-result-info">{r.ratio} · {r.resolution}</span>
                    {r.layered && <Badge status="success" text="分层" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
