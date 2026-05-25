import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 替代 antd Upload.Dragger 的通用拖拽上传区
 */
export default function FileDropzone({
  accept,
  multiple = false,
  maxCount,
  disabled = false,
  className,
  title = '拖拽或点击上传文件',
  hint,
  onFiles,
  children,
}) {
  const inputRef = useRef(null)

  const handleFiles = (fileList) => {
    if (!fileList?.length) return
    let files = Array.from(fileList)
    if (maxCount === 1) files = files.slice(0, 1)
    else if (maxCount) files = files.slice(0, maxCount)
    onFiles?.(files)
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {children ?? (
        <>
          <Upload className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{title}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </div>
  )
}
