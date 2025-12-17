# 🔒 Guía de Compilación para Producción

## ⚠️ IMPORTANTE
La base de datos de producción viene **LIMPIA** con:
- ✅ Solo 1 usuario administrador universal
- ✅ Sin productos
- ✅ Sin mesas
- ✅ Sin usuarios de prueba

**Credenciales iniciales:**
- Usuario: `admin`
- PIN: `2024`

**🔐 CAMBIAR EL PIN inmediatamente después de la primera instalación**

---

## 📦 Pasos para Compilar APK de Producción

### 1. Generar Base de Datos Limpia
```bash
npm run create-db:prod
```

Esto crea la BD en `src/assets/databases/hamburger_pos.db` con:
- Esquema completo (13 tablas)
- Roles y niveles
- **Solo 1 admin universal**

### 2. Compilar App en Modo Producción
```bash
npm run build:prod
ionic cap sync android
```

### 3. Compilar APK de Producción
```bash
cd android
.\gradlew assembleRelease
```

El APK estará en:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 4. Firmar APK (Obligatorio para Play Store)

#### Crear Keystore (solo primera vez)
```bash
keytool -genkey -v -keystore pos-order-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pos-order
```

Guarda el keystore en un lugar seguro y **NO LO COMPARTAS**.

#### Firmar APK
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore pos-order-release.jks app-release-unsigned.apk pos-order
```

#### Optimizar APK
```bash
zipalign -v 4 app-release-unsigned.apk pos-order-v1.0.0.apk
```

---

## 🎯 Checklist Pre-Producción

- [ ] BD generada con `npm run create-db:prod`
- [ ] Compilado con `npm run build:prod`
- [ ] APK firmado
- [ ] Probado en dispositivo real
- [ ] **PIN cambiado** después de primera instalación
- [ ] Usuarios, productos y mesas configurados por el administrador

---

## 📱 Primera Instalación en Dispositivos

### Tablet 1 (Principal)
1. Instalar APK: `adb install -r pos-order-v1.0.0.apk`
2. Abrir app
3. Login con `admin` / `2024`
4. **Cambiar PIN inmediatamente**
5. Configurar productos, mesas, usuarios desde la app

### Tablets Adicionales
1. Instalar mismo APK
2. La BD se sincronizará automáticamente cuando haya conectividad
3. Cada tablet tendrá su propio `device_id`

---

## 🔄 Actualizar Base de Datos en Producción

Si necesitas actualizar la BD ya instalada:

```bash
# 1. Extraer BD actual
npm run sync-db

# 2. Modificar en DB Browser
# (agregar productos, mesas, usuarios, etc.)

# 3. Enviar a dispositivo
npm run push-db

# 4. Reiniciar app
adb shell am force-stop io.ionic.starter
adb shell am start -n io.ionic.starter/.MainActivity
```

---

## 🛠️ Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run create-db:prod` | BD limpia (solo admin) |
| `npm run create-db` | BD con datos demo |
| `npm run build:prod` | Compilar para producción |
| `npm run build` | Compilar para desarrollo |

---

## ⚡ Diferencias Desarrollo vs Producción

### Desarrollo (`npm run create-db`)
```
✅ Admin universal (admin/2024)
✅ Usuarios demo (admin/1234, mesero/1111, cocina/2222)
✅ 23 productos demo
✅ 15 mesas demo
✅ 14 modificadores demo
```

### Producción (`npm run create-db:prod`)
```
✅ Admin universal (admin/2024)
❌ Sin usuarios adicionales
❌ Sin productos
❌ Sin mesas
❌ Sin modificadores
```

**El jefe del negocio configura todo desde la app después de instalar.**

---

## 📝 Notas de Seguridad

1. **Keystore:** Guardar en lugar seguro, hacer backup
2. **PIN Admin:** Cambiar inmediatamente después de instalar
3. **device_id:** Cada tablet genera uno único
4. **Sincronización:** Solo cuando hay conexión al backend

---

## 🔍 Verificar BD Antes de Compilar

```bash
# Ver contenido de la BD de assets
npm run sync-db
# Abrir: database-dumps/hamburger_pos.db en DB Browser

# Verificar que solo tenga:
# - 1 usuario (admin)
# - 0 productos
# - 0 mesas
# - 0 modificadores
```
