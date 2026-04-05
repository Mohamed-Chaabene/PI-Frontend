import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SharedModule } from '../../shared/shared.module';
import { ApiService } from '../../api.service';

interface PublicTestEntretien {
    id: number;
    titre?: string;
    description?: string;
    domaine?: string;
    domaineLabel?: string;
    dateEntretien?: string;
    photo?: string;
}

interface HomeOffreEmploi {
    id: number;
    titre?: string;
    description?: string;
    type?: string;
    datePublication?: string;
    dateLimite?: string;
    statut?: string;
    status?: string;
}

@Component({
    selector: 'app-home-demo-one',
    standalone: true,
    imports: [SharedModule],
    templateUrl: './home-demo-one.component.html',
    styleUrls: ['./home-demo-one.component.scss']
})
export class HomeDemoOneComponent {

    title = 'Home Demo - 1 - Jove';
    publicTestEntretiens: PublicTestEntretien[] = [];
    offresDisponibles: HomeOffreEmploi[] = [];
    isLoadingPublicTests = false;
    isLoadingOffres = false;
    publicTestsError = '';
    offresError = '';
    readonly defaultEntretienPhoto = 'images/banner/banner1.jpg';
 
    constructor(
        private titleService: Title,
        private apiService: ApiService
    ) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
        this.loadOffresDisponibles();
        this.loadPublicTestEntretiens();
    }

    loadOffresDisponibles(): void {
        this.isLoadingOffres = true;
        this.offresError = '';

        this.apiService.getOffresEmploi().subscribe({
            next: (data: HomeOffreEmploi[]) => {
                const raw = Array.isArray(data) ? data : [];
                this.offresDisponibles = raw
                    .filter((item) => this.isOffreAvailable(item))
                    .sort((a, b) => this.getDateTime(b.datePublication) - this.getDateTime(a.datePublication))
                    .slice(0, 6);
                this.isLoadingOffres = false;
            },
            error: () => {
                this.offresError = 'Impossible de charger les offres d emploi pour le moment.';
                this.offresDisponibles = [];
                this.isLoadingOffres = false;
            }
        });
    }

    private isOffreAvailable(item: HomeOffreEmploi): boolean {
        const status = String(item?.statut || item?.status || '').toUpperCase();
        if (status === 'CLOSED' || status === 'CLOTUREE' || status === 'INACTIVE' || status === 'ARCHIVEE') {
            return false;
        }

        const deadlineTime = this.getDateTime(item?.dateLimite);
        if (Number.isFinite(deadlineTime) && deadlineTime < Date.now()) {
            return false;
        }

        return true;
    }

    private getDateTime(value?: string): number {
        if (!value) {
            return Number.NEGATIVE_INFINITY;
        }
        const date = new Date(value);
        return date.getTime();
    }

    getOffreTitle(item: HomeOffreEmploi): string {
        return String(item?.titre || '').trim() || 'Offre d emploi';
    }

    getOffreDescription(item: HomeOffreEmploi): string {
        const raw = String(item?.description || '').trim();
        if (!raw) {
            return 'Consultez les details de cette opportunite et postulez rapidement.';
        }
        return raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
    }

    getOffreType(item: HomeOffreEmploi): string {
        return String(item?.type || 'EMPLOI').toUpperCase();
    }

    formatOffreDate(value?: string): string {
        if (!value) {
            return 'Date non specifiee';
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return 'Date non specifiee';
        }

        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    trackByOffreId(index: number, item: HomeOffreEmploi): number {
        return item?.id ?? index;
    }

    loadPublicTestEntretiens(): void {
        this.isLoadingPublicTests = true;
        this.publicTestsError = '';

        this.apiService.getPublicTestEntretiens().subscribe({
            next: (data: PublicTestEntretien[]) => {
                console.log('✅ Public test entretiens loaded:', data);
                this.publicTestEntretiens = Array.isArray(data) ? data : [];
                this.isLoadingPublicTests = false;
            },
            error: (err) => {
                console.error('❌ Error loading public test entretiens:', err?.status, err?.message);
                this.publicTestsError = 'Impossible de charger les entretiens test pour le moment.';
                this.publicTestEntretiens = [];
                this.isLoadingPublicTests = false;
            }
        });
    }

    getEntretienPhoto(item: PublicTestEntretien): string {
        const raw = (item?.photo || '').trim();
        if (!raw) {
            return this.defaultEntretienPhoto;
        }
        return raw;
    }

    getEntretienTitle(item: PublicTestEntretien): string {
        const raw = (item?.titre || '').trim();
        return raw || 'Entretien Test';
    }

    getEntretienDescription(item: PublicTestEntretien): string {
        const raw = (item?.description || '').trim();
        if (!raw) {
            return 'Mettez vos competences a l epreuve avec cet entretien test en ligne.';
        }
        return raw.length > 135 ? `${raw.slice(0, 135)}...` : raw;
    }

    getEntretienDomaine(item: PublicTestEntretien): string {
        return (item?.domaineLabel || item?.domaine || 'General').trim();
    }

    formatEntretienDate(value?: string): string {
        if (!value) {
            return 'Date a venir';
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return 'Date a venir';
        }
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    trackByEntretienId(index: number, item: PublicTestEntretien): number {
        return item?.id ?? index;
    }

}

