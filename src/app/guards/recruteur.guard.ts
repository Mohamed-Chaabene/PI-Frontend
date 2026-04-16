import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

function hasRecruteurAccess(): boolean {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const storedRole = (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');
  let tokenRole = '';

  if (token && token !== 'undefined' && token !== 'null') {
    try {
      const decoded: any = jwtDecode(token);
      tokenRole = String(decoded?.role || decoded?.roles || decoded?.authorities || '')
        .toUpperCase()
        .replace(/^ROLE_/, '');
    } catch {
      tokenRole = '';
    }
  }

  const role = storedRole || tokenRole;

  if (!token || token === 'undefined' || token === 'null') {
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
