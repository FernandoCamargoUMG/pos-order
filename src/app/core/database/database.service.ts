import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME } from './schema';
import { PRODUCTION_DATA, DEMO_DATA } from './demo-data';
import { environment } from '../../../environments/environment';
import { MIGRATIONS, getLatestMigrationVersion } from './migrations';

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
            console.log('Inicializando base de datos...');

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

            // Ejecutar migraciones pendientes
            await this.runMigrations();

            this.isInitialized = true;
            console.log('✅ Base de datos inicializada correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar la base de datos:', error);
            throw error;
        }
    }

    /**
     * Ejecuta todas las migraciones pendientes
     */
    private async runMigrations(): Promise<void> {
        try {
            // Obtener versión actual de la BD
            let currentVersion = 0;
            try {
                const result = await this.db.query(
                    'SELECT MAX(version) as version FROM schema_migrations'
                );
                currentVersion = result.values?.[0]?.version || 0;
            } catch (e) {
                // Tabla no existe, es primera vez
                console.log('Primera inicialización de BD');
            }

            const latestVersion = getLatestMigrationVersion();
            console.log(`📊 Migraciones - Actual: ${currentVersion}, Última: ${latestVersion}`);

            // Aplicar migraciones pendientes
            const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion);
            
            if (pendingMigrations.length === 0) {
                console.log('✅ Base de datos actualizada, no hay migraciones pendientes');
                return;
            }

            console.log(`🔄 Aplicando ${pendingMigrations.length} migración(es)...`);

            for (const migration of pendingMigrations) {
                console.log(`  ⏳ Aplicando migración ${migration.version}: ${migration.name}`);
                
                // Ejecutar SQL de la migración
                await this.db.execute(migration.up);
                
                // Registrar migración aplicada
                await this.db.run(
                    'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
                    [migration.version, migration.name]
                );
                
                console.log(`  ✅ Migración ${migration.version} aplicada`);
            }

            // Cargar datos iniciales solo en la primera migración
            if (currentVersion === 0) {
                if (environment.production) {
                    await this.db.execute(PRODUCTION_DATA);
                    console.log('📦 BD de PRODUCCIÓN: Solo admin universal (PIN: 2024)');
                } else {
                    await this.db.execute(PRODUCTION_DATA);
                    await this.db.execute(DEMO_DATA);
                    console.log('📦 BD de DESARROLLO: Admin + datos demo cargados');
                }
            }

            console.log(`✅ Base de datos actualizada a versión ${latestVersion}`);
        } catch (error) {
            console.error('❌ Error ejecutando migraciones:', error);
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
