import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-rd-manage-jobs',
    standalone: false,
    templateUrl: './rd-manage-jobs.component.html',
    styleUrls: ['./rd-manage-jobs.component.scss']
})
export class RdManageJobsComponent {
    offres: any[] = [];
    loading = false;
    saving = false;
    errorMessage = '';
    successMessage = '';
    offreEditee: any = null;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void { this.chargerOffres(); }

    chargerOffres(): void {
        this.loading = true;
        this.errorMessage = '';
        this.apiService.getMesOffresEmploi().subscribe({
            next: (data) => {
                this.offres = data || [];
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.apiService.getOffresEmploi().subscribe({
                    next: (fallbackData) => {
                        this.offres = fallbackData || [];
                        this.errorMessage = this.offres.length > 0 ? '' : 'Impossible de charger vos offres.';
                        this.loading = false;
                    },
                    error: () => {
                        this.errorMessage = 'Impossible de charger vos offres.';
                        this.loading = false;
                    }
                });
            }
        });
    }

    modifier(offre: any): void {
        this.offreEditee = {
            ...offre,
            deadline: offre?.deadline ? this.toDateInputValue(offre.deadline) : ''
        };
    }

    annuler(): void {
        this.offreEditee = null;
    }

    enregistrer(): void {
        if (!this.offreEditee?.id) { return; }

        this.saving = true;
        const payload = {
            ...this.offreEditee,
            deadline: this.offreEditee.deadline ? new Date(this.offreEditee.deadline) : null,
            competencesRequises: Array.isArray(this.offreEditee.competencesRequises) ? this.offreEditee.competencesRequises : []
        };

        this.apiService.modifierOffreEmploi(this.offreEditee.id, payload).subscribe({
            next: () => {
                this.successMessage = 'Offre mise a jour.';
                this.offreEditee = null;
                this.saving = false;
                this.chargerOffres();
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = 'Erreur lors de la mise a jour.';
                this.saving = false;
            }
        });
    }

    supprimer(offre: any): void {
        if (!offre?.id) { return; }
        if (!confirm(`Supprimer l'offre "${offre.titre}" ?`)) { return; }

        this.apiService.supprimerOffreEmploi(offre.id).subscribe({
            next: () => {
                this.successMessage = 'Offre supprimee.';
                this.chargerOffres();
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = 'Erreur lors de la suppression.';
            }
        });
    }

    formatDate(value: any): string {
        if (!value) { return '-'; }
        return new Date(value).toLocaleDateString('fr-FR');
    }

    private toDateInputValue(value: any): string {
        const d = new Date(value);
        if (isNaN(d.getTime())) { return ''; }
        const month = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }
}
