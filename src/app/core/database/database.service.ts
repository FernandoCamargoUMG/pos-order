import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME, DB_SCHEMA, INITIAL_DATA } from './schema';
import { PRODUCTION_DATA, DEMO_DATA } from './demo-data';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    private sqlite: SQLiteConnection;
    private db!: SQLiteDBConnection;
    private isInitialized = false;
    private platform: string;

    constructor() {
        this.platform = Capacitor.getPlatform();
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    async init(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Intentar copiar desde assets si existe
            const result = await this.sqlite.copyFromAssets();
            console.log('Copiado desde assets:', result);

            // Verificar si la conexión ya existe
            const isConnection = await this.sqlite.isConnection(DB_NAME, false);

            if (!isConnection.result) {
                this.db = await this.sqlite.createConnection(
                    DB_NAME,
                    false,
                    'no-encryption',
                    1,
                    false
                );
            } else {
                this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
            }

            await this.db.open();

            // Solo crear esquema si la DB no existía
            const tables = await this.db.query('SELECT name FROM sqlite_master WHERE type="table"');
            if (!tables.values || tables.values.length === 0) {
                console.log('Creando esquema inicial...');
                await this.db.execute(DB_SCHEMA);
                await this.db.execute(INITIAL_DATA);

                // En producción: solo admin universal
                // En desarrollo: productos, mesas y usuarios demo
                if (environment.production) {
                    await this.db.execute(PRODUCTION_DATA);
                    console.log('BD de PRODUCCIÓN: Solo admin universal (PIN: 2024)');
                } else {
                    await this.db.execute(PRODUCTION_DATA); // Admin universal
                    await this.db.execute(DEMO_DATA);       // + Datos de prueba
                    console.log('BD de DESARROLLO: Admin + datos demo cargados');
                }
            } else {
                console.log('Base de datos ya existe con', tables.values.length, 'tablas');
                console.log('Usando DB desde assets');
            }

            this.isInitialized = true;
            console.log('Base de datos inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            throw error;
        }
    }

    async executeQuery<T = any>(query: string, values?: any[]): Promise<T[]> {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            console.log('Query:', query.substring(0, 100));
            const result = await this.db.query(query, values);
            console.log(`Query OK - ${result.values?.length || 0} filas`);
            console.log('Resultado completo:', result);
            return (result.values || []) as T[];
        } catch (error) {
            console.error('Error ejecutando query:', error);
            throw error;
        }
    }

    async run(query: string, values?: any[]): Promise<any> {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            console.log('Run:', query.substring(0, 100));
            const result = await this.db.run(query, values);
            console.log(`Run OK - Changes: ${result.changes?.changes || 0}`);
            return result;
        } catch (error) {
            console.error('Error ejecutando run:', error);
            throw error;
        }
    }

    async executeSet(set: { statement: string; values?: any[] }[]): Promise<any> {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            const result = await this.db.executeSet(set);
            return result;
        } catch (error) {
            console.error('Error ejecutando executeSet:', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.isInitialized = false;
        }
    }

    getDB(): SQLiteDBConnection {
        return this.db;
    }

    isReady(): boolean {
        return this.isInitialized;
    }
}
