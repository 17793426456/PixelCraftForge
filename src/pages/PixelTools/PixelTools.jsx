import { BlockOutlined } from '@ant-design/icons'

import { Tabs } from 'antd'

import GifFrameTool from './GifFrameTool.jsx'

import SpriteSheetTool from './SpriteSheetTool.jsx'

import GeminiWatermark from './GeminiWatermark.jsx'

import ImageChromaMatte from './ImageChromaMatte.jsx'

import ImagePixelateTool from './ImagePixelateTool.jsx'

import EfficiencyHub from '../../fr-port/components/EfficiencyHub.jsx'

import SheetProTool from '../../fr-port/components/SheetProTool.jsx'

import './PixelTools.css'



const TAB_ITEMS = [

  { key: 'gif', label: 'GIF ↔ 序列帧', children: <GifFrameTool /> },

  { key: 'sheet', label: '精灵图工具', children: <SpriteSheetTool /> },

  { key: 'efficiency', label: '效率工具', children: <EfficiencyHub /> },

  { key: 'sheetPro', label: '精灵表 Pro', children: <SheetProTool /> },

  { key: 'pixelate', label: '图片像素化', children: <ImagePixelateTool /> },

  { key: 'watermark', label: 'Gemini 去水印', children: <GeminiWatermark /> },

  { key: 'matte', label: '色度键抠图', children: <ImageChromaMatte /> },

]



export default function PixelTools() {

  return (

    <div className="vf-page vf-page--centered">

      <div className="vf-page-bg" aria-hidden="true" />

      <div className="vf-page-grid" aria-hidden="true" />



      <div className="vf-page-center">

        <header className="vf-header">

          <h1 className="vf-title vf-title--with-icon">

            <BlockOutlined />

            像素工具箱

          </h1>

          <p className="vf-subtitle">

            浏览器端像素处理：GIF/序列帧、精灵图、色度键与 Gemini 去水印、OpenCV 像素化、效率工具与精灵表 Pro 调整

          </p>

        </header>



        <div className="pt-studio-card">

          <Tabs className="pixel-tools-tabs" size="large" items={TAB_ITEMS} />

        </div>

      </div>

    </div>

  )

}

