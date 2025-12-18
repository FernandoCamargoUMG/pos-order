import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonFooter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, addOutline, cardOutline, checkmarkOutline, trashOutline } from 'ionicons/icons';
import { OrderService, Order } from '../../../core/services/order.service';
import { TableService } from '../../../core/services/table.service';

@Component({
  selector: 'app-split-check-modal',
  templateUrl: './split-check-modal.component.html',
  styleUrls: ['./split-check-modal.component.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class SplitCheckModalComponent implements OnInit {
  @Input() tableId!: number;
  @Input() tableName!: string;
  @Input() selectedOrderId?: string; // Para mostrar una cuenta específica expandida
  @Input() expandAll: boolean = false; // Para expandir todas las cuentas
  
  orders: Order[] = [];
  orderItems: Map<string, any[]> = new Map();
  orderTotals: Map<string, number> = new Map();
  expandedOrderIds: Set<string> = new Set(); // Para expandir/colapsar múltiples cuentas

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private orderService: OrderService,
    private tableService: TableService
  ) {
    addIcons({ closeOutline, addOutline, cardOutline, checkmarkOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadOrders();
    
    // Si se especificó expandir todas, expandir todas las órdenes
    if (this.expandAll) {
      this.orders.forEach(order => {
        this.expandedOrderIds.add(order.id_local);
      });
    }
    // Si se especificó una orden, expandirla automáticamente
    else if (this.selectedOrderId) {
      this.expandedOrderIds.add(this.selectedOrderId);
    }
  }

  async loadOrders() {
    // Cargar todas las órdenes activas de la mesa
    this.orders = await this.orderService.getOrdersByTable(this.tableId);
    
    // Cargar items de cada orden
    for (const order of this.orders) {
      const items = await this.orderService.getOrderItems(order.id_local);
      this.orderItems.set(order.id_local, items);
      
      // Calcular total de cada orden
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      this.orderTotals.set(order.id_local, total);
    }
  }

  getOrderItems(orderId: string): any[] {
    return this.orderItems.get(orderId) || [];
  }

  toggleOrderDetails(orderId: string) {
    if (this.expandedOrderIds.has(orderId)) {
      this.expandedOrderIds.delete(orderId);
    } else {
      this.expandedOrderIds.add(orderId);
    }
  }

  isExpanded(orderId: string): boolean {
    return this.expandedOrderIds.has(orderId);
  }

  getOrderTotal(orderId: string): number {
    return this.orderTotals.get(orderId) || 0;
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'OPEN': return 'medium';
      case 'SENT': return 'primary';
      case 'PAYING': return 'warning';
      case 'CLOSED': return 'success';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'OPEN': return 'Abierta';
      case 'SENT': return 'Enviada';
      case 'PAYING': return 'Pagando';
      case 'CLOSED': return 'Cerrada';
      default: return status;
    }
  }

  async createNewCheck() {
    this.modalController.dismiss({ action: 'new-check' }, 'new-check');
  }

  editOrder(order: Order) {
    // Cerrar modal y pasar la orden a editar
    this.modalController.dismiss({ action: 'edit', order: order }, 'edit');
  }

  async markAsPaying(order: Order) {
    const alert = await this.alertController.create({
      header: 'Cambiar a Pagar',
      message: `¿Marcar orden como "Pagando"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Pagar',
          handler: async () => {
            await this.orderService.updateOrderStatus(order.id_local, 'PAYING');
            await this.updateTableStatus();
            await this.loadOrders();
          }
        }
      ]
    });
    await alert.present();
  }

  async closeOrder(order: Order) {
    const alert = await this.alertController.create({
      header: 'Cerrar Orden',
      message: `¿Cerrar orden definitivamente? Total: Q${this.getOrderTotal(order.id_local).toFixed(2)}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Cerrar',
          handler: async () => {
            await this.orderService.updateOrderStatus(order.id_local, 'CLOSED');
            await this.updateTableStatus();
            await this.loadOrders();
          }
        }
      ]
    });
    await alert.present();
  }

  async updateTableStatus() {
    // Obtener todas las órdenes activas de esta mesa
    const allOrders = await this.orderService.getOrdersByTable(this.tableId);
    const activeOrders = allOrders.filter(order => order.status !== 'CLOSED');
    
    if (activeOrders.length === 0) {
      // Sin órdenes activas → FREE
      await this.tableService.releaseTable(this.tableId);
    } else {
      // Verificar si alguna orden está en PAYING
      const hasPayingOrder = activeOrders.some(order => order.status === 'PAYING');
      
      if (hasPayingOrder) {
        await this.tableService.setTablePaying(this.tableId);
      } else {
        await this.tableService.updateTableStatus(this.tableId, 'OCCUPIED');
      }
    }
  }

  close() {
    this.modalController.dismiss(null, 'cancel');
  }
}
