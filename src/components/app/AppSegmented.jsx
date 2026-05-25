import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

/** 替代 antd Segmented */
export default function AppSegmented({ value, onChange, options, className, block }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange?.(v)}
      className={cn(block && 'flex w-full', className)}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return (
          <ToggleGroupItem
            key={val}
            value={val}
            className={cn(block && 'flex-1', 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground')}
          >
            {label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
