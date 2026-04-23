import { Component, OnInit } from '@angular/core';
import { EvenementService } from '../../services/evenement-service';
import { ParticipationService } from '../../services/participation-service';
import { FeedbackEventService } from '../../services/feedbackevent-service';
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
    mesParticipations: any[] = [];
    searchTerm = '';
    isLoading = true;
    candidatId!: number;

    demandesEnvoyees: Set<number> = new Set();
    participationsStatuts: Map<number, string> = new Map();

    evenementSelectionne: any = null;
    reputationData: any = null;
    popupDetailOuvert = false;
    loadingReputation = false;

    constructor(
        private evenementService: EvenementService,
        private participationService: ParticipationService,
        private feedbackEventService: FeedbackEventService
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

        // Rafraîchit toutes les 15 secondes
        setInterval(() => {
            this.chargerMesParticipations();
        }, 15000);
    }

    // ── Popup détail + réputation ─────────────────────────────────────────────

    ouvrirDetail(evenement: any): void {
        this.evenementSelectionne = evenement;
        this.popupDetailOuvert = true;
        this.reputationData = null;
        this.loadingReputation = true;

        this.feedbackEventService.getReputation(
            evenement.organisateurId,
            evenement.nomOrganisateur,
            evenement.type,
            evenement.titre
        ).subscribe({
            next: (data) => {
                this.reputationData = data;
                this.loadingReputation = false;
            },
            error: () => this.loadingReputation = false
        });
    }

    fermerDetail(): void {
        this.popupDetailOuvert = false;
        this.evenementSelectionne = null;
        this.reputationData = null;
    }

    getBadgeClass(badge: string): string {
        if (!badge) return '';
        if (badge.includes('EXCELLENT') || badge.includes('TRES_APPRECIE'))
            return 'badge-excellent';
        if (badge.includes('RECOMMANDE') || badge.includes('BON') || badge.includes('BIEN'))
            return 'badge-recommande';
        if (badge.includes('MOYEN'))
            return 'badge-moyen';
        if (badge.includes('PEU') || badge.includes('MAUVAIS'))
            return 'badge-mauvais';
        if (badge.includes('NOUVEAU') || badge.includes('PREMIER'))
            return 'badge-nouveau';
        return '';
    }

    getBadgeLabel(badge: string): string {
        if (!badge) return '';
        if (badge.includes('EXCELLENT')) return '⭐ Excellent';
        if (badge.includes('TRES_APPRECIE')) return '🔥 Édition précédente très appréciée';
        if (badge.includes('RECOMMANDE')) return '👍 Recommandé';
        if (badge.includes('BON')) return '👍 Bon organisateur';
        if (badge.includes('BIEN_NOTE')) return '👍 Bien noté';
        if (badge.includes('MOYEN')) return '⚠️ Avis mitigés';
        if (badge.includes('PEU_RECOMMANDE')) return '❌ Peu recommandé';
        if (badge.includes('MAUVAIS')) return '❌ Mauvais retours';
        if (badge.includes('NOUVEAU') || badge.includes('PREMIER'))
            return '🆕 Premier événement de ce type';
        return badge;
    }

    // ── Participations ────────────────────────────────────────────────────────

    chargerMesParticipations() {
        if (!this.candidatId) return;

        this.participationService.getByCandidat(this.candidatId).subscribe({
            next: (data) => {
                // ← stocke les données complètes — c'était manquant
                this.mesParticipations = data;

                // Remet à zéro avant de remplir
                this.demandesEnvoyees.clear();
                this.participationsStatuts.clear();

                data.forEach((p: any) => {
                    this.demandesEnvoyees.add(p.evenementId);
                    this.participationsStatuts.set(p.evenementId, p.statut);
                });

                // Force la détection de changements
                this.demandesEnvoyees = new Set(this.demandesEnvoyees);
            },
            error: (err) => console.error('Erreur:', err)
        });
    }

    getStatutEvenement(evenementId: number): string {
        return this.participationsStatuts.get(evenementId) || '';
    }

    aDejaDemandeA(evenementId: number): boolean {
        return this.demandesEnvoyees.has(evenementId);
    }

    participer(evenementId: number) {
        this.participationService.confirmer({
            evenementId: evenementId,
            candidatId: this.candidatId
        }).subscribe({
            next: () => {
                this.demandesEnvoyees.add(evenementId);
                this.participationsStatuts.set(evenementId, 'EN_ATTENTE');
                this.demandesEnvoyees = new Set(this.demandesEnvoyees);
                // Recharge pour avoir l'ID de participation
                this.chargerMesParticipations();
            },
            error: (err) => {
                console.error('Erreur:', err);
                alert('Erreur lors de la demande');
            }
        });
    }

    annulerParticipation(evenementId: number) {
        const participation = this.mesParticipations.find(
            (p: any) => p.evenementId === evenementId
        );

        if (!participation) {
            console.error('Participation non trouvée pour evenementId:', evenementId);
            return;
        }

        if (!confirm('Voulez-vous annuler votre demande de participation ?')) return;

        this.participationService.annuler(participation.id).subscribe({
            next: () => {
                this.demandesEnvoyees.delete(evenementId);
                this.participationsStatuts.delete(evenementId);
                this.mesParticipations = this.mesParticipations.filter(
                    (p: any) => p.evenementId !== evenementId
                );
                this.demandesEnvoyees = new Set(this.demandesEnvoyees);
            },
            error: (err) => {
                console.error('Erreur annulation:', err);
                alert('Erreur lors de l\'annulation');
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