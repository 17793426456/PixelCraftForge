import { SoundOutlined } from '@ant-design/icons'
import GameSfxGenerator from '../../components/GameSfxGenerator/GameSfxGenerator.jsx'
import './SoundEffect.css'

export default function SoundEffect() {
  return (
    <div className="sound-page">
      <div className="page-header">
        <h2 className="page-title"><SoundOutlined /> 复古游戏音效生成器</h2>
        <p className="page-subtitle">
          基于 sfxr 风格合成：预设、波形与参数调节、实时试听、历史记录，支持导出 WAV / JSON / MP3 / OGG / ZIP
        </p>
      </div>
      <div className="sfx-workbench">
        <GameSfxGenerator />
      </div>
    </div>
  )
}
