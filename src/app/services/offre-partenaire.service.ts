import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OffrePartenaireService {

    private apiUrl = 'http://localhost:8080/api/offres-partenaires';

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
}