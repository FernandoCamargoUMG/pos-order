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
  IonInput,
  IonSelect,
  IonSelectOption,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import { ModifierService, Modifier } from '../../../../core/services/modifier.service';

@Component({
  selector: 'app-modifier-form-modal',
  templateUrl: './modifier-form-modal.component.html',
  styleUrls: ['./modifier-form-modal.component.scss'],
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
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})
export class ModifierFormModalComponent implements OnInit {
  @Input() modifier?: Modifier;
  @Input() defaultType?: 'EXCLUDE' | 'EXTRA' | 'COOKING';

  name: string = '';
  type: 'EXCLUDE' | 'EXTRA' | 'COOKING' = 'EXCLUDE';

  constructor(
    private modalCtrl: ModalController,
    private modifierService: ModifierService
  ) {
    addIcons({ closeOutline, checkmarkOutline });
  }

  ngOnInit() {
    if (this.modifier) {
      this.name = this.modifier.name;
      this.type = this.modifier.type;
    } else if (this.defaultType) {
      this.type = this.defaultType;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    if (!this.name.trim()) {
      return;
    }

    try {
      if (this.modifier?.id) {
        await this.modifierService.updateModifier(this.modifier.id, {
          name: this.name.trim(),
          type: this.type
        });
      } else {
        await this.modifierService.createModifier({
          name: this.name.trim(),
          type: this.type
        });
      }
      this.modalCtrl.dismiss({ saved: true }, 'confirm');
    } catch (error) {
      console.error('Error guardando modificador:', error);
    }
  }
}
