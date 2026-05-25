# Backend `src/main/resources` 说明

| 文件/目录 | 用途 |
|-----------|------|
| `application.yml` | 默认配置：端口 8080、Flyway、本地存储 `./uploads`、Seedream/Seedance API 占位 |
| `application-local.yml` | **本地私密配置**（已 gitignore）：数据库、ARK Key、OSS。从 `application-local.example.yml` 复制 |
| `application-db.example.yml` | 仅数据库片段示例 |
| `application-oss.example.yml` | 仅 OSS 片段示例 |
| `db/migration/` | Flyway SQL：`V1__init_schema.sql` 建表、`V2__add_asset_category.sql` 分类字段 |

## 存储与静态资源

- `app.storage.type=local`：文件写入 `app.upload.base-dir`（默认 `./uploads`），通过 `/uploads/**` 访问（`WebMvcConfig`）
- `app.storage.type=oss`：上传至阿里云 OSS，`public-base-url` 为前端展示基址

## 对外 API（与前端 `src/lib/api/*` 对应）

| 路径 | 说明 |
|------|------|
| `GET /api/config` | 运行时配置（存储类型、媒体基址、轮询间隔） |
| `GET /api/media/proxy?url=` | 代理 OSS 资源，解决前端 `fetch` 跨域（CORS） |
| `GET /health` | 健康检查 |
| `POST /api/element/generate` | 文生图 |
| `POST /api/element/image-to-image` | 图生图 |
| `POST /api/video/generate` | 文生视频 |
| `POST /api/video/image-to-video` | 图生视频 |
| `GET /api/video/tasks/{id}` | 视频任务状态 |
| `GET /api/generations` | 生成历史分页 |

前端开发：`npm run dev` + 后端 `8080`，Vite 代理 `/api`、`/uploads`、`/health`。
