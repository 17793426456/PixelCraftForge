import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_MAP = {
  ready: { variant: 'default', label: '可用' },
  beta: { variant: 'secondary', label: 'Beta' },
  planned: { variant: 'outline', label: '规划中' },
}

export default function FeatureBadge({ status = 'ready' }) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.ready
  return (
    <Badge variant={meta.variant} className={cn(status === 'ready' && 'bg-primary/20 text-primary hover:bg-primary/25')}>
      {meta.label}
    </Badge>
  )
}
