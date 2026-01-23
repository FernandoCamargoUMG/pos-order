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
    if (!productCategory) {
      return this.getModifiersByType(type);
    }
    
    const result = await this.dbService.executeQuery<Modifier>(
      `SELECT * FROM modifiers WHERE type = ? AND (category = ? OR category = 'Todos') AND deleted_at IS NULL ORDER BY name`,
      [type, productCategory]
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
    console.log(`🔄 Actualizando modifier con ID: ${id}`, modifier);
    
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

    if (fields.length === 0) {
      console.log('⚠️ No hay campos para actualizar');
      return;
    }

    values.push(id);
    const query = `UPDATE modifiers SET ${fields.join(', ')} WHERE id = ?`;
    console.log('Query:', query, 'Values:', values);
    
    await this.dbService.run(query, values);
    console.log(`✅ Modifier ${id} actualizado`);
  }

  /**
   * Elimina (soft delete) un modificador
   */
  async deleteModifier(id: number): Promise<void> {
    const now = new Date().toISOString();
    await this.dbService.run(
      `UPDATE modifiers SET deleted_at = ? WHERE id = ?`,
      [now, id]
    );
  }
}
