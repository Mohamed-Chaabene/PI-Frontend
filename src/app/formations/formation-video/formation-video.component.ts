import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Formation } from '../models/formation.model';
import { FormationService } from '../services/formation.service';

@Component({
  selector: 'app-formation-video',
  standalone: false,
  templateUrl: './formation-video.component.html',
  styleUrls: ['./formation-video.component.scss']
})
export class FormationVideoComponent implements OnInit {
  formation!:     Formation;
  loading       = true;
  inscriptionId: number | null = null;
  candidatId:    number | null = null;

  private route            = inject(ActivatedRoute);
  private router           = inject(Router);
  private formationService = inject(FormationService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Lire depuis localStorage
    this.candidatId    = Number(localStorage.getItem('candidatId')) || null;
    this.inscriptionId = Number(
      localStorage.getItem('inscription_' + id)) || null;

    this.formationService.getFormationById(id).subscribe({
      next: (f) => { this.formation = f; this.loading = false; },
      error: () => {
        this.loading = false;
        this.router.navigate(['/formations']);
      }
    });
  }

  retour(): void {
    this.router.navigate(['/formations', this.formation.id]);
  }
}