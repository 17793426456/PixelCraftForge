import { useEffect, useRef, useState } from 'react'
import {
  Button, Checkbox, Tag, message, Space, Input, Tooltip, Dropdown, Progress, Slider,
} from '@/components/app/wrapped-ui'
import FileDropzone from '@/components/app/FileDropzone'
import {
  ThunderboltOutlined, HighlightOutlined, PictureOutlined, PlayCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, RightOutlined, DownOutlined, PauseCircleOutlined,
  DownloadOutlined, SaveOutlined,
} from '@/lib/icons/antd-lucide'
import IconFont from '../../components/IconFont/IconFont'
import vfxParticleParams from '../../constants/features/vfx-particle-params.js'
import vfxPresets from '../../constants/features/vfx-presets.js'
import FeatureCallout from '../../components/FeatureHub/FeatureCallout.jsx'
import { ApiError } from '../../lib/api/client.js'
import { resolveAssetCategory } from '../../lib/api/assetCategory.js'
import { ensureResultBlob, guessMediaExtension, resolveMediaUrl } from '../../lib/api/mediaUrl.js'
import { saveGeneratedItemToLibrary } from '../../lib/assets/saveToLibrary.js'
import { triggerDownload } from '../../lib/assets/imageExport.js'
import {
  createImageToVideo, createTextToVideo, parseDurationSeconds, parseResolutionApi, pollVideoTask,
} from '../../lib/api/videoApi.js'
import '../ElementGenerate/ElementGenerate.css'
import './VideoGenerate.css'

const { TextArea } = Input

const sceneTemplates = [
  { id: 1, name: '角色动作', icon: 'icon-wizard' },
  { id: 2, name: '技能特效', icon: 'icon-sword' },
  { id: 3, name: '场景漫游', icon: 'icon-castle' },
  { id: 4, name: 'UI动效', icon: 'icon-sparkle' },
]

