import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { HomeoneBannerComponent } from './homeone-banner/homeone-banner.component';
import { CompaniesComponent } from '../../common/companies/companies.component';
import { CategoriesComponent } from '../../common/categories/categories.component';
import { FeaturesComponent } from '../../common/features/features.component';
import { FunfactsComponent } from '../../common/funfacts/funfacts.component';
import { PopularJobsComponent } from '../../common/popular-jobs/popular-jobs.component';
import { HowJoveWorksComponent } from '../../common/how-jove-works/how-jove-works.component';
import { JobsByLocationComponent } from '../../common/jobs-by-location/jobs-by-location.component';
import { TestimonialsComponent } from '../../common/testimonials/testimonials.component';
import { GetHiredByTopCompaniesComponent } from '../../common/get-hired-by-top-companies/get-hired-by-top-companies.component';
import { FaqComponent } from '../../common/faq/faq.component';
import { DownloadAppComponent } from '../../common/download-app/download-app.component';
import { BlogComponent } from '../../common/blog/blog.component';
import { SubscribeComponent } from '../../common/subscribe/subscribe.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgxScrollTopComponent } from 'ngx-scrolltop';

@Component({
    selector: 'app-home-demo-one',
    standalone: false,
    templateUrl: './home-demo-one.component.html',
    styleUrls: ['./home-demo-one.component.scss']
})
export class HomeDemoOneComponent {

    title = 'Home Demo - 1 - Jove';
 
    constructor(private titleService:Title) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
    }

}

