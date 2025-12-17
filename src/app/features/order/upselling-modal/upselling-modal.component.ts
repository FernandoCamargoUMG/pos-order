import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonFooter,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, addOutline } from 'ionicons/icons';

interface UpsellingOption {
  title: string;
  description: string;
  price: number;
  type: 'combo' | 'bebida' | 'postre';
}

@Component({
  selector: 'app-upselling-modal',
  templateUrl: './upselling-modal.component.html',
  styleUrls: ['./upselling-modal.component.scss'],
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
    IonList,
    IonItem,
    IonFooter
  ]
})
export class UpsellingModalComponent {
  @Input() orderTotal: number = 0;

  suggestions: UpsellingOption[] = [
    {
      title: 'Convertir a Combo',
      description: 'Papas + Bebida Grande',
      price: 15.00,
      type: 'combo'
    },
    {
      title: 'Agregar Bebida',
      description: 'Coca-Cola, Pepsi o Sprite',
      price: 8.00,
      type: 'bebida'
    },
    {
      title: 'Postre del Día',
      description: 'Pay de Manzana',
      price: 12.00,
      type: 'postre'
    }
  ];

  constructor(private modalController: ModalController) {
    addIcons({ closeOutline, addOutline });
  }

  selectOption(option: UpsellingOption) {
    this.modalController.dismiss({
      selected: true,
      option
    }, 'selected');
  }

  skipUpselling() {
    this.modalController.dismiss({
      selected: false
    }, 'skip');
  }
}