const modelOptions = [
  { id: 'motion-v1', name: 'Motion-X V1', desc: '游戏角色动作与技能特效', preview: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { id: 'scene-flow', name: 'SceneFlow Pro', desc: '场景镜头与环境氛围', preview: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' },
  { id: 'pixel-animate', name: 'Pixel Animate', desc: '像素风角色逐帧动画', preview: 'linear-gradient(135deg, #374151 0%, #6366f1 100%)' },
]

const durationOptions = ['3s', '5s', '8s', '10s']
const resolutionOptions = ['720P', '1080P']
const ratioOptions = ['16:9', '9:16', '1:1', '4:3']
const fpsOptions = [24, 30, 60]
const motionOptions = ['低', '中', '高']

const modeOptions = [
  { label: '文生视频', value: '文生视频', icon: <HighlightOutlined /> },
  { label: '图生视频', value: '图生视频', icon: <PictureOutlined /> },
]

const DEFAULTS = {
  mode: '文生视频',
  prompt: '',
  selectedTemplate: null,
  modelId: 'motion-v1',
  duration: '5s',
  resolution: '1080P',
  ratio: '16:9',
  fps: 30,
  motion: '中',
  loop: false,
  refImage: null,
  refLastImage: null,
}

export default function VideoGenerate() {
  const [mode, setMode] = useState(DEFAULTS.mode)
  const [prompt, setPrompt] = useState(DEFAULTS.prompt)
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULTS.selectedTemplate)
  const [modelId, setModelId] = useState(DEFAULTS.modelId)
  const [duration, setDuration] = useState(DEFAULTS.duration)
  const [resolution, setResolution] = useState(DEFAULTS.resolution)
  const [ratio, setRatio] = useState(DEFAULTS.ratio)
  const [fps, setFps] = useState(DEFAULTS.fps)
  const [motion, setMotion] = useState(DEFAULTS.motion)
  const [loop, setLoop] = useState(DEFAULTS.loop)
  const [refImage, setRefImage] = useState(DEFAULTS.refImage)
  const [refImageFile, setRefImageFile] = useState(null)
  const [refLastImage, setRefLastImage] = useState(DEFAULTS.refLastImage)
  const [refLastImageFile, setRefLastImageFile] = useState(null)
  const [results, setResults] = useState([])
  const [filterTime, setFilterTime] = useState('全部时间')
  const [filterType, setFilterType] = useState('全部类型')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [playingId, setPlayingId] = useState(null)
  const pollAbortRef = useRef(null)

  const currentModel = modelOptions.find(m => m.id === modelId) || modelOptions[0]

  const cycleModel = () => {
    const idx = modelOptions.findIndex(m => m.id === modelId)
    setModelId(modelOptions[(idx + 1) % modelOptions.length].id)
  }

  const handleReset = () => {
    setMode(DEFAULTS.mode)
    setPrompt(DEFAULTS.prompt)
    setSelectedTemplate(DEFAULTS.selectedTemplate)
    setModelId(DEFAULTS.modelId)
    setDuration(DEFAULTS.duration)
    setResolution(DEFAULTS.resolution)
    setRatio(DEFAULTS.ratio)
    setFps(DEFAULTS.fps)
    setMotion(DEFAULTS.motion)
    setLoop(DEFAULTS.loop)
    setRefImage(DEFAULTS.refImage)
    setRefImageFile(null)
    setRefLastImage(DEFAULTS.refLastImage)
    setRefLastImageFile(null)
    message.info('已重置所有参数')
  }

  const handleFirstFrameFiles = (files) => {
    const file = files?.[0]
    if (!file) return
    setRefImage(URL.createObjectURL(file))
    setRefImageFile(file)
    message.success('首帧上传成功')
  }

  const handleLastFrameFiles = (files) => {
    const file = files?.[0]
    if (!file) return
    setRefLastImage(URL.createObjectURL(file))
    setRefLastImageFile(file)
    message.success('尾帧上传成功')
  }

  const handleGenerate = async () => {
    if (mode === '文生视频' && !prompt.trim()) {
      message.warning('请输入视频描述后再生成')
      return
    }
    if (mode === '图生视频' && !refImageFile) {
      message.warning('请上传首帧参考图')
      return
    }

    pollAbortRef.current?.abort()
    const abort = new AbortController()
    pollAbortRef.current = abort

    setGenerating(true)
    setProgress(5)
    const category = resolveAssetCategory({ templateId: selectedTemplate })
    const durationSec = parseDurationSeconds(duration)
    const resolutionApi = parseResolutionApi(resolution)
    const videoPrompt = prompt.trim() || '游戏动画镜头'

    try {
      let createRes
      if (mode === '文生视频') {
        createRes = await createTextToVideo({
          prompt: videoPrompt,
          ratio,
          duration: durationSec,
          resolution: resolutionApi,
          generateAudio: true,
          watermark: false,
          category,
        })
      } else {
        createRes = await createImageToVideo({
          image: refImageFile,
          lastImage: refLastImageFile ?? undefined,
          prompt: videoPrompt,
          ratio,
          duration: durationSec,
          resolution: resolutionApi,
          generateAudio: true,
          watermark: false,
          category,
        })
      }

      const task = await pollVideoTask(createRes.taskId, {
        signal: abort.signal,
        onProgress: (t) => {
          const st = (t.status ?? '').toLowerCase()
          if (st === 'running' || st === 'processing') setProgress(55)
          else if (st === 'queued') setProgress(25)
          else setProgress(85)
        },
      })

      const storageUrl = task.url
      const videoUrl = resolveMediaUrl(storageUrl)
      setResults((prev) => [{
        id: Date.now(),
        name: `游戏视频_${prev.length + 1}`,
        duration,
        resolution,
        ratio,
        fps,
        motion,
        model: currentModel.name,
        mode,
        videoUrl,
        storageUrl,
        taskId: task.taskId,
        cached: false,
        createdAt: Date.now(),
      }, ...prev])
      setProgress(100)
      message.success('视频生成完成！可在右侧一键入库')
    } catch (err) {
      if (err?.name === 'AbortError') return
      const msg = err instanceof ApiError ? err.message : (err?.message ?? '视频生成失败')
      message.error(msg)
    } finally {
      setGenerating(false)
      pollAbortRef.current = null
    }
  }

  const timeMenu = {
    items: ['全部时间', '今天', '本周', '本月'].map(t => ({ key: t, label: t, onClick: () => setFilterTime(t) })),
  }
  const typeMenu = {
    items: ['全部类型', '文生视频', '图生视频'].map(t => ({ key: t, label: t, onClick: () => setFilterType(t) })),
  }

  const [filteredResults, setFilteredResults] = useState(results)
  useEffect(() => {
    const now = Date.now()
    const day = 86400000
    setFilteredResults(results.filter((r) => {
      if (filterType !== '全部类型' && r.mode !== filterType) return false
      if (filterTime === '全部时间') return true
      const age = now - (r.createdAt ?? r.id ?? 0)
      if (filterTime === '今天') return age < day
      if (filterTime === '本周') return age < day * 7
      if (filterTime === '本月') return age < day * 30
      return true
    }))
  }, [results, filterType, filterTime])

  const handleSaveResults = async () => {
    const targets = filteredResults.length ? filteredResults : results
    if (!targets.length) {
      message.warning('暂无可入库的视频')
      return
    }
    try {
      let saved = 0
      for (const r of targets) {
        await saveGeneratedItemToLibrary(r, {
          name: r.name,
          folder: '视频生成',
          style: r.model,
          defaultExt: 'mp4',
        })
        saved += 1
      }
      message.success(`已入库 ${saved} 个视频，可在素材仓库查看`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '入库失败')
    }
  }

  const handleSaveOne = async (r) => {
    try {
      await saveGeneratedItemToLibrary(r, {
        name: r.name,
        folder: '视频生成',
        style: r.model,
        defaultExt: 'mp4',
      })
      message.success(`「${r.name}」已入库`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '入库失败')
    }
  }

  const handleDownloadOne = async (r) => {
    try {
      const blob = await ensureResultBlob(r)
      const ext = guessMediaExtension(blob, 'mp4')
      triggerDownload(blob, `${r.name}.${ext}`)
    } catch {
      message.error('下载失败')
    }
  }

  return (
    <div className="jm-workspace vg-workspace">
      <aside className="jm-panel">
        <FeatureCallout feature={vfxParticleParams} />
        <FeatureCallout feature={vfxPresets} />
        <div className="jm-panel-header">
          <h1 className="jm-panel-title">视频生成</h1>
          <Tooltip title="重置参数">
            <button type="button" className="jm-icon-btn" onClick={handleReset}>
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>

        <div className="jm-mode-tabs">
          {modeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`jm-mode-tab ${mode === opt.value ? 'active' : ''}`}
              onClick={() => setMode(opt.value)}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="jm-panel-scroll">
          <div className="jm-model-card" onClick={cycleModel}>
            <div className="jm-model-preview" style={{ background: currentModel.preview }}>
              <IconFont type="icon-video" className="jm-model-icon" />
            </div>
            <div className="jm-model-info">
              <div className="jm-model-name">
                {currentModel.name}
                <Tooltip title={currentModel.desc}>
                  <InfoCircleOutlined className="jm-model-tip" onClick={e => e.stopPropagation()} />
                </Tooltip>
              </div>
              <div className="jm-model-desc">{currentModel.desc}</div>
            </div>
            <RightOutlined className="jm-model-arrow" />
          </div>

          {mode === '文生视频' && (
            <TextArea
              rows={5}
              placeholder="描述游戏视频内容，如：像素风骑士释放火焰剑技能，镜头由近及远..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="jm-prompt"
              variant="borderless"
            />
          )}

          {mode === '图生视频' && (
            <>
              <div className="vg-frame-pair">
                <div className="vg-frame-slot">
                  <p className="vg-frame-label">
                    首帧
                    <span className="vg-frame-tag vg-frame-tag--required">必填</span>
                  </p>
                  <FileDropzone
                    accept="image/*"
                    maxCount={1}
                    className="jm-upload vg-frame-drop"
                    title={refImage ? '已选首帧，点击更换' : '上传首帧'}
                    hint="视频起始画面"
                    onFiles={handleFirstFrameFiles}
                  >
                    {refImage ? (
                      <img src={refImage} alt="首帧" className="vg-ref-preview" />
                    ) : (
                      <>
                        <p className="jm-upload-icon"><IconFont type="icon-image" /></p>
                        <p className="jm-upload-text">首帧</p>
                      </>
                    )}
                  </FileDropzone>
                </div>
                <div className="vg-frame-slot">
                  <p className="vg-frame-label">
                    尾帧
                    <span className="vg-frame-tag">可选</span>
                  </p>
                  <FileDropzone
                    accept="image/*"
                    maxCount={1}
                    className="jm-upload vg-frame-drop"
                    title={refLastImage ? '已选尾帧，点击更换' : '上传尾帧'}
                    hint="指定结束画面，与首帧衔接生成"
                    onFiles={handleLastFrameFiles}
                  >
                    {refLastImage ? (
                      <img src={refLastImage} alt="尾帧" className="vg-ref-preview" />
                    ) : (
                      <>
                        <p className="jm-upload-icon"><IconFont type="icon-image" /></p>
                        <p className="jm-upload-text">尾帧</p>
                      </>
                    )}
                  </FileDropzone>
                </div>
              </div>
              <TextArea
                rows={3}
                placeholder="描述镜头运动与动作，如：角色从站立到挥剑..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="jm-prompt"
                variant="borderless"
              />
            </>
          )}

          <div className="jm-options">
            <div className="jm-opt-group">
              <span className="jm-opt-label">场景模板</span>
              <Space wrap size={[6, 6]}>
                {sceneTemplates.map(t => (
                  <Tag
                    key={t.id}
                    className={`jm-tag ${selectedTemplate === t.id ? 'jm-tag-active' : ''}`}
                    onClick={() => setSelectedTemplate(t.id)}
                  >
                    <IconFont type={t.icon} className="jm-tag-icon" /> {t.name}
                  </Tag>
                ))}
              </Space>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">视频时长</span>
              <div className="jm-pills">
                {durationOptions.map(d => (
                  <button key={d} type="button" className={`jm-pill ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>{d}</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">清晰度</span>
              <div className="jm-pills">
                {resolutionOptions.map(r => (
                  <button key={r} type="button" className={`jm-pill ${resolution === r ? 'active' : ''}`} onClick={() => setResolution(r)}>{r}</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">比例</span>
              <div className="jm-pills">
                {ratioOptions.map(r => (
                  <button key={r} type="button" className={`jm-pill ${ratio === r ? 'active' : ''}`} onClick={() => setRatio(r)}>{r}</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">帧率</span>
              <div className="jm-pills">
                {fpsOptions.map(f => (
                  <button key={f} type="button" className={`jm-pill ${fps === f ? 'active' : ''}`} onClick={() => setFps(f)}>{f}fps</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group">
              <span className="jm-opt-label">运动幅度</span>
              <div className="jm-pills">
                {motionOptions.map(m => (
                  <button key={m} type="button" className={`jm-pill ${motion === m ? 'active' : ''}`} onClick={() => setMotion(m)}>{m}</button>
                ))}
              </div>
            </div>

            <div className="jm-opt-group vg-slider-group">
              <span className="jm-opt-label">镜头运动</span>
              <Slider defaultValue={40} tooltip={{ formatter: v => `${v}%` }} />
            </div>

            <Checkbox checked={loop} onChange={e => setLoop(e.target.checked)} className="jm-checkbox">
              循环播放（适用于待机 / 行走动画）
            </Checkbox>
          </div>
        </div>

        <div className="jm-panel-footer">
          {generating && (
            <Progress percent={progress} size="small" strokeColor={{ from: '#6366f1', to: '#ec4899' }} className="vg-progress" />
          )}
          <Button type="primary" size="large" block className="jm-generate-btn" onClick={() => { void handleGenerate() }} loading={generating} disabled={generating}>
            <span className="jm-generate-text">
              <ThunderboltOutlined /> {generating ? '生成中...' : '开始创作'}
            </span>
          </Button>
        </div>
      </aside>

      <main className="jm-canvas">
        <div className="jm-canvas-toolbar">
          <Dropdown menu={timeMenu} trigger={['click']}>
            <button type="button" className="jm-filter-btn">{filterTime} <DownOutlined /></button>
          </Dropdown>
          <Dropdown menu={typeMenu} trigger={['click']}>
            <button type="button" className="jm-filter-btn">{filterType} <DownOutlined /></button>
          </Dropdown>
          {filteredResults.length > 0 && (
            <>
              <Button size="small" icon={<DownloadOutlined />} onClick={() => { void handleDownloadOne(filteredResults[0]) }}>
                下载最新
              </Button>
              <Button size="small" icon={<SaveOutlined />} onClick={() => { void handleSaveResults() }}>
                一键入库
              </Button>
            </>
          )}
          <button type="button" className="jm-filter-btn">
            <IconFont type="icon-task" /> 共 {filteredResults.length} / {results.length} 项
          </button>
        </div>

        <div className="jm-canvas-body">
          {generating && filteredResults.length === 0 ? (
            <div className="vg-generating-hero" role="status" aria-live="polite">
              <div
                className="vg-gen-ring"
                style={{ '--vg-progress': `${Math.min(100, Math.max(0, progress))}%` }}
              >
                <span className="vg-gen-ring-value">{progress}%</span>
              </div>
              <p className="vg-generating-title">AI 正在渲染视频…</p>
              <p className="vg-generating-desc">Seedance 任务排队与渲染中，请稍候</p>
              <Progress percent={progress} className="vg-generating-bar" strokeColor={{ from: '#6366f1', to: '#ec4899' }} />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="jm-welcome">
              <div className="jm-welcome-art">
                <IconFont type="icon-video" />
                <IconFont type="icon-sparkle" className="jm-welcome-sparkle" />
              </div>
              <p className="jm-welcome-title">欢迎来到 像素造物 PixelCraft Forge</p>
              <p className="jm-welcome-desc">文生视频、图生视频，一键生成游戏动画</p>
            </div>
          ) : (
            <div className="vg-results-grid">
              {generating && (
                <div className="vg-result-card vg-generating-card">
                  <div className="vg-video-cover">
                    <div
                      className="vg-gen-ring vg-gen-ring--sm"
                      style={{ '--vg-progress': `${Math.min(100, Math.max(0, progress))}%` }}
                    >
                      <span className="vg-gen-ring-value">{progress}%</span>
                    </div>
                    <p>AI 正在渲染视频...</p>
                    <Progress percent={progress} className="vg-generating-bar" />
                  </div>
                </div>
              )}
              {filteredResults.map(r => (
                <div key={r.id} className="vg-result-card">
                  <div className="vg-video-cover">
                    {r.videoUrl ? (
                      <video
                        src={r.videoUrl}
                        className="vg-ref-preview"
                        controls={playingId === r.id}
                        muted
                        loop
                        playsInline
                        onClick={() => setPlayingId(playingId === r.id ? null : r.id)}
                      />
                    ) : (
                      <IconFont type="icon-video" className="vg-video-icon" />
                    )}
                    {!r.videoUrl && (
                      <button
                        type="button"
                        className="vg-play-btn"
                        onClick={() => setPlayingId(playingId === r.id ? null : r.id)}
                      >
                        {playingId === r.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      </button>
                    )}
                    <span className="vg-duration-badge">{r.duration}</span>
                  </div>
                  <div className="jm-result-meta">
                    <span className="jm-result-name">{r.name}</span>
                    <span className="jm-result-info">{r.ratio} · {r.resolution} · {r.fps}fps · {r.motion}动态</span>
                    <Tag className="vg-mode-tag">{r.mode}</Tag>
                    <div className="jm-result-actions mt-2 flex flex-wrap gap-2">
                      <Button size="small" icon={<DownloadOutlined />} onClick={() => { void handleDownloadOne(r) }}>
                        下载
                      </Button>
                      <Button size="small" icon={<SaveOutlined />} onClick={() => { void handleSaveOne(r) }}>
                        入库
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
