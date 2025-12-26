import { Component, OnInit } from '@angular/core';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { TableService } from '../../core/services/table.service';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  cashOutline,
  calendarOutline,
  timeOutline,
  receiptOutline,
  statsChartOutline
} from 'ionicons/icons';

interface SalesOrder {
  id_local: string;
  table_id: number;
  table_name: string;
  created_at: string;
  closed_at: string;
  items: any[];
  total: number;
  item_count: number;
}

@Component({
  selector: 'app-sales-history',
  templateUrl: './sales-history.page.html',
  styleUrls: ['./sales-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent
  ]
})
export class SalesHistoryPage implements OnInit {
  orders: SalesOrder[] = [];
  filteredOrders: SalesOrder[] = [];
  selectedPeriod: 'today' | 'week' | 'month' | 'all' = 'today';
  
  totalSales = 0;
  totalOrders = 0;
  totalItems = 0;

  constructor(
    private orderService: OrderService,
    private tableService: TableService,
    private router: Router
  ) {
    addIcons({ 
      arrowBackOutline, 
      cashOutline,
      calendarOutline,
      timeOutline,
      receiptOutline,
      statsChartOutline
    });
  }

  async ngOnInit() {
    await this.loadSalesHistory();
  }

  async loadSalesHistory() {
    try {
      // Obtener órdenes cerradas
      const closedOrders = await this.orderService.getOrdersByStatus('CLOSED');
      
      const processedOrders: SalesOrder[] = [];
      
      for (const order of closedOrders) {
        const table = await this.tableService.getTableById(order.table_id);
        const items = await this.orderService.getOrderItems(order.id_local);
        
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        processedOrders.push({
          id_local: order.id_local,
          table_id: order.table_id,
          table_name: table?.name || `Mesa ${order.table_id}`,
          created_at: order.created_at,
          closed_at: order.updated_at || order.created_at,
          items: items,
          total: total,
          item_count: items.reduce((sum, item) => sum + item.quantity, 0)
        });
      }
      
      // Ordenar por fecha más reciente primero
      this.orders = processedOrders.sort((a, b) => 
        new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime()
      );
      
      this.filterByPeriod();
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  }

  filterByPeriod() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (this.selectedPeriod) {
      case 'today':
        this.filteredOrders = this.orders.filter(order => {
          const orderDate = new Date(order.closed_at);
          return orderDate >= today;
        });
        break;
        
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.filteredOrders = this.orders.filter(order => {
          const orderDate = new Date(order.closed_at);
          return orderDate >= weekAgo;
        });
        break;
        
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        this.filteredOrders = this.orders.filter(order => {
          const orderDate = new Date(order.closed_at);
          return orderDate >= monthAgo;
        });
        break;
        
      case 'all':
      default:
        this.filteredOrders = this.orders;
        break;
    }
    
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalSales = this.filteredOrders.reduce((sum, order) => sum + order.total, 0);
    this.totalOrders = this.filteredOrders.length;
    this.totalItems = this.filteredOrders.reduce((sum, order) => sum + order.item_count, 0);
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.filterByPeriod();
  }

  async onRefresh(event: any) {
    await this.loadSalesHistory();
    event.target.complete();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return `Q ${price.toFixed(2)}`;
  }

  goBack() {
    this.router.navigate(['/admin-menu']);
  }
}
