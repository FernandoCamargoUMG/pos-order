# 🖨️ Cómo Simular Impresora Térmica para Testing

## 🎯 Necesidad
Probar la conexión Bluetooth y el envío de comandos ESC/POS **SIN** comprar una impresora física.

---

## ✅ OPCIÓN 1: Usar Otro Celular como Impresora (RECOMENDADO)

### Requisitos:
- 📱 **Dispositivo A**: Tu celular con la app POS instalada
- 📱 **Dispositivo B**: Otro celular/tablet Android (puede ser viejo)
- ⏱️ **Tiempo**: 5 minutos

### Paso 1: Preparar Dispositivo B (Impresora Simulada)

#### Instalar App Emuladora:
Hay varias apps gratuitas en Play Store:

**Opción A: "Bluetooth Terminal"** (Recomendado)
```
📱 En Dispositivo B:
1. Abrir Play Store
2. Buscar: "Bluetooth Terminal HC-05"
3. Instalar app de "Next Prototyping"
4. Abrir app
5. Clic en 3 puntos → Settings
6. Activar "Make device discoverable"
7. Activar "Enable Bluetooth LE"
```

**Opción B: "Serial Bluetooth Terminal"**
```
📱 En Dispositivo B:
1. Play Store → "Serial Bluetooth Terminal"
2. Instalar (Kai Morich)
3. Abrir → Clic en botón Bluetooth
4. Seleccionar "Make device discoverable"
5. Mantener la app abierta
```

### Paso 2: Hacer Dispositivo B Visible

```
📱 Dispositivo B:
1. Ir a Configuración → Bluetooth
2. Activar Bluetooth
3. Activar "Visible para otros dispositivos"
4. Dejar pantalla encendida
```

**IMPORTANTE:** El nombre Bluetooth de tu dispositivo aparecerá como:
- "Samsung Galaxy A10" (ejemplo)
- "Xiaomi Redmi 9"
- O el nombre que tenga tu dispositivo

### Paso 3: Buscar desde tu App POS

```
📱 Dispositivo A (tu app):
1. Abrir POS → Admin → Impresora
2. Desactivar "Modo Simulación"
3. Clic en "Buscar Impresoras Bluetooth"
4. Esperar 10 segundos
5. DEBERÍAS VER tu Dispositivo B en la lista
```

**Ejemplo de lo que verás:**
```
┌────────────────────────────────────┐
│ Impresoras Encontradas:            │
├────────────────────────────────────┤
│ 🖨️ Samsung Galaxy A10              │
│    00:1A:7D:DA:71:13               │
└────────────────────────────────────┘
```

### Paso 4: Conectar

```
📱 Dispositivo A:
1. Clic en el nombre de Dispositivo B
2. Ver mensaje: "Conectando a impresora..."
3. 
📱 Dispositivo B:
   - Puede aparecer solicitud de emparejamiento
   - Aceptar emparejamiento
4.
📱 Dispositivo A:
   - Ver "Conectado a [nombre dispositivo]"
```

### Paso 5: Probar Impresión

```
📱 Dispositivo A:
1. Clic en "Imprimir Ticket de Prueba"
2. Esperar...
3.
📱 Dispositivo B (Terminal Bluetooth):
   - Verás los bytes RAW recibidos
   - Algo como: "1B 40 1B 61 01 ..."
   - Son los comandos ESC/POS en hexadecimal
```

**Ejemplo en Terminal Bluetooth:**
```
Received: 1B 40 1B 61 01 1D 21 11 50 52 55 45 42 41 20 44 45 20 49 4D 50 52 45 53 4F 52 41 0A
Decoded: [ESC]@[ESC]a[01][GS]![11]PRUEBA DE IMPRESORA
```

### Paso 6: Crear Orden Real

```
📱 Dispositivo A:
1. Ir a Mesas → Mesa 1
2. Agregar: 1x Hamburguesa, 1x Papas
3. Presionar "Enviar Orden"
4.
📱 Dispositivo B:
   - Verás la comanda completa en bytes
   - Los comandos ESC/POS se reciben correctamente
```

---

## 🖥️ OPCIÓN 2: Usar PC con Bluetooth (AVANZADO)

### Requisitos:
- 💻 PC con Bluetooth
- 📱 Tu celular con app POS
- 🐍 Python instalado

### Paso 1: Instalar Software en PC

```powershell
# Abrir PowerShell como Administrador

# Instalar Python (si no lo tienes)
# Descargar de: python.org

# Instalar PyBluez
pip install pybluez

# Instalar PySerial
pip install pyserial
```

### Paso 2: Crear Script Servidor Bluetooth

