import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { formationsRoutes } from './formations.routes';
import { FormationsListComponent } from './formations-list/formations-list.component';
import { FormationDetailComponent } from './formation-detail/formation-detail.component';
import { MesFormationsComponent } from './mes-formations/mes-formations.component';
import { FormationsAdminComponent } from './admin/formations-admin/formations-admin.component';
import { FormationCreateComponent } from './admin/formation-create/formation-create.component';
import { FormationEditComponent } from './admin/formation-edit/formation-edit.component';
import { FormationParticipantsComponent } from './admin/formation-participants/formation-participants.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    FormationsListComponent,
    FormationDetailComponent,
    MesFormationsComponent,
    FormationsAdminComponent,
    FormationCreateComponent,      // ← nouveau
    FormationEditComponent,        // ← nouveau
    FormationParticipantsComponent // ← nouveau
  ],
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(formationsRoutes)
  ]
})
export class FormationsModule {}