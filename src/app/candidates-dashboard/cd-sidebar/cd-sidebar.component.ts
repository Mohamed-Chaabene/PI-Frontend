import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-cd-sidebar',
    standalone: false,
    templateUrl: './cd-sidebar.component.html',
    styleUrls: ['./cd-sidebar.component.scss']
})
export class CdSidebarComponent {

    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

}

