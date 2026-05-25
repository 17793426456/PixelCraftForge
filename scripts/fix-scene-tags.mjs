import fs from 'fs'
const p = 'src/pages/SceneVisualize/SceneVisualize.jsx'
let s = fs.readFileSync(p, 'utf8')
const before = (s.match(/<\/motion>/g) || []).length
s = s.split('</motion>').join('</div>')
fs.writeFileSync(p, s, 'utf8')
const after = (s.match(/<\/motion>/g) || []).length
console.log('before', before, 'after', after)
