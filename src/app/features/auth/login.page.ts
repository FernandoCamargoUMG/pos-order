import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText
  ]
})
export class LoginPage implements OnInit {
  username = '';
  pin = '';
  loading = false;
  error = '';
  showFirstTimeSetup = false;
  newUsername = '';
  newPin = '';
  newPinConfirm = '';
  selectedRole: number | null = null;
  roles: Role[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.roles = await this.authService.getRoles();
  }

  async login() {
    if (!this.username || !this.pin) {
      this.error = 'Por favor ingrese usuario y PIN';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const user = await this.authService.login(this.username, this.pin);
      
      // Redirigir según el rol
      if (user.role?.name === 'ADMINISTRADOR') {
        this.router.navigate(['/products']);
      } else if (user.role?.name === 'MESERO') {
        this.router.navigate(['/tables']);
      } else if (user.role?.name === 'COCINA') {
        this.router.navigate(['/kds']);
      } else {
        this.router.navigate(['/tables']);
      }
    } catch (err: any) {
      this.error = err.message || 'Error al iniciar sesión';
    } finally {
      this.loading = false;
    }
  }

  toggleFirstTimeSetup() {
    this.showFirstTimeSetup = !this.showFirstTimeSetup;
    this.error = '';
  }

  async createFirstUser() {
    if (!this.newUsername || !this.newPin || !this.selectedRole) {
      this.error = 'Complete todos los campos';
      return;
    }

    if (this.newPin !== this.newPinConfirm) {
      this.error = 'Los PINs no coinciden';
      return;
    }

    if (this.newPin.length < 4) {
      this.error = 'El PIN debe tener al menos 4 dígitos';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.authService.createUser(this.newUsername, this.newPin, this.selectedRole);
      this.showFirstTimeSetup = false;
      this.error = '';
      this.newUsername = '';
      this.newPin = '';
      this.newPinConfirm = '';
      this.selectedRole = null;
      
      // Mostrar mensaje de éxito
      alert('Usuario creado exitosamente. Ahora puede iniciar sesión.');
    } catch (err: any) {
      this.error = err.message || 'Error al crear usuario';
    } finally {
      this.loading = false;
    }
  }

  goToDebug() {
    this.router.navigate(['/debug']);
  }
}
