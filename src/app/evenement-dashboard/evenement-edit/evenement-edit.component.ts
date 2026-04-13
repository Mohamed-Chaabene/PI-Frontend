import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { EvenementService } from '../../services/evenement-service';

@Component({
    selector: 'app-evenement-edit',
    standalone: false,
    templateUrl: './evenement-edit.component.html',
    styleUrls: ['./evenement-edit.component.scss']
})
export class EvenementEditComponent implements OnInit {
    evenement: any = {};
    success = false;
    error = false;
    id!: number;

    constructor(
        private service: EvenementService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        this.service.getById(this.id).subscribe({
            next: (data) => {
                this.evenement = data;
                // ⚠️ datetime-local attend "yyyy-MM-ddTHH:mm", on coupe les secondes
                if (data.dateHeure) {
                    this.evenement.dateHeure = data.dateHeure.substring(0, 16); // ← nouveau
                }
            },
            error: (err) => console.error('Erreur chargement:', err)
        });
    }

    modifier(form: NgForm) {
        if (form.valid) {
            // ⚠️ Ajoute ':00' pour les secondes attendues par Spring
            const payload = {
                ...this.evenement,
                dateHeure: this.evenement.dateHeure + ':00' // ← nouveau
            };

            this.service.modifier(this.id, payload).subscribe({ // ← payload au lieu de this.evenement
                next: (res) => {
                    console.log('Événement modifié ✅', res);
                    this.success = true;
                    this.error = false;
                    setTimeout(() => {
                        this.router.navigate(['/evenement-dashboard/liste']);
                    }, 2000);
                },
                error: (err) => {
                    console.error('Erreur modification ❌', err);
                    this.error = true;
                    this.success = false;
                }
            });
        }
    }

    annuler() {
        this.router.navigate(['/evenement-dashboard/liste']);
    }
}