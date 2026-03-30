import { Component, OnInit } from '@angular/core';
import { Formation } from '../models/formation.model';
import { FormationService } from '../services/formation.service';

@Component({
  selector: 'app-formations-list',
  standalone: false,
  templateUrl: './formations-list.component.html',
  styleUrls: ['./formations-list.component.scss']
})
export class FormationsListComponent implements OnInit {
  formations: Formation[] = [];
  filtered: Formation[] = [];
  searchTerm = '';
  activeFilter = 'Toutes';
  filters = ['Toutes', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
  loading = false;
  isAdmin = false;

  constructor(private formationService: FormationService) {}

  ngOnInit(): void {
    const role = (localStorage.getItem('userRole') || '').toUpperCase().replace('ROLE_', '');
    this.isAdmin = role === 'ADMIN';
    this.load();
  }

  private load(): void {
    this.loading = true;
    // ✅ L'API publique ne retourne déjà plus les archivées
    this.formationService.getAllFormations().subscribe({
      next: (data: Formation[]) => {
        // Double sécurité : filtre côté client aussi
        this.formations = data.filter(f => f.statut !== 'Archivée');
        this.filtered   = [...this.formations];
        this.loading    = false;
      },
      error: () => this.loading = false
    });
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

  getIconEmoji(categorie: string): string {
    const map: Record<string, string> = {
      'Data': '📊', 'Frontend': '⚡', 'Backend': '🔧',
      'IA': '🤖', 'Design': '🎨', 'DevOps': '🚀',
      'Développement': '💻', 'Mobile': '📱', 'Cloud': '☁️'
    };
    return map[categorie] || '📚';
  }

  getCatClass(categorie: string): string {
    const map: Record<string, string> = {
      'Développement': 'cat-dev', 'Frontend': 'cat-frontend',
      'Backend': 'cat-backend',   'IA': 'cat-ia',
      'Data': 'cat-data',         'Design': 'cat-design', 'DevOps': 'cat-devops'
    };
    return map[categorie] || 'cat-default';
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'Disponible': 'disponible', 'Bientôt': 'bientot', 'Archivée': 'archivee'
    };
    return map[statut] || 'disponible';
  }

  getNiveauClass(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'debutant', 'Intermédiaire': 'intermediaire',
      'Avancé': 'avance',     'Expert': 'expert'
    };
    return map[niveau] || 'debutant';
  }
}