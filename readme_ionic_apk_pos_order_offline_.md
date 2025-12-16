# POS-ORDER – APK Ionic Offline + Impresión Directa

Este documento describe la **aplicación móvil POS-ORDER**, desarrollada como **APK nativa con Ionic**, orientada a la toma de órdenes, gestión de mesas y **emisión de tickets térmicos** en entornos comerciales reales.

La aplicación fue diseñada bajo un enfoque **offline-first**, con soporte **multi-dispositivo (multi-tablet)** y **comunicación directa con impresoras térmicas por red local**, sin dependencia de conexión a internet.

---

## 🎯 Objetivo de la Aplicación

- Operar como **POS principal** del restaurante
- Funcionar **sin conexión a internet**
- Soportar **múltiples tablets trabajando simultáneamente**
- Gestionar mesas, órdenes, cuentas separadas y cocina (KDS)
- Imprimir tickets térmicos de forma **directa y automática**
- Sincronizar datos con backend Node.js cuando exista conectividad

---

## 🧱 Stack Tecnológico

- **Ionic 8**
- **Angular**
- **Capacitor**
- **SQLite (local, offline)**
- **ESC/POS** (impresión térmica)
- **Android SDK**

---

## ⚙️ Requisitos del Entorno de Desarrollo

- Node.js 18+
- npm 9+
- Java JDK 17
- Android Studio
- Android SDK (API 33+)
- Emulador Android o Tablet física

---

## 🚀 Creación e Inicio del Proyecto

```bash
npm install -g @ionic/cli
ionic start pos-order blank --type=angular
cd pos-order

ionic integrations enable capacitor
ionic cap add android
```

---

## ▶️ Ejecución en Desarrollo

Modo navegador (solo UI):
```bash
ionic serve
```

Modo dispositivo / emulador:
```bash
ionic cap run android
```

---

## 🗂️ Estructura del Proyecto

```
pos-order/
 ├── src/
 │   ├── app/
 │   │   ├── core/              # Lógica base
 │   │   │   ├── database/      # SQLite, schema, repositorios
 │   │   │   ├── printer/       # ESC/POS, jobs de impresión
 │   │   │   ├── sync/          # Sincronización multi-tablet
 │   │   │   ├── auth/          # Roles y permisos
 │   │   ├── features/          # Funcionalidades del POS
 │   │   │   ├── tables/        # Mapa de mesas
 │   │   │   ├── orders/        # Toma de órdenes
 │   │   │   ├── checkout/      # Pre-cuenta y split check
 │   │   │   ├── kds/           # Pantalla de cocina
 │   │   │   └── settings/      # Configuración
 │   │   ├── shared/            # Componentes reutilizables
 │   │   └── app.component.ts
 │   ├── assets/
 │   └── theme/
 ├── android/
 └── database/
     └── schema_pos_v1.sql
```

---

## 🧠 Arquitectura Offline-First + Multi-Tablet

Principios clave:

- Cada tablet opera **de forma autónoma**
- SQLite local es la **fuente de verdad primaria**
- El backend actúa como **coordinador y sincronizador**
- No se requieren locks en tiempo real

Flujo general:

```
Mesero → SQLite → Impresora
             ↓
        Cola de Sync
             ↓
       Backend Node.js
```

---

## 📱 Soporte Multi-Dispositivo

- Cada tablet posee un `device_id` único
- Las mesas tienen **ownership lógico**
- El backend valida conflictos cuando hay sincronización
- En ausencia de conexión, la tablet continúa operando

Esto permite trabajo concurrente sin interrumpir la operación.

---

## 🖨️ 6. Integración de Hardware de Impresión

### Configuración de Impresora Térmica

**Modelo soportado:** AON PR-2 50

#### Conexión y Protocolo

- Conexión por **LAN (Ethernet)** dentro de la red local
- La APK se instala directamente en las tablets
- Comunicación **directa tablet → impresora**, sin navegador
- Sin dependencia de internet

La comunicación se realiza mediante:
- Plugin nativo Android integrado con **Capacitor**
- Uso de comandos **ESC/POS nativos** enviados como texto

Beneficios:
- Alta velocidad de impresión (250 mm/s)
- Corte automático de papel
- Apertura de gaveta
- Impresión de QR y códigos de barras

---

### Diseño del Ticket (Voucher)

El formato del ticket replica la factura física actual del restaurante.

**Estructura:**

**Cabecera**
- Logo monocromático
- Nombre del restaurante
- Número de orden
- Fecha y hora
- Nombre del mesero o cliente

**Cuerpo**
- Listado de productos
- Modificadores y observaciones
  - Ejemplo: `1x Hamburguesa – Sin cebolla`
- Precio unitario (cuando aplique)

**Pie**
- Subtotal
- Total (resaltado en tamaño grande y negrita)
- Estado de la orden: Pendiente / Pagado

---

### Disparadores Automáticos de Impresión

**Al enviar orden a cocina**
- Impresión automática de **Comanda de Cocina**
- Incluye productos y modificadores
- No incluye precios

**Al solicitar la cuenta**
- Impresión automática de **Pre-cuenta**
- Incluye precios y total
- Entregada al cliente en mesa

---

## 🔐 Roles y Seguridad

- **ADMINISTRADOR**
  - Acceso total
  - Vista por defecto: KDS

- **MESERO**
  - Acceso restringido
  - Inicio en mapa de mesas
  - Solo órdenes activas e impresión de cuenta

Controlado mediante guards y permisos locales.

---

## 📘 Justificación Técnica

> *La aplicación POS-ORDER fue diseñada como una APK nativa para garantizar impresión directa, operación offline, soporte multi-tablet y continuidad del negocio. El uso de SQLite local y sincronización eventual permite una experiencia estable incluso ante fallos de red o energía.*

---

## 📌 Estado Actual del Proyecto

✔️ Arquitectura definida  
✔️ Offline-first  
✔️ Multi-dispositivo activo  
✔️ Impresión térmica integrada  
✔️ Preparado para sincronización

---

**Este README documenta la aplicación POS-ORDER como núcleo operativo del sistema POS offline híbrido.**

