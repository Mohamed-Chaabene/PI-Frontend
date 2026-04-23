import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FreelanceViewMode = 'FREELANCER' | 'CLIENT_FREELANCE';

@Injectable({ providedIn: 'root' })
export class RoleSwitchService {
  private readonly VIEW_KEY = 'freelance_view_mode';

  private _mode = new BehaviorSubject<FreelanceViewMode>(
    (localStorage.getItem(this.VIEW_KEY) as FreelanceViewMode) || 'FREELANCER'
  );

  mode$ = this._mode.asObservable();

  get currentMode(): FreelanceViewMode {
    return this._mode.value;
  }

  switchMode(mode: FreelanceViewMode): void {
    localStorage.setItem(this.VIEW_KEY, mode);
    this._mode.next(mode);
  }

  isClientMode(): boolean {
    return this._mode.value === 'CLIENT_FREELANCE';
  }

  /** Read the user's role — tries JWT first, falls back to localStorage */
  getJwtRole(): string | null {
    // 1. Try decoding from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check for 'role' or 'roles'
        const rawRole = payload.role || payload.roles;
        if (rawRole) return Array.isArray(rawRole) ? rawRole[0] : rawRole;
      } catch { /* ignore decode errors */ }
    }
    // 2. Fallback to stored role (set at login time)
    const stored = localStorage.getItem('userRole');
    return stored ? stored.toUpperCase().replace(/^ROLE_/, '') : null;
  }

  isClientFreelanceByRole(): boolean {
    const role = this.getJwtRole();
    // Allow both dedicated clients and candidates who are exploring
    return role === 'CLIENT_FREELANCE' || role === 'CANDIDAT';
  }
}