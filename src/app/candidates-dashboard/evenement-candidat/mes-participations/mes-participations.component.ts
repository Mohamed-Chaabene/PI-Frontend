import { Component, OnInit } from '@angular/core';
import { ParticipationService } from '../../../services/participation-service';
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

    constructor(private participationService: ParticipationService) {}

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

    // ✅ Couleur selon statut
    getStatutClass(statut: string): string {
        switch (statut) {
            case 'CONFIRME': return 'statut-confirme';
            case 'EN_ATTENTE': return 'statut-attente';
            case 'REFUSE': return 'statut-refuse';
            case 'ANNULE': return 'statut-annule';
            default: return '';
        }
    }

    

    formatDate(value: any): string {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('fr-FR');
    }
}