import { useCallback, useRef, useState } from 'react'
import {
  BlockOutlined, BgColorsOutlined, ClearOutlined, FileGifOutlined,
  MoonOutlined, QuestionCircleOutlined, ScissorOutlined, AppstoreOutlined,
  ThunderboltOutlined, ToolOutlined, VideoCameraOutlined, FormatPainterOutlined,
} from '@ant-design/icons'
import { Collapse, Tabs, Tooltip, Button, message } from 'antd'
import GifFrameTool from './GifFrameTool.jsx'
import SpriteSheetTool from './SpriteSheetTool.jsx'
import GeminiWatermark from './GeminiWatermark.jsx'
import ImageChromaMatte from './ImageChromaMatte.jsx'
import ImagePixelateTool from './ImagePixelateTool.jsx'
import EfficiencyHub from '../../fr-port/components/EfficiencyHub.jsx'
import SheetProTool from '../../fr-port/components/SheetProTool.jsx'
import './PixelTools.css'

const TIP_ITEMS = [
  {
    Icon: FileGifOutlined,
    title: 'GIF 转序列帧',
    desc: '适合从动画提取逐帧素材，用于精灵图或逐帧动画制作',
  },
  {
    Icon: AppstoreOutlined,
    title: '精灵图工具',
    desc: '可快速拆分与合并图集，支持自动排版与间隙调整',
  },
  {
    Icon: ScissorOutlined,
    title: '色度键抠图',
    desc: '对纯色背景（如绿幕、蓝幕）的素材效果最佳',
  },
]

const TOOL_CARDS = [
  {
    key: 'gif',
    Icon: FileGifOutlined,
    label: 'GIF',
    title: 'GIF 拆帧 / 序列帧转 GIF',
    desc: 'GIF 与 PNG 序列互转，支持帧间隔与范围裁剪',
  },
  {
    key: 'sheet',
    Icon: AppstoreOutlined,
    label: '精灵图',
    title: '精灵图拆分 / 合并',
    desc: '按行列或透明间隙拆分，多帧合成图集',
  },
  {
    key: 'matte',
    Icon: BgColorsOutlined,
    label: '抠图',
    title: '色度键抠图',
    desc: '纯色背景一键去除，导出透明 PNG',
  },
  {
    key: 'pixelate',
    Icon: FormatPainterOutlined,
    label: '像素化',
    title: 'OpenCV 像素化处理',
    desc: '将图片转为像素风格，可调块大小',
  },
  {
    key: 'watermark',
    Icon: ClearOutlined,
    label: '去水印',
    title: 'Gemini AI 去水印',
    desc: '智能识别并去除图片水印区域',
  },
]

const PROCESS_NOTES = [
  '所有处理均在浏览器本地完成，文件不会上传至服务器',
  '大文件建议分批处理，避免页面卡顿',
  '导出的 ZIP 文件包含所有 PNG 帧，可直接导入游戏引擎使用',
]

const QUICK_TEMPLATES = [
  { label: '游戏精灵图', frameStep: 1, bgMode: 'transparent', optionsOpen: true },
  { label: '动效帧素材', frameStep: 2, bgMode: 'transparent', optionsOpen: true },
  { label: '透明抠图', frameStep: 1, bgMode: 'transparent', optionsOpen: true },
]

const USE_CASES = [
  {
    Icon: VideoCameraOutlined,
    title: '游戏开发',
    desc: '精灵图拆分、序列帧素材处理，直接用于 Unity / Godot 等引擎',
  },
  {
    Icon: FileGifOutlined,
    title: '动效制作',
    desc: 'GIF 拆帧、逐帧动画导出，快速获取动画序列',
  },
  {
    Icon: FormatPainterOutlined,
    title: '设计素材',
    desc: '抠图、去水印、像素化处理，一站式本地完成',
  },
]

const FAQ_ITEMS = [
  {
    key: '1',
    label: '上传的文件会被保存吗？',
    children: <p>不会。所有文件仅在当前浏览器内存中处理，关闭页面后自动释放，不会上传至任何服务器。</p>,
  },
  {
    key: '2',
    label: '处理后的文件在哪里？',
    children: <p>点击导出按钮后，浏览器会自动下载 ZIP 或 PNG 文件到您的默认下载目录。</p>,
  },
  {
    key: '3',
    label: '大文件处理卡顿怎么办？',
    children: <p>建议先用「每 2 帧」或「每 5 帧」间隔减少输出量，或缩小 GIF 尺寸后再处理。处理期间请勿切换标签页。</p>,
  },
]

function statusTone(status) {
  if (status?.loading) return 'active'
  if (status?.gifFile) return 'success'
  return 'idle'
}

