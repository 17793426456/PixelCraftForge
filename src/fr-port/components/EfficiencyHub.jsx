import { useState } from 'react'
import { Button, Card, Col, Row, Typography } from 'antd'
import {
  ArrowLeftOutlined,
  ClusterOutlined,
  ExpandOutlined,
  MergeCellsOutlined,
  ScissorOutlined,
} from '@ant-design/icons'
import CustomScaleTool from './CustomScaleTool.tsx'
import UnifySizeTool from './UnifySizeTool.tsx'
import DuplicateFramesTool from './DuplicateFramesTool.tsx'
import CustomSliceTool from './CustomSliceTool.jsx'
import imageTransformFilter from '../../constants/features/image-transform-filter.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'

const { Title, Text } = Typography

const ENTRIES = [
  { id: 'customScale', Icon: ExpandOutlined, title: '自定义缩放', desc: '目标尺寸缩放、旋转占位、像素化与调色滤镜预设' },
  { id: 'customSlice', Icon: ScissorOutlined, title: '自定义切片', desc: '网格或透明区域切分多帧' },
  { id: 'unifySize', Icon: MergeCellsOutlined, title: '统一尺寸', desc: '多图对齐到相同格并合成精灵图' },
  { id: 'duplicateFrames', Icon: ClusterOutlined, title: '重复帧检测', desc: '找出精灵图中像素级重复的帧' },
]

export default function EfficiencyHub() {
  const [active, setActive] = useState(null)

  if (active) {
    const entry = ENTRIES.find((e) => e.id === active)
    return (
      <div>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setActive(null)} style={{ marginBottom: 16 }}>
          返回效率工具
        </Button>
        {active === 'customScale' && <CustomScaleTool />}
        {active === 'customSlice' && <CustomSliceTool />}
        {active === 'unifySize' && <UnifySizeTool />}
        {active === 'duplicateFrames' && <DuplicateFramesTool />}
        {!entry && null}
      </div>
    )
  }

  return (
    <div>
      <FeatureCallout feature={imageTransformFilter} />
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        浏览器端批量处理，无需登录或后端服务。
      </Text>
      <Row gutter={[16, 16]}>
        {ENTRIES.map(({ id, Icon, title, desc }) => (
          <Col xs={24} sm={12} lg={6} key={id}>
            <Card hoverable onClick={() => setActive(id)} style={{ height: '100%' }}>
              <Icon style={{ fontSize: 28, color: '#b55233', marginBottom: 12 }} />
              <Title level={5} style={{ margin: '0 0 8px' }}>
                {title}
              </Title>
              <Text type="secondary">{desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
