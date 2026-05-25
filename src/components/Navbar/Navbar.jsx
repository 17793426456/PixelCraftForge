import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Sparkles, Pencil, Video, Volume2, Square, LayoutGrid,
} from 'lucide-react'
import BrandName from '../Brand/BrandName'
import { brandLogo } from '../../constants/brand'
import './Navbar.css'

const navItems = [
  { key: '/', label: '首页', Icon: Home },
  { key: '/generate', label: '元素生成', Icon: Sparkles },
  { key: '/customize', label: '元素改造', Icon: Pencil },
  { key: '/video-frame', label: 'AI抽帧', Icon: Video },
  { key: '/sound-effect', label: '音效生成', Icon: Volume2 },
  { key: '/level-editor', label: '关卡编辑器', Icon: Square },
  { key: '/library', label: '素材仓库', Icon: LayoutGrid },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img src={brandLogo} alt="" className="brand-logo-img" draggable={false} />
          <div className="brand-copy">
            <BrandName layout="stack" className="brand-text" />
            <span className="brand-tagline">智能 2D 美术创作平台</span>
          </div>
        </div>

        <nav className="navbar-menu" aria-label="主导航">
          {navItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={`navbar-menu-item${location.pathname === key ? ' is-active' : ''}`}
              onClick={() => navigate(key)}
              aria-current={location.pathname === key ? 'page' : undefined}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
