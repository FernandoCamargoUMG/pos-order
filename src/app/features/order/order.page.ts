import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonFab,
  IonFabButton,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToast,
  ModalController,
  AlertController,
  ToastController,
  Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { OrderService } from '../../core/services/order.service';
import {
  arrowBackOutline,
  addOutline,
  removeOutline,
  trashOutline,
  sendOutline,
  searchOutline,
  cartOutline,
  closeOutline,
  fastFoodOutline,
  addCircleOutline,
  removeCircleOutline,
  alertCircleOutline,
  documentTextOutline
} from 'ionicons/icons';
import { ProductService } from '../../core/services/product.service';
import { TableService } from '../../core/services/table.service';
import { Product, Table } from '../../core/models';
import { ProductModifiersModalComponent } from './product-modifiers-modal/product-modifiers-modal.component';
import { UpsellingModalComponent } from './upselling-modal/upselling-modal.component';
import { SplitCheckModalComponent } from './split-check-modal/split-check-modal.component';

interface OrderItem {
  product: Product;
  quantity: number;
  modifiers: string[];
  notes?: string;
}

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class OrderPage implements OnInit, OnDestroy {
  tableId: number = 0;
  table: Table | null = null;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';
  searchTerm: string = '';
  orderItems: OrderItem[] = [];
  
  // Para gestión de cuentas
  showAccountsView: boolean = false;
  existingOrders: any[] = [];
  editingOrderId: string | null = null; // ID de la orden que se está editando
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private tableService: TableService,
    private orderService: OrderService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private platform: Platform
  ) {
    addIcons({
      arrowBackOutline,
      addOutline,
      removeOutline,
      trashOutline,
      sendOutline,
      searchOutline,
      cartOutline,
      closeOutline,
      fastFoodOutline,
      addCircleOutline,
      removeCircleOutline,
      alertCircleOutline,
      documentTextOutline
    });
  }

  async openSplitCheck() {
    const modal = await this.modalController.create({
      component: SplitCheckModalComponent,
      componentProps: {
        tableId: this.tableId,
        tableName: this.table?.name || `Mesa ${this.tableId}`
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'new-check') {
      // Usuario quiere crear nueva cuenta - limpiar orden actual
      this.orderItems = [];
    }
  }

  async ngOnInit() {
    // Obtener ID de mesa de la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tableId = parseInt(id);
      await this.loadTable();
      await this.loadProducts();
      await this.loadCategories();
      
      // Si la mesa está ocupada o pagando, mostrar vista de cuentas primero
      if (this.table?.status === 'OCCUPIED' || this.table?.status === 'PAYING') {
        await this.loadExistingOrders();
        this.showAccountsView = true;
      }
    }

    // Manejar botón de atrás
    this.platform.backButton.subscribeWithPriority(10, () => {
      this.goBack();
    });
  }

  async loadExistingOrders() {
    this.existingOrders = await this.orderService.getOrdersByTable(this.tableId);
    
    // Cargar items de cada orden
    for (const order of this.existingOrders) {
      const items = await this.orderService.getOrderItems(order.id_local);
      order.items = items;
      order.total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    }
  }

  startNewAccount() {
    // Crear nueva cuenta: limpiar items y mostrar productos
    this.showAccountsView = false;
    this.orderItems = [];
  }

  async continueOrdering() {
    // Ver productos ordenados: abrir modal con todas las cuentas
    const modal = await this.modalController.create({
      component: SplitCheckModalComponent,
      componentProps: {
        tableId: this.tableId,
        tableName: this.table?.name || `Mesa ${this.tableId}`,
        expandAll: true // Expandir todas las cuentas automáticamente
      }
    });

    await modal.present();
    
    const { data, role } = await modal.onWillDismiss();
    
    // Si seleccionaron editar una orden, cargarla
    if (role === 'edit' && data?.order) {
      await this.loadOrderForEditing(data.order);
    }
    
    // Recargar órdenes después de cerrar el modal
    await this.loadExistingOrders();
  }

  async viewAccount(order: any) {
    // Abrir modal de detalle de cuenta con SplitCheckModal
    const modal = await this.modalController.create({
      component: SplitCheckModalComponent,
      componentProps: {
        tableId: this.tableId,
        tableName: this.table?.name || `Mesa ${this.tableId}`,
        selectedOrderId: order.id_local // Para mostrar esta cuenta expandida
      }
    });

    await modal.present();
    
    const { data, role } = await modal.onWillDismiss();
    
    // Si seleccionaron editar una orden, cargarla
    if (role === 'edit' && data?.order) {
      await this.loadOrderForEditing(data.order);
    }
    
    // Recargar órdenes después de cerrar el modal
    await this.loadExistingOrders();
  }

  async loadOrderForEditing(order: any) {
    // Cargar items de la orden para editar
    this.editingOrderId = order.id_local;
    this.showAccountsView = false;
    
    // Cargar items de la orden
    const items = await this.orderService.getOrderItems(order.id_local);
    
    // Convertir items de BD a formato del carrito (con objeto product completo)
    this.orderItems = await Promise.all(items.map(async (item: any) => {
      // Buscar el producto para tener el objeto completo
      const product = this.products.find(p => p.id_local === item.product_id);
      
      return {
        product: product || {
          id_local: item.product_id,
          name: item.product_name,
          price: item.price,
          category: '',
          available: true
        } as Product,
        quantity: item.quantity,
        notes: item.notes || '',
        modifiers: item.modifiers || []
      };
    }));

    // Mostrar toast informativo
    const toast = await this.toastController.create({
      message: `Editando orden #${order.id_local.slice(-6)}. Puedes agregar/eliminar items.`,
      duration: 3000,
      position: 'top',
      color: 'primary'
    });
    await toast.present();
  }

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'SENT': return 'Enviada a cocina';
      case 'PAYING': return 'Pagando';
      case 'CLOSED': return 'Cerrada';
      default: return status;
    }
  }

  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'SENT': return 'primary';
      case 'PAYING': return 'warning';
      case 'CLOSED': return 'success';
      default: return 'medium';
    }
  }

  ngOnDestroy() {
    // Cleanup automático por Angular
  }

  async loadTable() {
    this.table = await this.tableService.getTableById(this.tableId);
  }

  async loadProducts() {
    this.products = await this.productService.getAllProducts();
    this.filterProducts();
  }

  async loadCategories() {
    this.categories = await this.productService.getCategories();
  }

  filterProducts() {
    let filtered = this.products;

    // Filtrar por categoría
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term)
      );
    }

    this.filteredProducts = filtered;
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.detail.value;
    this.filterProducts();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.filterProducts();
  }

  async onProductClick(product: Product) {
    // Abrir modal de modificadores
    const modal = await this.modalController.create({
      component: ProductModifiersModalComponent,
      componentProps: {
        product
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.addToOrder(product, data.modifiers || [], data.notes || '');
    }
  }

  addToOrder(product: Product, modifiers: string[] = [], notes: string = '') {
    const existingItem = this.orderItems.find(
      item => item.product.id_local === product.id_local && 
              JSON.stringify(item.modifiers) === JSON.stringify(modifiers) &&
              item.notes === notes
    );

    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.orderItems.push({
        product,
        quantity: 1,
        modifiers,
        notes
      });
    }
  }

  removeFromOrder(index: number) {
    this.orderItems.splice(index, 1);
  }

  increaseQuantity(item: OrderItem) {
    item.quantity++;
  }

  decreaseQuantity(item: OrderItem) {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  getTotal(): number {
    return this.orderItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }

  getItemsCount(): number {
    return this.orderItems.reduce((count, item) => count + item.quantity, 0);
  }

  async sendOrder() {
    if (this.orderItems.length === 0) {
      const alert = await this.alertController.create({
        header: 'Orden vacía',
        message: 'Agrega productos antes de enviar la orden.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Mostrar modal de upselling antes de enviar (solo si NO estamos editando)
    if (!this.editingOrderId) {
      const upsellingModal = await this.modalController.create({
        component: UpsellingModalComponent,
        componentProps: {
          orderTotal: this.getTotal()
        }
      });

      await upsellingModal.present();

      const { data, role } = await upsellingModal.onWillDismiss();

      // Si canceló, no enviar la orden
      if (role === 'cancel') {
        return;
      }

      // Si seleccionó una opción de upselling, agregarla a la orden
      if (role === 'selected' && data?.selected && data?.option) {
        // TODO: Agregar el producto de upselling a la orden
        console.log('Upselling seleccionado:', data.option);
        // Por ahora solo continuar con el envío
      }
    }

    // Proceder a enviar la orden (solo si confirmó o seleccionó algo)
    try {
      // Generar ID de dispositivo (TODO: obtener del storage/settings)
      const deviceId = 'DEVICE-001';

      // Preparar items para guardar en BD
      const orderItemsData = this.orderItems.map(item => ({
        productId: item.product.id_local,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        notes: item.notes,
        modifiers: item.modifiers
      }));

      let orderId: string;
      let isUpdate = false;

      // Si estamos editando, actualizar; si no, crear nueva
      if (this.editingOrderId) {
        await this.orderService.updateOrder(this.editingOrderId, orderItemsData);
        orderId = this.editingOrderId;
        isUpdate = true;
      } else {
        // Guardar orden en base de datos con todos sus items
        orderId = await this.orderService.createOrder(
          this.tableId,
          deviceId,
          orderItemsData
        );

        // Actualizar estado de mesa a OCCUPIED
        await this.tableService.assignOrderToTable(this.tableId, orderId, deviceId);
      }

      // IMPORTANTE: Marcar orden como SENT para que cocina la vea en KDS
      // Esto actualiza el status y el campo updated_at con la hora actual
      await this.orderService.updateOrderStatus(orderId, 'SENT');

      const alert = await this.alertController.create({
        header: isUpdate ? 'Orden actualizada' : 'Orden enviada',
        message: isUpdate ? 'La orden ha sido actualizada correctamente.' : 'La orden ha sido enviada a cocina correctamente.',
        buttons: [{
          text: 'OK',
          handler: () => {
            // Limpiar edición y volver
            this.editingOrderId = null;
            this.orderItems = [];
            if (!this.showAccountsView) {
              this.goBack();
            } else {
              // Recargar vista de cuentas
              this.loadExistingOrders();
            }
          }
        }]
      });
      await alert.present();
    } catch (error) {
      console.error('Error al enviar/actualizar orden:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: this.editingOrderId ? 'No se pudo actualizar la orden. Intenta de nuevo.' : 'No se pudo enviar la orden. Intenta de nuevo.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async clearOrder() {
    const alert = await this.alertController.create({
      header: 'Limpiar orden',
      message: '¿Estás seguro de que deseas limpiar la orden?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpiar',
          role: 'destructive',
          handler: () => {
            this.orderItems = [];
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/tables']);
  }
}
