import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { formationsRoutes } from './formations.routes';
import { SharedModule } from '../shared/shared.module';

// ── Composants Formation ──────────────────────────────────────────────────────
import { FormationsListComponent } from './formations-list/formations-list.component';
import { FormationDetailComponent } from './formation-detail/formation-detail.component';
import { MesFormationsComponent } from './mes-formations/mes-formations.component';
import { FeedbackCandidatComponent } from './feedback-candidat/feedback-candidat.component';

// ── NOUVEAUX ──────────────────────────────────────────────────────────────────
import { FormationPlayerComponent } from './formation-player/formation-player.component';
import { SafePipe } from './pipes/safe.pipe';
import { FormationEcriteComponent } from './formation-ecrite/formation-ecrite.component';
import { FormationVideoComponent } from './formation-video/formation-video.component';



@NgModule({
  declarations: [
    // Formation
    FormationsListComponent,
    FormationDetailComponent,
    MesFormationsComponent,
    // Feedback
    FeedbackCandidatComponent,
    // NOUVEAUX
    FormationPlayerComponent,
    SafePipe,
    FormationEcriteComponent,
    FormationVideoComponent

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(formationsRoutes)
  ]
})
export class FormationsModule {}