import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { UpsellingService } from '../../../core/services/upselling.service';
import { UpsellingOption, UpsellingType } from '../../../core/models';

@Component({
  selector: 'app-upselling-form-modal',
  templateUrl: './upselling-form-modal.component.html',
  styleUrls: ['./upselling-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea
  ]
})
export class UpsellingFormModalComponent implements OnInit {
  @Input() option?: UpsellingOption;

  title: string = '';
  description: string = '';
  price: number = 0;
  type: UpsellingType = 'combo';
  active: boolean = true;

  constructor(
    private modalCtrl: ModalController,
    private upsellingService: UpsellingService
  ) {
    addIcons({ close });
  }

  ngOnInit() {
    if (this.option) {
      this.title = this.option.title;
      this.description = this.option.description || '';
      this.price = this.option.price;
      this.type = this.option.type;
      this.active = this.option.active === 1;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    console.log('Save called:', { title: this.title, price: this.price, type: typeof this.price });
    
    if (!this.title.trim() || !this.price || Number(this.price) <= 0) {
      console.log('Validación fallida');
      return;
    }

    console.log('Guardando opción de upselling...');

    try {
      if (this.option?.id) {
        await this.upsellingService.updateOption(this.option.id, {
          title: this.title.trim(),
          description: this.description.trim(),
          price: Number(this.price),
          type: this.type,
          active: this.active ? 1 : 0
        });
        console.log('Actualizado correctamente');
      } else {
        await this.upsellingService.createOption({
          title: this.title.trim(),
          description: this.description.trim(),
          price: Number(this.price),
          type: this.type,
          active: this.active ? 1 : 0
        });
        console.log('Creado correctamente');
      }
      this.modalCtrl.dismiss({ saved: true });
    } catch (error) {
      console.error('Error guardando opción de upselling:', error);
    }
  }
}
