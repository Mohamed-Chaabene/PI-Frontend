import { Component, OnInit } from '@angular/core';
import { ParticipationService } from '../../../services/participation-service';
import { FeedbackEventService } from '../../../services/feedbackevent-service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-mes-participations',
    standalone: false,
    templateUrl: './mes-participations.component.html',
    styleUrls: ['./mes-participations.component.scss']
})
export class MesParticipationsComponent implements OnInit {

    participations: any[] = [];
    isLoading = true;
    candidatId!: number;

    // ← feedback
    feedbackOuvert: number | null = null; // ID participation dont le form est ouvert
    feedbackNote = 5;
    feedbackCommentaire = '';
    feedbackEnvoi = false;
    feedbackSucces: number | null = null; // ID participation avec feedback envoyé
    feedbackErreur = '';

    constructor(
        private participationService: ParticipationService,
        private feedbackService: FeedbackEventService
    ) {}

    ngOnInit() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            this.candidatId = decoded?.id;
        }
        this.loadParticipations();
    }

    loadParticipations() {
        this.participationService.getByCandidat(this.candidatId).subscribe({
            next: (data) => {
                this.participations = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erreur:', err);
                this.isLoading = false;
            }
        });
    }

    // Ouvre/ferme le formulaire feedback pour une participation
    toggleFeedback(participationId: number): void {
        if (this.feedbackOuvert === participationId) {
            this.feedbackOuvert = null;
        } else {
            this.feedbackOuvert = participationId;
            this.feedbackNote = 5;
            this.feedbackCommentaire = '';
            this.feedbackErreur = '';
        }
    }

    // Soumet le feedback
    soumettreFeedback(participationId: number): void {
        if (!this.feedbackCommentaire.trim()) {
            this.feedbackErreur = 'Le commentaire est requis';
            return;
        }

        this.feedbackEnvoi = true;
        this.feedbackErreur = '';

        this.feedbackService.create({
            commentaire: this.feedbackCommentaire,
            note: this.feedbackNote,
            participationId: participationId
        }).subscribe({
            next: () => {
                this.feedbackEnvoi = false;
                this.feedbackOuvert = null;
                this.feedbackSucces = participationId;
                // Cache le message de succès après 3s
                setTimeout(() => this.feedbackSucces = null, 3000);
            },
            error: (err) => {
                this.feedbackEnvoi = false;
                this.feedbackErreur = err?.error?.message || 'Erreur lors de l\'envoi';
            }
        });
    }

    setNote(note: number): void {
        this.feedbackNote = note;
    }

    getStatutClass(statut: string): string {
        switch (statut) {
            case 'CONFIRME': return 'statut-confirme';
            case 'EN_ATTENTE': return 'statut-attente';
            case 'REFUSE': return 'statut-refuse';
            case 'ANNULE': return 'statut-annule';
            default: return '';
        }
    }
    // Vérifie si la date de l'événement est passée
    evenementPasse(participation: any): boolean {
    if (!participation.dateEvenement) return true; // si pas de date, on laisse passer
    const dateEvenement = new Date(participation.dateEvenement);
    return dateEvenement < new Date();
}

    formatDate(value: any): string {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('fr-FR');
    }
}