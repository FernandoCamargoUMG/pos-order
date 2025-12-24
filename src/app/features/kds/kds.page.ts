import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonList,
    Platform,
    AlertController,
    ToastController
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { TableService } from '../../core/services/table.service';
import { addIcons } from 'ionicons';
import { 
    logOutOutline, 
    pricetagOutline, 
    arrowBackOutline,
    timeOutline,
    checkmarkCircleOutline,
    alertCircleOutline,
    restaurantOutline,
    listOutline,
    refreshOutline,
    eyeOutline,
    arrowUndoOutline,
    closeOutline,
    documentTextOutline
} from 'ionicons/icons';
import { App } from '@capacitor/app';
import { interval, Subscription } from 'rxjs';

interface KitchenOrder {
    id_local: string;
    table_id: number;
    table_name: string;
    status: string;
    items: any[];
    created_at: string;
    sent_at: string;
    elapsed_minutes: number;
    priority: 'normal' | 'warning' | 'critical';
    kitchen_status?: 'pending' | 'preparing' | 'ready';
}

@Component({
    selector: 'app-kds',
    templateUrl: './kds.page.html',
    styleUrls: ['./kds.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonButton,
        IonButtons,
        IonIcon,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonBadge,
        IonRefresher,
        IonRefresherContent,
        IonGrid,
        IonRow,
        IonCol,
        IonItem,
        IonList
    ]
})
export class KdsPage implements OnInit, OnDestroy {
    isAdmin = false;
    selectedView: 'all' | 'pending' | 'preparing' | 'history' = 'all';
    orders: KitchenOrder[] = [];
    filteredOrders: KitchenOrder[] = [];
    finishedOrders: KitchenOrder[] = [];
    
    private refreshSubscription?: Subscription;
    private audioContext?: AudioContext;
    private lastOrderCount = 0;

    constructor(
        private authService: AuthService,
        private orderService: OrderService,
        private tableService: TableService,
        private router: Router,
        private platform: Platform,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController
    ) {
        addIcons({ 
            logOutOutline, 
            pricetagOutline, 
            arrowBackOutline,
            timeOutline,
            checkmarkCircleOutline,
            alertCircleOutline,
            restaurantOutline,
            listOutline,
            refreshOutline,
            eyeOutline,
            arrowUndoOutline,
            closeOutline,
            documentTextOutline
        });

        this.authService.currentUser$.subscribe(user => {
            this.isAdmin = user?.role?.name === 'ADMINISTRADOR';
        });
    }

    async ngOnInit() {
        await this.loadOrders();
        
        // Auto-refresh cada 10 segundos
        this.refreshSubscription = interval(10000).subscribe(() => {
            this.loadOrders(true);
        });

        this.platform.backButton.subscribeWithPriority(10, () => {
            if (this.isAdmin) {
                this.router.navigate(['/admin-menu']);
            }
        });
    }

    ngOnDestroy() {
        this.refreshSubscription?.unsubscribe();
    }

    async loadOrders(silent: boolean = false) {
        try {
            // Cargar órdenes con status SENT
            const sentOrders = await this.orderService.getOrdersByStatus('SENT');
            
            // Procesar órdenes para KDS
            const processedOrders: KitchenOrder[] = [];
            
            for (const order of sentOrders) {
                const table = await this.tableService.getTableById(order.table_id);
                const items = await this.orderService.getOrderItems(order.id_local);
                
                const sentAt = new Date(order.updated_at || order.created_at);
                const now = new Date();
                const elapsedMinutes = Math.floor((now.getTime() - sentAt.getTime()) / 60000);
                
                // Determinar prioridad según tiempo transcurrido
                let priority: 'normal' | 'warning' | 'critical' = 'normal';
                if (elapsedMinutes > 20) {
                    priority = 'critical';
                } else if (elapsedMinutes > 10) {
                    priority = 'warning';
                }
                
                processedOrders.push({
                    id_local: order.id_local,
                    table_id: order.table_id,
                    table_name: table?.name || `Mesa ${order.table_id}`,
                    status: order.status,
                    items: items,
                    created_at: order.created_at,
                    sent_at: order.updated_at || order.created_at,
                    elapsed_minutes: elapsedMinutes,
                    priority: priority,
                    kitchen_status: order.kitchen_status || 'pending'
                });
            }
            
            // Detectar nuevas órdenes y reproducir sonido
            if (!silent && processedOrders.length > this.lastOrderCount) {
                this.playNotificationSound();
                this.showNewOrderToast();
            }
            
            this.lastOrderCount = processedOrders.length;
            this.orders = processedOrders.sort((a, b) => a.elapsed_minutes - b.elapsed_minutes);
            this.filterOrders();
            
        } catch (error) {
            console.error('Error cargando órdenes:', error);
        }
    }

