import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    Platform,
    IonSpinner,
    IonBadge,
    AlertController,
    ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    logOutOutline,
    pricetagOutline,
    peopleOutline,
    restaurantOutline,
    gridOutline,
    statsChartOutline,
    settingsOutline,
    bagAddOutline,
    optionsOutline,
    cashOutline,
    printOutline,
    cloudUploadOutline,
    cloudDoneOutline,
    cloudOfflineOutline,
    refreshOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-admin-menu',
    templateUrl: './admin-menu.page.html',
    styleUrls: ['./admin-menu.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButtons,
        IonButton,
        IonIcon,
        IonGrid,
        IonRow,
        IonCol,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonSpinner,
        IonBadge
    ]
})
export class AdminMenuPage implements OnInit, OnDestroy {

    isOnline = false;
    isSyncing = false;
    lastSyncTime: Date | null = null;
    pendingItems = 0;

    menuOptions = [
        {
            title: 'Productos',
            icon: 'pricetag-outline',
            color: 'primary',
            route: '/products',
            description: 'Gestionar menú y precios'
        },
        {
            title: 'Upselling',
            icon: 'bag-add-outline',
            color: 'success',
            route: '/upselling-management',
            description: 'Gestionar ofertas y combos'
        },
        {
            title: 'Modificadores',
            icon: 'options-outline',
            color: 'tertiary',
            route: '/modifiers-management',
            description: 'Exclusiones, extras y términos'
        },
        {
            title: 'Mesas',
            icon: 'grid-outline',
            color: 'secondary',
            route: '/tables',
            description: 'Administrar mesas'
        },
        {
            title: 'Cocina (KDS)',
            icon: 'restaurant-outline',
            color: 'tertiary',
            route: '/kds',
            description: 'Pantalla de cocina'
        },
        {
            title: 'Historial de Ventas',
            icon: 'cash-outline',
            color: 'success',
            route: '/sales-history',
            description: 'Reporte de ventas y órdenes'
        },
        {
            title: 'Usuarios',
            icon: 'people-outline',
            color: 'warning',
            route: '/users',
            description: 'Gestionar personal'
        },
        {
            title: 'Reportes',
            icon: 'stats-chart-outline',
            color: 'warning',
            route: '/reports',
            description: 'Ventas y estadísticas'
        },
        {
            title: 'Configuración',
            icon: 'settings-outline',
            color: 'medium',
            route: '/settings',
            description: 'Ajustes del sistema'
        },
        {
            title: 'Impresora',
            icon: 'print-outline',
            color: 'dark',
            route: '/printer-config',
            description: 'Configurar impresora térmica'
        }
    ];

    constructor(
        private authService: AuthService,
        private syncService: SyncService,
        private router: Router,
        private platform: Platform,
        private alertController: AlertController,
        private toastController: ToastController
    ) {
        addIcons({
            logOutOutline,
            pricetagOutline,
            peopleOutline,
            restaurantOutline,
            gridOutline,
            statsChartOutline,
            settingsOutline,
            bagAddOutline,
            optionsOutline,
            cashOutline,
            printOutline,
            cloudUploadOutline,
            cloudDoneOutline,
            cloudOfflineOutline,
            refreshOutline
        });
    }

    ngOnInit() {
        // Registrar listener para el botón de atrás del hardware con alta prioridad
        this.platform.backButton.subscribeWithPriority(10, () => {
            // En el menú admin, el botón de atrás no hace nada (evita salir de la app)
            // El usuario debe usar el botón de Salir explícitamente
            // No se ejecuta el comportamiento por defecto
        });

        // Actualizar estado de sincronización
        this.updateSyncStatus();
        
        // Verificar estado cada 10 segundos
        setInterval(() => {
            this.updateSyncStatus();
        }, 10000);
    }

    async updateSyncStatus() {
        this.isOnline = await this.syncService.checkConnection();
        const status = this.syncService.getSyncStatus();
        this.lastSyncTime = status.lastSync;
        this.pendingItems = status.pendingItems;
    }

    async manualSync() {
        if (this.isSyncing) return;
        
        this.isSyncing = true;
        
        try {
            const result = await this.syncService.manualSync();
            
            if (result.success) {
                this.updateSyncStatus();
                
                const alert = await this.alertController.create({
                    header: '✅ Sincronización exitosa',
                    message: result.message,
                    buttons: ['OK']
                });
                
                await alert.present();
            } else {
                const alert = await this.alertController.create({
                    header: '❌ Error',
                    message: result.message,
                    buttons: ['OK']
                });
                
                await alert.present();
            }
        } catch (error) {
            console.error('Error en sincronización:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    async showSyncInfo() {
        const statusIcon = this.isOnline ? '🟢' : '🔴';
        const statusText = this.isOnline ? 'Conectado' : 'Sin conexión';
        const lastSync = this.lastSyncTime ? this.formatDate(this.lastSyncTime) : 'Nunca';
        
        const alert = await this.alertController.create({
            header: 'Estado de Sincronización',
            subHeader: `${statusIcon} ${statusText}`,
            message: `Última sincronización: ${lastSync}\nPendientes: ${this.pendingItems} items`,
            buttons: ['OK']
        });
        
        await alert.present();
    }

    formatDate(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Hace un momento';
        if (minutes < 60) return `Hace ${minutes} min`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours} horas`;
        
        return new Date(date).toLocaleDateString();
    }

    ngOnDestroy() {
        // No necesitamos limpiar explícitamente, Angular lo hace automáticamente
    }

    navigateTo(route: string) {
        this.router.navigate([route]);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
