import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface User {
    id_local: string;
    username: string;
    role_id: number;
    active: number;
}

@Component({
    selector: 'app-edit-user-modal',
    templateUrl: './edit-user-modal.component.html',
    styleUrls: ['./edit-user-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class EditUserModalComponent implements OnInit {
    @Input() user!: User;

    username: string = '';
    pin: string = '';
    role_id: number = 1;

    roles = [
        { id: 1, name: 'Administrador' },
        { id: 2, name: 'Mesero' },
        { id: 3, name: 'Cocina' },
        { id: 4, name: 'Cajero' }
    ];

    constructor(private modalController: ModalController) { }

    ngOnInit() {
        this.username = this.user.username;
        this.role_id = this.user.role_id;
    }

    dismiss() {
        this.modalController.dismiss();
    }

    save() {
        const updates: any = {};

        if (this.username && this.username !== this.user.username) {
            updates.username = this.username;
        }
        if (this.pin && this.pin.length === 4) {
            updates.pin = this.pin;
        }
        if (this.role_id && this.role_id !== this.user.role_id) {
            updates.role_id = this.role_id;
        }

        this.modalController.dismiss(updates);
    }
}
