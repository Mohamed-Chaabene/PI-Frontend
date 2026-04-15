import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private api = 'http://localhost:8086/api/dashboard';

  constructor(private http: HttpClient) {}

  getTopPartenaires(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/top-partenaires`);
  }

  getStatsKeywords(): Observable<any> {
    return this.http.get<any>(`${this.api}/stats-keywords`);
  }

  getScoresPopularite(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/scores-popularite`);
  }
}