Crear archivo `bluetooth_printer_simulator.py`:

```python
import bluetooth
import struct

def start_bluetooth_server():
    server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
    
    port = 1
    server_sock.bind(("", port))
    server_sock.listen(1)
    
    print("🖨️ Servidor Bluetooth Iniciado")
    print("Esperando conexión de POS...")
    
    uuid = "00001101-0000-1000-8000-00805F9B34FB"  # Serial Port Profile
    bluetooth.advertise_service(
        server_sock,
        "Thermal Printer Simulator",
        service_id=uuid,
        service_classes=[uuid, bluetooth.SERIAL_PORT_CLASS],
        profiles=[bluetooth.SERIAL_PORT_PROFILE]
    )
    
    client_sock, client_info = server_sock.accept()
    print(f"✅ Conexión aceptada de: {client_info}")
    
    try:
        while True:
            data = client_sock.recv(1024)
            if not data:
                break
            
            # Mostrar datos recibidos
            print("\n📥 Datos recibidos:")
            print("Hex:", data.hex())
            
            # Intentar decodificar como texto
            try:
                text = data.decode('utf-8', errors='ignore')
                print("Texto:", text)
            except:
                pass
            
            # Simular respuesta de impresora (opcional)
            # client_sock.send(b'\x00')  # ACK
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_sock.close()
        server_sock.close()
        print("❌ Conexión cerrada")

if __name__ == "__main__":
    start_bluetooth_server()
```

### Paso 3: Ejecutar Servidor

```powershell
# En PowerShell
cd "C:\Users\Fernando Camargo\Desktop\hamburgerapp\pos-order"

# Ejecutar script
python bluetooth_printer_simulator.py
```

**Output esperado:**
```
🖨️ Servidor Bluetooth Iniciado
Esperando conexión de POS...
```

### Paso 4: Conectar desde App

```
📱 En tu celular:
1. Admin → Impresora
2. Buscar impresoras
3. Debería aparecer "Thermal Printer Simulator"
4. Conectar
```

### Paso 5: Ver Datos en PC

```
💻 En PowerShell verás:
✅ Conexión aceptada de: ('XX:XX:XX:XX:XX:XX', 1)

📥 Datos recibidos:
Hex: 1b401b61011d2111505255454241...
Texto: [ESC]@[ESC]a[01]PRUEBA DE IMPRESORA...
```

---

## 📱 OPCIÓN 3: Emulador Android en PC (MÁS COMPLEJO)

### Usando BlueStacks/Android Studio:

1. Instalar BlueStacks o Android Studio Emulator
2. Instalar "Bluetooth Terminal" en el emulador
3. Habilitar Bluetooth virtual
4. Conectar tu celular físico al emulador Bluetooth

**Limitación:** Bluetooth virtual puede no funcionar bien en algunos emuladores.

---

## 🔍 Verificar que la Conexión Funciona

### Checklist de Éxito:

✅ **Escaneo:**
```
📱 App POS busca → Encuentra dispositivo
```

✅ **Conexión:**
```
📱 App POS conecta → Estado: "Conectado"
📱 Dispositivo B → Solicitud de emparejamiento aceptada
```

✅ **Envío de Datos:**
```
📱 App POS → "Imprimir Ticket de Prueba"
📱 Dispositivo B → Recibe bytes
```

✅ **Comandos ESC/POS:**
```
📱 Dispositivo B debe recibir:
- 1B 40 (ESC @ - Inicializar)
- 1B 61 01 (ESC a 1 - Centrar)
- Texto de prueba
- 1D 56 00 (GS V 0 - Cortar papel)
```

---

## 🐛 Troubleshooting

### No encuentra el dispositivo:

```
❌ PROBLEMA: Lista vacía después de buscar

✅ SOLUCIONES:
1. Verificar Bluetooth activo en AMBOS dispositivos
2. En Dispositivo B: "Visible para otros" activado
3. Permisos de ubicación en App POS (necesario para BLE)
4. Reiniciar Bluetooth en ambos dispositivos
5. Acercar los dispositivos (máximo 10 metros)
```

### Se conecta pero no recibe datos:

```
❌ PROBLEMA: Conexión exitosa pero sin datos en Terminal

✅ SOLUCIONES:
1. Verificar que Terminal Bluetooth está en modo "Listen"
2. Reiniciar Terminal Bluetooth
3. Desconectar y reconectar desde App POS
4. Verificar en logs de Terminal si hay errores
```

### Error de emparejamiento:

