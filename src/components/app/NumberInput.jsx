import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** 替代 antd InputNumber 的轻量数字输入 */
export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  disabled,
  style,
}) {
  return (
    <Input
      type="number"
      className={cn('w-24', className)}
      style={style}
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') {
          onChange?.(min ?? 0)
          return
        }
        let n = Number(raw)
        if (Number.isNaN(n)) return
        if (min != null) n = Math.max(min, n)
        if (max != null) n = Math.min(max, n)
        onChange?.(n)
      }}
    />
  )
}
