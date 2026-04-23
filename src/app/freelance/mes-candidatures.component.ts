import { Component, OnInit } from '@angular/core';
import { FreelanceService, Candidature } from './services/freelance.service';

@Component({
  selector: 'app-mes-candidatures',
  standalone: false,
  templateUrl: './mes-candidatures.component.html'
})
export class MesCandidaturesComponent implements OnInit {
  candidatures: any[] = [];
  loading = true;
  erreur = '';

  constructor(private freelanceService: FreelanceService) {}

  ngOnInit(): void {
    this.freelanceService.mesCandidatures().subscribe({
      next: (data) => {
        this.candidatures = data;
        this.loading = false;
      },
      error: () => {
        this.erreur = 'Erreur de chargement des candidatures.';
        this.loading = false;
      }
    });
  }
}
