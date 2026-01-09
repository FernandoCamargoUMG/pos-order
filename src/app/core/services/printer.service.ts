import { Injectable } from '@angular/core';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Preferences } from '@capacitor/preferences';

// Comandos ESC/POS para impresora térmica
const ESC = '\x1B';
const GS = '\x1D';

const ESC_POS = {
    // Inicialización
    INIT: `${ESC}@`,

    // Alineación
    ALIGN_LEFT: `${ESC}a\x00`,
    ALIGN_CENTER: `${ESC}a\x01`,
    ALIGN_RIGHT: `${ESC}a\x02`,

    // Tamaño de texto
    NORMAL: `${GS}!\x00`,
    DOUBLE_HEIGHT: `${GS}!\x01`,
    DOUBLE_WIDTH: `${GS}!\x10`,
    DOUBLE_SIZE: `${GS}!\x11`,

    // Estilo
    BOLD_ON: `${ESC}E\x01`,
    BOLD_OFF: `${ESC}E\x00`,
    UNDERLINE_ON: `${ESC}-\x01`,
    UNDERLINE_OFF: `${ESC}-\x00`,

    // Espaciado y corte
    LINE_FEED: '\n',
    FEED_LINES_3: `${ESC}d\x03`, // Avanzar 3 líneas
    FEED_LINES_5: `${ESC}d\x05`, // Avanzar 5 líneas
    PAPER_CUT: `${GS}V\x00`, // Corte parcial
    PAPER_CUT_FULL: `${GS}V\x01`, // Corte completo

    // Separadores
    SEPARATOR: '--------------------------------\n',
    SEPARATOR_SMALL: '----------------\n'
};

export interface PrinterConfig {
    connectionType: 'bluetooth' | 'network' | 'simulation';
    // Bluetooth
    deviceId?: string;
    deviceName?: string;
    serviceUUID?: string; // UUID descubierto automáticamente
    characteristicUUID?: string; // UUID descubierto automáticamente
    // Network
    printerIp?: string;
    printerPort?: number;
    // General
    paperWidth: 58 | 80; // mm
    copies: number;
    header: string;
    footer: string;
    simulationMode: boolean;
    // Configuración avanzada BLE (opcional)
    chunkSize?: number; // Tamaño de chunk BLE (default: 20 bytes - SEGURO para todas las impresoras)
    chunkDelay?: number; // Delay entre chunks en ms (default: 50ms - tiempo adecuado para procesamiento)
}

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    modifiers?: string[];
    notes?: string;
}

export interface OrderPrint {
    orderNumber: string;
    tableName: string;
    waiterName: string;
    date: Date;
    items: OrderItem[];
    subtotal?: number;
    total?: number;
    status?: 'PENDING' | 'PAID';
}

@Injectable({
    providedIn: 'root'
})
export class PrinterService {
    private connectedDevice: BleDevice | null = null;
    private networkConnected: boolean = false;
    private configLoaded: boolean = false;
    private configLoadingPromise: Promise<void> | null = null;
    private config: PrinterConfig = {
        connectionType: 'simulation',
        paperWidth: 58,
        copies: 1,
        header: 'RESTAURANTE HAMBURGUESAS',
        footer: 'Gracias por su preferencia',
        printerIp: '192.168.1.100',
        printerPort: 9100,
        simulationMode: true
    };

    constructor() {
        // No llamar métodos async en el constructor
    }

    /**
     * Asegura que la configuración esté cargada antes de usarla
     * Evita race conditions y múltiples cargas simultáneas
     */
    private async ensureConfigLoaded(): Promise<void> {
        if (this.configLoaded) {
            return;
        }

        // Si ya hay una carga en progreso, esperar a que termine
        if (this.configLoadingPromise) {
            return this.configLoadingPromise;
        }

        // Iniciar nueva carga
        this.configLoadingPromise = this.loadConfigInternal();
        await this.configLoadingPromise;
        this.configLoadingPromise = null;
    }

