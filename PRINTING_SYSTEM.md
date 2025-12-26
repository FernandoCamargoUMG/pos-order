# 🖨️ Sistema de Impresión Térmica

## Descripción General

Sistema completo de impresión térmica para tickets de cocina y pre-cuentas usando impresoras Bluetooth con protocolo ESC/POS. Compatible con impresoras térmicas AON PR-2 50 y otros modelos que soporten ESC/POS.

## 🎯 Características Implementadas

### 1. **Servicio de Impresión** (`printer.service.ts`)
- ✅ Comandos ESC/POS para impresión rápida (250mm/s)
- ✅ Conexión Bluetooth Low Energy
- ✅ Escaneo y conexión automática de impresoras
- ✅ Modo simulación para desarrollo sin impresora física
- ✅ Persistencia de configuración con Capacitor Preferences
- ✅ Formato de tickets optimizado para papel de 58mm y 80mm

### 2. **Tipos de Tickets**

#### 📋 **Comanda de Cocina**
**Trigger:** Automático al enviar orden
**Contenido:**
- Número de orden
- Mesa y mesero
- Fecha y hora
- **Items SIN PRECIOS** (solo para cocina)
- Modificadores y notas especiales
- Se imprime según el número de copias configurado

**Ejemplo:**
```
     COMANDA COCINA     
========================
ORDEN: ORD-20231226-001
Mesa: Mesa 5
Mesero: Juan Pérez
Fecha: 26/12/2023 14:30
------------------------
ITEMS:
1x Hamburguesa Clásica
   * Sin Cebolla
   * Extra Queso
   Nota: Bien cocida

2x Papas Fritas
   * Sin Sal
------------------------
Gracias por su preferencia
```

#### 💰 **Pre-Cuenta (Ticket Cliente)**
**Trigger:** Manual con botón "Solicitar Cuenta"
**Contenido:**
- Número de orden
- Mesa y mesero
- Fecha y hora
- **Items CON PRECIOS**
- Modificadores y notas
- Subtotal y total
- Estado (PENDIENTE/PAGADO)

**Ejemplo:**
```
  RESTAURANTE HAMBURGUESAS  
============================
Orden: ORD-20231226-001
Mesa: Mesa 5
Mesero: Juan Pérez
Fecha: 26/12/2023 14:45
----------------------------
ITEMS:
1x Hamburguesa Clásica  Q35.00
   * Sin Cebolla
   * Extra Queso
   
2x Papas Fritas         Q20.00
----------------------------
Subtotal:              Q55.00

TOTAL:                 Q55.00
----------------------------
Estado: PENDIENTE

Gracias por su preferencia
```

### 3. **Página de Configuración** (`printer-config.page`)

Ubicación: **Menú Admin → Impresora**

#### Funcionalidades:
- 🔍 **Escaneo Bluetooth**: Busca impresoras disponibles
- 🔌 **Conexión**: Conecta y guarda impresora preferida
- ⚙️ **Parámetros**:
  - Tamaño de papel (58mm / 80mm)
  - Número de copias para comanda (1-3)
  - Encabezado personalizado
  - Pie de página personalizado
- 🧪 **Modo Simulación**: Imprime en consola para testing
- 🧾 **Prueba de Impresión**: Ticket de prueba

### 4. **Integración Automática**

#### En `order.page.ts`:
```typescript
// TRIGGER 1: Al enviar orden → Imprime comanda cocina
async sendOrder() {
  // ... crear orden ...
  await this.orderService.updateOrderStatus(orderId, 'SENT');
  
  // ✨ IMPRESIÓN AUTOMÁTICA
  await this.printKitchenOrder(orderId, orderItemsData);
}

// TRIGGER 2: Botón "Solicitar Cuenta" → Imprime pre-cuenta
async printBill() {
  await this.printerService.printBill(orderPrint);
}
```

## 📱 Modo Desarrollo (Simulación)

### ¿Por qué existe?
Permite desarrollar y probar sin impresora física. Los tickets se muestran en la **consola del desarrollador**.

### Cómo activarlo:
1. Ir a **Menú Admin → Impresora**
2. Activar toggle **"Modo Simulación"**
3. Los tickets aparecerán en consola al:
   - Enviar orden a cocina
   - Solicitar cuenta
   - Hacer prueba de impresión

### Cómo probar en consola:
```bash
# En Chrome DevTools (inspeccionar app)
# Al enviar orden, verás:
=== SIMULACIÓN DE IMPRESIÓN ===
[ESC]@[ESC]a[01][GS]![11]COMANDA COCINA
[ESC]![00]

ORDEN: ORD-20231226-001
Mesa: Mesa 5
...
=== FIN DE SIMULACIÓN ===
```

## 🔧 Configuración por Dispositivo

Cada tablet/celular puede configurar su propia impresora:

1. **Tablet Mesero A**: Conecta a impresora cercana a su área
2. **Tablet Mesero B**: Conecta a otra impresora
3. **Tablet Cocina**: Puede usar la misma impresora o diferente

La configuración se guarda localmente usando Capacitor Preferences.

## 📦 Dependencias Instaladas

```json
{
  "@capacitor-community/bluetooth-le": "^7.3.0",
  "@capacitor/preferences": "^8.0.0"
}
```

