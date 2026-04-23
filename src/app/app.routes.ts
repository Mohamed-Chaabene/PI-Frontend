import { Routes } from '@angular/router';
import { HomeDemoOneComponent } from './pages/home-demo-one/home-demo-one.component';
import { HomeDemoTwoComponent } from './pages/home-demo-two/home-demo-two.component';
import { HomeDemoThreeComponent } from './pages/home-demo-three/home-demo-three.component';
import { NotFoundComponent } from './common/not-found/not-found.component';

// Import all standalone pages
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { PricingPageComponent } from './pages/pricing-page/pricing-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { BlogPageComponent } from './pages/blog-page/blog-page.component';
import { BlogDetailsPageComponent } from './pages/blog-details-page/blog-details-page.component';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
import { JobsGridPageComponent } from './pages/jobs-grid-page/jobs-grid-page.component';
import { JobsListingPageComponent } from './pages/jobs-listing-page/jobs-listing-page.component';
import { JobDetailsPageComponent } from './pages/job-details-page/job-details-page.component';
import { CandidatesPageComponent } from './pages/candidates-page/candidates-page.component';
import { CandidateDetailsPageComponent } from './pages/candidate-details-page/candidate-details-page.component';
import { EmployersPageComponent } from './pages/employers-page/employers-page.component';
import { EmployerDetailsPageComponent } from './pages/employer-details-page/employer-details-page.component';
import { CandidateEntretiensPageComponent } from './pages/candidate-entretiens-page/candidate-entretiens-page.component';
import { PublicTestPassPageComponent } from './pages/public-test-pass-page/public-test-pass-page.component';

// Dashboard imports
import { CandidatesDashboardComponent } from './candidates-dashboard/candidates-dashboard.component';
import { CDashboardComponent } from './candidates-dashboard/c-dashboard/c-dashboard.component';
import { CdProfileComponent } from './candidates-dashboard/cd-profile/cd-profile.component';
import { CdBookmarksComponent } from './candidates-dashboard/cd-bookmarks/cd-bookmarks.component';
import { CdAppliedJobsComponent } from './candidates-dashboard/cd-applied-jobs/cd-applied-jobs.component';
import { CdAlertJobsComponent } from './candidates-dashboard/cd-alert-jobs/cd-alert-jobs.component';
import { CdMessageComponent } from './candidates-dashboard/cd-message/cd-message.component';
import { CdChangePasswordComponent } from './candidates-dashboard/cd-change-password/cd-change-password.component';
import { CdDocumentsComponent } from './candidates-dashboard/cd-documents/cd-documents.component';
import { PartenaireCandidatComponent } from './candidates-dashboard/partenaire-candidat/partenaire-candidat.component';
import { OffreCandidatComponent } from './candidates-dashboard/offre-candidat/offre-candidat.component';
import { EvenementCandidatComponent } from './candidates-dashboard/evenement-candidat/evenement-candidat.component';
import { MesParticipationsComponent } from './candidates-dashboard/evenement-candidat/mes-participations/mes-participations.component';
import { MaCalendarComponent } from './candidates-dashboard/evenement-candidat/ma-calendar/ma-calendar.component';
import { MesFormationsComponent } from './candidates-dashboard/mes-formations/mes-formations.component';

import { RecruiterDashboardComponent } from './recruiter-dashboard/recruiter-dashboard.component';
import { RdDashboardComponent } from './recruiter-dashboard/rd-dashboard/rd-dashboard.component';
import { RdPostJobComponent } from './recruiter-dashboard/rd-post-job/rd-post-job.component';
import { RdManageJobsComponent } from './recruiter-dashboard/rd-manage-jobs/rd-manage-jobs.component';
import { RdApplicantsComponent } from './recruiter-dashboard/rd-applicants/rd-applicants.component';
import { RdMessagesComponent } from './recruiter-dashboard/rd-messages/rd-messages.component';
import { RdProfileComponent } from './recruiter-dashboard/rd-profile/rd-profile.component';
import { RdChangePasswordComponent } from './recruiter-dashboard/rd-change-password/rd-change-password.component';
import { RdInterviews } from './recruiter-dashboard/rd-interviews/rd-interviews';
import { RdAddQuestions } from './recruiter-dashboard/rd-add-questions/rd-add-questions';

