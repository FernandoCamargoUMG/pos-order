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
import { ModifierService, Modifier as ModifierData } from '../../../core/services/modifier.service';

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

  exclusions: Modifier[] = [];
  extras: Modifier[] = [];
  cookingTerms: Modifier[] = [];

  notes: string = '';

  constructor(
    private modalController: ModalController,
    private modifierService: ModifierService
  ) {
    addIcons({ closeOutline, checkmarkOutline });
  }

  async ngOnInit() {
    await this.loadModifiers();
  }

  async loadModifiers() {
    const exclusionsData = await this.modifierService.getModifiersByType('EXCLUDE');
    this.exclusions = exclusionsData.map(m => ({ name: m.name, selected: false }));

    const extrasData = await this.modifierService.getModifiersByType('EXTRA');
    this.extras = extrasData.map(m => ({ name: m.name, selected: false }));

    const cookingData = await this.modifierService.getModifiersByType('COOKING');
    this.cookingTerms = cookingData.map(m => ({ name: m.name, selected: false }));
  }

  onExclusionChange(exclusion: Modifier) {
    exclusion.selected = !exclusion.selected;
  }

  onExtraChange(extra: Modifier) {
    extra.selected = !extra.selected;
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
    
    const selectedExtras = this.extras
      .filter(e => e.selected)
      .map(e => e.name);
    
    const selectedCookingTerm = this.cookingTerms
      .find(t => t.selected)?.name;
    
    const modifiers = [...selectedExclusions, ...selectedExtras];
    if (selectedCookingTerm) {
      modifiers.push(selectedCookingTerm);
    }

    this.modalController.dismiss({
      modifiers,
      notes: this.notes
    }, 'confirm');
  }
}
