# 🚀 Referencia Rápida - POS Order

## Comandos Esenciales

### 🔨 Desarrollo Diario
```bash
# Compilar y ejecutar en dispositivo
ionic cap run android

# Ver BD en tiempo real (RECOMENDADO)
npm run sync-db

# Ver logs de la app
npm run logs
```

### 🗄️ Base de Datos

#### Ver cambios de la app en DB Browser
```bash
npm run sync-db
# Presiona F5 en DB Browser para refrescar
```

#### Modificar desde DB Browser
```bash
# 1. Edita en DB Browser y guarda (Ctrl+S)
npm run push-db
# 2. Reinicia la app o navega entre pantallas
```

#### Regenerar BD inicial
```bash
# Desarrollo (con datos demo)
npm run create-db

# Producción (solo admin universal)
npm run create-db:prod
```

Luego sincronizar:
```bash
ionic cap sync android
```

### 📱 App Management
```bash
# Limpiar datos de la app
adb shell pm clear io.ionic.starter

# Reiniciar app
adb shell am force-stop io.ionic.starter
adb shell am start -n io.ionic.starter/.MainActivity

# Reinstalar APK
cd android
.\gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 🔍 Debugging
```bash
# Logs completos
adb logcat

# Logs filtrados (SQL, errores, console.log)
npm run logs

# Limpiar logs
adb logcat -c
```

## 📂 Ubicaciones Importantes

| Qué | Dónde |
|-----|-------|
| Schemas TypeScript | `src/app/core/database/schema.ts` |
| Demo data | `src/app/core/database/demo-data.ts` |
| Database service | `src/app/core/database/database.service.ts` |
| BD template | `src/assets/databases/hamburger_pos.db` |
| BD extraída | `database-dumps/hamburger_posSQLite.db` |
| Scripts | `scripts/` |
| Docs | `docs/` |

## 👤 Usuarios Demo

### Modo Desarrollo
| Usuario | PIN | Rol | Pantalla inicial |
|---------|-----|-----|------------------|
| admin | 2024 | Admin | Usuario universal (producción) |
| admin | 1234 | Admin | Usuario demo |
| mesero | 1111 | Mesero | Mesas |
| cocina | 2222 | Cocina | KDS |

### Modo Producción
| Usuario | PIN | Rol |
|---------|-----|-----|
| admin | 2024 | Admin |

**⚠️ IMPORTANTE:** En producción, cambiar el PIN después de la primera instalación.

BD de producción viene **LIMPIA** (sin productos, sin mesas, sin usuarios adicionales).

## 🛠️ Scripts Personalizados

| Script | Uso | Descripción |
|--------|-----|-------------|
| `sync-db.ps1` | `npm run sync-db` | Sincronización automática BD |
| `push-db.ps1` | `npm run push-db` | Push BD al dispositivo |
| `view-logs.ps1` | `npm run logs` | Monitor de logs |
| `create-db.js` | `npm run create-db` | Genera BD desde TS |

## 🔥 Workflow Típico

```bash
# 1. Modificar schema o demo data
# Edita: src/app/core/database/schema.ts o demo-data.ts

# 2. Regenerar BD
npm run create-db

# 3. Sincronizar con Android
ionic cap sync android

# 4. Reinstalar app (limpia datos viejos)
adb shell pm clear io.ionic.starter
ionic cap run android

# 5. Monitorear BD en tiempo real
npm run sync-db
# F5 en DB Browser para ver cambios
```

## 📊 Tablas de la BD

### Core
- `settings` - Configuración global
- `devices` - Tablets registradas
- `roles` - Roles de usuario
- `users` - Usuarios del sistema

### Negocio
- `levels` - Niveles del restaurante
- `tables` - Mesas físicas
- `products` - Catálogo de productos
- `modifiers` - Modificadores (extras, quitar ingredientes)

### Operaciones
- `orders` - Órdenes principales
- `order_items` - Items de cada orden
- `order_item_modifiers` - Modificadores aplicados
- `checks` - Cuentas separadas
- `check_items` - Items en cada cuenta

### Sistema
- `print_jobs` - Cola de impresión
- `kds_tickets` - Tickets de cocina
- `sync_queue` - Cola de sincronización

## ⚡ Tips

- **Siempre** usa `npm run sync-db` para ver BD en tiempo real
- **No olvides** hacer `F5` en DB Browser después de cambios en la app
- **Limpia datos** con `adb shell pm clear io.ionic.starter` si algo falla
- **Revisa logs** con `npm run logs` si hay errores
