import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rd-candidatures-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rd-candidatures-list.component.html',
  styleUrls: ['./rd-candidatures-list.component.scss']
})
export class RdCandidaturesListComponent implements OnInit {
  candidatures: any[] = [];
  filteredCandidatures: any[] = [];
  loading = false;
  selectedStatut = 'TOUS';
  searchTerm = '';
  selectedCandidature: any = null;
  showDetailModal = false;
  
  // Statuts disponibles
  statuts = ['TOUS', 'EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'];
  
  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalCandidatures = 0;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCandidatures();
  }

  // Charger toutes les candidatures
  loadCandidatures(): void {
    this.loading = true;
    this.apiService.getAllCandidaturesForRecruteur().subscribe({
      next: (data) => {
        this.candidatures = data || [];
        this.totalCandidatures = this.candidatures.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des candidatures:', err);
        this.notifyError('Erreur lors du chargement des candidatures');
        this.loading = false;
      }
    });
  }

  // Appliquer les filtres
  applyFilters(): void {
    let filtered = this.candidatures;

    // Filtrer par statut
    if (this.selectedStatut !== 'TOUS') {
      filtered = filtered.filter(c => c.statut === this.selectedStatut);
    }

    // Filtrer par recherche (nom, email, entreprise)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        (c.nomComplet && c.nomComplet.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.entreprise && c.entreprise.toLowerCase().includes(term))
      );
    }

    this.filteredCandidatures = filtered;
  }

  // Afficher les détails d'une candidature
  showDetails(candidature: any): void {
    this.selectedCandidature = candidature;
    this.showDetailModal = true;
  }

  creerEntretienPourCandidat(candidature: any): void {
    this.router.navigate(['/recruiter-dashboard/interviews'], {
      queryParams: {
        createFromCandidature: 1,
        candidatureId: candidature?.id || '',
        candidatId: candidature?.candidatId || '',
        nomComplet: candidature?.nomComplet || '',
        email: candidature?.email || '',
        poste: candidature?.offreTitre || candidature?.poste || ''
      }
    });
  }

  // Fermer la modal des détails
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedCandidature = null;
  }

  // Accepter une candidature
  accepterCandidature(candidature: any): void {
    if (confirm(`Êtes-vous sûr d'accepter la candidature de ${candidature.nomComplet}?`)) {
      this.loading = true;
      this.apiService.modifierStatutCandidature(candidature.id, 'ACCEPTEE').subscribe({
        next: (response) => {
          this.notifySuccess('Candidature acceptée avec succès');
          // Envoyer l'email d'acceptation
          this.envoyerEmailAcceptation(candidature);
          // Rafraîchir la liste
          this.loadCandidatures();
        },
        error: (err) => {
          console.error('Erreur lors de l\'acceptation:', err);
          this.notifyError('Erreur lors de l\'acceptation de la candidature');
          this.loading = false;
        }
      });
    }
  }

  // Rejeter une candidature
  rejeterCandidature(candidature: any): void {
    if (confirm(`Êtes-vous sûr de rejeter la candidature de ${candidature.nomComplet}?`)) {
      this.loading = true;
      this.apiService.modifierStatutCandidature(candidature.id, 'REFUSEE').subscribe({
        next: (response) => {
          this.notifySuccess('Candidature rejetée');
          // Envoyer l'email de rejet
          this.envoyerEmailRejet(candidature);
          // Rafraîchir la liste
          this.loadCandidatures();
        },
        error: (err) => {
          console.error('Erreur lors du rejet:', err);
          this.notifyError('Erreur lors du rejet de la candidature');
          this.loading = false;
        }
      });
    }
  }

  // Envoyer l'email d'acceptation
  envoyerEmailAcceptation(candidature: any): void {
    const emailData = {
      to: candidature.email,
      subject: 'Bonne nouvelle - Votre candidature a été acceptée!',
      nomCandidat: candidature.nomComplet,
      message: `Nous vous informons que votre candidature pour le poste a été acceptée.
      
Nous vous invitons à passer un entretien. Veuillez nous contacter pour fixer une date et heure qui vous convient.

Cordialement,
L'équipe de recrutement`,
      candidatureId: candidature.id
    };

    this.apiService.envoyerEmailCandidature(emailData).subscribe({
      next: () => {
        this.notifySuccess('Email d\'acceptation envoyé au candidat');
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi de l\'email:', err);
        this.notifyWarning('Candidature acceptée mais l\'email n\'a pas pu être envoyé');
      }
    });
  }

  // Envoyer l'email de rejet
  envoyerEmailRejet(candidature: any): void {
    const emailData = {
      to: candidature.email,
      subject: 'Retour sur votre candidature',
      nomCandidat: candidature.nomComplet,
      message: `Nous vous remercions de l'intérêt que vous portez à notre entreprise.

Après examen attentif de votre dossier, nous regrettons de vous informer que nous ne pouvons pas vous retenir pour le poste en question.

Nous vous encourageons à postuler à d'autres offres qui correspondraient mieux à votre profil.

Cordialement,
L'équipe de recrutement`,
      candidatureId: candidature.id
    };

    this.apiService.envoyerEmailCandidature(emailData).subscribe({
      next: () => {
        this.notifySuccess('Email de rejet envoyé au candidat');
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi de l\'email:', err);
        this.notifyWarning('Candidature rejetée mais l\'email n\'a pas pu être envoyé');
      }
    });
  }

  // Paginer
  get paginatedCandidatures(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredCandidatures.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCandidatures.length / this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getDisplayEndCount(): number {
    const end = this.currentPage * this.pageSize;
    return end < this.filteredCandidatures.length ? end : this.filteredCandidatures.length;
  }

  // Obtenir le badge de statut
  getStatusBadge(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE':
        return 'badge-success';
      case 'REFUSEE':
        return 'badge-danger';
      case 'EN_ATTENTE':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  // Obtenir le statut lisible
  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE':
        return 'Acceptée';
      case 'REFUSEE':
        return 'Rejetée';
      case 'EN_ATTENTE':
        return 'En attente';
      default:
        return statut;
    }
  }

  private notifySuccess(message: string): void {
    console.log(message);
  }

  private notifyError(message: string): void {
    console.error(message);
  }

  private notifyWarning(message: string): void {
    console.warn(message);
  }
}
