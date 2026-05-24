/**
 * @typedef {Object} ExtractedFrame
 * @property {HTMLCanvasElement} image
 * @property {number} time
 * @property {string} label
 */

/**
 * @typedef {Object} GifBuildProgress
 * @property {'palette' | 'encode'} phase
 * @property {number} current
 * @property {number} total
 */

/**
 * @typedef {Object} GifBuildOptions
 * @property {number} fps
 * @property {boolean} [loop]
 * @property {boolean} [transparent]
 * @property {number} [maxColors]
 * @property {number} [alphaThreshold]
 * @property {(progress: GifBuildProgress) => void} [onProgress]
 */

const GIF_SIGNATURE = 'GIF89a';
const GIF_TRAILER = 0x3b;
const MAX_GIF_COLORS = 256;
const MAX_GIF_CODE_SIZE = 12;
const MAX_LZW_CODE = (1 << MAX_GIF_CODE_SIZE) - 1;
const COLOR_BIN_LEVELS = 32;
const COLOR_BIN_COUNT = COLOR_BIN_LEVELS * COLOR_BIN_LEVELS * COLOR_BIN_LEVELS;
const DEFAULT_ALPHA_THRESHOLD = 96;
const DEFAULT_SAMPLE_PIXEL_BUDGET = 220_000;
const PROGRESS_YIELD_INTERVAL = 4;

class ByteWriter {
  constructor() {
    /** @type {number[]} */
    this.bytes = [];
  }

  /**
   * @param {number} value
   */
  writeByte(value) {
    this.bytes.push(value & 0xff);
  }

  /**
   * @param {number} value
   */
  writeShort(value) {
    this.writeByte(value & 0xff);
    this.writeByte((value >> 8) & 0xff);
  }

  /**
   * @param {ArrayLike<number>} values
   */
  writeBytes(values) {
    for (let index = 0; index < values.length; index += 1) {
      this.writeByte(values[index] ?? 0);
    }
  }

  /**
   * @returns {Uint8Array}
   */
  toUint8Array() {
    return Uint8Array.from(this.bytes);
  }
}

class BitWriter {
  constructor() {
    /** @type {number[]} */
    this.bytes = [];
    this.currentByte = 0;
    this.bitOffset = 0;
  }

  /**
   * @param {number} code
   * @param {number} size
   */
  write(code, size) {
    let value = code;
    let bits = size;

    while (bits > 0) {
      this.currentByte |= (value & 1) << this.bitOffset;
      value >>= 1;
      this.bitOffset += 1;
      bits -= 1;

      if (this.bitOffset >= 8) {
        this.bytes.push(this.currentByte);
        this.currentByte = 0;
        this.bitOffset = 0;
      }
    }
  }

  /**
   * @returns {Uint8Array}
   */
  finish() {
    if (this.bitOffset > 0) {
      this.bytes.push(this.currentByte);
      this.currentByte = 0;
      this.bitOffset = 0;
    }

    return Uint8Array.from(this.bytes);
  }
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * @param {number} input
 * @returns {number}
 */
function ceilPowerOfTwo(input) {
  let value = Math.max(2, input);

  if ((value & (value - 1)) === 0) {
    return value;
  }

  value -= 1;
  value |= value >> 1;
  value |= value >> 2;
  value |= value >> 4;
  value |= value >> 8;
  value |= value >> 16;
  return value + 1;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} width
 * @param {number} height
 * @returns {Uint8ClampedArray}
 */
function getCanvasImageData(canvas, width, height) {
  if (canvas.width !== width || canvas.height !== height) {
    throw new Error('GIF 导出失败：检测到帧尺寸不一致。');
  }

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('GIF 导出失败：当前浏览器不支持 Canvas 2D。');
  }

  return context.getImageData(0, 0, width, height).data;
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number}
 */
function getBinIndex(r, g, b) {
  return ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
}

/**
 * @param {Array<{ count: number, r: number, g: number, b: number }>} colorStats
 * @param {number} targetCount
 * @returns {Array<{ bin: number, r: number, g: number, b: number }>}
 */
