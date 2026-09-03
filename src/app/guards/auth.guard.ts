import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (user && token) {
    return true;
  }

  authService.openAuthModal();
  router.navigate(['/browse']);
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (user && token && user.roles && user.roles.includes('SUPER_ADMIN')) {
    return true;
  }

  if (!user || !token) {
    authService.openAuthModal();
  }
  router.navigate(['/browse']);
  return false;
};

export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (user && token && user.roles && (user.roles.includes('COMPANY_ADMIN') || user.roles.includes('STAFF') || user.roles.includes('SUPER_ADMIN'))) {
    return true;
  }

  if (!user || !token) {
    authService.openAuthModal();
  }
  router.navigate(['/browse']);
  return false;
};

export const tenantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (user && token) {
    return true;
  }

  authService.openAuthModal();
  router.navigate(['/browse']);
  return false;
};
