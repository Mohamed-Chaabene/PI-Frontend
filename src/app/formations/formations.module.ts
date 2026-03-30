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

// ── Composants Admin ──────────────────────────────────────────────────────────
import { FormationsAdminComponent } from './admin/formations-admin/formations-admin.component';
import { FormationCreateComponent } from './admin/formation-create/formation-create.component';
import { FormationEditComponent } from './admin/formation-edit/formation-edit.component';
import { FormationParticipantsComponent } from './admin/formation-participants/formation-participants.component';
import { FeedbackAdminComponent } from './admin/feedback-admin/feedback-admin.component';

import { FeedbackCandidatComponent } from './feedback-candidat/feedback-candidat.component';

@NgModule({
  declarations: [
    // Formation
    FormationsListComponent,
    FormationDetailComponent,
    MesFormationsComponent,
    // Admin
    FormationsAdminComponent,
    FormationCreateComponent,
    FormationEditComponent,
    FormationParticipantsComponent,
    FeedbackAdminComponent,
    // Feedback
    FeedbackCandidatComponent,
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