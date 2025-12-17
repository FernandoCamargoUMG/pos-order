// Script para crear la base de datos SQLite desde cero
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Determinar modo: production o development
const mode = process.argv[2] || 'development';
const isProduction = mode === 'production';

console.log(`\n🏗️  Modo: ${isProduction ? '🔒 PRODUCCIÓN' : '🧪 DESARROLLO'}\n`);

// Leer los archivos de esquema y datos
const schemaPath = path.join(__dirname, '..', 'src', 'app', 'core', 'database', 'schema.ts');
const demoDataPath = path.join(__dirname, '..', 'src', 'app', 'core', 'database', 'demo-data.ts');

const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const demoDataContent = fs.readFileSync(demoDataPath, 'utf8');

// Extraer el SQL del archivo TypeScript
const extractSQL = (content, varName) => {
  const regex = new RegExp(`export const ${varName} = \`([\\s\\S]*?)\`;`, 'm');
  const match = content.match(regex);
  return match ? match[1] : '';
};

const dbSchema = extractSQL(schemaContent, 'DB_SCHEMA');
const initialData = extractSQL(schemaContent, 'INITIAL_DATA');
const productionData = extractSQL(demoDataContent, 'PRODUCTION_DATA');
const demoData = extractSQL(demoDataContent, 'DEMO_DATA');

// Crear la base de datos
const dbPath = path.join(__dirname, '..', 'src', 'assets', 'databases', 'hamburger_pos.db');

// Eliminar si existe
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// Crear directorio si no existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('📦 Creando base de datos...');
const db = new Database(dbPath);

// Ejecutar esquema
console.log('🔨 Creando esquema...');
db.exec(dbSchema);

// Ejecutar datos iniciales (roles, niveles)
console.log('📊 Insertando datos iniciales...');
db.exec(initialData);

// Ejecutar datos según el modo
if (isProduction) {
  console.log('🔒 Insertando solo admin universal (PIN: 2024)...');
  db.exec(productionData);
} else {
  console.log('👤 Insertando admin universal...');
  db.exec(productionData);
  console.log('🍔 Insertando datos demo (productos, mesas, usuarios)...');
  db.exec(demoData);
}

// Verificar
const tableCount = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type=?').get('table');
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

console.log('\n✅ Base de datos creada exitosamente!');
console.log(`   📁 Ubicación: ${dbPath}`);
console.log(`   📊 Tablas: ${tableCount.count}`);
console.log(`   🍔 Productos: ${productCount.count}`);
console.log(`   👤 Usuarios: ${userCount.count}`);

if (isProduction) {
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   Usuario: admin');
  console.log('   PIN: 2024');
  console.log('   🔒 Cambiar el PIN después de la primera instalación');
} else {
  console.log('\n📝 Usuarios disponibles (desarrollo):');
  console.log('   admin / 2024 (universal)');
  console.log('   admin / 1234 (demo)');
  console.log('   mesero / 1111');
  console.log('   cocina / 2222');
}

db.close();
