import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-rd-sidebar',
    standalone: false,
    templateUrl: './rd-sidebar.component.html',
    styleUrls: ['./rd-sidebar.component.scss']
})
export class RdSidebarComponent {
    classApplied = false;

    constructor() { }

    ngOnInit(): void { }

    toggleClass(): void {
        this.classApplied = !this.classApplied;
    }
}
