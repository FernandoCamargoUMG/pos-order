import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Product } from '../models';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private db: DatabaseService) {}

  async getAllProducts(includeDeleted: boolean = false): Promise<Product[]> {
    const query = includeDeleted 
      ? 'SELECT * FROM products ORDER BY category, name'
      : 'SELECT * FROM products WHERE deleted_at IS NULL ORDER BY category, name';
    
    return await this.db.executeQuery<Product>(query);
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await this.db.executeQuery<Product>(
      'SELECT * FROM products WHERE id_local = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.db.executeQuery<Product>(
      'SELECT * FROM products WHERE category = ? AND deleted_at IS NULL ORDER BY name',
      [category]
    );
  }

  async getCategories(): Promise<string[]> {
    const result = await this.db.executeQuery<any>(
      'SELECT DISTINCT category FROM products WHERE deleted_at IS NULL AND category IS NOT NULL ORDER BY category'
    );
    
    if (result) {
      return result.map((row: any) => row.category);
    }
    return [];
  }

  async createProduct(product: Omit<Product, 'id_local'>): Promise<Product> {
    const newProduct: Product = {
      id_local: uuidv4(),
      id_backend: product.id_backend,
      name: product.name,
      price: product.price,
      category: product.category,
      active: product.active ?? 1,
      deleted_at: undefined
    };

    const query = `
      INSERT INTO products (id_local, id_backend, name, price, category, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      newProduct.id_local,
      newProduct.id_backend || null,
      newProduct.name,
      newProduct.price,
      newProduct.category || null,
      newProduct.active
    ]);

    // Agregar a la cola de sincronización
    await this.addToSyncQueue(newProduct.id_local, 'CREATE');

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    // Verificar que el producto existe
    const existing = await this.getProductById(id);
    if (!existing) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.price !== undefined) {
      fields.push('price = ?');
      values.push(updates.price);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.active !== undefined) {
      fields.push('active = ?');
      values.push(updates.active);
    }

    if (fields.length === 0) {
      return existing;
    }

    values.push(id);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id_local = ?`;
    
    await this.db.run(query, values);

    // Agregar a la cola de sincronización
    await this.addToSyncQueue(id, 'UPDATE');

    return await this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    // Soft delete: marcar como eliminado
    const now = new Date().toISOString();
    await this.db.run(
      'UPDATE products SET deleted_at = ? WHERE id_local = ?',
      [now, id]
    );

    // Agregar a la cola de sincronización
    await this.addToSyncQueue(id, 'DELETE');

    return true;
  }

  async toggleProductStatus(id: string): Promise<Product | null> {
    const product = await this.getProductById(id);
    if (!product) {
      return null;
    }

    const newStatus = product.active === 1 ? 0 : 1;
    return await this.updateProduct(id, { active: newStatus });
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    return await this.db.executeQuery<Product>(
      `SELECT * FROM products 
       WHERE deleted_at IS NULL 
       AND (name LIKE ? OR category LIKE ?)
       ORDER BY category, name`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
  }

  private async addToSyncQueue(entityId: string, action: string): Promise<void> {
    try {
      await this.db.run(
        'INSERT INTO sync_queue (entity, entity_id, action) VALUES (?, ?, ?)',
        ['product', entityId, action]
      );
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async getProductCount(): Promise<number> {
    const result = await this.db.executeQuery<any>(
      'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
    );
    return result?.[0]?.count || 0;
  }

  async getActiveProductCount(): Promise<number> {
    const result = await this.db.executeQuery<any>(
      'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL AND active = 1'
    );
    return result?.[0]?.count || 0;
  }
}
