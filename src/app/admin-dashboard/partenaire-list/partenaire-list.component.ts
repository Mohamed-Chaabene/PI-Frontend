import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PartenaireService } from '../../services/partenaire.service';
import { OffrePartenaireService } from '../../services/offre-partenaire.service';

@Component({
    selector: 'app-partenaire-list',
    standalone: false,
    templateUrl: './partenaire-list.component.html',
    styleUrls: ['./partenaire-list.component.scss']
})
export class PartenaireListComponent implements OnInit {

    partenaires: any[] = [];
    searchTerm: string = '';
    userRole: string = '';

    isModifPopupOpen = false;
    partenaireModif: any = {
        id: 0,
        nom: '',
        email: '',
        telephone: '',
        type: 'ENTREPRISE'
    };

    isOffrePopupOpen = false;
    newOffre: any = {
        titre: '',
        description: '',
        type: 'EMPLOI',
        partenaire: { id: 0 }
    };
    partenaireSelectionne: any = null;

    constructor(
        private partenaireService: PartenaireService,
        private offreService: OffrePartenaireService,
        private router: Router
    ) {}

    ngOnInit() {
        this.userRole = (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');
        this.loadPartenaires();
    }

    get isAdmin(): boolean {
        return this.userRole === 'ADMIN';
    }

    get isAdminPage(): boolean {
        return this.router.url.startsWith('/admin-dashboard');
    }

    get canManage(): boolean {
        return this.isAdminPage && this.isAdmin;
    }

    loadPartenaires() {
        this.partenaireService.getAll().subscribe({
            next: (data: any[]) => this.partenaires = data,
            error: (err: any) => console.error(err)
        });
    }

    get filteredPartenaires(): any[] {
        if (!this.searchTerm.trim()) return this.partenaires;
        const term = this.searchTerm.toLowerCase().trim();
        return this.partenaires.filter(p =>
            p.nom?.toLowerCase().includes(term) ||
            p.email?.toLowerCase().includes(term) ||
            p.telephone?.toLowerCase().includes(term) ||
            p.type?.toLowerCase().includes(term)
        );
    }

    modifier(p: any) {
        if (!this.canManage) {
            return;
        }
        this.partenaireModif = {
            id: p.id,
            nom: p.nom,
            email: p.email,
            telephone: p.telephone,
            type: p.type
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
        this.partenaireService.update(
            this.partenaireModif.id,
            this.partenaireModif
        ).subscribe({
            next: () => {
                alert('✅ Partenaire modifié !');
                this.closeModifPopup();
                this.loadPartenaires();
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
        if (confirm('Voulez-vous supprimer ce partenaire ?')) {
            this.partenaireService.delete(id).subscribe({
                next: () => {
                    alert('✅ Partenaire supprimé !');
                    this.loadPartenaires();
                },
                error: (err: any) => {
                    console.error(err);
                    alert('❌ Erreur : ' + err.status);
                }
            });
        }
    }

    ajouterOffre(p: any) {
        if (!this.canManage) {
            return;
        }
        this.partenaireSelectionne = p;
        this.newOffre = {
            titre: '',
            description: '',
            type: 'EMPLOI',
            partenaire: { id: p.id }
        };
        this.isOffrePopupOpen = true;
    }

    closeOffrePopup() {
        this.isOffrePopupOpen = false;
        this.partenaireSelectionne = null;
    }

    saveOffre() {
        if (!this.canManage) {
            return;
        }
        this.offreService.create(this.newOffre).subscribe({
            next: () => {
                alert('✅ Offre créée avec succès !');
                this.closeOffrePopup();
            },
            error: (err: any) => {
                console.error(err);
                alert('❌ Erreur lors de la création');
            }
        });
    }

    voirOffres(id: number) {
        if (this.isAdminPage) {
            this.router.navigate(['/admin-dashboard/partenaires', id, 'offres']);
            return;
        }

        this.router.navigate(['/partenaires', id, 'offres']);
    }
}