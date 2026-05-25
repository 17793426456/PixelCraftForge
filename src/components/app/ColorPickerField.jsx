import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function ColorPickerField({ value = '#a855f7', onChange, className }) {
  const color = typeof value === 'string' ? value : value?.toHexString?.() ?? '#a855f7'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2 shadow-xs',
            className,
          )}
        >
          <span
            className="size-5 rounded border border-border"
            style={{ background: color }}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">{color}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <HexColorPicker color={color} onChange={onChange} />
        <Input
          className="mt-3 h-8"
          value={color}
          onChange={(e) => onChange(e.target.value)}
        />
      </PopoverContent>
    </Popover>
  )
}
