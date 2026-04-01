import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type UserMode = 'freelancer' | 'client';

@Injectable({
  providedIn: 'root'
})
export class ModeService {
  private currentMode = new BehaviorSubject<UserMode>('freelancer');
  currentMode$ = this.currentMode.asObservable();

  constructor() {
    const saved = localStorage.getItem('userMode') as UserMode;
    if (saved) {
      this.currentMode.next(saved);
    }
  }

  switchMode(mode: UserMode): void {
    this.currentMode.next(mode);
    localStorage.setItem('userMode', mode);
  }

  getCurrentMode(): UserMode {
    return this.currentMode.value;
  }
}