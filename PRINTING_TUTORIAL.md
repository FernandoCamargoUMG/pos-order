# 🎬 Tutorial: Cómo Probar el Sistema de Impresión

## 🚀 Inicio Rápido (3 minutos)

### Paso 1: Activar Modo Simulación (30 segundos)

```
📱 Abrir App
  ↓
🔑 Login como Admin
  ↓
📋 Menú Admin
  ↓
🖨️ Clic en "Impresora"
  ↓
⚙️ Activar Toggle "Modo Simulación"
  ↓
✅ Ver mensaje: "Modo simulación activado"
```

**¿Por qué?** Te permite probar sin impresora física. Los tickets aparecen en consola.

---

### Paso 2: Probar Impresión de Comanda (1 minuto)

```
📱 Volver a Mesas
  ↓
🪑 Seleccionar Mesa (ej: Mesa 1)
  ↓
🍔 Agregar Productos:
   - 1x Hamburguesa Clásica
   - 2x Papas Fritas
   - 1x Bebida
  ↓
📝 (Opcional) Agregar Modificadores:
   - Clic en producto → "Sin Cebolla"
  ↓
✅ Presionar "Enviar Orden"
  ↓
🖨️ Ver alerta: "Orden enviada a cocina"
```

**¿Qué sucede?**
- Se crea la orden en BD
- Se marca como SENT para KDS
- **SE IMPRIME COMANDA AUTOMÁTICAMENTE** (en consola si modo simulación)

---

### Paso 3: Ver Ticket en Consola (1 minuto)

```
💻 En tu PC:
  ↓
🌐 Abrir Chrome
  ↓
🔍 Ir a: chrome://inspect
  ↓
📱 Buscar tu dispositivo conectado
  ↓
🔎 Clic en "inspect" bajo tu app
  ↓
📊 Abrir pestaña "Console"
  ↓
👀 Buscar: "=== SIMULACIÓN DE IMPRESIÓN ==="
```

**Verás algo como:**
```
=== SIMULACIÓN DE IMPRESIÓN ===
     COMANDA COCINA     
========================
ORDEN: ORD-001
Mesa: Mesa 1
Mesero: Admin
Fecha: 26/12/2023 14:30
------------------------
ITEMS:
1x Hamburguesa Clásica
   * Sin Cebolla

2x Papas Fritas

1x Bebida
------------------------
Gracias por su preferencia
=== FIN DE SIMULACIÓN ===
```

---

### Paso 4: Probar Pre-Cuenta (30 segundos)

```
📱 En la misma pantalla de orden
  ↓
💰 Presionar botón "Solicitar Cuenta"
  ↓
🖨️ Ver toast: "Pre-cuenta impresa exitosamente"
  ↓
💻 Ir a consola de Chrome
  ↓
👀 Ver nuevo ticket CON PRECIOS
```

**Verás:**
```
=== SIMULACIÓN DE IMPRESIÓN ===
  RESTAURANTE HAMBURGUESAS  
============================
Orden: ORD-001
Mesa: Mesa 1
Mesero: Admin
Fecha: 26/12/2023 14:45
----------------------------
ITEMS:
1x Hamburguesa Clásica  Q35.00
   * Sin Cebolla
   
2x Papas Fritas         Q20.00

1x Bebida               Q10.00
----------------------------
Subtotal:              Q65.00

TOTAL:                 Q65.00
----------------------------
Estado: PENDIENTE
=== FIN DE SIMULACIÓN ===
```

---

## 🖨️ Conectar Impresora Real (5 minutos)

### Requisitos Previos:
✅ Impresora térmica Bluetooth (ej: AON PR-2 50)
✅ Impresora encendida y en modo emparejamiento
✅ Bluetooth activado en celular

### Paso 1: Desactivar Modo Simulación
```
📱 Menú Admin → Impresora
  ↓
⚙️ Desactivar "Modo Simulación"
  ↓
⚠️ Ver mensaje: "Modo simulación desactivado..."
```

### Paso 2: Buscar Impresora
```
🔍 Presionar "Buscar Impresoras Bluetooth"
  ↓
⏳ Esperar 10 segundos (escaneo activo)
  ↓
📋 Ver lista de impresoras encontradas
```