    private async loadConfigInternal(): Promise<void> {
        try {
            console.log('📥 Cargando configuración de impresora...');
            const { value } = await Preferences.get({ key: 'printer_config' });
            if (value) {
                this.config = { ...this.config, ...JSON.parse(value) };
                console.log('✅ Configuración cargada:', {
                    connectionType: this.config.connectionType,
                    deviceName: this.config.deviceName,
                    hasUUIDs: !!(this.config.serviceUUID && this.config.characteristicUUID)
                });
            } else {
                console.log('ℹ️ No hay configuración guardada, usando valores por defecto');
            }
            this.configLoaded = true;
        } catch (error) {
            console.error('❌ Error loading printer config:', error);
            this.configLoaded = true; // Marcar como cargado para evitar intentos infinitos
        }
    }

    async saveConfig(config: Partial<PrinterConfig>): Promise<void> {
        await this.ensureConfigLoaded();
        this.config = { ...this.config, ...config };
        console.log('💾 Guardando configuración:', config);
        await Preferences.set({
            key: 'printer_config',
            value: JSON.stringify(this.config)
        });
    }

    async getConfig(): Promise<PrinterConfig> {
        await this.ensureConfigLoaded();
        return { ...this.config };
    }

    // ============================================
    // BLUETOOTH - Descubrir y Conectar
    // ============================================

    async initializeBluetooth(): Promise<void> {
        try {
            await BleClient.initialize();
        } catch (error) {
            console.error('Error initializing Bluetooth:', error);
            throw new Error('No se pudo inicializar Bluetooth');
        }
    }

    async scanForPrinters(timeoutMs: number = 10000): Promise<BleDevice[]> {
        const devices: BleDevice[] = [];

        try {
            await this.initializeBluetooth();

            // Buscar TODOS los dispositivos BLE cercanos (sin filtro)
            await BleClient.requestLEScan(
                {}, // Sin filtros - busca todos los dispositivos
                (result) => {
                    if (!devices.find(d => d.deviceId === result.device.deviceId)) {
                        console.log('Dispositivo encontrado:', result.device.name, result.device.deviceId);
                        devices.push(result.device);
                    }
                }
            );

            // Esperar el tiempo de escaneo
            await new Promise(resolve => setTimeout(resolve, timeoutMs));
            await BleClient.stopLEScan();

            console.log(`Total dispositivos encontrados: ${devices.length}`);
            return devices;
        } catch (error) {
            console.error('Error scanning for printers:', error);
            throw new Error('Error al buscar impresoras');
        }
    }

    async connectToPrinter(deviceId: string): Promise<void> {
        try {
            await BleClient.connect(deviceId, (connectionState) => {
                if (!connectionState) {
                    console.log('Printer disconnected');
                    this.connectedDevice = null;
                }
            });

            // Guardar dispositivo conectado
            const devices = await BleClient.getDevices([deviceId]);
            this.connectedDevice = devices[0] || null;

            console.log('✓ Conectado a:', this.connectedDevice?.name);

            // Intentar establecer prioridad alta de conexión para mejor performance (opcional)
            try {
                // CONNECTION_PRIORITY_HIGH = 1 (reduce latencia)
                // Si falla, funcionará con prioridad por defecto
                await BleClient.requestConnectionPriority(deviceId, 1); // 1 = ConnectionPriority.CONNECTION_PRIORITY_HIGH
                console.log('✓ Prioridad de conexión establecida en HIGH');
            } catch (error) {
                // No es crítico si falla, funcionará con prioridad estándar
                console.log('ℹ️ No se pudo ajustar prioridad de conexión (normal en algunas impresoras)');
            }

            // Descubrir servicios y características automáticamente
            console.log('Descubriendo servicios de la impresora...');
            const { serviceUUID, characteristicUUID } = await this.discoverPrinterCharacteristics(deviceId);

            // Guardar configuración con los UUIDs descubiertos
            await this.saveConfig({
                connectionType: 'bluetooth',
                deviceId,
                deviceName: this.connectedDevice?.name,
                serviceUUID,
                characteristicUUID,
                simulationMode: false
            });

            console.log('✓ Impresora configurada:', {
                name: this.connectedDevice?.name,
                service: serviceUUID,
                characteristic: characteristicUUID
            });
        } catch (error) {
            console.error('Error connecting to printer:', error);
            throw new Error('No se pudo conectar a la impresora: ' + error);
        }
    }

