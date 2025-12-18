import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Table, TableStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  constructor(private dbService: DatabaseService) {}

  async getAllTables(): Promise<Table[]> {
    return await this.dbService.executeQuery<Table>(
      'SELECT * FROM tables WHERE deleted_at IS NULL ORDER BY level_id, id'
    );
  }

  async getTablesByLevel(levelId: number): Promise<Table[]> {
    return await this.dbService.executeQuery<Table>(
      'SELECT * FROM tables WHERE level_id = ? AND deleted_at IS NULL ORDER BY id',
      [levelId]
    );
  }

  async getTableById(id: number): Promise<Table | null> {
    const result = await this.dbService.executeQuery<Table>(
      'SELECT * FROM tables WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result && result.length > 0 ? result[0] : null;
  }

  async updateTableStatus(tableId: number, status: TableStatus): Promise<void> {
    await this.dbService.run(
      'UPDATE tables SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, tableId]
    );
  }

  async assignOrderToTable(tableId: number, orderId: string, deviceId: string): Promise<void> {
    await this.dbService.run(
      `UPDATE tables SET 
        status = 'OCCUPIED', 
        current_order_id = ?, 
        owner_device_id = ?,
        locked_at = datetime('now'),
        updated_at = datetime('now') 
      WHERE id = ?`,
      [orderId, deviceId, tableId]
    );
  }

  async releaseTable(tableId: number): Promise<void> {
    await this.dbService.run(
      `UPDATE tables SET 
        status = 'FREE', 
        current_order_id = NULL,
        owner_device_id = NULL,
        locked_at = NULL,
        updated_at = datetime('now') 
      WHERE id = ?`,
      [tableId]
    );
  }

  async setTablePaying(tableId: number): Promise<void> {
    await this.dbService.run(
      'UPDATE tables SET status = \'PAYING\', updated_at = datetime(\'now\') WHERE id = ?',
      [tableId]
    );
  }

  async createTable(levelId: number, name: string): Promise<void> {
    await this.dbService.run(
      `INSERT INTO tables (level_id, name, status, updated_at) 
       VALUES (?, ?, 'FREE', datetime('now'))`,
      [levelId, name]
    );
  }

  async updateTable(id: number, levelId: number, name: string): Promise<void> {
    await this.dbService.run(
      'UPDATE tables SET level_id = ?, name = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [levelId, name, id]
    );
  }

  async deleteTable(id: number): Promise<void> {
    // Soft delete
    await this.dbService.run(
      'UPDATE tables SET deleted_at = datetime(\'now\') WHERE id = ?',
      [id]
    );
  }

  getTableStatusColor(status: TableStatus): string {
    switch (status) {
      case 'FREE':
        return 'success';
      case 'OCCUPIED':
        return 'warning';
      case 'PAYING':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getTableStatusText(status: TableStatus): string {
    switch (status) {
      case 'FREE':
        return 'Libre';
      case 'OCCUPIED':
        return 'Ocupada';
      case 'PAYING':
        return 'Pagando';
      default:
        return 'Desconocido';
    }
  }
}
