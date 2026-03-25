import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RdHeaderComponent } from './rd-header/rd-header.component';
import { RdSidebarComponent } from './rd-sidebar/rd-sidebar.component';
import { RdFooterComponent } from './rd-footer/rd-footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-recruiter-dashboard',
    standalone: false,
    templateUrl: './recruiter-dashboard.component.html',
    styleUrls: ['./recruiter-dashboard.component.scss']
})
export class RecruiterDashboardComponent {

    title = 'Recruiter Dashboard - Jove';
 
    constructor(private titleService:Title) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
    }

}
