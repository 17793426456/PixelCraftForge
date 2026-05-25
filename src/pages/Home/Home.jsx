import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, Zap, Download, FolderPlus, ExternalLink, Sparkles, Pencil, Video, Volume2,
  LayoutGrid, Rocket, Palette, Image, Plug, PlayCircle, ChevronRight, Blocks, Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { message } from '@/lib/ui/notify'
import FileDropzone from '@/components/app/FileDropzone'
import Stack from '@/components/app/Stack'
import IconFont from '../../components/IconFont/IconFont'
import PlanetAnimation from '../../components/PlanetAnimation/PlanetAnimation'
import BrandName from '../../components/Brand/BrandName'
import { brandLogo, BRAND_TAGLINE } from '../../constants/brand'
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal'
import FeatureCatalog from '../../components/FeatureHub/FeatureCatalog.jsx'
import assistRefTrace from '../../constants/features/assist-ref-trace.js'
import { addAssetFromFile } from '../../lib/assets/localAssetStore.js'
import { zipBlobs } from '../../lib/assets/imageExport.js'
import { ApiError } from '../../lib/api/client.js'
import { funcTypeToAssetCategory } from '../../lib/api/assetCategory.js'
import { generateImageToImage, generateTextToImage } from '../../lib/api/elementApi.js'
import { ensureResultBlob, resolveMediaUrl, urlToBlob } from '../../lib/api/mediaUrl.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import './Home.css'

const styleOptions = ['像素风', '国风二次元', 'Q版卡通', '复古街机', '暗黑写实', '赛博朋克']
const sizeOptions = ['32px', '64px', '128px', '256px', '512px']
const categoryOptions = ['角色类', '道具物品类', '场景环境类', 'UI交互类', '特效动作类', '地图瓦片类']

const stats = [
  { title: '支持素材类型', value: 6, suffix: '类', icon: Image },
  { title: '内置画风', value: 12, suffix: '种', icon: Palette },
  { title: '可导出格式', value: 8, suffix: '种', icon: Plug },
  { title: '一站式模块', value: 7, suffix: '大', icon: Rocket },
  { title: '子功能点', value: 28, suffix: '项', icon: Plug },
]

const modules = [
  { path: '/generate', icon: Sparkles, title: '元素智能生成', desc: '文生图 / 图生图 / 二次修改' },
  { path: '/video-generate', icon: PlayCircle, title: '游戏视频生成', desc: '文生视频 / 图生视频 / 视频延长' },
  { path: '/customize', icon: Pencil, title: '元素自定义改造', desc: '文字指令修改 6 大属性' },
  { path: '/video-frame', icon: Video, title: 'AI 视频抽帧', desc: '关键帧抽取与精灵图集' },
  { path: '/pixel-tools', icon: Blocks, title: '像素工具箱', desc: '画笔·GIF·精灵图·像素化' },
  { path: '/sound-effect', icon: Volume2, title: '专属音效生成', desc: '4 大分类音效库' },
  { path: '/level-editor', icon: Square, title: '2D 关卡编辑器', desc: '文字描述 + 拖拽编辑，导出 JSON' },
  { path: '/library', icon: LayoutGrid, title: '素材仓库', desc: '功能 + 材质双重分类' },
]

