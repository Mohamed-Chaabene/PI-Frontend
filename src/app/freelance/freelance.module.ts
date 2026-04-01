import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { FreelanceRoutingModule } from './freelance.routes';
import { SharedModule } from '../shared/shared.module';

import { FreelanceLayoutComponent } from './freelance-layout/freelance-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { JobsComponent } from './jobs/jobs.component';
import { ProfileComponent } from './profile/profile.component';
import { UnitsComponent } from './units/units.component';
import { MyWorkComponent } from './my-work/my-work.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    FreelanceRoutingModule,
    SharedModule,
    FreelanceLayoutComponent,
    DashboardComponent,
    JobsComponent,
    ProfileComponent,
    UnitsComponent,
    MyWorkComponent
  ]
})
export class FreelanceModule { }