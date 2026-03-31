import { NgClass } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-navbar',
    standalone: false,
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    // User authentication state
    isLoggedIn: boolean = false;
    userName: string = '';
    userRole: string = '';
    userDropdownOpen: boolean = false;

    // Navbar Sticky
    isSticky: boolean = false;
    @HostListener('window:scroll')
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.isSticky = scrollPosition >= 50;
    }

    // Register data
    roles = [
        { key: 'ROLE_CANDIDAT', label: 'Candidat' },
        { key: 'ROLE_RECRUTEUR', label: 'Recruteur' },
        { key: 'ROLE_CLIENT_FREELANCE', label: 'Client Freelance' },
        { key: 'ROLE_ORGANISATEUR', label: 'Organisateur' },
        { key: 'ROLE_ADMIN', label: 'Admin' }
    ];

    registerRole = 'ROLE_CANDIDAT';

    registerData: any = {
        nom: '',
        email: '',
        motDePasse: '',
        cv: '',
        niveauEtude: '',
        competences: '',
        experience: null,
        entreprise: '',
        poste: '',
        secteur: '',
        budget: null,
        organisation: '',
        adresse: '',
        descriptionProjet: ''
    };

    loginData = {
        email: '',
        motDePasse: ''
    };

    private resetAuthForms() {
        this.registerData = {
            nom: '',
            email: '',
            motDePasse: '',
            cv: '',
            niveauEtude: '',
            competences: '',
            experience: null,
            entreprise: '',
            poste: '',
            secteur: '',
            budget: null,
            organisation: '',
            adresse: '',
            descriptionProjet: ''
        };
        this.loginData = { email: '', motDePasse: '' };
        this.registerRole = 'ROLE_CANDIDAT';
        this.currentInnerTab = 'candidat';
    }

    constructor(
        public router: Router,
        private apiService: ApiService
    ) {}

    ngOnInit(): void {
        this.checkUserLoginStatus();
    }

    // ─── Rôle normalisé ────────────────────────────────────────────────────────
    get normalizedRole(): string {
        return (this.userRole || '').toString().trim().toUpperCase().replace(/^ROLE_/, '');
    }

    get isCandidat(): boolean {
        return this.normalizedRole === 'CANDIDAT';
    }

    get isAdmin(): boolean {
        return this.normalizedRole === 'ADMIN';
    }

    // ─── Auth status ───────────────────────────────────────────────────────────
    private checkUserLoginStatus(): void {
        const token = localStorage.getItem('token');
        const savedUserName = localStorage.getItem('userName');
        const savedUserRole = localStorage.getItem('userRole');
        if (token && savedUserName) {
            this.isLoggedIn = true;
            this.userName = savedUserName;
            this.userRole = savedUserRole || 'CANDIDAT';
        }
    }

    // ─── Navbar toggle ─────────────────────────────────────────────────────────
    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

    // ─── Tabs ──────────────────────────────────────────────────────────────────
    currentTab = 'tab1';
    switchTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentTab = tab;
    }

    currentInnerTab = 'candidat';
    switchInnerTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentInnerTab = tab;
        const roleMapping: any = {
            candidat: 'ROLE_CANDIDAT',
            recruteur: 'ROLE_RECRUTEUR',
            clientFreelance: 'ROLE_CLIENT_FREELANCE',
            organisateur: 'ROLE_ORGANISATEUR',
            admin: 'ROLE_ADMIN'
        };
        this.registerRole = roleMapping[tab] || 'ROLE_CANDIDAT';
    }

    // ─── Modal ─────────────────────────────────────────────────────────────────
    isOpen = false;
    openPopup(): void {
        this.resetAuthForms();
        this.isOpen = true;
    }
    closePopup(): void {
        this.isOpen = false;
    }

    get registerRoleLabel() {
        const map: any = {
            ROLE_CANDIDAT: 'Candidat',
            ROLE_RECRUTEUR: 'Recruteur',
            ROLE_CLIENT_FREELANCE: 'Client Freelance',
            ROLE_ORGANISATEUR: 'Organisateur',
            ROLE_ADMIN: 'Admin'
        };
        return map[this.registerRole] || 'Candidat';
    }

    // ─── Register ──────────────────────────────────────────────────────────────
    register() {
        const roleValue = this.registerRole.replace('ROLE_', '');
        const userData = {
            ...this.registerData,
            role: roleValue,
            roleString: this.registerRole
        };

        if (!userData.nom || !userData.email || !userData.motDePasse) {
            alert('Veuillez remplir les champs nom, e-mail et mot de passe.');
            return;
        }

        userData.role = userData.role?.toString().replace(/^ROLE_/, '');

        this.apiService.register(userData).subscribe(
            response => {
                localStorage.setItem('userName', userData.nom);
                localStorage.setItem('userRole', userData.role);
                this.isLoggedIn = true;
                this.userName = userData.nom;
                this.userRole = userData.role;
                alert('Inscription réussie !');
                this.closePopup();
                this.resetAuthForms();
                setTimeout(() => { this.router.navigate(['/index-2']); }, 500);
            },
            error => {
                const serverMessage = error?.error?.message || error?.message || error?.statusText || 'Erreur inconnue';
                alert(`Erreur lors de l'inscription (${error.status || '?'}): ${serverMessage}`);
            }
        );
    }

    // ─── Login ─────────────────────────────────────────────────────────────────
    login() {
        if (!this.loginData.email || !this.loginData.motDePasse) {
            alert('Email et mot de passe sont requis pour la connexion.');
            return;
        }

        this.apiService.login(this.loginData).subscribe(
            response => {
                const token = typeof response === 'string' ? response : response.token;
                localStorage.setItem('token', token);

                let recruteurId: number | undefined;
                if (typeof response === 'object') {
                    recruteurId = response.userId || response.id || response.recruteurId;
                }
                if (!recruteurId) {
                    try {
                        const decoded: any = jwtDecode(token);
                        recruteurId = decoded?.id || decoded?.sub || decoded?.userId || decoded?.recruteurId;
                    } catch {}
                }
                if (recruteurId && !isNaN(Number(recruteurId)) && Number(recruteurId) > 0) {
                    localStorage.setItem('recruteurId', String(recruteurId));
                }

                const decoded: any = jwtDecode(token);
                const roleFromResponse = typeof response === 'object'
                    ? (response.role || response.roles || response.user?.role || response.user?.roles)
                    : undefined;
                const role = this.getRoleFromDecodedToken(decoded, roleFromResponse);
                const roleFinal = role || this.inferRoleFromEmail(this.loginData.email) || 'CANDIDAT';

                let userName = '';
                if (typeof response === 'object' && response.userName) {
                    userName = response.userName;
                } else if (typeof response === 'object' && response.user?.nom) {
                    userName = response.user.nom;
                } else if (decoded.name) {
                    userName = decoded.name;
                } else if (decoded.sub) {
                    userName = decoded.sub;
                } else {
                    userName = this.loginData.email;
                }

                localStorage.setItem('userName', userName);
                localStorage.setItem('userRole', roleFinal);
                this.isLoggedIn = true;
                this.userName = userName;
                this.userRole = roleFinal;

                this.closePopup();
                this.resetAuthForms();
                alert('Connexion réussie !');
                setTimeout(() => { this.redirectAfterLogin(roleFinal); }, 100);
            },
            error => {
                const serverMessage = error?.error?.message || error?.message || error?.statusText || 'Erreur inconnue';
                alert(`Erreur lors de la connexion (${error.status || '?'}): ${serverMessage}`);
            }
        );
    }

    // ─── Redirection post-login ────────────────────────────────────────────────
    private redirectAfterLogin(role: string) {
        const normalizedRole = role?.toString().trim().toUpperCase().replace(/^ROLE_/, '');

        if (normalizedRole === 'CANDIDAT') {
            this.router.navigate(['/candidate-details']);
            return;
        }
        if (['RECRUTEUR', 'CLIENT_FREELANCE', 'ORGANISATEUR'].includes(normalizedRole)) {
            this.router.navigate(['/recruiter-dashboard']);
            return;
        }
        if (normalizedRole === 'ADMIN') {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/']);
    }

    // ─── Helpers rôle ──────────────────────────────────────────────────────────
    private getRoleFromDecodedToken(decoded: any, roleFromResponse?: any): string {
        if (roleFromResponse) {
            const role = this.extractRoleValue(roleFromResponse);
            if (role) return role;
        }
        if (!decoded || typeof decoded !== 'object') return '';

        for (const key in decoded) {
            if (decoded.hasOwnProperty(key)) {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('role') || lowerKey.includes('authority')) {
                    const role = this.extractRoleValue(decoded[key]);
                    if (role) return role;
                }
            }
        }
        return '';
    }

    private inferRoleFromEmail(email?: string): string {
        if (!email) return '';
        const e = email.toLowerCase();
        if (e.includes('recruteur')) return 'RECRUTEUR';
        if (e.includes('candidat') || e.includes('candidate')) return 'CANDIDAT';
        if (e.includes('freelance')) return 'CLIENT_FREELANCE';
        if (e.includes('organisateur')) return 'ORGANISATEUR';
        if (e.includes('admin')) return 'ADMIN';
        return '';
    }

    private extractRoleValue(source: any): string {
        if (!source) return '';
        if (typeof source === 'string' && source.trim().length > 0) return source.trim();
        if (Array.isArray(source)) {
            for (const item of source) {
                const role = this.extractRoleValue(item);
                if (role) return role;
            }
            return '';
        }
        if (typeof source === 'object') {
            for (const field of ['role', 'authority', 'name', 'type', 'value']) {
                if (source[field]) {
                    const role = this.extractRoleValue(source[field]);
                    if (role) return role;
                }
            }
        }
        return '';
    }

    // ─── Logout / Delete ───────────────────────────────────────────────────────
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('recruteurId');
        localStorage.removeItem('candidatId');
        this.isLoggedIn = false;
        this.userName = '';
        this.userRole = '';
        this.userDropdownOpen = false;
        this.router.navigate(['/']);
    }

    deleteAccount(): void {
        const confirmDelete = confirm('⚠️ Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.');
        if (!confirmDelete) return;

        const userName = localStorage.getItem('userName');
        if (!userName) { alert('Erreur: Impossible de récupérer les informations du compte.'); return; }

        this.apiService.getCandidateByEmail(userName).subscribe({
            next: (candidateData: any) => {
                if (!candidateData?.id) { alert('Erreur: Impossible de trouver le compte utilisateur.'); return; }
                const candidateId = candidateData.id;
                const localisationId = candidateData.localisation_id;

                this.apiService.deleteCandidate(candidateId).subscribe({
                    next: () => {
                        if (localisationId) {
                            this.apiService.deleteLocalisation(localisationId).subscribe({
                                next: () => this.deleteUserAndLogout(candidateId),
                                error: () => this.deleteUserAndLogout(candidateId)
                            });
                        } else {
                            this.deleteUserAndLogout(candidateId);
                        }
                    },
                    error: () => alert('Erreur lors de la suppression du compte.')
                });
            },
            error: () => alert('Erreur lors de la suppression du compte.')
        });
    }

    private deleteUserAndLogout(candidateId: number): void {
        this.apiService.deleteUser(candidateId).subscribe({
            next: () => { alert('Votre compte a été supprimé avec succès.'); this.logout(); },
            error: () => { alert('Votre profil a été supprimé. Déconnexion...'); this.logout(); }
        });
    }

    toggleUserDropdown(): void { this.userDropdownOpen = !this.userDropdownOpen; }
    closeUserDropdown(): void { this.userDropdownOpen = false; }
}