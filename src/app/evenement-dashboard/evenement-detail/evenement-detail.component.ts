import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvenementService } from '../../services/evenement-service';

@Component({
    selector: 'app-evenement-detail',
    standalone: false,
    templateUrl: './evenement-detail.component.html',
    styleUrls: ['./evenement-detail.component.scss']
})
export class EvenementDetailComponent implements OnInit {

    evenement: any = {};
    loading = true;
    error = false;

    constructor(
        private service: EvenementService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.service.getById(id).subscribe({
            next: (data) => {
                this.evenement = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur:', err);
                this.error = true;
                this.loading = false;
            }
        });
    }

    retour() {
        this.router.navigate(['/evenement-dashboard/liste']);
    }
}