import { EvenementDashboardComponent } from './evenement-dashboard/evenement-dashboard.component';
import { EvenementTemplateComponent } from './evenement-dashboard/evenement-template/evenement-template.component';
import { EvenementFormComponent } from './evenement-dashboard/evenement-form/evenement-form';
import { EvenementListComponent } from './evenement-dashboard/evenement-list/evenement-list.component';
import { EvenementEditComponent } from './evenement-dashboard/evenement-edit/evenement-edit.component';
import { EvenementDetailComponent } from './evenement-dashboard/evenement-detail/evenement-detail.component';
import { EvenementDemandesComponent } from './evenement-dashboard/evenement-demandes/evenement-demandes.component';
import { EvenementCalendrierComponent } from './evenement-dashboard/evenement-calendar/evenement-calendar.component';
import { EvenementFeedbacksComponent } from './evenement-dashboard/evenement-feedback/evenement-feedbacks.component';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdDashboardComponent } from './admin-dashboard/ad-dashboard/ad-dashboard.component';
import { PartenaireListComponent } from './admin-dashboard/partenaire-list/partenaire-list.component';
import { OffreListComponent } from './admin-dashboard/offre-list/offre-list.component';
import { EntretienListComponent } from './admin-dashboard/entretien-list/entretien-list.component';
import { CandidatureListComponent } from './admin-dashboard/candidature-list/candidature-list.component';
import { EvenementListAdminComponent } from './admin-dashboard/evenement-list-admin/evenement-list-admin.component';
import { CandidatsListComponent } from './admin-dashboard/candidats-list/candidats-list.component';
import { FormationsAdminComponent } from './admin-dashboard/formations-admin/formations-admin.component';
import { FormationCreateComponent } from './admin-dashboard/formation-create/formation-create.component';
import { FormationEditComponent } from './admin-dashboard/formation-edit/formation-edit.component';
import { FormationParticipantsComponent } from './admin-dashboard/formation-participants/formation-participants.component';
import { FeedbackAdminComponent } from './admin-dashboard/feedback-admin/feedback-admin.component';

// Guards
import { recruteurGuard, recruteurChildGuard } from './guards/recruteur.guard';

