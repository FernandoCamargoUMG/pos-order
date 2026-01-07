import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

export interface Modifier {
  id?: number;
  name: string;
  type: 'EXCLUDE' | 'EXTRA' | 'COOKING';
  category?: 'Bebidas' | 'Comida' | 'Todos';
  deleted_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModifierService {
  constructor(private dbService: DatabaseService) {}

  /**
   * Obtiene todos los modificadores activos agrupados por tipo
   */
  async getAllModifiers(): Promise<Modifier[]> {
    const result = await this.dbService.executeQuery<Modifier>(
      `SELECT * FROM modifiers WHERE deleted_at IS NULL ORDER BY type, name`,
      []
    );
    return result;
  }

  /**
   * Obtiene modificadores por tipo
   */
  async getModifiersByType(type: 'EXCLUDE' | 'EXTRA' | 'COOKING'): Promise<Modifier[]> {
    const result = await this.dbService.executeQuery<Modifier>(
      `SELECT * FROM modifiers WHERE type = ? AND deleted_at IS NULL ORDER BY name`,
      [type]
    );
    return result;
  }

  /**
   * Obtiene modificadores por tipo y categoría de producto
   */
  async getModifiersByTypeAndCategory(type: 'EXCLUDE' | 'EXTRA' | 'COOKING', productCategory?: string): Promise<Modifier[]> {
    // Si el producto no tiene categoría, mostrar todos
    if (!productCategory) {
      return this.getModifiersByType(type);
    }

    // Determinar si el producto es bebida o comida
    // Si la categoría del producto contiene "Bebida", "Coca", "Jugo", etc. es bebida
    // De lo contrario, es comida
    const isBebida = productCategory.toLowerCase().includes('bebida') || 
                     productCategory.toLowerCase().includes('coca') ||
                     productCategory.toLowerCase().includes('jugo') ||
                     productCategory.toLowerCase().includes('refresco') ||
                     productCategory.toLowerCase().includes('agua');
    
    const modifierCategory = isBebida ? 'Bebidas' : 'Comida';

    // Obtener modificadores que sean para 'Todos' o que coincidan con el tipo de producto
    const result = await this.dbService.executeQuery<Modifier>(
      `SELECT * FROM modifiers 
       WHERE type = ? 
       AND deleted_at IS NULL 
       AND (category IS NULL OR category = 'Todos' OR category = ?)
       ORDER BY name`,
      [type, modifierCategory]
    );
    return result;
  }

  /**
   * Crea un nuevo modificador
   */
  async createModifier(modifier: Omit<Modifier, 'id'>): Promise<void> {
    await this.dbService.run(
      `INSERT INTO modifiers (name, type, category) VALUES (?, ?, ?)`,
      [modifier.name, modifier.type, modifier.category || 'Todos']
    );
  }

  /**
   * Actualiza un modificador existente
   */
  async updateModifier(id: number, modifier: Partial<Omit<Modifier, 'id'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (modifier.name !== undefined) {
      fields.push('name = ?');
      values.push(modifier.name);
    }
    if (modifier.type !== undefined) {
      fields.push('type = ?');
      values.push(modifier.type);
    }
    if (modifier.category !== undefined) {
      fields.push('category = ?');
      values.push(modifier.category);
    }

    if (fields.length === 0) return;

    values.push(id);
    await this.dbService.run(
      `UPDATE modifiers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Elimina (soft delete) un modificador
   */
  async deleteModifier(id: number): Promise<void> {
    await this.dbService.run(
      `UPDATE modifiers SET deleted_at = datetime('now') WHERE id = ?`,
      [id]
    );
  }
}
