import { Component, OnInit } from '@angular/core';
import { EvenementService } from '../../services/evenement-service';
import { ParticipationService } from '../../services/participation-service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-evenement-candidat',
    standalone: false,
    templateUrl: './evenement-candidat.component.html',
    styleUrls: ['./evenement-candidat.component.scss']
})
export class EvenementCandidatComponent implements OnInit {

    evenements: any[] = [];
    filteredEvenements: any[] = [];
    searchTerm = '';
    isLoading = true;
    candidatId!: number;

    demandesEnvoyees: Set<number> = new Set();
    participationsStatuts: Map<number, string> = new Map();

    constructor(
        private evenementService: EvenementService,
        private participationService: ParticipationService
    ) {}

    ngOnInit() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            this.candidatId = decoded?.id;
        }

        this.evenementService.getAll().subscribe({
            next: (data) => {
                this.evenements = data;
                this.filteredEvenements = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erreur:', err);
                this.isLoading = false;
            }
        });

        this.chargerMesParticipations();
    }

    chargerMesParticipations() {
        this.participationService.getByCandidat(this.candidatId).subscribe({
            next: (data) => {
                data.forEach((p: any) => {
                    this.demandesEnvoyees.add(p.evenementId);
                    this.participationsStatuts.set(p.evenementId, p.statut);
                });
            },
            error: (err) => console.error('Erreur:', err)
        });
    }

    aDejaDemandeA(evenementId: number): boolean {
        return this.demandesEnvoyees.has(evenementId);
    }

    //  Corrigé — ajoute au Set après succès
    participer(evenementId: number) {
        this.participationService.confirmer({
            evenementId: evenementId,
            candidatId: this.candidatId
        }).subscribe({
            next: (res) => {
                //  Met à jour le Set et la Map immédiatement
                this.demandesEnvoyees.add(evenementId);
                this.participationsStatuts.set(evenementId, 'EN_ATTENTE');
                //  Force la détection de changements
                this.demandesEnvoyees = new Set(this.demandesEnvoyees);
            },
            error: (err) => {
                console.error('Erreur:', err);
                alert('❌ Erreur lors de la demande');
            }
        });
    }

    onSearch(term: string) {
        this.searchTerm = term;
        if (!term) {
            this.filteredEvenements = [...this.evenements];
            return;
        }
        this.filteredEvenements = this.evenements.filter(e =>
            e.titre?.toLowerCase().includes(term.toLowerCase()) ||
            e.lieu?.toLowerCase().includes(term.toLowerCase()) ||
            e.type?.toLowerCase().includes(term.toLowerCase())
        );
    }

    //  Notifications — participations confirmées
    get participationsConfirmees(): number[] {
        return Array.from(this.demandesEnvoyees)
            .filter(id => this.participationsStatuts.get(id) === 'CONFIRME');
    }

    formatDate(value: any): string {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('fr-FR');
    }
}