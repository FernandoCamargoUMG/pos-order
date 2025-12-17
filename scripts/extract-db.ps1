# Script para extraer la base de datos SQLite del dispositivo Android
Write-Host " Buscando dispositivos conectados..." -ForegroundColor Cyan

$devices = adb devices | Select-String "device$"
if ($devices.Count -eq 0) {
    Write-Host " No hay dispositivos conectados" -ForegroundColor Red
    exit 1
}

Write-Host " Dispositivo encontrado" -ForegroundColor Green

$packageName = "io.ionic.starter"
$dbName = "hamburger_posSQLite.db"
$localPath = ".\database-dumps\$dbName"

if (!(Test-Path ".\database-dumps")) {
    New-Item -ItemType Directory -Path ".\database-dumps" | Out-Null
}

Write-Host " Extrayendo base de datos..." -ForegroundColor Yellow

# Método más confiable: usar base64
Write-Host " Codificando a base64..." -ForegroundColor Gray
$base64Output = adb shell "run-as $packageName base64 databases/$dbName" 2>$null

if ($base64Output) {
    Write-Host " Decodificando..." -ForegroundColor Gray
    # Limpiar caracteres de nueva línea y espacios
    $base64Clean = ($base64Output -join "").Replace("`r", "").Replace("`n", "").Replace(" ", "")
    
    try {
        $bytes = [System.Convert]::FromBase64String($base64Clean)
        $fullPath = (Resolve-Path $localPath -ErrorAction SilentlyContinue)
        if (-not $fullPath) {
            $fullPath = Join-Path (Get-Location) $localPath
        }
        [System.IO.File]::WriteAllBytes($fullPath, $bytes)
        Write-Host " Archivo decodificado correctamente" -ForegroundColor Green
    } catch {
        Write-Host " Error al decodificar: $_" -ForegroundColor Red
    }
}

if (Test-Path $localPath) {
    $fileSize = (Get-Item $localPath).Length
    if ($fileSize -gt 0) {
        Write-Host " Base de datos extraída: $fileSize bytes" -ForegroundColor Green
        Write-Host " Ubicación: $localPath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host " Abre este archivo con DB Browser for SQLite" -ForegroundColor Yellow
        Write-Host "   Descarga: https://sqlitebrowser.org/dl/" -ForegroundColor Gray
        Write-Host ""
        
        # Intentar abrir DB Browser si está instalado
        $dbBrowserPath = "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"
        if (Test-Path $dbBrowserPath) {
            Write-Host " Abriendo DB Browser..." -ForegroundColor Green
            Start-Process $dbBrowserPath -ArgumentList "`"$PWD\$localPath`""
        } else {
            Write-Host " Para usar DB Browser, descárgalo e instálalo desde:" -ForegroundColor Yellow
            Write-Host "   https://sqlitebrowser.org/dl/" -ForegroundColor Gray
        }
    } else {
        Write-Host " Archivo creado pero vacío" -ForegroundColor Red
    }
} else {
    Write-Host " Error al extraer" -ForegroundColor Red
}