    /**
     * Descubre automáticamente el servicio y característica correctos para imprimir
     * Prioriza servicios de impresora sobre servicios genéricos
     */
    private async discoverPrinterCharacteristics(deviceId: string): Promise<{ serviceUUID: string; characteristicUUID: string }> {
        try {
            // Obtener todos los servicios del dispositivo
            const services = await BleClient.getServices(deviceId);
            console.log(`📡 Encontrados ${services.length} servicios`);

            // Servicios conocidos de impresoras (en orden de prioridad)
            const printerServicePatterns = [
                '000018f0', // Serial Port Profile
                '49535343', // Microchip Transparent UART
                'e7810a71', // Printer Service común
                '0000fff0', // Custom printer service
                '6e400001', // Nordic UART Service
            ];

            // UUIDs genéricos de bajo nivel (evitar si es posible)
            const genericServices = [
                '00001800', // Generic Access
                '00001801', // Generic Attribute
                '0000180a', // Device Information
                '0000180f', // Battery Service
            ];

            interface CandidateCharacteristic {
                serviceUUID: string;
                characteristicUUID: string;
                priority: number;
                properties: any;
            }

            const candidates: CandidateCharacteristic[] = [];

            // Buscar todas las características con capacidad de escritura
            for (const service of services) {
                console.log(`🔍 Verificando servicio: ${service.uuid}`);
                
                // Calcular prioridad del servicio
                let priority = 0;
                const serviceId = service.uuid.toLowerCase();
                
                // Alta prioridad para servicios de impresora conocidos
                const printerIndex = printerServicePatterns.findIndex(pattern => 
                    serviceId.includes(pattern.toLowerCase())
                );
                if (printerIndex !== -1) {
                    priority = 100 - printerIndex; // Mayor prioridad para los primeros
                    console.log(`  ⭐ Servicio de impresora detectado (prioridad ${priority})`);
                }
                
                // Baja prioridad para servicios genéricos
                const isGeneric = genericServices.some(pattern => 
                    serviceId.includes(pattern.toLowerCase())
                );
                if (isGeneric) {
                    priority = -50;
                    console.log(`  ⚠️ Servicio genérico detectado (prioridad ${priority})`);
                }
                
                for (const characteristic of service.characteristics) {
                    const canWrite = characteristic.properties.write || characteristic.properties.writeWithoutResponse;
                    
                    if (canWrite) {
                        // Bonus de prioridad si soporta ambos tipos de escritura
                        let charPriority = priority;
                        if (characteristic.properties.write && characteristic.properties.writeWithoutResponse) {
                            charPriority += 10;
                        }

                        candidates.push({
                            serviceUUID: service.uuid,
                            characteristicUUID: characteristic.uuid,
                            priority: charPriority,
                            properties: characteristic.properties
                        });

                        console.log(`  ✅ Característica escribible encontrada:`, {
                            service: service.uuid.substring(0, 8),
                            characteristic: characteristic.uuid.substring(0, 8),
                            priority: charPriority,
                            write: characteristic.properties.write,
                            writeWithoutResponse: characteristic.properties.writeWithoutResponse
                        });
                    }
                }
            }

            if (candidates.length === 0) {
                throw new Error('No se encontró ninguna característica con capacidad de escritura');
            }

            // Ordenar por prioridad (mayor a menor)
            candidates.sort((a, b) => b.priority - a.priority);

            console.log(`\n🎯 Seleccionando característica con mayor prioridad:`);
            console.log(`   Servicio: ${candidates[0].serviceUUID}`);
            console.log(`   Característica: ${candidates[0].characteristicUUID}`);
            console.log(`   Prioridad: ${candidates[0].priority}`);
            
            if (candidates.length > 1) {
                console.log(`\n📋 Otras opciones disponibles (${candidates.length - 1}):`);
                candidates.slice(1, 4).forEach((c, i) => {
                    console.log(`   ${i + 2}. ${c.serviceUUID.substring(0, 8)}... (prioridad: ${c.priority})`);
                });
            }

            return {
                serviceUUID: candidates[0].serviceUUID,
                characteristicUUID: candidates[0].characteristicUUID
            };
        } catch (error) {
            console.error('❌ Error descubriendo características:', error);
            throw error;
        }
    }

