# 🗄️ Trabajando con la Base de Datos

## ✅ Método Recomendado: DB en Assets (Desarrollo)

### La base de datos está en: `src/assets/databases/hamburger_pos.db`

Este archivo .sqlite está incluido en el proyecto y se copia al dispositivo cuando instalas la app.

### Workflow de Desarrollo:

1. **Abre la base de datos en DB Browser**:
   ```powershell
   .\open-dev-db.ps1
   ```
   O manualmente: `src\assets\databases\hamburger_pos.db`

2. **Modifica lo que necesites**:
   - Agregar/editar productos
   - Crear datos de prueba
   - Modificar el esquema
   - Ejecutar queries SQL

3. **Guarda los cambios** en DB Browser (botón "Write Changes")

4. **Sincroniza con la app**:
   ```powershell
   npm run build
   npx cap sync android
   ```

5. **Reinstala la app**:
   ```powershell
   cd android
   .\gradlew assembleDebug
   adb install -r app\build\outputs\apk\debug\app-debug.apk
   ```

### Ventajas:

✅ **Trabajas con un archivo real .sqlite**
✅ **DB Browser abre el archivo directamente del proyecto**
✅ **Sin necesidad de extraer/importar**
✅ **Control total sobre el esquema**
✅ **Ideal para desarrollo y testing**

---

## 🔄 Alternativa: Ver DB en Tiempo Real (Producción)

### 1. Inicia la sincronización automática

```powershell
.\watch-db.ps1
```

Este script extrae la base de datos cada 5 segundos automáticamente. Déjalo corriendo en una terminal.

### 2. Abre DB Browser for SQLite

1. Descarga e instala: https://sqlitebrowser.org/dl/
2. Abre el archivo: `.\database-dumps\hamburger_posSQLite.db`
3. **Importante**: Mantén DB Browser abierto

### 3. Usa la aplicación normalmente

- Crea órdenes, agrega productos, etc.
- Cada 5 segundos, el archivo se actualiza automáticamente

### 4. Refresca DB Browser para ver cambios

En DB Browser:
- Menú: **File → Refresh** (o presiona F5)
- Verás los cambios que hiciste en la app **casi en tiempo real**

### 💡 Ventajas de este método:

✅ Ver la base de datos actualizada cada 5 segundos
✅ No necesitas extraer manualmente
✅ Puedes ejecutar queries SQL mientras la app corre
✅ Ideal para debugging y desarrollo

---

## 📥 Extraer la Base de Datos (Manual)

```powershell
.\extract-db.ps1
```

Esto extraerá la base de datos del dispositivo/emulador a:
`.\database-dumps\hamburger_posSQLite.db` (540KB aproximadamente)

## 🔍 Ver con DB Browser for SQLite

1. **Instalar DB Browser** (si no lo tienes):
   - Descarga: https://sqlitebrowser.org/dl/
   - Instala en la ubicación predeterminada

2. **Abrir la base de datos**:
   - Si DB Browser está instalado, se abrirá automáticamente
   - O abre manualmente: `.\database-dumps\hamburger_posSQLite.db`

3. **Explorar y modificar**:
   - Ver tablas y datos
   - Ejecutar queries SQL
   - Modificar registros
   - Exportar datos

## 📤 Enviar Base de Datos Modificada (Opcional)

⚠️ **CUIDADO**: Esto sobrescribirá la base de datos en el dispositivo

```powershell
.\push-db.ps1
```

## 📊 Ver Logs en Tiempo Real

```powershell
.\view-logs.ps1
```

Esto mostrará todos los logs de la aplicación, incluyendo:
- 🔍 Queries ejecutados
- 💾 Operaciones de escritura
- ✅ Operaciones exitosas
- ❌ Errores
- 📦 Carga de datos

## 🔄 Workflow Recomendado

### Durante Desarrollo:

1. **Ejecuta la app** en el emulador
2. **Usa la app** normalmente (crear órdenes, productos, etc.)
3. **Extrae la DB** cuando quieras ver los datos:
   ```powershell
   .\extract-db.ps1
   ```
4. **Abre en DB Browser** para explorar
5. **Mira los logs** en tiempo real:
   ```powershell
   .\view-logs.ps1
   ```

### Para Testing con Datos Específicos:

1. **Extrae la DB actual**
2. **Modifica en DB Browser** (agregar productos, órdenes de prueba, etc.)
3. **Guarda los cambios**
4. **Empuja de vuelta** al dispositivo:
   ```powershell
   .\push-db.ps1
   ```

## 📍 Ubicación de la DB en el Dispositivo

```
/data/data/io.ionic.starter/databases/hamburger_posSQLite.db
```

**Nota**: El plugin de SQLite agrega el sufijo "SQLite.db" al nombre de la base de datos.

## 💡 Comandos Útiles

### Ver ubicación de la DB en el dispositivo:
```powershell
adb shell run-as io.ionic.starter ls -la databases/
```

### Limpiar la base de datos (borrar y recrear):
```powershell
adb shell pm clear io.ionic.starter
```

### Ver solo errores SQL:
```powershell
adb logcat | Select-String "❌|ERROR|SQLite"
```

## 🛠️ Página de Debug (Alternativa)

Si prefieres ver los datos directamente en la app, accede a:
- Desde login → "Ver Base de Datos"
- O navega a: `/debug`

---

**Nota**: Los datos de prueba se cargan automáticamente la primera vez que se inicializa la base de datos.
