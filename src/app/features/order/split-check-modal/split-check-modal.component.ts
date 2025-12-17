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
  
  orders: Order[] = [];
  orderItems: Map<string, any[]> = new Map();
  orderTotals: Map<string, number> = new Map();
  expandedOrderId: string | null = null; // Para expandir/colapsar detalles

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private orderService: OrderService
  ) {
    addIcons({ closeOutline, addOutline, cardOutline, checkmarkOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadOrders();
    
    // Si se especificó una orden, expandirla automáticamente
    if (this.selectedOrderId) {
      this.expandedOrderId = this.selectedOrderId;
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
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  isExpanded(orderId: string): boolean {
    return this.expandedOrderId === orderId;
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
            await this.loadOrders();
          }
        }
      ]
    });
    await alert.present();
  }

  close() {
    this.modalController.dismiss(null, 'cancel');
  }
}
