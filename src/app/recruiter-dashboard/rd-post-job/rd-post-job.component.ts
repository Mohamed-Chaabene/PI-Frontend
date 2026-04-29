import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-rd-post-job',
    standalone: false,
    templateUrl: './rd-post-job.component.html',
    styleUrls: ['./rd-post-job.component.scss']
})
export class RdPostJobComponent {
    loading = false;
    saving = false;
    successMessage = '';
    errorMessage = '';
    lastCandidatureLink = '';

    mesOffres: any[] = [];

    formulaire = {
        titre: '',
        description: '',
        entreprise: '',
        location: '',
        salary: '',
        typeContrat: 'CDI',
        deadline: '',
        competences: ''
    };

    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit(): void {
        this.chargerMesOffres();
    }

    chargerMesOffres(): void {
        this.loading = true;
        this.errorMessage = '';
        this.apiService.getMesOffresEmploi().subscribe({
            next: (offres) => {
                this.mesOffres = offres || [];
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                if (this.handleUnauthorized(err)) {
                    this.loading = false;
                    return;
                }
                this.apiService.getOffresEmploi().subscribe({
                    next: (fallbackOffres) => {
                        this.mesOffres = fallbackOffres || [];
                        this.errorMessage = this.mesOffres.length > 0 ? '' : 'Impossible de charger vos offres.';
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

    publierOffre(): void {
        this.successMessage = '';
        this.errorMessage = '';
        this.lastCandidatureLink = '';

        if (!this.formulaire.titre.trim() || !this.formulaire.description.trim() || !this.formulaire.location.trim()) {
            this.errorMessage = 'Titre, description et localisation sont obligatoires.';
            return;
        }

        const payload = {
            titre: this.formulaire.titre.trim(),
            description: this.formulaire.description.trim(),
            entreprise: this.formulaire.entreprise.trim() || null,
            location: this.formulaire.location.trim(),
            salary: this.formulaire.salary.trim() || null,
            typeContrat: this.formulaire.typeContrat,
            deadline: this.formulaire.deadline ? new Date(this.formulaire.deadline) : null,
            competencesRequises: this.formulaire.competences
                .split(',')
                .map((item) => item.trim())
                .filter((item) => !!item),
            statut: 'ACTIVE'
        };

        this.saving = true;
        this.apiService.creerOffreEmploi(payload).subscribe({
            next: (createdOffre) => {
                this.successMessage = 'Offre publiee avec succes.';
                this.lastCandidatureLink = this.getCandidatureFormLink(createdOffre);
                this.reinitialiser();
                this.chargerMesOffres();
                this.saving = false;
            },
            error: (err) => {
                console.error(err);
                if (this.handleUnauthorized(err)) {
                    this.saving = false;
                    return;
                }
                this.errorMessage = 'Erreur lors de la publication de l\'offre.';
                this.saving = false;
            }
        });
    }

    reinitialiser(): void {
        this.formulaire = {
            titre: '',
            description: '',
            entreprise: '',
            location: '',
            salary: '',
            typeContrat: 'CDI',
            deadline: '',
            competences: ''
        };
    }

    formatDate(value: any): string {
        if (!value) {
            return '-';
        }
        return new Date(value).toLocaleDateString('fr-FR');
    }

    getCandidatureFormLink(offre: any): string {
        if (!offre?.id) {
            return '';
        }

        const base = `${window.location.origin}/candidates-dashboard/applied-jobs`;
        const params = new URLSearchParams({
            openForm: '1',
            offreId: String(offre.id),
            offreTitre: offre.titre || '',
            entreprise: offre.entreprise || ''
        });

        return `${base}?${params.toString()}`;
    }

    copyCandidatureFormLink(offre: any): void {
        const link = this.getCandidatureFormLink(offre);
        if (!link) {
            return;
        }

        navigator.clipboard.writeText(link).then(() => {
            this.successMessage = 'Lien du formulaire de candidature copie.';
        }).catch(() => {
            this.errorMessage = 'Impossible de copier le lien.';
        });
    }

    private handleUnauthorized(err: any): boolean {
        if (err?.status === 401) {
            this.errorMessage = 'Session expiree. Veuillez vous reconnecter.';
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            setTimeout(() => this.router.navigate(['/login']), 600);
            return true;
        }
        return false;
    }

}
