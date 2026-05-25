import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import Home from './pages/Home/Home'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import './App.css'

const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#a855f7',
    colorLink: '#c4b5fd',
    colorBgLayout: '#0f0f12',
    colorBgContainer: '#1c1c24',
    colorBgElevated: '#252530',
    colorBorder: 'rgba(255,255,255,0.08)',
    colorText: 'rgba(255,255,255,0.92)',
    colorTextSecondary: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
  },
}

const ElementGenerate = lazy(() => import('./pages/ElementGenerate/ElementGenerate'))
const ElementCustomize = lazy(() => import('./pages/ElementCustomize/ElementCustomize'))
const VideoGenerate = lazy(() => import('./pages/VideoGenerate/VideoGenerate'))
const VideoFrame = lazy(() => import('./pages/VideoFrame/VideoFrame'))
const SoundEffect = lazy(() => import('./pages/SoundEffect/SoundEffect'))
const PixelTools = lazy(() => import('./pages/PixelTools/PixelTools'))
const LevelEditor = lazy(() => import('./pages/LevelEditor/LevelEditor'))
const AssetLibrary = lazy(() => import('./pages/AssetLibrary/AssetLibrary'))
const LayerEditor = lazy(() => import('./pages/LayerEditor/LayerEditor'))
const ParticleStudio = lazy(() => import('./pages/ParticleStudio/ParticleStudio'))
const UiKitStudio = lazy(() => import('./pages/UiKitStudio/UiKitStudio'))

const PageLoading = () => (
  <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
    <Spinner className="size-8 text-primary" />
    <span className="text-sm">加载中...</span>
  </div>
)

const WORKSPACE_ROUTES = ['/generate', '/customize', '/video-generate']
const ATELIER_ROUTES = ['/video-frame', '/pixel-tools', '/scene', '/library', '/layer-editor', '/map-editor', '/level-editor', '/particle-studio', '/ui-studio']
const STUDIO_ROUTES = ['/video-frame', '/pixel-tools']

function AppLayout() {
  const location = useLocation()
  const { collapsed, toggle, isMobile } = useSidebar()
  const isWorkspace = WORKSPACE_ROUTES.includes(location.pathname)
  const isAtelier = ATELIER_ROUTES.includes(location.pathname)
  const isStudio = STUDIO_ROUTES.includes(location.pathname) || isAtelier
  const isHome = location.pathname === '/'

  return (
    <div
      className={`app ${isWorkspace ? 'app-workspace' : ''} ${collapsed && !isMobile ? 'app--sidebar-collapsed' : ''} ${isMobile ? 'app--mobile' : ''}`}
    >
      {isMobile && (
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={toggle}
          aria-label="打开导航"
        >
          <Menu className="size-5" />
        </button>
      )}
      <Sidebar />
      <main
        className={`main-content ${isWorkspace ? 'main-content-workspace' : ''} ${isHome ? 'main-content-home' : ''} ${isStudio ? 'main-content-studio' : ''} ${isAtelier ? 'main-content-atelier' : ''}`}
      >
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<ElementGenerate />} />
            <Route path="/video-generate" element={<VideoGenerate />} />
            <Route path="/customize" element={<ElementCustomize />} />
            <Route path="/video-frame" element={<VideoFrame />} />
            <Route path="/sound-effect" element={<SoundEffect />} />
            <Route path="/pixel-tools" element={<PixelTools />} />
            <Route path="/scene" element={<Navigate to="/level-editor" replace />} />
            <Route path="/map-editor" element={<Navigate to="/level-editor" replace />} />
            <Route path="/level-editor" element={<LevelEditor />} />
            <Route path="/library" element={<AssetLibrary />} />
            <Route path="/layer-editor" element={<LayerEditor />} />
            <Route path="/particle-studio" element={<ParticleStudio />} />
            <Route path="/ui-studio" element={<UiKitStudio />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function App() {
  return (
    <ConfigProvider theme={antTheme} locale={zhCN}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider>
          <AppLayout />
          <Toaster richColors closeButton />
        </SidebarProvider>
      </TooltipProvider>
    </ConfigProvider>
  )
}

export default App
