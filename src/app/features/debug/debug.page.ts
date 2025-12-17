import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonBadge
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { DatabaseService } from '../../core/database/database.service';
import { addIcons } from 'ionicons';
import { refreshOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.page.html',
  styleUrls: ['./debug.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonBadge
  ]
})
export class DebugPage implements OnInit {
  selectedTable = 'products';
  data: any[] = [];
  columns: string[] = [];
  loading = false;

  tables = [
    { value: 'users', label: 'Usuarios' },
    { value: 'products', label: 'Productos' },
    { value: 'tables', label: 'Mesas' },
    { value: 'modifiers', label: 'Modificadores' },
    { value: 'orders', label: 'Órdenes' },
    { value: 'order_items', label: 'Items de Órdenes' },
    { value: 'roles', label: 'Roles' },
    { value: 'levels', label: 'Niveles' },
    { value: 'devices', label: 'Dispositivos' },
    { value: 'sync_queue', label: 'Cola de Sync' }
  ];

  constructor(
    private db: DatabaseService,
    private router: Router
  ) {
    addIcons({ refreshOutline, arrowBackOutline });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(event?: any) {
    this.loading = true;
    try {
      const query = `SELECT * FROM ${this.selectedTable}`;
      this.data = await this.db.executeQuery(query);
      
      if (this.data.length > 0) {
        this.columns = Object.keys(this.data[0]);
      } else {
        this.columns = [];
      }

      console.log(`📊 Tabla ${this.selectedTable}:`, this.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.data = [];
      this.columns = [];
    } finally {
      this.loading = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  async onTableChange(event: any) {
    this.selectedTable = event.detail.value;
    await this.loadData();
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  getDisplayValue(value: any): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  async clearTable() {
    if (confirm(`¿Eliminar todos los registros de ${this.selectedTable}?`)) {
      try {
        await this.db.run(`DELETE FROM ${this.selectedTable}`);
        await this.loadData();
        alert('Tabla vaciada exitosamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al vaciar la tabla');
      }
    }
  }
}
