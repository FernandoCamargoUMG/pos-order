import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para cualquier usuario autenticado
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise((resolve) => {
    authService.currentUser$.subscribe(user => {
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    });
  });
};

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise((resolve) => {
    authService.currentUser$.subscribe(user => {
      if (user && user.role?.name === 'ADMINISTRADOR') {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    });
  });
};

export const meseroGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise((resolve) => {
    authService.currentUser$.subscribe(user => {
      if (user && user.role?.name === 'MESERO') {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    });
  });
};

export const cocinaGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise((resolve) => {
    authService.currentUser$.subscribe(user => {
      if (user && (user.role?.name === 'COCINA' || user.role?.name === 'ADMINISTRADOR')) {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    });
  });
};
