import { Typography } from 'antd'
import SpriteSheetAdjust from './SpriteSheetAdjust.tsx'

const { Text } = Typography

export default function SheetProTool() {
  return (
    <div className="fr-sheet-pro">
      <Text type="secondary" style={{ display: 'block', marginBottom: 16, maxWidth: 800, lineHeight: 1.65 }}>
        整图均分或按透明区域拆分，支持逐帧偏移、边缘裁剪、拖拽重排与动画预览，可导出 ZIP / GIF / 重组精灵图。
      </Text>
      <SpriteSheetAdjust integratedSplit />
    </div>
  )
}
