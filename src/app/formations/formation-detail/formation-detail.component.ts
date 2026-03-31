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
  loading     = false;
  inscrit     = false;       // ✅ sera mis à true si déjà inscrit en base
  inscribing  = false;
  candidatId: number | null = null;
  isAdmin     = false;

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
      next: (data: Formation) => {
        this.formation = data;
        this.loading   = false;
      },
      error: () => { this.loading = false; }
    });

    if (!this.isAdmin) {
      this.resolveCandidatId(() => this.verifierInscription(id));
    }
  }

  // ── Vérifier si déjà inscrit ──────────────────────────────────────────────
  private verifierInscription(formationId: number): void {
    if (!this.candidatId) return;

    this.formationService.getMesInscriptions(this.candidatId).subscribe({
      next: (inscriptions) => {
        // ✅ Inscrit = une inscription existe pour cette formation (peu importe le statut)
        this.inscrit = inscriptions.some(i => i.formation?.id === formationId);
      },
      error: () => {}
    });
  }

  // ── S'inscrire ────────────────────────────────────────────────────────────
  sInscrire(): void {
    if (this.isAdmin || this.inscrit) return;

    if (!this.candidatId) {
      this.resolveCandidatId(() => this.sInscrire());
      return;
    }

    this.inscribing = true;
    this.formationService.inscrire(this.candidatId, this.formation.id).subscribe({
      next: () => {
        this.inscrit    = true;   // ✅ cache le bouton immédiatement
        this.inscribing = false;
      },
      error: () => { this.inscribing = false; }
    });
  }

  // ── Helpers visuels ───────────────────────────────────────────────────────
  getCatClass(categorie: string): string {
    const map: Record<string, string> = {
      'Développement': 'cat-dev',  'Frontend':  'cat-frontend',
      'Backend':       'cat-backend', 'IA':     'cat-ia',
      'Data':          'cat-data',    'Design': 'cat-design',
      'DevOps':        'cat-devops'
    };
    return map[categorie] || 'cat-default';
  }

  getIconEmoji(categorie: string): string {
    const map: Record<string, string> = {
      'Data': '📊', 'Frontend': '⚡', 'Backend': '🔧',
      'IA': '🤖', 'Design': '🎨', 'DevOps': '🚀',
      'Développement': '💻', 'Mobile': '📱', 'Cloud': '☁️'
    };
    return map[categorie] || '📚';
  }

  getNiveauBadge(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'badge-green', 'Intermédiaire': 'badge-blue',
      'Avancé':   'badge-amber', 'Expert':        'badge-purple'
    };
    return map[niveau] || 'badge-blue';
  }

  // ── Résolution candidatId depuis JWT ──────────────────────────────────────
  private resolveCandidatId(onResolved?: () => void): void {
    const cached = Number(localStorage.getItem('candidatId'));
    if (!Number.isNaN(cached) && cached > 0) {
      this.candidatId = cached;
      onResolved?.();
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = Number(payload.id);
        if (!Number.isNaN(id) && id > 0) {
          this.candidatId = id;
          localStorage.setItem('candidatId', String(id));
          onResolved?.();
          return;
        }
      } catch {}
    }

    const email = localStorage.getItem('userName') || '';
    const role  = (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');
    if (!email || role !== 'CANDIDAT') return;

    this.formationService.getCandidatByEmail(email).subscribe({
      next: (candidat) => {
        if (candidat?.id) {
          this.candidatId = Number(candidat.id);
          localStorage.setItem('candidatId', String(candidat.id));
          onResolved?.();
        }
      },
      error: () => {}
    });
  }
}