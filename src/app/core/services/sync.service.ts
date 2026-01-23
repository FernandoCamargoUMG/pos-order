import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, lastValueFrom, timeout, tap, catchError, throwError, Subject } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { environment } from '../../../environments/environment';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
}

export interface SyncEvent {
  entity: 'products' | 'tables' | 'orders' | 'kds';
  timestamp: Date;
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
  
  private autoSyncInterval: any = null;
  private isSyncing = false;
  private readonly AUTO_SYNC_INTERVAL = 1000; // 1 segundo - sincronización instantánea
  
  // Observable para notificar cambios a componentes
  private syncCompleted$ = new Subject<SyncEvent>();
  public onSyncCompleted = this.syncCompleted$.asObservable();

  constructor(
    private http: HttpClient,
    private db: DatabaseService
  ) {
    this.initAutoSync();
  }
  
  private async initAutoSync() {
    // Verificar conexión inicial
    await this.checkConnection();
    
    // Iniciar sincronización automática
    this.startAutoSync();
    
    // Verificar conexión cada 30 segundos
    setInterval(() => this.checkConnection(), 30000);
  }
  
  private startAutoSync() {
    // Limpiar intervalo anterior si existe
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    // Sincronización automática cada 1 segundo (1000ms)
    this.autoSyncInterval = setInterval(async () => {
      if (this.syncStatus.isOnline && !this.isSyncing) {
        await this.fullSync();
      }
    }, 1000); // Cambiado a 1 segundo para sincronización en tiempo real
  }
  
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
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
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/health`, {
          observe: 'response'
        }).pipe(
          timeout(10000)
        )
      );
      
      this.syncStatus.isOnline = true;
      console.log('Backend online');
      return true;
    } catch (error: any) {
      this.syncStatus.isOnline = false;
      console.log('Backend offline');
      return false;
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // ============================================
  // SINCRONIZACIÓN DE PRODUCTOS
  // ============================================

  async fullSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sincronización ya en progreso, saltando...');
      return;
    }
    
    if (!this.syncStatus.isOnline) {
      console.log('No se puede sincronizar: backend offline');
      return;
    }
    
    try {
      this.isSyncing = true;
      console.log('Iniciando sincronización completa...');
      
      // Sincronizar productos
      await this.syncProducts();
      this.syncCompleted$.next({ entity: 'products', timestamp: new Date() });
      
      // Sincronizar modifiers (catálogo)
      await this.syncModifiers();
      
      // IMPORTANTE: Sincronizar órdenes ANTES que mesas
      // Así las órdenes se crean en backend primero y las mesas pueden referenciarlas
      await this.syncOrders();
      this.syncCompleted$.next({ entity: 'orders', timestamp: new Date() });
      
      // Sincronizar tickets KDS (estados de cocina)
      await this.syncKdsTickets();
      this.syncCompleted$.next({ entity: 'kds', timestamp: new Date() });
      
      // Sincronizar mesas (ahora pueden usar current_order_id del backend)
      await this.syncTables();
      this.syncCompleted$.next({ entity: 'tables', timestamp: new Date() });
      
      this.syncStatus.lastSync = new Date();
      console.log('Sincronización completa exitosa');
    } catch (error) {
      console.error('Error en sincronización completa:', error);
    } finally {
      this.isSyncing = false;
    }
  }

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
        // Obtener el ID del backend (puede venir como idBackend o id)
        const backendId = product.idBackend || product.id_backend || product.id;
        
        // SALTAR productos que acabamos de crear/actualizar (evita duplicados)
        if (processedIds.has(backendId)) {
          console.log(`Saltando ${product.name} (ya procesado)`);
          continue;
        }

        // Verificar si ya existe (por id_backend O id_local)
        const existing = await this.db.executeQuery<any>(
          'SELECT id_local, id_backend FROM products WHERE id_backend = ? OR id_local = ?',
          [backendId, backendId]
        );

        if (existing && existing.length > 0) {
          // ACTUALIZAR producto existente
          const localId = existing[0].id_local;
          await this.db.executeQuery(`
            UPDATE products 
            SET id_backend = ?, name = ?, price = ?, category = ?, active = ?
            WHERE id_local = ?
          `, [
            backendId,
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
            backendId, // usar id del backend como id_local para nuevos
            backendId, // id_backend
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
  // SINCRONIZACIÓN DE USUARIOS
  // ============================================

  async syncUsers(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar usuarios: backend offline');
      return;
    }

    try {
      console.log('Sincronizando usuarios...');
      
      // PASO 1: Obtener usuarios locales que NO tienen id_backend
      const localUsers = await this.db.executeQuery<any>(`
        SELECT * FROM users WHERE id_backend IS NULL AND deleted_at IS NULL
      `);

      // PASO 2: Crear usuarios locales en el backend
      for (const user of localUsers) {
        try {
          const response: any = await firstValueFrom(
            this.http.post(`${this.apiUrl}/users`, {
              username: user.username,
              pin: user.pin,
              roleId: user.role_id,
              active: user.active === 1
            }, {
              headers: this.getAuthHeaders()
            })
          );

          const backendId = response.idLocal || response.id_local || response.id;
          
          // Actualizar id_backend del usuario local
          await this.db.executeQuery(
            'UPDATE users SET id_backend = ? WHERE id_local = ?',
            [backendId, user.id_local]
          );
          
          console.log(`Usuario ${user.username} sincronizado con backend: ${backendId}`);
          
          // Si es el usuario logueado, actualizar localStorage
          const currentUserStr = localStorage.getItem('current_user');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.id_local === user.id_local) {
              currentUser.id_backend = backendId;
              localStorage.setItem('current_user', JSON.stringify(currentUser));
              console.log('Usuario logueado actualizado en localStorage');
            }
          }
        } catch (error: any) {
          // Si el usuario ya existe en backend (error 409 o similar), intentar obtenerlo
          if (error.status === 409 || error.status === 400) {
            try {
              const existingUsers = await firstValueFrom(
                this.http.get<any[]>(`${this.apiUrl}/users`, {
                  headers: this.getAuthHeaders()
                })
              );
              
              const matchingUser = existingUsers.find(u => u.username === user.username);
              if (matchingUser) {
                const backendId = matchingUser.idLocal || matchingUser.id_local || matchingUser.id;
                await this.db.executeQuery(
                  'UPDATE users SET id_backend = ? WHERE id_local = ?',
                  [backendId, user.id_local]
                );
                console.log(`Usuario ${user.username} vinculado con backend existente: ${backendId}`);
                
                // Actualizar localStorage si es el usuario logueado
                const currentUserStr = localStorage.getItem('current_user');
                if (currentUserStr) {
                  const currentUser = JSON.parse(currentUserStr);
                  if (currentUser.id_local === user.id_local) {
                    currentUser.id_backend = backendId;
                    localStorage.setItem('current_user', JSON.stringify(currentUser));
                  }
                }
              }
            } catch (fetchError) {
              console.error(`Error obteniendo usuario ${user.username} del backend:`, fetchError);
            }
          } else {
            console.error(`Error sincronizando usuario ${user.username}:`, error);
          }
        }
      }

      console.log('Usuarios sincronizados correctamente');

    } catch (error) {
      console.error('Error sincronizando usuarios:', error);
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
      
      // PASO 1: Enviar cambios locales pendientes al backend y obtener IDs procesados
      const processedIds = await this.pushLocalTableChanges();
      
      // PASO 2: Obtener mesas del backend
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/tables`, {
          headers: this.getAuthHeaders()
        })
      );

      console.log(`Recibidas ${response.length} mesas del backend`);

      // PASO 3: UPSERT mesas del backend (EXCEPTO las que acabamos de subir)
      for (const table of response) {
        const tableId = table.id;
        
        // SALTAR mesas que acabamos de actualizar (evita sobrescribir cambios locales)
        if (processedIds.has(tableId)) {
          console.log(`Saltando mesa ${table.name} (ya procesada)`);
          continue;
        }

        // Verificar si la mesa existe
        const existing = await this.db.executeQuery<any>(
          'SELECT id FROM tables WHERE id = ?',
          [tableId]
        );

        if (existing && existing.length > 0) {
          // ACTUALIZAR mesa existente
          await this.db.executeQuery(`
            UPDATE tables 
            SET level_id = ?, name = ?, status = ?, current_order_id = ?,
                owner_device_id = ?, locked_at = ?, updated_at = ?
            WHERE id = ?
          `, [
            table.levelId,
            table.name,
            table.status,
            table.currentOrderId,
            table.ownerDeviceId,
            table.lockedAt,
            table.updatedAt,
            tableId
          ]);
          console.log(`Actualizada: ${table.name} (status: ${table.status})`);
        } else {
          // INSERTAR nueva mesa
          await this.db.executeQuery(`
            INSERT INTO tables (
              id, level_id, name, status, current_order_id,
              owner_device_id, locked_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            tableId,
            table.levelId,
            table.name,
            table.status,
            table.currentOrderId,
            table.ownerDeviceId,
            table.lockedAt,
            table.updatedAt
          ]);
          console.log(`Insertada: ${table.name}`);
        }
      }

      this.syncStatus.lastSync = new Date();
      console.log('Mesas sincronizadas correctamente');

    } catch (error) {
      console.error('Error sincronizando mesas:', error);
      throw error;
    }
  }
  
  /**
   * Envía cambios locales de mesas al backend
   * Retorna Set de IDs procesados para evitar sobrescribirlos después
   */
  private async pushLocalTableChanges(): Promise<Set<number>> {
    const processedIds = new Set<number>();
    
    try {
      // Obtener mesas que tienen cambios pendientes en sync_queue
      const pendingTables = await this.db.executeQuery<any>(`
        SELECT DISTINCT t.* 
        FROM tables t
        INNER JOIN sync_queue sq ON sq.entity_id = CAST(t.id AS TEXT) AND sq.entity = 'table'
        WHERE t.deleted_at IS NULL
      `);

      if (pendingTables.length > 0) {
        console.log(`Enviando ${pendingTables.length} mesas al backend...`);
      }

      for (const table of pendingTables) {
        try {
          // Si la mesa tiene current_order_id, verificar si existe en backend
          let backendOrderId = table.current_order_id;
          
          if (table.current_order_id) {
            const orderCheck = await this.db.executeQuery<any>(
              'SELECT id_backend FROM orders WHERE id_local = ?',
              [table.current_order_id]
            );
            
            if (orderCheck && orderCheck.length > 0 && orderCheck[0].id_backend) {
              // Usar el ID del backend si existe
              backendOrderId = orderCheck[0].id_backend;
            } else {
              // Si la orden no tiene id_backend aún, saltar esta mesa
              // La próxima sincronización la procesará cuando la orden tenga id_backend
              console.log(`⏭ Saltando mesa ${table.name} - orden aún no sincronizada`);
              continue;
            }
          }
          
          // Actualizar mesa en backend
          await firstValueFrom(
            this.http.put(`${this.apiUrl}/tables/${table.id}`, {
              levelId: table.level_id,
              name: table.name,
              status: table.status,
              currentOrderId: backendOrderId,
              ownerDeviceId: table.owner_device_id
            }, {
              headers: this.getAuthHeaders()
            })
          );
          
          processedIds.add(table.id);
          console.log(`Mesa ${table.name} actualizada en backend (status: ${table.status})`);
          
          // Limpiar de cola de sincronización
          await this.db.executeQuery(
            'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
            ['table', table.id.toString()]
          );
        } catch (error) {
          console.error(`Error actualizando mesa ${table.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error enviando cambios de mesas:', error);
    }
    
    return processedIds;
  }
  
  async syncOrders(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar órdenes: backend offline');
      return;
    }

    try {
      console.log('Sincronizando órdenes...');
      
      // PASO 1: Enviar órdenes locales pendientes al backend y obtener IDs procesados
      const processedIds = await this.pushLocalOrderChanges();

      // PASO 2: Obtener órdenes del backend
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/orders`, {
          headers: this.getAuthHeaders()
        })
      );

      console.log(`Recibidas ${response.length} órdenes del backend`);

      // PASO 3: UPSERT órdenes del backend (EXCEPTO las que acabamos de subir)
      for (const order of response) {
        const backendId = order.idBackend || order.id_backend || order.id;
        
        // SALTAR órdenes que acabamos de crear/actualizar
        if (processedIds.has(backendId)) {
          console.log(`Saltando orden ${backendId} (ya procesada)`);
          continue;
        }
        
        const existing = await this.db.executeQuery<any>(
          'SELECT id_local, id_backend FROM orders WHERE id_backend = ? OR id_local = ?',
          [backendId, backendId]
        );

        const localOrderId = existing && existing.length > 0 ? existing[0].id_local : backendId;

        if (existing && existing.length > 0) {
          // Actualizar orden existente
          await this.db.executeQuery(`
            UPDATE orders 
            SET id_backend = ?, table_id = ?, status = ?, notes = ?, device_id = ?, updated_at = ?
            WHERE id_local = ?  
          `, [backendId, order.tableId, order.status, order.notes, order.deviceId, order.updatedAt, localOrderId]);
        } else {
          // Insertar nueva orden
          await this.db.executeQuery(`
            INSERT INTO orders (id_local, id_backend, table_id, status, notes, device_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [backendId, backendId, order.tableId, order.status, order.notes, order.deviceId, order.createdAt, order.updatedAt]);
        }

        // PASO 4: Sincronizar items de la orden
        if (order.items && order.items.length > 0) {
          // Eliminar items antiguos para evitar duplicados
          await this.db.executeQuery('DELETE FROM order_items WHERE order_id = ?', [localOrderId]);

          for (const item of order.items) {
            const itemId = item.idLocal || item.id_local || item.id || `ITEM-${Date.now()}-${Math.random()}`;
            
            // Insertar item
            await this.db.executeQuery(`
              INSERT INTO order_items (id_local, order_id, product_id, quantity, price, notes)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [itemId, localOrderId, item.productId, item.quantity, item.price, item.notes || null]);

            // Insertar modificadores del item
            if (item.modifiers && item.modifiers.length > 0) {
              // Eliminar modificadores antiguos
              await this.db.executeQuery('DELETE FROM order_item_modifiers WHERE order_item_id = ?', [itemId]);
              
              for (const modifier of item.modifiers) {
                await this.db.executeQuery(`
                  INSERT INTO order_item_modifiers (order_item_id, modifier)
                  VALUES (?, ?)
                `, [itemId, modifier.modifier || modifier]);
              }
            }
          }
        }

        // PASO 5: Actualizar current_order_id de la mesa si la orden está activa
        if (order.status !== 'CLOSED' && order.status !== 'CANCELLED') {
          await this.db.executeQuery(`
            UPDATE tables 
            SET current_order_id = ?, 
                status = CASE 
                  WHEN ? = 'SENT' OR ? = 'PENDING' THEN 'OCCUPIED'
                  WHEN ? = 'PAYING' THEN 'PAYING'
                  ELSE status 
                END,
                updated_at = ?
            WHERE id = ?
          `, [localOrderId, order.status, order.status, order.status, order.updatedAt, order.tableId]);
        }
      }

      this.syncStatus.lastSync = new Date();
      console.log('Órdenes sincronizadas correctamente');

    } catch (error) {
      console.error('Error sincronizando órdenes:', error);
      throw error;
    }
  }

  /**
   * Envía cambios locales de órdenes al backend
   * Retorna Set de IDs procesados para evitar sobrescribirlos después
   */
  private async pushLocalOrderChanges(): Promise<Set<string>> {
    const processedIds = new Set<string>();
    
    try {
      // Obtener órdenes que tienen cambios pendientes en sync_queue
      const pendingOrders = await this.db.executeQuery<any>(`
        SELECT DISTINCT o.* 
        FROM orders o
        INNER JOIN sync_queue sq ON sq.entity_id = o.id_local AND sq.entity = 'order'
        WHERE o.deleted_at IS NULL
      `);

      if (pendingOrders.length > 0) {
        console.log(`Enviando ${pendingOrders.length} órdenes al backend...`);
      }

      for (const order of pendingOrders) {
        try {
          if (!order.id_backend) {
            console.log(`Procesando orden ${order.id_local}...`);
            
            // Obtener items de la orden CON modificadores
            const orderItems = await this.db.executeQuery<any>(`
              SELECT oi.*, p.name as product_name, p.id_backend as product_backend_id,
                     GROUP_CONCAT(oim.modifier) as modifiers
              FROM order_items oi
              LEFT JOIN products p ON p.id_local = oi.product_id
              LEFT JOIN order_item_modifiers oim ON oi.id_local = oim.order_item_id
              WHERE oi.order_id = ? AND oi.deleted_at IS NULL
              GROUP BY oi.id_local
            `, [order.id_local]);

            if (orderItems.length === 0) {
              console.warn(`Orden ${order.id_local} no tiene items, saltando...`);
              continue;
            }

            // Validar que todos los productos tengan id_backend
            const itemsWithoutBackendId = orderItems.filter((item: any) => !item.product_backend_id);
            if (itemsWithoutBackendId.length > 0) {
              console.warn(`Orden ${order.id_local} tiene productos sin id_backend, esperando sincronización de productos...`);
              console.warn(`Productos sin sincronizar: ${itemsWithoutBackendId.map((i: any) => i.product_name).join(', ')}`);
              continue; // Saltar esta orden hasta que los productos se sincronicen
            }

            console.log(`Items raw de orden ${order.id_local}:`, orderItems);

            // Formatear items para el backend - USAR id_backend de productos y cargar modificadores
            const items = orderItems.map((item: any) => ({
              productId: item.product_backend_id, // SIEMPRE usar id_backend del producto
              quantity: item.quantity,
              price: item.price,
              notes: item.notes || undefined,
              modifiers: item.modifiers ? item.modifiers.split(',').filter((m: string) => m.trim()) : []
            }));

            console.log(`Items formateados para backend:`, items);

            // Verificar que todos los productos tienen backend ID
            const invalidItems = items.filter(item => !item.productId);
            if (invalidItems.length > 0) {
              console.error(`Orden ${order.id_local} tiene ${invalidItems.length} items sin backend ID`);
              continue;
            }

            // Obtener userId - DEBE ser un UUID válido del backend
            let userId = null;
            
            // OPCIÓN 1: Intentar obtener de localStorage si tiene id_backend
            const userDataStr = localStorage.getItem('current_user');
            if (userDataStr) {
              try {
                const userData = JSON.parse(userDataStr);
                console.log(`userData completo:`, userData);
                // SOLO usar id_backend si existe (es un UUID del backend)
                if (userData.id_backend) {
                  userId = userData.id_backend;
                  console.log(`👤 Usuario detectado de localStorage (id_backend): ${userId}`);
                }
              } catch (e) {
                console.error('Error al parsear user data:', e);
              }
            }
            
            // OPCIÓN 2: Si no hay id_backend en local, obtener usuarios del backend
            if (!userId) {
              try {
                console.log('Obteniendo usuarios del backend...');
                const backendUsers: any = await firstValueFrom(
                  this.http.get(`${this.apiUrl}/users`, {
                    headers: this.getAuthHeaders()
                  })
                );
                
                if (backendUsers && backendUsers.length > 0) {
                  // Usar el primer usuario activo del backend
                  const activeUser = backendUsers.find((u: any) => u.active) || backendUsers[0];
                  userId = activeUser.idLocal || activeUser.id_local || activeUser.id;
                  console.log(`Usuario obtenido del backend: ${userId} (${activeUser.username})`);
                  
                  // Guardar el id_backend en el usuario local para futuras órdenes
                  const localUsers = await this.db.executeQuery<any>(`
                    SELECT id_local FROM users WHERE active = 1 LIMIT 1
                  `);
                  if (localUsers.length > 0) {
                    await this.db.executeQuery(
                      'UPDATE users SET id_backend = ? WHERE id_local = ?',
                      [userId, localUsers[0].id_local]
                    );
                    
                    // Actualizar localStorage si es el usuario actual
                    if (userDataStr) {
                      const userData = JSON.parse(userDataStr);
                      userData.id_backend = userId;
                      localStorage.setItem('current_user', JSON.stringify(userData));
                      console.log('id_backend guardado en localStorage');
                    }
                  }
                } else {
                  console.error('No hay usuarios en el backend');
                  continue;
                }
              } catch (error) {
                console.error('Error obteniendo usuarios del backend:', error);
                continue;
              }
            }
            
            if (!userId) {
              console.error('No se encontró userId válido, no se puede crear orden');
              continue;
            }

            console.log(`userId final seleccionado: ${userId}`);

            // Las mesas usan INTEGER como PK, NO UUID. El tableId es el mismo en frontend y backend
            const tableId = order.table_id;
            
            if (!tableId) {
              console.error(`Orden ${order.id_local} no tiene table_id`);
              continue;
            }

            // Preparar payload para el backend
            const orderPayload = {
              tableId: tableId,
              userId: userId,
              deviceId: order.device_id,
              notes: order.notes || undefined,
              status: order.status, // IMPORTANTE: Enviar el status de la orden (SENT)
              items: items
            };

            console.log(`Creando orden en backend con ${items.length} items...`);
            console.log(`Payload completo:`, JSON.stringify(orderPayload, null, 2));

            // Crear nueva orden
            const response: any = await firstValueFrom(
              this.http.post(`${this.apiUrl}/orders`, orderPayload, {
                headers: this.getAuthHeaders()
              })
            );
            
            const backendId = response.idBackend || response.id_backend || response.id;
            
            if (!backendId) {
              console.error('Backend no devolvió ID de orden');
              continue;
            }
            
            await this.db.executeQuery(
              'UPDATE orders SET id_backend = ? WHERE id_local = ?',
              [backendId, order.id_local]
            );
            
            processedIds.add(backendId);
            console.log(`Orden creada en backend: ${backendId} con ${items.length} items`);
            
            // Eliminar de sync_queue
            await this.db.executeQuery(
              'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
              ['order', order.id_local]
            );
          } else {
            // Actualizar orden existente
            console.log(`Actualizando orden ${order.id_backend}...`);
            
            // Las mesas usan INTEGER como PK, NO UUID. El tableId es el mismo en frontend y backend
            const tableId = order.table_id;
            
            if (!tableId) {
              console.error(`Orden ${order.id_backend} no tiene table_id para actualizar`);
              continue;
            }
            
            await firstValueFrom(
              this.http.put(`${this.apiUrl}/orders/${order.id_backend}`, {
                tableId: tableId, // TableId es INTEGER, el mismo valor en frontend y backend
                status: order.status,
                totalAmount: order.total_amount,
                notes: order.notes
              }, {
                headers: this.getAuthHeaders()
              })
            );
            
            processedIds.add(order.id_backend);
            console.log(`Orden actualizada: ${order.id_backend}`);
            
            // Eliminar de sync_queue
            await this.db.executeQuery(
              'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
              ['order', order.id_local]
            );
          }
        } catch (error: any) {
          console.error(`Error sincronizando orden ${order.id_local}:`);
          console.error(`Status: ${error.status}`);
          console.error(`Message: ${error.message}`);
          console.error(`Error completo:`, error);
          if (error.error) {
            console.error(`Error del backend:`, error.error);
          }
        }
      }
    } catch (error) {
      console.error('Error enviando cambios de órdenes:', error);
    }
    
    return processedIds;
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
      
      // PASO 1: Enviar cambios locales pendientes al backend y obtener IDs procesados
      const processedIds = await this.pushLocalModifierChanges();

      // PASO 2: Obtener modifiers del backend
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/modifiers`, {
          headers: this.getAuthHeaders()
        })
      );

      console.log(`Recibidos ${response.length} modificadores del backend`);

      // PASO 3: UPSERT modifiers del backend (EXCEPTO los que acabamos de subir)
      const db = this.db.getDB();
      for (const modifier of response) {
        const backendId = modifier.id;
        
        // SALTAR modifiers que acabamos de crear/actualizar (evita duplicados)
        if (processedIds.has(backendId)) {
          console.log(`Saltando ${modifier.name} (ya procesado)`);
          continue;
        }

        // Verificar si ya existe (por id_backend)
        const existing = await db.query(
          'SELECT id, id_backend FROM modifiers WHERE id_backend = ?',
          [backendId]
        );

        if (existing.values && existing.values.length > 0) {
          // ACTUALIZAR modifier existente
          const localId = existing.values[0].id;
          await db.run(`
            UPDATE modifiers 
            SET name = ?, type = ?, category = ?
            WHERE id = ?
          `, [
            modifier.name,
            modifier.type,
            modifier.category || 'Todos',
            localId
          ]);
          console.log(`Actualizado: ${modifier.name} (id_local: ${localId})`);
        } else {
          // INSERTAR nuevo modifier (no existe en local)
          await db.run(`
            INSERT INTO modifiers (name, type, category, id_backend) 
            VALUES (?, ?, ?, ?)
          `, [
            modifier.name,
            modifier.type,
            modifier.category || 'Todos',
            backendId
          ]);
          console.log(`Insertado: ${modifier.name}`);
        }
      }

      console.log('Modificadores sincronizados correctamente');

    } catch (error) {
      console.error('Error sincronizando modificadores:', error);
    }
  }

  private async pushLocalModifierChanges(): Promise<Set<number>> {
    const processedIds = new Set<number>();
    const db = this.db.getDB();
    
    try {
      // Obtener modifiers locales sin id_backend (nuevos) o todos para actualizar
      const result = await db.query(`
        SELECT * FROM modifiers 
        WHERE deleted_at IS NULL
      `);

      const pendingModifiers = result.values || [];

      if (pendingModifiers.length === 0) {
        console.log('No hay cambios locales de modificadores pendientes');
        return processedIds;
      }

      console.log(`Enviando ${pendingModifiers.length} cambios de modificadores al backend...`);

      for (const modifier of pendingModifiers) {
        try {
          // Si tiene id_backend, actualizar
          if (modifier.id_backend) {
            await firstValueFrom(
              this.http.put(`${this.apiUrl}/modifiers/${modifier.id_backend}`, {
                name: modifier.name,
                type: modifier.type,
                category: modifier.category || 'Todos'
              }, {
                headers: this.getAuthHeaders()
              })
            );
            console.log(`Modifier actualizado en backend: ${modifier.name}`);
            processedIds.add(modifier.id_backend);
          } else {
            // No tiene id_backend, crear nuevo en backend
            const response: any = await firstValueFrom(
              this.http.post(`${this.apiUrl}/modifiers`, {
                name: modifier.name,
                type: modifier.type,
                category: modifier.category || 'Todos'
              }, {
                headers: this.getAuthHeaders()
              })
            );
            
            const backendId = response.id;
            
            // Guardar id_backend (SIN cambiar el id local)
            await db.run(
              'UPDATE modifiers SET id_backend = ? WHERE id = ?',
              [backendId, modifier.id]
            );
            console.log(`Modifier creado en backend: ${modifier.name} (ID backend: ${backendId})`);
            processedIds.add(backendId);
          }
        } catch (error) {
          console.error(`Error sincronizando modifier ${modifier.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error obteniendo cambios locales:', error);
    }
    
    return processedIds;
  }

  // ============================================
  // SINCRONIZACIÓN DE TICKETS KDS (Kitchen Display System)
  // ============================================

  private async pushKdsTicketUpdates(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      return;
    }

    try {
      const db = this.db.getDB();
      
      // Obtener tickets con cambios pendientes desde sync_queue
      const result = await db.query(`
        SELECT DISTINCT kt.* 
        FROM kds_tickets kt
        INNER JOIN sync_queue sq ON sq.entity_id = CAST(kt.id AS TEXT)
        WHERE sq.entity = 'kds_ticket'
        AND kt.deleted_at IS NULL
      `);

      const ticketsToUpdate = result.values || [];

      for (const ticket of ticketsToUpdate) {
        try {
          // Actualizar estado del ticket en backend
          await lastValueFrom(
            this.http.put(
              `${this.apiUrl}/kds/${ticket.id}/status`,
              { status: ticket.status },
              { headers: this.getAuthHeaders() }
            )
          );

          // Eliminar de sync_queue después de sincronizar
          await db.run(
            'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
            ['kds_ticket', ticket.id.toString()]
          );

          console.log(`✅ Ticket KDS #${ticket.id} actualizado en backend (estado: ${ticket.status})`);
        } catch (error) {
          console.error(`❌ Error al actualizar ticket KDS #${ticket.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error al sincronizar actualizaciones de tickets KDS:', error);
    }
  }

  async syncKdsTickets(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar tickets KDS: backend offline');
      return;
    }

    try {
      console.log('Sincronizando tickets KDS...');
      
      // PASO 1: Subir actualizaciones locales de tickets al backend
      await this.pushKdsTicketUpdates();
      
      // PASO 2: Obtener tickets activos del backend (NEW e IN_PROGRESS)
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/kds/active`, {
          headers: this.getAuthHeaders()
        })
      );

      console.log(`Recibidos ${response.length} tickets KDS activos del backend`);

      const db = this.db.getDB();
      
      // UPSERT tickets del backend en la base de datos local
      for (const ticket of response) {
        const ticketId = ticket.id;
        const orderId = ticket.orderId || ticket.order_id;
        
        // Verificar si el ticket ya existe localmente
        const existingResult = await db.query(
          'SELECT id FROM kds_tickets WHERE id = ?',
          [ticketId]
        );

        if (existingResult.values && existingResult.values.length > 0) {
          // ACTUALIZAR ticket existente
          await db.run(`
            UPDATE kds_tickets 
            SET order_id = ?, status = ?, started_at = ?, finished_at = ?
            WHERE id = ?
          `, [
            orderId,
            ticket.status,
            ticket.startedAt || ticket.started_at || null,
            ticket.finishedAt || ticket.finished_at || null,
            ticketId
          ]);
          console.log(`Actualizado ticket KDS #${ticketId} - Estado: ${ticket.status}`);
        } else {
          // INSERTAR nuevo ticket
          await db.run(`
            INSERT INTO kds_tickets (
              id, order_id, status, started_at, finished_at
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            ticketId,
            orderId,
            ticket.status,
            ticket.startedAt || ticket.started_at || null,
            ticket.finishedAt || ticket.finished_at || null
          ]);
          console.log(`Insertado ticket KDS #${ticketId} para orden ${orderId}`);
        }
      }

      // Marcar como DONE los tickets locales que ya no están activos en el backend
      const localActiveResult = await db.query(`
        SELECT id FROM kds_tickets 
        WHERE status IN ('NEW', 'IN_PROGRESS') 
        AND deleted_at IS NULL
      `);

      const localActiveTickets = localActiveResult.values || [];
      const backendTicketIds = new Set(response.map(t => t.id));
      
      for (const localTicket of localActiveTickets) {
        if (!backendTicketIds.has(localTicket.id)) {
          // Este ticket ya no está activo en el backend, marcarlo como DONE localmente
          await db.run(`
            UPDATE kds_tickets 
            SET status = 'DONE', finished_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [localTicket.id]);
          console.log(`Ticket KDS #${localTicket.id} marcado como DONE (ya no está en backend)`);
        }
      }

      this.syncStatus.lastSync = new Date();
      console.log('Tickets KDS sincronizados correctamente');

    } catch (error) {
      console.error('Error sincronizando tickets KDS:', error);
      // No lanzar error para no detener el resto de la sincronización
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
            
            // Obtener el ID del backend (puede venir como idBackend o id)
            const backendId = response.idBackend || response.id_backend || response.id;
            
            // SOLO actualizar id_backend (NO cambiar id_local que es PRIMARY KEY)
            await this.db.executeQuery(
              'UPDATE products SET id_backend = ? WHERE id_local = ?',
              [backendId, product.id_local]
            );
            console.log(`Producto creado en backend: ${product.name} (ID: ${backendId})`);
            processedIds.add(backendId); // Marcar como procesado
            
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
  // SINCRONIZACIÓN MANUAL (llamado desde UI)
  // ============================================

  async manualSync(): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar conexión primero
      const isOnline = await this.checkConnection();
      
      if (!isOnline) {
        return {
          success: false,
          message: 'No hay conexión con el backend'
        };
      }
      
      // Ejecutar sincronización completa
      await this.fullSync();
      
      return {
        success: true,
        message: `Sincronización exitosa - ${new Date().toLocaleTimeString()}`
      };
    } catch (error: any) {
      console.error('Error en sincronización manual:', error);
      return {
        success: false,
        message: `Error: ${error.message || 'Error desconocido'}`
      };
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE ACTUALIZACIONES DE ÓRDENES
  // ============================================

  private async syncOrderUpdates(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      return;
    }

    try {
      const db = this.db.getDB();
      
      // Obtener órdenes que tienen cambios pendientes en sync_queue y ya tienen id_backend
      const result = await db.query(`
        SELECT DISTINCT o.* 
        FROM orders o
        INNER JOIN sync_queue sq ON sq.entity_id = o.id_local 
        WHERE o.id_backend IS NOT NULL 
        AND sq.entity = 'order'
        AND o.deleted_at IS NULL
      `);

      const ordersToUpdate = result.values || [];

      for (const order of ordersToUpdate) {
        try {
          // Mapear kitchen_status del móvil a kitchenStatus del backend
          const updateData: any = {
            status: order.status,
            printed: order.printed || 0  // SIEMPRE enviar printed (0 o 1)
          };
          
          // Solo incluir kitchenStatus si existe y no es null
          if (order.kitchen_status) {
            updateData.kitchenStatus = order.kitchen_status;
          }
          
          // Solo incluir notes si existe y no es null
          if (order.notes) {
            updateData.notes = order.notes;
          }
          
          console.log(`📤 Sincronizando orden ${order.id_local} (backend: ${order.id_backend}):`, {
            status: order.status,
            kitchen_status: order.kitchen_status,
            printed: order.printed,
            updateData
          });
          
          // Actualizar orden en backend con su nuevo estado
          await lastValueFrom(
            this.http.put(`${this.apiUrl}/orders/${order.id_backend}`, updateData, {
              headers: this.getAuthHeaders()
            })
          );

          // Eliminar de sync_queue después de sincronizar exitosamente
          await db.run(
            'DELETE FROM sync_queue WHERE entity = ? AND entity_id = ?',
            ['order', order.id_local]
          );

          console.log(`✅ Orden ${order.id_local} actualizada en backend (estado: ${order.status})`);
        } catch (error) {
          console.error(`❌ Error al actualizar orden ${order.id_local}:`, error);
          // No eliminamos de sync_queue si falla, se reintentará en próxima sincronización
        }
      }
    } catch (error) {
      console.error('Error al sincronizar actualizaciones de órdenes:', error);
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE ÓRDENES PENDIENTES (legacy)
  // ============================================

  async syncPendingOrders(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('No se pueden sincronizar órdenes: backend offline');
      return;
    }

    try {
      console.log('Sincronizando órdenes pendientes...');
      
      // PASO 1: Sincronizar actualizaciones de órdenes existentes (en sync_queue)
      await this.syncOrderUpdates();

      // PASO 2: Obtener órdenes con idBackend = null (creadas offline)
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
              status: order.status,  // Enviar el status actual (SENT, OPEN, etc)
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
