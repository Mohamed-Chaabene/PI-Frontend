import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../api.service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-navbar',
    standalone: false,
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    isLoggedIn: boolean = false;
    userName: string = '';
    userRole: string = '';
    userDropdownOpen: boolean = false;

    isSticky: boolean = false;

    @HostListener('window:scroll')
    checkScroll() {
        this.isSticky = (window.scrollY || document.documentElement.scrollTop || 0) >= 50;
    }

    // Register
    registerRole = 'ROLE_CANDIDAT';

    registerData: any = {
        nom: '', email: '', motDePasse: '', cv: '', niveauEtude: '',
        competences: '', experience: null, entreprise: '', poste: '',
        secteur: '', budget: null, organisation: '', adresse: '',
        descriptionProjet: ''
    };

    // Login
    loginData = { email: '', motDePasse: '' };

    // Forgot Password
    forgotPasswordData = { phone: '' };

    // Modal
    isOpen = false;
    currentTab = 'tab1';
    currentInnerTab = 'candidat';

    constructor(
        public router: Router,
        private apiService: ApiService
    ) {}

    ngOnInit(): void {
        this.checkUserLoginStatus();
    }

    // Role Normalization
    private normalizeRole(role?: string): string {
        if (!role) return 'CANDIDAT';
        const raw = role.toString().trim().toUpperCase().replace(/^ROLE_/, '');

        if (raw.includes('CLIENT_FREELANCE') || raw.includes('FREELANCE')) return 'CLIENT_FREELANCE';
        if (raw.includes('CANDIDAT')) return 'CANDIDAT';
        if (raw.includes('RECRUTEUR')) return 'RECRUTEUR';
        if (raw.includes('ORGANISATEUR')) return 'ORGANISATEUR';
        if (raw.includes('ADMIN')) return 'ADMIN';

        return raw;
    }

    get normalizedRole(): string {
        return this.normalizeRole(this.userRole);
    }

    // Check if already logged in
    private checkUserLoginStatus(): void {
        const token = localStorage.getItem('token');
        const savedName = localStorage.getItem('userName');
        const savedRole = localStorage.getItem('userRole');

        if (token && savedName) {
            this.isLoggedIn = true;
            this.userName = savedName;
            this.userRole = savedRole || 'CANDIDAT';
        }
    }

    // Modal
    openPopup(): void {
        this.resetAuthForms();
        this.isOpen = true;
    }

    closePopup(): void {
        this.isOpen = false;
    }

    private resetAuthForms(): void {
        this.registerData = { nom: '', email: '', motDePasse: '', cv: '', niveauEtude: '', competences: '', experience: null, entreprise: '', poste: '', secteur: '', budget: null, organisation: '', adresse: '', descriptionProjet: '' };
        this.loginData = { email: '', motDePasse: '' };
        this.forgotPasswordData = { phone: '' };
        this.registerRole = 'ROLE_CANDIDAT';
        this.currentInnerTab = 'candidat';
        this.currentTab = 'tab1';
    }

    switchTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentTab = tab;
    }

    switchInnerTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentInnerTab = tab;
        const mapping: { [key: string]: string } = {
            candidat: 'ROLE_CANDIDAT',
            recruteur: 'ROLE_RECRUTEUR',
            clientFreelance: 'ROLE_CLIENT_FREELANCE',
            organisateur: 'ROLE_ORGANISATEUR',
            admin: 'ROLE_ADMIN'
        };
        this.registerRole = mapping[tab] || 'ROLE_CANDIDAT';
    }

    get registerRoleLabel(): string {
        const map: { [key: string]: string } = {
            ROLE_CANDIDAT: 'Candidat',
            ROLE_RECRUTEUR: 'Recruteur',
            ROLE_CLIENT_FREELANCE: 'Client Freelance',
            ROLE_ORGANISATEUR: 'Organisateur',
            ROLE_ADMIN: 'Admin'
        };
        return map[this.registerRole] || 'Candidat';
    }

    // Register
    register() {
        if (!this.registerData.nom || !this.registerData.email || !this.registerData.motDePasse) {
            alert('Veuillez remplir nom, email et mot de passe.');
            return;
        }

        const payload = {
            ...this.registerData,
            roleString: this.registerRole,
            role: this.registerRole.replace('ROLE_', '')
        };

        this.apiService.register(payload).subscribe({
            next: () => {
                alert('Inscription réussie !');
                this.closePopup();
                this.resetAuthForms();
                setTimeout(() => this.router.navigate(['/index-2']), 800);
            },
            error: (err) => alert(`Erreur d'inscription: ${err?.error?.message || err.message}`)
        });
    }

    // Login
    login() {
        if (!this.loginData.email || !this.loginData.motDePasse) {
            alert('Email et mot de passe sont requis.');
            return;
        }

        this.apiService.login(this.loginData).subscribe({
            next: (response: any) => {
                const token = response.token || response;
                localStorage.setItem('token', token);

                let decoded: any = {};
                try { decoded = jwtDecode(token); } catch (e) { console.warn('JWT decode failed'); }

                // Prefer response.role (explicit from backend LoginResponse),
                // then fallback to JWT claim
                const roleFromResponse = typeof response === 'object' ? response.role : null;
                const roleFromToken = decoded?.role || decoded?.roles;
                const finalRole = this.normalizeRole(roleFromResponse || roleFromToken);

                const userName = decoded?.name ||
                                decoded?.sub?.split('@')[0] ||
                                (typeof response === 'object' ? response.userName || response.user?.nom : '') ||
                                this.loginData.email.split('@')[0];

                localStorage.setItem('userName', userName);
                localStorage.setItem('userRole', finalRole);
                localStorage.setItem('userEmail', this.loginData.email);

                this.isLoggedIn = true;
                this.userName = userName;
                this.userRole = finalRole;

                this.closePopup();
                this.resetAuthForms();
                alert('Connexion réussie !');

                console.log('[AUTH] Login successful — role:', finalRole);
                this.redirectAfterLogin(finalRole);
            },
            error: (error) => {
                alert(`Erreur de connexion: ${error?.error?.message || error.message || 'Identifiants incorrects'}`);
            }
        });
    }

    // Role-based redirection after login
    private redirectAfterLogin(role: string): void {
        const normalized = this.normalizeRole(role);
        console.log('[AUTH] Redirecting role:', normalized);

        switch (normalized) {
            case 'ADMIN':           this.router.navigate(['/admin-dashboard']); break;
            case 'CANDIDAT':        this.router.navigate(['/candidates-dashboard']); break;
            case 'RECRUTEUR':       this.router.navigate(['/recruiter-dashboard']); break;
            case 'ORGANISATEUR':    this.router.navigate(['/evenement-dashboard']); break;
            case 'CLIENT_FREELANCE': this.router.navigate(['/freelance']); break;
            default:                this.router.navigate(['/']); break;
        }
    }

    // Logout
    logout(): void {
        localStorage.clear();
        this.isLoggedIn = false;
        this.userName = '';
        this.userRole = '';
        this.userDropdownOpen = false;
        this.router.navigate(['/']);
    }


    classApplied: boolean = false;

roles = [
  { key: 'ROLE_CANDIDAT', label: 'Candidat' },
  { key: 'ROLE_RECRUTEUR', label: 'Recruteur' },
  { key: 'ROLE_CLIENT_FREELANCE', label: 'Client Freelance' },
  { key: 'ROLE_ORGANISATEUR', label: 'Organisateur' }
];

deleteAccount() {
  alert('Delete account logic here');
}

resetPassword() {
  alert('Reset password logic here');
}

    toggleUserDropdown(): void { this.userDropdownOpen = !this.userDropdownOpen; }
    closeUserDropdown(): void { this.userDropdownOpen = false; }
    toggleClass() { }
}