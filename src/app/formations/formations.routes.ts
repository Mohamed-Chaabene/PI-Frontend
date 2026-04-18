import { Routes } from '@angular/router';
import { FormationsListComponent } from './formations-list/formations-list.component';
import { FormationDetailComponent } from './formation-detail/formation-detail.component';
import { FormationEcriteComponent } from './formation-ecrite/formation-ecrite.component';
import { FormationVideoComponent } from './formation-video/formation-video.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const formationsRoutes: Routes = [
  { path: '', component: FormationsListComponent },


  { path: ':id/video',  component: FormationVideoComponent  },
  { path: ':id/ecrite', component: FormationEcriteComponent },

  { path: ':id', component: FormationDetailComponent },
];