import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { SyncService } from './sync.service';

export interface User {
    id_local: string;
    id_backend?: string;
    device_id?: string;
    username: string;
    pin: string;
    role_id: number;
    role_name?: string;
    active: number;
    created_at: string;
    deleted_at?: string;
}

export interface Role {
    id: number;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(
        private db: DatabaseService,
        private syncService: SyncService
    ) { }

    /**
     * Obtiene todos los usuarios activos (no eliminados)
     */
    async getAllUsers(): Promise<User[]> {
        const query = `
      SELECT 
        u.id_local,
        u.id_backend,
        u.device_id,
        u.username,
        u.pin,
        u.role_id,
        r.name as role_name,
        u.active,
        u.created_at,
        u.deleted_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `;
        return await this.db.executeQuery<User>(query);
    }

    /**
     * Obtiene un usuario por ID
     */
    async getUserById(id: string): Promise<User | null> {
        const query = `
      SELECT 
        u.id_local,
        u.id_backend,
        u.device_id,
        u.username,
        u.pin,
        u.role_id,
        r.name as role_name,
        u.active,
        u.created_at,
        u.deleted_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id_local = ? AND u.deleted_at IS NULL
    `;
        const results = await this.db.executeQuery<User>(query, [id]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Obtiene todos los roles disponibles
     */
    async getRoles(): Promise<Role[]> {
        const query = 'SELECT id, name FROM roles ORDER BY id';
        return await this.db.executeQuery<Role>(query);
    }

    /**
     * Crea un nuevo usuario
     */
    async createUser(user: {
        username: string;
        pin: string;
        role_id: number;
        device_id?: string;
    }): Promise<string> {
        // Verificar si el username ya existe
        const existingQuery = `
      SELECT COUNT(*) as count 
      FROM users 
      WHERE username = ? AND deleted_at IS NULL
    `;
        const existing = await this.db.executeQuery<{ count: number }>(existingQuery, [user.username]);

        if (existing[0].count > 0) {
            throw new Error('Ya existe un usuario con ese nombre');
        }

        // Generar ID local único
        const id_local = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const query = `
      INSERT INTO users (id_local, username, pin, role_id, device_id, active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `;

        await this.db.run(query, [
            id_local,
            user.username,
            user.pin,
            user.role_id,
            user.device_id || null
        ]);

        // Sincronizar inmediatamente con el backend
        console.log('🔄 Usuario creado localmente, sincronizando con backend...');
        try {
            await this.syncService.syncUsers();
            console.log('✅ Usuario sincronizado con backend exitosamente');
        } catch (error) {
            console.error('⚠️ Error sincronizando usuario (se subirá en próxima sincronización):', error);
        }

        return id_local;
    }

    /**
     * Actualiza un usuario existente
     */
    async updateUser(id: string, updates: {
        username?: string;
        pin?: string;
        role_id?: number;
        active?: number;
    }): Promise<void> {
        // Verificar si el nuevo username ya existe (si se está cambiando)
        if (updates.username) {
            const existingQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE username = ? AND id_local != ? AND deleted_at IS NULL
      `;
            const existing = await this.db.executeQuery<{ count: number }>(
                existingQuery,
                [updates.username, id]
            );

            if (existing[0].count > 0) {
                throw new Error('Ya existe un usuario con ese nombre');
            }
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (updates.username !== undefined) {
            fields.push('username = ?');
            values.push(updates.username);
        }
        if (updates.pin !== undefined) {
            fields.push('pin = ?');
            values.push(updates.pin);
        }
        if (updates.role_id !== undefined) {
            fields.push('role_id = ?');
            values.push(updates.role_id);
        }
        if (updates.active !== undefined) {
            fields.push('active = ?');
            values.push(updates.active);
        }

        if (fields.length === 0) {
            return;
        }

        values.push(id);

        const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id_local = ?
    `;

        await this.db.run(query, values);

        // Sincronizar inmediatamente con el backend
        console.log('🔄 Usuario actualizado localmente, sincronizando con backend...');
        try {
            await this.syncService.syncUsers();
            console.log('✅ Usuario sincronizado con backend exitosamente');
        } catch (error) {
            console.error('⚠️ Error sincronizando usuario (se subirá en próxima sincronización):', error);
        }
    }

    /**
     * Desactiva un usuario (soft delete)
     */
    async deactivateUser(id: string): Promise<void> {
        const query = `
      UPDATE users 
      SET active = 0
      WHERE id_local = ?
    `;
        await this.db.run(query, [id]);
    }

    /**
     * Activa un usuario previamente desactivado
     */
    async activateUser(id: string): Promise<void> {
        const query = `
      UPDATE users 
      SET active = 1
      WHERE id_local = ?
    `;
        await this.db.run(query, [id]);
    }

    /**
     * Elimina permanentemente un usuario
     */
    async deleteUser(id: string): Promise<void> {
        const query = 'DELETE FROM users WHERE id_local = ?';
        await this.db.run(query, [id]);
    }

    /**
     * Verifica si un usuario es administrador
     */
    async isAdmin(userId: string): Promise<boolean> {
        const query = `
      SELECT role_id 
      FROM users 
      WHERE id_local = ? AND deleted_at IS NULL
    `;
        const results = await this.db.executeQuery<{ role_id: number }>(query, [userId]);
        return results.length > 0 && results[0].role_id === 1;
    }

    /**
     * Cuenta usuarios por rol
     */
    async countUsersByRole(): Promise<{ role_name: string; count: number }[]> {
        const query = `
      SELECT 
        r.name as role_name,
        COUNT(u.id_local) as count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL AND u.active = 1
      GROUP BY r.id, r.name
      ORDER BY r.id
    `;
        return await this.db.executeQuery<{ role_name: string; count: number }>(query);
    }
}
