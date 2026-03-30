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
    loading = true;
    error = false;
    organisateurId!: number;

    constructor(
        private service: EvenementService,
        private router: Router
    ) {}

    ngOnInit() {
        // ✅ Récupère l'ID depuis le token
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            this.organisateurId = decoded?.id;
        }

        // ✅ Charge uniquement ses événements
        this.service.getByOrganisateur(this.organisateurId).subscribe({
            next: (data) => {
                this.evenements = data;
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
}
