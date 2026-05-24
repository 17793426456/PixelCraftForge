import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button, Progress, message, Slider, Checkbox, Space, Dropdown, InputNumber, Select, Segmented, Input, Tooltip } from 'antd'
import {
  ScissorOutlined, CheckCircleOutlined, ReloadOutlined, EyeOutlined,
  DownloadOutlined, SettingOutlined, LoadingOutlined, CloudUploadOutlined,
  PlayCircleOutlined, PauseCircleOutlined, VideoCameraOutlined, ExportOutlined,
} from '@ant-design/icons'
import IconFont from '../../components/IconFont/IconFont'
import {
  extractFrames,
  getSampleTimes,
  revokeVideoAsset,
  createVideoFrameReader,
  normalizeCropArea,
  cropCanvas,
} from '../../lib/videoFrame/video.js'
import { sampleCanvasColor, processExtractedFrame } from '../../lib/videoFrame/chromaKey.js'
import { renderFrameSheet, getSheetAppearance, getLayoutMetrics } from '../../lib/videoFrame/sheet.js'
import { buildAnimatedGif } from '../../lib/videoFrame/gif.js'
import {
  getBaseFileName,
  getSheetFileName,
  getGifFileName,
  getZipFileName,
  buildTransparentFramesZip,
} from '../../lib/videoFrame/exportBundle.js'
import { buildSpineBundleZip, getSpineZipFileName } from '../../lib/videoFrame/spineBundle.js'
import { formatTimestamp } from '../../lib/videoFrame/time.js'
import './VideoFrame.css'

const MAX_EXTRACTED_FRAMES = 180
const DEFAULT_FPS = 8

const HISTORY_KEY = 'pixelcraft-vf-history'
const MAX_HISTORY = 12

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function formatHistoryTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const EXPORT_FRAME_PRESETS = [
  { value: null, label: '原始尺寸' },
  { value: 32, label: '32px' },
  { value: 64, label: '64px' },
  { value: 128, label: '128px' },
  { value: 256, label: '256px' },
]

const ACCEPT_EXT = ['.mp4', '.avi', '.mov']
const ACCEPT_MIME = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi']

const STEPS = [
  { key: 'upload', icon: 'icon-video', label: '上传动作视频' },
  { key: 'extract', icon: 'icon-search', label: 'AI 智能抽帧抠图' },
  { key: 'sprite', icon: 'icon-image', label: '生成导出精灵资源' },
]

const TIP_ITEMS = [
  {
    Icon: VideoCameraOutlined,
    title: '视频准备',
    desc: '上传 5–30 秒循环动作，背景尽量使用纯色，提升抠图效果',
  },
  {
    Icon: SettingOutlined,
    title: '帧率设置',
    desc: '像素角色推荐 8–12 FPS，3D 演示 / 技能动画推荐 12–24 FPS',
  },
  {
    Icon: ExportOutlined,
    title: '导出选项',
    desc: '开启智能抠图后，可导出透明 PNG 序列与 Spine 工程包',
  },
]

