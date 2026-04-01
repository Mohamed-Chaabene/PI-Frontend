import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SharedModule } from '../shared/shared.module';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-recruiter-dashboard',
    imports: [SharedModule],
    templateUrl: './recruiter-dashboard.component.html',
    styleUrls: ['./recruiter-dashboard.component.scss']
})
export class RecruiterDashboardComponent {

    title = 'Recruiter Dashboard - Matchy Khedma';
 
    constructor(private titleService:Title) {}
    
    ngOnInit() {
        this.titleService.setTitle(this.title);
    }

}
