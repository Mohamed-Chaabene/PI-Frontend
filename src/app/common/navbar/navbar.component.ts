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
        if (scrollPosition >= 50) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
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
        // Candidat fields
        cv: '',
        niveauEtude: '',
        competences: '',
        experience: null,
        // Recruteur fields
        entreprise: '',
        poste: '',
        secteur: '',
        // ClientFreelance fields
        budget: null,
        // Organisateur fields
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
        this.loginData = {
            email: '',
            motDePasse: ''
        };
        this.registerRole = 'ROLE_CANDIDAT';
        this.currentInnerTab = 'candidat';
    }

    constructor(
        public router: Router,
        private apiService: ApiService
    ) { }

    ngOnInit(): void {
        this.checkUserLoginStatus();
    }

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

    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

	// Tabs 1
    currentTab = 'tab1';
    switchTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentTab = tab;
    }

	// Tabs 2
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

    // Modal Popup
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

    // Register method
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

        // Force role non préfixé pour le backend (CANDIDAT, RECRUTEUR, ...)
        userData.role = userData.role?.toString().replace(/^ROLE_/, '');

        console.log('Tentative d’enregistrement', userData);
        this.apiService.register(userData).subscribe(
            response => {
                console.log('Registration successful', response);
                
                // Store user information
                localStorage.setItem('userName', userData.nom);
                localStorage.setItem('userRole', userData.role);
                
                // Update component state
                this.isLoggedIn = true;
                this.userName = userData.nom;
                this.userRole = userData.role;
                
                alert('Inscription réussie !');
                this.closePopup();
                this.resetAuthForms();
                
                // Redirect to home-demo-2 after a short delay
                setTimeout(() => {
                    this.router.navigate(['/index-2']);
                }, 500);
            },
            error => {
                console.error('Registration failed', error);
                const serverMessage = error?.error?.message || error?.message || error?.statusText || 'Erreur inconnue';
                alert(`Erreur lors de l\'inscription (${error.status || '?'}): ${serverMessage}`);
            }
        );
    }

    // Login method
    login() {
        if (!this.loginData.email || !this.loginData.motDePasse) {
            alert('Email et mot de passe sont requis pour la connexion.');
            return;
        }

        console.log('Tentative de connexion', this.loginData);
        this.apiService.login(this.loginData).subscribe(
            response => {
                console.log('Login successful', response);
                // Extraire le token (peut être une string directe ou un objet {token: "..."})
                const token = typeof response === 'string' ? response : response.token;
                // Stocker le token JWT
                localStorage.setItem('token', token);

                // Essayer de récupérer l'ID du recruteur depuis différents endroits
                let recruteurId: number | undefined;

                // 1. Depuis la réponse directe
                if (typeof response === 'object') {
                    recruteurId = response.userId || response.id || response.recruteurId;
                }

                // 2. Depuis le token décodé si pas trouvé dans la réponse
                if (!recruteurId) {
                    try {
                        const decoded: any = jwtDecode(token);
                        recruteurId = decoded?.id || decoded?.sub || decoded?.userId || decoded?.recruteurId;
                        console.log('🔍 ID trouvé dans token décodé:', recruteurId);
                    } catch (decodeError) {
                        console.error('Erreur décodage token:', decodeError);
                    }
                }

                // 3. Stocker l'ID si valide
                if (recruteurId && !isNaN(Number(recruteurId)) && Number(recruteurId) > 0) {
                    localStorage.setItem('recruteurId', String(recruteurId));
                    console.log('✅ ID Recruteur stocké:', recruteurId);
                } else {
                    console.warn('⚠️ Aucun ID Recruteur valide trouvé dans la réponse ou le token');
                }
                // Décoder le token pour obtenir le rôle
                const decoded: any = jwtDecode(token);
                const roleFromResponse = typeof response === 'object' ? (response.role || response.roles || response.user?.role || response.user?.roles) : undefined;
                const role = this.getRoleFromDecodedToken(decoded, roleFromResponse);
                const roleFinal = role || this.inferRoleFromEmail(this.loginData.email) || 'CANDIDAT';
                
                // Extract and store user name from token or response
                let userName = '';
                if (typeof response === 'object' && response.userName) {
                    userName = response.userName;
                } else if (typeof response === 'object' && response.user && response.user.nom) {
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
                
                console.log('Token decoded:', decoded);
                console.log('Role from response:', roleFromResponse);
                console.log('Extracted role:', role || '<aucun rôle trouvé>');
                console.log('Final role used for redirect:', roleFinal);
                console.log('User name stored:', userName);
                // Fermer le modal et réinitialiser AVANT la redirection
                this.closePopup();
                this.resetAuthForms();
                // Afficher l'alerte et PUIS rediriger
                alert('Connexion réussie !');
                // Rediriger vers le dashboard (cela ne sera pas bloqué par l'alerte)
                setTimeout(() => {
                    this.redirectAfterLogin(roleFinal);
                }, 100);
            },
            error => {
                console.error('Login failed', error);
                const serverMessage = error?.error?.message || error?.message || error?.statusText || 'Erreur inconnue';
                alert(`Erreur lors de la connexion (${error.status || '?'}): ${serverMessage}`);
            }
        );
    }

    private redirectAfterLogin(role: string) {
        console.log('=== REDIRECTION DEBUG ===');
        console.log('Raw role received:', role);
        console.log('Role type:', typeof role);

        let normalizedRole = role?.toString().trim().toUpperCase().replace(/^ROLE_/, '');

        if (!normalizedRole) {
            const roleLower = role?.toString().trim().toLowerCase();
            if (roleLower?.includes('recruteur')) {
                normalizedRole = 'RECRUTEUR';
            } else if (roleLower?.includes('candidat')) {
                normalizedRole = 'CANDIDAT';
            } else if (roleLower?.includes('admin')) {
                normalizedRole = 'ADMIN';
            } else if (roleLower?.includes('freelance')) {
                normalizedRole = 'CLIENT_FREELANCE';
            } else if (roleLower?.includes('organisateur')) {
                normalizedRole = 'ORGANISATEUR';
            }
        }

        console.log('Normalized role:', normalizedRole);

        if (normalizedRole === 'CANDIDAT') {
            console.log('Redirecting CANDIDAT to candidate-details');
            this.router.navigate(['/candidate-details']);
            return;
        }

        if (normalizedRole === 'RECRUTEUR' || normalizedRole === 'CLIENT_FREELANCE' ) {
            console.log('Redirecting to recruiter-dashboard');
            this.router.navigate(['/recruiter-dashboard']);
            return;
        }

        if (normalizedRole === 'ADMIN') {
            console.log('Redirecting to home (ADMIN)');
            this.router.navigate(['/']);
            return;
        }

        if (normalizedRole === 'ORGANISATEUR') {
    console.log('Redirecting to evenement-dashboard');
    this.router.navigate(['/evenement-dashboard']); // ✅
    return;
}

        console.log('No matching role case. Default redirect to home. Role was:', normalizedRole);
        this.router.navigate(['/']);
    }

    private getRoleFromDecodedToken(decoded: any, roleFromResponse?: any): string {
        if (roleFromResponse) {
            const role = this.extractRoleValue(roleFromResponse);
            if (role) {
                return role;
            }
        }

        if (!decoded || typeof decoded !== 'object') {
            return '';
        }

        const roleSources: Array<any> = [
            decoded.role,
            decoded.roles,
            decoded.authorities,
            decoded.roleName,
            decoded.roleType,
            decoded.user?.role,
            decoded.user?.roles,
            decoded.user?.authorities,
            decoded.scope,
            decoded.scopes,
            decoded.realm_access?.roles,
            decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            decoded['roles'],
        ];

        // Glas theo: rechercher tout champ contenant 'role' ou 'authority'
        for (const key in decoded) {
            if (decoded.hasOwnProperty(key)) {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('role') || lowerKey.includes('authority')) {
                    const role = this.extractRoleValue(decoded[key]);
                    if (role) {
                        return role;
                    }
                }
            }
        }

        for (const source of roleSources) {
            const role = this.extractRoleValue(source);
            if (role) {
                return role;
            }
        }

        return '';
    }

    private inferRoleFromEmail(email?: string): string {
        if (!email) {
            return '';
        }

        const normalizedEmail = email.toLowerCase();
        if (normalizedEmail.includes('recruteur')) {
            return 'RECRUTEUR';
        }
        if (normalizedEmail.includes('candidat') || normalizedEmail.includes('candidate')) {
            return 'CANDIDAT';
        }
        if (normalizedEmail.includes('freelance')) {
            return 'CLIENT_FREELANCE';
        }
        if (normalizedEmail.includes('organisateur')) {
            return 'ORGANISATEUR';
        }
        if (normalizedEmail.includes('admin')) {
            return 'ADMIN';
        }

        return '';
    }

    private extractRoleValue(source: any): string {
        if (!source) {
            return '';
        }

        if (typeof source === 'string') {
            const normalized = source.trim();
            if (normalized.length > 0) {
                return normalized;
            }
            return '';
        }

        if (Array.isArray(source)) {
            for (const item of source) {
                const role = this.extractRoleValue(item);
                if (role) {
                    return role;
                }
            }
            return '';
        }

        if (typeof source === 'object') {
            const possibleFields = ['role', 'authority', 'name', 'type', 'value'];
            for (const field of possibleFields) {
                if (source[field]) {
                    const role = this.extractRoleValue(source[field]);
                    if (role) {
                        return role;
                    }
                }
            }
            return '';
        }

        return '';
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('recruteurId');
        this.isLoggedIn = false;
        this.userName = '';
        this.userRole = '';
        this.userDropdownOpen = false;
        this.router.navigate(['/']);
    }

    deleteAccount(): void {
        const confirmDelete = confirm('⚠️ ATTENTION: Êtes-vous sûr de vouloir supprimer votre compte?\n\nCette action est IRRÉVERSIBLE et supprimera:\n✗ Votre compte utilisateur\n✗ Vos informations candidat\n✗ Votre localisation\n✗ Toutes vos données\n\nCliquez sur "OK" pour confirmer la suppression.');
        
        if (!confirmDelete) {
            return; // User cancelled
        }

        const userName = localStorage.getItem('userName');
        if (!userName) {
            alert('Erreur: Impossible de récupérer les informations du compte.');
            return;
        }

        // First get the candidate by email to get the ID and localisation_id
        this.apiService.getCandidateByEmail(userName).subscribe({
            next: (candidateData: any) => {
                if (!candidateData || !candidateData.id) {
                    alert('Erreur: Impossible de trouver le compte utilisateur.');
                    return;
                }

                const candidateId = candidateData.id;
                const localisationId = candidateData.localisation_id;

                // Step 1: Delete the candidate first (this unlinks localisation)
                this.apiService.deleteCandidate(candidateId).subscribe({
                    next: () => {
                        console.log('Candidate deleted, now deleting localisation if exists...');
                        
                        // Step 2: Delete localisation if it exists
                        if (localisationId) {
                            this.apiService.deleteLocalisation(localisationId).subscribe({
                                next: () => {
                                    console.log('Localisation deleted');
                                    // Step 3: Delete user account and logout
                                    this.deleteUserAndLogout(candidateId);
                                },
                                error: (error) => {
                                    console.error('Error deleting localisation:', error);
                                    // Continue to delete user anyway
                                    this.deleteUserAndLogout(candidateId);
                                }
                            });
                        } else {
                            // No localisation to delete, go straight to user deletion
                            this.deleteUserAndLogout(candidateId);
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting candidate:', error);
                        alert('Erreur lors de la suppression du compte. Veuillez réessayer.')
                    }
                });
            },
            error: (error) => {
                console.error('Error fetching candidate:', error);
                alert('Erreur lors de la suppression du compte. Veuillez réessayer.')
            }
        });
    }

    private deleteUserAndLogout(candidateId: number): void {
        this.apiService.deleteUser(candidateId).subscribe({
            next: () => {
                alert('✓ Votre compte a été supprimé avec succès.\n\nRedirection vers la page d\'accueil...');
                this.logout();
            },
            error: (error) => {
                console.error('Error deleting user:', error);
                alert('✓ Votre profil a été supprimé. Déconnexion...');
                this.logout();
            }
        });
    }

    toggleUserDropdown(): void {
        this.userDropdownOpen = !this.userDropdownOpen;
    }

    closeUserDropdown(): void {
        this.userDropdownOpen = false;
    }

    

}

