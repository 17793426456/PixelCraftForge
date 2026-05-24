import { useNavigate, useLocation } from 'react-router-dom'
import { Tooltip } from 'antd'
import {
  HomeOutlined, HighlightOutlined, EditOutlined, VideoCameraOutlined,
  SoundOutlined, PictureOutlined, AppstoreOutlined, PlayCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, BlockOutlined,
} from '@ant-design/icons'
import BrandName from '../Brand/BrandName'
import { brandLogo, BRAND_NAME_FULL } from '../../constants/brand'
import { useSidebar } from '../../contexts/SidebarContext'
import './Sidebar.css'

const navGroups = [
  {
    title: '概览',
    items: [{ key: '/', label: '首页', Icon: HomeOutlined }],
  },
  {
    title: '创作',
    items: [
      { key: '/generate', label: '图片生成', Icon: HighlightOutlined },
      { key: '/video-generate', label: '视频生成', Icon: PlayCircleOutlined },
      { key: '/customize', label: '元素改造', Icon: EditOutlined },
    ],
  },
  {
    title: '工具',
    items: [
      { key: '/video-frame', label: 'AI 抽帧', Icon: VideoCameraOutlined },
      { key: '/pixel-tools', label: '像素工具箱', Icon: BlockOutlined },
      { key: '/sound-effect', label: '音效生成', Icon: SoundOutlined },
    ],
  },
  {
    title: '资源',
    items: [
      { key: '/scene', label: '场景搭建', Icon: PictureOutlined },
      { key: '/library', label: '素材仓库', Icon: AppstoreOutlined },
    ],
  },
]

function NavItem({ item, active, collapsed, onNavigate }) {
  const { key, label, Icon } = item
  const button = (
    <button
      type="button"
      className={`sidebar-nav-item ${active ? 'active' : ''}`}
      onClick={() => onNavigate(key)}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span className="sidebar-nav-icon">
        <Icon />
      </span>
      <span className="sidebar-nav-label">{label}</span>
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" mouseEnterDelay={0.3}>
        {button}
      </Tooltip>
    )
  }
  return button
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      aria-label="主导航"
      aria-expanded={!collapsed}
    >
      <div
        className="sidebar-brand"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        aria-label={BRAND_NAME_FULL}
      >
        <div className="sidebar-brand-logo-wrap">
          <img src={brandLogo} alt="" className="sidebar-brand-logo" draggable={false} />
        </div>
        <BrandName layout="stack" className="sidebar-brand-name" />
      </div>

      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="sidebar-nav-group">
            {!collapsed && (
              <div className="sidebar-nav-group-title">{group.title}</div>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={location.pathname === item.key}
                collapsed={collapsed}
                onNavigate={navigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggle}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          <span className="sidebar-toggle-text">{collapsed ? '展开' : '收起'}</span>
        </button>
      </div>
    </aside>
  )
}
