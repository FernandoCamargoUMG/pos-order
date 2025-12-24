import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonToggle,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, arrowBackOutline } from 'ionicons/icons';
import { UpsellingService } from '../../../core/services/upselling.service';
import { UpsellingOption } from '../../../core/models';
import { UpsellingFormModalComponent } from '../upselling-form-modal/upselling-form-modal.component';

@Component({
  selector: 'app-upselling-management',
  templateUrl: './upselling-management.page.html',
  styleUrls: ['./upselling-management.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    RouterLink
  ]
})
export class UpsellingManagementPage implements OnInit {
  options: UpsellingOption[] = [];

  constructor(
    private upsellingService: UpsellingService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    addIcons({ addOutline, createOutline, trashOutline, arrowBackOutline });
  }

  async ngOnInit() {
    await this.loadOptions();
  }

  async loadOptions() {
    const allOptions = await this.upsellingService.getAllOptions();
    this.options = allOptions;
  }

  async openFormModal(option?: UpsellingOption) {
    const modal = await this.modalCtrl.create({
      component: UpsellingFormModalComponent,
      componentProps: { option }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.saved) {
      await this.loadOptions();
    }
  }

  async toggleActive(option: UpsellingOption, event: any) {
    const active = event.detail.checked;
    if (option.id) {
      await this.upsellingService.toggleActive(option.id, active);
      option.active = active ? 1 : 0;
    }
  }

  async deleteOption(option: UpsellingOption) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar "${option.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            if (option.id) {
              await this.upsellingService.deleteOption(option.id);
              await this.loadOptions();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      'combo': 'Combo',
      'bebida': 'Bebida',
      'postre': 'Postre',
      'extra': 'Extra'
    };
    return labels[type] || type;
  }
}
