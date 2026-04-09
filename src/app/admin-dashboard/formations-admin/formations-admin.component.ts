import { Component, OnInit, inject } from '@angular/core';
import { Formation } from '../../formations/models/formation.model';
import { FormationService } from '../../formations/services/formation.service';

@Component({
  selector: 'app-formations-admin',
  standalone: false,
  templateUrl: './formations-admin.component.html',
  styleUrls: ['./formations-admin.component.scss']
})
export class FormationsAdminComponent implements OnInit {
  private formationService = inject(FormationService);

  // ── Données ───────────────────────────────────────────────────────────────
  actives:   Formation[] = [];  // Disponible + Bientôt
  archivees: Formation[] = [];  // Archivée uniquement

  loading       = false;
  deletingId:   number | null = null;
  archivingId:  number | null = null;
  activeTab: 'actives' | 'archivees' = 'actives';

  // ── Filtres et Pagination ─────────────────────────────────────────────────
  searchTerm: string = '';
  filterNiveau: string = '';
  filterStatut: string = '';
  currentPage: number = 1;
  pageSize: number = 5;

  get filteredFormations(): Formation[] {
    const list = this.activeTab === 'actives' ? this.actives : this.archivees;
    return list.filter(f => {
      const matchSearch = f.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) || f.categorie.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchNiv = this.filterNiveau ? f.niveau === this.filterNiveau : true;
      const matchStatut = this.filterStatut ? f.statut === this.filterStatut : true;
      return matchSearch && matchNiv && matchStatut;
    });
  }

  get paginatedFormations(): Formation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFormations.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredFormations.length / this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.formationService.getAllFormationsAdmin().subscribe({
      next: (data) => {
        this.actives   = data.filter(f => f.statut !== 'Archivée');
        this.archivees = data.filter(f => f.statut === 'Archivée');
        this.loading   = false;
        
        // Ajuster la page courante si elle dépasse le nouveau nombre de pages
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
        } else if (this.totalPages === 0) {
          this.currentPage = 1;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  archiver(id: number): void {
    if (!confirm('Archiver cette formation ? Elle ne sera plus visible dans la liste publique.')) return;
    this.archivingId = id;
    this.formationService.archiverFormation(id).subscribe({
      next: () => { this.archivingId = null; this.refresh(); },
      error: () => { this.archivingId = null; }
    });
  }

  desarchiver(id: number): void {
    if (!confirm('Désarchiver cette formation ? Elle sera à nouveau visible dans la liste publique.')) return;
    this.archivingId = id;
    this.formationService.desarchiverFormation(id).subscribe({
      next: () => { this.archivingId = null; this.refresh(); },
      error: () => { this.archivingId = null; }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer définitivement cette formation ?')) return;
    this.deletingId = id;
    this.formationService.deleteFormation(id).subscribe({
      next: () => { this.deletingId = null; this.refresh(); },
      error: () => { this.deletingId = null; }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getCount(statut: string): number {
    return [...this.actives, ...this.archivees].filter(f => f.statut === statut).length;
  }

  get totalFormations(): number {
    return this.actives.length + this.archivees.length;
  }

  getNiveauTag(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'tag-green', 'Intermédiaire': 'tag-blue',
      'Avancé': 'tag-amber',   'Expert': 'tag-purple'
    };
    return map[niveau] || 'tag-blue';
  }

  getStatutTag(statut: string): string {
    const map: Record<string, string> = {
      'Disponible': 'tag-green', 'Bientôt': 'tag-amber', 'Archivée': 'tag-gray'
    };
    return map[statut] || 'tag-gray';
  }

  setTab(tab: 'actives' | 'archivees'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.filterNiveau = '';
    this.filterStatut = '';
    this.currentPage = 1;
  }
}