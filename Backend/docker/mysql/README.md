# 数据库说明

项目默认使用 **腾讯云 MySQL 8.0**（实例 `cdb220732`），不再依赖本地 Docker 启动数据库。

## 连接信息

| 项 | 值 |
|---|---|
| 内网地址 | `172.27.0.14:3306` |
| 数据库名 | `pixel_craft_forge`（需在控制台先创建） |
| 引擎 | MySQL 8.0 / InnoDB |

## 首次使用（腾讯云控制台）

1. 登录 [腾讯云 MySQL 控制台](https://console.cloud.tencent.com/cdb)
2. 进入实例 `cdb220732` → **数据库管理** → 新建数据库 `pixel_craft_forge`，字符集 `utf8mb4`
3. **账号管理** 中确认有可用账号（如 `root` 或业务账号），并授权该库
4. **安全组**：若后端跑在 CVM，放行 CVM 访问 `3306`；本机开发需开启 **外网地址** 并将本机 IP 加入白名单

## 本地配置

```bash
cp Backend/src/main/resources/application-db.example.yml Backend/src/main/resources/application-local.yml
# 编辑 application-local.yml，填写 DB_USERNAME、DB_PASSWORD
# 本机开发时将 DB_HOST 改为控制台「外网地址」
```

或使用环境变量：

```bash
export DB_HOST=172.27.0.14
export DB_PORT=3306
export DB_NAME=pixel_craft_forge
export DB_USERNAME=root
export DB_PASSWORD=你的密码
```

启动后端后 **Flyway** 会自动执行 `src/main/resources/db/migration/` 建表脚本。

## 可选：本地 Docker MySQL（仅离线调试）

```bash
cd Backend
docker compose --profile local-mysql up -d
```

此时在 `application-local.yml` 中：注释腾讯云配置，取消「本地 Docker MySQL」注释块即可。
