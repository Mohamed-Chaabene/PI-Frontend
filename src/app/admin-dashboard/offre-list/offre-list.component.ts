import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OffrePartenaireService } from '../../services/offre-partenaire.service';
import { PartenaireService } from '../../services/partenaire.service';

@Component({
    selector: 'app-offre-list',
    standalone: false,
    templateUrl: './offre-list.component.html',
    styleUrls: ['./offre-list.component.scss']
})
export class OffreListComponent implements OnInit {

    offres: any[] = [];
    partenaire: any = null;
    partenaireId: number = 0;
    userRole: string = '';

    // ===== MODIFIER =====
    isModifPopupOpen = false;
    offreModif: any = {
        id: 0,
        titre: '',
        description: '',
        type: 'EMPLOI'
    };

    constructor(
        private offreService: OffrePartenaireService,
        private partenaireService: PartenaireService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.userRole = (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');
        this.partenaireId = Number(this.route.snapshot.paramMap.get('id'));
        this.loadPartenaire();
        this.loadOffres();
    }

    get isAdminPage(): boolean {
        return this.router.url.startsWith('/admin-dashboard');
    }

    get canManage(): boolean {
        return this.isAdminPage && this.userRole === 'ADMIN';
    }

    loadPartenaire() {
        this.partenaireService.getById(this.partenaireId).subscribe({
            next: (data: any) => this.partenaire = data,
            error: (err: any) => console.error(err)
        });
    }

    loadOffres() {
        this.offreService.getByPartenaire(this.partenaireId).subscribe({
            next: (data: any[]) => this.offres = data,
            error: (err: any) => console.error(err)
        });
    }

    modifier(o: any) {
        if (!this.canManage) {
            return;
        }
        this.offreModif = {
            id: o.id,
            titre: o.titre,
            description: o.description,
            type: o.type
        };
        this.isModifPopupOpen = true;
    }

    closeModifPopup() {
        this.isModifPopupOpen = false;
    }

    saveModif() {
        if (!this.canManage) {
            return;
        }
        this.offreService.update(this.offreModif.id, this.offreModif).subscribe({
            next: () => {
                alert('✅ Offre modifiée !');
                this.closeModifPopup();
                this.loadOffres();
            },
            error: (err: any) => {
                console.error(err);
                alert('❌ Erreur lors de la modification');
            }
        });
    }

    supprimer(id: number) {
        if (!this.canManage) {
            return;
        }
        if (confirm('Voulez-vous supprimer cette offre ?')) {
            this.offreService.delete(id).subscribe({
                next: () => {
                    alert('✅ Offre supprimée !');
                    this.loadOffres();
                },
                error: (err: any) => console.error(err)
            });
        }
    }
   
    
    formatDate(date: string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
    }

    retour() {
        if (this.isAdminPage) {
            this.router.navigate(['/admin-dashboard/partenaires']);
            return;
        }

        this.router.navigate(['/partenaires']);
    }
}