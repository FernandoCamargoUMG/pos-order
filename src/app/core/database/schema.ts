export const DB_NAME = 'hamburger_pos.db';
export const DB_VERSION = 1;

export const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id_backend TEXT PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT,
  last_seen DATETIME,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id_local TEXT PRIMARY KEY,
  id_backend TEXT,
  device_id TEXT,
  username TEXT NOT NULL,
  pin TEXT NOT NULL,
  role_id INTEGER,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY,
  level_id INTEGER,
  name TEXT,
  status TEXT CHECK(status IN ('FREE','OCCUPIED','PAYING')),
  current_order_id TEXT,
  owner_device_id TEXT,
  locked_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS products (
  id_local TEXT PRIMARY KEY,
  id_backend TEXT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  active INTEGER DEFAULT 1,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS modifiers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('EXCLUDE','EXTRA','COOKING')),
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS orders (
  id_local TEXT PRIMARY KEY,
  id_backend TEXT,
  table_id INTEGER,
  user_id TEXT,
  device_id TEXT,
  status TEXT CHECK(status IN ('OPEN','SENT','PAYING','CLOSED')),
  printed INTEGER DEFAULT 0,
  conflict INTEGER DEFAULT 0,
  conflict_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS order_items (
  id_local TEXT PRIMARY KEY,
  order_id TEXT,
  product_id TEXT,
  quantity INTEGER,
  price REAL,
  notes TEXT,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id TEXT,
  modifier TEXT
);

CREATE TABLE IF NOT EXISTS checks (
  id_local TEXT PRIMARY KEY,
  order_id TEXT,
  total REAL,
  status TEXT CHECK(status IN ('OPEN','PAID')),
  printed INTEGER DEFAULT 0,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS check_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_id TEXT,
  order_item_id TEXT
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  type TEXT CHECK(type IN ('KITCHEN','PRECHECK')),
  status TEXT CHECK(status IN ('PENDING','PRINTED','FAILED')),
  created_at DATETIME,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS kds_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  status TEXT CHECK(status IN ('NEW','IN_PROGRESS','DONE')),
  started_at DATETIME,
  finished_at DATETIME,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT,
  entity_id TEXT,
  action TEXT,
  created_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(active);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_levels_deleted_at ON levels(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tables_level_id ON tables(level_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_owner_device ON tables(owner_device_id);
CREATE INDEX IF NOT EXISTS idx_tables_current_order ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_tables_deleted_at ON tables(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_modifiers_type ON modifiers(type);
CREATE INDEX IF NOT EXISTS idx_modifiers_deleted_at ON modifiers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_deleted_at ON order_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_oim_order_item_id ON order_item_modifiers(order_item_id);
CREATE INDEX IF NOT EXISTS idx_checks_order_id ON checks(order_id);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_deleted_at ON checks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_type ON print_jobs(type);
CREATE INDEX IF NOT EXISTS idx_kds_order_id ON kds_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_kds_status ON kds_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_queue(entity);
CREATE INDEX IF NOT EXISTS idx_sync_entity_id ON sync_queue(entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_created_at ON sync_queue(created_at);
`;

export const INITIAL_DATA = `
INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'ADMINISTRADOR');
INSERT OR IGNORE INTO roles (id, name) VALUES (2, 'MESERO');
INSERT OR IGNORE INTO roles (id, name) VALUES (3, 'COCINA');
INSERT OR IGNORE INTO roles (id, name) VALUES (4, 'CAJERO');

INSERT OR IGNORE INTO levels (id, name) VALUES (1, 'Planta Baja');
INSERT OR IGNORE INTO levels (id, name) VALUES (2, 'Primer Piso');
INSERT OR IGNORE INTO levels (id, name) VALUES (3, 'Terraza');

INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (1, 1, 'Mesa 1', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (2, 1, 'Mesa 2', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (3, 1, 'Mesa 3', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (4, 1, 'Mesa 4', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (5, 1, 'Mesa 5', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (6, 1, 'Mesa 6', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (7, 1, 'Mesa 7', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (8, 2, 'Mesa 8', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (9, 2, 'Mesa 9', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (10, 2, 'Mesa 10', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (11, 2, 'Mesa 11', 'FREE');
INSERT OR IGNORE INTO tables (id, level_id, name, status) VALUES (12, 2, 'Mesa 12', 'FREE');
`;
