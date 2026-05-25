import fs from 'node:fs'
import path from 'node:path'

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory() && !ent.name.startsWith('.') && ent.name !== 'node_modules') {
      walk(p)
    } else if (/\.(jsx|tsx|js|ts)$/.test(ent.name)) {
      let t = fs.readFileSync(p, 'utf8')
      if (!t.includes("from 'antd'") && !t.includes('from "antd"')) continue
      t = t.replace(/from 'antd'/g, "from '@/lib/ui/antd-compat'")
      t = t.replace(/from "antd"/g, "from '@/lib/ui/antd-compat'")
      t = t.replace(/import type \{ UploadFile, UploadProps \} from '@\/lib\/ui\/antd-compat'\r?\n/g, '')
      t = t.replace(/import type \{ UploadFile \} from '@\/lib\/ui\/antd-compat'\r?\n/g, '')
      fs.writeFileSync(p, t, 'utf8')
      console.log(p)
    }
  }
}

walk('src')
