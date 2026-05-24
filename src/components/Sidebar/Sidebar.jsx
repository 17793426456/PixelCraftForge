import { useNavigate, useLocation } from 'react-router-dom'
import { Drawer, Tooltip } from 'antd'
import {
  HomeOutlined, HighlightOutlined, EditOutlined, VideoCameraOutlined,
  SoundOutlined, PictureOutlined, AppstoreOutlined, PlayCircleOutlined,
  BlockOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons'
import BrandName from '../Brand/BrandName'
import { brandLogo, BRAND_NAME_FULL } from '../../constants/brand'
import { useSidebar, SIDEBAR_WIDTH } from '../../contexts/SidebarContext'
import './Sidebar.css'

const navGroups = [
  {
    title: '概览',
    items: [{ key: '/', label: '首页', Icon: HomeOutlined }],
  },
  {
    title: '图片素材',
    items: [
      { key: '/generate', label: '图片生成', Icon: HighlightOutlined },
      { key: '/customize', label: '元素改造', Icon: EditOutlined },
      { key: '/pixel-tools', label: '像素工具箱', Icon: BlockOutlined },
    ],
  },
  {
    title: '动画 / 视频',
    items: [
      { key: '/video-generate', label: '视频生成', Icon: PlayCircleOutlined },
      { key: '/video-frame', label: 'AI 抽帧', Icon: VideoCameraOutlined },
    ],
  },
  {
    title: '场景地图',
    items: [{ key: '/scene', label: '场景搭建', Icon: PictureOutlined }],
  },
  {
    title: '资源',
    items: [
      { key: '/library', label: '素材仓库', Icon: AppstoreOutlined },
      { key: '/sound-effect', label: '音效生成', Icon: SoundOutlined },
    ],
  },
]

function NavLink({ item, active, collapsed, onNavigate }) {
  const { key, label, Icon } = item
  const link = (
    <button
      type="button"
      className="shell-nav-btn"
      onClick={() => onNavigate(key)}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span className="shell-icon">
        <Icon />
      </span>
      <span className="shell-text">{label}</span>
    </button>
  )

  if (collapsed) {
    return (
      <li className={`shell-nav-link ${active ? 'active' : ''}`}>
        <Tooltip title={label} placement="right" mouseEnterDelay={0.2}>
          {link}
        </Tooltip>
      </li>
    )
  }

  return (
    <li className={`shell-nav-link ${active ? 'active' : ''}`}>
      {link}
    </li>
  )
}

function ShellSidebar({ collapsed, onToggle, onNavigate, pathname, isMobile = false }) {
  return (
    <nav
      className={`shell ${collapsed ? 'close' : ''}`}
      aria-label="主导航"
      aria-expanded={!collapsed}
    >
      <header className="shell-header">
        <div
          className="shell-image-text"
          onClick={() => onNavigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('/')}
          aria-label={BRAND_NAME_FULL}
        >
          <span className="shell-image">
            <img src={brandLogo} alt="" draggable={false} />
          </span>
          <div className="shell-logo-text">
            <BrandName layout="stack" className="shell-brand-name" />
          </div>
        </div>
      </header>

      <div className="shell-menu-bar">
        <div className="shell-menu">
          {navGroups.map((group) => (
            <div key={group.title} className="shell-menu-section">
              {!collapsed && (
                <p className="shell-group-title">{group.title}</p>
              )}
              <ul className="shell-menu-links">
                {group.items.map((item) => (
                  <NavLink
                    key={item.key}
                    item={item}
                    active={pathname === item.key}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="shell-footer">
        <button
          type="button"
          className="shell-footer-toggle"
          onClick={onToggle}
          aria-label={isMobile ? '关闭导航' : (collapsed ? '展开侧边栏' : '收起侧边栏')}
        >
          {isMobile ? (
            <MenuFoldOutlined />
          ) : (
            collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
          )}
          <span className="shell-footer-toggle-text">
            {isMobile ? '关闭' : (collapsed ? '展开' : '收起')}
          </span>
        </button>
      </div>
    </nav>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed, toggle, isMobile, mobileOpen, closeMobile } = useSidebar()

  const handleNavigate = (key) => {
    navigate(key)
    if (isMobile) closeMobile()
  }

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={closeMobile}
        closable={false}
        width={Math.min(SIDEBAR_WIDTH, typeof window !== 'undefined' ? window.innerWidth * 0.85 : SIDEBAR_WIDTH)}
        className="shell-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <ShellSidebar
          collapsed={false}
          isMobile
          onToggle={closeMobile}
          onNavigate={handleNavigate}
          pathname={location.pathname}
        />
      </Drawer>
    )
  }

  return (
    <ShellSidebar
      collapsed={collapsed}
      onToggle={toggle}
      onNavigate={handleNavigate}
      pathname={location.pathname}
    />
  )
}