    async disconnectPrinter(): Promise<void> {
        if (this.connectedDevice) {
            try {
                await BleClient.disconnect(this.connectedDevice.deviceId);
                this.connectedDevice = null;
                console.log('✓ Impresora desconectada');
                
                // Actualizar config para prevenir uso accidental
                await this.saveConfig({
                    connectionType: 'simulation',
                    simulationMode: true
                });
            } catch (error) {
                console.error('Error disconnecting printer:', error);
            }
        }
    }

    isConnected(): boolean {
        if (this.config.connectionType === 'bluetooth') {
            return this.connectedDevice !== null;
        } else if (this.config.connectionType === 'network') {
            return this.networkConnected;
        }
        return false;
    }

    // ============================================
    // RED/WIFI - Conectar a impresora de red
    // ============================================

    /**
     * ⚠️ LIMITACIÓN IMPORTANTE - IMPRESORAS DE RED ⚠️
     * 
     * Las impresoras térmicas de red utilizan RAW TCP sockets en el puerto 9100,
     * NO un servidor HTTP. Las aplicaciones móviles y navegadores web NO pueden
     * acceder directamente a sockets TCP por restricciones de seguridad.
     * 
     * SOLUCIONES ALTERNATIVAS:
     * 1. Usar impresora Bluetooth (RECOMENDADO para apps móviles)
     * 2. Implementar servidor intermediario (Node.js que reciba HTTP y envíe a TCP)
     * 3. Usar plugin nativo específico para sockets TCP
     * 
     * ESTADO ACTUAL: Este método intentará enviar vía HTTP, pero solo funcionará
     * si la impresora tiene un servidor web integrado (poco común en impresoras térmicas).
     */
    async connectToNetworkPrinter(ip: string, port: number = 9100): Promise<void> {
        console.log('⚠️ ADVERTENCIA: Las impresoras de red requieren configuración especial en apps móviles');
        console.log('   Se recomienda usar impresora Bluetooth para mayor compatibilidad');
        
        try {
            // Probar conexión enviando comando de inicialización
            const testData = ESC_POS.INIT;
            await this.sendToNetworkPrinter(ip, port, testData);
            
            this.networkConnected = true;
            await this.saveConfig({
                connectionType: 'network',
                printerIp: ip,
                printerPort: port,
                simulationMode: false
            });
            
            console.log(`✅ Conectado a impresora de red: ${ip}:${port}`);
        } catch (error) {
            console.error('Error conectando a impresora de red:', error);
            throw new Error('No se pudo conectar a la impresora de red. Verifica la IP y que la impresora esté encendida.');
        }
    }

    async disconnectNetworkPrinter(): Promise<void> {
        this.networkConnected = false;
        console.log('Desconectado de impresora de red');
    }

