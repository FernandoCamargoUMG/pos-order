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
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  Platform,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TableService } from '../../core/services/table.service';
import { OrderService } from '../../core/services/order.service';
import { Table } from '../../core/models';
import { addIcons } from 'ionicons';
import { logOutOutline, pricetagOutline, arrowBackOutline, restaurantOutline, addOutline, timeOutline, receiptOutline, createOutline, trashOutline } from 'ionicons/icons';
import { App } from '@capacitor/app';
import { TableFormModalComponent } from './table-form-modal/table-form-modal.component';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.page.html',
  styleUrls: ['./tables.page.scss'],
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
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge
  ]
})
export class TablesPage implements OnInit, OnDestroy {
  isAdmin = false;
  selectedLevel: number = 1;
  tables: Table[] = [];
  filteredTables: Table[] = [];
  tableOrderCounts: Map<number, number> = new Map(); // Mapa de table_id -> cantidad de órdenes

  constructor(
    private authService: AuthService,
    private tableService: TableService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private orderService: OrderService,
    private router: Router,
    private platform: Platform
  ) {
    addIcons({ logOutOutline, pricetagOutline, arrowBackOutline, restaurantOutline, addOutline, timeOutline, receiptOutline, createOutline, trashOutline });
    
    // Verificar si el usuario es administrador
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role?.name === 'ADMINISTRADOR';
    });
  }

  async ngOnInit() {
    await this.loadTables();
    
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.isAdmin) {
        this.router.navigate(['/admin-menu']);
      }
    });
  }

  async ionViewWillEnter() {
    await this.loadTables();
  }

  async loadTables() {
    this.tables = await this.tableService.getAllTables();
    
    // Actualizar estados de mesa basándose en órdenes activas
    for (const table of this.tables) {
      // Obtener órdenes activas (no CLOSED)
      const orders = await this.orderService.getOrdersByTable(table.id);
      const activeOrders = orders.filter(order => order.status !== 'CLOSED');
      this.tableOrderCounts.set(table.id, activeOrders.length);
      
      // Actualizar estado de mesa según órdenes activas
      if (activeOrders.length === 0) {
        // Sin órdenes activas → FREE
        if (table.status !== 'FREE') {
          await this.tableService.releaseTable(table.id);
          table.status = 'FREE';
        }
      } else {
        // Verificar si alguna orden está en PAYING
        const hasPayingOrder = activeOrders.some(order => order.status === 'PAYING');
        
        if (hasPayingOrder && table.status !== 'PAYING') {
          await this.tableService.setTablePaying(table.id);
          table.status = 'PAYING';
        } else if (!hasPayingOrder && table.status !== 'OCCUPIED') {
          await this.tableService.updateTableStatus(table.id, 'OCCUPIED');
          table.status = 'OCCUPIED';
        }
      }
    }
    
    this.filterTablesByLevel();
  }

  filterTablesByLevel() {
    const level = Number(this.selectedLevel);
    console.log('🔍 Filtrando - Nivel:', level, '| Total mesas:', this.tables.length);
    this.filteredTables = this.tables.filter(table => {
      const match = table.level_id === level;
      console.log(`Mesa ${table.name}: level_id=${table.level_id} === ${level}? ${match}`);
      return match;
    });
    console.log('✅ Resultado filtrado:', this.filteredTables.length, 'mesas');
  }

  onLevelChange(event: any) {
    this.selectedLevel = Number(event.detail.value);
    console.log('📍 Cambio de nivel a:', this.selectedLevel);
    this.filterTablesByLevel();
  }

  getTableColor(table: Table): string {
    return this.tableService.getTableStatusColor(table.status || 'FREE');
  }

  getTableStatusText(table: Table): string {
    return this.tableService.getTableStatusText(table.status || 'FREE');
  }

  getOrderCount(tableId: number): number {
    return this.tableOrderCounts.get(tableId) || 0;
  }

  async openTableForm(table?: Table) {
    const modal = await this.modalCtrl.create({
      component: TableFormModalComponent,
      componentProps: { table }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    
    if (data?.saved) {
      await this.loadTables();
    }
  }

  async deleteTable(table: Table) {
    if (table.status !== 'FREE') {
      const alert = await this.alertCtrl.create({
        header: 'No se puede eliminar',
        message: 'Solo se pueden eliminar mesas libres.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar "${table.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.tableService.deleteTable(table.id);
            await this.loadTables();
          }
        }
      ]
    });
    await alert.present();
  }

  async onTableClick(table: Table) {
    if (table.status === 'FREE') {
      // Crear nueva orden para mesa libre
      this.router.navigate(['/order', table.id]);
    } else if (table.status === 'OCCUPIED') {
      // Continuar orden existente
      this.router.navigate(['/order', table.id]);
    } else if (table.status === 'PAYING') {
      // Permitir entrar para ver cuentas y cerrarlas
      this.router.navigate(['/order', table.id]);
    }
  }

  ngOnDestroy() {
    // No necesitamos limpiar explícitamente, Angular lo hace automáticamente
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
