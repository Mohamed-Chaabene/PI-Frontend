import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EvenementService } from '../../services/evenement-service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-evenement-list',
    standalone: false,
    templateUrl: './evenement-list.component.html',
    styleUrls: ['./evenement-list.component.scss']
})
export class EvenementListComponent implements OnInit {

    evenements: any[] = [];
    evenementsFiltres: any[] = []; //  liste filtrée
    lieux: string[] = [];          //  liste des lieux uniques
    loading = true;
    error = false;
    organisateurId!: number;

     //  Champs de recherche
    searchTitre = '';
    searchLieu = '';
    sortByDate = '';   // ✅ proche / loin
    sortByAjout = '';  

    constructor(
        private service: EvenementService,
        private router: Router
    ) {}

    ngOnInit() {
        //  Récupère l'ID depuis le token
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            this.organisateurId = decoded?.id;
        }

        //  Charge uniquement ses événements
        this.service.getByOrganisateur(this.organisateurId).subscribe({
            next: (data) => {
                this.evenements = data;
                this.evenementsFiltres = data; //  initialise la liste filtrée
                this.lieux = [...new Set(data.map((e: any) => e.lieu))]; //  lieux uniques
                this.loading = false;
                console.log('Mes événements:', data);
            },
            error: (err) => {
                console.error('Erreur:', err);
                this.error = true;
                this.loading = false;
            }
        });
    }

    modifier(id: number) {
        this.router.navigate(['/evenement-dashboard/modifier', id]);
    }
    
    voir(id: number) {
    this.router.navigate(['/evenement-dashboard/detail', id]);
}

    supprimer(id: number) {
        if (confirm('Voulez-vous supprimer cet événement ?')) {
            this.service.annuler(id).subscribe({
                next: () => {
                    this.evenements = this.evenements.filter(e => e.id !== id);
                },
                error: (err) => console.error('Erreur:', err)
            });
        }
    }

   rechercher() {
    this.evenementsFiltres = this.evenements.filter(e => {
        const matchTitre = !this.searchTitre || 
            e.titre.toLowerCase().includes(this.searchTitre.toLowerCase());
        const matchLieu = !this.searchLieu || 
            e.lieu === this.searchLieu;
        return matchTitre && matchLieu;
    });
    
}

    trier() {
    let liste = [...this.evenementsFiltres];

    // ✅ Tri par date de l'événement
    if (this.sortByDate === 'proche') {
        const now = new Date().getTime();
        liste.sort((a, b) => {
            const diffA = Math.abs(new Date(a.date).getTime() - now);
            const diffB = Math.abs(new Date(b.date).getTime() - now);
            return diffA - diffB; // plus proche en premier
        });
    } else if (this.sortByDate === 'loin') {
        const now = new Date().getTime();
        liste.sort((a, b) => {
            const diffA = Math.abs(new Date(a.date).getTime() - now);
            const diffB = Math.abs(new Date(b.date).getTime() - now);
            return diffB - diffA; // plus loin en premier
        });
    }

    // ✅ Tri par date d'ajout (id — plus grand = plus récent)
    if (this.sortByAjout === 'recent') {
        liste.sort((a, b) => b.id - a.id);
    } else if (this.sortByAjout === 'ancien') {
        liste.sort((a, b) => a.id - b.id);
    }

    this.evenementsFiltres = liste;
}

}
