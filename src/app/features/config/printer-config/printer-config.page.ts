import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonBadge,
  IonInput,
  IonTextarea,
  ToastController,
  LoadingController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  printOutline,
  bluetoothOutline,
  wifiOutline,
  checkmarkCircle,
  closeCircle,
  searchOutline,
  settings,
  document
} from 'ionicons/icons';
import { PrinterService, PrinterConfig } from '../../../core/services/printer.service';
import { BleDevice } from '@capacitor-community/bluetooth-le';

@Component({
  selector: 'app-printer-config',
  templateUrl: './printer-config.page.html',
  styleUrls: ['./printer-config.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonBadge,
    IonInput,
    IonTextarea,
  ],
})
export class PrinterConfigPage implements OnInit {
  config: PrinterConfig = {
    paperWidth: 58,
    copies: 1,
    header: '',
    footer: '',
    simulationMode: true
  };

  availablePrinters: BleDevice[] = [];
  isScanning = false;
  isConnected = false;

  constructor(
    private printerService: PrinterService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      printOutline,
      bluetoothOutline,
      wifiOutline,
      checkmarkCircle,
      closeCircle,
      searchOutline,
      settings,
      document
    });
  }

  async ngOnInit() {
    await this.loadConfig();
    this.isConnected = this.printerService.isConnected();
  }

  async loadConfig() {
    this.config = this.printerService.getConfig();
  }

  async saveConfig() {
    try {
      await this.printerService.saveConfig(this.config);
      await this.showToast('Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      await this.showToast('Error al guardar configuración', 'danger');
    }
  }

  // ============================================
  // BÚSQUEDA Y CONEXIÓN DE IMPRESORAS
  // ============================================

  async scanForPrinters() {
    this.isScanning = true;
    this.availablePrinters = [];

    const loading = await this.loadingController.create({
      message: 'Buscando impresoras Bluetooth...',
      duration: 10000
    });
    await loading.present();

    try {
      this.availablePrinters = await this.printerService.scanForPrinters(10000);
      
      if (this.availablePrinters.length === 0) {
        await this.showToast('No se encontraron impresoras. Asegúrate de que la impresora esté encendida y en modo emparejamiento.', 'warning');
      } else {
        await this.showToast(`Se encontraron ${this.availablePrinters.length} impresora(s)`, 'success');
      }
    } catch (error: any) {
      console.error('Error scanning for printers:', error);
      await this.showToast('Error al buscar impresoras: ' + error.message, 'danger');
    } finally {
      this.isScanning = false;
      await loading.dismiss();
    }
  }

  async connectToPrinter(device: BleDevice) {
    const loading = await this.loadingController.create({
      message: 'Conectando a impresora...'
    });
    await loading.present();

    try {
      await this.printerService.connectToPrinter(device.deviceId);
      this.isConnected = true;
      
      // Actualizar configuración
      this.config.deviceId = device.deviceId;
      this.config.deviceName = device.name;
      await this.saveConfig();

      await this.showToast(`Conectado a ${device.name}`, 'success');
    } catch (error: any) {
      console.error('Error connecting to printer:', error);
      await this.showToast('Error al conectar: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async disconnectPrinter() {
    const alert = await this.alertController.create({
      header: 'Desconectar Impresora',
      message: '¿Estás seguro de desconectar la impresora?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Desconectar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.printerService.disconnectPrinter();
              this.isConnected = false;
              this.config.deviceId = undefined;
              this.config.deviceName = undefined;
              await this.saveConfig();
              await this.showToast('Impresora desconectada', 'success');
            } catch (error: any) {
              await this.showToast('Error al desconectar', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // ============================================
  // PRUEBA DE IMPRESIÓN
  // ============================================

  async printTestTicket() {
    if (!this.config.simulationMode && !this.isConnected) {
      await this.showToast('Debes conectar una impresora primero o activar el modo simulación', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Imprimiendo prueba...'
    });
    await loading.present();

    try {
      await this.printerService.printTestTicket();
      
      if (this.config.simulationMode) {
        await this.showAlert(
          'Modo Simulación',
          'Ticket de prueba generado. En modo simulación, los tickets se muestran en la consola del desarrollador. Conecta una impresora real y desactiva el modo simulación para imprimir físicamente.'
        );
      } else {
        await this.showToast('Ticket de prueba impreso exitosamente', 'success');
      }
    } catch (error: any) {
      console.error('Error printing test:', error);
      await this.showToast('Error al imprimir prueba: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // ============================================
  // MODO SIMULACIÓN
  // ============================================

  async toggleSimulationMode(event: any) {
    this.config.simulationMode = event.detail.checked;
    await this.saveConfig();

    if (this.config.simulationMode) {
      await this.showToast('Modo simulación activado. Los tickets se mostrarán en consola.', 'primary');
    } else {
      await this.showToast('Modo simulación desactivado. Se imprimirá en la impresora conectada.', 'warning');
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
