import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Upload, Card, Row, Col, message, Space, Input, Tag } from 'antd'
import {
  UploadOutlined, ThunderboltOutlined, DownloadOutlined, FolderAddOutlined, ExportOutlined,
  HighlightOutlined, EditOutlined, VideoCameraOutlined, SoundOutlined, PictureOutlined, AppstoreOutlined,
  RocketOutlined, BgColorsOutlined, FileImageOutlined, ApiOutlined, PlayCircleOutlined,
  RightOutlined, BlockOutlined,
} from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
import PlanetAnimation from '../../components/PlanetAnimation/PlanetAnimation'
import BrandName from '../../components/Brand/BrandName'
import { brandLogo, BRAND_TAGLINE } from '../../constants/brand'
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal'
import FeatureCatalog from '../../components/FeatureHub/FeatureCatalog.jsx'
import assistRefTrace from '../../constants/features/assist-ref-trace.js'
import { addAssetFromFile } from '../../lib/assets/localAssetStore.js'
import { zipBlobs } from '../../lib/assets/imageExport.js'
import { createPlaceholderPngBlob, placeholderBlobToDataUrl } from '../../lib/assets/placeholderAsset.js'
import './Home.css'

const { TextArea } = Input

const styleOptions = ['像素风', '国风二次元', 'Q版卡通', '复古街机', '暗黑写实', '赛博朋克']
const sizeOptions = ['32px', '64px', '128px', '256px', '512px']
const categoryOptions = ['角色类', '道具物品类', '场景环境类', 'UI交互类', '特效动作类', '地图瓦片类']

const stats = [
  { title: '支持素材类型', value: 6, suffix: '类', icon: <FileImageOutlined /> },
  { title: '内置画风', value: 12, suffix: '种', icon: <BgColorsOutlined /> },
  { title: '可导出格式', value: 8, suffix: '种', icon: <ApiOutlined /> },
  { title: '一站式模块', value: 7, suffix: '大', icon: <RocketOutlined /> },
  { title: '子功能点', value: 28, suffix: '项', icon: <ApiOutlined /> },
]

const modules = [
  { path: '/generate', icon: <HighlightOutlined />, title: '元素智能生成', desc: '文生图 / 图生图 / 二次修改' },
  { path: '/video-generate', icon: <PlayCircleOutlined />, title: '游戏视频生成', desc: '文生视频 / 图生视频 / 视频延长' },
  { path: '/customize', icon: <EditOutlined />, title: '元素自定义改造', desc: '文字指令修改 6 大属性' },
  { path: '/video-frame', icon: <VideoCameraOutlined />, title: 'AI 视频抽帧', desc: '关键帧抽取与精灵图集' },
  { path: '/pixel-tools', icon: <BlockOutlined />, title: '像素工具箱', desc: 'GIF·精灵图·像素化·效率工具' },
  { path: '/sound-effect', icon: <SoundOutlined />, title: '专属音效生成', desc: '4 大分类音效库' },
  { path: '/scene', icon: <PictureOutlined />, title: '场景可视化搭建', desc: '文字描述自动排布场景' },
  { path: '/library', icon: <AppstoreOutlined />, title: '素材仓库', desc: '功能 + 材质双重分类' },
]

