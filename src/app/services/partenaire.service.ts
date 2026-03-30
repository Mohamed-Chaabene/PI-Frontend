import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PartenaireService {

    private apiUrl = 'http://localhost:8086/api/partenaires';

    constructor(private http: HttpClient) {}

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    create(p: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, p);
    }

    update(id: number, p: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, p);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}