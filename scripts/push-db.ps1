# Script para empujar una base de datos modificada de vuelta al dispositivo
# ⚠️ CUIDADO: Esto sobrescribirá la base de datos en el dispositivo
# Uso: .\push-db.ps1

param(
    [string]$dbFile = ".\database-dumps\hamburger_pos.db"
)

if (!(Test-Path $dbFile)) {
    Write-Host "❌ Archivo no encontrado: $dbFile" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos en el dispositivo" -ForegroundColor Yellow
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

$packageName = "io.ionic.starter"
$remotePath = "/data/data/$packageName/databases/hamburger_pos.db"

Write-Host "📤 Enviando base de datos al dispositivo..." -ForegroundColor Cyan

# Detener la aplicación
adb shell am force-stop $packageName

# Empujar el archivo
adb push $dbFile $remotePath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos actualizada!" -ForegroundColor Green
    Write-Host "🔄 Reiniciando aplicación..." -ForegroundColor Yellow
    
    # Reiniciar la aplicación
    adb shell am start -n "$packageName/io.ionic.starter.MainActivity"
    
    Write-Host "✅ Listo!" -ForegroundColor Green
} else {
    Write-Host "❌ Error al enviar la base de datos" -ForegroundColor Red
}
