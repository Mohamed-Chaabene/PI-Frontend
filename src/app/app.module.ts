import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxScrollTopModule } from 'ngx-scrolltop';
import { AuthInterceptor } from './auth.interceptor';

import { routes } from './app.routes';
import { App } from './app';

// Import all components
import { HomeDemoOneComponent } from './pages/home-demo-one/home-demo-one.component';
import { HomeDemoTwoComponent } from './pages/home-demo-two/home-demo-two.component';
import { HomeDemoThreeComponent } from './pages/home-demo-three/home-demo-three.component';
import { NotFoundComponent } from './common/not-found/not-found.component';
import { JobsGridPageComponent } from './pages/jobs-grid-page/jobs-grid-page.component';
import { JobsListingPageComponent } from './pages/jobs-listing-page/jobs-listing-page.component';
import { JobDetailsPageComponent } from './pages/job-details-page/job-details-page.component';
import { CandidatesPageComponent } from './pages/candidates-page/candidates-page.component';
import { CandidateDetailsPageComponent } from './pages/candidate-details-page/candidate-details-page.component';
import { FileUploadComponent } from './pages/candidate-details-page/file-upload/file-upload.component';
import { EmployersPageComponent } from './pages/employers-page/employers-page.component';
import { EmployerDetailsPageComponent } from './pages/employer-details-page/employer-details-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { PricingPageComponent } from './pages/pricing-page/pricing-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { BlogPageComponent } from './pages/blog-page/blog-page.component';
import { BlogDetailsPageComponent } from './pages/blog-details-page/blog-details-page.component';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
import { EmployersDashboardComponent } from './employers-dashboard/employers-dashboard.component';
import { EDashboardComponent } from './employers-dashboard/e-dashboard/e-dashboard.component';
import { EdCompanyProfileComponent } from './employers-dashboard/ed-company-profile/ed-company-profile.component';
import { EdPostANewJobComponent } from './employers-dashboard/ed-post-a-new-job/ed-post-a-new-job.component';
import { EdManageJobsComponent } from './employers-dashboard/ed-manage-jobs/ed-manage-jobs.component';
import { EdAllApplicantsComponent } from './employers-dashboard/ed-all-applicants/ed-all-applicants.component';
import { EdResumesComponent } from './employers-dashboard/ed-resumes/ed-resumes.component';
import { EdMessageComponent } from './employers-dashboard/ed-message/ed-message.component';
import { EdChangePasswordComponent } from './employers-dashboard/ed-change-password/ed-change-password.component';
import { CandidatesDashboardComponent } from './candidates-dashboard/candidates-dashboard.component';
import { CDashboardComponent } from './candidates-dashboard/c-dashboard/c-dashboard.component';
import { CdProfileComponent } from './candidates-dashboard/cd-profile/cd-profile.component';
import { CdDocumentsComponent } from './candidates-dashboard/cd-documents/cd-documents.component';  //************************************** */
import { CdBookmarksComponent } from './candidates-dashboard/cd-bookmarks/cd-bookmarks.component';  //************************************** */
import { CdAppliedJobsComponent } from './candidates-dashboard/cd-applied-jobs/cd-applied-jobs.component';  //************************************** */
import { CdAlertJobsComponent } from './candidates-dashboard/cd-alert-jobs/cd-alert-jobs.component';  //************************************** */
import { CdMessageComponent } from './candidates-dashboard/cd-message/cd-message.component';
import { CdChangePasswordComponent } from './candidates-dashboard/cd-change-password/cd-change-password.component';

// Common components
import { NavbarComponent } from './common/navbar/navbar.component';
import { HomeoneBannerComponent } from './pages/home-demo-one/homeone-banner/homeone-banner.component';
import { CompaniesComponent } from './common/companies/companies.component';
import { CategoriesComponent } from './common/categories/categories.component';
import { FeaturesComponent } from './common/features/features.component';
import { FunfactsComponent } from './common/funfacts/funfacts.component';
import { PopularJobsComponent } from './common/popular-jobs/popular-jobs.component';
import { HowJoveWorksComponent } from './common/how-jove-works/how-jove-works.component';
import { JobsByLocationComponent } from './common/jobs-by-location/jobs-by-location.component';
import { TestimonialsComponent } from './common/testimonials/testimonials.component';
import { GetHiredByTopCompaniesComponent } from './common/get-hired-by-top-companies/get-hired-by-top-companies.component';
import { FaqComponent } from './common/faq/faq.component';
import { DownloadAppComponent } from './common/download-app/download-app.component';
import { BlogComponent } from './common/blog/blog.component';
import { SubscribeComponent } from './common/subscribe/subscribe.component';
import { FooterComponent } from './common/footer/footer.component';

// More common
import { BlogSidebarComponent } from './common/blog-sidebar/blog-sidebar.component';
import { WhyChooseUsComponent } from './common/why-choose-us/why-choose-us.component';
import { TalentedExpertsComponent } from './common/talented-experts/talented-experts.component';
import { PartnersComponent } from './common/partners/partners.component';
import { PricingComponent } from './common/pricing/pricing.component';
import { LeadingCompanyComponent } from './common/leading-company/leading-company.component';
import { JobsSidebarComponent } from './common/jobs-sidebar/jobs-sidebar.component';
import { AboutUsComponent } from './common/about-us/about-us.component';

