import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Sparkles, Video, Volume2, LayoutGrid, PlayCircle, ChevronRight,
  Blocks, Square, Palette,
} from 'lucide-react'
import PlanetAnimation from '../../components/PlanetAnimation/PlanetAnimation'
import BrandName from '../../components/Brand/BrandName'
import { brandLogo, BRAND_TAGLINE } from '../../constants/brand'
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal'
import './Home.css'

const modules = [
  { path: '/generate', icon: Sparkles, title: '图片生成', desc: '文生图 / 图生图 / 二次修改' },
  { path: '/pixel-tools', icon: Blocks, title: '像素工具箱', desc: '画笔·GIF·精灵图·像素化·抠图' },
  { path: '/layer-editor', icon: Palette, title: '图层编辑器', desc: '多图层合成、参考图与 ZIP 导出' },
  { path: '/ui-studio', icon: LayoutGrid, title: 'UI 工作室', desc: '三态 UI 切图与资源打包' },
  { path: '/video-generate', icon: PlayCircle, title: '视频生成', desc: '文生视频 / 图生视频' },
  { path: '/video-frame', icon: Video, title: 'AI 视频抽帧', desc: '关键帧抽取与精灵图集' },
  { path: '/particle-studio', icon: Zap, title: '粒子特效', desc: '粒子参数、时间轴与序列帧导出' },
  { path: '/map-editor', icon: Square, title: '地图编辑器', desc: '拖拽搭建、四向扩展、JSON 导出' },
  { path: '/library', icon: LayoutGrid, title: '素材仓库', desc: '本地分类、导入与格式转换' },
  { path: '/sound-effect', icon: Volume2, title: '音效生成', desc: '分类音效合成与导出' },
]

export default function Home() {
  const navigate = useNavigate()
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
            从图片、视频、像素工具到地图与素材仓库，请从下方入口或左侧导航进入对应功能。
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/generate')}>
              <Zap className="size-4" />
              开始图片生成
            </button>
            <button type="button" className="btn-secondary btn-secondary--glass" onClick={() => navigate('/library')}>
              <LayoutGrid className="size-4" />
              打开素材仓库
            </button>
          </div>
        </div>
        <span className="hero-scroll-hint" ref={scrollHintRef} aria-hidden="true" />
      </section>

      <div className="home-body">
        <section className="home-section">
          <ScrollReveal variant="up" className="section-header">
            <h2 className="section-heading">功能入口</h2>
            <p className="section-caption">与侧栏导航一致，点击进入实际工具页</p>
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
      </div>
    </div>
  )
}
