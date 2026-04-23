import { Component, OnInit } from '@angular/core';
import { FreelanceService, Mission } from './services/freelance.service';

@Component({
  selector: 'app-freelance-projects',
  standalone: false,
  templateUrl: './freelance-projects.component.html'
})
export class FreelanceProjectsComponent implements OnInit {
  missions: Mission[] = [];
  loading = true;
  erreur = '';

  constructor(private freelanceService: FreelanceService) {}

  ngOnInit(): void {
    this.freelanceService.getMissions().subscribe({
      next: (data) => { this.missions = data; this.loading = false; },
      error: () => { this.erreur = 'Erreur de chargement des missions.'; this.loading = false; }
    });
  }
}