/**
 * Copy FrameRonin components into src/fr-port and rewrite imports for bisai.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fr = path.join(root, 'FrameRonin-main/FrameRonin-main/frontend/src')
const out = path.join(root, 'src/fr-port')

const files = [
  ['components/SpriteSheetAdjust.tsx', 'components/SpriteSheetAdjust.jsx'],
  ['components/CropPreview.tsx', 'components/CropPreview.jsx'],
  ['components/RoninProCustomScale.tsx', 'components/CustomScaleTool.jsx'],
  ['components/RoninProUnifySize.tsx', 'components/UnifySizeTool.jsx'],
  ['components/RoninProDuplicateFrames.tsx', 'components/DuplicateFramesTool.jsx'],
]

function transform(src) {
  let s = src
  s = s.replace(/^import type .*;\r?\n/gm, '')
  s = s.replace(/@ts-expect-error[^\n]*\n/g, '')
  s = s.replace(/\s+as const\b/g, '')
  s = s.replace(/useState<[^>]+>\(/g, 'useState(')
  s = s.replace(/useRef<[^>]+>\(/g, 'useRef(')
  s = s.replace(/useMemo<[^>]+>\(/g, 'useMemo(')
  s = s.replace(/useCallback<[^>]+>\(/g, 'useCallback(')
  s = s.replace(/Record<[^>]+>/g, 'Object')
  s = s.replace(/: React\.[A-Za-z<>[\]|.&\s]+(?=[,)=])/g, '')
  s = s.replace(/export type [^;]+;/g, '')
  s = s.replace(/export interface [^{]+\{[^}]*\}/gs, '')
  s = s.replace(/^type [^=]+= [^;]+;\r?\n/gm, '')
  s = s.replace(/^interface [^{]+\{[^}]*\}\r?\n/gs, '')
  s = s.replace(/from '\.\.\/i18n\/context'/g, "from '../shims/useLanguage.js'")
  s = s.replace(/from '\.\/StashDropZone'/g, "from '../shims/StashDropZone.jsx'")
  s = s.replace(/from '\.\/StashableImage'/g, "from '../shims/StashableImage.jsx'")
  s = s.replace(/from '\.\/CropPreview'/g, "from './CropPreview.jsx'")
  s = s.replace(/from '\.\/ImageResizeStroke\/ImageFineEditor'/g, "from '../shims/NoopFineEditor.jsx'")
  s = s.replace(/from '\.\.\/lib\/superSplitTransparent'/g, "from '../../lib/frameRonin/superSplitTransparent.js'")
  s = s.replace(
    /from '\.\.\/lib\/sheetProPreprocess'/g,
    "from '../../lib/frameRonin/sheetProPreprocess.js'",
  )
  s = s.replace(/from '\.\.\/lib\/spriteGridDuplicate'/g, "from '../../lib/frameRonin/spriteGridDuplicate.js'")
  s = s.replace(/from '\.\/ParamsStep\/utils'/g, "from '../../lib/frameRonin/imageUtils.js'")
  s = s.replace(
    /export default function SpriteSheetAdjust\(\{ integratedSplit = false \}: SpriteSheetAdjustProps = \{\}\)/,
    'export default function SpriteSheetAdjust({ integratedSplit = false } = {})',
  )
  return s
}

for (const [rel, destRel] of files) {
  const srcPath = path.join(fr, rel)
  const destPath = path.join(out, destRel)
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, transform(fs.readFileSync(srcPath, 'utf8')), 'utf8')
  console.log('wrote', destRel)
}
