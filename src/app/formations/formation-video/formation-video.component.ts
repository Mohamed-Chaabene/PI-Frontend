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
  parcoursId:    number | null = null;
  niveau:        string | null = null;
  isAlreadyCompleted = false;

  private route            = inject(ActivatedRoute);
  private router           = inject(Router);
  private formationService = inject(FormationService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.candidatId    = Number(localStorage.getItem('candidatId')) || null;
    this.inscriptionId = Number(
      localStorage.getItem('inscription_' + id)) || null;

    this.parcoursId = Number(this.route.snapshot.queryParamMap.get('parcoursId')) || null;
    this.niveau     = this.route.snapshot.queryParamMap.get('niveau');
    
    const completedParam = this.route.snapshot.queryParamMap.get('completed');
    this.isAlreadyCompleted = completedParam === 'true';

    this.formationService.getFormationById(id).subscribe({
      next: (f) => { 
        this.formation = f;
        
        // Robust recovery of inscriptionId
        if (this.candidatId) {
          // Si on est dans un parcours, on récupère l'inscription spécifique au parcours
          // Sinon on cherche l'inscription classique
          this.formationService.getInscriptionByDetails(this.candidatId, f.id, this.parcoursId || undefined).subscribe({
            next: (found) => {
              if (found) {
                this.inscriptionId = found.id;
                // On ne met à jour le localStorage que si on n'est pas dans un parcours
                // pour ne pas écraser l'ID de la formation standalone
                if (!this.parcoursId) {
                  localStorage.setItem('inscription_' + f.id, String(found.id));
                }
              }
              this.loading = false;
            },
            error: () => {
              // Fallback: si on n'a pas trouvé d'inscription spécifique, on garde l'ID du localStorage ou null
              this.loading = false;
            }
          });
        } else {
          this.loading = false; 
        }
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/formations']);
      }
    });
  }

  retour(): void {
    if (this.parcoursId) {
      this.router.navigate(['/formations/parcours', this.parcoursId]);
    } else {
      this.router.navigate(['/formations', this.formation.id]);
    }
  }
}