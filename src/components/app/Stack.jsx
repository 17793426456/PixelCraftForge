import { cn } from '@/lib/utils'

/** 替代 antd Space */
export default function Stack({
  children,
  className,
  direction = 'horizontal',
  size = 'middle',
  wrap = true,
  align,
  style,
}) {
  const gap = size === 'small' ? 'gap-2.5' : size === 'large' ? 'gap-5' : 'gap-3'
  return (
    <div
      className={cn(
        direction === 'vertical' ? 'flex flex-col' : 'flex flex-row',
        wrap && direction !== 'vertical' && 'flex-wrap',
        gap,
        align === 'center' && 'items-center',
        align === 'start' && 'items-start',
        align === 'end' && 'items-end',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
