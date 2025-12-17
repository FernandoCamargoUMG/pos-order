import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline, pricetagOutline } from 'ionicons/icons';

@Component({
  selector: 'app-kds',
  templateUrl: './kds.page.html',
  styleUrls: ['./kds.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon
  ]
})
export class KdsPage {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ logOutOutline, pricetagOutline });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
