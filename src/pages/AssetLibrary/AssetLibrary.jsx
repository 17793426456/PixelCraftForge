import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Tag, Input, Button, Row, Col, Space, Slider, Modal, message, Upload, Select,
} from '@/lib/ui/antd-compat'
import {
  DownloadOutlined, SwapOutlined, ExportOutlined, AppstoreOutlined,
  InboxOutlined, FolderOutlined, SaveOutlined, DeleteOutlined, UploadOutlined,
} from '@ant-design/icons'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import assetFolderArchive from '../../constants/features/asset-folder-archive.js'
import assetFormatConvert from '../../constants/features/asset-format-convert.js'
import assetCompressMobile from '../../constants/features/asset-compress-mobile.js'
import assetProjectBackup from '../../constants/features/asset-project-backup.js'
import assistPreviewMeta from '../../constants/features/assist-preview-meta.js'
import uiPackExport from '../../constants/features/ui-pack-export.js'
import { loadProjectSnapshots, saveProjectSnapshot } from '../../lib/assetProject.js'
import {
  addAssetFromFile, assetToBlob, deleteAsset, getImageDimensions, listAssets, updateAsset,
} from '../../lib/assets/localAssetStore.js'
import { convertImageBlob, FORMAT_OPTIONS, zipBlobs } from '../../lib/assets/imageExport.js'
import { useAssetThumbnails } from '../../hooks/useAssetThumbnails.js'
import './AssetLibrary.css'

const functionCategories = ['全部', '角色类', '道具物品类', '场景环境类', 'UI交互类', '特效动作类', '地图瓦片类']
const materialCategories = ['全部', '硬质材质', '软质材质', '自然材质', '魔幻特殊材质', '复古写实材质', '卡通极简材质']