```
❌ PROBLEMA: "Pairing failed" o "Authentication error"

✅ SOLUCIONES:
1. Eliminar emparejamiento anterior:
   Configuración → Bluetooth → Dispositivos emparejados
   → Olvidar dispositivo
   
2. Volver a buscar y conectar

3. Aceptar TODAS las solicitudes de emparejamiento
```

---

## 📊 Interpretando los Comandos ESC/POS

Cuando veas los bytes en el terminal, así los interpretas:

### Comandos Comunes:

```
1B 40           = ESC @    → Inicializar impresora
1B 61 00        = ESC a 0  → Alinear izquierda
1B 61 01        = ESC a 1  → Centrar
1B 61 02        = ESC a 2  → Alinear derecha
1D 21 00        = GS ! 0   → Tamaño normal
1D 21 11        = GS ! 17  → Doble tamaño
1B 45 01        = ESC E 1  → Negrita ON
1B 45 00        = ESC E 0  → Negrita OFF
0A              = LF       → Nueva línea
1D 56 00        = GS V 0   → Cortar papel
```

### Ejemplo de Ticket Decodificado:

**Bytes recibidos:**
```
1B 40 1B 61 01 1D 21 11 50 52 55 45 42 41 0A
```

**Decodificación:**
```
1B 40          → ESC @ (Inicializar)
1B 61 01       → ESC a 1 (Centrar)
1D 21 11       → GS ! 17 (Doble tamaño)
50 52 55 45 42 41 → "PRUEBA" (ASCII)
0A             → Nueva línea
```

**Resultado visual:**
```
        PRUEBA        
```

---

## 🎓 Mejores Prácticas para Testing

### 1. Siempre empezar con:
```
📱 Modo Simulación → Verificar formato
📱 Terminal Bluetooth → Verificar conexión
📱 Impresora Real → Testing final
```

### 2. Documentar lo que funciona:
```
✅ Conexión: OK
✅ Envío de datos: OK
✅ Formato de ticket: OK
✅ Comandos ESC/POS: OK
```

### 3. Probar casos extremos:
```
- Ticket con muchos items (>20)
- Nombres muy largos
- Modificadores múltiples
- Conexión y desconexión repetida
```

---

## 🚀 Próximo Paso: Comprar Impresora Real

Una vez que TODO funciona en simulación:

### Impresoras Recomendadas en Guatemala:

**Presupuesto Bajo (Q300-500):**
- Generic 58mm Bluetooth Thermal Printer
- Cualquiera que diga "ESC/POS compatible"

**Presupuesto Medio (Q500-800):**
- Rongta RPP300
- Xprinter XP-P300
- Zjiang ZJ-5802

**Presupuesto Alto (Q800-1500):**
- **AON PR-2 50** (la que mencionaste)
- Epson TM-P20
- Star SM-S230i

### Donde Comprar:
- **Elektra**: Sección de TPV/POS
- **Almacenes Tropigas**: Equipos de oficina
- **Mercado Libre Guatemala**: Búsqueda "impresora térmica bluetooth"
- **Amazon** (envío a Guatemala)

### Verificar Compatibilidad:
✅ **DEBE decir:** "ESC/POS Compatible"
✅ **DEBE tener:** Bluetooth 4.0 o superior
✅ **DEBE soportar:** Android
✅ **Tamaño:** 58mm o 80mm (según tu preferencia)

---

## 📹 Video Tutorial (Próximamente)

Puedo crear un video mostrando:
1. Configuración de Terminal Bluetooth
2. Conexión desde la app
3. Interpretación de comandos ESC/POS
4. Testing completo

---

## 🎯 Resumen Rápido

**Para probar AHORA mismo (5 minutos):**

```
1️⃣ Dispositivo B: Instalar "Bluetooth Terminal HC-05"
2️⃣ Dispositivo B: Activar "Visible" en Bluetooth
3️⃣ Dispositivo A (tu app): Admin → Impresora
4️⃣ Dispositivo A: Buscar impresoras
5️⃣ Dispositivo A: Conectar al nombre de Dispositivo B
6️⃣ Dispositivo A: "Imprimir Ticket de Prueba"
7️⃣ Dispositivo B: Ver bytes recibidos en Terminal
✅ SUCCESS: Si ves bytes, la conexión funciona!
```

---

**¿Tienes otro celular/tablet Android disponible?** Si sí, usa Opción 1 (más fácil).

**¿Solo tienes PC con Bluetooth?** Usa Opción 2 (requiere Python).

**¿No tienes nada?** Puedes comprar una impresora térmica barata (Q300-400) en Mercado Libre.

¡Avísame cuál opción vas a usar y te ayudo con los detalles específicos! 🚀
