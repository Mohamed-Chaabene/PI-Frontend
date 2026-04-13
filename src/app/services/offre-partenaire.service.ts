import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OffrePartenaireService {

    private apiUrl = 'http://localhost:8081/api/offres-partenaires';

    constructor(private http: HttpClient) {}

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getByPartenaire(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/partenaire/${id}`);
    }

    create(o: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, o);
    }

    update(id: number, o: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, o);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
    searchByKeyword(keyword: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/search?keyword=${keyword}`);
    }

    predictNextOffreType(partenaireId: number): Observable<string> {return this.http.get(`${this.apiUrl}/predict/${partenaireId}`,{ responseType: 'text' });
    }

    toggleEpingle(id: number): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}/epingle`, {});
    }

    getByPartenaireTriees(partenaireId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/partenaire/${partenaireId}/triees`);
    }
}