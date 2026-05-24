import { useState } from 'react'
import { Button, Card, Tag, Space, message, Radio, Input, Row, Col } from 'antd'
import { BuildOutlined, PictureOutlined } from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
import './SceneVisualize.css'

const { TextArea } = Input

const viewOptions = ['横版视角', '俯视视角', '侧视视角']
const sceneElements = ['角色', '道具', '植被', '建筑', '地形', '天空']

const elementColors = {
  '角色': '#722ed1', '道具': '#52c41a', '植被': '#13c2c2',
  '建筑': '#fa541c', '地形': '#faad14', '天空': '#1890ff'
}

const elementIcons = {
  '角色': 'icon-wizard', '道具': 'icon-sword', '植被': 'icon-tree',
  '建筑': 'icon-castle', '地形': 'icon-mountain', '天空': 'icon-cloud'
}

export default function SceneVisualize() {
  const [scenePrompt, setScenePrompt] = useState('')
  const [selectedView, setSelectedView] = useState('横版视角')
  const [placedElements, setPlacedElements] = useState([])
  const [isBuilding, setIsBuilding] = useState(false)

  const handleBuildScene = () => {
    if (!scenePrompt) { message.warning('请输入场景描述'); return }
    setIsBuilding(true)
    setTimeout(() => {
      setPlacedElements([
        { id: 1, type: '天空', x: 50, y: 12 },
        { id: 2, type: '建筑', x: 20, y: 40 },
        { id: 3, type: '角色', x: 50, y: 60 },
        { id: 4, type: '植被', x: 72, y: 55 },
        { id: 5, type: '道具', x: 38, y: 65 },
        { id: 6, type: '地形', x: 50, y: 85 },
      ])
      setIsBuilding(false)
      message.success('场景搭建完成！')
    }, 2000)
  }

  return (
    <div className="scene-page">
      <div className="page-header">
        <h2 className="page-title"><PictureOutlined /> AI游戏场景可视化搭建</h2>
        <p className="page-subtitle">输入文字描述，AI 自动选择视角与元素，一键搭建完整游戏场景预览</p>
      </div>
      <Row gutter={20}>
        <Col flex="340px">
          <Card bordered={false} className="scene-card">
            <TextArea rows={3} placeholder="描述游戏场景，如：一片魔法森林，远处有古老城堡..." value={scenePrompt} onChange={e => setScenePrompt(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ marginBottom: 12 }}>
              <span style={{ marginRight: 8, color: 'var(--text-secondary)', fontSize: 13 }}>视角：</span>
              <Radio.Group value={selectedView} onChange={e => setSelectedView(e.target.value)} size="small">
                {viewOptions.map(v => <Radio.Button key={v} value={v}>{v}</Radio.Button>)}
              </Radio.Group>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>场景元素：</span>
              <Space wrap>
                {sceneElements.map(el => <Tag key={el} color="purple">{el}</Tag>)}
              </Space>
            </div>
            <Button type="primary" size="large" icon={<BuildOutlined />} onClick={handleBuildScene} loading={isBuilding} block>
              {isBuilding ? '场景搭建中...' : '智能搭建场景'}
            </Button>
          </Card>
        </Col>

        <Col flex="1">
          <Card bordered={false} className="scene-card" title={`场景预览 - ${selectedView}`}>
            <div className="canvas-area">
              {placedElements.length === 0 ? (
                <div className="empty-hint">场景画布 - 生成后预览完整游戏场景</div>
              ) : (
                placedElements.map(el => (
                  <div key={el.id} className="scene-element" style={{ left: `${el.x}%`, top: `${el.y}%`, borderColor: elementColors[el.type], background: `${elementColors[el.type]}15` }}>
                    <IconFont type={elementIcons[el.type]} className="scene-icon" style={{ color: elementColors[el.type] }} />
                    <span style={{ color: elementColors[el.type], fontWeight: 500 }}>{el.type}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
