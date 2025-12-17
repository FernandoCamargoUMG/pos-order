# Ver logs del emulador Android
adb logcat -c
Write-Host "=== LOGS DE LA APP ===" -ForegroundColor Green
Write-Host "Mostrando logs... (Ctrl+C para detener)" -ForegroundColor Yellow
adb logcat | Select-String -Pattern "Chromium|Console|Mesa|Table|Query|ERROR"
