import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FreelanceApiService {

  private baseUrl = 'http://localhost:8080/api/freelance';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token'); // Make sure you store JWT token with key 'token'
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // === JOBS ===
  getOpenJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/jobs`, { headers: this.getHeaders() });
  }

  // === UNITS ===
  getUnitsBalance(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/units/balance`, { headers: this.getHeaders() });
  }

  spendUnits(amount: number, reason: string = 'Apply to job'): Observable<any> {
    return this.http.post(`${this.baseUrl}/units/spend?amount=${amount}&reason=${reason}`, {}, 
      { headers: this.getHeaders() });
  }
}