export default function Home() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedSize, setSelectedSize] = useState('128px')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImageFile, setUploadedImageFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [generatedAssets, setGeneratedAssets] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('道具物品类')
  const [isGenerating, setIsGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
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

  const handleImageUpload = (files) => {
    const file = files?.[0]
    if (file) {
      setUploadedImage(URL.createObjectURL(file))
      setUploadedImageFile(file)
      setAnalysisResult({
        type: `${selectedCategory} - 参考图`,
        style: selectedStyle || '像素风',
        material: '已上传参考图',
        suggestion: '可输入描述进行图生图，或仅输入文字进行文生图',
      })
      message.success('参考图上传成功')
    }
  }

  const handleGenerate = async () => {
    if (!prompt && !uploadedImageFile) {
      message.warning('请输入描述或上传参考图')
      return
    }
    setIsGenerating(true)
    setGenProgress(10)
    try {
      const base = generatedAssets.length
      const style = selectedStyle || '像素风'
      const sizePx = parseInt(selectedSize, 10) || 128
      const category = funcTypeToAssetCategory(selectedCategory)
      const genPrompt = prompt.trim() || `${selectedCategory}游戏素材，${style}风格`

      const next = []
      for (let i = 0; i < 4; i += 1) {
        const name = `素材_${base + i + 1}`
        let apiRes
        if (uploadedImageFile) {
          apiRes = await generateImageToImage({
            image: uploadedImageFile,
            prompt: genPrompt,
            width: sizePx,
            height: sizePx,
            style,
            category,
          })
        } else {
          apiRes = await generateTextToImage({
            prompt: genPrompt,
            width: sizePx,
            height: sizePx,
            style,
            category,
          })
        }
        const previewUrl = resolveMediaUrl(apiRes.url)
        const blob = await urlToBlob(apiRes.url)
        setGenProgress(Math.min(95, 15 + Math.round(((i + 1) / 4) * 80)))
        next.push({
          id: Date.now() + i,
          name,
          style,
          size: selectedSize,
          previewUrl,
          blob,
          category: selectedCategory,
          cached: apiRes.cached,
        })
      }
      setGeneratedAssets((prev) => [...prev, ...next])
      message.success('素材生成完成')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '生成失败，请确认后端已启动'
      message.error(msg)
    } finally {
      setIsGenerating(false)
      setGenProgress(0)
    }
  }

  const handleBatchDownload = async () => {
    if (!generatedAssets.length) return
    try {
      const entries = await Promise.all(
        generatedAssets.map(async (a) => ({
          name: `${a.name}.png`,
          blob: await ensureResultBlob({ blob: a.blob, previewUrl: a.previewUrl, url: a.previewUrl }),
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
      let saved = 0
      for (const a of generatedAssets) {
        const blob = await ensureResultBlob({ blob: a.blob, previewUrl: a.previewUrl, url: a.previewUrl })
        const file = new File([blob], `${a.name}.png`, { type: 'image/png' })
        await addAssetFromFile(file, {
          name: a.name,
          style: a.style,
          funcType: selectedCategory,
          folder: '工作台生成',
        })
        saved += 1
      }
      message.success(`已入库 ${saved} 个素材`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '入库失败')
    }
  }

  const handleDownloadOne = async (a) => {
    try {
      const blob = await ensureResultBlob({ blob: a.blob, previewUrl: a.previewUrl, url: a.previewUrl })
      triggerDownload(blob, `${a.name}.png`)
    } catch {
      message.error('下载失败')
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
              <Zap className="size-4" />
              立即开始创作
            </button>
            <button type="button" className="btn-secondary btn-secondary--glass" onClick={() => navigate('/library')}>
              <LayoutGrid className="size-4" />
              浏览素材仓库
            </button>
          </div>
        </div>
        <span className="hero-scroll-hint" ref={scrollHintRef} aria-hidden="true" />
      </section>

      <div className="home-body">
      <ScrollReveal as="section" className="home-section" variant="up">
        <div className="stats-row grid grid-cols-2 sm:grid-cols-4 gap-[14px]">
          {stats.map((s, i) => {
            const StatIcon = s.icon
            return (
              <ScrollReveal key={s.title} variant="up" delay={i * 90} className="stat-card-reveal">
                <div className="stat-card">
                  <div className="stat-icon"><StatIcon className="size-5" /></div>
                  <p className="stat-label">{s.title}</p>
                  <p className="stat-value">
                    <span className="stat-num">{s.value}</span>
                    <span className="stat-suffix">{s.suffix}</span>
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
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
        <div className="modules-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[14px]">
          {modules.map((m, i) => {
            const ModIcon = m.icon
            return (
              <ScrollReveal key={m.path} variant="up" delay={(i % 4) * 80}>
                <article
                  className="module-card"
                  onClick={() => navigate(m.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(m.path)}
                >
                  <div className="module-icon"><ModIcon className="size-6" /></div>
                  <h3 className="module-title">{m.title}</h3>
                  <p className="module-desc">{m.desc}</p>
                  <span className="module-link">
                    立即使用 <ChevronRight className="size-3.5 inline" />
                  </span>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      <section className="home-section">
        <ScrollReveal variant="up" className="section-header">
          <h2 className="section-heading">
            <IconFont type="icon-sparkle" className="section-heading-icon" />
            创作工作台
          </h2>
          <p className="section-caption">输入描述或上传参考图，AI 智能生成素材</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <ScrollReveal variant="up" delay={120}>
            <Card className="surface-card work-card border-0 shadow-none py-0">
              <CardContent className="px-0 pt-0">
                <Textarea
                  rows={4}
                  placeholder="描述游戏元素，如：像素风骑士，手持火焰剑，站立姿态..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="work-textarea"
                />
                <FileDropzone
                  accept="image/*"
                  maxCount={1}
                  className="mt-3"
                  title={uploadedImage ? '点击更换参考图' : '上传参考图'}
                  onFiles={handleImageUpload}
                />
                {uploadedImage && <img src={uploadedImage} alt="参考" className="preview-img" />}
                <div className="options-section">
                  <div className="option-row">
                    <span className="option-label">画风</span>
                    <Stack wrap size="small">
                      {styleOptions.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className={`jm-tag cursor-pointer ${selectedStyle === s ? 'jm-tag--active' : ''}`}
                          onClick={() => setSelectedStyle(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </Stack>
                  </div>
                  <div className="option-row">
                    <span className="option-label">尺寸</span>
                    <Stack wrap size="small">
                      {sizeOptions.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className={`jm-tag cursor-pointer ${selectedSize === s ? 'jm-tag--active' : ''}`}
                          onClick={() => setSelectedSize(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </Stack>
                  </div>
                  <div className="option-row">
                    <span className="option-label">类型</span>
                    <Stack wrap size="small">
                      {categoryOptions.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className={`jm-tag cursor-pointer ${selectedCategory === c ? 'jm-tag--active' : ''}`}
                          onClick={() => setSelectedCategory(c)}
                        >
                          {c}
                        </Badge>
                      ))}
                    </Stack>
                  </div>
                </div>
                {isGenerating && (
                  <div className="mb-3 space-y-1">
                    <Progress value={genProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">正在生成 {genProgress}%…</p>
                  </div>
                )}
                <button type="button" className="btn-primary btn-primary--block" disabled={isGenerating} onClick={handleGenerate}>
                  <Zap className="size-4" />
                  {isGenerating ? '生成中...' : '智能生成素材'}
                </button>
              </CardContent>
            </Card>
          </ScrollReveal>

          {analysisResult && (
            <ScrollReveal variant="right" delay={200}>
              <Card className="surface-card analysis-card border-0 shadow-none">
                <CardHeader>
                  <CardTitle>
                    <IconFont type="icon-search" className="card-title-icon" /> AI 智能解析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>元素类型：</strong>{analysisResult.type}</p>
                  <p><strong>画风识别：</strong>{analysisResult.style}</p>
                  <p><strong>材质构成：</strong>{analysisResult.material}</p>
                  <p><strong>优化建议：</strong>{analysisResult.suggestion}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          )}
        </div>

        {generatedAssets.length > 0 && (
          <ScrollReveal variant="up" delay={80}>
            <Card className="surface-card results-card border-0 shadow-none mt-6">
              <CardHeader>
                <CardTitle>
                  <IconFont type="icon-result" className="card-title-icon" /> 生成结果
                </CardTitle>
                <CardAction>
                  <Stack size="small">
                    <Button variant="ghost" size="sm" onClick={handleBatchDownload}>
                      <Download className="size-4" /> 批量下载
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSaveToLibrary}>
                      <FolderPlus className="size-4" /> 一键入库
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
                      <ExternalLink className="size-4" /> 打开仓库
                    </Button>
                  </Stack>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {generatedAssets.map((asset) => (
                    <Card key={asset.id} className="result-item-card overflow-hidden py-0 gap-0">
                      {asset.previewUrl ? (
                        <img src={asset.previewUrl} alt={asset.name} className="asset-preview-img w-full" />
                      ) : (
                        <div className="asset-preview"><IconFont type="icon-game" /></div>
                      )}
                      <CardContent className="p-3 space-y-2">
                        <p className="font-medium text-sm">{asset.name}</p>
                        <CardDescription>{`${asset.style} · ${asset.size}`}</CardDescription>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => { void handleDownloadOne(asset) }}>
                          <Download className="size-3.5" /> 下载
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}
      </section>
      </div>
    </div>
  )
}
