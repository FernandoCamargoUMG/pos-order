import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './core/database/database.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private databaseService: DatabaseService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    try {
      // Inicializar la base de datos
      await this.databaseService.init();
      console.log('✅ Base de datos inicializada');
      
      // Restaurar sesión si existe
      await this.authService.restoreSession();
    } catch (error) {
      console.error('❌ Error al inicializar la aplicación:', error);
    }
  }
}
