import { Routes } from '@angular/router';
import { adminGuard, meseroGuard, cocinaGuard, authGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'admin-menu',
    loadComponent: () => import('./features/admin/admin-menu.page').then((m) => m.AdminMenuPage),
    canActivate: [adminGuard]
  },
  {
    path: 'debug',
    loadComponent: () => import('./features/debug/debug.page').then((m) => m.DebugPage),
    canActivate: [adminGuard]  // Solo admin puede acceder al debug
  },
  {
    path: 'tables',
    loadComponent: () => import('./features/tables/tables.page').then((m) => m.TablesPage),
    canActivate: [authGuard]  // Cualquier usuario autenticado
  },
  {
    path: 'order/:id',
    loadComponent: () => import('./features/order/order.page').then((m) => m.OrderPage),
    canActivate: [authGuard]  // Meseros y admin pueden tomar órdenes
  },
  {
    path: 'kds',
    loadComponent: () => import('./features/kds/kds.page').then((m) => m.KdsPage),
    canActivate: [cocinaGuard]  // Solo cocina y admin pueden ver KDS
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage),
    canActivate: [adminGuard]  // Solo admin
  },
  {
    path: 'products/form',
    loadComponent: () => import('./features/products/product-form.page').then((m) => m.ProductFormPage),
    canActivate: [adminGuard]  // Solo admin
  },
  {
    path: 'upselling-management',
    loadComponent: () => import('./features/admin/upselling-management/upselling-management.page').then((m) => m.UpsellingManagementPage),
    canActivate: [adminGuard]  // Solo admin
  },
  {
    path: 'modifiers-management',
    loadComponent: () => import('./features/admin/modifiers-management/modifiers-management.page').then((m) => m.ModifiersManagementPage),
    canActivate: [adminGuard]  // Solo admin
  },
  {
    path: 'sales-history',
    loadComponent: () => import('./features/sales-history/sales-history.page').then((m) => m.SalesHistoryPage),
    canActivate: [adminGuard]  // Solo admin
  },
  {
    path: 'printer-config',
    loadComponent: () => import('./features/config/printer-config/printer-config.page').then((m) => m.PrinterConfigPage),
    canActivate: [adminGuard]  // Solo admin
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
];