export default function AssetLibrary() {
  const [assets, setAssets] = useState([])
  const [funcFilter, setFuncFilter] = useState('全部')
  const [matFilter, setMatFilter] = useState('全部')
  const [folderFilter, setFolderFilter] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const [compressQuality, setCompressQuality] = useState(80)
  const [maxEdge, setMaxEdge] = useState(512)
  const [convertFormat, setConvertFormat] = useState('image/png')
  const [selectedIds, setSelectedIds] = useState([])
  const [previewAsset, setPreviewAsset] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [editMeta, setEditMeta] = useState({ funcType: '', matType: '', folder: '', name: '' })
  const [snapshots, setSnapshots] = useState(() => loadProjectSnapshots())
  const [loading, setLoading] = useState(false)
  const thumbMap = useAssetThumbnails(assets)

  const refresh = useCallback(async () => {
    const list = await listAssets()
    setAssets(list)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!previewAsset) {
      setPreviewUrl(null)
      return undefined
    }
    setEditMeta({
      name: previewAsset.name,
      funcType: previewAsset.funcType,
      matType: previewAsset.matType,
      folder: previewAsset.folder || '默认',
    })
    const url = URL.createObjectURL(assetToBlob(previewAsset))
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [previewAsset])

  const folders = useMemo(() => {
    const set = new Set(assets.map((a) => a.folder || '默认'))
    return ['全部', ...set]
  }, [assets])

  const filtered = useMemo(() => assets.filter((a) => {
    if (funcFilter !== '全部' && a.funcType !== funcFilter) return false
    if (matFilter !== '全部' && a.matType !== matFilter) return false
    if (folderFilter !== '全部' && (a.folder || '默认') !== folderFilter) return false
    if (searchText && !a.name.includes(searchText)) return false
    return true
  }), [assets, funcFilter, matFilter, folderFilter, searchText])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleImport = async ({ fileList }) => {
    setLoading(true)
    try {
      for (const item of fileList) {
        const file = item.originFileObj
        if (!file) continue
        let width = null
        let height = null
        if (file.type.startsWith('image/')) {
          const dim = await getImageDimensions(file)
          width = dim.width
          height = dim.height
        }
        await addAssetFromFile(file, {
          funcType: funcFilter !== '全部' ? funcFilter : '道具物品类',
          matType: matFilter !== '全部' ? matFilter : '卡通极简材质',
          folder: folderFilter !== '全部' ? folderFilter : '默认',
          width,
          height,
        })
      }
      await refresh()
      message.success(`已导入 ${fileList.length} 个文件到本地仓库`)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导入失败')
    } finally {
      setLoading(false)
    }
  }

  const selectedAssets = filtered.filter((a) => selectedIds.includes(a.id))

  const handleBatchConvert = async () => {
    const targets = selectedAssets.length ? selectedAssets : filtered
    if (!targets.length) {
      message.warning('请先导入或选择素材')
      return
    }
    setLoading(true)
    try {
      const fmt = FORMAT_OPTIONS.find((f) => f.value === convertFormat) ?? FORMAT_OPTIONS[0]
      const entries = []
      for (const asset of targets) {
        if (!asset.mimeType?.startsWith('image/')) continue
        const blob = await convertImageBlob(assetToBlob(asset), {
          format: fmt.value,
          quality: compressQuality / 100,
          maxEdge,
        })
        const base = asset.name.replace(/\.[^.]+$/, '')
        entries.push({ name: `${base}.${fmt.ext}`, blob })
      }
      if (!entries.length) {
        message.warning('所选素材中没有可转换的图片')
        return
      }
      await zipBlobs(entries, `converted_${fmt.ext}.zip`)
      message.success(`已导出 ${entries.length} 个 ${fmt.label} 文件`)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '转换失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUiPack = async () => {
    const uiAssets = (selectedAssets.length ? selectedAssets : filtered)
      .filter((a) => a.funcType === 'UI交互类' || selectedAssets.length)
    if (!uiAssets.length) {
      message.warning('请选择 UI 类素材或先筛选 UI交互类')
      return
    }
    setLoading(true)
    try {
      const entries = uiAssets.map((a) => ({
        name: `ui/${a.name}`,
        blob: assetToBlob(a),
      }))
      await zipBlobs(entries, 'ui_pack.zip')
      message.success('UI 资源包已下载')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchDownload = async () => {
    const targets = selectedAssets.length ? selectedAssets : filtered
    if (!targets.length) {
      message.warning('没有可下载的素材')
      return
    }
    setLoading(true)
    try {
      const entries = targets.map((a) => ({ name: a.name, blob: assetToBlob(a) }))
      await zipBlobs(entries, 'assets_batch.zip')
      message.success(`已打包下载 ${entries.length} 个文件`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    await deleteAsset(id)
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    await refresh()
    message.success('已删除')
  }

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
            本地 IndexedDB 存储，支持导入、分类、格式转换、压缩与工程快照（数据保存在本机浏览器）
          </p>
        </header>

        <FeatureCallout feature={assetFolderArchive} />

        <div className="atelier-layout atelier-layout--library atelier-enter atelier-enter--1">
          <aside className="atelier-aside">
            <div className="atelier-panel library-filter-panel">
              <h3 className="atelier-panel-title">筛选与导入</h3>
              <Upload.Dragger
                multiple
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleImport}
                accept="image/*,audio/*,.gif,.zip"
              >
                <p><UploadOutlined /> 拖拽或点击导入素材</p>
              </Upload.Dragger>
              <Input.Search
                placeholder="搜索素材名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ margin: '14px 0' }}
              />
              <div className="library-filter-group">
                <span className="library-filter-label">文件夹</span>
                <Select
                  style={{ width: '100%' }}
                  value={folderFilter}
                  onChange={setFolderFilter}
                  options={folders.map((f) => ({ label: f, value: f }))}
                />
              </div>
              <div className="library-filter-group">
                <span className="library-filter-label">功能分类</span>
                <Space wrap size={[6, 6]}>
                  {functionCategories.map((c) => (
                    <Tag key={c} color={funcFilter === c ? 'purple' : 'default'} onClick={() => setFuncFilter(c)} style={{ cursor: 'pointer' }}>
                      {c}
                    </Tag>
                  ))}
                </Space>
              </div>
              <div className="library-filter-group">
                <span className="library-filter-label">材质分类</span>
                <Space wrap size={[6, 6]}>
                  {materialCategories.map((c) => (
                    <Tag key={c} color={matFilter === c ? 'blue' : 'default'} onClick={() => setMatFilter(c)} style={{ cursor: 'pointer' }}>
                      {c}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </aside>

          <main className="atelier-main">
            <div className="library-toolbar atelier-enter atelier-enter--2">
              <span className="library-count">共 {filtered.length} 个素材 · 已选 {selectedIds.length}</span>
              <Space wrap>
                <Button icon={<DownloadOutlined />} loading={loading} onClick={() => { void handleBatchDownload() }}>批量下载</Button>
                <Select value={convertFormat} onChange={setConvertFormat} options={FORMAT_OPTIONS.map((f) => ({ label: f.label, value: f.value }))} style={{ width: 100 }} />
                <Button icon={<SwapOutlined />} loading={loading} onClick={() => { void handleBatchConvert() }}>格式转换 ZIP</Button>
                <Button icon={<ExportOutlined />} loading={loading} onClick={() => { void handleUiPack() }}>UI 打包</Button>
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => {
                    saveProjectSnapshot({ name: `工程_${Date.now()}`, assets: filtered.map(({ data, ...rest }) => rest), note: '元数据快照' })
                    setSnapshots(loadProjectSnapshots())
                    message.success('工程元数据已备份到 localStorage')
                  }}
                >
                  工程备份
                </Button>
              </Space>
            </div>

            <FeatureCallout feature={assetFormatConvert} />
            <div className="library-compress-row">
              <FeatureCallout feature={assetCompressMobile} />
              <span className="library-filter-label">压缩质量 {compressQuality}% · 最长边 {maxEdge}px</span>
              <Slider min={40} max={100} value={compressQuality} onChange={setCompressQuality} />
              <Slider min={64} max={2048} step={64} value={maxEdge} onChange={setMaxEdge} />
            </div>
            {snapshots.length > 0 && (
              <div className="library-snapshots">
                <FeatureCallout feature={assetProjectBackup} />
                <span className="library-filter-label"><FolderOutlined /> 最近工程备份</span>
                <Space wrap>{snapshots.slice(0, 5).map((s) => <Tag key={s.id}>{s.name} · {s.assetCount} 项</Tag>)}</Space>
              </div>
            )}
            <FeatureCallout feature={assistPreviewMeta} />
            <FeatureCallout feature={uiPackExport} />

            {filtered.length === 0 ? (
              <div className="atelier-empty">
                <InboxOutlined className="atelier-empty-icon" />
                <p className="atelier-empty-title">仓库为空</p>
                <p className="atelier-empty-desc">从左侧导入 PNG / GIF / 音频等文件，数据仅存于本机</p>
              </div>
            ) : (
              <Row gutter={[16, 16]} className="library-grid">
                {filtered.map((asset) => (
                  <Col key={asset.id} xs={12} sm={8} md={6} lg={4}>
                    <div className={`library-asset-card ${selectedIds.includes(asset.id) ? 'is-selected' : ''}`}>
                      <div
                        className="asset-preview"
                        role="button"
                        tabIndex={0}
                        onClick={() => { setPreviewAsset(asset); toggleSelect(asset.id) }}
                      >
                        {thumbMap[asset.id] ? (
                          <img src={thumbMap[asset.id]} alt="" className="library-thumb-img" />
                        ) : (
                          <span className="library-thumb-ext">{asset.name.split('.').pop()?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="library-asset-meta">
                        <strong>{asset.name}</strong>
                        <span>{asset.funcType} · {asset.folder}</span>
                        <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : `${(asset.sizeBytes / 1024).toFixed(1)} KB`}</span>
                      </div>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => { void handleDelete(asset.id) }} />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </main>
        </div>
      </div>

      <Modal open={!!previewAsset} title={previewAsset?.name} onCancel={() => setPreviewAsset(null)} width={520} footer={(
        <Space wrap>
          <Button onClick={() => previewAsset && updateAsset(previewAsset.id, { funcType: 'UI交互类' }).then(refresh)}>标为 UI</Button>
          <Button onClick={() => {
            if (!previewAsset) return
            void updateAsset(previewAsset.id, editMeta).then(() => {
              refresh()
              message.success('元数据已更新')
              setPreviewAsset((p) => (p ? { ...p, ...editMeta } : p))
            })
          }}
          >保存元数据
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => {
            if (!previewAsset) return
            const blob = assetToBlob(previewAsset)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = previewAsset.name
            a.click()
            URL.revokeObjectURL(url)
          }}
          >下载原文件
          </Button>
        </Space>
      )}
      >
        {previewAsset && previewUrl && previewAsset.mimeType?.startsWith('image/') && (
          <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 8 }} />
        )}
        {previewAsset && (
          <div className="library-preview-detail">
            <p><strong>文件名</strong></p>
            <Input value={editMeta.name} onChange={(e) => setEditMeta((m) => ({ ...m, name: e.target.value }))} style={{ marginBottom: 12 }} />
            <p><strong>功能分类</strong></p>
            <Select value={editMeta.funcType} onChange={(v) => setEditMeta((m) => ({ ...m, funcType: v }))} options={functionCategories.filter((c) => c !== '全部').map((c) => ({ label: c, value: c }))} style={{ width: '100%', marginBottom: 12 }} />
            <p><strong>材质分类</strong></p>
            <Select value={editMeta.matType} onChange={(v) => setEditMeta((m) => ({ ...m, matType: v }))} options={materialCategories.filter((c) => c !== '全部').map((c) => ({ label: c, value: c }))} style={{ width: '100%', marginBottom: 12 }} />
            <p><strong>文件夹</strong></p>
            <Input value={editMeta.folder} onChange={(e) => setEditMeta((m) => ({ ...m, folder: e.target.value }))} style={{ marginBottom: 12 }} />
            <p><strong>类型：</strong>{previewAsset.mimeType}</p>
            <p><strong>尺寸：</strong>{previewAsset.width && previewAsset.height ? `${previewAsset.width}×${previewAsset.height}` : `${(previewAsset.sizeBytes / 1024).toFixed(1)} KB`}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
