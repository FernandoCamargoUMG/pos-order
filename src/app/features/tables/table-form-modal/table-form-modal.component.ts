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
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { TableService } from '../../../core/services/table.service';
import { Table } from '../../../core/models';

@Component({
  selector: 'app-table-form-modal',
  templateUrl: './table-form-modal.component.html',
  styleUrls: ['./table-form-modal.component.scss'],
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
    IonSelectOption
  ]
})
export class TableFormModalComponent implements OnInit {
  @Input() table?: Table;

  name: string = '';
  levelId: number = 1;

  constructor(
    private modalCtrl: ModalController,
    private tableService: TableService
  ) {
    addIcons({ close });
  }

  ngOnInit() {
    if (this.table) {
      this.name = this.table.name || '';
      this.levelId = this.table.level_id || 1;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (!this.name.trim()) {
      return;
    }

    try {
      if (this.table) {
        await this.tableService.updateTable(this.table.id, this.levelId, this.name.trim());
      } else {
        await this.tableService.createTable(this.levelId, this.name.trim());
      }
      this.modalCtrl.dismiss({ saved: true });
    } catch (error) {
      console.error('Error guardando mesa:', error);
    }
  }
}