function pickPaletteColors(colorStats, targetCount) {
  /** @type {number[]} */
  const binsWithColor = [];

  for (let index = 0; index < colorStats.length; index += 1) {
    if ((colorStats[index]?.count ?? 0) > 0) {
      binsWithColor.push(index);
    }
  }

  if (binsWithColor.length <= targetCount) {
    return binsWithColor.map((bin) => {
      const entry = colorStats[bin];
      return {
        bin,
        r: Math.round(entry.r / entry.count),
        g: Math.round(entry.g / entry.count),
        b: Math.round(entry.b / entry.count),
      };
    });
  }

  binsWithColor.sort((left, right) => {
    const leftCount = colorStats[left]?.count ?? 0;
    const rightCount = colorStats[right]?.count ?? 0;
    return rightCount - leftCount;
  });

  return binsWithColor.slice(0, targetCount).map((bin) => {
    const entry = colorStats[bin];
    return {
      bin,
      r: Math.round(entry.r / entry.count),
      g: Math.round(entry.g / entry.count),
      b: Math.round(entry.b / entry.count),
    };
  });
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {Array<{ index: number, r: number, g: number, b: number }>} paletteEntries
 * @returns {number}
 */
function findNearestPaletteColorIndex(r, g, b, paletteEntries) {
  let nearestIndex = paletteEntries[0]?.index ?? 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const entry of paletteEntries) {
    const dr = r - entry.r;
    const dg = g - entry.g;
    const db = b - entry.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = entry.index;

      if (distance === 0) {
        break;
      }
    }
  }

  return nearestIndex;
}

/**
 * @param {Uint8ClampedArray[]} frameData
 * @param {{ maxColors: number, transparent: boolean, alphaThreshold: number }} options
 * @returns {{ table: Uint8Array, paletteEntries: Array<{ index: number, r: number, g: number, b: number }>, binToPalette: Int16Array, transparentIndex: number | null }}
 */
function buildPalette(frameData, options) {
  /** @type {Array<{ count: number, r: number, g: number, b: number }>} */
  const colorStats = Array.from({ length: COLOR_BIN_COUNT }, () => ({
    count: 0,
    r: 0,
    g: 0,
    b: 0,
  }));

  let hasTransparentPixel = false;
  let totalPixels = 0;

  for (const data of frameData) {
    totalPixels += data.length / 4;
  }

  const sampleStride = Math.max(1, Math.floor(Math.sqrt(totalPixels / DEFAULT_SAMPLE_PIXEL_BUDGET)));

  for (const data of frameData) {
    for (let index = 0; index < data.length; index += 4 * sampleStride) {
      const alpha = data[index + 3] ?? 255;
      if (options.transparent && alpha < options.alphaThreshold) {
        hasTransparentPixel = true;
        continue;
      }

      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;
      const bin = getBinIndex(r, g, b);
      const stat = colorStats[bin];

      stat.count += 1;
      stat.r += r;
      stat.g += g;
      stat.b += b;
    }
  }

  const reserveTransparentSlot = options.transparent && hasTransparentPixel;
  const maxPaletteColors = clamp(
    reserveTransparentSlot ? options.maxColors - 1 : options.maxColors,
    1,
    reserveTransparentSlot ? MAX_GIF_COLORS - 1 : MAX_GIF_COLORS,
  );
  const pickedColors = pickPaletteColors(colorStats, maxPaletteColors);
  const tableStartIndex = reserveTransparentSlot ? 1 : 0;
  /** @type {Array<{ index: number, r: number, g: number, b: number }>} */
  const paletteEntries = pickedColors.map((color, index) => ({
    index: tableStartIndex + index,
    r: color.r,
    g: color.g,
    b: color.b,
  }));

  if (paletteEntries.length === 0) {
    paletteEntries.push({
      index: tableStartIndex,
      r: 0,
      g: 0,
      b: 0,
    });
  }

  const tableSize = ceilPowerOfTwo(Math.min(MAX_GIF_COLORS, paletteEntries.length + tableStartIndex));
  const table = new Uint8Array(tableSize * 3);

  if (reserveTransparentSlot) {
    table[0] = 0;
    table[1] = 0;
    table[2] = 0;
  }

  for (const entry of paletteEntries) {
    const tableOffset = entry.index * 3;
    table[tableOffset] = entry.r;
    table[tableOffset + 1] = entry.g;
    table[tableOffset + 2] = entry.b;
  }

  const binToPalette = new Int16Array(COLOR_BIN_COUNT);
  binToPalette.fill(-1);

  for (const color of pickedColors) {
    const mapped = paletteEntries.find((entry) => entry.r === color.r && entry.g === color.g && entry.b === color.b);
    if (mapped) {
      binToPalette[color.bin] = mapped.index;
    }
  }

  return {
    table,
    paletteEntries,
    binToPalette,
    transparentIndex: reserveTransparentSlot ? 0 : null,
  };
}

