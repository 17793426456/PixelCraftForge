import { useState } from 'react'
import {
  ArrowLeft,
  Layers,
  Expand,
  Grid2x2,
  Scissors,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomScaleTool from './CustomScaleTool.tsx'
import UnifySizeTool from './UnifySizeTool.tsx'
import DuplicateFramesTool from './DuplicateFramesTool.tsx'
import CustomSliceTool from './CustomSliceTool.jsx'
import imageTransformFilter from '../../constants/features/image-transform-filter.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'

const ENTRIES = [
  { id: 'customScale', Icon: Expand, title: '自定义缩放', desc: '目标尺寸缩放、旋转占位、像素化与调色滤镜预设' },
  { id: 'customSlice', Icon: Scissors, title: '自定义切片', desc: '网格或透明区域切分多帧' },
  { id: 'unifySize', Icon: Grid2x2, title: '统一尺寸', desc: '多图对齐到相同格并合成精灵图' },
  { id: 'duplicateFrames', Icon: Layers, title: '重复帧检测', desc: '找出精灵图中像素级重复的帧' },
]

export default function EfficiencyHub() {
  const [active, setActive] = useState(null)

  if (active) {
    const entry = ENTRIES.find((e) => e.id === active)
    return (
      <div>
        <Button variant="ghost" className="mb-4 px-4" onClick={() => setActive(null)}>
          <ArrowLeft />
          返回效率工具
        </Button>
        {active === 'customScale' && <CustomScaleTool />}
        {active === 'customSlice' && <CustomSliceTool />}
        {active === 'unifySize' && <UnifySizeTool />}
        {active === 'duplicateFrames' && <DuplicateFramesTool />}
        {!entry && null}
      </div>
    )
  }

  return (
    <div>
      <FeatureCallout feature={imageTransformFilter} />
      <p className="mb-5 block px-3 py-2 text-center text-sm leading-relaxed text-muted-foreground">
        浏览器端批量处理，无需登录或后端服务。
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENTRIES.map(({ id, Icon, title, desc }) => (
          <Card
            key={id}
            className="h-full cursor-pointer text-center transition-shadow hover:shadow-md"
            onClick={() => setActive(id)}
          >
            <CardHeader className="items-center px-5 pb-2 pt-5 text-center">
              <Icon className="mx-auto mb-3 size-7 text-[#b55233]" />
              <CardTitle className="w-full text-center text-base">{title}</CardTitle>
              <CardDescription className="px-2 text-center leading-relaxed">{desc}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  )
}
