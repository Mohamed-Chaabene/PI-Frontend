import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-cd-header',
    standalone: false,
    templateUrl: './cd-header.component.html',
    styleUrls: ['./cd-header.component.scss']
})
export class CdHeaderComponent implements OnInit {

    candidateData: any = {
        profile_picture_url: '',
        nom: ''
    };
    profilePictureUrl = '';
    defaultProfilePictureUrl = '/images/candidates/candidate1.jpg';
    userName = 'User';

    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit() {
        this.loadCandidateData();
    }

    get displayProfilePictureUrl(): string {
        const baseUrl = this.profilePictureUrl || this.candidateData.profile_picture_url || this.candidateData.profilePictureUrl || this.defaultProfilePictureUrl;
        return this.transformCloudinaryUrl(baseUrl, 100, 100);
    }

    private transformCloudinaryUrl(url: string, width: number, height: number): string {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }
        // Insert transformation before the image name
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/w_${width},h_${height},c_fill,f_auto,q_auto/${parts[1]}`;
        }
        return url;
    }

    loadCandidateData(): void {
        const userEmail = this.resolveCurrentUserEmail();

        if (!userEmail) {
            return;
        }

        this.apiService.getCandidateByEmail(userEmail).subscribe({
            next: (data: any) => {
                if (data) {
                    this.candidateData = { ...this.candidateData, ...data };
                    this.userName = data.nom || 'User';
                }
            },
            error: (err) => {
                console.error('Error loading candidate data:', err);
            }
        });
    }

    private resolveCurrentUserEmail(): string {
        const storedEmail = String(localStorage.getItem('userEmail') || '').trim();
        if (storedEmail.includes('@')) {
            return storedEmail;
        }

        const userName = String(localStorage.getItem('userName') || '').trim();
        if (userName.includes('@')) {
            return userName;
        }

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const tokenEmail = String(decoded?.email || decoded?.sub || '').trim();
                if (tokenEmail.includes('@')) {
                    return tokenEmail;
                }
            } catch {
                // ignore invalid token
            }
        }
        return '';
    }

    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

    classApplied2 = false;
    toggleClass2() {
        this.classApplied2 = !this.classApplied2;
    }

<<<<<<< Updated upstream
=======
    searchName = '';
    searchResults: any[] = [];
    searchError = '';
    searchLoading = false;
    searchOpen = false;
    notificationCount = 0;
    notificationOpen = false;
    private searchDebounceTimeout: any;

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.notification-item')) {
            this.notificationOpen = false;
        }
    }

    onSearchInput(): void {
        if (this.searchDebounceTimeout) {
            clearTimeout(this.searchDebounceTimeout);
        }

        this.searchDebounceTimeout = setTimeout(() => {
            this.searchByName();
        }, 240);
    }

    searchByName(): void {
        const name = (this.searchName || '').trim();
        this.searchResults = [];
        this.searchError = '';
        this.searchLoading = false;
        this.searchOpen = !!name;

        if (!name) {
            return;
        }

        const currentEmail = this.resolveCurrentUserEmail().toLowerCase();

        this.searchLoading = true;
        this.apiService.getUsersByName(name).subscribe({
            next: (results: any) => {
                this.searchLoading = false;
                const items = Array.isArray(results) ? results : [];
                this.searchResults = items.filter((user: any) => {
                    const email = String(user?.email || '').trim().toLowerCase();
                    return email !== currentEmail;
                });
                if (this.searchResults.length === 0) {
                    this.searchError = `Aucun utilisateur trouvé avec le nom "${name}".`;
                }
            },
            error: (err) => {
                this.searchLoading = false;
                console.error('Erreur de recherche par nom utilisateur :', err);
                this.searchError = 'Erreur lors de la recherche. Vérifiez le nom et réessayez.';
            }
        });
    }

    closeSearchDropdown(): void {
        this.searchOpen = false;
    }

    toggleNotifications(): void {
        this.notificationOpen = !this.notificationOpen;
        if (this.notificationOpen) {
            this.activeDropdown = null;
        }
    }

    followUser(user: any): void {
        console.log('Follow user clicked', user);
        // TODO: call your follow API when ready
    }

    activeDropdown: string | null = null;

    toggleDropdown(menu: string) {
        this.activeDropdown = this.activeDropdown === menu ? null : menu;
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('candidatId');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        this.router.navigate(['/login']);
    }

>>>>>>> Stashed changes
}

