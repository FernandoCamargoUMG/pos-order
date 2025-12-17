// Core Models
export interface Device {
  id_backend?: string;
  device_id: string;
  name?: string;
  last_seen?: string;
  active?: number;
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id_local: string;
  id_backend?: string;
  device_id?: string;
  username: string;
  pin: string;
  role_id?: number;
  active?: number;
  created_at?: string;
  deleted_at?: string;
}

export interface Level {
  id: number;
  name: string;
  deleted_at?: string;
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'PAYING';

export interface Table {
  id: number;
  level_id?: number;
  name?: string;
  status?: TableStatus;
  current_order_id?: string;
  owner_device_id?: string;
  locked_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Product {
  id_local: string;
  id_backend?: string;
  name: string;
  price: number;
  category?: string;
  active?: number;
  deleted_at?: string;
}

export type ModifierType = 'EXCLUDE' | 'EXTRA' | 'COOKING';

export interface Modifier {
  id: number;
  name: string;
  type: ModifierType;
  deleted_at?: string;
}

export type OrderStatus = 'OPEN' | 'SENT' | 'PAYING' | 'CLOSED';

export interface Order {
  id_local: string;
  id_backend?: string;
  table_id?: number;
  user_id?: string;
  device_id?: string;
  status?: OrderStatus;
  printed?: number;
  conflict?: number;
  conflict_reason?: string;
  created_at?: string;
  deleted_at?: string;
}

export interface OrderItem {
  id_local: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes?: string;
  deleted_at?: string;
}

export interface OrderItemModifier {
  id?: number;
  order_item_id: string;
  modifier: string;
}

export type CheckStatus = 'OPEN' | 'PAID';

export interface Check {
  id_local: string;
  order_id: string;
  total: number;
  status: CheckStatus;
  printed?: number;
  deleted_at?: string;
}

export interface CheckItem {
  id?: number;
  check_id: string;
  order_item_id: string;
}

export type PrintJobType = 'KITCHEN' | 'PRECHECK';
export type PrintJobStatus = 'PENDING' | 'PRINTED' | 'FAILED';

export interface PrintJob {
  id?: number;
  order_id: string;
  type: PrintJobType;
  status: PrintJobStatus;
  created_at?: string;
  deleted_at?: string;
}

export type KdsStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

export interface KdsTicket {
  id?: number;
  order_id: string;
  status: KdsStatus;
  started_at?: string;
  finished_at?: string;
  deleted_at?: string;
}

export interface SyncQueueItem {
  id?: number;
  entity: string;
  entity_id: string;
  action: string;
  created_at?: string;
}

export interface Settings {
  key: string;
  value: string;
}

// DTOs y tipos extendidos
export interface OrderWithItems extends Order {
  items?: OrderItemWithProduct[];
}

export interface OrderItemWithProduct extends OrderItem {
  product?: Product;
  modifiers?: OrderItemModifier[];
}

export interface TableWithLevel extends Table {
  level?: Level;
}
