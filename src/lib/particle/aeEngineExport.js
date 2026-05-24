import { CANVAS_H, CANVAS_W } from './aeParticleEngine.js'

function mapEmitterShape(shape) {
  if (shape === 'circle') return 'Circle'
  if (shape === 'fan') return 'Cone'
  return 'Point'
}

function mapBlendMode(mode) {
  return mode === 'add' ? 'Additive' : 'Alpha'
}

export function exportUnityLayer(layer, global, index = 0) {
  const lifeSec = layer.animation.lifetime / global.fps
  return {
    format: 'unity-particle-system-reference-v1',
    layerName: layer.name || `ParticleLayer_${index + 1}`,
    importSteps: [
      'GameObject → Effects → Particle System',
      '将下方 modules 字段对照 Inspector 填入',
      'Transform 位置设为 emitter.x/y（像素需按 PPU 换算）',
    ],
    transform: {
      position: { x: layer.emitter.x - CANVAS_W / 2, y: CANVAS_H / 2 - layer.emitter.y, z: 0 },
      note: 'Canvas 坐标 Y 轴向下，Unity Y 轴向上，已做翻转参考',
    },
    modules: {
      main: {
        duration: global.duration,
        loop: global.loop,
        startLifetime: lifeSec,
        startSpeed: layer.physics.speed,
        startSize: layer.appearance.sizeStart,
        gravityModifier: layer.physics.gravity * 8,
        maxParticles: Math.min(1000, layer.emitter.rate * lifeSec * 2),
      },
      emission: {
        rateOverTime: layer.emitter.rate,
      },
      shape: {
        shapeType: mapEmitterShape(layer.emitter.shape),
        angle: layer.emitter.spread,
        radius: layer.emitter.radius / 100,
        rotation: { x: 0, y: 0, z: layer.emitter.angle },
      },
      colorOverLifetime: {
        colorStart: layer.appearance.colorStart,
        colorEnd: layer.appearance.colorEnd,
        opacityStart: layer.appearance.opacityStart,
        opacityEnd: layer.appearance.opacityEnd,
      },
      renderer: {
        renderMode: layer.appearance.shape === 'texture' ? 'Billboard' : 'Billboard',
        material: layer.appearance.shape === 'texture' ? 'CustomParticleTexture' : 'Default-Particle',
        blendMode: mapBlendMode(layer.render.blendMode),
      },
      velocityOverLifetime: {
        drag: layer.physics.drag,
        turbulence: layer.physics.turbulence,
      },
    },
    keyframes: layer.keyframes ?? [],
  }
}

export function exportPhaserLayer(layer, global, index = 0) {
  const lifeMs = (layer.animation.lifetime / global.fps) * 1000
  return {
    type: 'ParticleEmitter',
    name: layer.name || `emitter_${index + 1}`,
    x: layer.emitter.x,
    y: layer.emitter.y,
    active: layer.visible,
    blendMode: layer.render.blendMode === 'add' ? 'ADD' : 'NORMAL',
    frequency: Math.max(20, 1000 / Math.max(1, layer.emitter.rate)),
    lifespan: lifeMs,
    speed: { min: layer.physics.speed * 0.6, max: layer.physics.speed * 1.2 },
    angle: { min: layer.emitter.angle - layer.emitter.spread / 2, max: layer.emitter.angle + layer.emitter.spread / 2 },
    gravityY: layer.physics.gravity * 60,
    scale: { start: layer.appearance.sizeStart / 8, end: layer.appearance.sizeEnd / 8 },
    tint: { start: layer.appearance.colorStart, end: layer.appearance.colorEnd },
    alpha: { start: layer.appearance.opacityStart, end: layer.appearance.opacityEnd },
    emitZone: layer.emitter.shape === 'circle'
      ? { type: 'random', source: 'circle', radius: layer.emitter.radius }
      : layer.emitter.shape === 'fan'
        ? { type: 'edge', source: 'circle', radius: layer.emitter.radius * 0.3 }
        : { type: 'edge', source: 'point' },
    phaser3Snippet: `// Phaser 3 示例
this.add.particles(${layer.emitter.x}, ${layer.emitter.y}, 'particle_tex', {
  lifespan: ${Math.round(lifeMs)},
  speed: { min: ${(layer.physics.speed * 0.6).toFixed(1)}, max: ${(layer.physics.speed * 1.2).toFixed(1)} },
  scale: { start: ${(layer.appearance.sizeStart / 8).toFixed(2)}, end: ${(layer.appearance.sizeEnd / 8).toFixed(2)} },
  blendMode: '${layer.render.blendMode === 'add' ? 'ADD' : 'NORMAL'}',
  frequency: ${Math.max(20, Math.round(1000 / Math.max(1, layer.emitter.rate)))},
});`,
    keyframes: layer.keyframes ?? [],
  }
}

export function exportEngineBundle(layers, global) {
  return {
    format: 'pixelcraftforge-engine-export-v1',
    canvas: { width: CANVAS_W, height: CANVAS_H },
    global: {
      fps: global.fps,
      duration: global.duration,
      loop: global.loop,
    },
    unity: layers.map((l, i) => exportUnityLayer(l, global, i)),
    phaser: {
      scene: 'ParticleEffectScene',
      emitters: layers.filter((l) => l.visible).map((l, i) => exportPhaserLayer(l, global, i)),
    },
    readme: [
      '=== PixelCraftForge 粒子引擎导出包 ===',
      '',
      '【Unity】',
      '1. 打开 unity_layer_N.json，按 modules 对照 Particle System 模块',
      '2. 序列帧动画可配合导出的 PNG ZIP 作为 Texture Sheet',
      '',
      '【Phaser 3】',
      '1. 打开 phaser_particle.json，复制 phaser3Snippet 到场景 create()',
      '2. 预加载 particle_tex 贴图（或使用导出的序列帧）',
      '',
      '【关键帧】',
      'keyframes 数组可在运行时按 time 插值 emitter 参数',
    ].join('\n'),
  }
}

export function exportUnityReadme() {
  return `# Unity Particle System 导入说明

1. 创建空物体并添加 **Particle System** 组件
2. 打开 \`unity_layer_0.json\`，按 \`modules\` 字段逐项对照 Inspector
3. **Main**：Duration / Loop / Start Lifetime / Start Speed / Start Size / Gravity Modifier
4. **Emission**：Rate over Time = emitter.rate
5. **Shape**：Type 对应 Point / Circle / Cone，Angle = spread
6. **Color over Lifetime**：Gradient 使用 colorStart → colorEnd
7. 若导出 PNG 序列帧，导入为 Sprite Sheet 后赋给 Renderer Material

混合模式 Add → Renderer Material 使用 Additive 粒子材质
`
}

export function exportPhaserReadme() {
  return `# Phaser 3 粒子导入说明

1. preload: \`this.load.image('particle_tex', 'path/to/texture.png')\`
2. create: 复制 JSON 中 \`phaser3Snippet\` 到场景
3. 多层粒子：对每个 emitter 重复 add.particles
4. blendMode 'ADD' 对应 AE 光亮叠加
5. 序列帧：用 \`this.anims.create\` + \`frames\` 替代静态贴图

关键帧 runtime 示例：
\`\`\`js
import { resolveLayerAtTime } from './aeKeyframe.js'
const layer = resolveLayerAtTime(baseLayer, gameTimeSec)
\`\`\`
`
}
