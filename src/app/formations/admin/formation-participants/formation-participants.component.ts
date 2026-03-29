import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormationService } from '../../services/formation.service';
import { Inscription } from '../../models/inscription.model';
import { Formation } from '../../models/formation.model';

@Component({
  selector: 'app-formation-participants',
  standalone: false,
  templateUrl: './formation-participants.component.html',
  styleUrls: ['./formation-participants.component.scss']
})
export class FormationParticipantsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formationService = inject(FormationService);

  formation: Formation | null = null;
  inscriptions: Inscription[] = [];
  loading = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.formationService.getFormationById(id).subscribe(f => { this.formation = f; });
    this.formationService.getInscriptionsByFormation(id).subscribe({
      next: (data) => { this.inscriptions = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  getCount(statut: string): number {
  return this.inscriptions.filter(i => i.statut === statut).length;
}
}