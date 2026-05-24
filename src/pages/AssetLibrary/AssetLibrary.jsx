import { useState } from 'react'
import { Card, Tag, Input, Button, Row, Col, Space } from 'antd'
import { DownloadOutlined, SwapOutlined, ExportOutlined, AppstoreOutlined } from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
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

  const filtered = mockAssets.filter(a => {
    if (funcFilter !== '全部' && a.funcType !== funcFilter) return false
    if (matFilter !== '全部' && a.matType !== matFilter) return false
    if (searchText && !a.name.includes(searchText)) return false
    return true
  })

  return (
    <div className="library-page">
      <div className="page-header">
        <h2 className="page-title"><AppstoreOutlined /> 素材仓库</h2>
        <p className="page-subtitle">功能 + 材质双重分类体系，统一管理所有 AI 生成与导入的游戏美术素材</p>
      </div>
      <Card bordered={false} className="filter-card">
        <Input.Search placeholder="搜索素材名称..." value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
        <div className="filter-row">
          <span className="filter-label">功能分类：</span>
          <Space wrap size={[6, 6]}>
            {functionCategories.map(c => (
              <Tag key={c} color={funcFilter === c ? 'purple' : 'default'} onClick={() => setFuncFilter(c)} style={{ cursor: 'pointer' }}>{c}</Tag>
            ))}
          </Space>
        </div>
        <div className="filter-row">
          <span className="filter-label">材质分类：</span>
          <Space wrap size={[6, 6]}>
            {materialCategories.map(c => (
              <Tag key={c} color={matFilter === c ? 'blue' : 'default'} onClick={() => setMatFilter(c)} style={{ cursor: 'pointer' }}>{c}</Tag>
            ))}
          </Space>
        </div>
      </Card>

      <div className="library-toolbar">
        <span style={{ color: 'var(--text-secondary)' }}>共 {filtered.length} 个素材</span>
        <Space>
          <Button icon={<DownloadOutlined />}>批量下载</Button>
          <Button icon={<SwapOutlined />}>格式转换</Button>
          <Button icon={<ExportOutlined />}>分层导出</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} justify="center">
        {filtered.map(asset => (
          <Col key={asset.id} xs={12} sm={8} md={6} lg={4}>
            <Card hoverable size="small" cover={<div className="asset-preview"><IconFont type="icon-game" /></div>}>
              <Card.Meta title={asset.name} description={
                <>
                  <div>{asset.funcType} · {asset.matType}</div>
                  <div>{asset.style} · {asset.size}</div>
                </>
              } />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
