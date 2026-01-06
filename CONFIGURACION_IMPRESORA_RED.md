# 🖨️ Guía de Configuración - Impresora de Red AON PR-250

## 📋 Requisitos

### Hardware Necesario:
- ✅ Impresora térmica AON PR-250 (con puerto LAN/Ethernet)
- ✅ Cable Ethernet (RJ45)
- ✅ Router WiFi del restaurante
- ✅ Tablets/Celulares Android con la app POS instalada
- ✅ Papel térmico de 58mm o 80mm

### Software:
- ✅ App POS ya instalada y configurada
- ✅ Router con DHCP habilitado (asigna IPs automáticamente)

---

## 🔧 PASO 1: Conexión Física de la Impresora

### 1.1 Instalar el Papel Térmico

```
1. Abrir la tapa de la impresora
2. Colocar el rollo de papel térmico
3. Dejar que salga un poco de papel
4. Cerrar la tapa (debe quedar ajustada)
```

### 1.2 Conectar la Impresora al Router

```
Impresora AON PR-250
    ↓ 
[Puerto LAN] ← Cable Ethernet → [Puerto LAN del Router]
    ↓
Router WiFi
    ↓ (WiFi)
Tablets/Celulares POS
```

**Pasos:**
1. Conecta el cable Ethernet al **puerto LAN de la impresora**
2. Conecta el otro extremo a un **puerto LAN del router**
3. Conecta la **fuente de poder** de la impresora
4. **Enciende la impresora** (botón de encendido)

**LED Indicadores:**
- ✅ **LED verde fijo**: Impresora encendida correctamente
- ✅ **LED naranja parpadeando**: Actividad de red (buena señal)
- ❌ **LED rojo**: Error (revisar conexiones)

---

## 🔍 PASO 2: Encontrar la Dirección IP de la Impresora

### Opción A: Imprimir Página de Configuración (RECOMENDADO)

La AON PR-250 puede imprimir su configuración de red:

```
1. Con la impresora APAGADA
2. Mantén presionado el botón FEED (papel)
3. Mientras lo mantienes, ENCIENDE la impresora
4. Suéltalo cuando empiece a imprimir
5. Se imprimirá una página con la configuración
```

**Busca en la página impresa:**
```
Network Configuration:
-------------------
IP Address: 192.168.1.150  ← ESTA ES TU IP
Subnet Mask: 255.255.255.0
Gateway: 192.168.1.1
Port: 9100                 ← ESTE ES EL PUERTO
```

### Opción B: Revisar en el Router

```
1. Abre un navegador web en tu PC/celular
2. Ingresa la IP del router (usualmente):
   - 192.168.1.1
   - 192.168.0.1
   - 192.168.100.1
3. Inicia sesión (usuario/contraseña del router)
4. Busca sección "Dispositivos Conectados" o "DHCP"
5. Busca un dispositivo llamado:
   - "AON-PR250"
   - "Thermal Printer"
   - O la MAC address de la impresora
6. Anota la dirección IP asignada
```

### Opción C: Usar app Android "Fing"

```
1. Instala "Fing - Network Tools" desde Play Store
2. Abre la app
3. Presiona "Scan"
4. Busca en la lista un dispositivo con:
   - Nombre: "Printer" o "AON"
   - Puerto abierto: 9100
5. Anota la IP
```

**Ejemplo de IP que podrías encontrar:**
- `192.168.1.150`
- `192.168.0.200`
- `10.0.0.50`

---

## 📱 PASO 3: Configurar en la App POS

### 3.1 Abrir Configuración de Impresora

```
1. Abrir app POS
2. Iniciar sesión como ADMINISTRADOR
3. Ir al menú Admin
4. Seleccionar "Configuración de Impresora"
```

### 3.2 Seleccionar Tipo de Conexión

```
En la pantalla de configuración:

1. Verás 3 opciones:
   ┌─────────────────────────────┐
   │ [Simulación] [Bluetooth] [WiFi/Red] │
   └─────────────────────────────┘

2. Selecciona: [WiFi/Red]
```

### 3.3 Ingresar Configuración de Red

```
Se mostrará un formulario:

┌────────────────────────────────────┐
│ Configuración de Red               │
├────────────────────────────────────┤
│                                    │
│ Dirección IP de la Impresora:     │
│ [192.168.1.150____________]       │
│                                    │
│ Puerto (por defecto 9100):         │
│ [9100_____________________]       │
│                                    │
│ [Conectar a Impresora de Red]     │
└────────────────────────────────────┘
```

**Ingresa:**
1. **Dirección IP**: La IP que encontraste en el PASO 2 (ej: `192.168.1.150`)
2. **Puerto**: `9100` (este es el estándar para impresoras térmicas)

### 3.4 Conectar

```
1. Presiona el botón: "Conectar a Impresora de Red"
2. Espera unos segundos
3. Deberías ver un mensaje:
   ✅ "¡Conectado a la impresora de red!"
```

**Estado de conexión:**
```
┌────────────────────────────────────┐
│ Estado de Conexión                 │
├────────────────────────────────────┤
│ ✅ Conectado                       │
│ 192.168.1.150:9100                │
│                         [Desconectar]│
└────────────────────────────────────┘
```

---

## ✅ PASO 4: Probar la Impresión

### 4.1 Imprimir Ticket de Prueba

```
En la misma pantalla de configuración:

1. Baja hasta el final
2. Presiona: "Imprimir Ticket de Prueba"
3. La impresora debería imprimir un ticket de ejemplo
```

