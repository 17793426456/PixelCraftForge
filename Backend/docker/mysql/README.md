# 本地 MySQL

## 方式一：Docker（推荐）

```bash
cd Backend
docker compose up -d
```

## 方式二：本机已安装 MySQL

```sql
CREATE DATABASE IF NOT EXISTS pixel_craft_forge
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pixelcraft'@'%' IDENTIFIED BY 'pixelcraft';
GRANT ALL PRIVILEGES ON pixel_craft_forge.* TO 'pixelcraft'@'%';
FLUSH PRIVILEGES;
```

启动后端时 Flyway 会自动执行 `src/main/resources/db/migration/` 下的建表脚本。
