// Script para verificar el esquema de la tabla orders
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'assets', 'databases', 'hamburger_pos.db');

console.log('📊 Verificando esquema de la base de datos...');
console.log(`📁 Ubicación: ${dbPath}\n`);

const db = new Database(dbPath);

// Obtener la estructura de la tabla orders
const tableInfo = db.prepare('PRAGMA table_info(orders)').all();

console.log('✅ Estructura de la tabla "orders":\n');
console.log('| Columna              | Tipo      | Nullable | Default    |');
console.log('|---------------------|-----------|----------|------------|');
tableInfo.forEach(col => {
  const nullable = col.notnull === 0 ? 'YES' : 'NO';
  const defaultVal = col.dflt_value || '-';
  console.log(`| ${col.name.padEnd(20)} | ${col.type.padEnd(9)} | ${nullable.padEnd(8)} | ${defaultVal.padEnd(10)} |`);
});

// Verificar que existan las columnas nuevas
const hasKitchenStatus = tableInfo.find(col => col.name === 'kitchen_status');
const hasUpdatedAt = tableInfo.find(col => col.name === 'updated_at');
const hasNotes = tableInfo.find(col => col.name === 'notes');

console.log('\n🔍 Verificación de columnas nuevas:');
console.log(`   ✓ kitchen_status: ${hasKitchenStatus ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`   ✓ updated_at:     ${hasUpdatedAt ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`   ✓ notes:          ${hasNotes ? '✅ EXISTS' : '❌ MISSING'}`);

// Contar órdenes
const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
console.log(`\n📦 Total de órdenes: ${orderCount.count}`);

// Mostrar órdenes SENT con sus estados de cocina
const sentOrders = db.prepare(`
  SELECT id_local, table_id, status, kitchen_status, created_at, updated_at 
  FROM orders 
  WHERE status = 'SENT' AND deleted_at IS NULL
  LIMIT 5
`).all();

if (sentOrders.length > 0) {
  console.log('\n📋 Órdenes SENT en el sistema:');
  sentOrders.forEach(order => {
    console.log(`   - ${order.id_local} | Mesa: ${order.table_id} | Kitchen: ${order.kitchen_status || 'NULL'} | Updated: ${order.updated_at || 'NULL'}`);
  });
} else {
  console.log('\n⚠️  No hay órdenes con status SENT');
}

db.close();
console.log('\n✅ Verificación completa!');
