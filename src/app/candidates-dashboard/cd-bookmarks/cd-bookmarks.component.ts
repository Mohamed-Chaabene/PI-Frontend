import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-cd-bookmarks',
    standalone: false,
    templateUrl: './cd-bookmarks.component.html',
    styleUrls: ['./cd-bookmarks.component.scss']
})
export class CdBookmarksComponent implements OnInit {

    offres: any[] = [];
    isLoading = true;
    message = '';
    messageType = '';

    constructor(private apiService: ApiService, private router: Router) {}

    ngOnInit(): void {
        this.loadOffres();
    }

    loadOffres(): void {
        this.isLoading = true;

        this.apiService.getMesCandidatures().subscribe({
            next: (data) => {
                const candidatures = Array.isArray(data) ? data : [];
                const offersFromPayload = candidatures
                    .map((c: any) => c?.offre)
                    .filter((offre: any) => !!offre && Number(offre?.id) > 0);

                const uniqueIds = Array.from(new Set(
                    candidatures
                        .map((c: any) => Number(c?.offreId || c?.offre?.id || c?.idOffre || 0))
                        .filter((id: number) => Number.isFinite(id) && id > 0)
                ));

                if (uniqueIds.length === 0) {
                    this.offres = this.uniqueById(offersFromPayload);
                    this.isLoading = false;
                    return;
                }

                const requests = uniqueIds.map((id: number) =>
                    this.apiService.getOffreEmploiById(id).pipe(
                        catchError(() => of(null))
                    )
                );

                forkJoin(requests).subscribe({
                    next: (offresByIds) => {
                        const fetched = (offresByIds || []).filter((o: any) => !!o);
                        this.offres = this.uniqueById([...
                            offersFromPayload,
                            ...fetched
                        ]);
                        this.isLoading = false;
                    },
                    error: () => {
                        this.offres = this.uniqueById(offersFromPayload);
                        this.isLoading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Erreur API de chargement des candidatures', err);
                this.offres = [];
                this.showMessage('Impossible de charger vos candidatures actuellement.', 'error');
                this.isLoading = false;
            }
        });
    }

  postuler(offre: any): void {
    if (offre.statut === 'CLOSED') {
        this.showMessage('Cette offre est déjà clôturée', 'error');
        return;
    }

    this.router.navigate(['/candidates-dashboard/applied-jobs'], {
        queryParams: {
            openForm: 1,
            offreId: offre.id,
            offreTitre: offre.titre,
            entreprise: offre.entreprise
        }
    });
}

formatErrorMessage(error: any): string {
    if (typeof error === 'string') {
        return error;
    }
    if (error.error) {
        return error.error;
    }
    if (error.message) {
        return error.message;
    }
    // If it's a validation errors object
    if (typeof error === 'object') {
        const messages = Object.values(error).join(', ');
        return messages;
    }
    return 'Erreur de validation';
}

    showMessage(msg: string, type: string): void {
        this.message = msg;
        this.messageType = type;
        setTimeout(() => {
            this.message = '';
        }, 3000);
    }

    private uniqueById(items: any[]): any[] {
        const mapById = new Map<number, any>();

        for (const item of items || []) {
            const id = Number(item?.id);
            if (!Number.isFinite(id) || id <= 0) {
                continue;
            }
            mapById.set(id, item);
        }

        return Array.from(mapById.values());
    }


    
}