function statusTone(type, value, { videoFile, isProcessing, extractComplete, progress }) {
  if (type === 'video') return videoFile ? 'success' : 'idle'
  if (type === 'frames') {
    if (value !== '等待识别' && value !== '识别中…') return 'success'
    if (value === '识别中…') return 'active'
    return 'idle'
  }
  if (type === 'progress') {
    if (extractComplete) return 'success'
    if (isProcessing) return 'active'
    return 'idle'
  }
  return 'idle'
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(sec) {
  if (!sec || !Number.isFinite(sec)) return '--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} 秒`
}

function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildSheetOptions(columns, gap, frameSize) {
  return {
    columns,
    gap,
    backgroundColor: '#14141f',
    frameSize,
  }
}

function getOutputMeta(sourceMeta, frames) {
  if (!frames?.length) return sourceMeta
  return {
    ...sourceMeta,
    width: frames[0].image.width,
    height: frames[0].image.height,
  }
}

function buildChromaOptions(sample, tolerance, softness) {
  return {
    sample,
    tolerance,
    softness,
    despill: 0.45,
    sampleRadius: 4,
    edgeRadius: 2,
    smoothing: true,
    despillEnabled: true,
    algorithm: 'enhanced',
  }
}

export default function VideoFrame() {
  const [videoFile, setVideoFile] = useState(null)
  const [frames, setFrames] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [extractComplete, setExtractComplete] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [extractError, setExtractError] = useState('')
  const [showAdjust, setShowAdjust] = useState(false)
  const [framesPerSecond, setFramesPerSecond] = useState(DEFAULT_FPS)
  const [removeBg, setRemoveBg] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [estimatedTotal, setEstimatedTotal] = useState(0)
  const [segmentRange, setSegmentRange] = useState([0, 0])
  const [cropArea, setCropArea] = useState(null)
  const [colorSample, setColorSample] = useState(null)
  const [chromaTolerance, setChromaTolerance] = useState(0.35)
  const [chromaSoftness, setChromaSoftness] = useState(0.15)
  const [sheetColumns, setSheetColumns] = useState(4)
  const [sheetGap, setSheetGap] = useState(4)
  const [exportFrameSize, setExportFrameSize] = useState(null)
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState('')
  const [previewMode, setPreviewMode] = useState('grid')
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [animationIndex, setAnimationIndex] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [history, setHistory] = useState(() => loadHistory())
  const [spineSkeletonName, setSpineSkeletonName] = useState('character')
  const [spineAnimationName, setSpineAnimationName] = useState('idle')
  const [spineSlotName, setSpineSlotName] = useState('body')

  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const dragCounter = useRef(0)
  const assetsRef = useRef(null)
  const refCanvasRef = useRef(null)
  const animCanvasRef = useRef(null)
  const sheetPreviewUrlRef = useRef('')

  const segmentStart = segmentRange[0] ?? 0
  const segmentEnd = segmentRange[1] ?? videoFile?.duration ?? 0

  const estimatedFrameCount = useMemo(() => {
    if (!videoFile?.duration) return 0
    return getSampleTimes(videoFile.duration, framesPerSecond, segmentStart, segmentEnd).length
  }, [videoFile?.duration, framesPerSecond, segmentStart, segmentEnd])

  const sheetOptions = useMemo(
    () => buildSheetOptions(sheetColumns, sheetGap, exportFrameSize),
    [sheetColumns, sheetGap, exportFrameSize],
  )

  const layoutEstimate = useMemo(() => {
    if (!videoFile || !estimatedFrameCount) return null
    const meta = {
      duration: videoFile.duration,
      width: videoFile.width,
      height: videoFile.height,
      name: videoFile.name,
    }
    return getLayoutMetrics(meta, estimatedFrameCount, sheetOptions, false)
  }, [videoFile, estimatedFrameCount, sheetOptions])

  const revokeSheetPreview = useCallback(() => {
    if (sheetPreviewUrlRef.current) {
      URL.revokeObjectURL(sheetPreviewUrlRef.current)
      sheetPreviewUrlRef.current = ''
    }
    setSheetPreviewUrl('')
  }, [])

  const activeStepIndex = !videoFile ? 0 : extractComplete ? 2 : 1

  useEffect(() => () => revokeSheetPreview(), [revokeSheetPreview])

  useEffect(() => {
    if (videoFile?.duration) {
      setSegmentRange([0, videoFile.duration])
    }
  }, [videoFile?.duration, videoFile?.url])

  useEffect(() => {
    if (!videoFile?.url) return undefined
    let cancelled = false
    let reader = null

    ;(async () => {
      try {
        reader = await createVideoFrameReader(videoFile.url)
        const frame = await reader.captureFrameAt(segmentStart)
        const normalizedCrop = cropArea
          && (cropArea.leftPercent !== 0
            || cropArea.topPercent !== 0
            || cropArea.widthPercent !== 100
            || cropArea.heightPercent !== 100)
          ? normalizeCropArea(cropArea)
          : null
        const cropped = cropCanvas(frame, normalizedCrop)
        if (cancelled) return
        const canvas = refCanvasRef.current
        if (!canvas) return
        canvas.width = cropped.width
        canvas.height = cropped.height
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
        ctx?.drawImage(cropped, 0, 0)
      } catch {
        /* ignore preview load errors */
      }
    })()

    return () => {
      cancelled = true
      reader?.dispose()
    }
  }, [videoFile?.url, segmentStart, cropArea])

  useEffect(() => {
    if (previewMode !== 'animation' || !animationPlaying || !assetsRef.current) return undefined
    const source = assetsRef.current.processed ?? assetsRef.current.frames
    if (!source.length) return undefined
    const timer = window.setInterval(() => {
      setAnimationIndex((current) => (current + 1) % source.length)
    }, 1000 / Math.min(Math.max(framesPerSecond, 1), 24))
    return () => window.clearInterval(timer)
  }, [previewMode, animationPlaying, framesPerSecond, frames.length])

  useEffect(() => {
    if (previewMode !== 'animation' || !assetsRef.current) return
    const source = assetsRef.current.processed ?? assetsRef.current.frames
    const frame = source[animationIndex]
    const canvas = animCanvasRef.current
    if (!frame || !canvas) return
    const image = frame.processedImage ?? frame.image
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    ctx?.drawImage(image, 0, 0)
  }, [previewMode, animationIndex, frames.length])

  const getStepStatus = (index) => {
    if (index < activeStepIndex) return 'done'
    if (index === activeStepIndex) return 'active'
    return 'pending'
  }

  const validateFile = (file) => {
    const ext = ACCEPT_EXT.some(e => file.name.toLowerCase().endsWith(e))
    const mimeOk = ACCEPT_MIME.includes(file.type) || file.type === ''
    if (!ext && !mimeOk) {
      setUploadError('上传失败：文件格式不支持，请检查后重新上传（支持 MP4 / AVI / MOV）')
      return false
    }
    if (file.size > 500 * 1024 * 1024) {
      setUploadError('上传失败：文件大小超出限制（≤ 500MB），请检查后重新上传')
      return false
    }
    setUploadError('')
    return true
  }

  const loadVideoMeta = useCallback((file) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      if (video.duration < 2) {
        setUploadError('上传失败：视频时长过短，请上传 ≥ 2 秒的动作视频')
        URL.revokeObjectURL(url)
        return
      }
      if (video.duration > 60) {
        message.warning('视频较长，抽帧可能耗时更久，建议 5-30 秒效果更佳')
      }
      setVideoFile({
        name: file.name,
        url,
        size: file.size,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        resolution: `${video.videoWidth}×${video.videoHeight}`,
      })
      assetsRef.current = null
      setExtractComplete(false)
      setFrames([])
      setExtractError('')
      setCropArea(null)
      setColorSample(null)
      revokeSheetPreview()
      setPreviewMode('grid')
      setAnimationPlaying(false)
      message.success('视频上传成功')
    }
    video.onerror = () => {
      setUploadError('上传失败：无法读取视频文件，请换用 MP4 格式后重新上传')
      URL.revokeObjectURL(url)
    }
    video.src = url
  }, [])

  const handleRefCanvasClick = (event) => {
    const canvas = refCanvasRef.current
    if (!canvas || !removeBg) return
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height
    setColorSample(sampleCanvasColor(canvas, x, y, 4))
  }

  const handleFile = (file) => {
    if (!file || !validateFile(file)) return
    loadVideoMeta(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    dragCounter.current += 1
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOver(false)
    }
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleReupload = () => {
    if (videoFile?.url) revokeVideoAsset(videoFile.url)
    revokeSheetPreview()
    setVideoFile(null)
    setFrames([])
    assetsRef.current = null
    setExtractComplete(false)
    setProgress(0)
    setFrameCount(0)
    setEstimatedTotal(0)
    setUploadError('')
    setExtractError('')
    setIsProcessing(false)
    setCropArea(null)
    setColorSample(null)
    setPreviewMode('grid')
    setAnimationPlaying(false)
    setStatusText('')
  }

  const getVideoMeta = useCallback(() => ({
    duration: videoFile.duration,
    width: videoFile.width,
    height: videoFile.height,
    name: videoFile.name,
  }), [videoFile])

  const generateSheetPreview = async (assets) => {
    if (!assets || !videoFile) return
    const transparent = Boolean(assets.processed)
    const framesForRender = transparent
      ? assets.processed.map((frame) => ({
        image: frame.processedImage,
        time: frame.time,
        label: frame.label,
      }))
      : assets.frames
    const outputMeta = getOutputMeta(getVideoMeta(), assets.frames)
    const result = await renderFrameSheet(
      framesForRender,
      outputMeta,
      sheetOptions,
      false,
      getSheetAppearance(transparent),
    )
    revokeSheetPreview()
    sheetPreviewUrlRef.current = result.objectUrl
    setSheetPreviewUrl(result.objectUrl)
  }

  const handleExtract = async () => {
    if (!videoFile || isProcessing) return
    if (videoFile.duration < 2) {
      setExtractError('视频过短，请上传时长 ≥ 2 秒的视频')
      return
    }

    const meta = getVideoMeta()
    const sampleTimes = getSampleTimes(meta.duration, framesPerSecond, segmentStart, segmentEnd)
    if (sampleTimes.length > MAX_EXTRACTED_FRAMES) {
      setExtractError(`预计提取 ${sampleTimes.length} 帧，超过上限 ${MAX_EXTRACTED_FRAMES}，请降低 FPS 或缩短片段`)
      return
    }
    if (removeBg && !colorSample) {
      message.warning('开启抠图后，请先在参考帧上点击背景色')
      return
    }

    setIsProcessing(true)
    setExtractComplete(false)
    setProgress(0)
    setFrameCount(0)
    setEstimatedTotal(sampleTimes.length)
    setExtractError('')
    setStatusText('正在抽取序列帧…')
    assetsRef.current = null
    revokeSheetPreview()
    setAnimationPlaying(false)
    setAnimationIndex(0)

    try {
      const normalizedCrop = cropArea
        && (cropArea.leftPercent !== 0
          || cropArea.topPercent !== 0
          || cropArea.widthPercent !== 100
          || cropArea.heightPercent !== 100)
        ? normalizeCropArea(cropArea)
        : null
      const extracted = await extractFrames(
        videoFile.url,
        meta,
        {
          framesPerSecond,
          segmentStart,
          segmentEnd,
          cropArea: normalizedCrop,
        },
        (current, total) => {
          setFrameCount(current)
          setEstimatedTotal(total)
          setProgress(Math.round((current / total) * 100))
          setStatusText(`正在抽取序列帧 ${current}/${total}…`)
        },
      )

      let processed = null
      if (removeBg && extracted.length > 0) {
        const sample = colorSample ?? sampleCanvasColor(extracted[0].image, 8, 8, 4)
        const colorKeyOptions = buildChromaOptions(sample, chromaTolerance, chromaSoftness)
        processed = []
        for (let index = 0; index < extracted.length; index += 1) {
          setStatusText(`正在抠像 ${index + 1}/${extracted.length}…`)
          processed.push(processExtractedFrame(extracted[index], colorKeyOptions))
          if (index % 2 === 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve))
          }
        }
      }

      const assets = { frames: extracted, processed }
      assetsRef.current = assets
      const displaySource = processed ?? extracted
      setFrames(displaySource.map((frame, index) => ({
        id: index + 1,
        name: frame.label || `帧_${index + 1}`,
        previewUrl: (frame.processedImage ?? frame.image).toDataURL('image/png'),
      })))
      setExtractComplete(true)
      setStatusText('正在生成精灵图预览…')
      await generateSheetPreview(assets)
      setStatusText('')
      const thumbUrl = displaySource[0]
        ? (displaySource[0].processedImage ?? displaySource[0].image).toDataURL('image/png')
        : ''
      const entry = {
        id: `${Date.now()}`,
        fileName: videoFile.name,
        frameCount: displaySource.length,
        fps: framesPerSecond,
        removeBg,
        createdAt: Date.now(),
        thumbUrl,
      }
      try {
        const next = [entry, ...loadHistory()].slice(0, MAX_HISTORY)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
        setHistory(next)
      } catch {
        /* ignore */
      }
      message.success(`抽帧完成！共 ${displaySource.length} 帧${removeBg ? '（已抠图）' : ''}`)
    } catch (error) {
      setExtractError(error instanceof Error && error.message
        ? `处理失败：${error.message}`
        : '处理失败：视频关键帧识别失败，请尝试更换背景更干净、动作更清晰的视频')
      setStatusText('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportSheet = async () => {
    const assets = assetsRef.current
    if (!assets || !videoFile) {
      message.warning('请先完成抽帧')
      return
    }
    setExporting(true)
    try {
      const transparent = Boolean(assets.processed)
      const framesForRender = transparent
        ? assets.processed.map((frame) => ({
          image: frame.processedImage,
          time: frame.time,
          label: frame.label,
        }))
        : assets.frames
      const outputMeta = getOutputMeta(getVideoMeta(), assets.frames)
      const result = await renderFrameSheet(
        framesForRender,
        outputMeta,
        sheetOptions,
        false,
        getSheetAppearance(transparent),
      )
      const baseName = getBaseFileName(videoFile.name)
      triggerBlobDownload(result.blob, getSheetFileName(baseName, transparent))
      message.success('精灵图已下载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出精灵图失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExportGif = async () => {
    const assets = assetsRef.current
    if (!assets || !videoFile) {
      message.warning('请先完成抽帧')
      return
    }
    setExporting(true)
    try {
      const transparent = Boolean(assets.processed)
      const framesForGif = transparent
        ? assets.processed.map((frame) => ({
          image: frame.processedImage,
          time: frame.time,
          label: frame.label,
        }))
        : assets.frames
      setStatusText('正在编码 GIF…')
      const blob = await buildAnimatedGif(framesForGif, {
        fps: framesPerSecond,
        transparent,
        onProgress: (progressInfo) => {
          if (progressInfo.phase === 'palette') {
            setStatusText(`GIF 调色板 ${progressInfo.current}/${progressInfo.total}`)
          } else {
            setStatusText(`GIF 编码 ${progressInfo.current}/${progressInfo.total}`)
          }
        },
      })
      triggerBlobDownload(blob, getGifFileName(getBaseFileName(videoFile.name), transparent))
      setStatusText('')
      message.success('GIF 已下载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出 GIF 失败')
      setStatusText('')
    } finally {
      setExporting(false)
    }
  }

  const handleExportZip = async () => {
    const assets = assetsRef.current
    if (!assets?.processed) {
      message.warning('透明帧 ZIP 需先开启抠图并完成抽帧')
      return
    }
    setExporting(true)
    try {
      const blob = await buildTransparentFramesZip(assets.processed, getBaseFileName(videoFile.name))
      triggerBlobDownload(blob, getZipFileName(getBaseFileName(videoFile.name)))
      message.success('透明帧 ZIP 已下载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出 ZIP 失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExportSpine = async () => {
    const assets = assetsRef.current
    if (!assets || !videoFile) {
      message.warning('请先完成抽帧')
      return
    }
    setExporting(true)
    try {
      const transparent = Boolean(assets.processed)
      const spineFrames = (transparent ? assets.processed : assets.frames).map((frame) => ({
        image: frame.processedImage ?? frame.image,
        time: frame.time,
        label: frame.label,
      }))
      const outputMeta = getOutputMeta(getVideoMeta(), assets.frames)
      const blob = await buildSpineBundleZip(
        {
          frames: spineFrames,
          baseName: getBaseFileName(videoFile.name),
          width: outputMeta.width,
          height: outputMeta.height,
          transparent,
        },
        {
          skeletonName: spineSkeletonName,
          animationName: spineAnimationName,
          slotName: spineSlotName,
          fps: framesPerSecond,
        },
      )
      triggerBlobDownload(blob, getSpineZipFileName(getBaseFileName(videoFile.name)))
      message.success('Spine 资源包已下载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Spine 导出失败')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (extractComplete && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [extractComplete])

  const btnState = extractComplete
    ? 'complete'
    : isProcessing
      ? 'loading'
      : videoFile
        ? 'ready'
        : 'disabled'

  const pageCentered = !extractComplete && frames.length === 0 && !isProcessing

  const frameStatLabel = frames.length > 0
    ? `${frames.length} 帧`
    : isProcessing
      ? '识别中…'
      : '等待识别'

  const progressStatLabel = extractComplete
    ? '已完成'
    : isProcessing
      ? `${progress}% 处理中`
      : '待处理'

  const handleMainBtnClick = () => {
    if (btnState === 'complete') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (btnState === 'disabled') {
      inputRef.current?.click()
      return
    }
    void handleExtract()
  }

  return (
    <div className={`vf-page atelier-page-wrap ${pageCentered ? 'vf-page--centered' : ''}`}>
      <div className="vf-page-bg" aria-hidden="true" />
      <div className="vf-page-grid" aria-hidden="true" />

      <div className="atelier-page vf-page-studio">
        <header className="atelier-hero atelier-hero--center atelier-enter">
          <div className="atelier-title-row">
            <ScissorOutlined />
            <h1 className="atelier-title">AI 游戏视频智能抽帧 | 一键生成精灵图集</h1>
          </div>
          <p className="atelier-subtitle">
            专为游戏美术打造，上传角色动作视频，AI 自动识别关键帧、智能抠图，一键导出精灵图 / Spine 骨骼包，告别逐帧手动处理
          </p>
        </header>

        <div className="vf-studio-stack atelier-enter atelier-enter--1">
          <div className="vf-studio-row">
            <div className="vf-studio-main">
            <div className="vf-page-center">

      {/* 流程提示条 */}
      <div className="vf-steps">
        {STEPS.map((step, index) => {
          const status = getStepStatus(index)
          return (
            <div key={step.key} className={`vf-step vf-step--${status}`}>
              <div className="vf-step-node">
                {status === 'done' ? (
                  <CheckCircleOutlined className="vf-step-check" />
                ) : (
                  <IconFont type={step.icon} className="vf-step-icon" />
                )}
              </div>
              <span className="vf-step-label">
                {index + 1}. {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`vf-step-line ${status === 'done' ? 'vf-step-line--done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>
      <p className="vf-steps-hint">全程自动处理，无需人工干预，5 分钟搞定游戏美术素材</p>

      {/* 上传区 */}
      <div
        className={[
          'vf-upload-zone',
          dragOver && 'is-dragging',
          videoFile && 'is-success',
          uploadError && 'is-error',
        ].filter(Boolean).join(' ')}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !videoFile && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !videoFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_EXT.join(',')}
          className="vf-upload-input"
          onChange={handleInputChange}
        />

        {!videoFile ? (
          <>
            <div className={`vf-upload-icon-wrap ${dragOver ? 'is-float' : ''}`}>
              {uploadError ? (
                <IconFont type="icon-clear" className="vf-upload-icon vf-upload-icon--error" />
              ) : (
                <Tooltip title="支持拖拽或点击上传，推荐纯色背景、5–30 秒循环动作视频">
                  <CloudUploadOutlined className="vf-upload-icon" />
                </Tooltip>
              )}
              <IconFont type="icon-magic" className="vf-upload-ai-badge" />
            </div>
            {dragOver ? (
              <p className="vf-upload-main">松手即可上传</p>
            ) : (
              <>
                <p className="vf-upload-main">拖拽或点击上传角色动作视频</p>
                <div className="vf-upload-hints">
                  <p className="vf-upload-hint">支持格式：MP4 / AVI / MOV</p>
                  <p className="vf-upload-hint">单文件上限：≤ 500MB</p>
                </div>
                {!uploadError && (
                  <p className="vf-upload-empty-guide">
                    还没有上传视频？试试上传一段角色待机 / 攻击的循环动画，AI 帮你一键生成游戏美术素材
                  </p>
                )}
              </>
            )}
            {uploadError && <p className="vf-upload-error">{uploadError}</p>}
          </>
        ) : (
          <div className="vf-upload-success" onClick={(e) => e.stopPropagation()}>
            <div className="vf-video-thumb-wrap">
              <video src={videoFile.url} className="vf-video-thumb" muted />
              <span className="vf-video-check"><CheckCircleOutlined /></span>
            </div>
            <div className="vf-video-meta">
              <p className="vf-video-name">{videoFile.name}</p>
              <div className="vf-video-tags">
                <span>{formatDuration(videoFile.duration)}</span>
                <span>{videoFile.resolution}</span>
                <span>{formatSize(videoFile.size)}</span>
              </div>
            </div>
            <Space className="vf-video-actions">
              <Button size="small" icon={<EyeOutlined />} onClick={() => window.open(videoFile.url)}>
                预览
              </Button>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleReupload}>
                重新上传
              </Button>
            </Space>
          </div>
        )}
      </div>

      <div className="vf-scene-tips">
        <p className="vf-scene-tip">场景适配：2D 像素角色、3D 模型演示、技能循环动画</p>
        <p className="vf-scene-tip">建议设置：时长 5–30 秒，帧率 8–24 FPS，背景纯色更易抠图</p>
      </div>

      {videoFile && !extractComplete && (
        <div className="vf-advanced-panel">
          <div className="vf-panel-block">
            <div className="vf-panel-title"><IconFont type="icon-video" /> 片段截取</div>
            <div className="vf-segment-meta">
              <span>{formatTimestamp(segmentStart)} — {formatTimestamp(segmentEnd)}</span>
              <span>预计 {estimatedFrameCount} 帧 · 片段 {formatDuration(segmentEnd - segmentStart)}</span>
            </div>
            <Slider
              range
              min={0}
              max={videoFile.duration}
              step={0.1}
              value={segmentRange}
              onChange={setSegmentRange}
              disabled={isProcessing}
              tooltip={{ formatter: (v) => formatTimestamp(v) }}
            />
          </div>

          <div className="vf-panel-block">
            <div className="vf-panel-title">
              <IconFont type="icon-expand" /> 画面裁剪
              {cropArea && (
                <Button size="small" type="link" onClick={() => setCropArea(null)} disabled={isProcessing}>
                  重置
                </Button>
              )}
            </div>
            <div className="vf-crop-grid">
              {[
                { key: 'leftPercent', label: '左偏移 %' },
                { key: 'topPercent', label: '上偏移 %' },
                { key: 'widthPercent', label: '宽度 %' },
                { key: 'heightPercent', label: '高度 %' },
              ].map(({ key, label }) => (
                <label key={key}>
                  {label}
                  <InputNumber
                    min={key.includes('width') || key.includes('height') ? 10 : 0}
                    max={100}
                    value={cropArea?.[key] ?? (key.includes('width') || key.includes('height') ? 100 : 0)}
                    onChange={(val) => setCropArea((prev) => ({
                      leftPercent: prev?.leftPercent ?? 0,
                      topPercent: prev?.topPercent ?? 0,
                      widthPercent: prev?.widthPercent ?? 100,
                      heightPercent: prev?.heightPercent ?? 100,
                      [key]: val ?? 0,
                    }))}
                    disabled={isProcessing}
                    style={{ width: '100%' }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="vf-panel-block">
            <div className="vf-panel-title"><IconFont type="icon-setting" /> 抽帧与导出</div>
            <div className="vf-extract-options" style={{ margin: 0, maxWidth: 'none', padding: 0, border: 'none', background: 'transparent' }}>
              <div className="vf-adjust-item">
                <span>抽帧速率（{framesPerSecond} FPS）</span>
                <Slider min={1} max={24} value={framesPerSecond} onChange={setFramesPerSecond} disabled={isProcessing} />
              </div>
              <Checkbox checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} disabled={isProcessing}>
                色键抠图（点击参考帧取背景色）
              </Checkbox>
            </div>
            {removeBg && (
              <>
                <div className="vf-ref-canvas-wrap" onClick={handleRefCanvasClick} role="presentation">
                  <canvas ref={refCanvasRef} className="vf-ref-canvas" />
                </div>
                {colorSample ? (
                  <div className="vf-color-badge">
                    <span className="vf-color-swatch" style={{ background: colorSample.hex }} />
                    <span>{colorSample.hex} · 点击画面可重新取色</span>
                    <Button size="small" type="link" onClick={() => setColorSample(null)}>清除</Button>
                  </div>
                ) : (
                  <p className="vf-scene-tip" style={{ marginTop: 8 }}>在参考帧上点击背景区域以取色</p>
                )}
                <div className="vf-adjust-item" style={{ marginTop: 12 }}>
                  <span>容差 {Math.round(chromaTolerance * 100)}%</span>
                  <Slider min={0.05} max={0.8} step={0.01} value={chromaTolerance} onChange={setChromaTolerance} disabled={isProcessing} />
                </div>
                <div className="vf-adjust-item">
                  <span>羽化 {Math.round(chromaSoftness * 100)}%</span>
                  <Slider min={0} max={0.5} step={0.01} value={chromaSoftness} onChange={setChromaSoftness} disabled={isProcessing} />
                </div>
              </>
            )}
            <div className="vf-export-grid" style={{ marginTop: 16 }}>
              <label>
                列数
                <InputNumber min={1} max={8} value={sheetColumns} onChange={(v) => setSheetColumns(v ?? 4)} style={{ width: '100%' }} />
              </label>
              <label>
                间距
                <InputNumber min={0} max={48} value={sheetGap} onChange={(v) => setSheetGap(v ?? 4)} style={{ width: '100%' }} />
              </label>
              <label>
                单帧尺寸
                <Select
                  value={exportFrameSize}
                  onChange={setExportFrameSize}
                  options={EXPORT_FRAME_PRESETS}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
            {layoutEstimate && (
              <p className="vf-layout-estimate">
                预估精灵图：{layoutEstimate.canvasWidth} × {layoutEstimate.canvasHeight} px
              </p>
            )}
          </div>
        </div>
      )}

      {/* 主操作按钮 */}
      <div className="vf-action-wrap">
        <button
          type="button"
          className={`vf-main-btn vf-main-btn--${btnState}`}
          disabled={btnState === 'loading'}
          onClick={handleMainBtnClick}
        >
          {btnState === 'loading' && <LoadingOutlined className="vf-btn-spinner" spin />}
          {btnState === 'complete' && <CheckCircleOutlined />}
          {btnState === 'ready' && <ScissorOutlined />}
          <span>
            {btnState === 'disabled' && '上传视频开始处理'}
            {btnState === 'ready' && '开始 AI 抽帧处理'}
            {btnState === 'loading' && 'AI 正在分析动作帧…'}
            {btnState === 'complete' && `抽帧完成！查看图集（${frames.length} 帧）`}
          </span>
        </button>

        {isProcessing && (
          <div className="vf-progress-block">
            <div className="vf-progress-head">
              <span>正在抽取序列帧 {progress}%</span>
              <span>{frameCount} / {estimatedTotal || '…'} 帧</span>
            </div>
            <Progress
              percent={progress}
              showInfo={false}
              strokeColor={{ from: '#a855f7', to: '#ec4899' }}
              trailColor="rgba(255,255,255,0.08)"
            />
          </div>
        )}

        {extractError && <p className="vf-extract-error">{extractError}</p>}
        {statusText && <p className="vf-status-text">{statusText}</p>}
      </div>

      {/* 结果预览区 */}
      {(frames.length > 0 || isProcessing) && (
        <section ref={resultsRef} className="vf-results">
          <div className="vf-results-header">
            <h2 className="vf-results-title">
              <IconFont type="icon-image" /> 精灵图集预览
              {frames.length > 0 && <span className="vf-results-count">共 {frames.length} 个关键帧</span>}
            </h2>
            {frames.length > 0 && (
              <Space>
                <Tooltip title="带序列帧的 PNG 图集，直接用于游戏引擎">
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    className="vf-download-btn"
                    loading={exporting}
                    onClick={() => { void handleExportSheet() }}
                  >
                    下载精灵图
                  </Button>
                </Tooltip>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'gif', label: '下载 GIF 动图', onClick: () => { void handleExportGif() } },
                      { key: 'zip', label: '下载透明帧 ZIP', disabled: !removeBg, onClick: () => { void handleExportZip() } },
                      { key: 'spine', label: '下载 Spine ZIP', onClick: () => { void handleExportSpine() } },
                    ],
                  }}
                  disabled={exporting}
                >
                  <Tooltip title="GIF / 透明 ZIP / Spine 等多种格式导出">
                    <Button icon={<DownloadOutlined />}>更多导出</Button>
                  </Tooltip>
                </Dropdown>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowAdjust(!showAdjust)}
                >
                  调整参数
                </Button>
              </Space>
            )}
          </div>

          {showAdjust && frames.length > 0 && (
            <div className="vf-adjust-panel">
              <div className="vf-adjust-item">
                <span>抽帧速率（{framesPerSecond} FPS，重新抽帧后生效）</span>
                <Slider min={1} max={24} value={framesPerSecond} onChange={setFramesPerSecond} />
              </div>
              <Checkbox checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)}>
                自动抠图（重新抽帧后生效）
              </Checkbox>
              <Button size="small" type="link" onClick={() => { void handleExtract() }} disabled={isProcessing}>
                按新参数重新抽帧
              </Button>
            </div>
          )}

          {frames.length > 0 && (
            <div className="vf-preview-toolbar">
              <Segmented
                value={previewMode}
                onChange={setPreviewMode}
                options={[
                  { label: '帧网格', value: 'grid' },
                  { label: '精灵图', value: 'sheet' },
                  { label: '动画', value: 'animation' },
                ]}
              />
            </div>
          )}

          {previewMode === 'sheet' && sheetPreviewUrl && (
            <div className="vf-sheet-preview">
              <img src={sheetPreviewUrl} alt="精灵图预览" />
            </div>
          )}

          {previewMode === 'animation' && frames.length > 0 && (
            <div className="vf-anim-preview">
              <canvas ref={animCanvasRef} className="vf-anim-canvas" />
              <div className="vf-anim-toolbar">
                <Button
                  icon={animationPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={() => setAnimationPlaying((v) => !v)}
                >
                  {animationPlaying ? '暂停' : '播放'}
                </Button>
                <Button onClick={() => { setAnimationIndex(0); setAnimationPlaying(true) }}>重播</Button>
                <span className="vf-scene-tip" style={{ margin: 0 }}>
                  帧 {animationIndex + 1} / {frames.length} · {Math.min(Math.max(framesPerSecond, 1), 24)} FPS
                </span>
              </div>
            </div>
          )}

          {extractComplete && (
          <div className="vf-spine-panel">
            <div className="vf-panel-title"><IconFont type="icon-model" /> Spine 导出</div>
            <div className="vf-spine-fields">
              <label>
                骨骼名
                <Input value={spineSkeletonName} onChange={(e) => setSpineSkeletonName(e.target.value)} />
              </label>
              <label>
                动画名
                <Input value={spineAnimationName} onChange={(e) => setSpineAnimationName(e.target.value)} />
              </label>
              <label>
                插槽名
                <Input value={spineSlotName} onChange={(e) => setSpineSlotName(e.target.value)} />
              </label>
            </div>
            <Tooltip title="导出 Spine 可编辑工程文件，支持骨骼绑定与关键帧调整">
              <Button
                style={{ marginTop: 12 }}
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={() => { void handleExportSpine() }}
              >
                下载 Spine 资源包
              </Button>
            </Tooltip>
          </div>
          )}

          {previewMode === 'grid' && (
          <div className="vf-frames-grid">
            {isProcessing && frames.length === 0 &&
              Array.from({ length: Math.min(estimatedTotal || 8, 12) }, (_, i) => (
                <div key={`sk-${i}`} className="vf-frame-card vf-frame-card--loading">
                  <div className="vf-frame-skeleton" />
                </div>
              ))
            }
            {frames.map((f, index) => (
              <div
                key={f.id}
                className="vf-frame-card"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="vf-frame-cover">
                  <span className="vf-frame-index">{f.id}</span>
                  {f.previewUrl ? (
                    <img src={f.previewUrl} alt={f.name} className="vf-frame-thumb" />
                  ) : (
                    <IconFont type="icon-image" className="vf-frame-icon" />
                  )}
                </div>
                <span className="vf-frame-name">{f.name}</span>
              </div>
            ))}
          </div>
          )}
        </section>
      )}
          </div>

            </div>

            <aside className="vf-side-widgets">
              <section className="vf-widget">
                <header className="vf-widget-head">
                  <h3 className="vf-widget-title">使用小贴士</h3>
                </header>
                <ul className="vf-widget-list">
                  {TIP_ITEMS.map(({ Icon, title, desc }) => (
                    <li key={title} className="vf-widget-list-item">
                      <span className="vf-widget-thumb" aria-hidden="true">
                        <Icon />
                      </span>
                      <div className="vf-widget-body">
                        <strong>{title}</strong>
                        <p>{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="vf-widget">
                <header className="vf-widget-head">
                  <h3 className="vf-widget-title">处理状态</h3>
                </header>
                <ul className="vf-widget-status-list">
                  <li>
                    <span className="vf-widget-status-label">视频</span>
                    <span className={`vf-pill vf-pill--${statusTone('video', null, { videoFile, isProcessing, extractComplete, progress })}`}>
                      {videoFile ? '已上传' : '未上传'}
                    </span>
                  </li>
                  <li>
                    <span className="vf-widget-status-label">关键帧</span>
                    <span className={`vf-pill vf-pill--${statusTone('frames', frameStatLabel, { videoFile, isProcessing, extractComplete, progress })}`}>
                      {frameStatLabel}
                    </span>
                  </li>
                  <li>
                    <span className="vf-widget-status-label">进度</span>
                    <span className={`vf-pill vf-pill--${statusTone('progress', progressStatLabel, { videoFile, isProcessing, extractComplete, progress })}`}>
                      {progressStatLabel}
                    </span>
                  </li>
                </ul>
              </section>

              <section className="vf-widget vf-widget--history">
                <header className="vf-widget-head">
                  <h3 className="vf-widget-title">历史记录</h3>
                  {history.length > 0 && (
                    <span className="vf-widget-action">共 {history.length} 条</span>
                  )}
                </header>
                {history.length === 0 ? (
                  <p className="vf-widget-empty">完成抽帧后将自动保存至此</p>
                ) : (
                  <ul className="vf-widget-list vf-widget-list--history">
                    {history.map((item) => (
                      <li key={item.id} className="vf-widget-list-item">
                        <span className="vf-widget-thumb vf-widget-thumb--img">
                          {item.thumbUrl ? (
                            <img src={item.thumbUrl} alt="" />
                          ) : (
                            <IconFont type="icon-image" />
                          )}
                        </span>
                        <div className="vf-widget-body">
                          <strong>{item.fileName}</strong>
                          <p>{item.frameCount} 帧 · {item.fps} FPS{item.removeBg ? ' · 已抠图' : ''}</p>
                          <div className="vf-widget-meta">
                            <span className="vf-pill vf-pill--success">已完成</span>
                            <span className="vf-widget-time">{formatHistoryTime(item.createdAt)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
