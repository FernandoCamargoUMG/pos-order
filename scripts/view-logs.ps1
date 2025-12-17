# Script para ver logs en tiempo real de la aplicación
# Uso: .\view-logs.ps1

Write-Host "📊 Iniciando monitoreo de logs..." -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

# Limpiar logs anteriores
adb logcat -c

# Mostrar logs filtrados
adb logcat | Select-String -Pattern "ionic.starter|Database|SQLite|🔍|💾|✅|❌|📦" --Color
