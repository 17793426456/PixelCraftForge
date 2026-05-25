import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Button as ShButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const iconOnly = !children && icon && !loading
  return (
    <ShButton
      ref={ref}
      variant={v}
      size={iconOnly ? 'icon' : sz}
      className={cn('app-btn text-center', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="size-4 shrink-0 animate-spin" /> : icon}
      {children != null && children !== '' && (
        <span className="app-btn-label text-center">{children}</span>
      )}
    </ShButton>
  )
})

export default AppButton
export { AppButton as Button }