export const routes: Routes = [
    { path: '', component: HomeDemoOneComponent },
    { path: 'index-2', component: HomeDemoTwoComponent },
    { path: 'index-3', component: HomeDemoThreeComponent },
    { path: 'login', component: HomeDemoOneComponent },

    // Public pages
    { path: 'about', component: AboutPageComponent },
    { path: 'pricing', component: PricingPageComponent },
    { path: 'faq', component: FaqPageComponent },
    { path: 'privacy-policy', component: PrivacyPolicyPageComponent },
    { path: 'terms-conditions', component: TermsConditionsPageComponent },
    { path: 'contact', component: ContactPageComponent },
    { path: 'blog', component: BlogPageComponent },
    { path: 'blog-details', component: BlogDetailsPageComponent },
    { path: 'categories', component: CategoriesPageComponent },
    { path: 'jobs-grid', component: JobsGridPageComponent },
    { path: 'jobs-listing', component: JobsListingPageComponent },
    { path: 'job-details', component: JobDetailsPageComponent },
    { path: 'candidates', component: CandidatesPageComponent },
    { path: 'candidate-details/:id', component: CandidateDetailsPageComponent },
    { path: 'candidate-entretiens', component: CandidateEntretiensPageComponent },
    { path: 'employers', component: EmployersPageComponent },
    { path: 'employer-details', component: EmployerDetailsPageComponent },
    { path: 'entretiens/test/:id', component: PublicTestPassPageComponent },

    // Candidates Dashboard
    {
        path: 'candidates-dashboard',
        component: CandidatesDashboardComponent,
        children: [
            { path: '', component: CDashboardComponent },
            { path: 'my-profile', component: CdProfileComponent },
            { path: 'documents', component: CdDocumentsComponent },
            { path: 'bookmarks', component: CdBookmarksComponent },
            { path: 'applied-jobs', component: CdAppliedJobsComponent },
            { path: 'alert-jobs', component: CdAlertJobsComponent },
            { path: 'message', component: CdMessageComponent },
            { path: 'change-password', component: CdChangePasswordComponent },
            { path: 'partenaires', component: PartenaireCandidatComponent },
            { path: 'partenaires/:id/offres', component: OffreCandidatComponent },
            { path: 'evenements', component: EvenementCandidatComponent },
            { path: 'mes-participations', component: MesParticipationsComponent },
            { path: 'ma-calendar', component: MaCalendarComponent },
            { path: 'mes-formations', component: MesFormationsComponent },
        ]
    },

    // Recruiter Dashboard
    {
        path: 'recruiter-dashboard',
        component: RecruiterDashboardComponent,
        canActivate: [recruteurGuard],
        canActivateChild: [recruteurChildGuard],
        children: [
            { path: '', component: RdDashboardComponent },
            { path: 'post-job', component: RdPostJobComponent },
            { path: 'manage-jobs', component: RdManageJobsComponent },
            { path: 'applicants', component: RdApplicantsComponent },
            { path: 'messages', component: RdMessagesComponent },
            { path: 'profile', component: RdProfileComponent },
            { path: 'change-password', component: RdChangePasswordComponent },
            { path: 'interviews', component: RdInterviews },
            { path: 'interviews/add-questions/:id', component: RdAddQuestions },
        ]
    },

    // Freelance Module (Lazy Loaded)
    {
        path: 'freelance',
        loadChildren: () =>
            import('./freelance/freelance.module').then(m => m.FreelanceModule)
    },

    // Evenement Dashboard
    {
        path: 'evenement-dashboard',
        component: EvenementDashboardComponent,
        children: [
            { path: '', component: EvenementTemplateComponent },
            { path: 'ajouter', component: EvenementFormComponent },
            { path: 'liste', component: EvenementListComponent },
            { path: 'modifier/:id', component: EvenementEditComponent },
            { path: 'detail/:id', component: EvenementDetailComponent },
            { path: 'demandes', component: EvenementDemandesComponent },
            { path: 'calendrier', component: EvenementCalendrierComponent },
            { path: 'feedbacks', component: EvenementFeedbacksComponent },
        ]
    },

    // Admin Dashboard
    {
        path: 'admin-dashboard',
        component: AdminDashboardComponent,
        children: [
            { path: '', component: AdDashboardComponent },
            { path: 'partenaires', component: PartenaireListComponent },
            { path: 'partenaires/:id/offres', component: OffreListComponent },
            { path: 'entretiens', component: EntretienListComponent },
            { path: 'candidatures', component: CandidatureListComponent },
            { path: 'evenements', component: EvenementListAdminComponent },
            { path: 'candidats', component: CandidatsListComponent },
            { path: 'formations', component: FormationsAdminComponent },
            { path: 'formations/create', component: FormationCreateComponent },
            { path: 'formations/edit/:id', component: FormationEditComponent },
            { path: 'formations/:id/participants', component: FormationParticipantsComponent },
            { path: 'formations/:id/feedbacks', component: FeedbackAdminComponent },
        ]
    },

    // Formations Module (Lazy Loaded)
    {
        path: 'formations',
        loadChildren: () =>
            import('./formations/formations.module').then(m => m.FormationsModule)
    },

    // 404 - Must be the last route
    { path: '**', component: NotFoundComponent }
];