import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxScrollTopModule } from 'ngx-scrolltop';
import { GoogleMapsModule } from '@angular/google-maps';
import { AuthInterceptor } from './auth.interceptor';
import { SharedModule } from './shared/shared.module';
import { routes } from './app.routes';
import { App } from './app';


// Import all components
import { HomeDemoOneComponent } from './pages/home-demo-one/home-demo-one.component';
import { NotFoundComponent } from './common/not-found/not-found.component';
import { JobsGridPageComponent } from './pages/jobs-grid-page/jobs-grid-page.component';
import { JobsListingPageComponent } from './pages/jobs-listing-page/jobs-listing-page.component';
import { JobDetailsPageComponent } from './pages/job-details-page/job-details-page.component';
import { CandidatesPageComponent } from './pages/candidates-page/candidates-page.component';
import { FileUploadComponent } from './pages/candidate-details-page/file-upload/file-upload.component';
import { EmployersPageComponent } from './pages/employers-page/employers-page.component';
import { EmployerDetailsPageComponent } from './pages/employer-details-page/employer-details-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { PricingPageComponent } from './pages/pricing-page/pricing-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { BlogPageComponent } from './pages/blog-page/blog-page.component';
import { BlogDetailsPageComponent } from './pages/blog-details-page/blog-details-page.component';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
// Shared components are in SharedModule now

// More common
import { BlogSidebarComponent } from './common/blog-sidebar/blog-sidebar.component';

import { PricingComponent } from './common/pricing/pricing.component';

import { JobsSidebarComponent } from './common/jobs-sidebar/jobs-sidebar.component';


// Dashboard components

// Recruiter Dashboard components are now in SharedModule
import { RdPostJobComponent } from './recruiter-dashboard/rd-post-job/rd-post-job.component';
import { RdManageJobsComponent } from './recruiter-dashboard/rd-manage-jobs/rd-manage-jobs.component';
import { RdApplicantsComponent } from './recruiter-dashboard/rd-applicants/rd-applicants.component';
import { RdMessagesComponent } from './recruiter-dashboard/rd-messages/rd-messages.component';
import { RdProfileComponent } from './recruiter-dashboard/rd-profile/rd-profile.component';
import { RdChangePasswordComponent } from './recruiter-dashboard/rd-change-password/rd-change-password.component';

// evenement components

import { DatePipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';

import { FullCalendarModule } from '@fullcalendar/angular';

import { RdMessagesMailboxComponent } from './recruiter-dashboard/rd-messages-mailbox/rd-messages-mailbox.component';

// Banner components are now in SharedModule
// participations




registerLocaleData(localeFr, 'fr');

@NgModule({
    declarations: [],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        RouterModule.forRoot(routes),
        BrowserAnimationsModule,
        CarouselModule,
        NgApexchartsModule,
        NgxScrollTopModule,
        GoogleMapsModule,
        SharedModule,
        FullCalendarModule,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        DatePipe,
        { provide: LOCALE_ID, useValue: 'fr' },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [App],
})
export class AppModule { }