import { useNavigate, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  HomeOutlined, HighlightOutlined, EditOutlined, VideoCameraOutlined,
  SoundOutlined, BorderOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import BrandName from '../Brand/BrandName'
import { brandLogo } from '../../constants/brand'
import './Navbar.css'

const navItems = [
  { key: '/', label: '首页', icon: <HomeOutlined /> },
  { key: '/generate', label: '元素生成', icon: <HighlightOutlined /> },
  { key: '/customize', label: '元素改造', icon: <EditOutlined /> },
  { key: '/video-frame', label: 'AI抽帧', icon: <VideoCameraOutlined /> },
  { key: '/sound-effect', label: '音效生成', icon: <SoundOutlined /> },
  { key: '/level-editor', label: '关卡编辑器', icon: <BorderOutlined /> },
  { key: '/library', label: '素材仓库', icon: <AppstoreOutlined /> },
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

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          className="navbar-menu"
        />
      </div>
    </header>
  )
}
