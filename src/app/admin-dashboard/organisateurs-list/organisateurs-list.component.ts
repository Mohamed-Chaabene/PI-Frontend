import { Component, OnInit } from '@angular/core';
import { OrganisateurAdminService } from '../../services/organisateur-admin.service';

@Component({
  selector: 'app-organisateurs-list',
  templateUrl: './organisateurs-list.component.html',
  styleUrls: ['./organisateurs-list.component.scss']
  
})
export class OrganisateursListComponent implements OnInit {

  organisateurs: any[] = [];
  filteredOrganisateurs: any[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private organisateurService: OrganisateurAdminService) {}

  ngOnInit() {
    this.loadOrganisateurs();
  }

  loadOrganisateurs() {
    this.isLoading = true;
    this.organisateurService.getAll().subscribe({
      next: (data) => {
        this.organisateurs = data;
        this.filteredOrganisateurs = [...data];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    const t = term.toLowerCase().trim();
    this.filteredOrganisateurs = this.organisateurs.filter(o =>
      (o.nom?.toLowerCase().includes(t)) ||
      (o.email?.toLowerCase().includes(t)) ||
      (o.organisation?.toLowerCase().includes(t))
    );
  }

  toggleStatut(organisateur: any) {
    this.organisateurService.toggleStatut(organisateur.id).subscribe({
      next: (updated) => {
        organisateur.actif = updated.actif;
      }
    });
  }

  supprimer(id: number) {
    if (!confirm('Confirmer la suppression de cet organisateur ?')) return;
    this.organisateurService.delete(id).subscribe({
      next: () => {
        this.organisateurs = this.organisateurs.filter(o => o.id !== id);
        this.filteredOrganisateurs = this.filteredOrganisateurs.filter(o => o.id !== id);
      }
    });
  }
}