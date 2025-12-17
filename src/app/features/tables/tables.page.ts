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
  Platform
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TableService } from '../../core/services/table.service';
import { Table } from '../../core/models';
import { addIcons } from 'ionicons';
import { logOutOutline, pricetagOutline, arrowBackOutline, restaurantOutline, addOutline } from 'ionicons/icons';
import { App } from '@capacitor/app';

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

  constructor(
    private authService: AuthService,
    private tableService: TableService,
    private router: Router,
    private platform: Platform
  ) {
    addIcons({ logOutOutline, pricetagOutline, arrowBackOutline, restaurantOutline, addOutline });
    
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

  async onTableClick(table: Table) {
    if (table.status === 'FREE') {
      // Crear nueva orden para mesa libre
      this.router.navigate(['/order', table.id]);
    } else if (table.status === 'OCCUPIED') {
      // Continuar orden existente
      this.router.navigate(['/order', table.id]);
    } else if (table.status === 'PAYING') {
      // Ver cuenta/imprimir
      // TODO: Implementar vista de pago
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
