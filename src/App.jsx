import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import Home from './pages/Home/Home'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import './App.css'

const ElementGenerate = lazy(() => import('./pages/ElementGenerate/ElementGenerate'))
const VideoGenerate = lazy(() => import('./pages/VideoGenerate/VideoGenerate'))
const VideoFrame = lazy(() => import('./pages/VideoFrame/VideoFrame'))
const SoundEffect = lazy(() => import('./pages/SoundEffect/SoundEffect'))
const PixelTools = lazy(() => import('./pages/PixelTools/PixelTools'))
const MapEditor = lazy(() => import('./pages/LevelEditor/LevelEditor'))
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

const WORKSPACE_ROUTES = ['/generate', '/video-generate']
const ATELIER_ROUTES = ['/video-frame', '/pixel-tools', '/library', '/layer-editor', '/map-editor', '/particle-studio', '/ui-studio']
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
            <Route path="/customize" element={<Navigate to="/generate" replace />} />
            <Route path="/video-generate" element={<VideoGenerate />} />
            <Route path="/video-frame" element={<VideoFrame />} />
            <Route path="/sound-effect" element={<SoundEffect />} />
            <Route path="/pixel-tools" element={<PixelTools />} />
            <Route path="/map-editor" element={<MapEditor />} />
            <Route path="/level-editor" element={<Navigate to="/map-editor" replace />} />
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
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <AppLayout />
        <Toaster richColors closeButton />
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App
