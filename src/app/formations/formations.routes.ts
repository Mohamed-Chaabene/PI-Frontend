import { Routes } from '@angular/router';
import { FormationsListComponent } from './formations-list/formations-list.component';
import { FormationDetailComponent } from './formation-detail/formation-detail.component';
import { MesFormationsComponent } from './mes-formations/mes-formations.component';
import { FormationsAdminComponent } from './admin/formations-admin/formations-admin.component';
import { FormationCreateComponent } from './admin/formation-create/formation-create.component';
import { FormationEditComponent } from './admin/formation-edit/formation-edit.component';
import { FormationParticipantsComponent } from './admin/formation-participants/formation-participants.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const formationsRoutes: Routes = [
  { path: '', component: FormationsListComponent },

  // Chemins littéraux avant :id (sinon "mes-formations" et "admin" sont pris comme id)
  { path: 'mes-formations', component: MesFormationsComponent, canActivate: [authGuard] },

  { path: 'admin/create', component: FormationCreateComponent, canActivate: [adminGuard] },
  { path: 'admin/edit/:id', component: FormationEditComponent, canActivate: [adminGuard] },
  { path: 'admin/:id/participants', component: FormationParticipantsComponent, canActivate: [adminGuard] },
  { path: 'admin', component: FormationsAdminComponent, canActivate: [adminGuard] },

  { path: ':id', component: FormationDetailComponent },
];