import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon,
    Platform
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline, pricetagOutline, arrowBackOutline } from 'ionicons/icons';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-kds',
    templateUrl: './kds.page.html',
    styleUrls: ['./kds.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonButton,
        IonButtons,
        IonIcon
    ]
})
export class KdsPage implements OnInit, OnDestroy {
    isAdmin = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private platform: Platform
    ) {
        addIcons({ logOutOutline, pricetagOutline, arrowBackOutline });

        // Verificar si el usuario es administrador
        this.authService.currentUser$.subscribe(user => {
            this.isAdmin = user?.role?.name === 'ADMINISTRADOR';
        });
    }

    ngOnInit() {
        // Registrar listener para el botón de atrás del hardware con alta prioridad
        this.platform.backButton.subscribeWithPriority(10, () => {
            if (this.isAdmin) {
                // Si es admin, navegar al menú admin
                this.router.navigate(['/admin-menu']);
            }
            // Si es rol cocina, el botón de atrás no hace nada (es su página principal)
            // No se ejecuta el comportamiento por defecto
        });
    }

    ngOnDestroy() {
        // No necesitamos limpiar explícitamente, Angular lo hace automáticamente
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/login']);
    }
}
