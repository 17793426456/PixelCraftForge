import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ConfigProvider, Spin, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Sidebar from './components/Sidebar/Sidebar'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import Home from './pages/Home/Home'
import './App.css'

const ElementGenerate = lazy(() => import('./pages/ElementGenerate/ElementGenerate'))
const ElementCustomize = lazy(() => import('./pages/ElementCustomize/ElementCustomize'))
const VideoGenerate = lazy(() => import('./pages/VideoGenerate/VideoGenerate'))
const VideoFrame = lazy(() => import('./pages/VideoFrame/VideoFrame'))
const SoundEffect = lazy(() => import('./pages/SoundEffect/SoundEffect'))
const PixelTools = lazy(() => import('./pages/PixelTools/PixelTools'))
const SceneVisualize = lazy(() => import('./pages/SceneVisualize/SceneVisualize'))
const AssetLibrary = lazy(() => import('./pages/AssetLibrary/AssetLibrary'))

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
    borderRadiusLG: 14,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 36,
      controlHeightLG: 44,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Tag: {
      borderRadiusSM: 8,
    },
    Checkbox: {
      colorPrimary: '#a855f7',
    },
    Slider: {
      trackBg: 'rgba(255,255,255,0.12)',
      trackHoverBg: 'rgba(255,255,255,0.18)',
    },
  },
}

const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

const WORKSPACE_ROUTES = ['/generate', '/customize', '/video-generate']
const STUDIO_ROUTES = ['/video-frame', '/pixel-tools']

function AppLayout() {
  const location = useLocation()
  const { collapsed } = useSidebar()
  const isWorkspace = WORKSPACE_ROUTES.includes(location.pathname)
  const isStudio = STUDIO_ROUTES.includes(location.pathname)
  const isHome = location.pathname === '/'

  return (
    <div
      className={`app ${isWorkspace ? 'app-workspace' : ''} ${collapsed ? 'app--sidebar-collapsed' : ''}`}
    >
      <Sidebar />
      <main
        className={`main-content ${isWorkspace ? 'main-content-workspace' : ''} ${isHome ? 'main-content-home' : ''} ${isStudio ? 'main-content-studio' : ''}`}
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
            <Route path="/scene" element={<SceneVisualize />} />
            <Route path="/library" element={<AssetLibrary />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function App() {
  return (
    <ConfigProvider theme={antTheme} locale={zhCN}>
      <SidebarProvider>
        <AppLayout />
      </SidebarProvider>
    </ConfigProvider>
  )
}

export default App
