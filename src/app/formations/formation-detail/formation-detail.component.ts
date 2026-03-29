import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Formation } from '../models/formation.model';
import { FormationService } from '../services/formation.service';

@Component({
  selector: 'app-formation-detail',
  standalone: false,
  templateUrl: './formation-detail.component.html',
  styleUrls: ['./formation-detail.component.scss']
})
export class FormationDetailComponent implements OnInit {
  formation!: Formation;
  loading = false;
  inscrit = false;
  inscribing = false;
  candidatId: number | null = null;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private formationService: FormationService
  ) {}

  ngOnInit(): void {
    const role = (localStorage.getItem('userRole') || '').toUpperCase().replace('ROLE_', '');
    this.isAdmin = role === 'ADMIN';

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.formationService.getFormationById(id).subscribe({
      next: (data: Formation) => { this.formation = data; this.loading = false; },
      error: () => this.loading = false
    });

    if (!this.isAdmin) this.resolveCandidatId();
  }

  sInscrire(): void {
    if (this.isAdmin) return;
    if (!this.candidatId) { this.resolveCandidatId(() => this.sInscrire()); return; }
    this.inscribing = true;
    this.formationService.inscrire(this.candidatId, this.formation.id).subscribe({
      next: () => { this.inscrit = true; this.inscribing = false; },
      error: () => this.inscribing = false
    });
  }

  // ── Helpers visuels ──────────────────────────────────────────────────────
  getCatClass(categorie: string): string {
    const map: Record<string, string> = {
      'Développement': 'cat-dev', 'Frontend': 'cat-frontend',
      'Backend': 'cat-backend',   'IA': 'cat-ia',
      'Data': 'cat-data',         'Design': 'cat-design', 'DevOps': 'cat-devops'
    };
    return map[categorie] || 'cat-default';
  }

  getIconEmoji(categorie: string): string {
    const map: Record<string, string> = {
      'Data': '🐍', 'Frontend': '⚡', 'Backend': '☕',
      'IA': '🤖', 'Design': '🎨', 'DevOps': '⚙️', 'Développement': '💻'
    };
    return map[categorie] || '📚';
  }

private resolveCandidatId(onResolved?: () => void): void {
  // 1. Déjà en cache
  const cached = Number(localStorage.getItem('candidatId'));
  if (!Number.isNaN(cached) && cached > 0) {
    this.candidatId = cached;
    onResolved?.();
    return;
  }

  const role = (localStorage.getItem('userRole') || '')
    .toUpperCase().replace(/^ROLE_/, '');
  if (role !== 'CANDIDAT') return;

  // 2. ✅ Extraire l'id directement depuis le token JWT (pas d'appel HTTP)
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idFromToken = Number(payload.id);
      if (!Number.isNaN(idFromToken) && idFromToken > 0) {
        this.candidatId = idFromToken;
        localStorage.setItem('candidatId', String(idFromToken));
        onResolved?.();
        return;
      }
    } catch (e) {
      console.error('Erreur décodage token:', e);
    }
  }

  // 3. Fallback : appel HTTP avec l'email
  const email = localStorage.getItem('userName') || '';
  if (!email) return;

  this.formationService.getCandidatByEmail(email).subscribe({
    next: (candidat) => {
      if (candidat?.id) {
        this.candidatId = Number(candidat.id);
        localStorage.setItem('candidatId', String(candidat.id));
        onResolved?.();
      }
    },
    error: (err) => {
      console.error('getCandidatByEmail échoué:', err);
    }
  });
}
}