import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmailService {

  private apiUrl = 'http://localhost:8086/api/email';

  constructor(private http: HttpClient) {}

  postuler(
    emailEntreprise: string,
    nomCandidat: string,
    emailCandidat: string,
    message: string,
    titreOffre: string,
    cv?: File
  ): Observable<string> {

    const formData = new FormData();
    formData.append('emailEntreprise', emailEntreprise);
    
    formData.append('emailCandidat', emailCandidat);
    formData.append('message', message);
    formData.append('titreOffre', titreOffre);
    if (cv) formData.append('cv', cv);

    return this.http.post(
      this.apiUrl + '/postuler',
      formData,
      { responseType: 'text' }
    );
  }
}