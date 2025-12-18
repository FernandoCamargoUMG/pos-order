import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  pricetagOutline,
  peopleOutline,
  restaurantOutline,
  gridOutline,
  statsChartOutline,
  settingsOutline,
  bagAddOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-admin-menu',
    templateUrl: './admin-menu.page.html',
    styleUrls: ['./admin-menu.page.scss'],
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
        IonGrid,
        IonRow,
        IonCol,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent
    ]
})
export class AdminMenuPage implements OnInit, OnDestroy {

    menuOptions = [
        {
            title: 'Productos',
            icon: 'pricetag-outline',
            color: 'primary',
            route: '/products',
            description: 'Gestionar menú y precios'
        },
        {
            title: 'Upselling',
            icon: 'bag-add-outline',
            color: 'success',
            route: '/upselling-management',
            description: 'Gestionar ofertas y combos'
        },
        {
            title: 'Mesas',
            icon: 'grid-outline',
            color: 'secondary',
            route: '/tables',
            description: 'Administrar mesas'
        },
        {
            title: 'Cocina (KDS)',
            icon: 'restaurant-outline',
            color: 'tertiary',
            route: '/kds',
            description: 'Pantalla de cocina'
        },
        {
            title: 'Usuarios',
            icon: 'people-outline',
            color: 'success',
            route: '/users',
            description: 'Gestionar personal'
        },
        {
            title: 'Reportes',
            icon: 'stats-chart-outline',
            color: 'warning',
            route: '/reports',
            description: 'Ventas y estadísticas'
        },
        {
            title: 'Configuración',
            icon: 'settings-outline',
            color: 'medium',
            route: '/settings',
            description: 'Ajustes del sistema'
        }
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private platform: Platform
    ) {
        addIcons({
            logOutOutline,
            pricetagOutline,
            peopleOutline,
            restaurantOutline,
            gridOutline,
            statsChartOutline,
            settingsOutline,
            bagAddOutline
        });
    }

    ngOnInit() {
        // Registrar listener para el botón de atrás del hardware con alta prioridad
        this.platform.backButton.subscribeWithPriority(10, () => {
            // En el menú admin, el botón de atrás no hace nada (evita salir de la app)
            // El usuario debe usar el botón de Salir explícitamente
            // No se ejecuta el comportamiento por defecto
        });
    }

    ngOnDestroy() {
        // No necesitamos limpiar explícitamente, Angular lo hace automáticamente
    }

    navigateTo(route: string) {
        this.router.navigate([route]);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