/**
 * @param {Uint8ClampedArray} data
 * @param {{ table: Uint8Array, paletteEntries: Array<{ index: number, r: number, g: number, b: number }>, binToPalette: Int16Array, transparentIndex: number | null }} palette
 * @param {number} alphaThreshold
 * @returns {Uint8Array}
 */
function buildIndexedPixels(data, palette, alphaThreshold) {
  const pixelCount = data.length / 4;
  const indexed = new Uint8Array(pixelCount);

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4;
    const alpha = data[offset + 3] ?? 255;

    if (palette.transparentIndex !== null && alpha < alphaThreshold) {
      indexed[pixel] = palette.transparentIndex;
      continue;
    }

    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    const bin = getBinIndex(r, g, b);
    const cachedIndex = palette.binToPalette[bin];

    if (cachedIndex >= 0) {
      indexed[pixel] = cachedIndex;
      continue;
    }

    const nearest = findNearestPaletteColorIndex(r, g, b, palette.paletteEntries);
    palette.binToPalette[bin] = nearest;
    indexed[pixel] = nearest;
  }

  return indexed;
}

/**
 * @param {ByteWriter} writer
 * @param {Uint8Array} data
 */
function writeSubBlocks(writer, data) {
  let offset = 0;

  while (offset < data.length) {
    const chunkSize = Math.min(255, data.length - offset);
    writer.writeByte(chunkSize);
    writer.writeBytes(data.subarray(offset, offset + chunkSize));
    offset += chunkSize;
  }

  writer.writeByte(0);
}

/**
 * @param {Uint8Array} indexedPixels
 * @param {number} minCodeSize
 * @returns {Uint8Array}
 */
function encodeLzwIndices(indexedPixels, minCodeSize) {
  const bitWriter = new BitWriter();
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let dictionarySize = endCode + 1;
  let hasPreviousLiteral = false;

  const resetDictionary = () => {
    codeSize = minCodeSize + 1;
    dictionarySize = endCode + 1;
    hasPreviousLiteral = false;
  };

  bitWriter.write(clearCode, codeSize);
  resetDictionary();

  for (const literalCode of indexedPixels) {
    if (hasPreviousLiteral && dictionarySize > MAX_LZW_CODE) {
      bitWriter.write(clearCode, codeSize);
      resetDictionary();
    }

    bitWriter.write(literalCode, codeSize);

    if (hasPreviousLiteral) {
      dictionarySize += 1;

      if (dictionarySize === 1 << codeSize && codeSize < MAX_GIF_CODE_SIZE) {
        codeSize += 1;
      }
    }

    hasPreviousLiteral = true;
  }

  bitWriter.write(endCode, codeSize);
  return bitWriter.finish();
}

/**
 * @param {ByteWriter} writer
 * @param {number} loopCount
 */
function writeNetscapeLoopExtension(writer, loopCount) {
  writer.writeByte(0x21);
  writer.writeByte(0xff);
  writer.writeByte(0x0b);
  writer.writeBytes([0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]);
  writer.writeByte(0x03);
  writer.writeByte(0x01);
  writer.writeShort(clamp(loopCount, 0, 65_535));
  writer.writeByte(0x00);
}

/**
 * @param {ByteWriter} writer
 * @param {number} delayCs
 * @param {number | null} transparentIndex
 */
function writeGraphicControlExtension(writer, delayCs, transparentIndex) {
  const transparentFlag = transparentIndex !== null ? 1 : 0;
  const disposalMethod = transparentIndex !== null ? 2 : 0;
  const packed = (disposalMethod << 2) | transparentFlag;

  writer.writeByte(0x21);
  writer.writeByte(0xf9);
  writer.writeByte(0x04);
  writer.writeByte(packed);
  writer.writeShort(clamp(delayCs, 1, 65_535));
  writer.writeByte(transparentIndex ?? 0);
  writer.writeByte(0x00);
}

/**
 * @param {ByteWriter} writer
 * @param {number} width
 * @param {number} height
 */
function writeImageDescriptor(writer, width, height) {
  writer.writeByte(0x2c);
  writer.writeShort(0);
  writer.writeShort(0);
  writer.writeShort(width);
  writer.writeShort(height);
  writer.writeByte(0x00);
}

/**
 * @param {Uint8Array} table
 * @returns {number}
 */
function getTableBitSize(table) {
  return Math.max(1, Math.ceil(Math.log2(Math.max(2, table.length / 3))));
}

