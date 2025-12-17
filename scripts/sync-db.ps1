# Script para sincronizar BD y ver en DB Browser automáticamente
Write-Host " Sincronización en tiempo real" -ForegroundColor Cyan
Write-Host "   Extrayendo cada 5 segundos..." -ForegroundColor Gray
Write-Host "   DB Browser se recargará automáticamente" -ForegroundColor Gray
Write-Host ""

$packageName = "io.ionic.starter"
$dbName = "hamburger_posSQLite.db"
$localPath = ".\database-dumps\$dbName"
$tempPath = ".\database-dumps\temp_$dbName"
$dbBrowserPath = "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"

if (!(Test-Path ".\database-dumps")) {
    New-Item -ItemType Directory -Path ".\database-dumps" | Out-Null
}

# Abrir DB Browser una vez al inicio si está instalado
if (Test-Path $dbBrowserPath) {
    if (!(Test-Path $localPath)) {
        # Primera extracción
        Write-Host " Extrayendo base de datos inicial..." -ForegroundColor Yellow
        $base64Output = adb shell "run-as $packageName base64 databases/$dbName" 2>$null
        if ($base64Output) {
            $base64Clean = ($base64Output -join "").Replace("`r", "").Replace("`n", "").Replace(" ", "")
            $bytes = [System.Convert]::FromBase64String($base64Clean)
            $fullPath = Join-Path (Get-Location) $localPath
            [System.IO.File]::WriteAllBytes($fullPath, $bytes)
        }
    }
    
    Write-Host " Abriendo DB Browser..." -ForegroundColor Green
    Start-Process $dbBrowserPath -ArgumentList "`"$PWD\$localPath`""
    Start-Sleep -Seconds 2
}

$lastSize = 0
$counter = 0

while ($true) {
    # Extraer a archivo temporal
    $base64Output = adb shell "run-as $packageName base64 databases/$dbName" 2>$null
    
    if ($base64Output) {
        try {
            $base64Clean = ($base64Output -join "").Replace("`r", "").Replace("`n", "").Replace(" ", "")
            $bytes = [System.Convert]::FromBase64String($base64Clean)
            $fullTempPath = Join-Path (Get-Location) $tempPath
            [System.IO.File]::WriteAllBytes($fullTempPath, $bytes)
            
            # Reemplazar archivo principal
            $currentSize = $bytes.Length
            
            if ($currentSize -ne $lastSize) {
                # Reemplazar archivo
                if (Test-Path $localPath) {
                    Remove-Item $localPath -Force -ErrorAction SilentlyContinue
                    Start-Sleep -Milliseconds 100
                }
                Copy-Item $tempPath $localPath -Force
                Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
                
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp]  DB actualizada: $currentSize bytes - Presiona F5 en DB Browser" -ForegroundColor Green
                $lastSize = $currentSize
            } else {
                Write-Host "." -NoNewline -ForegroundColor DarkGray
                $counter++
                if ($counter % 60 -eq 0) {
                    Write-Host ""
                }
            }
        } catch {
            Write-Host "!" -NoNewline -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 5
}
