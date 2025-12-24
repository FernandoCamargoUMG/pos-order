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
  IonSegment,
  IonSegmentButton,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ModifierService, Modifier } from '../../../core/services/modifier.service';
import { ModifierFormModalComponent } from './modifier-form-modal/modifier-form-modal.component';

@Component({
  selector: 'app-modifiers-management',
  templateUrl: './modifiers-management.page.html',
  styleUrls: ['./modifiers-management.page.scss'],
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
    IonSegment,
    IonSegmentButton
  ]
})
export class ModifiersManagementPage implements OnInit {
  modifiers: Modifier[] = [];
  selectedType: 'EXCLUDE' | 'EXTRA' | 'COOKING' = 'EXCLUDE';

  constructor(
    private router: Router,
    private modifierService: ModifierService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {
    addIcons({ arrowBackOutline, addOutline, createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadModifiers();
  }

  async loadModifiers() {
    this.modifiers = await this.modifierService.getAllModifiers();
  }

  getModifiersByType(type: 'EXCLUDE' | 'EXTRA' | 'COOKING'): Modifier[] {
    return this.modifiers.filter(m => m.type === type);
  }

  onSegmentChange(event: any) {
    this.selectedType = event.detail.value;
  }

  async openFormModal(modifier?: Modifier) {
    const modal = await this.modalCtrl.create({
      component: ModifierFormModalComponent,
      componentProps: { modifier, defaultType: this.selectedType }
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.saved) {
      await this.loadModifiers();
    }
  }

  async deleteModifier(modifier: Modifier) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Modificador',
      message: `¿Estás seguro de eliminar "${modifier.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.modifierService.deleteModifier(modifier.id!);
            await this.loadModifiers();
          }
        }
      ]
    });
    await alert.present();
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'EXCLUDE': return 'Exclusión';
      case 'EXTRA': return 'Extra';
      case 'COOKING': return 'Cocción';
      default: return type;
    }
  }

  goBack() {
    this.router.navigate(['/admin-menu']);
  }
}
