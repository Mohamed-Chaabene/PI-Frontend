import { Component, signal } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: false,
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {

    protected readonly title = signal('Jove - Angular 20 Job Board & Hiring Template');

    private previousUrl: string | null = null;

    private urlWithoutFragment(url: string): string {
        const i = url.indexOf('#');
        return i >= 0 ? url.slice(0, i) : url;
    }

    constructor(
        public router: Router,
        private viewportScroller: ViewportScroller
    ) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                const currentUrl = event.urlAfterRedirects;
                // Ne pas forcer le scroll en haut si seul le fragment change (ex. / → /#entretiens),
                // sinon l’ancre du routeur ne fonctionne pas et la section Entretiens semble « absente ».
                const prevBase = this.urlWithoutFragment(this.previousUrl ?? '');
                const currBase = this.urlWithoutFragment(currentUrl);
                if (this.previousUrl && prevBase !== currBase) {
                    this.viewportScroller.scrollToPosition([0, 0]);
                }
                this.previousUrl = currentUrl;
            }
        });
    }

}