export default function Home() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedSize, setSelectedSize] = useState('128px')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [generatedAssets, setGeneratedAssets] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const heroRef = useRef(null)
  const cosmosRef = useRef(null)
  const heroContentRef = useRef(null)
  const scrollHintRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const onScroll = () => {
      const hero = heroRef.current
      if (!hero) return

      const scrollY = window.scrollY
      const heroH = hero.offsetHeight || window.innerHeight
      const progress = Math.min(scrollY / heroH, 1)

      if (cosmosRef.current) {
        cosmosRef.current.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0) scale(${1 + progress * 0.04})`
        cosmosRef.current.style.opacity = String(1 - progress * 0.35)
      }

      if (heroContentRef.current) {
        heroContentRef.current.style.transform = `translate3d(0, ${scrollY * 0.32}px, 0)`
        heroContentRef.current.style.opacity = String(Math.max(0, 1 - progress * 1.15))
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.classList.toggle('hero-scroll-hint--hidden', scrollY > 48)
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleImageUpload = (info) => {
    const file = info.file.originFileObj || info.file
    if (file) {
      setUploadedImage(URL.createObjectURL(file))
      setAnalysisResult({
        type: '角色类 - 战士',
        style: '像素风',
        material: '金属铠甲 + 布料',
        suggestion: '建议优化轮廓线条，增强金属质感高光',
      })
      message.success('参考图上传成功，AI 正在解析...')
    }
  }

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) {
      message.warning('请输入描述或上传参考图')
      return
    }
    setIsGenerating(true)
    try {
      const base = generatedAssets.length
      const style = selectedStyle || '像素风'
      const sizePx = parseInt(selectedSize, 10) || 128
      const next = await Promise.all(
        Array.from({ length: 4 }, async (_, i) => {
          const name = `素材_${base + i + 1}`
          const blob = await createPlaceholderPngBlob({ name, style, sizePx, seed: base + i })
          const previewUrl = await placeholderBlobToDataUrl(blob)
          return { id: Date.now() + i, name, style, size: selectedSize, previewUrl, blob }
        }),
      )
      setGeneratedAssets((prev) => [...prev, ...next])
      message.success('素材生成完成（本地占位预览，可入库或下载）')
    } catch {
      message.error('生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBatchDownload = async () => {
    if (!generatedAssets.length) return
    try {
      const entries = await Promise.all(
        generatedAssets.map(async (a) => ({
          name: `${a.name}.png`,
          blob: a.blob ?? (await (await fetch(a.previewUrl)).blob()),
        })),
      )
      await zipBlobs(entries, 'generated-assets.zip')
      message.success('已开始下载 ZIP')
    } catch {
      message.error('打包下载失败')
    }
  }

  const handleSaveToLibrary = async () => {
    if (!generatedAssets.length) return
    try {
      for (const a of generatedAssets) {
        const blob = a.blob ?? (await (await fetch(a.previewUrl)).blob())
        const file = new File([blob], `${a.name}.png`, { type: 'image/png' })
        await addAssetFromFile(file, {
          name: a.name,
          style: a.style,
          funcType: '道具物品类',
          folder: '工作台生成',
        })
      }
      message.success(`已入库 ${generatedAssets.length} 个素材`)
    } catch {
      message.error('入库失败')
    }
  }

  return (
    <div className="home-page">
      <section className="hero-section" ref={heroRef}>
        <div className="hero-cosmos hero-layer--parallax" ref={cosmosRef}>
          <PlanetAnimation />
          <div className="hero-cosmos-overlay" />
        </div>
        <div className="hero-content hero-content--overlay hero-layer--parallax" ref={heroContentRef}>
          <div className="hero-brand">
            <img src={brandLogo} alt="" className="hero-brand-logo" draggable={false} />
            <h1 className="hero-brand-title">
              <BrandName layout="stack" className="hero-brand-name" />
            </h1>
          </div>
          <span className="hero-tag">{BRAND_TAGLINE}</span>
          <p className="hero-product-line hero-desc--light">AI 智能 2D 游戏元素生成系统</p>
          <p className="hero-desc hero-desc--light">
            一键生成全套 2D 游戏美术素材，分层可编辑，直接对接游戏引擎。{assistRefTrace.summary}
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/generate')}>
              <ThunderboltOutlined />
              立即开始创作
            </button>
            <button type="button" className="btn-secondary btn-secondary--glass" onClick={() => navigate('/library')}>
              <AppstoreOutlined />
              浏览素材仓库
            </button>
          </div>
        </div>
        <span className="hero-scroll-hint" ref={scrollHintRef} aria-hidden="true" />
      </section>

      <div className="home-body">
      <ScrollReveal as="section" className="home-section" variant="up">
        <Row gutter={[14, 14]} className="stats-row">
          {stats.map((s, i) => (
            <Col xs={12} sm={6} key={s.title}>
              <ScrollReveal variant="up" delay={i * 90} className="stat-card-reveal">
              <div className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <p className="stat-label">{s.title}</p>
                <p className="stat-value">
                  <span className="stat-num">{s.value}</span>
                  <span className="stat-suffix">{s.suffix}</span>
                </p>
              </div>
              </ScrollReveal>
            </Col>
          ))}
        </Row>
      </ScrollReveal>

      <section className="home-section">
        <ScrollReveal variant="up" className="section-header">
          <h2 className="section-heading">功能全景（七大模块 · 28 项能力）</h2>
          <p className="section-caption">图片处理 · 动画 · 场景地图 · UI · 特效 · 资源管理 · 辅助工具</p>
        </ScrollReveal>
        <FeatureCatalog />
      </section>

      <section className="home-section">
        <ScrollReveal variant="up" className="section-header">
          <h2 className="section-heading">快捷入口</h2>
          <p className="section-caption">覆盖素材生成 → 入库管理全流程</p>
        </ScrollReveal>
        <Row gutter={[14, 14]} className="modules-row">
          {modules.map((m, i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={m.path}>
              <ScrollReveal variant="up" delay={(i % 4) * 80}>
              <article className="module-card" onClick={() => navigate(m.path)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(m.path)}>
                <div className="module-icon">{m.icon}</div>
                <h3 className="module-title">{m.title}</h3>
                <p className="module-desc">{m.desc}</p>
                <span className="module-link">
                  立即使用 <RightOutlined />
                </span>
              </article>
              </ScrollReveal>
            </Col>
          ))}
        </Row>
      </section>

      <section className="home-section">
        <ScrollReveal variant="up" className="section-header">
          <h2 className="section-heading">
            <IconFont type="icon-sparkle" className="section-heading-icon" />
            创作工作台
          </h2>
          <p className="section-caption">输入描述或上传参考图，AI 智能生成素材</p>
        </ScrollReveal>

        <Row gutter={24}>
          <Col flex="1">
            <ScrollReveal variant="up" delay={120}>
            <Card bordered={false} className="surface-card work-card">
              <TextArea
                rows={4}
                placeholder="描述游戏元素，如：像素风骑士，手持火焰剑，站立姿态..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="work-textarea"
              />
              <Upload accept="image/*" showUploadList={false} beforeUpload={() => false} onChange={handleImageUpload}>
                <Button icon={<UploadOutlined />} className="btn-ghost">{uploadedImage ? '更换参考图' : '上传参考图'}</Button>
              </Upload>
              {uploadedImage && <img src={uploadedImage} alt="参考" className="preview-img" />}
              <div className="options-section">
                <div className="option-row">
                  <span className="option-label">画风</span>
                  <Space wrap size={[6, 6]}>
                    {styleOptions.map(s => (
                      <Tag key={s} className={`jm-tag ${selectedStyle === s ? 'jm-tag--active' : ''}`} onClick={() => setSelectedStyle(s)}>{s}</Tag>
                    ))}
                  </Space>
                </div>
                <div className="option-row">
                  <span className="option-label">尺寸</span>
                  <Space wrap size={[6, 6]}>
                    {sizeOptions.map(s => (
                      <Tag key={s} className={`jm-tag ${selectedSize === s ? 'jm-tag--active' : ''}`} onClick={() => setSelectedSize(s)}>{s}</Tag>
                    ))}
                  </Space>
                </div>
                <div className="option-row">
                  <span className="option-label">类型</span>
                  <Space wrap size={[6, 6]}>
                    {categoryOptions.map(c => <Tag key={c} className="jm-tag jm-tag--active">{c}</Tag>)}
                  </Space>
                </div>
              </div>
              <button type="button" className="btn-primary btn-primary--block" disabled={isGenerating} onClick={handleGenerate}>
                <ThunderboltOutlined />
                {isGenerating ? '生成中...' : '智能生成素材'}
              </button>
            </Card>
            </ScrollReveal>
          </Col>

          {analysisResult && (
            <Col flex="280px">
              <ScrollReveal variant="right" delay={200}>
              <Card
                title={<span><IconFont type="icon-search" className="card-title-icon" /> AI 智能解析</span>}
                bordered={false}
                className="surface-card analysis-card"
              >
                <p><strong>元素类型：</strong>{analysisResult.type}</p>
                <p><strong>画风识别：</strong>{analysisResult.style}</p>
                <p><strong>材质构成：</strong>{analysisResult.material}</p>
                <p><strong>优化建议：</strong>{analysisResult.suggestion}</p>
              </Card>
              </ScrollReveal>
            </Col>
          )}
        </Row>

        {generatedAssets.length > 0 && (
          <ScrollReveal variant="up" delay={80}>
          <Card
            title={<span><IconFont type="icon-result" className="card-title-icon" /> 生成结果</span>}
            bordered={false}
            className="surface-card results-card"
            extra={
              <Space>
                <Button icon={<DownloadOutlined />} size="small" className="btn-ghost" onClick={handleBatchDownload}>批量下载</Button>
                <Button icon={<FolderAddOutlined />} size="small" className="btn-ghost" onClick={handleSaveToLibrary}>一键入库</Button>
                <Button icon={<ExportOutlined />} size="small" className="btn-ghost" onClick={() => navigate('/library')}>打开仓库</Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {generatedAssets.map(asset => (
                <Col key={asset.id} xs={12} sm={8} md={6} lg={4}>
                  <Card
                    hoverable
                    size="small"
                    className="result-item-card"
                    cover={
                      asset.previewUrl
                        ? <img src={asset.previewUrl} alt={asset.name} className="asset-preview-img" />
                        : <div className="asset-preview"><IconFont type="icon-game" /></div>
                    }
                  >
                    <Card.Meta title={asset.name} description={`${asset.style} · ${asset.size}`} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
          </ScrollReveal>
        )}
      </section>
      </div>
    </div>
  )
}