export default function PixelTools() {
  const [activeTab, setActiveTab] = useState('gif')
  const [gifStatus, setGifStatus] = useState(null)
  const templateRef = useRef(null)

  const handleRegisterTemplate = useCallback((fn) => {
    templateRef.current = fn
  }, [])

  const handleApplyTemplate = (preset) => {
    if (activeTab !== 'gif') {
      setActiveTab('gif')
      message.info('已切换到 GIF 工具')
    }
    setTimeout(() => templateRef.current?.(preset), 100)
  }

  const TAB_ITEMS = [
    {
      key: 'gif',
      label: 'GIF ↔ 序列帧',
      children: (
        <GifFrameTool
          onStatusChange={setGifStatus}
          onRegisterTemplate={handleRegisterTemplate}
        />
      ),
    },
    { key: 'sheet', label: '精灵图工具', children: <SpriteSheetTool /> },
    { key: 'efficiency', label: '效率工具', children: <EfficiencyHub /> },
    { key: 'sheetPro', label: '精灵表 Pro', children: <SheetProTool /> },
    { key: 'pixelate', label: '图片像素化', children: <ImagePixelateTool /> },
    { key: 'watermark', label: 'Gemini 去水印', children: <GeminiWatermark /> },
    { key: 'matte', label: '色度键抠图', children: <ImageChromaMatte /> },
  ]

  const gifStatLabel = gifStatus?.gifInfo
    ? `${gifStatus.gifInfo.frameCount} 帧 · ${gifStatus.gifInfo.width}×${gifStatus.gifInfo.height}`
    : '等待上传'

  return (
    <div className="vf-page vf-page--centered atelier-page-wrap pt-page">
      <div className="vf-page-bg pt-page-bg" aria-hidden="true" />
      <div className="vf-page-grid" aria-hidden="true" />

      <div className="atelier-page atelier-page--wide pt-page-inner">
        <header className="atelier-hero atelier-enter pt-hero">
          <div className="pt-hero-top">
            <div className="atelier-title-row">
              <BlockOutlined />
              <h1 className="atelier-title">像素工具箱</h1>
            </div>
            <div className="pt-hero-actions">
              <Tooltip title="当前为深色主题">
                <Button type="text" icon={<MoonOutlined />} aria-label="主题" />
              </Tooltip>
              <Tooltip title="查看使用说明与常见问题">
                <Button
                  type="text"
                  icon={<QuestionCircleOutlined />}
                  aria-label="帮助"
                  onClick={() => document.getElementById('pt-faq')?.scrollIntoView({ behavior: 'smooth' })}
                />
              </Tooltip>
            </div>
          </div>
          <p className="atelier-subtitle pt-slogan">
            浏览器端一站式像素素材处理工具，所有操作本地完成，安全高效
          </p>
        </header>

        <div className="pt-studio-row atelier-enter atelier-enter--1">
          <div className="pt-studio-main">
            <div className="pt-studio-card atelier-enter atelier-enter--2">
              <Tabs
                className="pixel-tools-tabs"
                size="large"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={TAB_ITEMS}
              />
            </div>
          </div>

          <aside className="pt-side-widgets">
            <section className="pt-widget">
              <header className="pt-widget-head">
                <h3 className="pt-widget-title">使用建议</h3>
              </header>
              <ul className="pt-widget-list">
                {TIP_ITEMS.map(({ Icon, title, desc }) => (
                  <li key={title} className="pt-widget-list-item">
                    <span className="pt-widget-thumb" aria-hidden="true"><Icon /></span>
                    <div className="pt-widget-body">
                      <strong>{title}</strong>
                      <p>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="pt-widget">
              <header className="pt-widget-head">
                <h3 className="pt-widget-title">工具概览</h3>
              </header>
              <div className="pt-tool-card-grid">
                {TOOL_CARDS.map(({ key, Icon, label, title, desc }) => (
                  <Tooltip key={key} title={<span><strong>{title}</strong><br />{desc}</span>} placement="left">
                    <button
                      type="button"
                      className="pt-tool-card"
                      onClick={() => {
                        const map = { gif: 'gif', sheet: 'sheet', matte: 'matte', pixelate: 'pixelate', watermark: 'watermark' }
                        if (map[key]) setActiveTab(map[key])
                      }}
                    >
                      <Icon className="pt-tool-card-icon" />
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </section>

            {activeTab === 'gif' && (
              <section className="pt-widget">
                <header className="pt-widget-head">
                  <h3 className="pt-widget-title">处理状态</h3>
                </header>
                <ul className="pt-widget-status-list">
                  <li>
                    <span>GIF 文件</span>
                    <span className={`pt-pill pt-pill--${statusTone(gifStatus)}`}>
                      {gifStatus?.gifFile ? '已上传' : '未上传'}
                    </span>
                  </li>
                  <li>
                    <span>帧信息</span>
                    <span className={`pt-pill pt-pill--${gifStatus?.gifInfo ? 'success' : 'idle'}`}>
                      {gifStatLabel}
                    </span>
                  </li>
                  <li>
                    <span>处理</span>
                    <span className={`pt-pill pt-pill--${gifStatus?.loading ? 'active' : 'idle'}`}>
                      {gifStatus?.loading ? '处理中' : '待处理'}
                    </span>
                  </li>
                </ul>
              </section>
            )}

            <section className="pt-widget">
              <header className="pt-widget-head">
                <h3 className="pt-widget-title"><ThunderboltOutlined /> 处理说明</h3>
              </header>
              <ul className="pt-widget-notes">
                {PROCESS_NOTES.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>

            <section className="pt-widget pt-widget--templates">
              <header className="pt-widget-head">
                <h3 className="pt-widget-title"><ToolOutlined /> 快速模板</h3>
              </header>
              <div className="pt-template-row">
                {QUICK_TEMPLATES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="pt-template-chip"
                    onClick={() => handleApplyTemplate(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="pt-bottom atelier-enter atelier-enter--3">
          <h2 className="pt-bottom-title">工具使用场景</h2>
          <div className="pt-use-case-grid">
            {USE_CASES.map(({ Icon, title, desc }) => (
              <article key={title} className="pt-use-case-card">
                <span className="pt-use-case-icon" aria-hidden="true"><Icon /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div id="pt-faq" className="pt-faq">
            <h2 className="pt-bottom-title">常见问题</h2>
            <Collapse ghost className="pt-faq-collapse" items={FAQ_ITEMS} />
          </div>
        </section>
      </div>
    </div>
  )
}
