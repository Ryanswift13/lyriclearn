# LyricLearn 一键启动脚本
Write-Host "启动 LyricLearn..." -ForegroundColor Cyan

# 启动后端（网易云 API）
Write-Host "启动网易云 API 服务 (port 3000)..." -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/k cd /d E:\Project\Learing_English_from_Music\backend && node app.js" -WindowStyle Minimized

Start-Sleep -Seconds 2

# 启动前端
Write-Host "启动前端开发服务器 (port 5173)..." -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/k cd /d E:\Project\Learing_English_from_Music\frontend && node node_modules\.bin\vite.CMD" -WindowStyle Minimized

Start-Sleep -Seconds 3

# 打开浏览器
Write-Host "打开浏览器..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`nLyricLearn 已启动！" -ForegroundColor Green
Write-Host "前端: http://localhost:5173" -ForegroundColor Cyan
Write-Host "后端: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`n按任意键关闭..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
