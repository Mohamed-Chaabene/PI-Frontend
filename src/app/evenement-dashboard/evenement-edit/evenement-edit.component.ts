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
        // ✅ Récupère l'ID depuis l'URL
        this.id = Number(this.route.snapshot.paramMap.get('id'));

        // ✅ Charge l'événement existant
        this.service.getById(this.id).subscribe({
            next: (data) => {
                this.evenement = data;
            },
            error: (err) => {
                console.error('Erreur chargement:', err);
            }
        });
    }

    modifier(form: NgForm) {
        if (form.valid) {
            this.service.modifier(this.id, this.evenement).subscribe({
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