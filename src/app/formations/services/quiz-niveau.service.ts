import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuizNiveau, QuizResultat, QuizGenerationRequest, QuizSoumissionDTO, QuizHistorique } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizNiveauService {

  private readonly api = 'http://localhost:8080/api/quiz-niveau';

  constructor(private http: HttpClient) {}

  genererQuiz(req: QuizGenerationRequest): Observable<QuizNiveau> {
    return this.http.post<QuizNiveau>(`${this.api}/generer`, req);
  }

  getQuiz(id: number): Observable<QuizNiveau> {
    return this.http.get<QuizNiveau>(`${this.api}/${id}`);
  }

  soumettre(dto: QuizSoumissionDTO): Observable<QuizResultat> {
    return this.http.post<QuizResultat>(`${this.api}/soumettre`, dto);
  }

  getHistoriqueQuiz(inscriptionParcoursId: number): Observable<QuizHistorique[]> {
    return this.http.get<QuizHistorique[]>(`${this.api}/inscription/${inscriptionParcoursId}`);
  }
}