// Dashboard components
import { CdSidebarComponent } from './candidates-dashboard/cd-sidebar/cd-sidebar.component';
import { CdHeaderComponent } from './candidates-dashboard/cd-header/cd-header.component';
import { CdFooterComponent } from './candidates-dashboard/cd-footer/cd-footer.component';
import { EdSidebarComponent } from './employers-dashboard/ed-sidebar/ed-sidebar.component';
import { EdHeaderComponent } from './employers-dashboard/ed-header/ed-header.component';
import { EdFooterComponent } from './employers-dashboard/ed-footer/ed-footer.component';

// Recruiter Dashboard components
import { RecruiterDashboardComponent } from './recruiter-dashboard/recruiter-dashboard.component';
import { RdDashboardComponent } from './recruiter-dashboard/rd-dashboard/rd-dashboard.component';
import { RdHeaderComponent } from './recruiter-dashboard/rd-header/rd-header.component';
import { RdFooterComponent } from './recruiter-dashboard/rd-footer/rd-footer.component';
import { RdSidebarComponent } from './recruiter-dashboard/rd-sidebar/rd-sidebar.component';
import { RdPostJobComponent } from './recruiter-dashboard/rd-post-job/rd-post-job.component';
import { RdManageJobsComponent } from './recruiter-dashboard/rd-manage-jobs/rd-manage-jobs.component';
import { RdApplicantsComponent } from './recruiter-dashboard/rd-applicants/rd-applicants.component';
import { RdMessagesComponent } from './recruiter-dashboard/rd-messages/rd-messages.component';
import { RdProfileComponent } from './recruiter-dashboard/rd-profile/rd-profile.component';
import { RdChangePasswordComponent } from './recruiter-dashboard/rd-change-password/rd-change-password.component';

// Banner components
import { HometwoBannerComponent } from './pages/home-demo-two/hometwo-banner/hometwo-banner.component';
import { HomethreeBannerComponent } from './pages/home-demo-three/homethree-banner/homethree-banner.component';




@NgModule({
    declarations: [
        App,
        HomeDemoOneComponent,
        HomeDemoTwoComponent,
        HomeDemoThreeComponent,
        NotFoundComponent,
        JobsGridPageComponent,
        JobsListingPageComponent,
        JobDetailsPageComponent,
        CandidatesPageComponent,
        CandidateDetailsPageComponent,
        EmployersPageComponent,
        EmployerDetailsPageComponent,
        AboutPageComponent,
        PricingPageComponent,
        FaqPageComponent,
        PrivacyPolicyPageComponent,
        TermsConditionsPageComponent,
        ContactPageComponent,
        BlogPageComponent,
        BlogDetailsPageComponent,
        CategoriesPageComponent,
        EmployersDashboardComponent,
        EDashboardComponent,
        EdCompanyProfileComponent,
        EdPostANewJobComponent,
        EdManageJobsComponent,
        EdAllApplicantsComponent,
        EdResumesComponent,
        EdMessageComponent,
        EdChangePasswordComponent,
        CandidatesDashboardComponent,
        CDashboardComponent,
        CdProfileComponent,
        CdBookmarksComponent,
        CdAppliedJobsComponent,
        CdAlertJobsComponent,
        CdMessageComponent,
        CdChangePasswordComponent,
        NavbarComponent,
        HomeoneBannerComponent,
        CompaniesComponent,
        CategoriesComponent,
        FeaturesComponent,
        FunfactsComponent,
        PopularJobsComponent,
        HowJoveWorksComponent,
        JobsByLocationComponent,
        TestimonialsComponent,
        GetHiredByTopCompaniesComponent,
        FaqComponent,
        DownloadAppComponent,
        BlogComponent,
        SubscribeComponent,
        FooterComponent,
        BlogSidebarComponent,
        WhyChooseUsComponent,
        TalentedExpertsComponent,
        PartnersComponent,
        PricingComponent,
        LeadingCompanyComponent,
        JobsSidebarComponent,
        AboutUsComponent,
        CdSidebarComponent,
        CdHeaderComponent,
        CdFooterComponent,
        EdSidebarComponent,
        EdHeaderComponent,
        EdFooterComponent,
        RecruiterDashboardComponent,
        RdDashboardComponent,
        RdHeaderComponent,
        RdFooterComponent,
        RdSidebarComponent,
        RdPostJobComponent,
        RdManageJobsComponent,
        RdApplicantsComponent,
        RdMessagesComponent,
        RdProfileComponent,
        RdChangePasswordComponent,
        HometwoBannerComponent,
        CdDocumentsComponent,  //************************************** */
        HomethreeBannerComponent,
        
         CdAppliedJobsComponent
    ],
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
        FileUploadComponent
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
    ],
    bootstrap: [App]
})
export class AppModule { }