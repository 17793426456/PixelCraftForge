import SpriteSheetAdjust from './SpriteSheetAdjust.tsx'
import animFrameEdit from '../../constants/features/anim-frame-edit.js'
import assistGridRuler from '../../constants/features/assist-grid-ruler.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'

export default function SheetProTool() {
  return (
    <div className="fr-sheet-pro">
      <FeatureCallout feature={animFrameEdit} />
      <FeatureCallout feature={assistGridRuler} />
      <p className="mb-4 max-w-[800px] text-sm leading-relaxed text-muted-foreground">
        整图均分或按透明区域拆分，支持逐帧偏移、边缘裁剪、拖拽重排与动画预览，可导出 ZIP / GIF / 重组精灵图。内置网格对齐辅助线。
      </p>
      <SpriteSheetAdjust integratedSplit />
    </div>
  )
}
