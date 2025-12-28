import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: LOCALE_ID, useValue: 'es-GT' }],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonFab,
    IonFabButton, IonSearchbar, IonSegment, IonSegmentButton, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent,
    CommonModule, FormsModule
  ]
})
export class UsersPage implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  currentUser: any = null;
  isAdmin = false;
  
  searchTerm = '';
  filterSegment: 'all' | 'active' | 'inactive' = 'active';
  private searchTimeout: any;
  private roleInputListener: ((e: Event) => void) | null = null;
  private roleBadgeColorCache = new Map<number, string>();
  
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
    private router: Router,
    private cdr: ChangeDetectorRef
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
      // Solo cargar roles una vez (no necesitan recargarse)
      const promises: Promise<any>[] = [this.userService.getAllUsers()];
      
      if (this.roles.length === 0) {
        promises.push(this.userService.getRoles());
      }

      const results = await Promise.all(promises);
      this.users = results[0];
      
      if (results.length > 1) {
        this.roles = results[1];
      }

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
    // Calcular stats en un solo recorrido (más eficiente)
    let active = 0, inactive = 0;
    const roleCount = new Map<string, number>();
    
    for (const user of this.users) {
      if (user.active === 1) active++;
      else inactive++;
      
      // Actualizar conteo por rol
      if (user.role_name) {
        roleCount.set(user.role_name, (roleCount.get(user.role_name) || 0) + 1);
      }
    }
    
    this.stats.total = this.users.length;
    this.stats.active = active;
    this.stats.inactive = inactive;
    this.stats.byRole = Array.from(roleCount.entries()).map(([role_name, count]) => ({ role_name, count }));
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  // Método optimizado para aplicar filtros sin búsqueda completa
  applyFilters() {
    this.updateStats();
    this.filterUsers();
  }

  onSearchChange() {
    // Debounce para evitar filtrar en cada tecla
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.filterUsers();
    }, 300);
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
    let selectedRoleId = user.role_id;
    const roles = [
      { id: 1, name: 'Administrador' },
      { id: 2, name: 'Mesero' },
      { id: 3, name: 'Cocina' },
      { id: 4, name: 'Cajero' }
    ];

    const showEditAlert = async () => {
      const selectedRoleName = roles.find(r => r.id === selectedRoleId)?.name || '';

      const alert = await this.alertController.create({
        header: 'Editar Usuario',
        subHeader: user.username,
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
          },
          {
            name: 'role_display',
            type: 'text',
            placeholder: 'Seleccionar rol',
            value: selectedRoleName,
            attributes: {
              readonly: true,
              id: 'roleInput'
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
              if (selectedRoleId !== user.role_id) {
                updates.role_id = selectedRoleId;
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
                
                // Actualizar solo el usuario modificado en la lista local (más eficiente)
                const index = this.users.findIndex(u => u.id_local === user.id_local);
                if (index !== -1) {
                  this.users[index] = { ...this.users[index], ...updates };
                  if (updates.role_id) {
                    const role = roles.find(r => r.id === updates.role_id);
                    if (role) this.users[index].role_name = role.name;
                  }
                  this.applyFilters();
                }
                
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

      setTimeout(() => {
        const roleInput = document.getElementById('roleInput');
        if (roleInput) {
          // Limpiar listener anterior si existe (prevenir memory leaks)
          if (this.roleInputListener) {
            roleInput.removeEventListener('click', this.roleInputListener);
          }
          
          roleInput.style.cursor = 'pointer';
          this.roleInputListener = async (e: Event) => {
            e.preventDefault();
            
            const roleAlert = await this.alertController.create({
              header: 'Seleccionar Rol',
              inputs: roles.map(role => ({
                type: 'radio' as const,
                label: role.name,
                value: role.id,
                checked: selectedRoleId === role.id
              })),
              buttons: [
                {
                  text: 'Cancelar',
                  role: 'cancel'
                },
                {
                  text: 'OK',
                  handler: (roleId: number) => {
                    selectedRoleId = roleId;
                    alert.dismiss();
                    showEditAlert();
                  }
                }
              ]
            });
            
            await roleAlert.present();
          };
          
          roleInput.addEventListener('click', this.roleInputListener);
        }
      }, 100);
    };

    await showEditAlert();
  }

  ngOnDestroy() {
    // Limpieza al destruir componente
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
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

              // OPTIMIZACIÓN: Actualizar solo el usuario localmente en lugar de recargar todo
              const index = this.users.findIndex(u => u.id_local === user.id_local);
              if (index !== -1) {
                this.users[index].active = user.active === 1 ? 0 : 1;
                this.applyFilters(); // Re-filtrar y actualizar estadísticas
              }

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
              
              // OPTIMIZACIÓN: Eliminar solo el usuario localmente en lugar de recargar todo
              const index = this.users.findIndex(u => u.id_local === user.id_local);
              if (index !== -1) {
                this.users.splice(index, 1);
                this.applyFilters(); // Re-filtrar y actualizar estadísticas
              }

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

  // TrackBy function para optimizar ngFor
  trackByUserId(index: number, user: User): string {
    return user.id_local;
  }

  trackByRoleName(index: number, stat: { role_name: string; count: number }): string {
    return stat.role_name;
  }

  // Memoización de colores de badge
  getRoleBadgeColor(roleId: number): string {
    if (this.roleBadgeColorCache.has(roleId)) {
      return this.roleBadgeColorCache.get(roleId)!;
    }
    
    let color: string;
    switch (roleId) {
      case 1: color = 'danger'; break;   // Administrador
      case 2: color = 'primary'; break;  // Mesero
      case 3: color = 'warning'; break;  // Cocina
      case 4: color = 'success'; break;  // Cajero
      default: color = 'medium';
    }
    
    this.roleBadgeColorCache.set(roleId, color);
    return color;
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
