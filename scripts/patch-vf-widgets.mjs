import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jsxPath = path.join(__dirname, '../src/pages/VideoFrame/VideoFrame.jsx')
const snippet = fs.readFileSync(path.join(__dirname, 'vf-side-widgets.snippet.jsx'), 'utf8')

let s = fs.readFileSync(jsxPath, 'utf8')

// 1. Remove left rail
const leftRe = /            <aside className="vf-studio-rail vf-studio-rail--left">[\s\S]*?            <\/aside>\n\n/
if (!leftRe.test(s)) {
  console.error('left rail pattern not found')
  process.exit(1)
}
s = s.replace(leftRe, '')

// 2. Replace right rail + history section with side widgets
const rightRe = /            <aside className="vf-studio-rail vf-studio-rail--right">[\s\S]*?          <\/section>\n        <\/motion>/
const rightRe2 = /            <aside className="vf-studio-rail vf-studio-rail--right">[\s\S]*?          <\/section>\n        <\/motion>/
const rightRe3 = /            <aside className="vf-studio-rail vf-studio-rail--right">[\s\S]*?          <\/section>\n        <\/div>/

let matched = false
for (const re of [rightRe3, rightRe2, rightRe]) {
  if (re.test(s)) {
    s = s.replace(re, snippet.trimEnd())
    matched = true
    break
  }
}
if (!matched) {
  console.error('right rail + history pattern not found')
  process.exit(1)
}

fs.writeFileSync(jsxPath, s, 'utf8')
console.log('VideoFrame.jsx patched successfully')
