import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Sparkles, Pencil, Video, Volume2, LayoutGrid, PlayCircle,
  Grid3x3, Palette, Zap, Square, PanelLeftClose, PanelLeft,
} from 'lucide-react'
import BrandName from '../Brand/BrandName'
import { brandLogo, BRAND_NAME_FULL } from '../../constants/brand'
import { useSidebar, SIDEBAR_WIDTH } from '../../contexts/SidebarContext'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import './Sidebar.css'

const navGroups = [
  {
    title: '概览',
    items: [{ key: '/', label: '首页', Icon: Home }],
  },
  {
    title: '图片素材',
    items: [
      { key: '/generate', label: '图片生成', Icon: Sparkles },
      { key: '/customize', label: '元素改造', Icon: Pencil },
      { key: '/pixel-tools', label: '像素工具箱', Icon: Grid3x3 },
      { key: '/layer-editor', label: '图层编辑器', Icon: Palette },
      { key: '/ui-studio', label: 'UI 工作室', Icon: LayoutGrid },
    ],
  },
  {
    title: '动画 / 视频',
    items: [
      { key: '/video-generate', label: '视频生成', Icon: PlayCircle },
      { key: '/video-frame', label: 'AI 抽帧', Icon: Video },
      { key: '/particle-studio', label: '粒子特效', Icon: Zap },
    ],
  },
  {
    title: '场景地图',
    items: [
      { key: '/level-editor', label: '关卡编辑器', Icon: Square },
    ],
  },
  {
    title: '资源',
    items: [
      { key: '/library', label: '素材仓库', Icon: LayoutGrid },
      { key: '/sound-effect', label: '音效生成', Icon: Volume2 },
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
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <span className="shell-text">{label}</span>
    </button>
  )

  if (collapsed) {
    return (
      <li className={`shell-nav-link ${active ? 'active' : ''}`}>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
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
            <PanelLeftClose className="size-[18px]" />
          ) : (
            collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />
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
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent side="left" className="shell-drawer w-[min(250px,85vw)] border-r border-border bg-[#111116] p-0">
          <ShellSidebar
            collapsed={false}
            isMobile
            onToggle={closeMobile}
            onNavigate={handleNavigate}
            pathname={location.pathname}
          />
        </SheetContent>
      </Sheet>
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
