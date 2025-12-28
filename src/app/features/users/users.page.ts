import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonFab,
  IonFabButton, IonSearchbar, IonSegment, IonSegmentButton, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, AlertController, 
  ToastController, ModalController, LoadingController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, personOutline, createOutline, trashOutline, 
  checkmarkCircle, closeCircle, filterOutline, statsChartOutline 
} from 'ionicons/icons';
import { UserService, User, Role } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { EditUserModalComponent } from './edit-user-modal/edit-user-modal.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonFab,
    IonFabButton, IonSearchbar, IonSegment, IonSegmentButton, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent,
    CommonModule, FormsModule
  ]
})
export class UsersPage implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  currentUser: any = null;
  isAdmin = false;
  
  searchTerm = '';
  filterSegment: 'all' | 'active' | 'inactive' = 'active';
  
  stats = {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: [] as { role_name: string; count: number }[]
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
    addIcons({ 
      addOutline, personOutline, createOutline, trashOutline,
      checkmarkCircle, closeCircle, filterOutline, statsChartOutline
    });
  }

  async ngOnInit() {
    // Verificar permisos de administrador
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || this.currentUser.role_id !== 1) {
      const toast = await this.toastController.create({
        message: 'Solo administradores pueden acceder a esta sección',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      this.router.navigate(['/tables']);
      return;
    }

    this.isAdmin = true;
    await this.loadData();
  }

  async loadData() {
    const loading = await this.loadingController.create({
      message: 'Cargando usuarios...'
    });
    await loading.present();

    try {
      [this.users, this.roles, this.stats.byRole] = await Promise.all([
        this.userService.getAllUsers(),
        this.userService.getRoles(),
        this.userService.countUsersByRole()
      ]);

      this.updateStats();
      this.filterUsers();
    } catch (error) {
      console.error('Error loading users:', error);
      const toast = await this.toastController.create({
        message: 'Error al cargar usuarios',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  updateStats() {
    this.stats.total = this.users.length;
    this.stats.active = this.users.filter(u => u.active === 1).length;
    this.stats.inactive = this.users.filter(u => u.active === 0).length;
  }

  filterUsers() {
    let filtered = [...this.users];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(term) ||
        u.role_name?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.filterSegment === 'active') {
      filtered = filtered.filter(u => u.active === 1);
    } else if (this.filterSegment === 'inactive') {
      filtered = filtered.filter(u => u.active === 0);
    }

    this.filteredUsers = filtered;
  }

  onSearchChange() {
    this.filterUsers();
  }

  onSegmentChange() {
    this.filterUsers();
  }

  async createUser() {
    // Primero seleccionar el rol
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecciona el Rol',
      buttons: [
        {
          text: 'Administrador',
          data: { role_id: 1, role_name: 'Administrador' }
        },
        {
          text: 'Mesero',
          data: { role_id: 2, role_name: 'Mesero' }
        },
        {
          text: 'Cocina',
          data: { role_id: 3, role_name: 'Cocina' }
        },
        {
          text: 'Cajero',
          data: { role_id: 4, role_name: 'Cajero' }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
    const { data } = await actionSheet.onDidDismiss();

    if (!data) return; // Usuario canceló

    // Ahora pedir el nombre y PIN
    const alert = await this.alertController.create({
      header: 'Crear Nuevo Usuario',
      subHeader: `Rol: ${data.role_name}`,
      cssClass: 'custom-user-alert',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Nombre de usuario',
          attributes: {
            required: true,
            minlength: 3,
            autocapitalize: 'off'
          }
        },
        {
          name: 'pin',
          type: 'tel',
          placeholder: 'PIN (4 dígitos)',
          attributes: {
            required: true,
            minlength: 4,
            maxlength: 4,
            pattern: '[0-9]*'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Crear',
          cssClass: 'alert-button-confirm',
          handler: async (formData) => {
            if (!formData.username || !formData.pin) {
              this.showToast('Todos los campos son requeridos', 'warning');
              return false;
            }

            if (formData.pin.length !== 4) {
              this.showToast('El PIN debe tener 4 dígitos', 'warning');
              return false;
            }

            const loading = await this.loadingController.create({
              message: 'Creando usuario...'
            });
            await loading.present();

            try {
              await this.userService.createUser({
                username: formData.username,
                pin: formData.pin,
                role_id: data.role_id
              });

              await this.loadData();
              this.showToast('Usuario creado exitosamente', 'success');
            } catch (error: any) {
              this.showToast(error.message || 'Error al crear usuario', 'danger');
            } finally {
              await loading.dismiss();
            }

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async editUser(user: User) {
    // Primero seleccionar el rol
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecciona el Rol',
      buttons: [
        {
          text: 'Administrador' + (user.role_id === 1 ? ' ✓' : ''),
          data: { role_id: 1, role_name: 'Administrador' },
          cssClass: user.role_id === 1 ? 'action-sheet-selected' : ''
        },
        {
          text: 'Mesero' + (user.role_id === 2 ? ' ✓' : ''),
          data: { role_id: 2, role_name: 'Mesero' },
          cssClass: user.role_id === 2 ? 'action-sheet-selected' : ''
        },
        {
          text: 'Cocina' + (user.role_id === 3 ? ' ✓' : ''),
          data: { role_id: 3, role_name: 'Cocina' },
          cssClass: user.role_id === 3 ? 'action-sheet-selected' : ''
        },
        {
          text: 'Cajero' + (user.role_id === 4 ? ' ✓' : ''),
          data: { role_id: 4, role_name: 'Cajero' },
          cssClass: user.role_id === 4 ? 'action-sheet-selected' : ''
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
    const { data } = await actionSheet.onDidDismiss();

    if (!data) return; // Usuario canceló

    // Ahora pedir el nombre y PIN
    const alert = await this.alertController.create({
      header: 'Editar Usuario',
      subHeader: `Rol: ${data.role_name}`,
      cssClass: 'custom-user-alert',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Nombre de usuario',
          value: user.username,
          attributes: {
            autocapitalize: 'off'
          }
        },
        {
          name: 'pin',
          type: 'tel',
          placeholder: 'Nuevo PIN (dejar vacío para mantener)',
          attributes: {
            minlength: 4,
            maxlength: 4,
            pattern: '[0-9]*'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Guardar',
          cssClass: 'alert-button-confirm',
          handler: async (formData) => {
            const updates: any = {};
            
            if (formData.username && formData.username !== user.username) {
              updates.username = formData.username;
            }
            if (formData.pin && formData.pin.length === 4) {
              updates.pin = formData.pin;
            }
            if (data.role_id !== user.role_id) {
              updates.role_id = data.role_id;
            }

            if (Object.keys(updates).length === 0) {
              this.showToast('No hay cambios para guardar', 'warning');
              return true;
            }

            const loading = await this.loadingController.create({
              message: 'Actualizando usuario...'
            });
            await loading.present();

            try {
              await this.userService.updateUser(user.id_local, updates);
              await this.loadData();
              this.showToast('Usuario actualizado exitosamente', 'success');
            } catch (error: any) {
              this.showToast(error.message || 'Error al actualizar usuario', 'danger');
            } finally {
              await loading.dismiss();
            }

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async toggleUserStatus(user: User) {
    const action = user.active === 1 ? 'desactivar' : 'activar';
    
    const alert = await this.alertController.create({
      header: `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
      message: `¿Estás seguro de que deseas ${action} a ${user.username}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          handler: async () => {
            const loading = await this.loadingController.create({
              message: `${action.charAt(0).toUpperCase() + action.slice(1)}ando usuario...`
            });
            await loading.present();

            try {
              if (user.active === 1) {
                await this.userService.deactivateUser(user.id_local);
              } else {
                await this.userService.activateUser(user.id_local);
              }

              await this.loadData();
              this.showToast(`Usuario ${action}do exitosamente`, 'success');
            } catch (error) {
              this.showToast(`Error al ${action} usuario`, 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: '¿Eliminar usuario?',
      message: `¿Estás seguro de que deseas eliminar permanentemente a ${user.username}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando usuario...'
            });
            await loading.present();

            try {
              await this.userService.deleteUser(user.id_local);
              await this.loadData();
              this.showToast('Usuario eliminado permanentemente', 'success');
            } catch (error) {
              this.showToast('Error al eliminar usuario', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getRoleBadgeColor(roleId: number): string {
    switch (roleId) {
      case 1: return 'danger';   // Administrador
      case 2: return 'primary';  // Mesero
      case 3: return 'warning';  // Cocina
      case 4: return 'success';  // Cajero
      default: return 'medium';
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
