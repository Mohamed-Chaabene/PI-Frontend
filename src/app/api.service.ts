import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Use relative URL so Angular dev proxy can forward to Spring Boot and avoid CORS issues.
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

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
  // See getCandidats() method below in Candidat methods section

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  // Recruteur courant (permets d'obtenir l'id du recruteur connecté)
  getCurrentRecruteur(): Observable<any> {
    // Fallback only when endpoint path is missing. Do not retry on auth errors (401/403).
    return this.http.get(`${this.apiUrl}/recruteur/me`).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.get(`${this.apiUrl}/recruteurs/me`);
        }
        return throwError(() => error);
      })
    );
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

  getAllEntretiensForAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/entretiens`);
  }

  getEntretiensByCandidat(candidatId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/candidat/${candidatId}`);
  }

  getEntretiensByRecruteur(recruteurId: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const primaryUrl = `${this.apiUrl}/entretiens/recruteur/${recruteurId}`;
    const fallbackUrl = `${this.apiUrl}/recruteurs/${recruteurId}/entretiens`;

    return this.http.get<any[]>(primaryUrl, { headers }).pipe(
      catchError((firstError) => {
        if (firstError?.status === 404 || firstError?.status === 405) {
          return this.http.get<any[]>(fallbackUrl, { headers });
        }
        return throwError(() => firstError);
      })
    );
  }

  getEntretien(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/${id}`);
  }

  updateEntretienStatutByAdmin(id: number, statut: 'ACCEPTE' | 'REFUSE'): Observable<any> {
    const queryUrl = `${this.apiUrl}/entretiens/${id}/statut?statut=${encodeURIComponent(statut)}`;
    const bodyUrl = `${this.apiUrl}/entretiens/${id}/statut`;

    return this.http.put(queryUrl, {}).pipe(
      catchError((firstError) => {
        if (firstError?.status === 404 || firstError?.status === 405) {
          return this.http.put(bodyUrl, { statut });
        }

        if (firstError?.status === 400) {
          return this.http.put(bodyUrl, { status: statut });
        }

        return throwError(() => firstError);
      })
    );
  }

  getPublicTestEntretiens(): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/public/tests`);
  }

  createEntretien(entretien: any, recruteurId?: number): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const genericUrl = `${this.apiUrl}/entretiens`;

    if (recruteurId != null && !isNaN(recruteurId) && recruteurId > 0) {
      headers = headers.set('Recruteur-ID', String(recruteurId));
    }

    // 1) Tentative la plus probable : endpoint lié au recruteur
    if (recruteurId != null && !isNaN(recruteurId) && recruteurId > 0) {
      const recruteurScopedUrl = `${this.apiUrl}/recruteurs/${recruteurId}/entretiens`;

      return this.http.post(recruteurScopedUrl, entretien, { headers }).pipe(
        catchError((error) => {
          const errorMessage = String(error?.error?.message || error?.message || '');
          const shouldFallbackToGeneric =
            error?.status === 404 ||
            (error?.status === 500 && /No static resource|NoResourceFoundException/i.test(errorMessage));

          if (shouldFallbackToGeneric) {
            return this.http.post(genericUrl, entretien, { headers });
          }

          return throwError(() => error);
        })
      );
    }

    // 2) Fallback générique
    return this.http.post(genericUrl, entretien, { headers });
  }

  completeEntretien(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/entretiens/${id}/complete`, {});
  }

  // Questions
  getQuestionsByEntretien(entretienId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions/entretien/${entretienId}`);
  }

  generateAiQuestionSuggestions(entretienId: number, payload: any): Observable<any[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any[]>(`${this.apiUrl}/questions/entretien/${entretienId}/ai-generate`, payload, { headers });
  }

  createQuestion(question: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('token');
    const entretienId = Number(question?.entretienId);

    if (!entretienId || isNaN(entretienId) || entretienId <= 0) {
      const invalidIdError = new Error('ID entretien manquant ou invalide pour la création de question');
      console.error('❌ createQuestion - entretienId invalide:', question?.entretienId);
      return throwError(() => invalidIdError);
    }
    
    return this.http.post(`${this.apiUrl}/questions/entretien/${entretienId}`, question, { headers }).pipe(
      catchError(error => {
        console.error('❌ Question creation failed:', error);
        console.error('🔻 response body:', error.error);
        console.error('🔻 status:', error.status, error.statusText);

        if (error.status === 403) {
          console.error('🚫 AUTHORIZATION DENIED (403)');
          console.error('Possible causes:');
          console.error('1. No valid JWT token in Authorization header');
          console.error('2. Token missing ROLE_RECRUTEUR authority');
          console.error('3. Backend SecurityConfig not recompiled');
          console.error('Error response:', error.error);
        } else if (error.status === 401) {
          console.error('🔐 AUTHENTICATION REQUIRED (401) - Invalid or expired token');
          console.error('Error response:', error.error);
        }

        return throwError(() => error);
      })
    );
  }

  updateQuestion(id: number, question: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(`${this.apiUrl}/questions/${id}`, question, { headers });
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  updateEntretien(id: number, entretien: any): Observable<any> {
    const recruteurId = Number(localStorage.getItem('recruteurId'));
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (!isNaN(recruteurId) && recruteurId > 0) {
      headers = headers.set('Recruteur-ID', String(recruteurId));
    }
    return this.http.put(`${this.apiUrl}/entretiens/${id}`, entretien, { headers });
  }

  deleteEntretien(id: number): Observable<any> {
    const recruteurId = Number(localStorage.getItem('recruteurId'));
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (!isNaN(recruteurId) && recruteurId > 0) {
      headers = headers.set('Recruteur-ID', String(recruteurId));
    }
    return this.http.delete(`${this.apiUrl}/entretiens/${id}`, { headers });
  }

  // Resultats
  getResultat(entretienId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entretiens/${entretienId}/resultat`);
  }

  submitEntretienResponses(entretienId: number, score: number, rapport?: string): Observable<any> {
    const payload: any = { score };
    if (rapport && rapport.trim()) {
      payload.rapport = rapport.trim();
    }
    return this.http.post(`${this.apiUrl}/entretiens/${entretienId}/submit-responses`, payload);
  }

  // Domaines
  getDomaines(): Observable<any> {
    return this.http.get(`${this.apiUrl}/domaines`);
  }

  // Candidat methods
  getCandidats(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidats`, { headers });
  }

  getCandidat(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidats/${id}`, { headers });
  }

  getCandidateByEmail(email: string): Observable<any> {
    const encodedEmail = encodeURIComponent(email);
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidats/email/${encodedEmail}`, { headers });
  }

  createCandidate(candidateData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/candidats`, candidateData, { headers });
  }

  updateCandidate(id: number, candidateData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.put(`${this.apiUrl}/candidats/${id}`, candidateData, { headers });
  }

  deleteCandidate(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/candidats/${id}`, { headers });
  }

  // Localisation methods
  getLocalisation(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/localisations/${id}`, { headers });
  }

  createLocalisation(localisationData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/localisations`, localisationData, { headers });
  }

  updateLocalisation(id: number, localisationData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.put(`${this.apiUrl}/localisations/${id}`, localisationData, { headers });
  }

  deleteLocalisation(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/localisations/${id}`, { headers });
  }

  // Test d'authentification
  testAuth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/test-auth`);
  }
  // ==================== CANDIDATURES ====================

  // Candidatures
  getMesCandidatures(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/mes-candidatures`, { headers });
  }

  getStatsCandidatures(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/stats`, { headers });
  }

  // Récupérer une candidature par ID
  getCandidatureById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/${id}`, { headers });
  }

  // Créer une candidature (postuler)
  creerCandidature(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const normalizedData = {
      ...data,
      nomComplet: this.normalizeCandidatureName(data?.nomComplet, data?.email)
    };
    console.log('📡 Envoi des données:', normalizedData);
    return this.http.post(`${this.apiUrl}/candidatures`, normalizedData, { headers });
  }

  private normalizeCandidatureName(rawName: string, email: string): string {
    let candidate = (rawName || '').trim();

    // If name looks like an email, derive a readable name from local-part.
    if (candidate.includes('@')) {
      candidate = candidate.split('@')[0] || '';
    }

    if (!candidate && email) {
      candidate = (email.split('@')[0] || '').trim();
    }

    candidate = candidate
      .replace(/[0-9_\.]+/g, ' ')
      .replace(/[^a-zA-ZÀ-ÿ\s'\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return candidate || 'Candidat';
  }

  // Modifier une candidature (entreprise, poste, lettre)
  modifierCandidature(id: number, data: any): Observable<any> {
    console.log('🔧 API - Modification complète:', { id, data });
    return this.http.put(`${this.apiUrl}/candidatures/${id}`, data);
  }

  // Modifier le statut d'une candidature
  modifierStatutCandidature(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/candidatures/${id}/statut?statut=${statut}`, {});
  }

  // Récupérer toutes les candidatures (pour recruteur)
  getAllCandidaturesForRecruteur(): Observable<any[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any[]>(`${this.apiUrl}/candidatures/admin/toutes`, { headers });
  }

  getCandidaturesByOffre(offreId: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any[]>(`${this.apiUrl}/candidatures/offre/${offreId}`, { headers });
  }

  // Récupérer les statistiques pour recruteur
  getStatsForRecruteur(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/recruteur/stats`);
  }

  supprimerCandidature(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/candidatures/${id}`, { headers });
  }

  // Rechercher des candidatures par entreprise
  rechercherCandidaturesParEntreprise(entreprise: string): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/recherche?entreprise=${entreprise}`, { headers });
  }

  // Filtrer les candidatures par statut
  filtrerCandidaturesParStatut(statut: string): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/filtre/statut/${statut}`, { headers });
  }

  // Trier les candidatures par date
  trierCandidaturesParDate(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/tri/date`, { headers });
  }

  getOffresEmploi(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/offres-emploi`, { headers });
  }

  getOffreEmploiById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const primaryUrl = `${this.apiUrl}/offres-emploi/${id}`;
    const altUrl = `${this.apiUrl}/offres/${id}`;

    return this.http.get(primaryUrl, { headers }).pipe(
      catchError((firstError) => {
        const shouldTryAltEndpoint = firstError?.status === 404 || firstError?.status === 405 || firstError?.status === 500;

        if (shouldTryAltEndpoint) {
          return this.http.get(altUrl, { headers }).pipe(
            catchError(() => {
              // Last fallback: fetch list and resolve the item client-side.
              return this.http.get<any[]>(`${this.apiUrl}/offres-emploi`, { headers }).pipe(
                map((offres) => {
                  const matched = (offres || []).find((item: any) => Number(item?.id) === Number(id));
                  if (!matched) {
                    throw firstError;
                  }
                  return matched;
                })
              );
            })
          );
        }

        return throwError(() => firstError);
      })
    );
  }

  getMesOffresEmploi(): Observable<any[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any[]>(`${this.apiUrl}/offres-emploi/mes-offres`, { headers });
  }

  creerOffreEmploi(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/offres-emploi`, data, { headers });
  }

  modifierOffreEmploi(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.put(`${this.apiUrl}/offres-emploi/${id}`, data, { headers });
  }

  supprimerOffreEmploi(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/offres-emploi/${id}`, { headers });
  }

  // Newsletter
  subscribeNewsletter(email: string): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/newsletter/subscribe`, { email }, { headers });
  }

  // ==================== DOCUMENTS CRUD ====================

  getAllDocuments(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/documents`, { headers });
  }

  getDocumentById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/documents/${id}`, { headers });
  }

  creerDocument(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/documents`, data, { headers });
  }

  modifierDocument(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.put(`${this.apiUrl}/documents/${id}`, data, { headers });
  }

  supprimerDocument(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/documents/${id}`, { headers });
  }

  quickApply(candidatureData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/candidatures/quick-apply`, candidatureData, { headers });
  }
  // Envoyer un email de notification pour une candidature
  envoyerEmailCandidature(emailData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/candidatures/send-email`, emailData, { headers });
  }

  // Envoyer un message entre utilisateur connecté et destinataire
  sendMessage(messageData: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/messages/send`, messageData, { headers });
  }

  // Récupérer les messages de la boîte actuelle (candidat ou recruteur)
  getMessagesForCurrentUser(): Observable<any[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any[]>(`${this.apiUrl}/messages/mes-messages`, { headers });
  }

  // Alias conservé pour compatibilité avec l'existant
  getMessagesForCandidat(): Observable<any[]> {
    return this.getMessagesForCurrentUser();
  }

  // Marquer un message comme lu
  marquerMessageCommeL(messageId: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.put(`${this.apiUrl}/messages/${messageId}/lu`, {}, { headers });
  }

  // Supprimer un message
  supprimerMessage(messageId: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/messages/${messageId}`, { headers });
  }
}



