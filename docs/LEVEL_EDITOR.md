# 2D 关卡编辑器 — 产品边界与规格

## 核心能力

**文字描述 + 拖拽编辑** → 导出可导入游戏引擎的 2D 关卡 JSON。

## 产品边界（已定）

| 维度 | 支持范围 |
|------|----------|
| 视角 | 横版 (`side-scroll`)、俯视 (`top-down`)、侧视 (`side-view`) |
| 游戏类型 | 平台跳跃 (`platformer`)、RPG (`rpg`)、解谜/经营 (`puzzle`) |
| 导出格式 | `pixelcraftforge-level-v1` JSON |
| 引擎适配 | Phaser 3、Godot 4、Unity 2D、Cocos Creator（各引擎子 JSON + 主文档） |
| 瓦片尺寸 | 32×32、64×64（统一网格，禁止混用） |

## JSON 结构概要

```json
{
  "spec": "pixelcraftforge-level-v1",
  "meta": { "name", "view", "gameType", "tileSize", "cols", "rows" },
  "layers": { "background": "[][]", "ground": "[][]" },
  "objects": [{ "id", "assetId", "x", "y", "depth", "rotation", "scale" }],
  "collisions": [{ "id", "x", "y", "w", "h" }],
  "assets": [{ "id", "name", "category", "size", "collision" }]
}
```

引擎导出包（ZIP）内含 `level.json` 及 `phaser/`、`godot/`、`unity/`、`cocos/` 子目录适配文件。

## 前端模块

- **场景画布**：网格绘制、缩放、图层（背景/地面/装饰/碰撞）、锁定/隐藏
- **素材库**：分类、搜索、标签；内置 17 个占位素材（ID/尺寸/碰撞/层级）
- **AI 匹配**：关键词匹配推荐素材（本地，无后端 API）
- **模板**：森林、地下城、城堡、城镇一键生成
- **导出**：JSON、引擎 ZIP、画布 PNG 预览
- **引导**：右侧「搭建技巧」按视角切换提示

## 路由

- 主入口：`/level-editor`
- 旧路径重定向：`/scene`、`/map-editor` → `/level-editor`

## 后续迭代（非 MVP）

- 真实 AI 后端 / 自动布局生成
- 自定义素材上传
- 碰撞体可视化多边形编辑
- Tiled `.tmx` 导出
- 多人协作、云端工程存储
