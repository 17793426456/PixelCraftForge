# 贡献指南

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定可发布版本 |
| `dev-cj` / `dev-chenjie` | 个人开发分支，功能完成后通过 PR 合并到 `main` |

推荐流程：`功能分支` → `dev-*`（自测）→ PR → `main`。

## 提交信息（Conventional Commits）

格式：`<type>(<scope>): <subject>`

- **type**：`feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert`
- **scope**（可选）：模块名，如 `pixel-tools`、`gif`
- **subject**：简短说明，可用中文

示例：

```text
feat(gif): 支持 GIF 帧导出时保留透明通道
fix(sidebar): 修复折叠后图标错位
chore: 升级 vite 依赖
```

本地 `git commit` 会经 **commitlint** 校验；不符合格式会被拒绝。

## 本地 Git 钩子

安装依赖后 `npm install` 会自动执行 `husky`（`prepare` 脚本）：

| 钩子 | 行为 |
|------|------|
| `pre-commit` | 对暂存的 `*.js` / `*.jsx` 运行 ESLint 并自动修复 |
| `commit-msg` | 校验提交信息格式 |

跳过钩子（仅紧急情况）：`git commit --no-verify`（不推荐常态使用）。

## 不要提交的内容

构建产物与缓存已写入 `.gitignore`：`dist/`、`.vite/`、`node_modules/` 等。

若仓库中仍跟踪了 `dist` 或 `.vite`，执行一次性清理：

```bash
git rm -r --cached dist .vite
git commit -m "chore: 停止跟踪构建产物与 Vite 缓存"
```

## CI

推送到 `main`、`dev-cj`、`dev-chenjie` 或针对这些分支的 PR 会触发 GitHub Actions：执行 `npm ci` → `lint` → `build`。

## 常用命令

```bash
npm run dev          # 本地开发
npm run lint         # 全量 ESLint
npm run build        # 生产构建（产物在 dist/，不提交）
npm run lint:staged  # 手动跑与 pre-commit 相同的检查
```
