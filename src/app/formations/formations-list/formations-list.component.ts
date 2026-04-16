import { Component, OnInit } from '@angular/core';
import { Formation, FormationStats } from '../models/formation.model';
import { FormationService } from '../services/formation.service';
import { FeedbackService } from '../services/feedback.service';

@Component({
  selector: 'app-formations-list',
  standalone: false,
  templateUrl: './formations-list.component.html',
  styleUrls: ['./formations-list.component.scss']
})
export class FormationsListComponent implements OnInit {

  formations: Formation[] = [];
  filtered:   Formation[] = [];
  searchTerm   = '';
  activeFilter = 'Toutes';
  filters = ['Toutes', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
  loading = false;
  refreshing = false;
  isAdmin = false;
  ratings: { [formationId: number]: { moyenne: number; total: number } } = {};
  stars = [1, 2, 3, 4, 5];

  // ── Stats & filtres ───────────────────────────────────────────────────────
  stats:          FormationStats[] = [];
  topFormations:  FormationStats[] = [];
  badgeFilter     = '';
  categorieFilter = '';

  readonly badges = ['', 'Tendance', 'Populaire', 'Top noté', 'Bien noté', 'En progression'];
  readonly categories = [
    '', 'Frontend', 'Backend', 'IA', 'Data',
    'DevOps', 'Design', 'Mobile', 'Développement'
  ];

  constructor(
    private formationService: FormationService,
    private feedbackService:  FeedbackService
  ) {}

  ngOnInit(): void {
    const role = (localStorage.getItem('userRole') || '').toUpperCase().replace('ROLE_', '');
    this.isAdmin = role === 'ADMIN';
    this.loadAll();
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loadFormations();
    this.loadStats();
    this.loadTop();
  }

  loadFormations(): void {
    this.loading = true;
    const req = this.badgeFilter
      ? this.formationService.getFormationsParBadge(this.badgeFilter)
      : this.formationService.getAllFormations();

    req.subscribe({
      next: (data: Formation[]) => {
        this.formations = data.filter(f => f.statut !== 'Archivée');
        this.filtered   = [...this.formations];
        this.loading    = false;
        this.loadRatings();
      },
      error: () => { this.loading = false; }
    });
  }

  loadStats(): void {
    const req = this.categorieFilter
      ? this.formationService.getStatsByCategorie(this.categorieFilter)
      : this.formationService.getStats();

    req.subscribe({ next: (data) => { this.stats = data; } });
  }

  loadTop(): void {
    this.formationService.getTopFormations().subscribe({
      next: (data) => {
        this.topFormations = data;
        // Charger les ratings pour chaque formation du top
        this.topFormations.forEach(t => {
          const key = t.formationId;
          if (!this.ratings[key]) {
            this.feedbackService.getStats(key).subscribe({
              next:  (s) => { this.ratings[key] = s; },
              error: ()  => { this.ratings[key] = { moyenne: 0, total: 0 }; }
            });
          }
        });
      }
    });
  }

  refreshStatistics(): void {
    this.refreshing = true;
    this.formationService.refreshScoresAndBadges().subscribe({
      next: () => {
        this.refreshing = false;
        this.loadAll();
      },
      error: () => {
        this.refreshing = false;
        this.loadAll();
      }
    });
  }

  private loadRatings(): void {
    this.formations.forEach(f => {
      this.feedbackService.getStats(f.id).subscribe({
        next:  (s) => { this.ratings[f.id] = s; },
        error: ()  => { this.ratings[f.id] = { moyenne: 0, total: 0 }; }
      });
    });
  }

  // ── Filtres / recherche ───────────────────────────────────────────────────

  onBadgeChange(badge: string): void {
    this.badgeFilter = badge;
    this.loadFormations();
  }

  onCategorieChange(cat: string): void {
    this.categorieFilter = cat;
    this.loadStats();
    this.applySearch();
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    this.applySearch();
  }

  applySearch(): void {
    let result = this.formations;

    if (this.activeFilter !== 'Toutes') {
      result = result.filter(f => f.niveau === this.activeFilter);
    }

    if (this.categorieFilter) {
      result = result.filter(f => f.categorie === this.categorieFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(f =>
        f.titre.toLowerCase().includes(term) ||
        f.categorie.toLowerCase().includes(term)
      );
    }

    this.filtered = result;
  }

  getDisponibles(): number {
    return this.formations.filter(f => f.statut === 'Disponible').length;
  }

  // ── Helpers top formations ────────────────────────────────────────────────

  /** Classe CSS du pill rang */
  getRankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-other';
  }

  /** Label textuel du rang */
  getRankLabel(index: number): string {
    if (index === 0) return 'Or';
    if (index === 1) return 'Argent';
    if (index === 2) return 'Bronze';
    return '';
  }

  /** Couleur du score basée sur la valeur réelle */
  getScoreColor(score: number): string {
    if (score >= 70) return '#633806'; // doré — top qualité
    if (score >= 50) return '#444441'; // argenté — bon
    if (score >= 30) return '#712B13'; // bronze — moyen
    return '#185FA5';                  // bleu — débutant
  }

  // ── ✅ Note moyenne du top : priorité FeedbackService → fallback DTO ──────
  getTopNoteMoyenne(top: FormationStats): string | null {
    const r = this.ratings[top.formationId];
    if (r && r.moyenne > 0) return r.moyenne.toFixed(1);
    if (top.noteMoyenne && top.noteMoyenne > 0) return top.noteMoyenne.toFixed(1);
    return null;
  }

  // ── ✅ Nombre d'avis (feedbacks) ─────────────────────────────────────────
  getTopNbAvis(top: FormationStats): number {
    const r = this.ratings[top.formationId];
    if (r) return r.total;
    return 0;
  }

  // ── ✅ Nombre d'étoiles entières pour affichage visuel ───────────────────
  getTopNoteEtoiles(top: FormationStats): number {
    const r = this.ratings[top.formationId];
    if (r && r.moyenne > 0) return Math.round(r.moyenne);
    if (top.noteMoyenne && top.noteMoyenne > 0) return Math.round(top.noteMoyenne);
    return 0;
  }

  // ── ✅ Nombre de participants (inscrits) ──────────────────────────────────
  getTopParticipants(top: FormationStats): number {
    return top.totalInscrits || 0;
  }

  // ── Helpers cartes formation ───────────────────────────────────────────────

  getIconEmoji(categorie: string): string {
    const map: Record<string, string> = {
      'Data':          '📊',
      'Frontend':      '⚡',
      'Backend':       '🔧',
      'IA':            '🤖',
      'Design':        '🎨',
      'DevOps':        '🚀',
      'Développement': '💻',
      'Mobile':        '📱',
      'Cloud':         '☁️'
    };
    return map[categorie] || '📚';
  }

  getCatClass(categorie: string): string {
    const map: Record<string, string> = {
      'Développement': 'cat-dev',
      'Frontend':      'cat-frontend',
      'Backend':       'cat-backend',
      'IA':            'cat-ia',
      'Data':          'cat-data',
      'Design':        'cat-design',
      'DevOps':        'cat-devops'
    };
    return map[categorie] || 'cat-default';
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'Disponible': 'disponible',
      'Bientôt':    'bientot',
      'Archivée':   'archivee'
    };
    return map[statut] || 'disponible';
  }

  getNiveauClass(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant':      'debutant',
      'Intermédiaire': 'intermediaire',
      'Avancé':        'avance',
      'Expert':        'expert'
    };
    return map[niveau] || 'debutant';
  }

  // ── Helpers badges ────────────────────────────────────────────────────────

  getBadgeClass(badge: string | null | undefined): string {
    const map: Record<string, string> = {
      'Tendance':       'badge-purple',
      'Populaire':      'badge-blue',
      'Top noté':       'badge-green',
      'Bien noté':      'badge-teal',
      'En progression': 'badge-amber'
    };
    return badge ? (map[badge] || 'badge-gray') : '';
  }

  getBadgeIcon(badge: string | null | undefined): string {
    const map: Record<string, string> = {
      'Tendance':       '🔥',
      'Populaire':      '⭐',
      'Top noté':       '🏆',
      'Bien noté':      '👍',
      'En progression': '📈'
    };
    return badge ? (map[badge] || '') : '';
  }
}