import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EvenementService {
 private apiUrl = 'http://localhost:8080/api/evenements';

  constructor(private http: HttpClient) {}

  // CREATE
  publier(evenement: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, evenement);
  }

  // GET ALL
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // GET BY ID
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // GET par organisateur
getByOrganisateur(organisateurId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/organisateur/${organisateurId}`);
}

  // UPDATE
  modifier(id: number, evenement: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, evenement);
  }

  // DELETE
  annuler(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

 
annulerAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/${id}`);
}
}