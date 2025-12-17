# 🚀 Workflow de Desarrollo - Base de Datos

## Ubicación de la DB de Desarrollo
```
src/assets/databases/hamburger_pos.db
```

## 📝 Pasos para Modificar la Base de Datos

### 1. Abre DB Browser
```powershell
.\open-dev-db.ps1
```

### 2. Modifica la base de datos
- Agrega productos
- Crea datos de prueba
- Modifica tablas

### 3. Guarda cambios
Botón "Write Changes" en DB Browser

### 4. Sincroniza y reinstala
```powershell
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
cd ..
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

## 💡 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `.\open-dev-db.ps1` | Abre la DB de desarrollo en DB Browser |
| `.\extract-db.ps1` | Extrae la DB del dispositivo |
| `.\watch-db.ps1` | Sincronización automática cada 5 segundos |
| `.\view-logs.ps1` | Ver logs en tiempo real |

## 📊 Estructura Actual

- **23 productos** (hamburguesas, bebidas, papas, pollo)
- **14 modificadores** (sin cebolla, extra queso, etc.)
- **15 mesas** en 3 niveles
- **3 usuarios demo**: admin/1234, mesero/1111, cocina/2222
