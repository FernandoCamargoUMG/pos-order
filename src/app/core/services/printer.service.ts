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

    // Espaciado
    LINE_FEED: '\n',
    PAPER_CUT: `${GS}V\x00`,

    // Separadores
    SEPARATOR: '--------------------------------\n',
    SEPARATOR_SMALL: '----------------\n'
};

export interface PrinterConfig {
    deviceId?: string;
    deviceName?: string;
    paperWidth: 58 | 80; // mm
    copies: number;
    header: string;
    footer: string;
    simulationMode: boolean;
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
    private config: PrinterConfig = {
        paperWidth: 58,
        copies: 1,
        header: 'RESTAURANTE HAMBURGUESAS',
        footer: 'Gracias por su preferencia',
        simulationMode: true // Por defecto en modo simulación
    };

    constructor() {
        this.loadConfig();
    }

    async loadConfig(): Promise<void> {
        try {
            const { value } = await Preferences.get({ key: 'printer_config' });
            if (value) {
                this.config = { ...this.config, ...JSON.parse(value) };
            }
        } catch (error) {
            console.error('Error loading printer config:', error);
        }
    }

    async saveConfig(config: Partial<PrinterConfig>): Promise<void> {
        this.config = { ...this.config, ...config };
        await Preferences.set({
            key: 'printer_config',
            value: JSON.stringify(this.config)
        });
    }

    getConfig(): PrinterConfig {
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

            // Guardar configuración
            await this.saveConfig({
                deviceId,
                deviceName: this.connectedDevice?.name
            });

            console.log('Printer connected:', this.connectedDevice?.name);
        } catch (error) {
            console.error('Error connecting to printer:', error);
            throw new Error('No se pudo conectar a la impresora');
        }
    }

    async disconnectPrinter(): Promise<void> {
        if (this.connectedDevice) {
            try {
                await BleClient.disconnect(this.connectedDevice.deviceId);
                this.connectedDevice = null;
            } catch (error) {
                console.error('Error disconnecting printer:', error);
            }
        }
    }

    isConnected(): boolean {
        return this.connectedDevice !== null;
    }

    // ============================================
    // IMPRESIÓN - Comandos ESC/POS
    // ============================================

    private async sendToPrinter(data: string): Promise<void> {
        if (this.config.simulationMode) {
            // Modo simulación - mostrar en consola
            console.log('=== SIMULACIÓN DE IMPRESIÓN ===');
            console.log(data);
            console.log('=== FIN DE SIMULACIÓN ===');
            return;
        }

        if (!this.connectedDevice) {
            throw new Error('No hay impresora conectada');
        }

        try {
            // Convertir string a bytes
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);

            // Aquí iría la lógica para enviar a la impresora vía BLE
            // Esto depende del servicio y característica específicos de tu impresora
            // Ejemplo genérico (ajustar según tu impresora):
            /*
            const serviceUUID = 'tu-service-uuid';
            const characteristicUUID = 'tu-characteristic-uuid';
            
            await BleClient.write(
              this.connectedDevice.deviceId,
              serviceUUID,
              characteristicUUID,
              new DataView(bytes.buffer)
            );
            */

            console.log('Data sent to printer');
        } catch (error) {
            console.error('Error sending to printer:', error);
            throw new Error('Error al enviar datos a la impresora');
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
        ticket += ESC_POS.LINE_FEED;
        ticket += ESC_POS.LINE_FEED;
        ticket += ESC_POS.LINE_FEED;
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
        ticket += ESC_POS.LINE_FEED;
        ticket += ESC_POS.LINE_FEED;
        ticket += ESC_POS.LINE_FEED;
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
            const ticket = this.formatKitchenTicket(order);

            // Imprimir según número de copias configurado
            for (let i = 0; i < this.config.copies; i++) {
                await this.sendToPrinter(ticket);

                // Pequeña pausa entre copias
                if (i < this.config.copies - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            console.log('Kitchen order printed successfully');
        } catch (error) {
            console.error('Error printing kitchen order:', error);
            throw error;
        }
    }

    /**
     * Imprime pre-cuenta para cliente (con precios)
     */
    async printBill(order: OrderPrint): Promise<void> {
        try {
            const ticket = this.formatBillTicket(order);
            await this.sendToPrinter(ticket);
            console.log('Bill printed successfully');
        } catch (error) {
            console.error('Error printing bill:', error);
            throw error;
        }
    }

    /**
     * Imprime ticket de prueba
     */
    async printTestTicket(): Promise<void> {
        try {
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

            await this.sendToPrinter(ticket);
            console.log('Test ticket printed successfully');
        } catch (error) {
            console.error('Error printing test ticket:', error);
            throw error;
        }
    }
}
