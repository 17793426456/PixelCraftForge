import { useState } from 'react'
import { Tag, Input, Button, Row, Col, Space, Slider, Modal, message } from 'antd'
import { DownloadOutlined, SwapOutlined, ExportOutlined, AppstoreOutlined, InboxOutlined, FolderOutlined, SaveOutlined } from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
import assetFolderArchive from '../../constants/features/asset-folder-archive.js'
import assetFormatConvert from '../../constants/features/asset-format-convert.js'
import assetCompressMobile from '../../constants/features/asset-compress-mobile.js'
import assetProjectBackup from '../../constants/features/asset-project-backup.js'
import assistPreviewMeta from '../../constants/features/assist-preview-meta.js'
import uiPackExport from '../../constants/features/ui-pack-export.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import { loadProjectSnapshots, saveProjectSnapshot } from '../../lib/assetProject.js'
import './AssetLibrary.css'

const functionCategories = ['全部', '角色类', '道具物品类', '场景环境类', 'UI交互类', '特效动作类', '地图瓦片类']
const materialCategories = ['全部', '硬质材质', '软质材质', '自然材质', '魔幻特殊材质', '复古写实材质', '卡通极简材质']

const mockAssets = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `素材_${i + 1}`,
  funcType: functionCategories[Math.floor(Math.random() * 6) + 1],
  matType: materialCategories[Math.floor(Math.random() * 6) + 1],
  style: ['像素风', 'Q版卡通', '国风二次元', '暗黑写实'][Math.floor(Math.random() * 4)],
  size: ['64px', '128px', '256px'][Math.floor(Math.random() * 3)],
}))

export default function AssetLibrary() {
  const [funcFilter, setFuncFilter] = useState('全部')
  const [matFilter, setMatFilter] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const [compressQuality, setCompressQuality] = useState(80)
  const [previewAsset, setPreviewAsset] = useState(null)
  const [snapshots, setSnapshots] = useState(() => loadProjectSnapshots())

  const filtered = mockAssets.filter((a) => {
    if (funcFilter !== '全部' && a.funcType !== funcFilter) return false
    if (matFilter !== '全部' && a.matType !== matFilter) return false
    if (searchText && !a.name.includes(searchText)) return false
    return true
  })

  return (
    <div className="vf-page vf-page--centered atelier-page-wrap library-page">
      <div className="vf-page-bg" aria-hidden="true" />
      <div className="vf-page-grid" aria-hidden="true" />

      <div className="atelier-page atelier-page--wide">
        <header className="atelier-hero atelier-enter">
          <div className="atelier-title-row">
            <AppstoreOutlined />
            <h1 className="atelier-title">素材仓库</h1>
          </div>
          <p className="atelier-subtitle">
            功能 + 材质双重分类体系，文件夹归档、格式转换、压缩减重与工程版本备份
          </p>
        </header>

        <FeatureCallout feature={assetFolderArchive} />

        <div className="atelier-layout atelier-layout--library atelier-enter atelier-enter--1">
          <aside className="atelier-aside">
            <div className="atelier-panel library-filter-panel">
              <h3 className="atelier-panel-title">筛选条件</h3>
              <Input.Search
                placeholder="搜索素材名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ marginBottom: 14 }}
              />
              <div className="library-filter-group">
                <span className="library-filter-label">功能分类</span>
                <Space wrap size={[6, 6]}>
                  {functionCategories.map((c) => (
                    <Tag
                      key={c}
                      color={funcFilter === c ? 'purple' : 'default'}
                      onClick={() => setFuncFilter(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      {c}
                    </Tag>
                  ))}
                </Space>
              </div>
              <div className="library-filter-group">
                <span className="library-filter-label">材质分类</span>
                <Space wrap size={[6, 6]}>
                  {materialCategories.map((c) => (
                    <Tag
                      key={c}
                      color={matFilter === c ? 'blue' : 'default'}
                      onClick={() => setMatFilter(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      {c}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </aside>

          <main className="atelier-main">
            <div className="library-toolbar atelier-enter atelier-enter--2">
              <span className="library-count">共 {filtered.length} 个素材</span>
              <Space wrap>
                <Button icon={<DownloadOutlined />}>批量下载</Button>
                <Button icon={<SwapOutlined />} onClick={() => message.info('将选中素材批量转换为 PNG / WebP / GIF（演示）')}>
                  格式转换
                </Button>
                <Button icon={<ExportOutlined />} onClick={() => message.success('UI 资源包 ZIP 打包任务已创建（演示）')}>
                  UI 资源打包
                </Button>
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => {
                    const entry = saveProjectSnapshot({ name: `工程_${Date.now()}`, assets: filtered, note: '手动备份' })
                    setSnapshots(loadProjectSnapshots())
                    message.success(`已保存工程快照（${entry.assetCount} 项）`)
                  }}
                >
                  工程备份
                </Button>
              </Space>
            </div>

            <FeatureCallout feature={assetFormatConvert} />
            <FeatureCallout feature={uiPackExport} />
            <div className="library-compress-row">
              <FeatureCallout feature={assetCompressMobile} />
              <span className="library-filter-label">移动端压缩质量 {compressQuality}%</span>
              <Slider min={40} max={100} value={compressQuality} onChange={setCompressQuality} />
            </div>
            {snapshots.length > 0 && (
              <div className="library-snapshots">
                <FeatureCallout feature={assetProjectBackup} />
                <span className="library-filter-label"><FolderOutlined /> 最近工程备份</span>
                <Space wrap size={[6, 6]}>
                  {snapshots.slice(0, 5).map((s) => (
                    <Tag key={s.id}>{s.name} · {s.assetCount} 项</Tag>
                  ))}
                </Space>
              </div>
            )}
            <FeatureCallout feature={assistPreviewMeta} />

            {filtered.length === 0 ? (
              <div className="atelier-empty">
                <InboxOutlined className="atelier-empty-icon" />
                <p className="atelier-empty-title">暂无匹配素材</p>
                <p className="atelier-empty-desc">尝试调整筛选条件或搜索关键词</p>
              </div>
            ) : (
              <Row gutter={[16, 16]} className="library-grid atelier-stagger">
                {filtered.map((asset) => (
                  <Col key={asset.id} xs={12} sm={8} md={6} lg={4}>
                    <div
                      className="library-asset-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => setPreviewAsset(asset)}
                      onKeyDown={(e) => e.key === 'Enter' && setPreviewAsset(asset)}
                    >
                      <div className="asset-preview">
                        <IconFont type="icon-game" />
                      </div>
                      <div className="library-asset-meta">
                        <strong>{asset.name}</strong>
                        <span>{asset.funcType} · {asset.matType}</span>
                        <span>{asset.style} · {asset.size}</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </main>
        </div>
      </div>

      <Modal
        open={!!previewAsset}
        title={previewAsset?.name}
        onCancel={() => setPreviewAsset(null)}
        footer={null}
      >
        {previewAsset && (
          <div className="library-preview-detail">
            <div className="asset-preview library-preview-large">
              <IconFont type="icon-game" />
            </div>
            <p><strong>功能分类：</strong>{previewAsset.funcType}</p>
            <p><strong>材质：</strong>{previewAsset.matType}</p>
            <p><strong>画风 / 尺寸：</strong>{previewAsset.style} · {previewAsset.size}</p>
            <p><strong>压缩预设：</strong>{compressQuality}% 质量（移动端）</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
