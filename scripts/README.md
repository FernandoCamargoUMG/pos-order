# Scripts de Desarrollo

Scripts para desarrollo y debugging de la aplicación POS.

## 📁 Estructura

```
scripts/
├── create-db.js          # Genera la BD SQLite desde schema.ts
├── sync-db.ps1          # Sincronización automática App ↔ DB Browser
├── extract-db.ps1       # Extracción manual de BD del dispositivo
├── push-db.ps1          # Push de BD modificada al dispositivo
├── view-logs.ps1        # Monitor de logs filtrados
└── open-dev-db.ps1      # Abre DB de assets en DB Browser
```

## 🔧 Uso Principal

### Ver base de datos en tiempo real
```powershell
.\sync-db.ps1
```
- Abre DB Browser automáticamente
- Extrae BD cada 5 segundos
- Solo presiona F5 en DB Browser para ver cambios

### Generar base de datos inicial
```powershell
npm run create-db
```
Crea `src/assets/databases/hamburger_pos.db` desde los schemas TypeScript.

### Ver logs de la app
```powershell
.\view-logs.ps1
```
Muestra logs filtrados de SQLite y errores.

## 📝 Flujos de Trabajo

### App → DB Browser (Ver cambios)
1. Ejecuta `sync-db.ps1`
2. Haz cambios en la app
3. Presiona F5 en DB Browser

### DB Browser → App (Modificar datos)
1. Modifica en DB Browser y guarda (Ctrl+S)
2. Ejecuta `push-db.ps1`
3. Reinicia la app

## ⚠️ Notas
- `sync-db.ps1` reemplaza a `watch-db.ps1` (más robusto)
- La BD de producción está en el dispositivo
- La BD de assets es solo plantilla inicial
