import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Button as ShButton } from '@/components/ui/button'

/** 支持 antd 风格 type / icon / loading 的按钮封装 */
const AppButton = forwardRef(function AppButton({
  type, variant, danger, ghost, loading, icon, children, className, size, ...props
}, ref) {
  let v = variant
  if (!v) {
    if (type === 'primary') v = 'default'
    else if (type === 'text' || ghost) v = 'ghost'
    else if (type === 'link') v = 'link'
    else v = 'outline'
  }
  if (danger) v = 'destructive'
  const sz = size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'default'
  return (
    <ShButton ref={ref} variant={v} size={sz} className={className} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </ShButton>
  )
})

export default AppButton
export { AppButton as Button }
