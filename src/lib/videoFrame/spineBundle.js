import JSZip from 'jszip';
import { getBaseFileName } from './exportBundle.js';

/**
 * @typedef {Object} ExtractedFrame
 * @property {HTMLCanvasElement} image
 * @property {number} time
 * @property {string} label
 */

/**
 * @typedef {Object} SpineDraft
 * @property {ExtractedFrame[]} frames
 * @property {string} baseName
 * @property {number} width
 * @property {number} height
 * @property {boolean} transparent
 */

/**
 * @typedef {Object} SpineExportOptions
 * @property {string} skeletonName
 * @property {string} animationName
 * @property {string} slotName
 * @property {number} fps
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Spine 帧导出失败，请稍后重试。'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

/**
 * @param {string} baseName
 * @returns {string}
 */
export function getSpineJsonFileName(baseName) {
  return `${getBaseFileName(baseName)}-spine.json`;
}

/**
 * @param {string} baseName
 * @returns {string}
 */
export function getSpineZipFileName(baseName) {
  return `${getBaseFileName(baseName)}-spine.zip`;
}

/**
 * @param {string} baseName
 * @param {number} index
 * @returns {string}
 */
export function getSpineFrameStem(baseName, index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `${getBaseFileName(baseName)}-spine-${frameNumber}`;
}

/**
 * @param {string} baseName
 * @param {number} index
 * @returns {string}
 */
export function getSpineFrameFileName(baseName, index) {
  return `images/${getSpineFrameStem(baseName, index)}.png`;
}

/**
 * @param {SpineDraft} draft
 * @param {SpineExportOptions} options
 * @returns {string}
 */
export function buildSpineReadme(draft, options) {
  return [
    'Spine 动画导出说明',
    '',
    '此 ZIP 包包含：',
    `- ${getSpineJsonFileName(draft.baseName)}`,
    '- images/*.png',
    '',
    '导入建议：',
    '1. 将 ZIP 解压到本地目录。',
    '2. 在 Spine 中使用 Import Data 或作为新 skeleton 导入 JSON。',
    '3. 保持 JSON 文件与 images 文件夹的相对路径不变。',
    '',
    '当前导出参数：',
    `- skeleton: ${options.skeletonName}`,
    `- animation: ${options.animationName}`,
    `- slot: ${options.slotName}`,
    `- fps: ${options.fps}`,
    `- frames: ${draft.frames.length}`,
    `- transparent: ${draft.transparent ? 'yes' : 'no'}`,
  ].join('\n');
}

/**
 * @param {SpineDraft} draft
 * @param {SpineExportOptions} options
 * @returns {Object}
 */
export function buildSpineSkeletonData(draft, options) {
  const attachmentEntries = Object.fromEntries(
    draft.frames.map((_, index) => {
      const attachmentName = getSpineFrameStem(draft.baseName, index);
      return [
        attachmentName,
        {
          type: 'region',
          path: `images/${attachmentName}`,
          x: 0,
          y: 0,
          width: draft.width,
          height: draft.height,
        },
      ];
    }),
  );

  const attachmentTimeline = draft.frames.slice(1).map((_, index) => ({
    time: Number(((index + 1) / Math.max(options.fps, 1)).toFixed(6)),
    name: getSpineFrameStem(draft.baseName, index + 1),
  }));

  return {
    skeleton: {
      name: options.skeletonName,
      spine: '4.2.0',
      images: './images/',
    },
    bones: [
      {
        name: 'root',
      },
    ],
    slots: [
      {
        name: options.slotName,
        bone: 'root',
        attachment: getSpineFrameStem(draft.baseName, 0),
      },
    ],
    skins: [
      {
        name: 'default',
        attachments: {
          [options.slotName]: attachmentEntries,
        },
      },
    ],
    animations: {
      [options.animationName]: {
        slots: {
          [options.slotName]: {
            attachment: attachmentTimeline,
          },
        },
      },
    },
  };
}

/**
 * @param {SpineDraft} draft
 * @param {SpineExportOptions} options
 * @returns {Promise<Blob>}
 */
export async function buildSpineBundleZip(draft, options) {
  const zip = new JSZip();
  const jsonFileName = getSpineJsonFileName(draft.baseName);
  const jsonData = buildSpineSkeletonData(draft, options);

  zip.file(jsonFileName, JSON.stringify(jsonData, null, 2));
  zip.file('README.txt', buildSpineReadme(draft, options));

  for (const [index, frame] of draft.frames.entries()) {
    const blob = await canvasToBlob(frame.image);
    zip.file(getSpineFrameFileName(draft.baseName, index), blob);
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