### Paso 3: Conectar
```
🖨️ Seleccionar tu impresora de la lista
   (ej: "PR-2-50" o "AON-PRINTER")
  ↓
⏳ Esperar conexión...
  ↓
✅ Ver "Conectado a [nombre impresora]"
  ↓
💾 Configuración guardada automáticamente
```

### Paso 4: Prueba de Impresión
```
🧪 Presionar "Imprimir Ticket de Prueba"
  ↓
⏳ Esperar 2-3 segundos
  ↓
🖨️ IMPRESORA FÍSICA IMPRIME:
```

```
     PRUEBA DE IMPRESORA     
============================
Impresora configurada correctamente
Fecha: 26/12/2023 15:00
------------------------
Si puede leer esto,
la impresora funciona!
```

### Paso 5: Probar Orden Real
```
📱 Crear orden como en Paso 2
  ↓
✅ Presionar "Enviar Orden"
  ↓
🖨️ IMPRESORA IMPRIME COMANDA AUTOMÁTICAMENTE
  ↓
💰 Presionar "Solicitar Cuenta"
  ↓
🖨️ IMPRESORA IMPRIME PRE-CUENTA
```

---

## ⚙️ Personalizar Configuración (2 minutos)

### Cambiar Encabezado/Pie:
```
📱 Menú Admin → Impresora
  ↓
📝 En "Encabezado Personalizado":
   Escribir: "MI RESTAURANTE"
  ↓
📝 En "Pie de Página":
   Escribir: "¡Vuelva pronto!"
  ↓
✅ Presionar fuera del input (guarda automático)
```

### Ajustar Copias:
```
📝 En "Copias por Ticket":
   Seleccionar: 2 copias
  ↓
💡 Ahora cada comanda imprime 2 veces
   (útil para cocina + barra)
```

### Cambiar Tamaño:
```
📝 En "Tamaño de Papel":
   Seleccionar: 58mm o 80mm
   (según tu impresora)
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Mesero Tomando Orden
```
👨‍💼 Mesero va a Mesa 5
  ↓
📱 Abre app → Mesa 5
  ↓
🍔 Cliente pide: Hamburguesa sin cebolla + Papas
  ↓
📝 Mesero agrega productos y modificador
  ↓
✅ Presiona "Enviar Orden"
  ↓
🖨️ En cocina, IMPRIME AUTOMÁTICAMENTE:
```
```
COMANDA COCINA
ORDEN: ORD-123
Mesa: Mesa 5
Mesero: Juan
-----------------
1x Hamburguesa
   * Sin Cebolla
1x Papas Fritas
-----------------
```
```
👨‍🍳 Cocinero ve ticket físico
  ↓
🔥 Empieza a preparar
```

### Caso 2: Cliente Pide Cuenta
```
💵 Cliente: "La cuenta, por favor"
  ↓
👨‍💼 Mesero abre orden en app
  ↓
💰 Presiona "Solicitar Cuenta"
  ↓
🖨️ IMPRIME PRE-CUENTA:
```
```
RESTAURANTE HAMBURGUESAS
Orden: ORD-123
Mesa: Mesa 5
-------------------
1x Hamburguesa    Q35.00
   * Sin Cebolla
1x Papas Fritas   Q20.00
-------------------
TOTAL:            Q55.00
Estado: PENDIENTE
```
```
👨‍💼 Mesero lleva ticket a la mesa
  ↓
💵 Cliente paga
  ↓
✅ Mesero marca como pagado en app
```

---

## 🐛 Solución de Problemas

### ❌ No encuentra impresoras

**Síntomas:**
- Búsqueda sin resultados
- Lista vacía después de escanear

**Soluciones:**
```
1️⃣ Verificar Bluetooth del celular:
   Configuración → Bluetooth → ON
   
2️⃣ Verificar impresora:
   - ¿Está encendida? (luz LED)
   - ¿Está en modo emparejamiento?
   - ¿Tiene papel y batería?
   
3️⃣ Verificar permisos:
   Configuración → Apps → POS Order → Permisos
   → Bluetooth: PERMITIR
   → Ubicación: PERMITIR (necesario para BLE)
   
4️⃣ Reiniciar impresora:
   Apagar → Esperar 10s → Encender
   
