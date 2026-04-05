import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { ProfileUpdateService } from '../../services/profile-update.service';

interface SearchResult {
    id: number;
    nom: string;
    email: string;
    role: string | null;
}

@Component({
    selector: 'app-cd-header',
    standalone: false,
    templateUrl: './cd-header.component.html',
    styleUrls: ['./cd-header.component.scss']
})
export class CdHeaderComponent implements OnInit {

    searchTerm = '';
    searchResults: SearchResult[] = [];
    showSearchResults = false;
    isSearching = false;
    unreadNotifications = 0;
    currentUserName = 'User';
    currentUserEmail = '';
    currentUserInitial = 'U';
    currentUserImageUrl = '';
    activeDropdown: string | null = null;
    private searchDebounce?: number;

    constructor(private apiService: ApiService, private router: Router, private profileUpdateService: ProfileUpdateService) { }

    ngOnInit() {
        this.currentUserEmail = this.resolveCurrentUserEmail();
        this.currentUserInitial = this.buildInitial(this.currentUserEmail);
        this.currentUserName = String(localStorage.getItem('userName') || this.currentUserName);
        this.loadHeaderProfileData();

        // Listen for profile picture updates
        this.profileUpdateService.profilePictureUpdated$.subscribe((newImageUrl: string) => {
            this.currentUserImageUrl = newImageUrl;
            console.log('✅ Profile picture updated in header:', newImageUrl);
        });
    }

    onSearchChange() {
        if (this.searchDebounce) {
            window.clearTimeout(this.searchDebounce);
        }

        const term = this.searchTerm.trim();
        if (!term) {
            this.resetSearch();
            return;
        }

        this.searchDebounce = window.setTimeout(() => {
            this.executeSearch(term);
        }, 250);
    }

    executeSearch(term: string) {
        this.isSearching = true;
        this.showSearchResults = true;
        const token = localStorage.getItem('token');
        console.log('🔍 Search initiated for:', term);
        console.log('📋 Token available:', !!token);

        this.apiService.getUsersByName(term).subscribe({
            next: (results) => {
                console.log('✅ Search results:', results);
                const normalizedEmail = this.currentUserEmail.toLowerCase();
                this.searchResults = results.filter((user: SearchResult) =>
                    user.email?.toLowerCase() !== normalizedEmail
                );
                this.isSearching = false;
                this.showSearchResults = true;
            },
            error: (error) => {
                console.error('❌ Search error:', error);
                this.searchResults = [];
                this.isSearching = false;
                this.showSearchResults = true;
            }
        });
    }

    selectUser(user: SearchResult) {
        this.searchTerm = user.nom;
        this.showSearchResults = false;
    }

    onSearchBlur() {
        setTimeout(() => this.showSearchResults = false, 200);
    }

    clearSearch() {
        this.searchTerm = '';
        this.resetSearch();
    }

    toggleNotification() {
        this.unreadNotifications = 0;
    }

    toggleDropdown(menu: string) {
        this.activeDropdown = this.activeDropdown === menu ? null : menu;
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('candidatId');
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
    }

    private resetSearch() {
        this.searchResults = [];
        this.showSearchResults = false;
        this.isSearching = false;
    }

    private resolveCurrentUserEmail(): string {
        return String(localStorage.getItem('userEmail') || '').trim().toLowerCase();
    }

    private loadHeaderProfileData(): void {
        const email = this.currentUserEmail;
        if (!email) {
            return;
        }

        this.apiService.getCandidateByEmail(email).subscribe({
            next: (data: any) => {
                if (data) {
                    this.currentUserImageUrl = data.profile_picture_url || data.profilePictureUrl || '';
                    this.currentUserName = data.nom || this.currentUserName;
                }
            },
            error: () => {
                // keep fallback values if candidate info is unavailable
            }
        });
    }

    get displayProfilePictureUrl(): string {
        return this.currentUserImageUrl || '/images/candidates/candidate1.jpg';
    }

    private buildInitial(email: string): string {
        return email ? email.charAt(0).toUpperCase() : 'U';
    }
}

