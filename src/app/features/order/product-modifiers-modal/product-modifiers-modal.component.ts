import { Component, Input, OnInit } from '@angular/core';
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
  IonCheckbox,
  IonTextarea,
  IonFooter,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import { Product } from '../../../core/models';

interface Modifier {
  name: string;
  selected: boolean;
}

@Component({
  selector: 'app-product-modifiers-modal',
  templateUrl: './product-modifiers-modal.component.html',
  styleUrls: ['./product-modifiers-modal.component.scss'],
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
    IonCheckbox,
    IonTextarea,
    IonFooter
  ]
})
export class ProductModifiersModalComponent implements OnInit {
  @Input() product!: Product;

  exclusions: Modifier[] = [
    { name: 'Sin cebolla', selected: false },
    { name: 'Sin tomate', selected: false },
    { name: 'Sin lechuga', selected: false },
    { name: 'Sin pepinillos', selected: false },
    { name: 'Sin mostaza', selected: false },
    { name: 'Sin mayonesa', selected: false },
    { name: 'Sin ketchup', selected: false }
  ];

  cookingTerms: Modifier[] = [
    { name: 'Término rojo', selected: false },
    { name: 'Término medio', selected: false },
    { name: 'Término tres cuartos', selected: false },
    { name: 'Bien cocido', selected: false }
  ];

  notes: string = '';

  constructor(private modalController: ModalController) {
    addIcons({ closeOutline, checkmarkOutline });
  }

  ngOnInit() {}

  onExclusionChange(exclusion: Modifier) {
    exclusion.selected = !exclusion.selected;
  }

  onCookingTermChange(term: Modifier) {
    if (term.selected) {
      // Solo permitir un término de cocción
      this.cookingTerms.forEach(t => {
        if (t !== term) {
          t.selected = false;
        }
      });
    }
  }

  cancel() {
    this.modalController.dismiss(null, 'cancel');
  }

  confirm() {
    const selectedExclusions = this.exclusions
      .filter(e => e.selected)
      .map(e => e.name);
    
    const selectedCookingTerm = this.cookingTerms
      .find(t => t.selected)?.name;
    
    const modifiers = [...selectedExclusions];
    if (selectedCookingTerm) {
      modifiers.push(selectedCookingTerm);
    }

    this.modalController.dismiss({
      modifiers,
      notes: this.notes
    }, 'confirm');
  }
}
