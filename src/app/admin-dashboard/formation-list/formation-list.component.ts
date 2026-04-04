import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormationService } from '../../formations/services/formation.service';

@Component({
  selector: 'app-formation-list',
  standalone: false,
  templateUrl: './formation-list.component.html',
  styleUrls: ['./formation-list.component.scss']
})
export class FormationListComponent implements OnInit {
  private router = inject(Router);
  private formationService = inject(FormationService);

  formations: any[] = [];
  loading = false;
  activeTab: 'actives' | 'archivees' = 'actives';
  deletingId: number | null = null;
  actives: any[] = [];
  archivees: any[] = [];

  ngOnInit(): void {
    this.loadFormations();
  }

  loadFormations(): void {
    this.loading = true;
    this.formationService.getAllFormationsAdmin().subscribe({
      next: (data) => {
        this.formations = data || [];
        this.actives = this.formations.filter(f => f.statut !== 'Archivée');
        this.archivees = this.formations.filter(f => f.statut === 'Archivée');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement formations:', err);
        this.formations = [];
        this.loading = false;
      }
    });
  }

  createFormation(): void {
    this.router.navigate(['/formations/admin/create']);
  }

  editFormation(id: number): void {
    this.router.navigate(['/formations/admin/edit', id]);
  }

  viewDetails(id: number): void {
    this.router.navigate(['/formations', id]);
  }

  deleteFormation(id: number): void {
    if (!confirm('Supprimer cette formation ?')) return;
    this.deletingId = id;
    this.formationService.deleteFormation(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadFormations();
      },
      error: () => { this.deletingId = null; }
    });
  }

  archiveFormation(id: number): void {
    if (!confirm('Archiver cette formation ?')) return;
    this.formationService.archiverFormation(id).subscribe({
      next: () => {
        this.loadFormations();
      },
      error: () => { }
    });
  }

  desarchiveFormation(id: number): void {
    if (!confirm('Désarchiver cette formation ?')) return;
    this.formationService.desarchiverFormation(id).subscribe({
      next: () => {
        this.loadFormations();
      },
      error: () => { }
    });
  }

  setTab(tab: 'actives' | 'archivees'): void {
    this.activeTab = tab;
  }

  get totalFormations(): number {
    return this.formations.length;
  }

  getCount(statut: string): number {
    return this.formations.filter(f => f.statut === statut).length;
  }

  getNiveauTag(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'tag-green',
      'Intermédiaire': 'tag-blue',
      'Avancé': 'tag-amber',
      'Expert': 'tag-purple'
    };
    return map[niveau] || 'tag-blue';
  }

  getStatutTag(statut: string): string {
    const map: Record<string, string> = {
      'Disponible': 'tag-green',
      'Bientôt': 'tag-amber',
      'Archivée': 'tag-gray'
    };
    return map[statut] || 'tag-gray';
  }
}
