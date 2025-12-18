import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { UpsellingOption } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UpsellingService {
  constructor(private dbService: DatabaseService) {}

  async getAllOptions(): Promise<UpsellingOption[]> {
    return await this.dbService.executeQuery<UpsellingOption>(
      'SELECT * FROM upselling_options WHERE deleted_at IS NULL AND active = 1 ORDER BY sort_order, id'
    );
  }

  async getOptionById(id: number): Promise<UpsellingOption | null> {
    const result = await this.dbService.executeQuery<UpsellingOption>(
      'SELECT * FROM upselling_options WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result && result.length > 0 ? result[0] : null;
  }

  async createOption(option: Omit<UpsellingOption, 'id'>): Promise<void> {
    await this.dbService.run(
      `INSERT INTO upselling_options (title, description, price, type, active, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        option.title,
        option.description || '',
        option.price,
        option.type,
        option.active !== undefined ? option.active : 1,
        option.sort_order || 0
      ]
    );
  }

  async updateOption(id: number, option: Partial<UpsellingOption>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (option.title !== undefined) {
      updates.push('title = ?');
      params.push(option.title);
    }
    if (option.description !== undefined) {
      updates.push('description = ?');
      params.push(option.description);
    }
    if (option.price !== undefined) {
      updates.push('price = ?');
      params.push(option.price);
    }
    if (option.type !== undefined) {
      updates.push('type = ?');
      params.push(option.type);
    }
    if (option.active !== undefined) {
      updates.push('active = ?');
      params.push(option.active);
    }
    if (option.sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(option.sort_order);
    }

    if (updates.length > 0) {
      params.push(id);
      await this.dbService.run(
        `UPDATE upselling_options SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
  }

  async deleteOption(id: number): Promise<void> {
    await this.dbService.run(
      'UPDATE upselling_options SET deleted_at = datetime(\'now\') WHERE id = ?',
      [id]
    );
  }

  async toggleActive(id: number, active: boolean): Promise<void> {
    await this.dbService.run(
      'UPDATE upselling_options SET active = ? WHERE id = ?',
      [active ? 1 : 0, id]
    );
  }
}
