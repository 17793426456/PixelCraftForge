import { useState } from 'react'
import {
  Button, Upload, Checkbox, message, Badge, Input, Tooltip, Dropdown, ColorPicker,
} from '@/components/app/wrapped-ui'
import {
  ThunderboltOutlined, UploadOutlined, ReloadOutlined, DownOutlined, SaveOutlined,
} from '@/lib/icons/antd-lucide'
import IconFont from '../../components/IconFont/IconFont'
import uiLayoutStyle from '../../constants/features/ui-layout-style.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import { applyLocalTransform } from '../../lib/customize/localImageTransform.js'
import { saveDataUrlToLibrary } from '../../lib/assets/saveToLibrary.js'
import { resolveMediaUrl } from '../../lib/api/mediaUrl.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import '../ElementGenerate/ElementGenerate.css'
import './ElementCustomize.css'

const { TextArea } = Input

const attrOptions = [
  { key: 'appearance', label: '外观' },
  { key: 'material', label: '材质' },
  { key: 'color', label: '色彩' },
  { key: 'style', label: '风格' },
  { key: 'pose', label: '姿态' },
  { key: 'function', label: '功能' },
]

const DEFAULTS = {
  modifyPrompt: '',
  keepStructure: true,
  activeAttr: 'appearance',
}

