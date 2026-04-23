import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PartenaireService } from '../../services/partenaire.service';
import { OffrePartenaireService } from '../../services/offre-partenaire.service';

@Component({
    selector: 'app-ad-dashboard',
    standalone: false,
    templateUrl: './ad-dashboard.component.html',
    styleUrls: ['./ad-dashboard.component.scss']
})
export class AdDashboardComponent implements OnInit {

    totalPartenaires = 0;
    totalOffres = 0;
    totalEmplois = 0;
    totalStages = 0;
    offres: any[] = [];
    adminName: string = '';
    today = new Date();

    constructor(
        private titleService: Title,
        private partenaireService: PartenaireService,
        private offreService: OffrePartenaireService
    ) {}

    ngOnInit() {
        this.titleService.setTitle('Admin Dashboard');
        this.adminName = localStorage.getItem('userName') || 'Admin';
        this.loadData();
    }

    loadData() {
        this.partenaireService.getAll().subscribe({
            next: (data: any[]) => {
                this.totalPartenaires = data.length;
            },
            error: (err: any) => console.error(err)
        });

        this.offreService.getAll().subscribe({
            next: (data: any[]) => {
                this.totalOffres = data.length;
                this.totalEmplois = data.filter(o => o.type === 'EMPLOI').length;
                this.totalStages = data.filter(o => o.type === 'STAGE').length;
                this.offres = [...data]
                    .sort((a, b) =>
                        new Date(b.datePublication).getTime() -
                        new Date(a.datePublication).getTime()
                    )
                    .slice(0, 5);
            },
            error: (err: any) => console.error(err)
        });
    }

    // Pourcentage pour la barre de progression
    getPourcentage(valeur: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((valeur / total) * 100);
    }

    formatDate(date: string): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}