import JSZip from 'jszip';
import { formatTimestamp } from './time.js';

/**
 * @typedef {Object} ProcessedFrame
 * @property {HTMLCanvasElement} image
 * @property {number} time
 * @property {string} label
 * @property {HTMLCanvasElement} processedImage
 * @property {HTMLCanvasElement} maskImage
 */

/**
 * @param {string} input
 * @returns {string}
 */
function sanitizeBaseName(input) {
  return (
    input
      .replace(/\.[^.]+$/, '')
      .trim()
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'video'
  );
}

/**
 * @param {number} time
 * @returns {string}
 */
function safeTimestampLabel(time) {
  return formatTimestamp(time).replace(/[.:]/g, '-');
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('透明帧导出失败，请稍后重试。'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

/**
 * @param {string} input
 * @returns {string}
 */
export function getBaseFileName(input) {
  return sanitizeBaseName(input);
}

/**
 * @param {string} baseName
 * @param {boolean} transparent
 * @returns {string}
 */
export function getSheetFileName(baseName, transparent) {
  const safeBase = sanitizeBaseName(baseName);
  return `${safeBase}${transparent ? '-transparent' : ''}-timesheet.png`;
}

/**
 * @param {string} baseName
 * @param {number} index
 * @param {number} time
 * @returns {string}
 */
export function getFrameFileName(baseName, index, time) {
  const safeBase = sanitizeBaseName(baseName);
  const frameNumber = String(index + 1).padStart(3, '0');
  return `${safeBase}-frame-${frameNumber}-${safeTimestampLabel(time)}.png`;
}

/**
 * @param {string} baseName
 * @returns {string}
 */
export function getZipFileName(baseName) {
  return `${sanitizeBaseName(baseName)}-frames.zip`;
}

/**
 * @param {string} baseName
 * @param {boolean} transparent
 * @returns {string}
 */
export function getGifFileName(baseName, transparent) {
  const safeBase = sanitizeBaseName(baseName);
  return `${safeBase}${transparent ? '-transparent' : ''}-animation.gif`;
}

/**
 * @param {ProcessedFrame[]} frames
 * @param {string} baseName
 * @returns {Promise<Blob>}
 */
export async function buildTransparentFramesZip(frames, baseName) {
  const zip = new JSZip();

  for (const [index, frame] of frames.entries()) {
    const blob = await canvasToBlob(frame.processedImage);
    zip.file(getFrameFileName(baseName, index, frame.time), blob);
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
