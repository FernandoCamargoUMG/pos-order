import { Component, Input, OnInit } from '@angular/core';
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
import { UpsellingService } from '../../../core/services/upselling.service';
import { UpsellingOption } from '../../../core/models';

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
export class UpsellingModalComponent implements OnInit {
    @Input() orderTotal: number = 0;

    suggestions: UpsellingOption[] = [];

    constructor(
        private modalController: ModalController,
        private upsellingService: UpsellingService
    ) {
        addIcons({ closeOutline, addOutline });
    }

    async ngOnInit() {
        await this.loadSuggestions();
    }

    async loadSuggestions() {
        this.suggestions = await this.upsellingService.getAllOptions();
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
        }, 'cancel');
    }

    confirmOrder() {
        this.modalController.dismiss({
            selected: false,
            confirmed: true
        }, 'confirm');
    }
}
