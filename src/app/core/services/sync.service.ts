import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout, tap, catchError, throwError } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { environment } from '../../../environments/environment';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiUrl = environment.apiUrl;
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSync: null,
    pendingItems: 0
  };

  constructor(
    private http: HttpClient,
    private db: DatabaseService
  ) {
    this.checkConnection();
    // Verificar conexión cada 30 segundos
    setInterval(() => this.checkConnection(), 30000);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/health`;
      console.log('===========================================');
      console.log('🔍 INTENTANDO CONECTAR');
      console.log('URL:', url);
      console.log('IP Backend esperada: 192.168.1.6:3000');
      console.log('===========================================');
      
      const response: any = await firstValueFrom(
        this.http.get(url, {
          observe: 'response'
        }).pipe(
          timeout(10000),
          tap(() => console.log('✅ HTTP Request enviado')),
          catchError((err: any) => {
            console.error('❌ HTTP Error:', err);
            return throwError(() => err);
          })
        )
      );
      
      this.syncStatus.isOnline = true;
      console.log('✅✅✅ BACKEND ONLINE - Status:', response.status);
      console.log('Response:', response.body);
      return true;
    } catch (error: any) {
      this.syncStatus.isOnline = false;
      console.error('❌❌❌ BACKEND OFFLINE');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Full error:', JSON.stringify(error, null, 2));
      return false;
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // ============================================
  // SINCRONIZACIÓN DE PRODUCTOS
  // ============================================

  async syncProducts(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar productos: backend offline');
      return;
    }

    try {
      console.log('Sincronizando productos...');
      
      // PASO 1: Enviar cambios locales pendientes al backend y obtener IDs procesados
      const processedIds = await this.pushLocalProductChanges();

      // PASO 2: Obtener productos del backend
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/products/active`, {
          headers: this.getAuthHeaders()
        })
      );

      console.log(`Recibidos ${response.length} productos del backend`);

      // PASO 3: UPSERT productos del backend (EXCEPTO los que acabamos de subir)
      for (const product of response) {
        // SALTAR productos que acabamos de crear/actualizar (evita duplicados)
        if (processedIds.has(product.id)) {
          console.log(`Saltando ${product.name} (ya procesado)`);
          continue;
        }

        // Verificar si ya existe (por id_backend O id_local)
        const existing = await this.db.executeQuery<any>(
          'SELECT id_local, id_backend FROM products WHERE id_backend = ? OR id_local = ?',
          [product.id, product.id]
        );

        if (existing && existing.length > 0) {
          // ACTUALIZAR producto existente
          const localId = existing[0].id_local;
          await this.db.executeQuery(`
            UPDATE products 
            SET id_backend = ?, name = ?, price = ?, category = ?, active = ?
            WHERE id_local = ?
          `, [
            product.id,
            product.name,
            product.price,
            product.category,
            product.active ? 1 : 0,
            localId
          ]);
          console.log(`Actualizado: ${product.name} (id_local: ${localId})`);
        } else {
          // INSERTAR nuevo producto (no existe en local)
          await this.db.executeQuery(`
            INSERT INTO products (
              id_local, id_backend, name, price, category, active
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            product.id, // usar id del backend como id_local para nuevos
            product.id, // id_backend
            product.name,
            product.price,
            product.category,
            product.active ? 1 : 0
          ]);
          console.log(`Insertado: ${product.name}`);
        }
      }

      this.syncStatus.lastSync = new Date();
      console.log('Productos sincronizados correctamente');

    } catch (error) {
      console.error('Error sincronizando productos:', error);
      throw error;
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE MESAS
  // ============================================

  async syncTables(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar mesas: backend offline');
      return;
    }

    try {
      console.log('Sincronizando mesas...');
      
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/tables`, {
          headers: this.getAuthHeaders()
        })
      );

      console.log(`Recibidas ${response.length} mesas del backend`);

      // UPSERT mesas del backend (INSERT OR REPLACE)
      for (const table of response) {
        await this.db.executeQuery(`
          INSERT OR REPLACE INTO tables (
            id, level_id, name, status, current_order_id,
            owner_device_id, locked_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          table.id,
          table.levelId,
          table.name,
          table.status,
          table.currentOrderId,
          table.ownerDeviceId,
          table.lockedAt,
          table.updatedAt
        ]);
      }

      this.syncStatus.lastSync = new Date();
      console.log('Mesas sincronizadas correctamente');

    } catch (error) {
      console.error('Error sincronizando mesas:', error);
      throw error;
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE MODIFICADORES
  // ============================================

  async syncModifiers(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar modificadores: backend offline');
      return;
    }

    try {
      console.log('Sincronizando modificadores...');
      
      // Nota: El backend no tiene endpoint de modificadores aún
      // Por ahora mantenemos los modificadores locales
      console.log('⏭Modificadores se mantienen locales por ahora');

    } catch (error) {
      console.error('Error sincronizando modificadores:', error);
      throw error;
    }
  }

  // ============================================
  // ENVIAR CAMBIOS LOCALES AL BACKEND
  // ============================================

  private async pushLocalProductChanges(): Promise<Set<string>> {
    const processedIds = new Set<string>(); // IDs de productos que ya subimos
    
    try {
      // Obtener productos con cambios pendientes (sin id_backend o en sync_queue)
      const pendingProducts = await this.db.executeQuery<any>(`
        SELECT DISTINCT p.* 
        FROM products p
        LEFT JOIN sync_queue sq ON sq.entity_id = p.id_local AND sq.entity = 'product'
        WHERE p.id_backend IS NULL OR sq.id IS NOT NULL
      `);

      if (!pendingProducts || pendingProducts.length === 0) {
        console.log('No hay cambios locales de productos pendientes');
        return processedIds;
      }

      console.log(`Enviando ${pendingProducts.length} cambios de productos al backend...`);

      for (const product of pendingProducts) {
        try {
          if (product.id_backend) {
            // Actualizar producto existente en backend
            await firstValueFrom(
              this.http.put(`${this.apiUrl}/products/${product.id_backend}`, {
                name: product.name,
                price: product.price,
                category: product.category,
                active: product.active === 1
              }, {
                headers: this.getAuthHeaders()
              })
            );
            console.log(`Producto actualizado en backend: ${product.name}`);
            processedIds.add(product.id_backend); // Marcar como procesado
            
            // Eliminar de sync_queue
            await this.db.executeQuery(
              'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
              ['product', product.id_local]
            );
          } else {
            // Crear nuevo producto en backend
            const response: any = await firstValueFrom(
              this.http.post(`${this.apiUrl}/products`, {
                name: product.name,
                price: product.price,
                category: product.category,
                active: product.active === 1
              }, {
                headers: this.getAuthHeaders()
              })
            );
            
            // SOLO actualizar id_backend (NO cambiar id_local que es PRIMARY KEY)
            await this.db.executeQuery(
              'UPDATE products SET id_backend = ? WHERE id_local = ?',
              [response.id, product.id_local]
            );
            console.log(`Producto creado en backend: ${product.name} (ID: ${response.id})`);
            processedIds.add(response.id); // Marcar como procesado
            
            // Eliminar de sync_queue
            await this.db.executeQuery(
              'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
              ['product', product.id_local]
            );
          }
        } catch (error) {
          console.error(`Error sincronizando producto ${product.name}:`, error);
          // Continuar con el siguiente producto
        }
      }
    } catch (error) {
      console.error('Error obteniendo cambios locales:', error);
    }
    
    return processedIds;
  }

  // ============================================
  // SINCRONIZACIÓN DE ÓRDENES PENDIENTES
  // ============================================

  async syncPendingOrders(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar órdenes: backend offline');
      return;
    }

    try {
      console.log('Sincronizando órdenes pendientes...');

      // Obtener órdenes con idBackend = null (creadas offline)
      const pendingOrders = await this.db.executeQuery<any>(`
        SELECT * FROM orders 
        WHERE id_backend IS NULL 
        AND deleted_at IS NULL
      `);

      if (pendingOrders.length === 0) {
        console.log('No hay órdenes pendientes de sincronizar');
        return;
      }

      console.log(`Enviando ${pendingOrders.length} órdenes al backend...`);

      for (const order of pendingOrders) {
        try {
          // Obtener items de la orden
          const items = await this.db.executeQuery<any>(`
            SELECT oi.*, GROUP_CONCAT(oim.modifier) as modifiers
            FROM order_items oi
            LEFT JOIN order_item_modifiers oim ON oi.id_local = oim.order_item_id
            WHERE oi.order_id = ? AND oi.deleted_at IS NULL
            GROUP BY oi.id_local
          `, [order.id_local]);

          // Formatear items para el backend
          const formattedItems = items.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            modifiers: item.modifiers ? item.modifiers.split(',') : []
          }));

          // Crear orden en el backend
          const response = await firstValueFrom(
            this.http.post<any>(`${this.apiUrl}/orders`, {
              tableId: order.table_id,
              userId: order.user_id,
              deviceId: order.device_id,
              notes: order.notes,
              items: formattedItems
            }, {
              headers: this.getAuthHeaders()
            })
          );

          // Actualizar orden local con idBackend del servidor
          await this.db.executeQuery(`
            UPDATE orders 
            SET id_backend = ?, updated_at = ? 
            WHERE id_local = ?
          `, [response.idBackend, new Date().toISOString(), order.id_local]);

          console.log(`Orden ${order.id_local} sincronizada con backend`);

        } catch (error) {
          console.error(`Error sincronizando orden ${order.id_local}:`, error);
          // Continuar con la siguiente orden
        }
      }

      this.syncStatus.lastSync = new Date();
      console.log('Órdenes pendientes sincronizadas');

    } catch (error) {
      console.error('Error sincronizando órdenes pendientes:', error);
      throw error;
    }
  }

  // ============================================
  // SINCRONIZACIÓN COMPLETA
  // ============================================

  async fullSync(): Promise<void> {
    console.log('Iniciando sincronización completa...');

    const isOnline = await this.checkConnection();
    
    if (!isOnline) {
      console.log('Backend offline. Trabajando en modo local.');
      return;
    }

    try {
      await this.syncProducts();
      await this.syncTables();
      await this.syncModifiers();
      await this.syncPendingOrders();
      
      this.syncStatus.lastSync = new Date();
      console.log('Sincronización completa exitosa');

    } catch (error) {
      console.error('Error en sincronización completa:', error);
      throw error;
    }
  }

  // ============================================
  // LOGIN CON BACKEND
  // ============================================

  async loginWithBackend(username: string, pin: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/auth/login`, {
          username,
          pin
        })
      );

      // Guardar token
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        console.log('Login exitoso con backend');
      }

      return response;

    } catch (error) {
      console.error('Error en login con backend:', error);
      throw error;
    }
  }
}
