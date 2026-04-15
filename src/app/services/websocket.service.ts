import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WebsocketService {

  // ── BehaviorSubject garde les données en mémoire ──────
  private activitiesSubject  = new BehaviorSubject<any[]>([]);
  private dashboardSubject   = new BehaviorSubject<any>(null);
  private pollingSubscription?: Subscription;
  isConnected = false;

  private api = 'http://localhost:8086/api/dashboard';

  constructor(private http: HttpClient) {}

  connect() {
    this.isConnected = true;

    // Évite double polling
    if (this.pollingSubscription && !this.pollingSubscription.closed) return;

    // ── Chargement immédiat ───────────────────────────────
    this.chargerActivites();

    // ── Polling toutes les 5 secondes ─────────────────────
    this.pollingSubscription = interval(5000).pipe(
      switchMap(() => this.http.get<any[]>(`${this.api}/activites-recentes`))
    ).subscribe({
      next: (data: any[]) => this.activitiesSubject.next(data),
      error: () => {}
    });

    // ── Polling dashboard toutes les 30 secondes ──────────
    interval(30000).pipe(
      switchMap(() => this.http.get<any>(`${this.api}/dashboard-update`))
    ).subscribe({
      next: (data: any) => this.dashboardSubject.next(data),
      error: () => {}
    });
  }

  chargerActivites() {
    this.http.get<any[]>(`${this.api}/activites-recentes`).subscribe({
      next: (data: any[]) => this.activitiesSubject.next(data),
      error: () => {}
    });
  }

  disconnect() {
    // Ne pas arrêter — service singleton
  }

  getActivities(): Observable<any[]> {
    return this.activitiesSubject.asObservable();
  }

  getDashboardUpdates(): Observable<any> {
    return this.dashboardSubject.asObservable();
  }
}