import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Formation } from '../models/formation.model';
import { Inscription, InscriptionCreatePayload } from '../models/inscription.model';
import { Certificat } from '../models/certificat.model';

export type FormationCreatePayload = Omit<Formation, 'id'>;
export type FormationUpdatePayload = Partial<Omit<Formation, 'id'>>;

@Injectable({ providedIn: 'root' })
export class FormationService {

  private api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getAllFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.api}/formations`);
  }

  getFormationById(id: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.api}/formations/${id}`);
  }

  getByNiveau(niveau: string): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.api}/formations/niveau/${niveau}`);
  }

  getByCategorie(categorie: string): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.api}/formations/categorie/${categorie}`);
  }

  inscrire(candidatId: number, formationId: number): Observable<Inscription> {
    const payload: InscriptionCreatePayload = {
      candidat: { id: candidatId },
      formation: { id: formationId }
    };
    return this.http.post<Inscription>(`${this.api}/inscriptions`, payload);
  }

  updateProgression(inscriptionId: number, progression: number): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.api}/inscriptions/${inscriptionId}`, {
      progression
    });
  }

  getMesInscriptions(candidatId: number): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.api}/inscriptions/candidat/${candidatId}`);
  }

  getMesCertificats(candidatId: number): Observable<Certificat[]> {
    return this.http.get<Certificat[]>(`${this.api}/certificats/candidat/${candidatId}`);
  }

  getCandidatByEmail(email: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.api}/candidats/email/${encodeURIComponent(email)}`);
  }

  // --- Admin CRUD ---
  createFormation(payload: FormationCreatePayload): Observable<Formation> {
    return this.http.post<Formation>(`${this.api}/formations`, payload);
  }

  updateFormation(id: number, payload: FormationUpdatePayload): Observable<Formation> {
    return this.http.put<Formation>(`${this.api}/formations/${id}`, payload);
  }

  deleteFormation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/formations/${id}`);
  }

  getInscriptionsByFormation(formationId: number): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.api}/inscriptions/formation/${formationId}`);
  }
telechargerCertificat(id: number): Observable<Blob> {
  return this.http.get(
    `${this.api}/certificats/${id}/telecharger`,
    { 
      responseType: 'blob',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );
}
}