import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';

export type KdsTicketStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

export interface KdsTicket {
  id?: number;
  order_id: string;
  status: KdsTicketStatus;
  started_at?: string;
  finished_at?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KdsService {
  
  constructor(private dbService: DatabaseService) {}

  /**
   * Crear un ticket KDS para una orden
   */
  async createTicket(orderId: string): Promise<void> {
    const db = this.dbService.getDB();
    
    // Verificar si ya existe un ticket para esta orden
    const existing = await db.query(
      'SELECT * FROM kds_tickets WHERE order_id = ? AND deleted_at IS NULL',
      [orderId]
    );

    if (existing.values && existing.values.length > 0) {
      return; // Ya existe un ticket
    }

    // Crear nuevo ticket
    await db.run(`
      INSERT INTO kds_tickets (order_id, status)
      VALUES (?, 'NEW')
    `, [orderId]);
  }

  /**
   * Actualizar estado de un ticket KDS
   */
  async updateTicketStatus(orderId: string, status: KdsTicketStatus): Promise<void> {
    const db = this.dbService.getDB();
    
    // Buscar el ticket por order_id
    const result = await db.query(
      'SELECT * FROM kds_tickets WHERE order_id = ? AND deleted_at IS NULL',
      [orderId]
    );

    if (!result.values || result.values.length === 0) {
      console.warn(`No se encontró ticket KDS para orden ${orderId}`);
      return;
    }

    const ticket = result.values[0];
    const now = "datetime('now', 'localtime')";

    let query = `UPDATE kds_tickets SET status = ?`;
    const params: any[] = [status];

    // Si está marcando como IN_PROGRESS y no tiene started_at, agregarlo
    if (status === 'IN_PROGRESS' && !ticket.started_at) {
      query += `, started_at = ${now}`;
    }

    // Si está marcando como DONE y no tiene finished_at, agregarlo
    if (status === 'DONE' && !ticket.finished_at) {
      query += `, finished_at = ${now}`;
    }

    query += ' WHERE order_id = ?';
    params.push(orderId);

    await db.run(query, params);

    // Agregar a sync_queue para sincronizar con backend
    if (ticket.id) {
      await db.run(
        'INSERT OR REPLACE INTO sync_queue (entity, entity_id) VALUES (?, ?)',
        ['kds_ticket', ticket.id.toString()]
      );
    }
  }

  /**
   * Obtener ticket por order_id
   */
  async getTicketByOrderId(orderId: string): Promise<KdsTicket | null> {
    const db = this.dbService.getDB();
    const result = await db.query(
      'SELECT * FROM kds_tickets WHERE order_id = ? AND deleted_at IS NULL',
      [orderId]
    );

    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  /**
   * Obtener todos los tickets activos (NEW e IN_PROGRESS)
   */
  async getActiveTickets(): Promise<KdsTicket[]> {
    const db = this.dbService.getDB();
    const result = await db.query(`
      SELECT * FROM kds_tickets 
      WHERE status IN ('NEW', 'IN_PROGRESS') 
      AND deleted_at IS NULL
      ORDER BY created_at ASC
    `);
    
    return result.values || [];
  }

  /**
   * Obtener tickets por estado
   */
  async getTicketsByStatus(status: KdsTicketStatus): Promise<KdsTicket[]> {
    const db = this.dbService.getDB();
    const result = await db.query(
      'SELECT * FROM kds_tickets WHERE status = ? AND deleted_at IS NULL ORDER BY created_at ASC',
      [status]
    );
    
    return result.values || [];
  }
}
