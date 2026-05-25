import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import FileDropzone from '@/components/app/FileDropzone'
import NumberInput from '@/components/app/NumberInput'
import Stack from '@/components/app/Stack'
import AppSegmented from '@/components/app/AppSegmented'
import { message } from '@/lib/ui/notify'
import { superSplitByTransparent } from '../../lib/frameRonin/superSplitTransparent.js'
import { loadImageFromFile, triggerDownload } from '../../lib/frameRonin/gifUtils.js'
import JSZip from 'jszip'

const ACCEPT = ['.png', '.jpg', '.jpeg', '.webp']

function splitGrid(img, cols, rows) {
  const list = []
  const cw = Math.floor(img.naturalWidth / cols)
  const ch = Math.floor(img.naturalHeight / rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch)
      list.push(canvas)
    }
  }
  return list
}

export default function CustomSliceTool() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mode, setMode] = useState('grid')
  const [cols, setCols] = useState(4)
  const [rows, setRows] = useState(4)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const u = URL.createObjectURL(file)
    setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const exportZip = async () => {
    if (!file || !preview) {
      message.warning('请先上传图片')
      return
    }
    setBusy(true)
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image()
        i.onload = () => res(i)
        i.onerror = () => rej(new Error('load'))
        i.src = preview
      })
      let canvases = []
      if (mode === 'grid') {
        canvases = splitGrid(img, Math.max(1, cols), Math.max(1, rows))
      } else {
        let files = null
        if (file.type === 'image/png') {
          try {
            files = await superSplitByTransparent(img, file.name.replace(/\.[^.]+$/, ''))
          } catch {
            files = null
          }
        }
        if (!files?.length) {
          message.warning('透明切分失败，请改用网格切分或确保 PNG 含透明分隔')
          return
        }
        for (const f of files) {
          const subImg = await loadImageFromFile(f)
          const c = document.createElement('canvas')
          c.width = subImg.naturalWidth
          c.height = subImg.naturalHeight
          c.getContext('2d').drawImage(subImg, 0, 0)
          canvases.push(c)
        }
      }
      const zip = new JSZip()
      await Promise.all(
        canvases.map(
          (c, i) =>
            new Promise((resolve) => {
              c.toBlob((blob) => {
                if (blob) zip.file(`frame_${String(i + 1).padStart(3, '0')}.png`, blob)
                resolve()
              }, 'image/png')
            }),
        ),
      )
      const out = await zip.generateAsync({ type: 'blob' })
      triggerDownload(out, 'slices.zip')
      message.success(`已导出 ${canvases.length} 帧`)
    } catch (e) {
      message.error(e?.message || '导出失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack direction="vertical" size="large" style={{ width: '100%' }}>
      <FileDropzone
        accept={ACCEPT.join(',')}
        maxCount={1}
        title="点击或拖拽上传精灵图"
        onFiles={(files) => setFile(files[0] ?? null)}
      />
      {file && (
        <p className="text-sm text-muted-foreground">{file.name}</p>
      )}
      {preview && (
        <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 320, imageRendering: 'pixelated' }} />
      )}
      <AppSegmented
        value={mode}
        onChange={setMode}
        options={[
          { label: '网格切分', value: 'grid' },
          { label: '透明区域切分', value: 'transparent' },
        ]}
      />
      {mode === 'grid' && (
        <Stack wrap align="center">
          <span className="text-sm text-muted-foreground">列</span>
          <NumberInput min={1} max={64} value={cols} onChange={(v) => setCols(v ?? 4)} />
          <span className="text-sm text-muted-foreground">行</span>
          <NumberInput min={1} max={64} value={rows} onChange={(v) => setRows(v ?? 4)} />
        </Stack>
      )}
      <Button disabled={!file || busy} onClick={exportZip}>
        {busy ? <Spinner /> : <Download />}
        导出 ZIP
      </Button>
    </Stack>
  )
}
