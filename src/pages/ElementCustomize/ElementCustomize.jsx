import { useState } from 'react'
import {
  Button, Upload, Checkbox, message, Badge, Input, Tooltip, Dropdown, ColorPicker,
} from 'antd'
import {
  ThunderboltOutlined, UploadOutlined, ReloadOutlined, DownOutlined, SaveOutlined,
} from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
import uiLayoutStyle from '../../constants/features/ui-layout-style.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
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
  const [filterStatus, setFilterStatus] = useState('全部素材')
  const [credits] = useState(40)

  const handleImport = (info) => {
    const files = info.fileList.map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      url: f.originFileObj ? URL.createObjectURL(f.originFileObj) : '',
      modified: false,
    }))
    setImportedElements(files)
    if (files.length > 0) setSelectedElement(files[0])
    message.success(`成功导入 ${files.length} 个素材`)
  }

  const handleModify = () => {
    if (!selectedElement || !modifyPrompt.trim()) {
      message.warning('请选择素材并输入修改指令')
      return
    }
    setPreviewVersion(v => v + 1)
    setImportedElements(prev => prev.map(el =>
      el.id === selectedElement.id ? { ...el, modified: true } : el
    ))
    setSelectedElement(prev => prev ? { ...prev, modified: true } : prev)
    message.success('修改已应用')
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
                <ColorPicker defaultValue="#a855f7" />
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
            <span className="jm-generate-credit">
              <IconFont type="icon-flash" /> {credits}
            </span>
          </Button>
          <Button block className="cust-save-btn" icon={<SaveOutlined />}>
            保存结果
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
                {selectedElement.url ? (
                  <img src={selectedElement.url} alt="预览" className="cust-preview-image" />
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
