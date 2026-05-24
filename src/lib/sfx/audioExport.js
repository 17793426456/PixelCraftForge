// game-sfx-generator-web-main/game-sfx-generator-web-main/src/lib/audioExport.ts
import lamejsScriptUrl from "lamejs/lame.all.js?url";
var lameScriptPromise = null;
function getGlobalMp3Encoder() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.lamejs?.Mp3Encoder ?? null;
}
async function loadMp3Encoder() {
  const existing = getGlobalMp3Encoder();
  if (existing) {
    return existing;
  }
  if (!lameScriptPromise) {
    lameScriptPromise = new Promise((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("MP3 encoder can only load in the browser."));
        return;
      }
      const script = document.createElement("script");
      script.src = lamejsScriptUrl;
      script.async = true;
      script.onload = () => {
        const encoder = getGlobalMp3Encoder();
        if (!encoder) {
          reject(new Error("MP3 encoder loaded but no global entry was found."));
          return;
        }
        resolve(encoder);
      };
      script.onerror = () => reject(new Error("Failed to load the MP3 encoder script."));
      document.head.appendChild(script);
    });
  }
  return lameScriptPromise;
}
function resolveVorbisEncoder(module) {
  const candidate = module;
  if (candidate.encoder) {
    return candidate.encoder;
  }
  if (candidate.default?.encoder) {
    return candidate.default.encoder;
  }
  throw new Error("Failed to load the OGG encoder.");
}
function toInt16Pcm(samples) {
  const pcm = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    pcm[index] = sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
  }
  return pcm;
}
async function encodeMp3FromSamples(samples, sampleRate) {
  const Mp3Encoder = await loadMp3Encoder();
  const encoder = new Mp3Encoder(1, sampleRate, sampleRate >= 32e3 ? 128 : 96);
  const pcm = toInt16Pcm(samples);
  const chunks = [];
  const blockSize = 1152;
  for (let index = 0; index < pcm.length; index += blockSize) {
    const chunk = pcm.subarray(index, index + blockSize);
    const encoded = encoder.encodeBuffer(chunk);
    if (encoded.length > 0) {
      const bytes = Uint8Array.from(encoded);
      chunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
  }
  const flushed = encoder.flush();
  if (flushed.length > 0) {
    const bytes = Uint8Array.from(flushed);
    chunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
  return new Blob(chunks, { type: "audio/mpeg" });
}
async function encodeOggFromSamples(samples, sampleRate, title) {
  const module = await import("vorbis-encoder-js");
  const VorbisEncoder = resolveVorbisEncoder(module);
  const encoder = new VorbisEncoder(sampleRate, 1, 0.4, { TITLE: title });
  const blockSize = 4096;
  for (let index = 0; index < samples.length; index += blockSize) {
    encoder.encode([samples.slice(index, index + blockSize)]);
  }
  return encoder.finish("audio/ogg");
}
export {
  encodeMp3FromSamples,
  encodeOggFromSamples
};
