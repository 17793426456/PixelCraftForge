import { Tag } from 'antd'

const STATUS_MAP = {
  ready: { color: 'success', label: '可用' },
  beta: { color: 'processing', label: 'Beta' },
  planned: { color: 'default', label: '规划中' },
}

export default function FeatureBadge({ status = 'ready' }) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.ready
  return <Tag color={meta.color}>{meta.label}</Tag>
}
