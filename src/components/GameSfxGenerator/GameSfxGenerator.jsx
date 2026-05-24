import React, { useEffect, useMemo, useRef, useState } from "react";
import { encodeMp3FromSamples, encodeOggFromSamples } from "../../lib/sfx/audioExport.js";
import { createZipArchive } from "../../lib/sfx/zip.js";
import {
  DEFAULT_SFX_PARAMS,
  SFX_PRESET_ORDER,
  clampSfxParams,
  createSfxPreset,
  deserializeSfxParams,
  encodeSfxWav,
  renderSfx,
  serializeSfxParams,
} from "../../lib/sfx/sfx.js";
import "./GameSfxGenerator.css";
const HISTORY_STORAGE_KEY = "retro-sfx-history-v1";
const SAMPLE_RATE_OPTIONS = [44100, 22050, 11025, 8e3];
const BIT_DEPTH_OPTIONS = [16, 8];
const DEFAULT_EXPANDED_SECTIONS = {
  envelope: true,
  frequency: true,
  modulation: false,
  texture: false,
  filter: false
};
const EXPORT_OPTIONS = [
  { value: "wav", label: "Download .wav" },
  { value: "json", label: "Download .json" },
  { value: "mp3", label: "Download .mp3" },
  { value: "ogg", label: "Download .ogg" }
];
const WAVEFORM_OPTIONS = [
  { value: "square", label: "\u65B9\u6CE2", detail: "\u8857\u673A\u5473\u6700\u5F3A\uFF0C\u9002\u5408\u91D1\u5E01\u3001\u83DC\u5355\u548C\u8DF3\u8DC3\u3002", glyph: "[]" },
  { value: "sawtooth", label: "\u952F\u9F7F\u6CE2", detail: "\u66F4\u4EAE\u66F4\u786C\uFF0C\u9002\u5408\u6FC0\u5149\u548C\u5207\u5272\u611F\u3002", glyph: "/|" },
  { value: "sine", label: "\u6B63\u5F26\u6CE2", detail: "\u66F4\u5706\u6DA6\u5E72\u51C0\uFF0C\u9002\u5408\u63D0\u793A\u97F3\u3002", glyph: "~" },
  { value: "noise", label: "\u566A\u58F0", detail: "\u9897\u7C92\u66F4\u7C97\uFF0C\u9002\u5408\u7206\u70B8\u548C\u547D\u4E2D\u3002", glyph: "::" }
];
const WAVEFORM_LABELS = {
  square: "\u65B9\u6CE2",
  sawtooth: "\u952F\u9F7F\u6CE2",
  sine: "\u6B63\u5F26\u6CE2",
  noise: "\u566A\u58F0"
};
const FOOTSTEP_TERRAIN_LABELS = {
  snow: "\u96EA\u5730",
  grass: "\u8349\u5730",
  dirt: "\u6CE5\u571F",
  gravel: "\u788E\u77F3"
};
const PRESET_LABELS = {
  random: "\u968F\u673A",
  pickupCoin: "\u91D1\u5E01",
  laserShoot: "\u6FC0\u5149",
  explosion: "\u7206\u70B8",
  powerup: "\u5F3A\u5316",
  hitHurt: "\u53D7\u51FB",
  jump: "\u8DF3\u8DC3",
  footstepSnow: "\u96EA\u5730",
  footstepGrass: "\u8349\u5730",
  footstepDirt: "\u6CE5\u571F",
  footstepGravel: "\u788E\u77F3",
  click: "\u70B9\u51FB",
  blipSelect: "\u9009\u62E9",
  synth: "\u5408\u6210",
  tone: "\u97F3\u8C03",
  mutate: "\u53D8\u5F02"
};
const PRESET_DETAILS = {
  random: "\u63A2\u7D22\u7075\u611F",
  pickupCoin: "\u5956\u52B1\u53CD\u9988",
  laserShoot: "\u5C04\u51FB\u8109\u51B2",
  explosion: "\u7206\u88C2\u51B2\u51FB",
  powerup: "\u5347\u7EA7\u63D0\u793A",
  hitHurt: "\u53D7\u51FB\u53CD\u9988",
  jump: "\u52A8\u4F5C\u8D77\u8DF3",
  footstepSnow: "\u677E\u8F6F\u96EA\u5730\u811A\u6B65",
  footstepGrass: "\u8349\u53F6\u6C99\u6C99\u811A\u6B65",
  footstepDirt: "\u5E72\u571F\u8E29\u8E0F\u811A\u6B65",
  footstepGravel: "\u788E\u77F3\u9897\u7C92\u811A\u6B65",
  click: "\u8F7B\u91CF\u70B9\u51FB",
  blipSelect: "\u83DC\u5355\u9009\u62E9",
  synth: "\u7535\u5B50\u97F3\u8272",
  tone: "\u5355\u97F3\u5E95\u8272",
  mutate: "\u5FEB\u901F\u53D8\u4F53"
};
const PRESET_GLYPHS = {
  random: "RND",
  pickupCoin: "COIN",
  laserShoot: "LAS",
  explosion: "EXP",
  powerup: "UP",
  hitHurt: "HIT",
  jump: "JMP",
  footstepSnow: "SNW",
  footstepGrass: "GRS",
  footstepDirt: "DRT",
  footstepGravel: "GRV",
  click: "CLK",
  blipSelect: "SEL",
  synth: "SYN",
  tone: "TON",
  mutate: "ALT"
};
const CONTROL_SECTIONS = [
  { id: "envelope", title: "\u8F6E\u5ED3", description: "\u63A7\u5236\u8D77\u97F3\u3001\u4FDD\u6301\u3001\u51B2\u51FB\u548C\u8870\u51CF\u3002", fields: [
    { key: "attack", label: "\u8D77\u97F3", hint: "\u6570\u503C\u8D8A\u9AD8\uFF0C\u5F00\u5934\u8D8A\u67D4\u548C\u3002", min: 0, max: 1 },
    { key: "sustain", label: "\u4FDD\u6301", hint: "\u51B3\u5B9A\u58F0\u97F3\u4E3B\u4F53\u6301\u7EED\u591A\u4E45\u3002", min: 0, max: 1 },
    { key: "sustainPunch", label: "\u51B2\u51FB", hint: "\u8BA9\u4FDD\u6301\u9636\u6BB5\u66F4\u6709\u7206\u53D1\u611F\u3002", min: 0, max: 1 },
    { key: "decay", label: "\u8870\u51CF", hint: "\u63A7\u5236\u5C3E\u97F3\u65F6\u957F\u3002", min: 0, max: 1 }
  ] },
  { id: "frequency", title: "\u9891\u7387", description: "\u51B3\u5B9A\u8D77\u59CB\u97F3\u9AD8\u3001\u4E0B\u9650\u4E0E\u6ED1\u97F3\u3002", fields: [
    { key: "startFrequency", label: "\u8D77\u59CB", hint: "\u8D8A\u9AD8\u8D8A\u5C16\u9510\u3002", min: 0, max: 1 },
    { key: "minFrequency", label: "\u4E0B\u9650", hint: "\u907F\u514D\u4E0B\u6ED1\u8FC7\u4F4E\u3002", min: 0, max: 1 },
    { key: "slide", label: "\u6ED1\u97F3", hint: "\u8D1F\u503C\u5411\u4E0B\u6ED1\uFF0C\u6B63\u503C\u5411\u4E0A\u6ED1\u3002", min: -1, max: 1, signed: true },
    { key: "deltaSlide", label: "\u6ED1\u97F3\u53D8\u5316", hint: "\u8BA9\u6ED1\u97F3\u52A0\u901F\u6216\u51CF\u901F\u3002", min: -1, max: 1, signed: true }
  ] },
  { id: "modulation", title: "\u8C03\u5236", description: "\u589E\u52A0\u98A4\u97F3\u4E0E\u8DF3\u53D8\u3002", fields: [
    { key: "vibratoDepth", label: "\u98A4\u97F3\u6DF1\u5EA6", hint: "\u63A7\u5236\u6446\u52A8\u5E45\u5EA6\u3002", min: 0, max: 1 },
    { key: "vibratoSpeed", label: "\u98A4\u97F3\u901F\u5EA6", hint: "\u63A7\u5236\u6446\u52A8\u901F\u5EA6\u3002", min: 0, max: 1 },
    { key: "changeAmount", label: "\u8F6C\u8C03", hint: "\u4E2D\u6BB5\u97F3\u9AD8\u8DF3\u53D8\u3002", min: -1, max: 1, signed: true },
    { key: "changeSpeed", label: "\u8F6C\u8C03\u65F6\u673A", hint: "\u63A7\u5236\u8DF3\u53D8\u53D1\u751F\u7684\u65F6\u70B9\u3002", min: 0, max: 1 }
  ] },
  { id: "texture", title: "\u8D28\u611F", description: "\u8C03\u6574\u5360\u7A7A\u6BD4\u3001\u91CD\u590D\u4E0E\u79FB\u76F8\u3002", fields: [
    { key: "squareDuty", label: "\u5360\u7A7A\u6BD4", hint: "\u4E3B\u8981\u5F71\u54CD\u65B9\u6CE2\u539A\u5EA6\u3002", min: 0, max: 1 },
    { key: "dutySweep", label: "\u5360\u7A7A\u6BD4\u626B\u52A8", hint: "\u8BA9\u5360\u7A7A\u6BD4\u968F\u65F6\u95F4\u53D8\u5316\u3002", min: -1, max: 1, signed: true },
    { key: "repeatSpeed", label: "\u91CD\u590D", hint: "\u5468\u671F\u6027\u91CD\u7F6E\u58F0\u97F3\u5F62\u6001\u3002", min: 0, max: 1 },
    { key: "phaserOffset", label: "\u79FB\u76F8\u504F\u79FB", hint: "\u589E\u52A0\u79D1\u5E7B\u611F\u3002", min: -1, max: 1, signed: true },
    { key: "phaserSweep", label: "\u79FB\u76F8\u626B\u52A8", hint: "\u8BA9\u76F8\u4F4D\u968F\u65F6\u95F4\u79FB\u52A8\u3002", min: -1, max: 1, signed: true }
  ] },
  { id: "filter", title: "\u6EE4\u6CE2", description: "\u51B3\u5B9A\u4EAE\u5EA6\u3001\u5171\u632F\u4E0E\u4F4E\u9891\u6E05\u7406\u3002", fields: [
    { key: "lowPassCutoff", label: "\u4F4E\u901A", hint: "\u8D8A\u4F4E\u8D8A\u6697\u3002", min: 0, max: 1 },
    { key: "lowPassSweep", label: "\u4F4E\u901A\u626B\u52A8", hint: "\u8BA9\u4EAE\u5EA6\u968F\u65F6\u95F4\u53D8\u5316\u3002", min: -1, max: 1, signed: true },
    { key: "lowPassResonance", label: "\u5171\u632F", hint: "\u5728\u622A\u6B62\u9891\u7387\u9644\u8FD1\u589E\u52A0\u4E2A\u6027\u3002", min: 0, max: 1 },
    { key: "highPassCutoff", label: "\u9AD8\u901A", hint: "\u5207\u6389\u6D51\u6D4A\u4F4E\u9891\u3002", min: 0, max: 1 },
    { key: "highPassSweep", label: "\u9AD8\u901A\u626B\u52A8", hint: "\u8BA9\u4F4E\u9891\u5207\u9664\u91CF\u53D8\u5316\u3002", min: -1, max: 1, signed: true },
    { key: "masterVolume", label: "\u97F3\u91CF", hint: "\u6700\u7EC8\u8F93\u51FA\u589E\u76CA\u3002", min: 0, max: 1 }
  ] }
];
const FOOTSTEP_CONTROL_FIELDS = [
  { key: "footstepHeel", label: "\u540E\u8DDF", hint: "\u63A7\u5236\u843D\u5730\u7B2C\u4E00\u4E0B\u7684\u649E\u51FB\u611F\u3002" },
  { key: "footstepRoll", label: "\u6EDA\u52A8", hint: "\u63A7\u5236\u811A\u638C\u4ECE\u540E\u5F80\u524D\u6EDA\u52A8\u7684\u6BD4\u4F8B\u3002" },
  { key: "footstepBall", label: "\u524D\u638C", hint: "\u63A7\u5236\u524D\u638C\u79BB\u5730\u524D\u7684\u522E\u64E6\u4E0E\u538B\u611F\u3002" },
  { key: "footstepSwiftness", label: "\u6B65\u901F", hint: "\u8D8A\u9AD8\u8D8A\u77ED\u4FC3\uFF0C\u8D8A\u4F4E\u8D8A\u62D6\u66F3\u3002" }
];
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function isSampleRate(value) {
  return value === 44100 || value === 22050 || value === 11025 || value === 8e3;
}
function isBitDepth(value) {
  return value === 16 || value === 8;
}
function isWaveform(value) {
  return value === "square" || value === "sawtooth" || value === "sine" || value === "noise";
}
function isPresetId(value) {
  return typeof value === "string" && SFX_PRESET_ORDER.includes(value);
}
function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}
function formatSignedPercent(value) {
  return `${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
}
function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}
function formatSampleRateChip(value) {
  return value >= 1e3 ? `${value / 1e3}k` : `${value}`;
}
function formatSampleRateMeta(value) {
  return value % 1e3 === 0 ? `${value / 1e3}kHz` : `${(value / 1e3).toFixed(2)}kHz`;
}
function pad2(value) {
  return value.toString().padStart(2, "0");
}
function formatHistoryDetail(savedAt) {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime()) ? "\u4FDD\u5B58\u65F6\u95F4\u672A\u77E5" : `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function isFootstepPreset(presetId) {
  return presetId === "footstepSnow" || presetId === "footstepGrass" || presetId === "footstepDirt" || presetId === "footstepGravel";
}
function getPreviewMeta(params, sampleRate, bitDepth) {
  return params.engine === "footsteppr" ? `\u811A\u6B65 \xB7 ${FOOTSTEP_TERRAIN_LABELS[params.footstepTerrain]} \xB7 ${formatSampleRateMeta(sampleRate)} \xB7 ${bitDepth} bit` : `${WAVEFORM_LABELS[params.waveform]} \xB7 ${formatSampleRateMeta(sampleRate)} \xB7 ${bitDepth} bit`;
}
function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `sfx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function createDefaultHistoryName(presetId, savedAt) {
  const date = new Date(savedAt);
  const label = presetId ? PRESET_LABELS[presetId] : "\u81EA\u5B9A\u4E49";
  return `${label} / ${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function createSnapshotName(presetId) {
  return presetId ? PRESET_LABELS[presetId] : "custom";
}
function sanitizeFileStem(value) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-") || "retro-sfx";
}
function downloadBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1e3);
}
function drawWaveform(canvas, samples) {
  if (!canvas) return;
  const width = 720;
  const height = 180;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f4e6c2");
  gradient.addColorStop(1, "#cfe6ea");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(34, 58, 78, 0.14)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
  context.strokeStyle = "#126f83";
  context.lineWidth = 2;
  context.beginPath();
  const samplesPerPixel = Math.max(1, Math.floor(samples.length / width));
  for (let x = 0; x < width; x += 1) {
    const start = x * samplesPerPixel;
    const end = Math.min(samples.length, start + samplesPerPixel);
    let min = 1;
    let max = -1;
    for (let index = start; index < end; index += 1) {
      const sample = samples[index] ?? 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }
    const y1 = (1 - max) * height / 2;
    const y2 = (1 - min) * height / 2;
    if (x === 0) context.moveTo(x, y1);
    else context.lineTo(x, y1);
    context.lineTo(x, y2);
  }
  context.stroke();
}
function parseHistoryItem(value) {
  if (!isRecord(value)) return null;
  const params = clampSfxParams(isRecord(value.params) ? value.params : DEFAULT_SFX_PARAMS);
  const waveform = isWaveform(value.waveform) ? value.waveform : params.waveform;
  const presetId = isPresetId(value.presetId) ? value.presetId : null;
  const sampleRate = isSampleRate(value.sampleRate) ? value.sampleRate : 44100;
  const bitDepth = isBitDepth(value.bitDepth) ? value.bitDepth : 16;
  const savedAt = typeof value.savedAt === "string" ? value.savedAt : (/* @__PURE__ */ new Date()).toISOString();
  const name = typeof value.name === "string" && value.name.trim() ? value.name.trim() : createDefaultHistoryName(presetId, savedAt);
  const id = typeof value.id === "string" && value.id.trim() ? value.id : createId();
  return { id, name, savedAt, presetId, params: { ...params, waveform }, sampleRate, bitDepth, waveform };
}
function loadHistoryFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseHistoryItem).filter((item) => item !== null);
  } catch {
    return [];
  }
}
function saveHistoryToStorage(history) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
  }
}
function createHistoryItem(snapshot) {
  const savedAt = (/* @__PURE__ */ new Date()).toISOString();
  return { id: createId(), name: createDefaultHistoryName(snapshot.presetId, savedAt), savedAt, presetId: snapshot.presetId, params: clampSfxParams(snapshot.params), sampleRate: snapshot.sampleRate, bitDepth: snapshot.bitDepth, waveform: snapshot.waveform };
}
function toSnapshot(item) {
  return { name: item.name, presetId: item.presetId, params: item.params, sampleRate: item.sampleRate, bitDepth: item.bitDepth, waveform: item.waveform };
}
async function exportSnapshot(format, snapshot) {
  if (format === "json") return new Blob([serializeSfxParams(snapshot.params)], { type: "application/json" });
  const rendered = renderSfx(snapshot.params, { sampleRate: snapshot.sampleRate, bitDepth: snapshot.bitDepth });
  if (format === "wav") return encodeSfxWav(rendered.samples, snapshot.sampleRate, snapshot.bitDepth);
  if (format === "mp3") return encodeMp3FromSamples(rendered.samples, snapshot.sampleRate);
  return encodeOggFromSamples(rendered.samples, snapshot.sampleRate, snapshot.name);
}
async function exportHistoryArchive(format, items) {
  const zipEntries = await Promise.all(items.map(async (item, index) => {
    const blob = await exportSnapshot(format, toSnapshot(item));
    return {
      name: `${String(index + 1).padStart(2, "0")}-${sanitizeFileStem(item.name)}.${format}`,
      data: new Uint8Array(await new Response(blob).arrayBuffer()),
      lastModified: new Date(item.savedAt)
    };
  }));
  return createZipArchive(zipEntries);
}
function SliderField(props) {
  const { label, hint, value, display, min, max, step = 0.01, onChange } = props;
  return /* @__PURE__ */ React.createElement("label", { className: "slider-card" }, /* @__PURE__ */ React.createElement("div", { className: "slider-card__topline" }, /* @__PURE__ */ React.createElement("span", { className: "slider-card__label" }, label), /* @__PURE__ */ React.createElement("span", { className: "slider-card__value" }, display)), /* @__PURE__ */ React.createElement("input", { type: "range", min, max, step, value, onChange: (event) => onChange(Number(event.target.value)) }), /* @__PURE__ */ React.createElement("small", null, hint));
}
function ExportMenu(props) {
  const { menuId, label, triggerText, variant = "inline", isOpen, isExporting, triggerClassName, onToggle, onExport } = props;
  return /* @__PURE__ */ React.createElement("div", { className: `export-menu ${isOpen ? "is-open" : ""}` }, /* @__PURE__ */ React.createElement("button", { className: triggerClassName, type: "button", "aria-haspopup": "menu", "aria-expanded": isOpen, "aria-label": label, disabled: isExporting, onClick: () => onToggle(menuId) }, variant === "console" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "export-menu__copy" }, /* @__PURE__ */ React.createElement("span", { className: "export-menu__eyebrow" }, isExporting ? "Encoding" : "File Output"), /* @__PURE__ */ React.createElement("span", { className: "export-menu__title" }, isExporting ? "\u5BFC\u51FA\u4E2D..." : "\u5BFC\u51FA\u97F3\u6548")), /* @__PURE__ */ React.createElement("span", { className: "export-menu__caret export-menu__caret--console", "aria-hidden": "true" }, "\u25BE")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, isExporting ? "\u5BFC\u51FA\u4E2D..." : triggerText ?? "\u5BFC\u51FA"), /* @__PURE__ */ React.createElement("span", { className: "export-menu__caret", "aria-hidden": "true" }, "\u25BE"))), isOpen ? /* @__PURE__ */ React.createElement("div", { className: "export-menu__list", role: "menu", "aria-label": `${label} \u83DC\u5355` }, EXPORT_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("button", { key: option.value, className: "export-menu__item", type: "button", role: "menuitem", onClick: () => onExport(option.value) }, option.label))) : null);
}
function GameSfxGenerator() {
  const [params, setParams] = useState(DEFAULT_SFX_PARAMS);
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState(16);
  const [activePreset, setActivePreset] = useState(null);
  const [serialized, setSerialized] = useState(() => serializeSfxParams(DEFAULT_SFX_PARAMS));
  const [status, setStatus] = useState("\u5DF2\u52A0\u8F7D\u9ED8\u8BA4\u97F3\u8272\u3002\u5148\u9009\u4E00\u4E2A\u9884\u8BBE\uFF0C\u518D\u4ECE\u8F6E\u5ED3\u548C\u9891\u7387\u5F00\u59CB\u5FAE\u8C03\u3002");
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState(() => loadHistoryFromStorage());
  const [openExportMenu, setOpenExportMenu] = useState(null);
  const [exportingMenuId, setExportingMenuId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editingHistoryName, setEditingHistoryName] = useState("");
  const [expandedSections, setExpandedSections] = useState({ ...DEFAULT_EXPANDED_SECTIONS });
  const waveformCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const autoPreviewTimerRef = useRef(null);
  const paramsRef = useRef(DEFAULT_SFX_PARAMS);
  const rendered = useMemo(() => renderSfx(params, { sampleRate, bitDepth }), [params, sampleRate, bitDepth]);
  const currentSnapshot = useMemo(() => ({ name: createSnapshotName(activePreset), presetId: activePreset, params, sampleRate, bitDepth, waveform: params.waveform }), [activePreset, params, sampleRate, bitDepth]);
  const isFootstepMode = params.engine === "footsteppr";
  useEffect(() => {
    drawWaveform(waveformCanvasRef.current, rendered.samples);
  }, [rendered.samples]);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    setSerialized(serializeSfxParams(params));
  }, [params]);
  useEffect(() => {
    saveHistoryToStorage(history);
  }, [history]);
  useEffect(() => () => {
    if (autoPreviewTimerRef.current !== null) window.clearTimeout(autoPreviewTimerRef.current);
    try {
      sourceRef.current?.stop();
    } catch {
    }
    if (audioContextRef.current) void audioContextRef.current.close();
  }, []);
  const commitParams = (nextValue) => setParams((current) => clampSfxParams(typeof nextValue === "function" ? nextValue(current) : nextValue));
  const ensureAudioContext = async () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();
    return audioContextRef.current;
  };
  const playSnapshot = async (snapshot, message) => {
    const audioContext = await ensureAudioContext();
    const nextRendered = renderSfx(snapshot.params, { sampleRate: snapshot.sampleRate, bitDepth: snapshot.bitDepth });
    try {
      sourceRef.current?.stop();
    } catch {
    }
    const buffer = audioContext.createBuffer(1, nextRendered.samples.length, snapshot.sampleRate);
    buffer.getChannelData(0).set(nextRendered.samples);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      if (sourceRef.current === source) {
        sourceRef.current = null;
        setIsPlaying(false);
      }
    };
    source.start();
    sourceRef.current = source;
    setIsPlaying(true);
    setStatus(message);
  };
  const queueAutoPreview = (snapshot, message, delay = 0) => {
    if (autoPreviewTimerRef.current !== null) {
      window.clearTimeout(autoPreviewTimerRef.current);
      autoPreviewTimerRef.current = null;
    }
    const runPreview = () => {
      void playSnapshot(snapshot, message).catch((error) => {
        setStatus(error instanceof Error ? error.message : "\u81EA\u52A8\u8BD5\u542C\u5931\u8D25\u3002");
      });
    };
    if (delay <= 0) {
      runPreview();
      return;
    }
    autoPreviewTimerRef.current = window.setTimeout(() => {
      autoPreviewTimerRef.current = null;
      runPreview();
    }, delay);
  };
  const updateParam = (key, value) => {
    const nextParams = clampSfxParams({ ...paramsRef.current, engine: "sfxr", [key]: value });
    setActivePreset(null);
    commitParams(nextParams);
    queueAutoPreview(
      { name: createSnapshotName(null), presetId: null, params: nextParams, sampleRate, bitDepth, waveform: nextParams.waveform },
      key === "waveform" ? `\u6B63\u5728\u8BD5\u542C${WAVEFORM_LABELS[nextParams.waveform]}\u6CE2\u5F62\u3002` : "\u6B63\u5728\u8BD5\u542C\u8C03\u6574\u540E\u7684\u97F3\u6548\u3002",
      key === "waveform" ? 0 : 140
    );
  };
  const updateFootstepParam = (key, value) => {
    const nextParams = clampSfxParams({ ...paramsRef.current, engine: "footsteppr", [key]: value });
    if (isFootstepPreset(activePreset)) {
      setActivePreset(activePreset);
    } else {
      setActivePreset(null);
    }
    commitParams(nextParams);
    queueAutoPreview(
      { name: createSnapshotName(activePreset), presetId: activePreset, params: nextParams, sampleRate, bitDepth, waveform: nextParams.waveform },
      `\u6B63\u5728\u8BD5\u542C${FOOTSTEP_TERRAIN_LABELS[nextParams.footstepTerrain]}\u811A\u6B65\u3002`,
      120
    );
  };
  const toggleSection = (sectionId) => setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  const handlePreset = (preset) => {
    const nextParams = createSfxPreset(preset, paramsRef.current);
    commitParams(nextParams);
    setActivePreset(preset);
    setStatus(`\u5DF2\u751F\u6210\u300C${PRESET_LABELS[preset]}\u300D\u9884\u8BBE\u3002`);
    queueAutoPreview(
      { name: createSnapshotName(preset), presetId: preset, params: nextParams, sampleRate, bitDepth, waveform: nextParams.waveform },
      `\u6B63\u5728\u8BD5\u542C\u300C${PRESET_LABELS[preset]}\u300D\u9884\u8BBE\u3002`
    );
  };
  const handlePlayCurrent = async () => {
    try {
      await playSnapshot(currentSnapshot, "\u6B63\u5728\u8BD5\u542C\u5F53\u524D\u97F3\u6548\u3002");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "\u64AD\u653E\u5931\u8D25\u3002");
    }
  };
  const handlePlayHistory = async (item) => {
    try {
      await playSnapshot(toSnapshot(item), `\u6B63\u5728\u8BD5\u542C\u5386\u53F2\u300C${item.name}\u300D\u3002`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "\u5386\u53F2\u8BD5\u542C\u5931\u8D25\u3002");
    }
  };
  const handleCopyJson = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(serialized);
      setStatus("\u53C2\u6570 JSON \u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\u3002");
    } catch {
      setStatus("\u590D\u5236\u5931\u8D25\u3002");
    }
  };
  const handleApplyJson = () => {
    try {
      const nextParams = deserializeSfxParams(serialized);
      setActivePreset(null);
      commitParams(nextParams);
      setStatus("\u53C2\u6570 JSON \u5DF2\u5E94\u7528\u5230\u5DE5\u4F5C\u53F0\u3002");
    } catch (error) {
      setStatus(error instanceof Error ? `JSON \u65E0\u6548\uFF1A${error.message}` : "JSON \u65E0\u6548\u3002");
    }
  };
  const handleJsonChange = (event) => setSerialized(event.target.value);
  const saveCurrentToHistory = () => {
    const nextItem = createHistoryItem(currentSnapshot);
    setHistory((current) => [nextItem, ...current]);
    setEditingHistoryId(nextItem.id);
    setEditingHistoryName(nextItem.name);
    setStatus(`\u5DF2\u4FDD\u5B58\u5230\u751F\u6210\u5386\u53F2\uFF1A\u300C${nextItem.name}\u300D\u3002`);
  };
  const applyHistoryToWorkbench = (item) => {
    const nextParams = clampSfxParams({ ...item.params, waveform: item.waveform });
    setParams(nextParams);
    setSampleRate(item.sampleRate);
    setBitDepth(item.bitDepth);
    setActivePreset(item.presetId);
    setSerialized(serializeSfxParams(nextParams));
    setStatus(`\u5DF2\u5E94\u7528\u56DE\u5DE5\u4F5C\u53F0\uFF1A\u300C${item.name}\u300D\u3002`);
    setOpenExportMenu(null);
  };
  const deleteHistoryItem = (item) => {
    setHistory((current) => current.filter((entry) => entry.id !== item.id));
    if (editingHistoryId === item.id) {
      setEditingHistoryId(null);
      setEditingHistoryName("");
    }
    if (openExportMenu === `history-${item.id}`) {
      setOpenExportMenu(null);
    }
    setStatus(`\u5DF2\u5220\u9664\u5386\u53F2\u8BB0\u5F55\uFF1A\u300C${item.name}\u300D\u3002`);
  };
  const commitHistoryRename = () => {
    if (!editingHistoryId) return;
    setHistory((current) => current.map((item) => item.id === editingHistoryId ? { ...item, name: editingHistoryName.trim() || item.name } : item));
    setEditingHistoryId(null);
    setEditingHistoryName("");
  };
  const handleHistoryRenameKeyDown = (event) => {
    if (event.key === "Enter") commitHistoryRename();
    if (event.key === "Escape") {
      setEditingHistoryId(null);
      setEditingHistoryName("");
    }
  };
  const toggleExportMenu = (menuId) => setOpenExportMenu((current) => current === menuId ? null : menuId);
  const runExport = async (format, snapshot, menuId, sourceLabel) => {
    setExportingMenuId(menuId);
    setStatus(`\u6B63\u5728\u5BFC\u51FA ${sourceLabel} \u7684 .${format} \u6587\u4EF6\u3002`);
    try {
      const blob = await exportSnapshot(format, snapshot);
      downloadBlob(blob, `${sanitizeFileStem(snapshot.name)}.${format}`);
      setStatus(`${sourceLabel} \u5DF2\u5BFC\u51FA\u4E3A .${format}\u3002`);
      setOpenExportMenu(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `\u5BFC\u51FA .${format} \u5931\u8D25\u3002`);
    } finally {
      setExportingMenuId(null);
    }
  };
  const runHistoryArchiveExport = async (format) => {
    if (history.length === 0) {
      setStatus("\u751F\u6210\u5386\u53F2\u91CC\u8FD8\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u8BB0\u5F55\u3002");
      return;
    }
    const menuId = "history-all";
    setExportingMenuId(menuId);
    setStatus(`\u6B63\u5728\u6253\u5305\u5168\u90E8\u5386\u53F2\u8BB0\u5F55\u7684 .${format} ZIP\u3002`);
    try {
      const blob = await exportHistoryArchive(format, history);
      downloadBlob(blob, `retro-sfx-history-${format}.zip`);
      setStatus(`\u5168\u90E8\u5386\u53F2\u8BB0\u5F55\u5DF2\u5BFC\u51FA\u4E3A .${format} ZIP\u3002`);
      setOpenExportMenu(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `\u5168\u90E8\u5BFC\u51FA .${format} \u5931\u8D25\u3002`);
    } finally {
      setExportingMenuId(null);
    }
  };
  return /* @__PURE__ */ React.createElement("section", { className: "workbench-card", "aria-label": "\u97F3\u6548\u5DE5\u4F5C\u53F0" }, /* @__PURE__ */ React.createElement("div", { className: "workbench-layout" }, /* @__PURE__ */ React.createElement("div", { className: "editor-column" }, /* @__PURE__ */ React.createElement("section", { className: "console-surface preset-rack", "aria-labelledby": "preset-strip-title" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "Preset Rack"), /* @__PURE__ */ React.createElement("h3", { id: "preset-strip-title" }, "\u97F3\u6548\u9884\u8BBE")), /* @__PURE__ */ React.createElement("span", null, "\u5148\u9009\u65B9\u5411\uFF0C\u518D\u5FAE\u8C03\u53C2\u6570\u3002")), /* @__PURE__ */ React.createElement("div", { className: "preset-strip", role: "toolbar", "aria-label": "\u97F3\u6548\u9884\u8BBE" }, SFX_PRESET_ORDER.map((preset) => /* @__PURE__ */ React.createElement("button", { key: preset, type: "button", "aria-pressed": activePreset === preset, className: `preset-button ${preset === "mutate" ? "preset-button--mutate" : ""} ${activePreset === preset ? "is-active" : ""}`, onClick: () => handlePreset(preset) }, /* @__PURE__ */ React.createElement("span", { className: "preset-button__glyph", "aria-hidden": "true" }, PRESET_GLYPHS[preset]), /* @__PURE__ */ React.createElement("span", { className: "preset-button__copy" }, /* @__PURE__ */ React.createElement("span", { className: "preset-button__label" }, PRESET_LABELS[preset]), /* @__PURE__ */ React.createElement("small", null, PRESET_DETAILS[preset])))))), isFootstepMode ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "console-surface control-section is-open", "aria-labelledby": "footstep-controls-title" }, /* @__PURE__ */ React.createElement("div", { className: "control-section__toggle" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "Footsteps"), /* @__PURE__ */ React.createElement("h3", { id: "footstep-controls-title" }, "\u811A\u6B65\u52A8\u6001"), /* @__PURE__ */ React.createElement("span", null, "\u8C03\u6574\u843D\u5730\u8282\u594F\u3001\u91CD\u5FC3\u63A8\u8FDB\u548C\u6B65\u4F10\u901F\u5EA6\u3002"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "slider-grid" }, FOOTSTEP_CONTROL_FIELDS.map((field) => /* @__PURE__ */ React.createElement(
    SliderField,
    {
      key: field.key,
      label: field.label,
      hint: field.hint,
      value: params[field.key],
      display: formatPercent(params[field.key]),
      min: 0,
      max: 1,
      onChange: (nextValue) => updateFootstepParam(field.key, nextValue)
    }
  )))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "console-surface waveform-bay", "aria-labelledby": "waveform-panel-title" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "Waveform"), /* @__PURE__ */ React.createElement("h3", { id: "waveform-panel-title" }, "\u57FA\u7840\u6CE2\u5F62")), /* @__PURE__ */ React.createElement("span", null, "\u5148\u9009\u5E95\u8272\uFF0C\u518D\u4FEE\u7EC6\u8282\u3002")), /* @__PURE__ */ React.createElement("div", { className: "waveform-grid" }, WAVEFORM_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("label", { key: option.value, className: `mode-pill ${params.waveform === option.value ? "is-active" : ""}` }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "sfx-waveform", checked: params.waveform === option.value, "aria-label": option.label, onChange: () => updateParam("waveform", option.value) }), /* @__PURE__ */ React.createElement("div", { className: "mode-pill__badge", "aria-hidden": "true" }, option.glyph), /* @__PURE__ */ React.createElement("div", { className: "mode-pill__copy" }, /* @__PURE__ */ React.createElement("span", { className: "mode-pill__label" }, option.label), /* @__PURE__ */ React.createElement("small", null, option.detail)))))), /* @__PURE__ */ React.createElement("div", { className: "section-stack" }, CONTROL_SECTIONS.map((section) => {
    const expanded = expandedSections[section.id];
    return /* @__PURE__ */ React.createElement("section", { key: section.id, className: `console-surface control-section ${expanded ? "is-open" : ""}` }, /* @__PURE__ */ React.createElement("button", { className: "control-section__toggle", type: "button", "aria-expanded": expanded, "aria-controls": `control-section-panel-${section.id}`, onClick: () => toggleSection(section.id) }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "Control Group"), /* @__PURE__ */ React.createElement("h3", null, section.title), /* @__PURE__ */ React.createElement("span", null, section.description)), /* @__PURE__ */ React.createElement("span", { className: "control-section__state" }, expanded ? "\u6536\u8D77" : "\u5C55\u5F00")), /* @__PURE__ */ React.createElement("div", { id: `control-section-panel-${section.id}`, hidden: !expanded }, /* @__PURE__ */ React.createElement("div", { className: "slider-grid" }, section.fields.map((field) => {
      const value = params[field.key];
      return /* @__PURE__ */ React.createElement(SliderField, { key: field.key, label: field.label, hint: field.hint, value, display: field.signed ? formatSignedPercent(value) : formatPercent(value), min: field.min, max: field.max, step: field.step, onChange: (nextValue) => updateParam(field.key, nextValue) });
    }))));
  })))), /* @__PURE__ */ React.createElement("aside", { className: "preview-column" }, /* @__PURE__ */ React.createElement("section", { className: `console-surface preview-dock ${isPlaying ? "is-live" : ""}`, "aria-labelledby": "preview-title" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head preview-dock__head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "Live Monitor"), /* @__PURE__ */ React.createElement("h3", { id: "preview-title" }, "\u9884\u89C8")), /* @__PURE__ */ React.createElement("span", { className: "preview-dock__meta" }, getPreviewMeta(params, sampleRate, bitDepth))), /* @__PURE__ */ React.createElement("div", { className: "waveform-frame" }, /* @__PURE__ */ React.createElement("canvas", { ref: waveformCanvasRef, className: "waveform-canvas" })), /* @__PURE__ */ React.createElement("div", { className: "stats-grid" }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("span", null, "\u65F6\u957F"), /* @__PURE__ */ React.createElement("strong", null, rendered.stats.durationSeconds.toFixed(2), "s")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("span", null, "\u91C7\u6837\u6570"), /* @__PURE__ */ React.createElement("strong", null, rendered.stats.samples.toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("span", null, "\u5CF0\u503C"), /* @__PURE__ */ React.createElement("strong", null, rendered.stats.peak.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("span", null, "\u524A\u6CE2\u6570"), /* @__PURE__ */ React.createElement("strong", null, rendered.stats.clippedSamples.toLocaleString()))), /* @__PURE__ */ React.createElement("div", { className: "preview-options" }, /* @__PURE__ */ React.createElement("div", { className: "inline-options" }, /* @__PURE__ */ React.createElement("span", null, "\u91C7\u6837\u7387"), /* @__PURE__ */ React.createElement("div", { className: "chip-group" }, SAMPLE_RATE_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("button", { key: option, className: `segmented-button ${sampleRate === option ? "is-active" : ""}`, type: "button", onClick: () => setSampleRate(option) }, formatSampleRateChip(option))))), /* @__PURE__ */ React.createElement("div", { className: "inline-options" }, /* @__PURE__ */ React.createElement("span", null, "\u4F4D\u6DF1"), /* @__PURE__ */ React.createElement("div", { className: "chip-group" }, BIT_DEPTH_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("button", { key: option, className: `segmented-button ${bitDepth === option ? "is-active" : ""}`, type: "button", onClick: () => setBitDepth(option) }, option, " bit"))))), /* @__PURE__ */ React.createElement("div", { className: "monitor-actions" }, /* @__PURE__ */ React.createElement("button", { className: "primary-button play-button", type: "button", "aria-label": isPlaying ? "\u91CD\u65B0\u64AD\u653E\u97F3\u6548" : "\u64AD\u653E\u97F3\u6548", onClick: () => {
    void handlePlayCurrent();
  } }, /* @__PURE__ */ React.createElement("span", { className: "play-button__icon", "aria-hidden": "true" }, isPlaying ? "\u21BB" : "\u25B6"), /* @__PURE__ */ React.createElement("span", { className: "play-button__copy" }, /* @__PURE__ */ React.createElement("span", { className: "play-button__label" }, isPlaying ? "\u91CD\u65B0\u64AD\u653E" : "\u64AD\u653E\u97F3\u6548"), /* @__PURE__ */ React.createElement("small", null, isPlaying ? "\u4ECE\u5934\u8BD5\u542C\u5F53\u524D\u97F3\u6548" : "\u7ACB\u5373\u8BD5\u542C\u5F53\u524D\u97F3\u6548"))), /* @__PURE__ */ React.createElement("button", { className: "secondary-button secondary-button--teal save-button", type: "button", "aria-label": "\u4FDD\u5B58\u5F53\u524D\u97F3\u6548", onClick: saveCurrentToHistory }, "\u4FDD\u5B58\u5230\u5386\u53F2"), /* @__PURE__ */ React.createElement("div", { className: "preview-dock__footer" }, /* @__PURE__ */ React.createElement("div", { className: "option-card option-card--monitor" }, /* @__PURE__ */ React.createElement("span", null, "\u9884\u8BA1\u5BFC\u51FA\u4F53\u79EF"), /* @__PURE__ */ React.createElement("strong", null, formatBytes(rendered.stats.estimatedByteSize))), /* @__PURE__ */ React.createElement(ExportMenu, { menuId: "current", label: "\u5F53\u524D\u97F3\u6548\u5BFC\u51FA", variant: "console", isOpen: openExportMenu === "current", isExporting: exportingMenuId === "current", triggerClassName: "export-menu__trigger export-menu__trigger--console", onToggle: toggleExportMenu, onExport: (format) => {
    void runExport(format, currentSnapshot, "current", "\u5F53\u524D\u97F3\u6548");
  } }))), /* @__PURE__ */ React.createElement("div", { className: `status-banner ${isPlaying ? "status-banner--live" : ""}`, role: "status" }, status)), /* @__PURE__ */ React.createElement("section", { className: "console-surface history-panel", "aria-labelledby": "history-title" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head history-panel__head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "History"), /* @__PURE__ */ React.createElement("h3", { id: "history-title" }, "\u751F\u6210\u5386\u53F2")), /* @__PURE__ */ React.createElement("div", { className: "history-panel__tools" }, /* @__PURE__ */ React.createElement("span", null, history.length > 0 ? `\u5DF2\u4FDD\u5B58 ${history.length} \u6761\u8BB0\u5F55` : "\u4FDD\u5B58\u540E\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002"), history.length > 0 ? /* @__PURE__ */ React.createElement(ExportMenu, { menuId: "history-all", label: "\u5168\u90E8\u5386\u53F2\u5BFC\u51FA", triggerText: "\u5168\u90E8\u5BFC\u51FA", variant: "inline", isOpen: openExportMenu === "history-all", isExporting: exportingMenuId === "history-all", triggerClassName: "ghost-button export-menu__trigger export-menu__trigger--inline", onToggle: toggleExportMenu, onExport: (format) => {
    void runHistoryArchiveExport(format);
  } }) : null)), history.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "history-empty", "data-testid": "history-empty-state" }, /* @__PURE__ */ React.createElement("strong", null, "\u8FD8\u6CA1\u6709\u4FDD\u5B58\u8BB0\u5F55"), /* @__PURE__ */ React.createElement("p", null, "\u70B9\u51FB\u201C\u4FDD\u5B58\u5230\u5386\u53F2\u201D\u540E\uFF0C\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002")) : /* @__PURE__ */ React.createElement("div", { className: "history-list" }, history.map((item) => {
    const isEditing = editingHistoryId === item.id;
    const menuId = `history-${item.id}`;
    return /* @__PURE__ */ React.createElement("article", { key: item.id, className: "history-card" }, /* @__PURE__ */ React.createElement("div", { className: "history-card__head" }, isEditing ? /* @__PURE__ */ React.createElement("input", { className: "history-card__input", autoFocus: true, "aria-label": "\u5386\u53F2\u8BB0\u5F55\u540D\u79F0", value: editingHistoryName, onChange: (event) => setEditingHistoryName(event.target.value), onBlur: commitHistoryRename, onKeyDown: handleHistoryRenameKeyDown }) : /* @__PURE__ */ React.createElement("button", { className: "history-card__title", type: "button", onClick: () => {
      setEditingHistoryId(item.id);
      setEditingHistoryName(item.name);
    } }, item.name), /* @__PURE__ */ React.createElement("button", { className: "ghost-button history-card__rename", type: "button", onClick: () => deleteHistoryItem(item) }, "\u5220\u9664")), /* @__PURE__ */ React.createElement("div", { className: "history-card__meta" }, formatHistoryDetail(item.savedAt)), /* @__PURE__ */ React.createElement("div", { className: "history-card__chips" }, /* @__PURE__ */ React.createElement("span", { className: "history-chip" }, item.presetId ? PRESET_LABELS[item.presetId] : "\u81EA\u5B9A\u4E49"), /* @__PURE__ */ React.createElement("span", { className: "history-chip" }, item.params.engine === "footsteppr" ? FOOTSTEP_TERRAIN_LABELS[item.params.footstepTerrain] : WAVEFORM_LABELS[item.waveform]), /* @__PURE__ */ React.createElement("span", { className: "history-chip" }, formatSampleRateMeta(item.sampleRate)), /* @__PURE__ */ React.createElement("span", { className: "history-chip" }, item.bitDepth, " bit")), /* @__PURE__ */ React.createElement("div", { className: "history-card__actions" }, /* @__PURE__ */ React.createElement("button", { className: "ghost-button", type: "button", onClick: () => applyHistoryToWorkbench(item) }, "\u5E94\u7528"), /* @__PURE__ */ React.createElement("button", { className: "ghost-button", type: "button", onClick: () => {
      void handlePlayHistory(item);
    } }, "\u64AD\u653E"), /* @__PURE__ */ React.createElement(ExportMenu, { menuId, label: `${item.name} \u5BFC\u51FA`, variant: "inline", isOpen: openExportMenu === menuId, isExporting: exportingMenuId === menuId, triggerClassName: "ghost-button export-menu__trigger export-menu__trigger--inline", onToggle: toggleExportMenu, onExport: (format) => {
      void runExport(format, toSnapshot(item), menuId, `\u5386\u53F2\u8BB0\u5F55\u300C${item.name}\u300D`);
    } })));
  }))), /* @__PURE__ */ React.createElement("section", { className: "console-surface advanced-editor-panel", "aria-labelledby": "json-panel-title" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "section-kicker" }, "Advanced"), /* @__PURE__ */ React.createElement("h3", { id: "json-panel-title" }, "\u53C2\u6570 JSON")), /* @__PURE__ */ React.createElement("span", null, "\u590D\u5236\u3001\u7C98\u8D34\u6216\u76F4\u63A5\u7F16\u8F91\u53C2\u6570\u3002")), /* @__PURE__ */ React.createElement("div", { className: "advanced-editor" }, /* @__PURE__ */ React.createElement("textarea", { id: "sfx-json-editor", className: "json-editor", "aria-label": "\u53C2\u6570 JSON \u7F16\u8F91\u5668", value: serialized, onChange: handleJsonChange }), /* @__PURE__ */ React.createElement("div", { className: "json-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ghost-button", type: "button", onClick: () => {
    void handleCopyJson();
  } }, "\u590D\u5236 JSON"), /* @__PURE__ */ React.createElement("button", { className: "ghost-button", type: "button", onClick: handleApplyJson }, "\u5E94\u7528 JSON")))))));
}
export {
  GameSfxGenerator as default
};
