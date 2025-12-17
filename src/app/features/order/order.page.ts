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
  ModalController,
  AlertController,
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
    IonFab,
    IonFabButton,
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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private tableService: TableService,
    private orderService: OrderService,
    private modalController: ModalController,
    private alertController: AlertController,
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

  async ngOnInit() {
    // Obtener ID de mesa de la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tableId = parseInt(id);
      await this.loadTable();
      await this.loadProducts();
      await this.loadCategories();
    }

    // Manejar botón de atrás
    this.platform.backButton.subscribeWithPriority(10, () => {
      this.goBack();
    });
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

    // Mostrar modal de upselling antes de enviar
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

      // Guardar orden en base de datos con todos sus items
      const orderId = await this.orderService.createOrder(
        this.tableId,
        deviceId,
        orderItemsData
      );

      // Actualizar estado de mesa a OCCUPIED
      await this.tableService.assignOrderToTable(this.tableId, orderId, deviceId);

      const alert = await this.alertController.create({
        header: 'Orden enviada',
        message: 'La orden ha sido enviada a cocina correctamente.',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.goBack();
          }
        }]
      });
      await alert.present();
    } catch (error) {
      console.error('Error al enviar orden:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo enviar la orden. Intenta de nuevo.',
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
