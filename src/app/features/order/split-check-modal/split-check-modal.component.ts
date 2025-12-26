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
  IonGrid,
  IonRow,
  IonCol,
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, addOutline, cardOutline, checkmarkOutline, trashOutline, swapHorizontalOutline, arrowForwardOutline } from 'ionicons/icons';
import { OrderService, Order } from '../../../core/services/order.service';
import { TableService } from '../../../core/services/table.service';

interface OrderWithItems extends Order {
  items: any[];
  total: number;
}

interface DraggedItem {
  item: any;
  sourceOrderId: string;
}

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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class SplitCheckModalComponent implements OnInit {
  @Input() tableId!: number;
  @Input() tableName!: string;
  @Input() selectedOrderId?: string;
  @Input() expandAll: boolean = false;
  
  ordersWithItems: OrderWithItems[] = [];
  draggedItem: DraggedItem | null = null;
  isDragMode: boolean = false;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private orderService: OrderService,
    private tableService: TableService
  ) {
    addIcons({ closeOutline, addOutline, cardOutline, checkmarkOutline, trashOutline, swapHorizontalOutline, arrowForwardOutline });
  }

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    const orders = await this.orderService.getOrdersByTable(this.tableId);
    
    this.ordersWithItems = [];
    for (const order of orders) {
      const items = await this.orderService.getOrderItems(order.id_local);
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      this.ordersWithItems.push({
        ...order,
        items: items,
        total: total
      });
    }
  }

  async toggleDragMode() {
    this.isDragMode = !this.isDragMode;
    if (!this.isDragMode) {
      this.draggedItem = null;
    } else {
      // Al activar modo drag, crear cuenta vacía si solo hay una cuenta
      if (this.ordersWithItems.length === 1) {
        await this.createNewCheckSilent();
      }
    }
  }

  onDragStart(event: DragEvent, item: any, orderId: string) {
    if (!this.isDragMode) return;
    
    this.draggedItem = { item, sourceOrderId: orderId };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ item, sourceOrderId: orderId }));
    }
  }

  onDragOver(event: DragEvent) {
    if (!this.isDragMode || !this.draggedItem) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  async onDrop(event: DragEvent, targetOrderId: string) {
    if (!this.isDragMode || !this.draggedItem) return;
    
    event.preventDefault();
    
    const sourceOrderId = this.draggedItem.sourceOrderId;
    const item = this.draggedItem.item;
    
    // Verificar que la cuenta destino permita recibir items (no PAYING ni CLOSED)
    const targetOrder = this.ordersWithItems.find(o => o.id_local === targetOrderId);
    if (targetOrder && (targetOrder.status === 'PAYING' || targetOrder.status === 'CLOSED')) {
      this.showToast('No puedes agregar items a una cuenta en proceso de pago o cerrada', 'warning');
      return;
    }
    
    // No permitir mover a la misma orden
    if (sourceOrderId === targetOrderId) {
      this.showToast('No puedes mover un item a la misma cuenta', 'warning');
      return;
    }
    
    // Confirmar movimiento
    const alert = await this.alertController.create({
      header: 'Mover Item',
      message: `¿Mover "${item.product_name}" a otra cuenta?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Mover',
          handler: async () => {
            await this.moveItem(sourceOrderId, targetOrderId, item);
          }
        }
      ]
    });
    
    await alert.present();
    this.draggedItem = null;
  }

  async moveItem(sourceOrderId: string, targetOrderId: string, item: any) {
    try {
      // Remover del source
      const sourceOrder = this.ordersWithItems.find(o => o.id_local === sourceOrderId);
      if (sourceOrder) {
        sourceOrder.items = sourceOrder.items.filter(i => i.id_local !== item.id_local);
        sourceOrder.total = sourceOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      }
      
      // Agregar al target
      const targetOrder = this.ordersWithItems.find(o => o.id_local === targetOrderId);
      if (targetOrder) {
        targetOrder.items.push(item);
        targetOrder.total = targetOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      }
      
      // Actualizar en base de datos
      await this.updateOrderInDatabase(sourceOrder!);
      await this.updateOrderInDatabase(targetOrder!);
      
      // Si las órdenes estaban enviadas, actualizar timestamp para notificar cocina
      if (sourceOrder?.status === 'SENT') {
        await this.orderService.updateOrderStatus(sourceOrder.id_local, 'SENT');
      }
      if (targetOrder?.status === 'SENT') {
        await this.orderService.updateOrderStatus(targetOrder.id_local, 'SENT');
      }
      
      // Eliminar cuenta origen si quedó vacía (solo si hay más de una cuenta)
      if (sourceOrder && sourceOrder.items.length === 0 && this.ordersWithItems.length > 1) {
        await this.deleteEmptyOrder(sourceOrder.id_local);
      }
      
      this.showToast('Item movido exitosamente', 'success');
    } catch (error) {
      console.error('Error moviendo item:', error);
      this.showToast('Error al mover item', 'danger');
      await this.loadOrders(); // Recargar en caso de error
    }
  }

  async updateOrderInDatabase(order: OrderWithItems) {
    // Convertir items a formato esperado por updateOrder
    const itemsData = order.items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes,
      modifiers: item.modifiers || []
    }));
    
    await this.orderService.updateOrder(order.id_local, itemsData);
  }

  async createNewCheckSilent() {
    // Crear cuenta vacía sin confirmación (para modo drag)
    try {
      const deviceId = localStorage.getItem('device_id') || 'unknown';
      const newOrderId = await this.orderService.createOrder(this.tableId, deviceId, []);
      await this.tableService.assignOrderToTable(this.tableId, newOrderId, deviceId);
      await this.loadOrders();
      this.showToast('Cuenta vacía creada. Arrastra items aquí', 'success');
    } catch (error) {
      console.error('Error creando cuenta:', error);
      this.showToast('Error al crear cuenta', 'danger');
    }
  }

  async createNewCheck() {
    const alert = await this.alertController.create({
      header: 'Nueva Cuenta',
      message: '¿Crear una nueva cuenta para esta mesa?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: async () => {
            await this.createNewCheckSilent();
          }
        }
      ]
    });
    await alert.present();
  }

  editOrder(order: OrderWithItems) {
    this.modalController.dismiss({ action: 'edit', order: order }, 'edit');
  }

  async deleteEmptyOrder(orderId: string) {
    try {
      // Eliminar de la base de datos
      await this.orderService.deleteOrder(orderId);
      // Remover de la lista
      this.ordersWithItems = this.ordersWithItems.filter(o => o.id_local !== orderId);
      await this.updateTableStatus();
      this.showToast('Cuenta vacía eliminada', 'success');
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      this.showToast('Error al eliminar cuenta', 'danger');
    }
  }

  async confirmDeleteOrder(order: OrderWithItems) {
    if (order.items.length > 0) {
      this.showToast('No puedes eliminar una cuenta con items. Muévelos primero.', 'warning');
      return;
    }

    if (this.ordersWithItems.length === 1) {
      this.showToast('No puedes eliminar la única cuenta de la mesa', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: '¿Eliminar esta cuenta vacía?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.deleteEmptyOrder(order.id_local);
          }
        }
      ]
    });
    await alert.present();
  }

  async markAsPaying(order: OrderWithItems) {
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

  async closeOrder(order: OrderWithItems) {
    const alert = await this.alertController.create({
      header: 'Cerrar Orden',
      message: `¿Cerrar orden definitivamente? Total: Q${order.total.toFixed(2)}`,
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

  async updateTableStatus() {
    const activeOrders = this.ordersWithItems.filter(order => order.status !== 'CLOSED');
    
    if (activeOrders.length === 0) {
      await this.tableService.releaseTable(this.tableId);
    } else {
      const hasPayingOrder = activeOrders.some(order => order.status === 'PAYING');
      
      if (hasPayingOrder) {
        await this.tableService.setTablePaying(this.tableId);
      } else {
        await this.tableService.updateTableStatus(this.tableId, 'OCCUPIED');
      }
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  close() {
    this.modalController.dismiss(null, 'cancel');
  }
}
