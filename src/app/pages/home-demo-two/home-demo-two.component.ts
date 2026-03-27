import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { HometwoBannerComponent } from './hometwo-banner/hometwo-banner.component';
import { AboutUsComponent } from '../../common/about-us/about-us.component';
import { CategoriesComponent } from '../../common/categories/categories.component';
import { FeaturesComponent } from '../../common/features/features.component';
import { CompaniesComponent } from '../../common/companies/companies.component';
import { PopularJobsComponent } from '../../common/popular-jobs/popular-jobs.component';
import { WhyChooseUsComponent } from '../../common/why-choose-us/why-choose-us.component';
import { HowJoveWorksComponent } from '../../common/how-jove-works/how-jove-works.component';
import { TestimonialsComponent } from '../../common/testimonials/testimonials.component';
import { FunfactsComponent } from '../../common/funfacts/funfacts.component';
import { TalentedExpertsComponent } from '../../common/talented-experts/talented-experts.component';
import { FaqComponent } from '../../common/faq/faq.component';
import { DownloadAppComponent } from '../../common/download-app/download-app.component';
import { BlogComponent } from '../../common/blog/blog.component';
import { SubscribeComponent } from '../../common/subscribe/subscribe.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgxScrollTopComponent } from 'ngx-scrolltop';

@Component({
    selector: 'app-home-demo-two',
    standalone: false,
    templateUrl: './home-demo-two.component.html',
    styleUrls: ['./home-demo-two.component.scss']
})
export class HomeDemoTwoComponent {

    title = 'Home Demo - 2 - Jove';
 
    constructor(private titleService:Title) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
    }

}

