import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Use relative URL so Angular dev proxy can forward to Spring Boot and avoid CORS issues.
  private apiUrl = '/api';
  private mlUrl = 'http://localhost:8000';
  private mlAvailable = true;
  constructor(private http: HttpClient) { }

  private buildAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();

    if (token && token !== 'undefined' && token !== 'null') {
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

  getUsersByName(name: string): Observable<any[]> {
    const query = encodeURIComponent(name?.trim() || '');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    headers = headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers = headers.set('Pragma', 'no-cache');
    const timestamp = Date.now();
    const url = `${this.apiUrl}/users/search?name=${query}&t=${timestamp}`;
    console.log('🌐 Calling API search endpoint:', url);
    return this.http.get<any[]>(url, { headers });
  }

  // Candidats (pour lier un entretien à un candidat)
  // See getCandidats() method below in Candidat methods section

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  // Recruteur courant (permets d'obtenir l'id du recruteur connecté)
  getCurrentRecruteur(): Observable<any> {
    const headers = this.buildAuthHeaders();

    // Fallback only when endpoint path is missing. Do not retry on auth errors (401/403).
    return this.http.get(`${this.apiUrl}/recruteur/me`, { headers }).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.get(`${this.apiUrl}/recruteurs/me`, { headers });
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

  // Register
  register(user: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const cleanEmail = String(user?.email || '').trim();
    const cleanRole = String(user?.role || 'CANDIDAT').replace(/^ROLE_/, '').toUpperCase() || 'CANDIDAT';
    const cleanPassword = user?.password ?? user?.motDePasse ?? user?.rawPassword ?? '';

    const normalizedUser: any = {
      nom: user?.nom ?? '',
      prenom: user?.prenom ?? '',
      email: cleanEmail,
      role: cleanRole,
      roleString: user?.roleString ?? undefined,
      cv: user?.cv ?? undefined,
      niveauEtude: user?.niveauEtude ?? undefined,
      competences: user?.competences ?? undefined,
      experience: user?.experience ?? undefined,
      entreprise: user?.entreprise ?? undefined,
      poste: user?.poste ?? undefined,
      secteur: user?.secteur ?? undefined,
      budget: user?.budget ?? undefined,
      organisation: user?.organisation ?? undefined,
      adresse: user?.adresse ?? undefined,
      descriptionProjet: user?.descriptionProjet ?? undefined,
      password: cleanPassword,
      rawPassword: cleanPassword,
      motDePasse: cleanPassword,
    };

    return this.http.post(`${this.apiUrl}/auth/register`, normalizedUser, { headers }).pipe(
      catchError((firstError) => {
        if (firstError?.status === 400 || firstError?.status === 403) {
          const minimalPayload = {
            nom: normalizedUser.nom,
            email: normalizedUser.email,
            role: cleanRole,
            motDePasse: cleanPassword,
            password: cleanPassword,
            rawPassword: cleanPassword,
          };
          return this.http.post(`${this.apiUrl}/auth/register`, minimalPayload, { headers }).pipe(
            catchError((secondError) => {
              if (secondError?.status === 403 && cleanRole !== 'CANDIDAT') {
                // Last fallback when backend rejects non-candidate self-signup.
                const candidatePayload = { ...minimalPayload, role: 'CANDIDAT' };
                return this.http.post(`${this.apiUrl}/auth/register`, candidatePayload, { headers });
              }
              return throwError(() => secondError);
            })
          );
        }
        return throwError(() => firstError);
      })
    );
  }

  // Login
  login(credentials: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const email = String(credentials?.email ?? credentials?.username ?? '').trim();
    const password = String(credentials?.password ?? credentials?.motDePasse ?? credentials?.rawPassword ?? '');

    // Try the most likely backend contract first to avoid server-side deserialization issues.
    const primaryPayload = {
      email,
      motDePasse: password,
    };

    return this.http.post(`${this.apiUrl}/auth/login`, primaryPayload, { headers }).pipe(
      catchError((firstError) => {
        if (firstError?.status === 400 || firstError?.status === 401 || firstError?.status === 403 || firstError?.status === 500) {
          const fallbackPasswordPayload = {
            email,
            password,
          };

          return this.http.post(`${this.apiUrl}/auth/login`, fallbackPasswordPayload, { headers }).pipe(
            catchError((secondError) => {
              if (secondError?.status === 400 || secondError?.status === 401 || secondError?.status === 403 || secondError?.status === 500) {
                const fallbackUsernamePayload = {
                  username: email,
                  password,
                };
                return this.http.post(`${this.apiUrl}/auth/login`, fallbackUsernamePayload, { headers });
              }
              return throwError(() => secondError);
            })
          );
        }
        return throwError(() => firstError);
      })
    );
  }

  // Reset Password
  resetPassword(phone: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { phone }, { headers });
  }

  // Entretiens (Interviews)
  getEntretiens(): Observable<any> {
    const headers = this.buildAuthHeaders();
    return this.http.get(`${this.apiUrl}/entretiens`, { headers });
  }

  getAllEntretiensForAdmin(): Observable<any[]> {
    const headers = this.buildAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/entretiens`, { headers });
  }

  getEntretiensByCandidat(candidatId: number): Observable<any> {
    const headers = this.buildAuthHeaders();
    return this.http.get(`${this.apiUrl}/entretiens/candidat/${candidatId}`, { headers });
  }

  getEntretiensByRecruteur(recruteurId: number): Observable<any[]> {
    const headers = this.buildAuthHeaders();

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

  getEntretiensByOffre(offreId: number): Observable<any[]> {
    const headers = this.buildAuthHeaders();
    const primaryUrl = `${this.apiUrl}/entretiens/offre/${offreId}`;
    const fallbackUrlA = `${this.apiUrl}/offres/${offreId}/entretiens`;
    const fallbackUrlB = `${this.apiUrl}/offres-emploi/${offreId}/entretiens`;

    return this.http.get<any[]>(primaryUrl, { headers }).pipe(
      catchError((firstError) => {
        if (firstError?.status === 404 || firstError?.status === 405 || firstError?.status === 500) {
          return this.http.get<any[]>(fallbackUrlA, { headers }).pipe(
            catchError((secondError) => {
              if (secondError?.status === 404 || secondError?.status === 405 || secondError?.status === 500) {
                return this.http.get<any[]>(fallbackUrlB, { headers });
              }
              return throwError(() => secondError);
            })
          );
        }
        return throwError(() => firstError);
      })
    );
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
    return this.http.post<any[]>(`${this.apiUrl}/questions/entretien/${entretienId}/ai-generate`, payload, { headers }).pipe(
      catchError((error) => {
        // If Spring endpoint is missing or unstable, fallback to external open-source API.
        if (error?.status === 404 || error?.status === 500 || error?.status === 502 || error?.status === 503 || error?.status === 0) {
          return this.callExternalOpenSourceQuestionApi(payload).pipe(
            catchError(() => of(this.buildLocalQuestionFallback(payload)))
          );
        }
        return throwError(() => error);
      })
    );
  }

  private callExternalOpenSourceQuestionApi(payload: any): Observable<any[]> {
    const type = this.normalizeQuestionType(payload?.type);
    const niveau = String(payload?.niveau || 'INTERMEDIAIRE').trim().toUpperCase();
    const categorie = String(payload?.categorie || 'TECHNIQUE').trim().toUpperCase();
    const nombre = Math.max(1, Math.min(10, Number(payload?.nombre) || 3));
    const theme = String(payload?.theme || 'entretien technique').trim();

    const prompt =
      `Genere exactement ${nombre} questions d entretien en francais au format JSON. ` +
      `Theme: ${theme}. Categorie: ${categorie}. Niveau: ${niveau}. Type: ${type}. ` +
      `Retourne uniquement un tableau JSON. ` +
      `Schema: [{"contenu":"...","type":"${type}","niveau":"${niveau}","points":1,"ordre":1,"choix":[{"texte":"...","correcte":true,"ordre":1}]}].`;

    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((text) => this.normalizeExternalQuestionsText(text, { type, niveau, nombre, theme }))
    );
  }

  private normalizeQuestionType(rawType: any): string {
    const normalized = String(rawType || 'QCM').trim().toUpperCase();
    if (normalized === 'VF' || normalized === 'VRAI_FAUX') {
      return 'VRAI_FAUX';
    }
    if (normalized === 'QCU') {
      return 'QCU';
    }
    return 'QCM';
  }

  private normalizeExternalQuestionsText(text: string, context: any): any[] {
    const extracted = this.extractJsonPayload(text);
    const rows = Array.isArray(extracted)
      ? extracted
      : (Array.isArray((extracted as any)?.questions) ? (extracted as any).questions : []);

    if (!rows.length) {
      const textRows = this.extractQuestionsFromPlainText(text, context);
      if (textRows.length) {
        return textRows;
      }
      return this.buildLocalQuestionFallback(context);
    }

    return rows.slice(0, context.nombre).map((row: any, index: number) => {
      const rowType = this.normalizeQuestionType(row?.type || context.type);
      const rowNiveau = String(row?.niveau || context.niveau || 'INTERMEDIAIRE').trim().toUpperCase();
      const choixRaw = Array.isArray(row?.choix) ? row.choix : [];
      const choix = choixRaw
        .map((choice: any, cIndex: number) => {
          if (typeof choice === 'string') {
            return { texte: choice.trim(), correcte: cIndex === 0, ordre: cIndex + 1 };
          }
          return {
            texte: String(choice?.texte || choice?.contenu || choice?.label || '').trim(),
            correcte: Boolean(choice?.correcte === true || choice?.correct === true || choice?.isCorrecte === true),
            ordre: Number(choice?.ordre) || cIndex + 1
          };
        })
        .filter((choice: any) => !!choice.texte);

      if (!choix.length) {
        if (rowType === 'VRAI_FAUX') {
          choix.push({ texte: 'VRAI', correcte: true, ordre: 1 });
          choix.push({ texte: 'FAUX', correcte: false, ordre: 2 });
        } else {
          choix.push({ texte: 'Option A', correcte: true, ordre: 1 });
          choix.push({ texte: 'Option B', correcte: false, ordre: 2 });
          choix.push({ texte: 'Option C', correcte: false, ordre: 3 });
        }
      }

      if (!choix.some((c: any) => c.correcte)) {
        choix[0].correcte = true;
      }

      if (rowType === 'QCU' || rowType === 'VRAI_FAUX') {
        let found = false;
        choix.forEach((c: any) => {
          if (c.correcte && !found) {
            found = true;
          } else {
            c.correcte = false;
          }
        });
      }

      return {
        contenu: String(row?.contenu || '').trim() || `${context.theme} - Question ${index + 1}`,
        type: rowType,
        niveau: rowNiveau,
        points: Number(row?.points) || 1,
        ordre: Number(row?.ordre) || index + 1,
        choix
      };
    });
  }

  private extractQuestionsFromPlainText(text: string, context: any): any[] {
    const raw = String(text || '').trim();
    if (!raw) {
      return [];
    }

    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/g, '').trim())
      .filter((line) => line.length > 15)
      .filter((line) => /\?|:/.test(line));

    const unique = Array.from(new Set(lines));
    if (!unique.length) {
      return [];
    }

    const type = this.normalizeQuestionType(context?.type);
    const niveau = String(context?.niveau || 'INTERMEDIAIRE').trim().toUpperCase();
    const wanted = Math.max(1, Math.min(10, Number(context?.nombre) || 3));

    return unique.slice(0, wanted).map((questionText, index) => {
      const contenu = questionText.endsWith('?') || questionText.endsWith(':')
        ? questionText
        : `${questionText} ?`;

      if (type === 'VRAI_FAUX') {
        return {
          contenu,
          type,
          niveau,
          points: 1,
          ordre: index + 1,
          choix: [
            { texte: 'VRAI', correcte: true, ordre: 1 },
            { texte: 'FAUX', correcte: false, ordre: 2 }
          ]
        };
      }

      return {
        contenu,
        type,
        niveau,
        points: 1,
        ordre: index + 1,
        choix: [
          { texte: 'Option A', correcte: true, ordre: 1 },
          { texte: 'Option B', correcte: false, ordre: 2 },
          { texte: 'Option C', correcte: false, ordre: 3 }
        ]
      };
    });
  }

  private extractJsonPayload(text: string): any {
    const cleaned = String(text || '').trim();
    if (!cleaned) {
      return null;
    }

    const tryParse = (candidate: string): any => {
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    };

    const direct = tryParse(cleaned);
    if (direct != null) {
      return direct;
    }

    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      const parsed = tryParse(cleaned.slice(arrStart, arrEnd + 1));
      if (parsed != null) {
        return parsed;
      }
    }

    const objStart = cleaned.indexOf('{');
    const objEnd = cleaned.lastIndexOf('}');
    if (objStart >= 0 && objEnd > objStart) {
      return tryParse(cleaned.slice(objStart, objEnd + 1));
    }

    return null;
  }

  private buildLocalQuestionFallback(context: any): any[] {
    const type = this.normalizeQuestionType(context?.type);
    const niveau = String(context?.niveau || 'INTERMEDIAIRE').trim().toUpperCase();
    const theme = String(context?.theme || 'entretien technique').trim();
    const nombre = Math.max(1, Math.min(10, Number(context?.nombre) || 3));
    const normalizedTheme = theme.toLowerCase();

    const javaPool = [
      'Expliquez la difference entre JDK, JRE et JVM et leur role dans le cycle d execution Java.',
      'Quand utiliser une interface plutot qu une classe abstraite en Java moderne ?',
      'Comment gerer proprement les exceptions checked et unchecked dans un service Java ?',
      'Quels benefices apporte le garbage collector et quelles limites faut-il anticiper ?',
      'Comment optimiser les performances d une API Spring Boot qui execute des requetes lentes ?'
    ];

    const sqlPool = [
      'Quelle difference entre INNER JOIN et LEFT JOIN avec un cas concret de recrutement ?',
      'Comment indexer une table SQL de candidatures pour accelerer les recherches par statut ?',
      'Pourquoi une requete peut-elle ignorer un index et comment le diagnostiquer ?',
      'Comment ecrire une requete pour retrouver les candidats ayant passe au moins 3 entretiens ?',
      'Quelles bonnes pratiques pour eviter les injections SQL dans une API backend ?'
    ];

    const genericPool = [
      'Comment prioriser une solution technique quand les contraintes delai, qualite et cout sont opposees ?',
      'Quelles etapes mettez-vous en place pour valider une fonctionnalite avant mise en production ?',
      'Comment communiquez-vous un risque technique critique a une equipe non-technique ?',
      'Quelle methode utilisez-vous pour analyser une anomalie intermittente en production ?',
      'Comment concevoir une solution evolutive qui reste simple a maintenir ?'
    ];

    const selectedPool = normalizedTheme.includes('java')
      ? javaPool
      : (normalizedTheme.includes('sql') || normalizedTheme.includes('database') || normalizedTheme.includes('bdd'))
        ? sqlPool
        : genericPool;

    return Array.from({ length: nombre }, (_, index) => {
      const contenuBase = selectedPool[index % selectedPool.length];
      if (type === 'VRAI_FAUX') {
        return {
          contenu: `${theme} - Question ${index + 1}: ${contenuBase}`,
          type,
          niveau,
          points: 1,
          ordre: index + 1,
          choix: [
            { texte: 'VRAI', correcte: true, ordre: 1 },
            { texte: 'FAUX', correcte: false, ordre: 2 }
          ]
        };
      }

      return {
        contenu: `${theme} - Question ${index + 1}: ${contenuBase}`,
        type,
        niveau,
        points: 1,
        ordre: index + 1,
        choix: [
          { texte: 'Analyser puis prioriser la solution', correcte: true, ordre: 1 },
          { texte: 'Implementer sans specification', correcte: false, ordre: 2 },
          { texte: 'Ignorer les tests', correcte: false, ordre: 3 }
        ]
      };
    });
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

  // ==================== FOLLOW FEATURE ====================

  followUser(userToFollowId: number, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/follows/${userToFollowId}/follow`, {}, { headers });
  }

  unfollowUser(userToUnfollowId: number, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/follows/${userToUnfollowId}/unfollow`, {}, { headers });
  }

  getFollowers(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/follows/${userId}/followers`);
  }

  isFollowing(userIdToCheck: number, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/follows/${userIdToCheck}/is-following`, { headers });
  }

  getFollowersCount(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/follows/${userId}/followers-count`);
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
    if (token && token !== 'undefined' && token !== 'null') {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/mes-candidatures`, { headers });
  }

  getStatsCandidatures(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token && token !== 'undefined' && token !== 'null') {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get(`${this.apiUrl}/candidatures/stats`, { headers });
  }

  // Récupérer une candidature par ID
  getCandidatureById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token && token !== 'undefined' && token !== 'null') {
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

    return this.http.get(primaryUrl, { headers }).pipe(
      catchError((firstError) => {
        const shouldTryAltEndpoint = firstError?.status === 404 || firstError?.status === 405 || firstError?.status === 500;

        if (shouldTryAltEndpoint) {
          // Fallback: fetch list and resolve the item client-side.
          // Avoid probing /api/offres/{id} which may return noisy 500s on some backends.
          return this.http.get<any[]>(`${this.apiUrl}/offres-emploi`, { headers }).pipe(
            map((offres) => {
              const matched = (offres || []).find((item: any) => Number(item?.id) === Number(id));
              if (!matched) {
                throw firstError;
              }
              return matched;
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

  // Récupérer UNIQUEMENT les documents du candidat connecté (et non tous les documents)
getMesDocuments(): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // ✅ /documents suffit — le backend filtre par candidat via le token JWT
    return this.http.get(`${this.apiUrl}/documents`, { headers });
}

// Récupérer un document par son ID (avec vérification d'appartenance)
getDocumentById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // ✅ Ce endpoint vérifie que le document appartient au candidat connecté
    return this.http.get(`${this.apiUrl}/documents/${id}`, { headers });
}

// Créer un document (automatiquement lié au candidat connecté)
creerDocument(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // ✅ Inchangé - le backend lie automatiquement au candidat connecté
    return this.http.post(`${this.apiUrl}/documents`, data, { headers });
}

// Modifier un document (vérifie que le document appartient au candidat)
modifierDocument(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // ✅ Inchangé - le backend vérifie l'appartenance avant modification
    return this.http.put(`${this.apiUrl}/documents/${id}`, data, { headers });
}

// Supprimer un document (vérifie que le document appartient au candidat)
supprimerDocument(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // ✅ Inchangé - le backend vérifie l'appartenance avant suppression
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

  // ==================== NOTIFICATIONS ====================

  getUnreadNotificationCount(token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    headers = headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers = headers.set('Pragma', 'no-cache');
    headers = headers.set('Expires', '0');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    return this.http.get(`${this.apiUrl}/notifications/unread-count?t=${timestamp}`, { headers });
  }

  getNotifications(token: string): Observable<any[]> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    headers = headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers = headers.set('Pragma', 'no-cache');
    headers = headers.set('Expires', '0');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    return this.http.get<any[]>(`${this.apiUrl}/notifications?t=${timestamp}`, { headers });
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/notifications/${notificationId}/read`, {}, { headers });
  }

  markAllNotificationsAsRead(token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/notifications/mark-all-read`, {}, { headers });
  }

  deleteAllNotifications(token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post(`${this.apiUrl}/notifications/delete-all`, {}, { headers });
  }

// ==================== FONCTIONNALITÉS AVANCÉES ====================

// 1. Gamification
getGamification(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/gamification`);
}

