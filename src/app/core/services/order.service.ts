import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

export interface Order {
  id_local: string;
  id_backend?: string;
  table_id: number;
  user_id?: string;
  device_id: string;
  status: 'OPEN' | 'SENT' | 'PAYING' | 'CLOSED';
  kitchen_status?: 'pending' | 'preparing' | 'ready';
  printed: number;
  conflict: number;
  conflict_reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface OrderItem {
  id_local: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes?: string;
  deleted_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private dbService: DatabaseService) {}

  /**
   * Actualiza una orden existente: elimina items viejos y agrega nuevos
   */
  async updateOrder(
    orderId: string,
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
      notes?: string;
      modifiers?: string[];
    }>
  ): Promise<void> {
    const db = this.dbService.getDB();

    try {
      // 1. Eliminar items viejos y sus modificadores
      const deleteModifiers = `
        DELETE FROM order_item_modifiers 
        WHERE order_item_id IN (
          SELECT id_local FROM order_items WHERE order_id = ?
        )
      `;
      await db.run(deleteModifiers, [orderId]);

      const deleteItems = `DELETE FROM order_items WHERE order_id = ?`;
      await db.run(deleteItems, [orderId]);

      // 2. Insertar nuevos items
      for (const item of items) {
        const itemId = `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const itemInsert = `
          INSERT INTO order_items (id_local, order_id, product_id, quantity, price, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.run(itemInsert, [itemId, orderId, item.productId, item.quantity, item.price, item.notes || null]);

        // 3. Insertar modificadores del item (si existen)
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modifier of item.modifiers) {
            const modifierInsert = `
              INSERT INTO order_item_modifiers (order_item_id, modifier)
              VALUES (?, ?)
            `;
            await db.run(modifierInsert, [itemId, modifier]);
          }
        }
      }

      console.log(`✅ Orden ${orderId} actualizada con ${items.length} items`);
    } catch (error) {
      console.error('❌ Error actualizando orden:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva orden con sus items en la base de datos
   * Soporta múltiples órdenes por mesa (cuentas separadas)
   */
  async createOrder(
    tableId: number,
    deviceId: string,
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
      notes?: string;
      modifiers?: string[];
    }>
  ): Promise<string> {
    const db = this.dbService.getDB();
    const orderId = `ORD-${Date.now()}`;
    const now = new Date().toISOString();

    try {
      // 1. Insertar orden
      const orderInsert = `
        INSERT INTO orders (id_local, table_id, device_id, status, printed, conflict, created_at)
        VALUES (?, ?, ?, ?, 0, 0, ?)
      `;
      await db.run(orderInsert, [orderId, tableId, deviceId, 'SENT', now]);

      // 2. Insertar items de la orden
      for (const item of items) {
        const itemId = `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const itemInsert = `
          INSERT INTO order_items (id_local, order_id, product_id, quantity, price, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.run(itemInsert, [itemId, orderId, item.productId, item.quantity, item.price, item.notes || null]);

        // 3. Insertar modificadores del item (si existen)
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modifier of item.modifiers) {
            const modifierInsert = `
              INSERT INTO order_item_modifiers (order_item_id, modifier)
              VALUES (?, ?)
            `;
            await db.run(modifierInsert, [itemId, modifier]);
          }
        }
      }

      console.log(`Orden ${orderId} creada con ${items.length} items`);
      return orderId;
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las órdenes activas de una mesa
   * CUENTAS SEPARADAS: Una mesa puede tener múltiples órdenes (diferentes customers)
   */
  async getOrdersByTable(tableId: number): Promise<Order[]> {
    const db = this.dbService.getDB();
    const query = `
      SELECT * FROM orders
      WHERE table_id = ? AND deleted_at IS NULL AND status != 'CLOSED'
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [tableId]);
    return result.values || [];
  }

  /**
   * Obtiene los items de una orden específica con sus modificadores
   */
  async getOrderItems(orderId: string): Promise<any[]> {
    const db = this.dbService.getDB();
    const query = `
      SELECT 
        oi.*,
        p.name as product_name,
        GROUP_CONCAT(oim.modifier, '|') as modifiers
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id_local
      LEFT JOIN order_item_modifiers oim ON oi.id_local = oim.order_item_id
      WHERE oi.order_id = ? AND oi.deleted_at IS NULL
      GROUP BY oi.id_local
    `;
    const result = await db.query(query, [orderId]);
    
    return (result.values || []).map((item: any) => ({
      ...item,
      modifiers: item.modifiers ? item.modifiers.split('|') : []
    }));
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateOrderStatus(orderId: string, status: 'OPEN' | 'SENT' | 'PAYING' | 'CLOSED'): Promise<void> {
    const db = this.dbService.getDB();
    const updateQuery = `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id_local = ?`;
    await db.run(updateQuery, [status, orderId]);
  }

  /**
   * Obtiene órdenes por estado
   */
  async getOrdersByStatus(status: string): Promise<Order[]> {
    const db = this.dbService.getDB();
    const query = `
      SELECT * FROM orders 
      WHERE status = ? AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const result = await db.query(query, [status]);
    return result.values || [];
  }

  /**
   * Actualiza el estado de cocina de una orden (para KDS)
   */
  async updateOrderKitchenStatus(orderId: string, kitchenStatus: 'pending' | 'preparing' | 'ready'): Promise<void> {
    const db = this.dbService.getDB();
    const updateQuery = `UPDATE orders SET kitchen_status = ?, updated_at = datetime('now') WHERE id_local = ?`;
    await db.run(updateQuery, [kitchenStatus, orderId]);
  }
}
