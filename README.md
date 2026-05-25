# 像素造物 PixelCraft Forge

面向 **2D 游戏美术** 的一站式 AI 创作与本地工具平台：从文生图、视频、像素编辑到关卡搭建与素材管理，前后端分离，可在浏览器内完成从生成到导出的完整流程。

<p align="center">
  <strong>前端</strong> React 19 + Vite 8 &nbsp;·&nbsp;
  <strong>后端</strong> Spring Boot &nbsp;·&nbsp;
  <strong>AI</strong> 火山方舟 Seedream / Seedance
</p>

<p align="center">
  <strong>功能展示视频</strong>：<a href="https://www.bilibili.com/video/BV1gLGo6kEbi/">哔哩哔哩 · BV1gLGo6kEbi</a>
</p>

---

## 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页工作台 | `/` | 快速文生图、模块入口与能力全景 |
| 图片生成 | `/generate` | 文生图 / 图生图，支持批量下载与一键入库 |
| 视频生成 | `/video-generate` | 文生视频、图生视频（首尾帧） |
| AI 视频抽帧 | `/video-frame` | 关键帧抽取、精灵图集 |
| 像素工具箱 | `/pixel-tools` | 画笔、GIF、精灵图、像素化、抠图 |
| 图层编辑器 | `/layer-editor` | 多图层合成、参考图、ZIP 导出 |
| UI 工作室 | `/ui-studio` | UI 三态（normal / hover / disabled）打包 |
| 粒子特效 | `/particle-studio` | 仿 AE 粒子参数、时间轴、序列帧与引擎导出 |
| 2D 地图编辑器 | `/map-editor` | 拖拽搭建、四向地图扩展、素材替换、JSON 导出（`/level-editor` 自动跳转） |
| 素材仓库 | `/library` | 本地 IndexedDB 分类、导入、格式转换与工程备份 |
| 音效生成 | `/sound-effect` | 分类音效合成与导出 |

生成类能力依赖后端 API；像素工具、图层、仓库、粒子等可在 **纯前端 / 本地存储** 下离线使用。

---

## 技术栈

**前端**

- React 19、React Router 6、Vite 8
- Tailwind CSS 4、shadcn/ui 风格组件层（`wrapped-ui`）
- 本地能力：Canvas、IndexedDB（素材仓库）、JSZip、OpenCV.js（部分图像处理）

**后端**（`Backend/`）

- Spring Boot、MySQL（Flyway）、可选阿里云 OSS
- 火山方舟：Seedream（图像）、Seedance（视频）
- 本地开发默认端口 `8080`，静态上传目录 `./uploads`

---

## 快速开始

### 环境要求

- **Node.js** 18+（推荐 20+）
- **JDK** 17+
- **Maven** 3.8+
- （可选）MySQL：云数据库或 Docker 本地实例，见 `Backend/docker/mysql/README.md`

### 1. 安装前端依赖

```bash
npm install
```

### 2. 启动后端（需 API Key 时）

```powershell
# 复制并填写本地配置（勿提交仓库）
copy Backend\src\main\resources\application-local.example.yml Backend\src\main\resources\application-local.yml

cd Backend
.\run-local.ps1
```

健康检查：<http://localhost:8080/health> → `{"status":"UP"}`

在 `application-local.yml` 或环境变量中配置 `SEEDREAM_API_KEY`、数据库账号等，详见 `.env.example` 与 `Backend/src/main/resources/README.md`。

### 3. 启动前端

```bash
npm run dev
```

浏览器打开：<http://localhost:5173/>

Vite 已将 `/api`、`/uploads`、`/health` 代理到 `http://localhost:8080`。

### 4. 生产构建

```bash
npm run build
npm run preview   # 本地预览 dist
```

---

## 项目结构

```
PixelCraftForge/
├── src/
│   ├── pages/              # 各功能页面（Home、Generate、Library、LevelEditor…）
│   ├── components/         # 侧栏、上传区、FeatureHub 等
│   ├── lib/                # API 客户端、粒子引擎、本地素材库、导出工具
│   ├── constants/features/ # 功能目录元数据
│   └── styles/             # 全局与工作室布局样式
├── Backend/                # Spring Boot 服务
├── public/
├── vite.config.js
└── package.json
```

---

## 配置说明

| 文件 | 用途 |
|------|------|
| `.env.example` | 前端环境变量示例（`VITE_API_BASE` 等） |
| `Backend/src/main/resources/application-local.yml` | 本地私密配置（gitignore） |
| `vite.config.js` | 开发代理与构建分包 |

仅做本地图像/像素/仓库编辑时，可不启动后端；使用 **图片生成、视频生成** 时必须保证后端可用且 API Key 有效。

---

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器（5173） |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `Backend/run-local.ps1` | 以 `local` profile 启动 Spring Boot |

---

## 素材仓库说明

- 数据保存在浏览器 **IndexedDB**，清除站点数据会丢失仓库内容。
- 支持按 **功能分类**、**材质分类**、文件夹筛选与名称搜索。
- 支持批量下载、格式转换 ZIP、UI 资源打包与工程元数据快照（localStorage）。

---

## 开发约定

- 提交前可运行 `npm run lint`；已配置 husky + lint-staged。
- 新页面路由在 `src/App.jsx` 注册，侧栏入口在 `src/components/Sidebar/Sidebar.jsx`。
- 功能点文案与路由在 `src/constants/features/` 维护，首页 `FeatureCatalog` 自动聚合。

---

## 许可证

本项目为私有仓库（`private: true`）。对外分发或商用前请自行确认 AI 服务条款与素材版权。

---

<p align="center">
  <sub>像素造物 · 让 2D 游戏素材从想法到引擎，更快一步</sub>
</p>
