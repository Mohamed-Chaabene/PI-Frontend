import { Component, OnInit, inject } from '@angular/core';
import { Formation } from '../../models/formation.model';
import { FormationService } from '../../services/formation.service';

@Component({
  selector: 'app-formations-admin',
  standalone: false,
  templateUrl: './formations-admin.component.html',
  styleUrls: ['./formations-admin.component.scss']
})
export class FormationsAdminComponent implements OnInit {
  private formationService = inject(FormationService);

  formations: Formation[] = [];
  loading = false;
  deletingId: number | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.formationService.getAllFormations().subscribe({
      next: (data) => { this.formations = data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette formation ?')) return;
    this.deletingId = id;
    this.formationService.deleteFormation(id).subscribe({
      next: () => { this.deletingId = null; this.refresh(); },
      error: () => { this.deletingId = null; }
    });
  }

  getCount(statut: string): number {
    return this.formations.filter(f => f.statut === statut).length;
  }

  getNiveauTag(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'tag-green', 'Intermédiaire': 'tag-blue',
      'Avancé': 'tag-amber',  'Expert': 'tag-purple'
    };
    return map[niveau] || 'tag-blue';
  }

  getStatutTag(statut: string): string {
    const map: Record<string, string> = {
      'Disponible': 'tag-green', 'Bientôt': 'tag-amber', 'Archivée': 'tag-gray'
    };
    return map[statut] || 'tag-gray';
  }
}