import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'http://localhost:8080/api'; // URL de votre backend Spring Boot

  constructor(private http: HttpClient) { }

  // Helper method to get headers with authorization token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Exemple de méthode GET
  getData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data`);
  }

  // Exemple de méthode POST
  postData(data: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/data`, data, { headers });
  }

  // CRUD utilisateurs (Admin)
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  // Candidats (pour lier un entretien à un candidat)
  getCandidats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/candidats`, { headers });
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  // Recruteur courant (permets d'obtenir l'id du recruteur connecté)
  getCurrentRecruteur(): Observable<any> {
    // endpoint correct du backend avec headers d'autorisation
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/recruteur/me`, { headers });
  }

  createUser(user: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/users`, user, { headers });
  }

  updateUser(id: number, user: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(`${this.apiUrl}/users/${id}`, user, { headers });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // Ajoutez d'autres méthodes selon vos besoins API

  // Register
  register(user: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/auth/register`, user, { headers });
  }

  // Login
  login(credentials: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/auth/login`, credentials, { headers });
  }

  // Entretiens (Interviews)
  getEntretiens(): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens`);
  }

  /** Tests généraux (type TEST, non terminés) — public, sans authentification */
  getPublicTestEntretiens(): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/public/tests`);
  }

  getEntretiensByCandidat(candidatId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/candidat/${candidatId}`);
  }

  getEntretien(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/${id}`);
  }

  createEntretien(entretien: any, recruteurId?: number): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (recruteurId != null && !isNaN(recruteurId) && recruteurId > 0) {
      headers = headers.set('Recruteur-ID', String(recruteurId));
      console.log('📤 Header Recruteur-ID ajouté:', recruteurId);
    } else {
      console.warn('⚠️ Header Recruteur-ID non ajouté (valeur invalide):', recruteurId);
    }
    return this.http.post(`${this.apiUrl}/entretiens`, entretien, { headers });
  }

  completeEntretien(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/entretiens/${id}/complete`, {});
  }

  updateEntretien(id: number, entretien: any, recruteurId?: number): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (recruteurId != null && !isNaN(recruteurId) && recruteurId > 0) {
      headers = headers.set('Recruteur-ID', String(recruteurId));
    }
    return this.http.put(`${this.apiUrl}/entretiens/${id}`, entretien, { headers });
  }

  deleteEntretien(id: number, recruteurId?: number): Observable<any> {
    let headers = new HttpHeaders();
    if (recruteurId != null && !isNaN(recruteurId) && recruteurId > 0) {
      headers = headers.set('Recruteur-ID', String(recruteurId));
    }
    return this.http.delete(`${this.apiUrl}/entretiens/${id}`, { headers });
  }

  // Questions
  getQuestionsByEntretien(entretienId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions/entretien/${entretienId}`);
  }

  createQuestion(entretienId: number, question: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/questions/entretien/${entretienId}`, question, { headers });
  }

  updateQuestion(id: number, question: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(`${this.apiUrl}/questions/${id}`, question, { headers });
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  submitEntretienReposes(entretienId: number, responses: any[]): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/entretiens/${entretienId}/submit-responses`, responses, { headers });
  }

  getResultatByCandidate(entretienId: number, candidatId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/resultats/entretien/${entretienId}/candidat/${candidatId}`);
  }

  // Resultats
  getResultat(entretienId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/resultats/entretien/${entretienId}`);
  }

  // Domaines
  getDomaines(): Observable<any> {
    return this.http.get(`${this.apiUrl}/domaines`);
  }

  // Test d'authentification
  testAuth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/test-auth`);
  }

}