export default function ElementCustomize() {
  const [importedElements, setImportedElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [modifyPrompt, setModifyPrompt] = useState(DEFAULTS.modifyPrompt)
  const [keepStructure, setKeepStructure] = useState(DEFAULTS.keepStructure)
  const [activeAttr, setActiveAttr] = useState(DEFAULTS.activeAttr)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [processedPreview, setProcessedPreview] = useState(null)
  const [filterStatus, setFilterStatus] = useState('全部素材')
  const [targetColor, setTargetColor] = useState('#a855f7')

  const handleImport = (info) => {
    const picked = (info.fileList ?? [])
      .map((f) => f.originFileObj)
      .filter(Boolean)
    if (!picked.length) {
      message.warning('未选择有效图片文件')
      return
    }
    const files = picked.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      url: URL.createObjectURL(file),
      modified: false,
    }))
    setImportedElements((prev) => [...prev, ...files])
    setSelectedElement(files[0])
    message.success(`成功导入 ${files.length} 个素材`)
  }

  const handleModify = async () => {
    if (!selectedElement || !modifyPrompt.trim()) {
      message.warning('请选择素材并输入修改指令')
      return
    }
    if (!selectedElement.url) {
      message.warning('当前素材无预览图')
      return
    }
    try {
      const dataUrl = await applyLocalTransform(selectedElement.url, {
        activeAttr,
        prompt: modifyPrompt,
        targetColor: activeAttr === 'color' ? targetColor : undefined,
        keepStructure,
      })
      setProcessedPreview(dataUrl)
      setPreviewVersion((v) => v + 1)
      setImportedElements((prev) => prev.map((el) =>
        el.id === selectedElement.id ? { ...el, modified: true, processedUrl: dataUrl } : el,
      ))
      setSelectedElement((prev) => (prev ? { ...prev, modified: true, processedUrl: dataUrl } : prev))
      message.success('已应用本地滤镜预览（可对接 AI API 获得更高质量）')
    } catch {
      message.error('预览处理失败')
    }
  }

  const handleReset = () => {
    setModifyPrompt(DEFAULTS.modifyPrompt)
    setKeepStructure(DEFAULTS.keepStructure)
    setActiveAttr(DEFAULTS.activeAttr)
    setPreviewVersion(0)
    message.info('已重置参数')
  }

  const statusMenu = {
    items: ['全部素材', '已修改', '未修改'].map(t => ({
      key: t, label: t, onClick: () => setFilterStatus(t),
    })),
  }

  const filteredElements = importedElements.filter(el => {
    if (filterStatus === '已修改') return el.modified
    if (filterStatus === '未修改') return !el.modified
    return true
  })


  const handleSave = async () => {
    const targets = importedElements.filter((el) => el.processedUrl || (el.id === selectedElement?.id && processedPreview))
    if (!targets.length) {
      message.warning('请先应用修改后再保存')
      return
    }
    try {
      for (const el of targets) {
        const url = el.processedUrl || processedPreview
        if (!url) continue
        const res = await fetch(resolveMediaUrl(url))
        const blob = await res.blob()
        triggerDownload(blob, `${el.name.replace(/\.[^.]+$/, '')}_modified.png`)
        await saveDataUrlToLibrary(url, `${el.name.replace(/\.[^.]+$/, '')}_modified.png`, {
          funcType: '道具物品类',
          folder: '元素改造',
        })
      }
      message.success(`已下载并入库 ${targets.length} 个改造结果`)
    } catch {
      message.error('保存失败')
    }
  }

  return (
    <div className="jm-workspace cust-workspace">
      <aside className="jm-panel">
        <FeatureCallout feature={uiLayoutStyle} />
        <div className="jm-panel-header">
          <h1 className="jm-panel-title">元素改造</h1>
          <Tooltip title="重置参数">
            <button type="button" className="jm-icon-btn" onClick={handleReset}>
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>

        <div className="jm-panel-scroll">
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleImport}
            className="cust-upload-wrap"
          >
            <div className="cust-import-btn">
              <UploadOutlined />
              <span>{importedElements.length ? '继续导入素材' : '批量导入素材'}</span>
              <span className="cust-import-hint">支持 PNG / JPG</span>
            </div>
          </Upload>

          {importedElements.length > 0 && (
            <div className="cust-asset-list">
              {importedElements.map(el => (
                <button
                  key={el.id}
                  type="button"
                  className={`cust-asset-item ${selectedElement?.id === el.id ? 'active' : ''}`}
                  onClick={() => setSelectedElement(el)}
                >
                  {el.url ? (
                    <img src={el.url} alt={el.name} className="cust-asset-thumb" />
                  ) : (
                    <span className="cust-asset-thumb cust-asset-placeholder"><IconFont type="icon-image" /></span>
                  )}
                  <span className="cust-asset-name">{el.name}</span>
                  {el.modified && <Badge status="success" text="已改" className="cust-asset-badge" />}
                </button>
              ))}
            </div>
          )}

          <div className="jm-options">
            <div className="jm-opt-group">
              <span className="jm-opt-label">改造属性</span>
              <div className="jm-pills">
                {attrOptions.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`jm-pill ${activeAttr === opt.key ? 'active' : ''}`}
                    onClick={() => setActiveAttr(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {activeAttr === 'color' && (
              <div className="jm-opt-group cust-color-row">
                <span className="jm-opt-label">目标色</span>
                <ColorPicker value={targetColor} onChange={(c) => setTargetColor(c.toHexString())} />
              </div>
            )}

            <TextArea
              rows={4}
              placeholder="输入修改指令，如：将材质改为冰晶质感，增加蓝色光效..."
              value={modifyPrompt}
              onChange={e => setModifyPrompt(e.target.value)}
              className="jm-prompt"
              variant="borderless"
            />

            <Checkbox
              checked={keepStructure}
              onChange={e => setKeepStructure(e.target.checked)}
              className="jm-checkbox"
            >
              保留主体结构（仅修改细节属性）
            </Checkbox>
          </div>
        </div>

        <div className="jm-panel-footer cust-panel-footer">
          <Button type="primary" size="large" block className="jm-generate-btn" onClick={handleModify}>
            <span className="jm-generate-text">
              <ThunderboltOutlined /> 应用修改
            </span>
          </Button>
          <Button block className="cust-save-btn" icon={<SaveOutlined />} onClick={() => { void handleSave() }}>
            保存结果（下载 + 入库）
          </Button>
        </div>
      </aside>

      <main className="jm-canvas">
        <div className="jm-canvas-toolbar">
          <Dropdown menu={statusMenu} trigger={['click']}>
            <button type="button" className="jm-filter-btn">{filterStatus} <DownOutlined /></button>
          </Dropdown>
          <button type="button" className="jm-filter-btn">
            共 {importedElements.length} 个素材
          </button>
          <button type="button" className="jm-filter-btn">
            <IconFont type="icon-task" /> 任务视图
          </button>
        </div>

        <div className="jm-canvas-body">
          {importedElements.length === 0 ? (
            <div className="jm-welcome">
              <div className="jm-welcome-art">
                <IconFont type="icon-image" />
                <IconFont type="icon-sparkle" className="jm-welcome-sparkle" />
              </div>
              <p className="jm-welcome-title">导入素材，开始自定义改造</p>
              <p className="jm-welcome-desc">支持批量导入 PNG / JPG，通过文字指令修改 6 大属性</p>
            </div>
          ) : selectedElement ? (
            <div className="cust-preview-wrap">
              <div className="cust-preview-stage">
                {processedPreview || selectedElement.processedUrl || selectedElement.url ? (
                  <img
                    src={processedPreview || selectedElement.processedUrl || selectedElement.url}
                    alt="预览"
                    className="cust-preview-image"
                  />
                ) : (
                  <IconFont type="icon-game" className="cust-preview-placeholder" />
                )}
                {previewVersion > 0 && selectedElement.modified && (
                  <span className="cust-preview-tag">修改预览 v{previewVersion}</span>
                )}
              </div>

              {filteredElements.length > 0 && (
                <div className="jm-results-grid cust-results-grid">
                  {filteredElements.map(el => (
                    <button
                      key={el.id}
                      type="button"
                      className={`jm-result-card cust-result-card ${selectedElement?.id === el.id ? 'selected' : ''}`}
                      onClick={() => setSelectedElement(el)}
                    >
                      <div className="jm-result-cover cust-result-cover">
                        {el.url ? (
                          <img src={el.url} alt={el.name} />
                        ) : (
                          <IconFont type="icon-game" />
                        )}
                      </div>
                      <div className="jm-result-meta">
                        <span className="jm-result-name">{el.name}</span>
                        <span className="jm-result-info">{el.modified ? '已修改' : '未修改'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
