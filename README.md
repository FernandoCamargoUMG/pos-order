# POS Order - Aplicación de Punto de Venta

Sistema POS offline-first para restaurantes con soporte multi-tablet e impresión térmica.

## 📋 Estructura del Proyecto

```
pos-order/
├── src/                      # Código fuente de la app
│   ├── app/
│   │   ├── core/            # Servicios base (database, auth, sync)
│   │   ├── features/        # Módulos funcionales (debug, login, etc)
│   │   └── shared/          # Componentes compartidos
│   └── assets/
│       └── databases/       # Template de BD inicial
├── android/                 # Proyecto Android nativo
├── scripts/                 # Scripts de desarrollo (ver scripts/README.md)
├── docs/                    # Documentación técnica
└── database-dumps/          # BD extraídas del dispositivo (gitignore)
```

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
npm run create-db        # Genera BD inicial
ionic cap sync android
```

### Desarrollo
```bash
# Ejecutar en dispositivo/emulador
ionic cap run android

# Ver base de datos en tiempo real
npm run sync-db

# Ver logs filtrados
npm run logs
```

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run create-db` | Genera BD de desarrollo (con datos demo) |
| `npm run create-db:prod` | **Genera BD de producción (solo admin)** |
| `npm run sync-db` | Sincroniza BD del dispositivo con DB Browser |
| `npm run push-db` | Envía BD modificada al dispositivo |
| `npm run logs` | Monitor de logs de la app |
| `npm run build:prod` | Compila app para producción |

Ver [scripts/README.md](scripts/README.md) para más detalles.

## 📱 Tecnologías

- **Ionic 8** + **Angular 20**
- **Capacitor 8**
- **SQLite** (local, offline)
- **@capacitor-community/sqlite** v7.0.2

## 📚 Documentación

- [DATABASE.md](docs/DATABASE.md) - Guía completa de base de datos
- [DEV-WORKFLOW.md](docs/DEV-WORKFLOW.md) - Flujos de trabajo
- [readme_ionic_apk_pos_order_offline_.md](docs/readme_ionic_apk_pos_order_offline_.md) - Documentación técnica completa

## 🗄️ Base de Datos

13 tablas principales:
- `users`, `roles`, `devices` - Autenticación y dispositivos
- `products`, `modifiers` - Catálogo
- `tables`, `levels` - Gestión de mesas
- `orders`, `order_items` - Órdenes
- `checks`, `check_items` - Cuentas separadas
- `print_jobs`, `kds_tickets` - Impresión y cocina
- `sync_queue` - Sincronización

## 👥 Usuarios Demo

### Desarrollo
| Usuario | PIN | Rol | Descripción |
|---------|-----|-----|-------------|
| admin | 2024 | Admin | Usuario universal (producción) |
| admin | 1234 | Admin | Usuario demo |
| mesero | 1111 | Mesero | Usuario demo |
| cocina | 2222 | Cocina | Usuario demo |

### Producción
| Usuario | PIN | Rol | Descripción |
|---------|-----|-----|-------------|
| admin | 2024 | Admin | **ÚNICO usuario** - Cambiar PIN después de instalar |

**⚠️ En producción, la BD viene limpia:**
- Sin productos
- Sin mesas  
- Sin usuarios adicionales
- El administrador configura todo desde la app

Ver [PRODUCTION-BUILD.md](docs/PRODUCTION-BUILD.md) para más detalles.

## 🔄 Workflow de Desarrollo con BD

1. **Ver cambios en tiempo real:**
   ```bash
   npm run sync-db
   ```
   Presiona F5 en DB Browser cuando la app haga cambios.

2. **Modificar datos desde DB Browser:**
   - Edita en DB Browser y guarda (Ctrl+S)
   - Ejecuta `npm run push-db`
   - Reinicia la app

## 📝 Licencia

Proyecto privado de desarrollo.
