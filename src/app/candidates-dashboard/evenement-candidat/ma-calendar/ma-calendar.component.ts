import { Component, OnInit } from '@angular/core';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EvenementService } from '../../../services/evenement-service';
import { ParticipationService } from '../../../services/participation-service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-ma-calendar',
    standalone: false,
    templateUrl: './ma-calendar.component.html',
    styleUrls: ['./ma-calendar.component.scss']
})
export class MaCalendarComponent implements OnInit {

    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: {
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            list: 'Liste'
        },
        events: [],
        eventClick: this.onEventClick.bind(this),
        height: 'auto'
    };

    selectedEvenement: any = null;
    showModal = false;
    candidatId!: number;
    demandesEnvoyees: Set<number> = new Set();
    participationsStatuts: Map<number, string> = new Map();
    stats: any = null;

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
        this.chargerParticipations();
        this.chargerStats();
    }

    chargerParticipations() {
        this.participationService.getByCandidat(this.candidatId).subscribe({
            next: (data) => {
                data.forEach((p: any) => {
                    this.demandesEnvoyees.add(p.evenementId);
                    this.participationsStatuts.set(p.evenementId, p.statut);
                });
                this.chargerEvenements(); // ✅ après participations
            },
            error: (err) => {
                console.error('Erreur participations:', err);
                this.chargerEvenements(); // ✅ charge quand même
            }
        });
    }

    chargerEvenements() {
        this.evenementService.getAll().subscribe({
            next: (data) => {
                this.calendarOptions = {
                    ...this.calendarOptions,
                    events: data.map((e: any) => ({
                        id: String(e.id),
                        title: this.getTitreAvecBadge(e),
                        date: e.date,
                        backgroundColor: this.getCouleur(e),
                        borderColor: this.getCouleur(e),
                        textColor: '#ffffff',
                        extendedProps: {
                            lieu: e.lieu,
                            type: e.type,
                            organisateur: e.nomOrganisateur,
                            estInscrit: this.demandesEnvoyees.has(e.id),
                            statut: this.participationsStatuts.get(e.id) || null
                        }
                    }))
                };
            },
            error: (err) => console.error('Erreur événements:', err)
        });
    }

    getTitreAvecBadge(e: any): string {
        const statut = this.participationsStatuts.get(e.id);
        if (statut === 'CONFIRME') return `✅ ${e.titre}`;
        if (statut === 'EN_ATTENTE') return `⏳ ${e.titre}`;
        if (statut === 'REFUSE') return `❌ ${e.titre}`;
        return e.titre;
    }

    getCouleur(e: any): string {
        const statut = this.participationsStatuts.get(e.id);
        if (statut === 'CONFIRME') return '#1a6b3c';
        if (statut === 'EN_ATTENTE') return '#f9a825';
        if (statut === 'REFUSE') return '#9e9e9e';

        const couleurs: any = {
            'JOB_FAIR':   '#1565c0',
            'WORKSHOP':   '#6a1b9a',
            'CONFERENCE': '#e65100',
            'NETWORKING': '#00695c'
        };
        return couleurs[e.type] || '#1565c0';
    }

    onEventClick(info: EventClickArg) {
        this.selectedEvenement = {
            id: Number(info.event.id),
            titre: info.event.title,
            date: info.event.startStr,
            lieu: info.event.extendedProps['lieu'],
            type: info.event.extendedProps['type'],
            organisateur: info.event.extendedProps['organisateur'],
            estInscrit: info.event.extendedProps['estInscrit'],
            statut: info.event.extendedProps['statut']
        };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedEvenement = null;
    }

    participer(evenementId: number) {
        this.participationService.confirmer({
            evenementId: evenementId,
            candidatId: this.candidatId
        }).subscribe({
            next: () => {
                this.demandesEnvoyees.add(evenementId);
                this.participationsStatuts.set(evenementId, 'EN_ATTENTE');
                this.closeModal();
                this.chargerEvenements(); // ✅ rafraîchit
            },
            error: (err) => console.error('Erreur:', err)
        });
    }

    formatDate(value: any): string {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('fr-FR');
    }

    chargerStats() {
    this.participationService.getStatsByCandidat(this.candidatId).subscribe({
        next: (data) => {
            this.stats = data;
            console.log('Stats candidat:', data);
        },
        error: (err) => console.error('Erreur stats:', err)
    });
}
}