/**
 * @param {ExtractedFrame[]} frames
 * @param {number} fallbackFps
 * @param {number} index
 * @returns {number}
 */
function getDelayFromFrames(frames, fallbackFps, index) {
  const fallbackSeconds = 1 / Math.max(fallbackFps, 1);
  const nextFrame = frames[index + 1];
  const currentFrame = frames[index];

  if (nextFrame && nextFrame.time > currentFrame.time) {
    return clamp(Math.round((nextFrame.time - currentFrame.time) * 100), 1, 65_535);
  }

  if (index > 0) {
    const previousFrame = frames[index - 1];
    if (currentFrame.time > previousFrame.time) {
      return clamp(Math.round((currentFrame.time - previousFrame.time) * 100), 1, 65_535);
    }
  }

  return clamp(Math.round(fallbackSeconds * 100), 1, 65_535);
}

/**
 * @returns {Promise<void>}
 */
function waitForNextFrame() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

/**
 * @param {ExtractedFrame[]} frames
 * @param {number} fallbackFps
 * @returns {number[]}
 */
export function deriveGifFrameDelays(frames, fallbackFps) {
  return frames.map((_, index) => getDelayFromFrames(frames, fallbackFps, index));
}

/**
 * @param {ExtractedFrame[]} frames
 * @param {GifBuildOptions} options
 * @returns {Promise<Blob>}
 */
export async function buildAnimatedGif(frames, options) {
  if (!frames.length) {
    throw new Error('GIF 导出失败：请先生成至少 1 帧。');
  }

  const width = frames[0]?.image.width ?? 0;
  const height = frames[0]?.image.height ?? 0;

  if (width <= 0 || height <= 0) {
    throw new Error('GIF 导出失败：帧尺寸无效。');
  }

  const normalizedFps = clamp(options.fps, 1, 60);
  const normalizedMaxColors = clamp(
    Math.floor(options.maxColors ?? MAX_GIF_COLORS),
    2,
    MAX_GIF_COLORS,
  );
  const alphaThreshold = clamp(
    options.alphaThreshold ?? DEFAULT_ALPHA_THRESHOLD,
    1,
    255,
  );
  const transparent = Boolean(options.transparent);
  /** @type {Uint8ClampedArray[]} */
  const frameData = [];

  for (const [index, frame] of frames.entries()) {
    frameData.push(getCanvasImageData(frame.image, width, height));
    options.onProgress?.({
      phase: 'palette',
      current: index + 1,
      total: frames.length,
    });

    if ((index + 1) % PROGRESS_YIELD_INTERVAL === 0 && index < frames.length - 1) {
      await waitForNextFrame();
    }
  }

  const palette = buildPalette(frameData, {
    maxColors: normalizedMaxColors,
    transparent,
    alphaThreshold,
  });
  const tableBitSize = getTableBitSize(palette.table);
  const colorTableSizeValue = clamp(tableBitSize - 1, 0, 7);
  const lzwMinCodeSize = Math.max(2, tableBitSize);
  const delays = deriveGifFrameDelays(frames, normalizedFps);
  const writer = new ByteWriter();

  writer.writeBytes(Array.from(GIF_SIGNATURE).map((char) => char.charCodeAt(0)));
  writer.writeShort(width);
  writer.writeShort(height);
  writer.writeByte(0x80 | (7 << 4) | colorTableSizeValue);
  writer.writeByte(0);
  writer.writeByte(0);
  writer.writeBytes(palette.table);

  if (options.loop !== false) {
    writeNetscapeLoopExtension(writer, 0);
  }

  for (let index = 0; index < frameData.length; index += 1) {
    const indexedPixels = buildIndexedPixels(frameData[index], palette, alphaThreshold);
    const lzwData = encodeLzwIndices(indexedPixels, lzwMinCodeSize);

    writeGraphicControlExtension(
      writer,
      delays[index] ?? 10,
      palette.transparentIndex,
    );
    writeImageDescriptor(writer, width, height);
    writer.writeByte(lzwMinCodeSize);
    writeSubBlocks(writer, lzwData);
    options.onProgress?.({
      phase: 'encode',
      current: index + 1,
      total: frameData.length,
    });

    if ((index + 1) % PROGRESS_YIELD_INTERVAL === 0 && index < frameData.length - 1) {
      await waitForNextFrame();
    }
  }

  writer.writeByte(GIF_TRAILER);

  const bytes = writer.toUint8Array().slice();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([buffer], { type: 'image/gif' });
}