    private async sendToNetworkPrinter(ip: string, port: number, data: string): Promise<void> {
        console.log(`📡 Intentando enviar a impresora de red ${ip}:${port}...`);
        
        try {
            // Convertir comandos ESC/POS a bytes
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);
            
            console.log('⚠️ NOTA: Este método usa HTTP, no funcionará con impresoras térmicas estándar');
            console.log('   Las impresoras térmicas usan RAW TCP socket (puerto 9100), no HTTP');
            console.log('   Solo funcionará si la impresora tiene servidor HTTP integrado');
            
            // Enviar vía HTTP POST (solo funciona si la impresora tiene servidor web)
            const response = await fetch(`http://${ip}:${port}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                body: bytes
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            console.log('✅ Datos enviados a impresora de red (HTTP)');
        } catch (error) {
            console.error('❌ Error en sendToNetworkPrinter:', error);
            console.log('\n💡 SOLUCIÓN RECOMENDADA:');
            console.log('   1. Usa impresora Bluetooth en su lugar (100% compatible)');
            console.log('   2. O implementa servidor Node.js intermediario:');
            console.log('      - Recibe HTTP POST desde la app');
            console.log('      - Reenvía a impresora vía socket TCP puerto 9100');
            
            throw new Error(
                'No se pudo conectar con la impresora de red. ' +
                'Las impresoras térmicas requieren conexión TCP directa que no está disponible en apps móviles. ' +
                'Usa impresora Bluetooth o implementa un servidor intermediario.'
            );
        }
    }

    // ============================================
    // IMPRESIÓN - Comandos ESC/POS
    // ============================================

    private async sendToPrinter(data: string): Promise<void> {
        // Asegurar que la configuración esté cargada
        await this.ensureConfigLoaded();

        console.log(`🖨️ Iniciando impresión (modo: ${this.config.connectionType})`);

        // Modo simulación
        if (this.config.connectionType === 'simulation' || this.config.simulationMode) {
            console.log('=== SIMULACIÓN DE IMPRESIÓN ===');
            console.log(data);
            console.log('=== FIN DE SIMULACIÓN ===');
            return;
        }

        // Impresora de red
        if (this.config.connectionType === 'network') {
            if (!this.networkConnected || !this.config.printerIp) {
                throw new Error('No hay impresora de red conectada');
            }
            await this.sendToNetworkPrinter(
                this.config.printerIp,
                this.config.printerPort || 9100,
                data
            );
            return;
        }

        // Impresora Bluetooth
        if (!this.connectedDevice) {
            throw new Error('No hay impresora Bluetooth conectada');
        }

        // Verificar que tengamos los UUIDs descubiertos
        if (!this.config.serviceUUID || !this.config.characteristicUUID) {
            throw new Error('Los UUIDs de la impresora no fueron descubiertos. Reconecta la impresora.');
        }

        // Verificación básica de que tenemos deviceId
        if (!this.config.deviceId) {
            throw new Error('No se encontró el ID del dispositivo. Reconecta la impresora.');
        }

        try {
            console.log('📤 Enviando datos a impresora BT:', this.config.deviceName || 'Impresora');
            console.log('   Device ID:', this.config.deviceId);
            console.log('   Servicio:', this.config.serviceUUID.substring(0, 8) + '...');
            console.log('   Característica:', this.config.characteristicUUID.substring(0, 8) + '...');
            
            // Convertir string a bytes
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);
            
            console.log(`   Tamaño: ${bytes.length} bytes`);

            // Usar configuración dinámica o valores por defecto SEGUROS
            // 20 bytes = MTU estándar BLE (funciona con TODAS las impresoras)
            // 50ms = tiempo adecuado para que la impresora procese cada chunk
            const chunkSize = this.config.chunkSize || 20;
            const chunkDelay = this.config.chunkDelay || 50;
            
            console.log(`   Chunk size: ${chunkSize} bytes, delay: ${chunkDelay}ms`);
            console.log(`   Total chunks a enviar: ${Math.ceil(bytes.length / chunkSize)}`);

            // Usar los UUIDs descubiertos automáticamente con retry logic
            await this.writeInChunksWithRetry(
                this.config.deviceId,
                this.config.serviceUUID,
                this.config.characteristicUUID,
                bytes,
                chunkSize,
                chunkDelay
            );
            
            // Esperar a que la impresora procese todos los datos antes de confirmar
            // Tiempo crítico para que el buffer de la impresora se vacíe
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log('✅ Datos enviados correctamente a la impresora');
        } catch (error) {
            console.error('❌ Error sending to printer:', error);
            throw new Error('Error al enviar datos a la impresora: ' + error);
        }
    }

    /**
     * Escribe datos en chunks con retry logic para manejar fallos temporales
     * IMPORTANTE: Usa chunk size de 20 bytes (MTU estándar BLE) para máxima compatibilidad
     * Solo aumenta si tu impresora soporta BLE 4.2+ y MTU más grande
     */
    private async writeInChunksWithRetry(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        data: Uint8Array,
        chunkSize: number = 20,
        chunkDelay: number = 50,
        maxRetries: number = 3
    ): Promise<void> {
        const totalChunks = Math.ceil(data.length / chunkSize);
        const estimatedTime = ((totalChunks * chunkDelay) / 1000).toFixed(1);
        console.log(`📦 Enviando ${totalChunks} chunks de ${chunkSize} bytes (delay: ${chunkDelay}ms)...`);
        console.log(`   Tiempo estimado: ~${estimatedTime} segundos`);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let successfulChunks = 0;
                
                for (let i = 0; i < data.length; i += chunkSize) {
                    const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
                    const chunkNumber = Math.floor(i / chunkSize) + 1;
                    
                    try {
                        await BleClient.write(
                            deviceId,
                            serviceUUID,
                            characteristicUUID,
                            new DataView(chunk.buffer)
                        );
                        successfulChunks++;
                        
                        // Mostrar progreso cada 10 chunks
                        if (chunkNumber % 10 === 0 || chunkNumber === totalChunks) {
                            console.log(`   Progreso: ${chunkNumber}/${totalChunks} chunks`);
                        }
                    } catch (chunkError) {
                        console.error(`❌ Error en chunk ${chunkNumber}:`, chunkError);
                        throw chunkError; // Propagar para reintentar todo
                    }
                    
                    // Pausa entre chunks (configurable, default 10ms)
                    // Si tienes problemas, aumenta chunkDelay en la configuración
                    await new Promise(resolve => setTimeout(resolve, chunkDelay));
                }

                console.log(`✅ ${successfulChunks}/${totalChunks} chunks enviados exitosamente`);
                return; // Éxito - salir del loop de reintentos
                
            } catch (error) {
                console.error(`⚠️ Intento ${attempt}/${maxRetries} fallido:`, error);
                
                if (attempt === maxRetries) {
                    throw new Error(`Fallo después de ${maxRetries} intentos: ${error}`);
                }
                
                // Esperar antes de reintentar (backoff exponencial)
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`   Reintentando en ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    /**
     * Versión simple de writeInChunks (sin retry) - mantener por compatibilidad
     */
    private async writeInChunks(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        data: Uint8Array,
        chunkSize: number = 20
    ): Promise<void> {
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
            await BleClient.write(
                deviceId,
                serviceUUID,
                characteristicUUID,
                new DataView(chunk.buffer)
            );
            // Pequeña pausa entre chunks para dar tiempo a la impresora
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    // ============================================
    // FORMATEO DE TICKETS
    // ============================================

    private formatKitchenTicket(order: OrderPrint): string {
        let ticket = ESC_POS.INIT;

        // Cabecera
        ticket += ESC_POS.ALIGN_CENTER;
        ticket += ESC_POS.DOUBLE_SIZE;
        ticket += `COMANDA COCINA\n`;
        ticket += ESC_POS.NORMAL;
        ticket += ESC_POS.LINE_FEED;

        // Info de la orden
        ticket += ESC_POS.ALIGN_LEFT;
        ticket += ESC_POS.BOLD_ON;
        ticket += `ORDEN: ${order.orderNumber}\n`;
        ticket += ESC_POS.BOLD_OFF;
        ticket += `Mesa: ${order.tableName}\n`;
        ticket += `Mesero: ${order.waiterName}\n`;
        ticket += `Fecha: ${this.formatDate(order.date)}\n`;
        ticket += ESC_POS.SEPARATOR;

        // Items (SIN PRECIOS para cocina)
        ticket += ESC_POS.BOLD_ON;
        ticket += 'ITEMS:\n';
        ticket += ESC_POS.BOLD_OFF;

        order.items.forEach(item => {
            // Cantidad y nombre
            ticket += `${item.quantity}x ${item.name}\n`;

            // Modificadores
            if (item.modifiers && item.modifiers.length > 0) {
                item.modifiers.forEach(mod => {
                    ticket += `   * ${mod}\n`;
                });
            }

            // Notas
            if (item.notes) {
                ticket += `   Nota: ${item.notes}\n`;
            }

            ticket += ESC_POS.LINE_FEED;
        });

        ticket += ESC_POS.SEPARATOR;

        // Pie
        ticket += ESC_POS.ALIGN_CENTER;
        ticket += this.config.footer + '\n';
        ticket += ESC_POS.FEED_LINES_5; // Alimentar papel
        ticket += ESC_POS.LINE_FEED; // Línea extra para asegurar flush
        ticket += ESC_POS.PAPER_CUT;

        return ticket;
    }

    private formatBillTicket(order: OrderPrint): string {
        let ticket = ESC_POS.INIT;

        // Cabecera
        ticket += ESC_POS.ALIGN_CENTER;
        ticket += ESC_POS.DOUBLE_HEIGHT;
        ticket += this.config.header + '\n';
        ticket += ESC_POS.NORMAL;
        ticket += ESC_POS.LINE_FEED;

        // Info de la orden
        ticket += ESC_POS.ALIGN_LEFT;
        ticket += `Orden: ${order.orderNumber}\n`;
        ticket += `Mesa: ${order.tableName}\n`;
        ticket += `Mesero: ${order.waiterName}\n`;
        ticket += `Fecha: ${this.formatDate(order.date)}\n`;
        ticket += ESC_POS.SEPARATOR;

        // Items con precios
        ticket += ESC_POS.BOLD_ON;
        ticket += 'ITEMS:\n';
        ticket += ESC_POS.BOLD_OFF;

        order.items.forEach(item => {
            const itemTotal = item.quantity * item.price;

            // Línea principal: cantidad, nombre y total
            const mainLine = `${item.quantity}x ${item.name}`;
            const price = `Q${itemTotal.toFixed(2)}`;
            ticket += this.formatLine(mainLine, price, 32);

            // Modificadores
            if (item.modifiers && item.modifiers.length > 0) {
                item.modifiers.forEach(mod => {
                    ticket += `   * ${mod}\n`;
                });
            }

            // Notas
            if (item.notes) {
                ticket += `   Nota: ${item.notes}\n`;
            }
        });

        ticket += ESC_POS.SEPARATOR;

        // Totales
        if (order.subtotal !== undefined) {
            ticket += this.formatLine('Subtotal:', `Q${order.subtotal.toFixed(2)}`, 32);
        }

        ticket += ESC_POS.DOUBLE_HEIGHT;
        ticket += ESC_POS.BOLD_ON;
        ticket += this.formatLine('TOTAL:', `Q${order.total!.toFixed(2)}`, 32);
        ticket += ESC_POS.BOLD_OFF;
        ticket += ESC_POS.NORMAL;

        ticket += ESC_POS.SEPARATOR;

        // Estado
        ticket += ESC_POS.ALIGN_CENTER;
        ticket += `Estado: ${order.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}\n`;
        ticket += ESC_POS.LINE_FEED;

        // Pie
        ticket += this.config.footer + '\n';
        ticket += ESC_POS.FEED_LINES_5; // Alimentar papel
        ticket += ESC_POS.LINE_FEED; // Línea extra para asegurar flush
        ticket += ESC_POS.PAPER_CUT;

        return ticket;
    }

    // Helper para formatear líneas con espaciado (ej: "Item     Q10.00")
    private formatLine(left: string, right: string, totalWidth: number): string {
        const spacesNeeded = totalWidth - left.length - right.length;
        const spaces = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' ';
        return `${left}${spaces}${right}\n`;
    }

    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // ============================================
    // MÉTODOS PÚBLICOS DE IMPRESIÓN
    // ============================================

    /**
     * Imprime comanda para cocina (sin precios)
     */
    async printKitchenOrder(order: OrderPrint): Promise<void> {
        try {
            console.log(`🍳 Imprimiendo orden de cocina - Orden #${order.orderNumber}`);
            await this.ensureConfigLoaded();
            
            const ticket = this.formatKitchenTicket(order);
            console.log(`   Longitud del ticket: ${ticket.length} caracteres`);

            // Imprimir según número de copias configurado
            for (let i = 0; i < this.config.copies; i++) {
                if (this.config.copies > 1) {
                    console.log(`   Copia ${i + 1}/${this.config.copies}`);
                }
                
                await this.sendToPrinter(ticket);

                // Pequeña pausa entre copias
                if (i < this.config.copies - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            console.log('✅ Orden de cocina impresa exitosamente');
        } catch (error) {
            console.error('❌ Error printing kitchen order:', error);
            throw error;
        }
    }

    /**
     * Imprime pre-cuenta para cliente (con precios)
     */
    async printBill(order: OrderPrint): Promise<void> {
        try {
            console.log(`💵 Imprimiendo cuenta - Orden #${order.orderNumber}`);
            await this.ensureConfigLoaded();
            
            const ticket = this.formatBillTicket(order);
            console.log(`   Longitud del ticket: ${ticket.length} caracteres`);
            console.log(`   Total: Q${order.total?.toFixed(2)}`);
            
            await this.sendToPrinter(ticket);
            console.log('✅ Cuenta impresa exitosamente');
        } catch (error) {
            console.error('❌ Error printing bill:', error);
            throw error;
        }
    }

    /**
     * Imprime ticket de prueba
     */
    async printTestTicket(): Promise<void> {
        try {
            console.log('🚨 Imprimiendo ticket de prueba...');
            await this.ensureConfigLoaded();
            
            let ticket = ESC_POS.INIT;

            ticket += ESC_POS.ALIGN_CENTER;
            ticket += ESC_POS.DOUBLE_SIZE;
            ticket += 'PRUEBA DE IMPRESORA\n';
            ticket += ESC_POS.NORMAL;
            ticket += ESC_POS.LINE_FEED;

            ticket += ESC_POS.ALIGN_LEFT;
            ticket += 'Impresora configurada correctamente\n';
            ticket += `Fecha: ${this.formatDate(new Date())}\n`;
            ticket += ESC_POS.SEPARATOR;

            ticket += ESC_POS.ALIGN_CENTER;
            ticket += 'Si puede leer esto,\n';
            ticket += 'la impresora funciona!\n';
            ticket += ESC_POS.LINE_FEED;
            ticket += ESC_POS.LINE_FEED;
            ticket += ESC_POS.LINE_FEED;
            ticket += ESC_POS.PAPER_CUT;

            console.log(`   Configuración actual:`);
            console.log(`   - Tipo: ${this.config.connectionType}`);
            console.log(`   - Dispositivo: ${this.config.deviceName || 'N/A'}`);
            console.log(`   - Ancho papel: ${this.config.paperWidth}mm`);
            
            await this.sendToPrinter(ticket);
            console.log('✅ Ticket de prueba impreso exitosamente');
        } catch (error) {
            console.error('❌ Error printing test ticket:', error);
            throw error;
        }
    }
}
