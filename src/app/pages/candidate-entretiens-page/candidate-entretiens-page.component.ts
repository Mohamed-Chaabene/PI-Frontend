import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../api.service';
import { SharedModule } from '../../shared/shared.module';

interface CandidateEntretien {
  id: number;
  titre?: string;
  description?: string;
  type?: string;
  categorie?: string;
  domaine?: string;
  dateEntretien?: string;
  photo?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-candidate-entretiens-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModule],
  templateUrl: './candidate-entretiens-page.component.html',
  styleUrls: ['./candidate-entretiens-page.component.scss']
})
export class CandidateEntretiensPageComponent {
  entretiens: CandidateEntretien[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const candidatId = this.resolveCandidatId();
    if (!candidatId) {
      this.loading = false;
      this.errorMessage = 'Session invalide. Veuillez vous reconnecter.';
      return;
    }

    this.apiService.getEntretiensByCandidat(candidatId).subscribe({
      next: (data: CandidateEntretien[]) => {
        const raw = Array.isArray(data) ? data : [];
        this.entretiens = raw.filter((item) => !this.isTestEntretien(item));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos entretiens pour le moment.';
        this.loading = false;
      }
    });
  }

  private resolveCandidatId(): number | null {
    const local = Number(localStorage.getItem('candidatId'));
    if (!isNaN(local) && local > 0) {
      return local;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      const id = Number(decoded?.candidatId || decoded?.id || decoded?.userId || decoded?.sub);
      if (!isNaN(id) && id > 0) {
        localStorage.setItem('candidatId', String(id));
        return id;
      }
    } catch {
      return null;
    }

    return null;
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Date a definir';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleString('fr-FR');
  }

  getPhoto(item: CandidateEntretien): string {
    return (item.photo || '').trim() || 'images/banner/banner1.jpg';
  }

  private isTestEntretien(item: CandidateEntretien): boolean {
    const type = String(item?.type || '').toUpperCase();
    const categorie = String(item?.categorie || '').toUpperCase();
    return type === 'TEST' || categorie === 'TEST';
  }

  passEntretien(item: CandidateEntretien): void {
    this.router.navigate(['/entretiens/test', item.id]);
  }

  trackByEntretien(index: number, item: CandidateEntretien): number {
    return item?.id ?? index;
  }
}
