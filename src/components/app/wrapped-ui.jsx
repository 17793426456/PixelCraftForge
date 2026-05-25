/**
 * 复杂表单项的 shadcn 封装（Tabs items、Upload.Dragger、Modal 等）。
 * 新页面请优先直接使用 @/components/ui/* 与 @/components/app/*，仅复杂场景引用本文件。
 */
import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/app/AppButton'
import { Input as ShInput } from '@/components/ui/input'
import { Textarea as ShTextarea } from '@/components/ui/textarea'
import { Slider as ShSlider } from '@/components/ui/slider'
import { Switch as ShSwitch } from '@/components/ui/switch'
import { Checkbox as ShCheckbox } from '@/components/ui/checkbox'
import { Badge as ShBadge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress as ShProgress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card as ShCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button as ShButton } from '@/components/ui/button'
import FileDropzone from '@/components/app/FileDropzone'
import ColorPickerField from '@/components/app/ColorPickerField'
import NumberInput from '@/components/app/NumberInput'
import Stack from '@/components/app/Stack'
import AppSegmented from '@/components/app/AppSegmented'
import { message } from '@/lib/ui/notify'
import { cn } from '@/lib/utils'

export { message, Button }

const Input = forwardRef(function Input(props, ref) {
  return <ShInput ref={ref} {...props} />
})

Input.TextArea = forwardRef(function TextArea({ rows, ...props }, ref) {
  return <ShTextarea ref={ref} rows={rows} {...props} />
})

