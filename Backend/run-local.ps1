# 本地开发启动（加载 application-local.yml，其中含 API Key，已被 .gitignore 忽略）
$env:SPRING_PROFILES_ACTIVE = "local"
Set-Location $PSScriptRoot
mvn spring-boot:run
