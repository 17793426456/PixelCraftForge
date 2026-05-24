/** 精简中文文案，未命中时返回 key 本身 */
const ZH = {
  backToHome: '返回',
  uploadImage: '上传图片',
  uploadImages: '上传多张图片',
  download: '下载',
  processing: '处理中…',
  done: '完成',
  error: '出错',
  cols: '列',
  rows: '行',
  preview: '预览',
  export: '导出',
  apply: '应用',
  reset: '重置',
  play: '播放',
  pause: '暂停',
  delete: '删除',
  selectAll: '全选',
  deselectAll: '取消全选',
  roninProCustomScale: '自定义缩放',
  roninProCustomScaleHint: '按目标尺寸缩放，可选像素化与色度键抠图',
  roninProUnifySize: '统一尺寸',
  roninProUnifySizeHint: '多图对齐到相同单元格并合成精灵图',
  roninProDupFrames: '重复帧检测',
  roninProDupFramesCardDesc: '网格切分后找出像素级相同的帧',
  roninProDupFramesNeedImage: '请先上传精灵图',
  roninProSheetProIntro:
    '整图均分或按透明区域拆分，支持逐帧偏移、边缘裁剪、拖拽重排与动画预览，可导出 ZIP / GIF / 重组精灵图。',
  sheetAdjustUpload: '上传精灵图或序列帧',
  sheetAdjustSplitCols: '切分列数',
  sheetAdjustSplitRows: '切分行数',
  sheetAdjustLayoutCols: '排列列数',
  sheetAdjustRecombine: '合成精灵图',
  sheetAdjustExportZip: '导出 ZIP',
  sheetAdjustExportGif: '导出 GIF',
  Loading: '加载中…',
}

export function useLanguage() {
  return {
    t: (key, vars) => {
      let s = ZH[key] ?? key
      if (vars && typeof vars === 'object') {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return s
    },
  }
}