### Permisos Android Necesarios:
- `BLUETOOTH` - Para conectar con impresora
- `BLUETOOTH_ADMIN` - Para escanear dispositivos
- `BLUETOOTH_CONNECT` - Android 12+
- `BLUETOOTH_SCAN` - Android 12+
- `ACCESS_FINE_LOCATION` - Requerido para escaneo BLE

## 🚀 Testing sin Impresora Física

### Opción 1: Modo Simulación (Recomendado para desarrollo)
```typescript
// En printer.service.ts
config.simulationMode = true; // ← Los tickets se muestran en consola
```

### Opción 2: Emulador de Impresora (Avanzado)
Usar una app emuladora de impresora térmica en otro dispositivo Android:
- **Bluetooth Printer Simulator** (Play Store)
- Conectar tu celular de desarrollo al emulador

### Opción 3: Probar con Impresora Real
1. Comprar impresora térmica Bluetooth (ej: AON PR-2 50)
2. Desactivar modo simulación
3. Escanear y conectar desde la app

## 🔍 Cómo Probar en tu Celular

### Paso 1: Activar Modo Simulación
```
1. Abrir app → Login → Admin
2. Ir a "Impresora"
3. Activar "Modo Simulación"
```

### Paso 2: Crear Orden de Prueba
```
1. Volver a Mesas
2. Seleccionar mesa
3. Agregar productos
4. Presionar "Enviar Orden"
```

### Paso 3: Ver Resultado
```
- Si está en modo simulación:
  * Abrir Chrome (en PC)
  * chrome://inspect
  * Inspeccionar tu dispositivo
  * Ver consola → verás el ticket formateado

- Si está conectado a impresora:
  * Se imprimirá automáticamente
```

### Paso 4: Solicitar Cuenta
```
1. En la misma orden, presionar "Solicitar Cuenta"
2. Se imprime ticket con precios
```

## 📋 Protocolo ESC/POS Usado

```typescript
const ESC_POS = {
  INIT: '\x1B@',           // Inicializar impresora
  ALIGN_CENTER: '\x1Ba\x01', // Centrar texto
  ALIGN_LEFT: '\x1Ba\x00',   // Alinear izquierda
  DOUBLE_SIZE: '\x1D!\x11',  // Texto doble
  NORMAL: '\x1D!\x00',       // Texto normal
  BOLD_ON: '\x1BE\x01',      // Negrita
  BOLD_OFF: '\x1BE\x00',     // Quitar negrita
  PAPER_CUT: '\x1DV\x00'     // Cortar papel
};
```

### Ventajas ESC/POS:
✅ Impresión ultra rápida (250mm/s)
✅ No requiere procesamiento de imagen
✅ Menos consumo de batería
✅ Compatible con mayoría de impresoras térmicas

## 🎨 Personalización

### Modificar Encabezado/Pie:
```
Admin → Impresora → Parámetros de Impresión
- Encabezado: "RESTAURANTE HAMBURGUESAS"
- Pie de Página: "Gracias por su preferencia"
```

### Cambiar Número de Copias:
```
Admin → Impresora → Copias por Ticket
- 1 copia: Solo cocina
- 2 copias: Cocina + barra
- 3 copias: Cocina + barra + archivo
```

### Ajustar Tamaño de Papel:
```
Admin → Impresora → Tamaño de Papel
- 58mm: Impresoras pequeñas
- 80mm: Impresoras estándar
```

## 🔐 Seguridad

- La configuración se guarda **localmente** en cada dispositivo
- No se comparte información entre dispositivos
- Cada usuario puede tener su impresora configurada
- Modo simulación previene impresiones accidentales en desarrollo

## 🐛 Troubleshooting

### Problema: No encuentra impresoras
**Solución:**
1. Verificar que Bluetooth esté activado
2. Asegurar que impresora esté en modo emparejamiento
3. Verificar permisos de Bluetooth en Android
4. Reiniciar impresora y volver a escanear

### Problema: Se conecta pero no imprime
**Solución:**
1. Verificar que papel esté correctamente cargado
2. Activar modo simulación para ver si el formato es correcto
3. Revisar que impresora sea compatible con ESC/POS
4. Probar ticket de prueba

### Problema: Texto cortado o mal formateado
**Solución:**
1. Ajustar tamaño de papel en configuración
2. Si es 58mm, los textos largos se ajustan automáticamente
3. Modificar formato en `printer.service.ts` si necesario

## 📝 Próximos Pasos (Futuras Mejoras)

### Fase Backend:
- [ ] Sincronización de configuración en la nube
- [ ] Servidor de impresión centralizado (LAN/Ethernet)
- [ ] Historial de impresiones
- [ ] Re-imprimir tickets anteriores

### Funcionalidades Adicionales:
- [ ] Impresión de reportes diarios
- [ ] QR code en tickets
- [ ] Logo personalizado (monocromático)
- [ ] Soporte para impresoras USB
- [ ] Impresión de facturas (DTE Guatemala)

## 📞 Soporte

Para problemas o consultas sobre el sistema de impresión:
1. Revisar consola de desarrollo (modo simulación)
2. Verificar logs en `printer.service.ts`
3. Probar con ticket de prueba primero
4. Validar compatibilidad de impresora con ESC/POS

---

**Desarrollado por:** Fernando Camargo  
**Fecha:** 26 de Diciembre de 2023  
**Versión:** 1.0.0
