import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

export interface Modifier {
  id?: number;
  name: string;
  type: 'EXCLUDE' | 'EXTRA' | 'COOKING';
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
   * Crea un nuevo modificador
   */
  async createModifier(modifier: Omit<Modifier, 'id'>): Promise<void> {
    await this.dbService.run(
      `INSERT INTO modifiers (name, type) VALUES (?, ?)`,
      [modifier.name, modifier.type]
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
