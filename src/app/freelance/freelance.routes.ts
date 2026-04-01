import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FreelanceLayoutComponent } from './freelance-layout/freelance-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { JobsComponent } from './jobs/jobs.component';
import { ProfileComponent } from './profile/profile.component';
import { UnitsComponent } from './units/units.component';
import { MyWorkComponent } from './my-work/my-work.component';

const routes: Routes = [
  {
    path: '',
    component: FreelanceLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'units', component: UnitsComponent },
      { path: 'my-work', component: MyWorkComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FreelanceRoutingModule { }