// 2. Smart Match
getSmartMatch(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/smart-match`);
}

// 3. Radar Compétences
getRadarCompetences(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/radar-competences`);
}

// 4. Taux de réussite
getTauxReussite(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/taux-reussite`);
}

// 5. Statistiques par mois
getStatsParMois(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/stats-par-mois`);
}

// 6. Prédiction IA
getPredictionSucces(cvContent: string, historique: any[]): Observable<any> {
    if (!this.mlAvailable) {
      return of({
        probabilite: 25,
        meilleurMoment: 'Service IA indisponible',
        pointsForts: ['Profil en cours d analyse'],
        pointsAmeliorer: ['Relancer le service ML sur le port 8000'],
        conseilsSpecifiques: ['Demarrer le serveur Python pour activer la prediction'],
        couleur: '#ef4444'
      });
    }

    return this.http.post(`${this.mlUrl}/prediction/succes`, {
      cv_content: cvContent,
      historique_candidatures: historique
    }).pipe(
      catchError(() => {
        this.mlAvailable = false;
        return of({
          probabilite: 25,
          meilleurMoment: 'Service IA indisponible',
          pointsForts: ['Profil en cours d analyse'],
          pointsAmeliorer: ['Relancer le service ML sur le port 8000'],
          conseilsSpecifiques: ['Demarrer le serveur Python pour activer la prediction'],
          couleur: '#ef4444'
        });
      })
    );
}

// 7. Relances
getRelances(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/relances`);
}

// 8. Timeline
getTimeline(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/timeline`);
}

// ==================== ANALYSE CV ====================

 analyserCV(documentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cv-analyse/analyser/${documentId}`, {});
  }

  // ============ OPTIMISATION CV ============
  optimiserCV(documentId: number, offreEmploi: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cv-analyse/optimiser/${documentId}`, { offreEmploi });
  }





//  CHATBOT
chatWithML(message: string, cvContent: string): Observable<any> {
    // Appel direct au serveur FastAPI sur le port 8000
    return this.http.post('http://localhost:8000/chat/ml', { 
        message: message, 
        cv_content: cvContent 
    });
}



}



