import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeedbackEventService {

    private apiUrl = 'http://localhost:8081/api/feedbacks-evenement';

    constructor(private http: HttpClient) {}

    // Créer un feedback
    create(data: {
        commentaire: string;
        note: number;
        participationId: number;
    }): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    // Feedbacks d'une participation
    getByParticipation(participationId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/participation/${participationId}`);
    }

    // Note moyenne d'un événement
    getNoteMoyenne(evenementId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/evenement/${evenementId}/moyenne`);
    }

    // Supprimer un feedback
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Dans feedback-event.service.ts — ajoute cette méthode
    getByEvenement(evenementId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evenement/${evenementId}`);
}

}