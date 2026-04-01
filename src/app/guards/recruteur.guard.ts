import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';

function hasRecruteurAccess(): boolean {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (role !== 'RECRUTEUR') {
    router.navigate(['/']);
    return false;
  }

  return true;
}

export const recruteurGuard: CanActivateFn = () => hasRecruteurAccess();
export const recruteurChildGuard: CanActivateChildFn = () => hasRecruteurAccess();
