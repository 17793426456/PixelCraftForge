# 本地开发启动（加载 application-local.yml：腾讯云 DB + API Key，已被 .gitignore 忽略）
# 本机连接数据库时请在 application-local.yml 将 DB 地址改为腾讯云「外网地址」
$env:SPRING_PROFILES_ACTIVE = "local"
Set-Location $PSScriptRoot
mvn spring-boot:run
