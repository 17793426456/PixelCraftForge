import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'src/fr-port/components')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx'))

for (const f of files) {
  const p = path.join(dir, f)
  let s = fs.readFileSync(p, 'utf8')
  s = s.replace(/from '\.\.\/i18n\/context'/g, "from '../shims/useLanguage.js'")
  s = s.replace(/from '\.\/StashDropZone'/g, "from '../shims/StashDropZone.jsx'")
  s = s.replace(/from '\.\/StashableImage'/g, "from '../shims/StashableImage.jsx'")
  s = s.replace(/from '\.\/CropPreview'/g, "from './CropPreview.tsx'")
  s = s.replace(/from '\.\/ImageResizeStroke\/ImageFineEditor'/g, "from '../shims/NoopFineEditor.jsx'")
  s = s.replace(/from '\.\.\/lib\/superSplitTransparent'/g, "from '../../lib/frameRonin/superSplitTransparent.js'")
  s = s.replace(/from '\.\.\/lib\/sheetProPreprocess'/g, "from '../../lib/frameRonin/sheetProPreprocess.js'")
  s = s.replace(/from '\.\.\/lib\/spriteGridDuplicate'/g, "from '../../lib/frameRonin/spriteGridDuplicate.js'")
  s = s.replace(/from '\.\/ParamsStep\/utils'/g, "from '../../lib/frameRonin/imageUtils.js'")
  fs.writeFileSync(p, s)
  console.log('fixed', f)
}
