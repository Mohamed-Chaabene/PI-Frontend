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
    isLoadingPublicTests = false;
    publicTestsError = '';
    readonly defaultEntretienPhoto = 'images/banner/banner1.jpg';
 
    constructor(
        private titleService: Title,
        private apiService: ApiService
    ) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
        this.loadPublicTestEntretiens();
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

