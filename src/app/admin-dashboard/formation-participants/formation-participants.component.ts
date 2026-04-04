import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormationService } from '../../formations/services/formation.service';
import { ApiService } from '../../api.service';
import { Inscription } from '../../formations/models/inscription.model';
import { Formation } from '../../formations/models/formation.model';
import { forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-formation-participants',
  standalone: false,
  templateUrl: './formation-participants.component.html',
  styleUrls: ['./formation-participants.component.scss']
})
export class FormationParticipantsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formationService = inject(FormationService);
  private apiService = inject(ApiService);

  formation: Formation | null = null;
  inscriptions: Inscription[] = [];
  loading = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.formationService.getFormationById(id).subscribe(f => { this.formation = f; });
    
    this.formationService.getInscriptionsByFormation(id).pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: (inscriptions) => {
        // Charger les détails des candidats pour chaque inscription
        if (inscriptions.length === 0) {
          this.inscriptions = [];
          return;
        }
        
        const candidatRequests = inscriptions.map(ins => {
          const candidatId = ins.candidat?.id ?? 0;
          return this.apiService.getCandidat(candidatId).pipe(
            catchError(() => {
              // Si la requête échoue, retourner un objet avec juste l'ID
              return of({ id: candidatId, code: '#' + candidatId, nom: `Candidat #${candidatId}` });
            })
          );
        });
        
        forkJoin(candidatRequests).subscribe({
          next: (candidats) => {
            this.inscriptions = inscriptions.map((ins, idx) => {
              const loadedCandidat = candidats[idx];
              // Si le candidat n'a pas de nom, ajouter au moins l'ID
              return {
                ...ins,
                candidat: {
                  ...loadedCandidat,
                  id: loadedCandidat?.id || ins.candidat?.id,
                  code: loadedCandidat?.code || '#' + (loadedCandidat?.id || ins.candidat?.id),
                  nom: loadedCandidat?.nom || `Candidat ${loadedCandidat?.id || ins.candidat?.id}`
                }
              };
            });
          },
          error: () => {
            // Si ça échoue, garder les inscriptions avec fallback
            this.inscriptions = inscriptions.map(ins => {
              const candidatId = ins.candidat?.id ?? 0;
              return {
                ...ins,
                candidat: {
                  ...ins.candidat,
                  id: candidatId,
                  code: ins.candidat?.code || '#' + candidatId,
                  nom: ins.candidat?.nom || `Candidat ${candidatId}`
                }
              };
            });
          }
        });
      },
      error: () => { /* error already handled by finalize */ }
    });
  }

  getCount(statut: string): number {
    return this.inscriptions.filter(i => i.statut === statut).length;
  }
}