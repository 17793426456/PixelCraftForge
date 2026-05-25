import fs from 'node:fs'
import path from 'node:path'

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory() && !ent.name.startsWith('.') && ent.name !== 'node_modules') walk(p)
    else if (/\.(jsx|tsx|js|ts)$/.test(ent.name)) {
      let t = fs.readFileSync(p, 'utf8')
      let changed = false
      if (t.includes('@/lib/ui/antd-compat')) {
        t = t.replaceAll('@/lib/ui/antd-compat', '@/components/app/wrapped-ui')
        changed = true
      }
      if (t.includes("@ant-design/icons")) {
        t = t.replaceAll("@ant-design/icons", '@/lib/icons/antd-lucide')
        changed = true
      }
      if (changed) {
        fs.writeFileSync(p, t, 'utf8')
        console.log(p)
      }
    }
  }
}

walk('src')