Input.Search = forwardRef(function SearchInput(
  { value, onChange, placeholder, allowClear, className, style, ...props },
  ref,
) {
  return (
    <div className={cn('relative', className)} style={style}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <ShInput
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
        {...props}
      />
      {allowClear && value ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="清除"
          onClick={() => onChange?.({ target: { value: '' } })}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
})

function Slider({ value, onChange, min = 0, max = 100, step = 1, className, style, disabled }) {
  return (
    <ShSlider
      min={min}
      max={max}
      step={step}
      value={[value ?? min]}
      onValueChange={([v]) => onChange?.(v)}
      className={className}
      style={style}
      disabled={disabled}
    />
  )
}

function Switch({ checked, onChange, ...props }) {
  return <ShSwitch checked={checked} onCheckedChange={onChange} {...props} />
}

function Checkbox({ checked, onChange, children, ...props }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <ShCheckbox checked={checked} onCheckedChange={onChange} {...props} />
      {children}
    </label>
  )
}

function Tag({ color, children, className }) {
  return <ShBadge variant={color === 'success' ? 'default' : 'secondary'} className={className}>{children}</ShBadge>
}

function Badge({ status, text, children, className, count }) {
  const variant = status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'
  const content = text ?? children ?? count
  if (content == null) return null
  return <ShBadge variant={variant} className={className}>{content}</ShBadge>
}

function Divider({ style, className, orientation = 'horizontal' }) {
  return <Separator orientation={orientation} className={cn('my-4', className)} style={style} />
}

function Modal({ open, title, children, onCancel, onOk, footer, width = 520, className }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="关闭" onClick={onCancel} />
      <div
        className={cn('relative z-10 max-h-[90vh] overflow-auto rounded-lg border border-border bg-card p-6 shadow-xl', className)}
        style={{ width: typeof width === 'number' ? width : width }}
      >
        {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
        <div className="text-sm">{children}</div>
        {(footer != null || onOk) && (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {footer ?? (
              <>
                <ShButton variant="outline" onClick={onCancel}>取消</ShButton>
                <ShButton onClick={onOk}>确定</ShButton>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Progress({ percent, value, className, ...props }) {
  const v = value ?? percent ?? 0
  return <ShProgress value={v} className={className} {...props} />
}

function Spin({ tip, size, children }) {
  if (children) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Spinner className={size === 'large' ? 'size-8' : 'size-5'} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <Spinner className={size === 'large' ? 'size-8' : 'size-5'} />
      {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
    </div>
  )
}

function SelectWrap({ value, onChange, options = [], style, className, placeholder }) {
  return (
    <Select
      value={value != null ? String(value) : undefined}
      onValueChange={(v) => onChange?.(Number.isNaN(Number(v)) ? v : Number(v))}
    >
      <SelectTrigger style={style} className={cn('w-[140px]', className)}>
        <SelectValue placeholder={placeholder} className="w-full justify-center text-center" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function InputNumber({ value, onChange, min, max, step, style, className, disabled, addonBefore }) {
  return (
    <div className="inline-flex items-center gap-2">
      {addonBefore && <span className="text-xs text-muted-foreground">{addonBefore}</span>}
      <NumberInput value={value} onChange={onChange} min={min} max={max} step={step} style={style} className={className} disabled={disabled} />
    </div>
  )
}

function ColorPicker({ value, onChange, className }) {
  return (
    <ColorPickerField
      value={value}
      onChange={(c) => onChange?.(c, typeof c === 'string' ? c : c?.toHexString?.())}
      className={className}
    />
  )
}

function Segmented({ value, onChange, options = [] }) {
  const opts = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o))
  return <AppSegmented value={value} onChange={onChange} options={opts} block />
}

function RadioGroupWrap({ value, onChange, children, ...props }) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-3" {...props}>
      {children}
    </RadioGroup>
  )
}

function RadioButton({ value, children }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <RadioGroupItem value={value} />{children}
    </label>
  )
}

function Radio({ value, children, ...props }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <RadioGroupItem value={value} {...props} />{children}
    </label>
  )
}

Radio.Group = RadioGroupWrap
Radio.Button = RadioButton

function TooltipWrap({ title, children, placement }) {
  if (!title) return children
  const side = placement === 'left' ? 'left' : placement === 'right' ? 'right' : 'top'
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{title}</TooltipContent>
    </Tooltip>
  )
}

function TabsWrap({ activeKey, onChange, items = [], className, destroyInactiveTabPane, size }) {
  const keepAll = destroyInactiveTabPane === false
  return (
    <Tabs value={activeKey} onValueChange={onChange} className={className}>
      <TabsList className={size === 'large' ? 'h-10' : ''}>
        {items.map((item) => (
          <TabsTrigger key={item.key} value={item.key}>{item.label}</TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        keepAll ? (
          <div key={item.key} hidden={activeKey !== item.key} className="pt-4">{item.children}</div>
        ) : (
          <TabsContent key={item.key} value={item.key}>{item.children}</TabsContent>
        )
      ))}
    </Tabs>
  )
}

function Collapse({ items = [], ghost, className, defaultActiveKey }) {
  const defaultValue = Array.isArray(defaultActiveKey) ? defaultActiveKey : defaultActiveKey ? [defaultActiveKey] : undefined
  return (
    <Accordion type="multiple" defaultValue={defaultValue} className={cn(ghost && 'border-none', className)}>
      {items.map((item) => (
        <AccordionItem key={item.key} value={item.key}>
          <AccordionTrigger>{item.label}</AccordionTrigger>
          <AccordionContent>{item.children}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const UPLOAD_LIST_IGNORE = Symbol('upload-list-ignore')

/** 从 antd Upload / 原生 input 统一取出 File */
export function resolveUploadFile(file) {
  if (!file) return null
  if (file instanceof File || file instanceof Blob) return file
  if (file.originFileObj instanceof Blob) return file.originFileObj
  return null
}

function Dragger({ accept, multiple, beforeUpload, onChange, maxCount, variant, style, className, children }) {
  const handleFiles = (files) => {
    const fileList = []
    for (const f of files) {
      const raw = resolveUploadFile(f) ?? f
      if (beforeUpload) {
        const ret = beforeUpload(raw)
        if (ret === UPLOAD_LIST_IGNORE) continue
      }
      fileList.push({
        uid: `${Date.now()}-${fileList.length}`,
        name: raw.name ?? 'file',
        originFileObj: raw,
        status: 'done',
      })
    }
    if (onChange && fileList.length) {
      onChange({ fileList })
    }
  }
  return (
    <FileDropzone
      accept={accept}
      multiple={multiple}
      maxCount={maxCount}
      variant={variant}
      className={className}
      style={style}
      onFiles={handleFiles}
    >
      {children}
    </FileDropzone>
  )
}

function Upload(props) {
  return <Dragger {...props} />
}
Upload.Dragger = Dragger
Upload.LIST_IGNORE = UPLOAD_LIST_IGNORE

function isMenuLabelElement(label) {
  return label != null && typeof label === 'object'
}

function DropdownWrap({ menu, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {(menu?.items ?? []).map((item, i) => {
          if (item?.type === 'divider') {
            return <DropdownMenuSeparator key={`div-${i}`} />
          }
          const key = item.key ?? (typeof item.label === 'string' ? item.label : `item-${i}`)
          if (isMenuLabelElement(item.label)) {
            return (
              <DropdownMenuItem
                key={key}
                className="cursor-pointer p-0 focus:bg-transparent"
                onSelect={(e) => e.preventDefault()}
              >
                {item.label}
              </DropdownMenuItem>
            )
          }
          return (
            <DropdownMenuItem
              key={key}
              disabled={item.disabled}
              onSelect={(e) => {
                if (item.disabled) {
                  e.preventDefault()
                  return
                }
                item.onClick?.()
              }}
            >
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
DropdownWrap.Button = DropdownWrap

function Drawer({ open, onClose, placement = 'left', width = 280, children, className, styles }) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose?.()}>
      <SheetContent side={placement} className={cn('p-0', className)} style={{ width, ...styles?.body }}>
        {children}
      </SheetContent>
    </Sheet>
  )
}

function Menu({ items, selectedKeys, onClick }) {
  return (
    <nav className="flex flex-col gap-1">
      {items?.map((item) => (
        <button
          key={item.key}
          type="button"
          className={cn('rounded-md px-3 py-2 text-left text-sm hover:bg-accent', selectedKeys?.includes(item.key) && 'bg-accent')}
          onClick={() => onClick?.({ key: item.key })}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function Row({ gutter, children, className, style }) {
  const gap = Array.isArray(gutter) ? gutter[0] : gutter ?? 0
  return <div className={cn('flex flex-wrap', className)} style={{ gap, ...style }}>{children}</div>
}

function Col({ span, children, className, style }) {
  const pct = span ? (span / 24) * 100 : 100
  return (
    <div className={cn('min-w-0', className)} style={{ flex: `0 0 ${pct}%`, maxWidth: `${pct}%`, ...style }}>
      {children}
    </div>
  )
}

function Card({ title, children, className, hoverable, ...props }) {
  return (
    <ShCard className={cn(hoverable && 'transition-shadow hover:shadow-md', className)} {...props}>
      {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
      <CardContent>{children}</CardContent>
    </ShCard>
  )
}

const Typography = {
  Text: ({ children, type, className, ...props }) => (
    <span className={cn(type === 'secondary' && 'text-muted-foreground', className)} {...props}>{children}</span>
  ),
  Title: ({ level = 4, children, className, ...props }) => {
    const Tag = level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
    return <Tag className={cn('font-semibold', className)} {...props}>{children}</Tag>
  },
  Paragraph: ({ children, className, ...props }) => (
    <p className={cn('text-sm leading-relaxed', className)} {...props}>{children}</p>
  ),
}

const Space = Stack

export {
  Input,
  Slider,
  Switch,
  Checkbox,
  Tag,
  Badge,
  Progress,
  Spin,
  SelectWrap as Select,
  InputNumber,
  ColorPicker,
  Segmented,
  Radio,
  TooltipWrap as Tooltip,
  TabsWrap as Tabs,
  Collapse,
  Upload,
  DropdownWrap as Dropdown,
  Drawer,
  Menu,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Modal,
  Divider,
}
