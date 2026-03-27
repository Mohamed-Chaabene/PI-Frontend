import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { SubscribeComponent } from '../../common/subscribe/subscribe.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgxScrollTopComponent } from 'ngx-scrolltop';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-candidate-details-page',
    standalone: false,
    templateUrl: './candidate-details-page.component.html',
    styleUrls: ['./candidate-details-page.component.scss']
})
export class CandidateDetailsPageComponent {

    title = 'Candidate Details - Jove';
 
    constructor(private titleService:Title) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
    }

}

