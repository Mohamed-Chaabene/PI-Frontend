import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RoleSwitchService } from '../services/role-switch.service';

@Injectable({ providedIn: 'root' })
export class FreelanceRoleGuard implements CanActivate {
  constructor(
    private roleSwitchService: RoleSwitchService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // 1. Must be authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // 2. Must have CLIENT_FREELANCE role (from JWT or stored role)
    const role = this.roleSwitchService.getJwtRole()
      || (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');

    if (role === 'CLIENT_FREELANCE' || role === 'CANDIDAT') {
      return true;
    }

    // Redirect to freelance home if other roles try to access
    this.router.navigate(['/freelance']);
    return false;
  }
}