**Ticket de prueba esperado:**
```
================================
    PRUEBA DE IMPRESORA
================================

Restaurante: HAMBURGUESAS
Fecha: 28/12/2025 13:45
--------------------------------
Estado: ✓ Conectado
IP: 192.168.1.150
Puerto: 9100
--------------------------------
Si puedes leer esto, la 
impresora está funcionando
correctamente.
================================
```

### 4.2 Probar con una Orden Real

```
1. Sal de la configuración
2. Ve a "Mesas" → Selecciona una mesa
3. Agrega productos:
   - 1x Hamburguesa Clásica
   - 1x Papas Fritas
4. Presiona "Enviar Orden"
5. La impresora debería imprimir automáticamente:
   - Comanda para cocina
```

**Comanda esperada:**
```
================================
     COMANDA COCINA
================================
Mesa: Mesa 1
Mesero: Fernando
Hora: 13:46
--------------------------------
1x Hamburguesa Clásica
   - Sin cebolla
   
1x Papas Fritas
================================
```

---

## 🔥 Flujo Automático de Impresión

Una vez configurada, la impresión es automática:

### 📋 Cuando se envía una orden:

```
Mesero en tablet:
    ↓
1. Toma orden en Mesa 1
2. Agrega productos
3. Presiona "Enviar Orden"
    ↓
App POS:
    ↓
4. Guarda orden en base de datos
5. Detecta que hay impresora conectada
6. Envía comando de impresión
    ↓
Impresora de Red:
    ↓
7. Recibe datos por puerto 9100
8. Imprime comanda para cocina
    ↓
Cocina:
    ↓
9. Recibe ticket impreso
10. Prepara orden
```

### 💰 Cuando se paga una cuenta:

```
Mesero/Cajero en tablet:
    ↓
1. Abre orden de Mesa 1
2. Presiona "Cobrar Cuenta"
3. Ingresa método de pago
4. Confirma pago
    ↓
App POS:
    ↓
5. Marca orden como PAGADA
6. Envía comando de impresión de factura
    ↓
Impresora de Red:
    ↓
7. Imprime FACTURA con:
   - Detalle de productos
   - Precios
   - Subtotal
   - Total
   - Método de pago
```

---

## 🛠️ Solución de Problemas

### ❌ Error: "No se pudo conectar a la impresora de red"

**Causas posibles:**

1. **IP incorrecta**
   ```
   Solución:
   - Verifica la IP nuevamente (PASO 2)
   - Asegúrate de escribirla exactamente
   - Ejemplo: 192.168.1.150 (sin espacios)
   ```

2. **Impresora apagada**
   ```
   Solución:
   - Verifica que la impresora esté encendida
   - LED verde debe estar fijo
   ```

3. **Cable Ethernet desconectado**
   ```
   Solución:
   - Revisa que el cable esté bien conectado
   - En ambos extremos (impresora y router)
   - LED naranja en puerto LAN debe parpadear
   ```

4. **Tablet no en la misma red WiFi**
   ```
   Solución:
   - Asegúrate que la tablet esté conectada
     al MISMO router que la impresora
   - Ambos deben estar en la misma red local
   ```

5. **Puerto incorrecto**
   ```
   Solución:
   - El puerto debe ser: 9100
   - Este es el estándar para impresoras térmicas
   - No uses: 80, 8080, 443, etc.
   ```

### ❌ "Conectado pero no imprime"

**Soluciones:**

1. **Verificar papel**
   ```
   - ¿Hay papel en la impresora?
   - ¿Está bien colocado?
   - Presiona botón FEED para probar
   ```

2. **Imprimir página de prueba desde impresora**
   ```
   - Mantén FEED + POWER para resetear
   - Si no imprime nada, problema de hardware
   ```

3. **Revisar firewall del router**
   ```
   - Algunos routers bloquean puerto 9100
   - Accede al router y desbloquea
   ```

### ❌ "Imprime caracteres extraños o basura"

```
Solución:
- La impresora NO soporta comandos ESC/POS
- O está en modo raw incorrecto
- Contactar soporte de AON para configurar
  modo ESC/POS
```

---

## 📞 Contacto de Soporte

**AON Soporte Técnico:**
- Teléfono: [número de AON]
- Email: soporte@aon.com
- Manual: Revisar manual de la impresora AON PR-250

**Soporte App POS:**
- Fernando Camargo
- Email: [tu email]

---

## 📝 Notas Adicionales

### Ventajas de conexión por Red:

✅ **Múltiples dispositivos**: Varios tablets pueden usar la misma impresora
✅ **Sin cables**: Tablets se mueven libremente
✅ **Alcance amplio**: Funciona en todo el restaurante
✅ **Estable**: No se desconecta como Bluetooth
✅ **Velocidad**: Impresión más rápida

### Consideraciones:

⚠️ **Impresora siempre encendida**: Debe estar ON durante servicio
⚠️ **Router debe estar funcionando**: Si se cae el router, no imprime
⚠️ **IP puede cambiar**: Si reinicia router, puede cambiar IP
   - Solución: Configurar IP estática en router

---

## ✨ Resumen Rápido

```
1. Conectar impresora → Router (cable Ethernet)
2. Encender impresora
3. Encontrar IP (imprimir config o ver router)
4. En app: Admin → Impresora → WiFi/Red
5. Ingresar IP y puerto 9100
6. Conectar
7. Probar impresión
8. ¡Listo! Ahora se imprime automáticamente
```

---

**Documento creado:** 28 de diciembre de 2025
**Versión:** 1.0
**App:** POS Hamburguesas - Gestión de Órdenes