5️⃣ Volver a escanear
```

---

### ❌ Se conecta pero no imprime

**Síntomas:**
- Conexión exitosa
- Al enviar orden, no imprime
- Sin mensajes de error

**Soluciones:**
```
1️⃣ Verificar modo simulación:
   Admin → Impresora → "Modo Simulación" debe estar OFF
   
2️⃣ Probar ticket de prueba:
   Admin → Impresora → "Imprimir Ticket de Prueba"
   
3️⃣ Verificar papel:
   - ¿Hay papel en la impresora?
   - ¿Está correctamente insertado?
   - ¿Es papel térmico?
   
4️⃣ Re-conectar:
   Admin → Impresora → "Desconectar"
   → Buscar de nuevo → Conectar
   
5️⃣ Verificar compatibilidad:
   Tu impresora debe soportar ESC/POS
   (mayoría de térmicas Bluetooth lo soportan)
```

---

### ❌ Texto cortado o mal formateado

**Síntomas:**
- Líneas cortadas
- Texto desalineado
- Caracteres extraños

**Soluciones:**
```
1️⃣ Ajustar tamaño de papel:
   Admin → Impresora → Tamaño de Papel
   → Seleccionar 58mm o 80mm según tu impresora
   
2️⃣ Verificar configuración impresora:
   Algunas impresoras tienen botón de configuración
   Presionar para alternar entre 58mm/80mm
   
3️⃣ Probar con encabezado más corto:
   Admin → Impresora → Encabezado
   → Usar máximo 24 caracteres para 58mm
   → Máximo 40 caracteres para 80mm
```

---

## 📊 Flujo Completo: De Orden a Cocina

```
┌─────────────────────────────────────────────┐
│  MESERO TOMA ORDEN                          │
│  📱 App → Mesa X → Agregar Productos        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  ENVIAR A COCINA                            │
│  ✅ Botón "Enviar Orden"                    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  AUTOMÁTICO:                                │
│  1. Guarda en BD (status: SENT)            │
│  2. 🖨️ IMPRIME COMANDA (sin precios)       │
│  3. 📱 Notifica a KDS                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  COCINA RECIBE                              │
│  👨‍🍳 Ticket físico impreso                   │
│  📱 Aparece en pantalla KDS                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  COCINERO PREPARA                           │
│  🔥 Sigue instrucciones del ticket          │
│  📱 Marca como "Preparando" en KDS          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  ORDEN LISTA                                │
│  ✅ Marca como "Lista" en KDS               │
│  📱 Notifica al mesero                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  CLIENTE PIDE CUENTA                        │
│  💰 Mesero: "Solicitar Cuenta"              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  MANUAL:                                    │
│  🖨️ IMPRIME PRE-CUENTA (con precios)       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  PAGO                                       │
│  💵 Cliente paga                             │
│  ✅ Mesero marca como PAGADO                │
└─────────────────────────────────────────────┘
```

---

## 🎓 Tips y Mejores Prácticas

### ✅ DO (Hacer):
- ✅ Siempre probar en modo simulación primero
- ✅ Hacer ticket de prueba antes de servicio
- ✅ Mantener impresora con papel cargado
- ✅ Configurar 2-3 copias para comanda si necesitas
- ✅ Personalizar encabezado con nombre de restaurante
- ✅ Guardar impresora configurada (se recuerda automáticamente)

### ❌ DON'T (No hacer):
- ❌ No conectar a impresora en modo simulación activado
- ❌ No usar papel no térmico (no imprimirá nada)
- ❌ No desconectar impresora durante servicio
- ❌ No poner encabezados muy largos (se cortan)
- ❌ No intentar imprimir sin papel (daña cabezal)

---

## 🚀 Próximos Pasos

Una vez dominado el sistema básico:

1. **Configurar múltiples impresoras**
   - Cocina: Impresora A
   - Barra: Impresora B
   - Caja: Impresora C

2. **Personalizar formato**
   - Agregar logo (próxima versión)
   - Cambiar fuentes y tamaños
   - Ajustar espaciado

3. **Backend**
   - Sincronizar configuración en nube
   - Re-imprimir tickets antiguos
   - Servidor de impresión centralizado

---

**¿Dudas?** Revisa `PRINTING_SYSTEM.md` para documentación técnica completa.

**¡Listo para imprimir!** 🎉
