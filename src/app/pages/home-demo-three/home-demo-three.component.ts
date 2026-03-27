import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { HomethreeBannerComponent } from './homethree-banner/homethree-banner.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { PopularJobsComponent } from '../../common/popular-jobs/popular-jobs.component';
import { AboutUsComponent } from '../../common/about-us/about-us.component';
import { CategoriesComponent } from '../../common/categories/categories.component';
import { LeadingCompanyComponent } from '../../common/leading-company/leading-company.component';
import { TestimonialsComponent } from '../../common/testimonials/testimonials.component';
import { GetHiredByTopCompaniesComponent } from '../../common/get-hired-by-top-companies/get-hired-by-top-companies.component';
import { HowJoveWorksComponent } from '../../common/how-jove-works/how-jove-works.component';
import { DownloadAppComponent } from '../../common/download-app/download-app.component';
import { FaqComponent } from '../../common/faq/faq.component';
import { JobsByLocationComponent } from '../../common/jobs-by-location/jobs-by-location.component';
import { TalentedExpertsComponent } from '../../common/talented-experts/talented-experts.component';
import { BlogComponent } from '../../common/blog/blog.component';
import { SubscribeComponent } from '../../common/subscribe/subscribe.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgxScrollTopComponent } from 'ngx-scrolltop';

@Component({
    selector: 'app-home-demo-three',
    standalone: false,
    templateUrl: './home-demo-three.component.html',
    styleUrls: ['./home-demo-three.component.scss']
})
export class HomeDemoThreeComponent {

    title = 'Home Demo - 3 - Jove';
 
    constructor(private titleService:Title) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
    }

}