    filterOrders() {
        if (this.selectedView === 'history') {
            // El historial se muestra directamente con finishedOrders
            this.filteredOrders = [];
        } else if (this.selectedView === 'all') {
            this.filteredOrders = this.orders;
        } else if (this.selectedView === 'pending') {
            this.filteredOrders = this.orders.filter(o => o.kitchen_status === 'pending');
        } else if (this.selectedView === 'preparing') {
            this.filteredOrders = this.orders.filter(o => o.kitchen_status === 'preparing');
        }
    }

    onViewChange(event: any) {
        this.selectedView = event.detail.value;
        this.filterOrders();
    }

    async onRefresh(event: any) {
        await this.loadOrders();
        event.target.complete();
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'normal':
                return 'light';
            case 'warning':
                return 'warning';
            case 'critical':
                return 'danger';
            default:
                return 'medium';
        }
    }

    getPriorityClass(priority: string): string {
        return `priority-${priority}`;
    }

    getKitchenStatusText(status?: string): string {
        switch (status) {
            case 'pending':
                return 'Pendiente';
            case 'preparing':
                return 'En Preparación';
            case 'ready':
                return 'Listo';
            default:
                return 'Pendiente';
        }
    }

    async markAsPreparing(order: KitchenOrder) {
        try {
            // Actualizar estado en la orden (usar campo personalizado)
            await this.orderService.updateOrderKitchenStatus(order.id_local, 'preparing');
            order.kitchen_status = 'preparing';
            this.filterOrders();
            
            const toast = await this.toastCtrl.create({
                message: `${order.table_name} marcada como "En Preparación"`,
                duration: 2000,
                color: 'warning',
                position: 'top'
            });
            await toast.present();
        } catch (error) {
            console.error('Error marcando como preparando:', error);
        }
    }

    async markAsReady(order: KitchenOrder) {
        const alert = await this.alertCtrl.create({
            header: 'Orden Lista',
            message: `¿Confirmar que la orden de ${order.table_name} está lista?`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Confirmar',
                    handler: async () => {
                        try {
                            // Marcar como lista (eliminar de KDS)
                            await this.orderService.updateOrderKitchenStatus(order.id_local, 'ready');
                            
                            // Mover a historial
                            this.finishedOrders.unshift(order);
                            
                            // Remover de la lista activa
                            this.orders = this.orders.filter(o => o.id_local !== order.id_local);
                            this.filterOrders();
                            
                            const toast = await this.toastCtrl.create({
                                message: `Orden de ${order.table_name} completada ✓`,
                                duration: 3000,
                                color: 'success',
                                position: 'top'
                            });
                            await toast.present();
                        } catch (error) {
                            console.error('Error marcando como lista:', error);
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    async recoverOrder(order: KitchenOrder) {
        const alert = await this.alertCtrl.create({
            header: 'Recuperar Orden',
            message: `¿Recuperar la orden de ${order.table_name}?`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Recuperar',
                    handler: async () => {
                        try {
                            // Restaurar a estado "pending"
                            await this.orderService.updateOrderKitchenStatus(order.id_local, 'pending');
                            order.kitchen_status = 'pending';
                            
                            // Mover de vuelta a la lista activa
                            this.finishedOrders = this.finishedOrders.filter(o => o.id_local !== order.id_local);
                            this.orders.push(order);
                            this.filterOrders();
                            
                            const toast = await this.toastCtrl.create({
                                message: `Orden de ${order.table_name} recuperada`,
                                duration: 2000,
                                color: 'primary',
                                position: 'top'
                            });
                            await toast.present();
                        } catch (error) {
                            console.error('Error recuperando orden:', error);
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    getPendingCount(): number {
        return this.orders.filter(o => o.kitchen_status === 'pending').length;
    }

    getPreparingCount(): number {
        return this.orders.filter(o => o.kitchen_status === 'preparing').length;
    }

    playNotificationSound() {
        try {
            // Crear AudioContext si no existe
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800; // Frecuencia del "ping"
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error reproduciendo sonido:', error);
        }
    }

    async showNewOrderToast() {
        const toast = await this.toastCtrl.create({
            message: '🔔 Nueva orden recibida',
            duration: 3000,
            color: 'primary',
            position: 'top',
            cssClass: 'new-order-toast'
        });
        await toast.present();
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/login']);
    }
}
