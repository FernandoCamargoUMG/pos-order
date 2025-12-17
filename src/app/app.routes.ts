import { Routes } from '@angular/router';
import { adminGuard, meseroGuard, cocinaGuard } from './core/guards/role.guard';

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
  },
  {
    path: 'tables',
    loadComponent: () => import('./features/tables/tables.page').then((m) => m.TablesPage),
  },
  {
    path: 'kds',
    loadComponent: () => import('./features/kds/kds.page').then((m) => m.KdsPage),
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage),
    canActivate: [adminGuard]
  },
  {
    path: 'products/form',
    loadComponent: () => import('./features/products/product-form.page').then((m) => m.ProductFormPage),
    canActivate: [adminGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
];
