import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { User, Role } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface AuthUser extends User {
  role?: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private deviceId: string;

  constructor(private db: DatabaseService) {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  async login(username: string, pin: string): Promise<AuthUser> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? AND u.pin = ? AND u.active = 1 AND u.deleted_at IS NULL
    `;

    const users = await this.db.executeQuery<any>(query, [username, pin]);

    if (users.length === 0) {
      throw new Error('Usuario o PIN incorrecto');
    }

    const userData = users[0];
    const user: AuthUser = {
      id_local: userData.id_local,
      id_backend: userData.id_backend,
      device_id: userData.device_id,
      username: userData.username,
      pin: userData.pin,
      role_id: userData.role_id,
      active: userData.active,
      created_at: userData.created_at,
      deleted_at: userData.deleted_at,
      role: {
        id: userData.role_id,
        name: userData.role_name
      }
    };

    this.currentUserSubject.next(user);
    localStorage.setItem('current_user', JSON.stringify(user));

    return user;
  }

  async logout(): Promise<void> {
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
  }

  async createUser(username: string, pin: string, roleId: number): Promise<User> {
    const id_local = uuidv4();
    const query = `
      INSERT INTO users (id_local, username, pin, role_id, device_id, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `;

    await this.db.run(query, [id_local, username, pin, roleId, this.deviceId]);

    return {
      id_local,
      username,
      pin,
      role_id: roleId,
      device_id: this.deviceId,
      active: 1
    };
  }

  async getRoles(): Promise<Role[]> {
    const query = 'SELECT * FROM roles ORDER BY name';
    return await this.db.executeQuery<Role>(query);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.role?.name === roleName;
  }

  async restoreSession(): Promise<void> {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        localStorage.removeItem('current_user');
      }
    }
  }
}
