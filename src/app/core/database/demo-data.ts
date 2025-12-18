// ==========================================
// DATOS DE PRODUCCIÓN (BD Limpia)
// ==========================================
// Solo el usuario admin universal para el jefe del negocio

export const PRODUCTION_DATA = `
-- Usuario Administrador Universal (PRODUCCIÓN)
-- Usuario: admin
-- PIN: 2024
-- ⚠️ CAMBIAR EL PIN DESPUÉS DE LA PRIMERA INSTALACIÓN
INSERT OR IGNORE INTO users (id_local, username, pin, role_id, device_id, active) VALUES 
  ('user-admin-master', 'admin', '2024', 1, 'production-device', 1);
`;

// ==========================================
// DATOS DE DESARROLLO (Solo para testing)
// ==========================================
// Productos, mesas y usuarios de prueba

export const DEMO_DATA = `
-- Datos de prueba: Productos
INSERT OR IGNORE INTO products (id_local, name, price, category, active) VALUES 
  ('prod-001', 'Hamburguesa Clásica', 45.00, 'Hamburguesas', 1),
  ('prod-002', 'Hamburguesa con Queso', 50.00, 'Hamburguesas', 1),
  ('prod-003', 'Hamburguesa Doble', 65.00, 'Hamburguesas', 1),
  ('prod-004', 'Hamburguesa BBQ', 55.00, 'Hamburguesas', 1),
  ('prod-005', 'Hamburguesa Especial', 75.00, 'Hamburguesas', 1),
  ('prod-006', 'Hot Dog', 35.00, 'Hot Dogs', 1),
  ('prod-007', 'Hot Dog con Queso', 40.00, 'Hot Dogs', 1),
  ('prod-008', 'Papas Fritas Pequeñas', 25.00, 'Acompañamientos', 1),
  ('prod-009', 'Papas Fritas Grandes', 35.00, 'Acompañamientos', 1),
  ('prod-010', 'Aros de Cebolla', 30.00, 'Acompañamientos', 1),
  ('prod-011', 'Coca Cola 355ml', 15.00, 'Bebidas', 1),
  ('prod-012', 'Pepsi 355ml', 15.00, 'Bebidas', 1),
  ('prod-013', 'Sprite 355ml', 15.00, 'Bebidas', 1),
  ('prod-014', 'Fanta 355ml', 15.00, 'Bebidas', 1),
  ('prod-015', 'Agua Natural 500ml', 10.00, 'Bebidas', 1),
  ('prod-016', 'Agua Mineral 500ml', 12.00, 'Bebidas', 1),
  ('prod-017', 'Malteada de Chocolate', 35.00, 'Bebidas', 1),
  ('prod-018', 'Malteada de Vainilla', 35.00, 'Bebidas', 1),
  ('prod-019', 'Malteada de Fresa', 35.00, 'Bebidas', 1),
  ('prod-020', 'Nuggets (6 pzas)', 40.00, 'Pollo', 1),
  ('prod-021', 'Nuggets (10 pzas)', 60.00, 'Pollo', 1),
  ('prod-022', 'Alitas (6 pzas)', 55.00, 'Pollo', 1),
  ('prod-023', 'Alitas (12 pzas)', 95.00, 'Pollo', 1);

-- Datos de prueba: Modificadores
INSERT OR IGNORE INTO modifiers (id, name, type) VALUES 
  (1, 'Sin Cebolla', 'EXCLUDE'),
  (2, 'Sin Tomate', 'EXCLUDE'),
  (3, 'Sin Pepinillos', 'EXCLUDE'),
  (4, 'Sin Lechuga', 'EXCLUDE'),
  (5, 'Sin Mostaza', 'EXCLUDE'),
  (6, 'Sin Mayonesa', 'EXCLUDE'),
  (7, 'Extra Queso', 'EXTRA'),
  (8, 'Extra Tocino', 'EXTRA'),
  (9, 'Extra Carne', 'EXTRA'),
  (10, 'Aguacate', 'EXTRA'),
  (11, 'Jalapeños', 'EXTRA'),
  (12, 'Término Medio', 'COOKING'),
  (13, 'Bien Cocido', 'COOKING'),
  (14, 'Poco Cocido', 'COOKING');

-- Las mesas se crean manualmente desde la interfaz de administración

-- Datos de prueba: Opciones de Upselling
INSERT OR IGNORE INTO upselling_options (id, title, description, price, type, active, sort_order) VALUES 
  (1, 'Convertir a Combo', 'Papas + Bebida', 15.00, 'combo', 1, 1),
  (2, 'Agregar Solo Bebida', 'Soda, Agua o Refresco Natural', 8.00, 'bebida', 1, 2),
  (3, 'Postre del Día', 'Pay de Manzana', 12.00, 'postre', 1, 3);

-- Usuarios de prueba (SOLO PARA DESARROLLO)
INSERT OR IGNORE INTO users (id_local, username, pin, role_id, device_id, active) VALUES 
  ('user-admin-demo', 'admin', '1234', 1, 'demo-device', 1),
  ('user-mesero-demo', 'mesero', '1111', 2, 'demo-device', 1),
  ('user-cocina-demo', 'cocina', '2222', 3, 'demo-device', 1);
`;
