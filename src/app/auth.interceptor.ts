import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/api/auth/')) {
      return next.handle(req).pipe(catchError((error: HttpErrorResponse) => this.handleAuthError(error)));
    }

    const token = localStorage.getItem('token');
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(catchError((error: HttpErrorResponse) => this.handleAuthError(error)));
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      console.warn('⚠️ Auth failed (401):', error.error?.message || error.statusText);
      localStorage.removeItem('token');
      localStorage.removeItem('recruteurId');
      alert('Session expirée ou non autorisée. Vous allez être redirigé vers la page de connexion.');
      window.location.href = '/login';
    }
    return throwError(() => error);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/auth/')) {
    return next(req).pipe(catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('recruteurId');
        alert('Session expirée. Redirection vers connexion.');
        window.location.href = '/login';
      }
      return throwError(() => error);
    }));
  }

  const token = localStorage.getItem('token');
  const cloned = token ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }) : req;

  return next(cloned).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('recruteurId');
      alert('Session expirée. Redirection vers connexion.');
      window.location.href = '/login';
    }
    return throwError(() => error);
  }));
};