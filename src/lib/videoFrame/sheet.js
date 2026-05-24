import picaFactory from 'pica';

/**
 * @typedef {Object} VideoMeta
 * @property {number} duration
 * @property {number} width
 * @property {number} height
 * @property {string} name
 */

/**
 * @typedef {Object} ExtractedFrame
 * @property {HTMLCanvasElement} image
 * @property {number} time
 * @property {string} label
 */

/**
 * @typedef {Object} SheetOptions
 * @property {number} columns
 * @property {number} gap
 * @property {string} backgroundColor
 * @property {number | null} [frameSize]
 */

/**
 * @typedef {Object} LayoutMetrics
 * @property {number} rows
 * @property {number} canvasWidth
 * @property {number} canvasHeight
 * @property {number} frameWidth
 * @property {number} frameHeight
 * @property {number} labelBlockHeight
 */

/**
 * @typedef {Object} SheetAppearance
 * @property {boolean} transparentBackground
 * @property {boolean} showCardBackground
 */

/**
 * @typedef {Object} RenderResult
 * @property {Blob} blob
 * @property {string} objectUrl
 * @property {number} outputWidth
 * @property {number} outputHeight
 */

const MAX_FRAME_WIDTH = 320;
const LABEL_FONT_SIZE = 16;
const LABEL_BLOCK_HEIGHT = 30;
const CARD_PADDING = 10;
const pica = picaFactory();

/**
 * @param {VideoMeta} meta
 * @param {number} frameCount
 * @param {SheetOptions} sheetOptions
 * @param {boolean} includeTimestamps
 * @returns {LayoutMetrics}
 */
export function getLayoutMetrics(meta, frameCount, sheetOptions, includeTimestamps) {
  const rows = Math.max(1, Math.ceil(frameCount / sheetOptions.columns));
  const frameSize = sheetOptions.frameSize ?? null;
  const frameWidth = frameSize ?? Math.min(MAX_FRAME_WIDTH, meta.width);
  const frameHeight = frameSize ?? Math.round((meta.height / meta.width) * frameWidth);
  const labelBlockHeight = includeTimestamps ? LABEL_BLOCK_HEIGHT : 0;
  const contentPadding = includeTimestamps ? CARD_PADDING : 0;
  const cardHeight = frameHeight + labelBlockHeight + contentPadding * 2;
  const horizontalGap = Math.max(sheetOptions.columns - 1, 0) * sheetOptions.gap;
  const verticalGap = Math.max(rows - 1, 0) * sheetOptions.gap;
  const canvasWidth = sheetOptions.columns * frameWidth + horizontalGap;
  const canvasHeight = rows * cardHeight + verticalGap;

  return {
    rows,
    canvasWidth,
    canvasHeight,
    frameWidth,
    frameHeight,
    labelBlockHeight,
  };
}

/**
 * @param {boolean} transparent
 * @returns {SheetAppearance}
 */
export function getSheetAppearance(transparent) {
  return transparent
    ? {
        transparentBackground: true,
        showCardBackground: false,
      }
    : {
        transparentBackground: false,
        showCardBackground: true,
      };
}

/**
 * @param {CanvasRenderingContext2_} context
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function fillRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.fill();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片导出失败，请稍后再试。'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

/**
 * @param {HTMLCanvasElement} source
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<HTMLCanvasElement>}
 */
async function resizeFrameWithPica(source, targetWidth, targetHeight) {
  if (targetWidth === source.width && targetHeight === source.height) {
    return source;
  }

  const target = document.createElement('canvas');
  target.width = targetWidth;
  target.height = targetHeight;

  await pica.resize(source, target, {
    alpha: true,
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
  });

  return target;
}

/**
 * @param {ExtractedFrame[]} frames
 * @param {VideoMeta} meta
 * @param {SheetOptions} sheetOptions
 * @param {boolean} includeTimestamps
 * @param {SheetAppearance} [appearance]
 * @returns {Promise<RenderResult>}
 */
export async function renderFrameSheet(
  frames,
  meta,
  sheetOptions,
  includeTimestamps,
  appearance = getSheetAppearance(false),
) {
  const metrics = getLayoutMetrics(meta, frames.length, sheetOptions, includeTimestamps);
  const canvas = document.createElement('canvas');
  canvas.width = metrics.canvasWidth;
  canvas.height = metrics.canvasHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('当前浏览器无法创建最终导出画布。');
  }

  if (appearance.transparentBackground) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    context.fillStyle = sheetOptions.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.font = `600 ${LABEL_FONT_SIZE}px "Avenir Next", "PingFang SC", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const contentPadding = includeTimestamps ? CARD_PADDING : 0;
  const cardHeight = metrics.frameHeight + metrics.labelBlockHeight + contentPadding * 2;

  for (const [index, frame] of frames.entries()) {
    const scaledFrame = await resizeFrameWithPica(
      frame.image,
      metrics.frameWidth,
      metrics.frameHeight,
    );
    const column = index % sheetOptions.columns;
    const row = Math.floor(index / sheetOptions.columns);
    const x = column * (metrics.frameWidth + sheetOptions.gap);
    const y = row * (cardHeight + sheetOptions.gap);

    if (appearance.showCardBackground) {
      context.fillStyle = 'rgba(16, 24, 40, 0.08)';
      fillRoundedRect(
        context,
        x,
        y,
        metrics.frameWidth,
        metrics.frameHeight + metrics.labelBlockHeight + CARD_PADDING * 2,
        16,
      );
    }

    context.drawImage(
      scaledFrame,
      x,
      y + contentPadding,
      metrics.frameWidth,
      metrics.frameHeight,
    );

    if (includeTimestamps) {
      context.fillStyle = '#182230';
      context.fillText(
        frame.label,
        x + metrics.frameWidth / 2,
        y + contentPadding + metrics.frameHeight + metrics.labelBlockHeight / 2,
      );
    }
  }

  const blob = await canvasToBlob(canvas);

  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    outputWidth: canvas.width,
    outputHeight: canvas.height,
  };
}
