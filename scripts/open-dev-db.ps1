$dbPath = ".\src\assets\databases\hamburger_pos.db"

if (!(Test-Path $dbPath)) {
    Write-Host "No se encontro la base de datos" -ForegroundColor Red
    exit 1
}

Write-Host "Base de datos encontrada" -ForegroundColor Green
Write-Host "Ubicacion: $dbPath" -ForegroundColor Cyan

$dbBrowserPath = "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"

if (Test-Path $dbBrowserPath) {
    Write-Host "Abriendo DB Browser..." -ForegroundColor Green
    $fullPath = Resolve-Path $dbPath
    Start-Process $dbBrowserPath -ArgumentList "`"$fullPath`""
} else {
    Write-Host "DB Browser no instalado" -ForegroundColor Yellow
    Write-Host "Descarga: https://sqlitebrowser.org/dl/" -ForegroundColor Gray
}
