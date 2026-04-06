import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-cd-applied-jobs',
    standalone: false,
    templateUrl: './cd-applied-jobs.component.html',
    styleUrls: ['./cd-applied-jobs.component.scss']
})
export class CdAppliedJobsComponent implements OnInit {

    candidatures: any[] = [];
    isLoading = true;
    errorMessage = '';
    
    showCreateModal = false;
    showEditModal = false;
    showViewModal = false;
    isCreating = false;
    isUpdating = false;
    
    editSelectedCVName: string = '';
    editSelectedLMName: string = '';
    editSkillInput: string = '';
    
    tauxReussite: number = 0;
    tempsReponse: number = 0;
    scoreEmployabilite: number = 0;
    
    candidaturesCeMois: number = 0;
    entretiensObtenus: number = 0;
    vuesRecruteurs: number = 0;
    
    newCandidature = {
        nomComplet: '',
        email: '',
        telephone: '',
        formations: [] as { diplome: string; institution: string; annee: string }[],
        newFormation: { diplome: '', institution: '', annee: '' },
        experiences: [] as { poste: string; entreprise: string; periode: string; description: string }[],
        newExperience: { poste: '', entreprise: '', periode: '', description: '' },
        competences: [] as string[],
        skillInput: '',
        cv: null as File | null,
        cvName: '',
        lettreMotivation: '',
        dateDisponibilite: '',
        preavis: '',
        acceptContact: false,
        acceptRGPD: false
    };
    
    editingCandidature: any = null;
    viewingCandidature: any = null;
    
    createErrors: any = {
        nomComplet: '',
        email: '',
        telephone: '',
        competences: '',
        cv: '',
        acceptRGPD: ''
    };
    
    touchedFields: any = {
        nomComplet: false,
        email: false,
        telephone: false,
        competences: false,
        cv: false,
        acceptRGPD: false
    };
    
    editErrors = {
        entreprise: '',
        poste: ''
    };
    
    stats = {
        total: 0,
        enAttente: 0,
        acceptees: 0,
        refusees: 0
    };
    
    alertes: any[] = [];
    isNewCandidate: boolean = false;
    
    message: string = '';
    messageType: string = '';
    
    showCVModal: boolean = false;
    showLettreModal: boolean = false;
    showAnalyseModal: boolean = false;
    
    cvUrl: string = '';
    cvName: string = '';
    cvDate: string = '';
    
    lettreData = {
        entreprise: '',
        poste: '',
        message: ''
    };
    lettreGeneree: string = '';
    
    scoreProfil: number = 0;
    profil = {
        competences: false,
        experience: false,
        cv: false
    };
    
    showViewer: boolean = false;
    conseils: string[] = [];
    
    newsletterEmail: string = '';
    isSubscribing: boolean = false;
    nombreCandidatsActifs: number = 12453;
    offresNouvelles: number = 347;
    
    searchEntreprise: string = '';

    // ==================== SMART MATCH ====================
offresDisponibles: any[] = [];
matchScores: any[] = [];
showSmartMatchModal: boolean = false;

// ==================== RADAR COMPÉTENCES ====================
showRadarModal: boolean = false;
competencesUtilisateur: string[] = [];
competencesDemandees: string[] = [];
radarData: any[] = [];

// ==================== STATISTIQUES ====================
showStatsModal: boolean = false;
candidaturesParMois: any[] = [];
tauxReussiteCalcule: number = 0;
tempsMoyenReponse: number = 0;

// ==================== PRÉDICTION ====================
showPredictionModal: boolean = false;
predictionData: any = null;

// ==================== COMPARATEUR ====================
showComparateurModal: boolean = false;
offresSelectionnees: any[] = [];

// ==================== RELANCES ====================
showRelancesModal: boolean = false;
relancesData: any[] = [];

// ==================== ASSISTANT IA ====================
showAssistantModal: boolean = false;
assistantMessages: any[] = [];
assistantInput: string = '';
isAssistantTyping: boolean = false;

// ==================== CAREER TIMELINE ====================
showTimelineModal: boolean = false;
// ==================== GAMIFICATION ====================
badges: any[] = [];
pointsTotal: number = 0;
niveau: string = '';
niveauProgress: number = 0;
niveauSuivant: string = '';
pointsPourNiveauSuivant: number = 0;

showGamificationModal: boolean = false;

    constructor(private apiService: ApiService, private router: Router) {}

    ngOnInit(): void {
        this.loadData();
    }

    
    validateEmail(email: string): boolean {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    validateTelephone(telephone: string): boolean {
    const telRegex = /^(\+215)?[\s]?[0-9]{8}$|^[0-9]{8}$/;
        return telRegex.test(telephone);
    }

    validateField(field: string, value: any): void {
        switch(field) {
            case 'nomComplet':
                if (!value || value.trim() === '') {
                    this.createErrors.nomComplet = 'Le nom complet est obligatoire';
                } else if (value.length < 2) {
                    this.createErrors.nomComplet = 'Le nom doit contenir au moins 2 caractères';
                } else if (value.length > 100) {
                    this.createErrors.nomComplet = 'Le nom ne peut pas dépasser 100 caractères';
                } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
                    this.createErrors.nomComplet = 'Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes';
                } else {
                    this.createErrors.nomComplet = '';
                }
                break;
                
            case 'email':
                if (value && !this.validateEmail(value)) {
                    this.createErrors.email = 'Veuillez entrer une adresse email valide (ex: nom@domaine.com)';
                } else {
                    this.createErrors.email = '';
                }
                break;
                
            case 'telephone':
    if (value && !this.validateTelephone(value)) {
        this.createErrors.telephone = 'Format invalide. Exemples: +215 55 555 555, +21555555555, 55555555';
    } else {
        this.createErrors.telephone = '';
    }
    break;
                
            case 'competences':
                if (this.newCandidature.competences.length === 0) {
                    this.createErrors.competences = 'Ajoutez au moins une compétence';
                } else {
                    this.createErrors.competences = '';
                }
                break;
                
            case 'cv':
                if (!this.newCandidature.cv && !this.cvUrl) {
                    this.createErrors.cv = 'Le CV est obligatoire';
                } else {
                    this.createErrors.cv = '';
                }
                break;
                
            case 'acceptRGPD':
                if (!value) {
                    this.createErrors.acceptRGPD = 'Vous devez accepter les conditions RGPD';
                } else {
                    this.createErrors.acceptRGPD = '';
                }
                break;
        }
    }

  validateAllFields(): boolean {
    let isValid = true;
    let errorMessages: string[] = [];
    
    // Validation du nom complet
    if (!this.newCandidature.nomComplet || this.newCandidature.nomComplet.trim() === '') {
        this.createErrors.nomComplet = 'Le nom complet est obligatoire';
        this.touchedFields.nomComplet = true;
        isValid = false;
        errorMessages.push('• Nom complet est obligatoire');
    } else if (this.newCandidature.nomComplet.length < 2) {
        this.createErrors.nomComplet = 'Le nom doit contenir au moins 2 caractères';
        this.touchedFields.nomComplet = true;
        isValid = false;
        errorMessages.push('• Le nom doit contenir au moins 2 caractères');
    } else if (this.newCandidature.nomComplet.length > 100) {
        this.createErrors.nomComplet = 'Le nom ne peut pas dépasser 100 caractères';
        this.touchedFields.nomComplet = true;
        isValid = false;
        errorMessages.push('• Le nom ne peut pas dépasser 100 caractères');
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(this.newCandidature.nomComplet)) {
        this.createErrors.nomComplet = 'Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes';
        this.touchedFields.nomComplet = true;
        isValid = false;
        errorMessages.push('• Le nom ne doit contenir que des lettres');
    } else {
        this.createErrors.nomComplet = '';
    }
    
    // Validation de l'email (obligatoire)
    if (!this.newCandidature.email || this.newCandidature.email.trim() === '') {
        this.createErrors.email = 'L\'email est obligatoire';
        this.touchedFields.email = true;
        isValid = false;
        errorMessages.push('• L\'email est obligatoire');
    } else if (!this.validateEmail(this.newCandidature.email)) {
        this.createErrors.email = 'Format d\'email invalide. Exemple: nom@domaine.com';
        this.touchedFields.email = true;
        isValid = false;
        errorMessages.push('• Format d\'email invalide. Exemple: nom@domaine.com');
    } else {
        this.createErrors.email = '';
    }
    
    // Validation du téléphone (optionnel mais format doit être valide)
    if (this.newCandidature.telephone && this.newCandidature.telephone.trim() !== '') {
        if (!this.validateTelephone(this.newCandidature.telephone)) {
            this.createErrors.telephone = 'Format de téléphone invalide. Exemples: +215 55 555 555, 55555555';
            this.touchedFields.telephone = true;
            isValid = false;
            errorMessages.push('• Format de téléphone invalide. Exemple: +215 55 555 555');
        } else {
            this.createErrors.telephone = '';
        }
    } else {
        this.createErrors.telephone = '';
    }
    
    // Validation des compétences
    if (this.newCandidature.competences.length === 0) {
        this.createErrors.competences = 'Ajoutez au moins une compétence';
        this.touchedFields.competences = true;
        isValid = false;
        errorMessages.push('• Ajoutez au moins une compétence');
    } else {
        this.createErrors.competences = '';
    }
    
    // Validation du CV
    if (!this.newCandidature.cv && !this.cvUrl) {
        this.createErrors.cv = 'Le CV est obligatoire';
        this.touchedFields.cv = true;
        isValid = false;
        errorMessages.push('• Le CV est obligatoire');
    } else {
        this.createErrors.cv = '';
    }
    
    // Validation du RGPD
    if (!this.newCandidature.acceptRGPD) {
        this.createErrors.acceptRGPD = 'Vous devez accepter les conditions RGPD';
        this.touchedFields.acceptRGPD = true;
        isValid = false;
        errorMessages.push('• Vous devez accepter les conditions RGPD');
    } else {
        this.createErrors.acceptRGPD = '';
    }
    
    // Validation de la date de disponibilité 
    if (this.newCandidature.dateDisponibilite) {
        const selectedDate = new Date(this.newCandidature.dateDisponibilite);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.createErrors.dateDisponibilite = 'La date de disponibilité doit être dans le futur';
            errorMessages.push('• La date de disponibilité doit être dans le futur');
            isValid = false;
        }
    }
    
    if (!isValid) {
        this.showProfessionalAlert(errorMessages);
    }
    
    return isValid;
}

showProfessionalAlert(errors: string[]): void {
    // Créer un modal d'alerte personnalisé
    const modalHtml = `
        <div class="custom-alert-overlay" id="customAlertOverlay">
            <div class="custom-alert-modal">
                <div class="alert-header">
                    <div class="alert-icon">
                        <i class="ri-error-warning-line"></i>
                    </div>
                    <h3>Formulaire incomplet</h3>
                </div>
                <div class="alert-body">
                    <p>Veuillez corriger les erreurs suivantes :</p>
                    <ul class="error-list">
                        ${errors.map(error => `<li><i class="ri-close-circle-line"></i> ${error}</li>`).join('')}
                    </ul>
                </div>
                <div class="alert-footer">
                    <button class="btn-primary" onclick="document.getElementById('customAlertOverlay').remove()">
                        <i class="ri-check-line"></i> Compris
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Supprimer l'ancienne alerte si elle existe
    const existingAlert = document.getElementById('customAlertOverlay');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Ajouter la nouvelle alerte
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Ajouter les styles si pas déjà présents
    this.addAlertStyles();
    
    // Fermer au clic sur l'overlay
    setTimeout(() => {
        const overlay = document.getElementById('customAlertOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        }
    }, 100);
}

// Ajouter les styles CSS pour l'alerte
addAlertStyles(): void {
    if (document.getElementById('customAlertStyles')) return;
    
    const styles = `
        <style id="customAlertStyles">
            .custom-alert-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .custom-alert-modal {
                background: white;
                border-radius: 24px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                animation: slideUp 0.3s ease;
                overflow: hidden;
            }
            
            .alert-header {
                background: linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%);
                padding: 24px;
                text-align: center;
                color: white;
            }
            
            .alert-icon {
                width: 64px;
                height: 64px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
            }
            
            .alert-icon i {
                font-size: 32px;
            }
            
            .alert-header h3 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            
            .alert-body {
                padding: 24px;
            }
            
            .alert-body p {
                color: #374151;
                margin-bottom: 16px;
                font-weight: 500;
            }
            
            .error-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .error-list li {
                padding: 10px 12px;
                margin-bottom: 8px;
                background: #FEF2F2;
                border-left: 3px solid #EF4444;
                border-radius: 8px;
                color: #DC2626;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            }
            
            .error-list li i {
                font-size: 18px;
            }
            
            .alert-footer {
                padding: 16px 24px 24px;
                border-top: 1px solid #E5E7EB;
            }
            
            .btn-primary {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

    markFieldTouched(field: string): void {
        this.touchedFields[field] = true;
    }

    showError(field: string): boolean {
        return this.touchedFields[field] && !!this.createErrors[field];
    }

    // ==================== GESTION FORMATION ====================
    addFormation(): void {
        if (this.newCandidature.newFormation.diplome && this.newCandidature.newFormation.institution) {
            this.newCandidature.formations.push({ ...this.newCandidature.newFormation });
            this.newCandidature.newFormation = { diplome: '', institution: '', annee: '' };
        }
    }

    removeFormation(index: number): void {
        this.newCandidature.formations.splice(index, 1);
    }

    // ==================== GESTION EXPÉRIENCE ====================
    addExperience(): void {
        if (this.newCandidature.newExperience.poste && this.newCandidature.newExperience.entreprise) {
            this.newCandidature.experiences.push({ ...this.newCandidature.newExperience });
            this.newCandidature.newExperience = { poste: '', entreprise: '', periode: '', description: '' };
        }
    }

    removeExperience(index: number): void {
        this.newCandidature.experiences.splice(index, 1);
    }

    // ==================== GESTION COMPÉTENCES ====================
    addSkill(): void {
        if (this.newCandidature.skillInput && this.newCandidature.skillInput.trim()) {
            const skill = this.newCandidature.skillInput.trim();
            if (!this.newCandidature.competences.includes(skill)) {
                this.newCandidature.competences.push(skill);
                this.newCandidature.skillInput = '';
                this.validateField('competences', null);
            } else {
                alert('Cette compétence est déjà ajoutée');
            }
        }
    }
    
    removeSkill(index: number): void {
        this.newCandidature.competences.splice(index, 1);
        this.validateField('competences', null);
    }
    
    // ==================== GESTION CV ====================
    onCVFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.newCandidature.cv = file;
            this.newCandidature.cvName = file.name;
            this.validateField('cv', null);
        }
    }
    
    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.editSelectedCVName = file.name;
        }
    }
    
    onLMFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.editSelectedLMName = file.name;
        }
    }
    
    onEditFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.editSelectedCVName = file.name;
        }
    }
    
    onEditLMFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.editSelectedLMName = file.name;
        }
    }

    // ==================== CHARGEMENT DES DONNÉES ====================
    
    loadData(): void {
        this.isLoading = true;
        
        this.apiService.getMesCandidatures().subscribe({
            next: (data) => {
                console.log('📊 Données reçues:', data);
                this.candidatures = Array.isArray(data) ? data : (data ? [data] : []);
                this.isLoading = false;
                this.calculateStats();
                this.calculerGamification();
                this.calculerStatistiquesAvancees();
                this.calculerStatsPersonnelles();
                this.chargerAlertes();
            },
            error: (err) => {
                console.error('Erreur chargement:', err);
                this.errorMessage = 'Erreur de chargement';
                this.isLoading = false;
            }
        });

        this.apiService.getStatsCandidatures().subscribe({
            next: (data) => {
                if (data) this.stats = data;
            },
            error: () => {}
        });
    }

    calculateStats(): void {
        this.stats.total = this.candidatures.length;
        this.stats.enAttente = this.candidatures.filter(c => c.statut === 'EN_ATTENTE').length;
        this.stats.acceptees = this.candidatures.filter(c => c.statut === 'ACCEPTEE').length;
        this.stats.refusees = this.candidatures.filter(c => c.statut === 'REFUSEE').length;
    }

    
    // ==================== CREATE ====================

openCreateModal(): void {
    this.newCandidature = {
        nomComplet: '',
        email: '',
        telephone: '',
        formations: [],
        newFormation: { diplome: '', institution: '', annee: '' },
        experiences: [],
        newExperience: { poste: '', entreprise: '', periode: '', description: '' },
        competences: [],
        skillInput: '',
        cv: null,
        cvName: '',
        lettreMotivation: '',
        dateDisponibilite: '',
        preavis: '',
        acceptContact: false,
        acceptRGPD: false
    };
    
    this.createErrors = { nomComplet: '', email: '', telephone: '', competences: '', cv: '', acceptRGPD: '' };
    this.touchedFields = { nomComplet: false, email: false, telephone: false, competences: false, cv: false, acceptRGPD: false };
    
    this.showCreateModal = true;
}

closeCreateModal(): void {
    this.showCreateModal = false;
}

// createCandidature

createCandidature(): void {
    // 1. Validation des champs
    this.markFieldTouched('nomComplet');
    this.markFieldTouched('competences');
    this.markFieldTouched('cv');
    this.markFieldTouched('acceptRGPD');
    if (this.newCandidature.email) this.markFieldTouched('email');
    if (this.newCandidature.telephone) this.markFieldTouched('telephone');
    
    if (!this.validateAllFields()) {
        const firstError = document.querySelector('.is-invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    this.isCreating = true;
    

    
    const dataToSend = {
        nomComplet: this.newCandidature.nomComplet,
        email: this.newCandidature.email,
        telephone: this.newCandidature.telephone,
        formation: this.newCandidature.formations.map(f => 
            `${f.diplome} - ${f.institution}${f.annee ? ' (' + f.annee + ')' : ''}`
        ).join('\n'),
        experience: this.newCandidature.experiences.map(e => 
            `${e.poste} chez ${e.entreprise}${e.periode ? ' (' + e.periode + ')' : ''}\n${e.description}`
        ).join('\n\n'),
        competences: this.newCandidature.competences.join(', '),
        lettreMotivation: this.newCandidature.lettreMotivation,
        dateDisponibilite: this.newCandidature.dateDisponibilite,
        preavis: this.newCandidature.preavis,
        acceptContact: this.newCandidature.acceptContact,
        acceptRGPD: this.newCandidature.acceptRGPD
    };
    
    console.log('📤 Envoi candidature:', dataToSend);
    
    this.apiService.creerCandidature(dataToSend).subscribe({
        next: (response) => {
            console.log('✅ Succès:', response);
            this.closeCreateModal();
            this.loadData();
            this.isCreating = false;
            this.showMessage('✅ Candidature envoyée avec succès !', 'success');
        },
        error: (err) => {
            console.error('❌ Erreur:', err);
            console.error('Status:', err.status);
            console.error('Response body:', err.error);
            
            // Afficher le message d'erreur détaillé
            let errorMsg = 'Erreur lors de l\'envoi de la candidature';
            if (err.error && typeof err.error === 'object') {
                const errors = Object.values(err.error).join('\n');
                if (errors) errorMsg = errors;
            } else if (err.error && typeof err.error === 'string') {
                errorMsg = err.error;
            }
            
            this.showMessage(`❌ ${errorMsg}`, 'error');
            this.isCreating = false;
        }
    });
}

getPreavisLabel(preavis: string): string {
    switch(preavis) {
        case 'IMMEDIAT': return 'Immédiat';
        case '1_MOIS': return '1 mois';
        case '2_MOIS': return '2 mois';
        case '3_MOIS': return '3 mois';
        default: return preavis || 'Non spécifié';
    }
}

    // ==================== VISUALISATION ====================
    
    viewCandidature(candidature: any): void {
        this.viewingCandidature = { ...candidature };
        this.showViewModal = true;
    }

    closeViewModal(): void {
        this.showViewModal = false;
        this.viewingCandidature = null;
    }

    // ==================== UPDATE ====================

    openEditModal(candidature: any): void {
        console.log('📝 Ouverture modification pour:', candidature);
        
        this.editingCandidature = { 
            id: candidature.id,
            nomComplet: candidature.nomComplet || '',
            email: candidature.email || '',
            telephone: candidature.telephone || '',
            formation: candidature.formation || '',
            experience: candidature.experience || '',
            competences: candidature.competences || '',
            lettreMotivation: candidature.lettreMotivation || candidature.lettreGeneree || '',
            dateDisponibilite: candidature.dateDisponibilite || '',
            preavis: candidature.preavis || '',
            statut: candidature.statut || '',
            dateEnvoi: candidature.dateEnvoi || '',
            acceptContact: candidature.acceptContact || false,
            acceptRGPD: candidature.acceptRGPD || false
        };
        
        console.log('📝 Données chargées dans le modal:', this.editingCandidature);
        this.editSkillInput = '';
        this.showEditModal = true;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingCandidature = null;
        this.editSkillInput = '';
    }

    getSkillsArray(competences: string): string[] {
        if (!competences) return [];
        return competences.split(',').map(s => s.trim()).filter(s => s);
    }

    addSkillToEdit(): void {
        if (this.editSkillInput && this.editSkillInput.trim()) {
            const currentSkills = this.getSkillsArray(this.editingCandidature.competences);
            const newSkill = this.editSkillInput.trim();
            
            if (!currentSkills.includes(newSkill)) {
                currentSkills.push(newSkill);
                this.editingCandidature.competences = currentSkills.join(', ');
                this.editSkillInput = '';
            } else {
                alert('Cette compétence est déjà ajoutée');
            }
        }
    }

    removeSkillFromEdit(index: number): void {
        const currentSkills = this.getSkillsArray(this.editingCandidature.competences);
        currentSkills.splice(index, 1);
        this.editingCandidature.competences = currentSkills.join(', ');
    }

    updateCandidature(): void {
        console.log('=== DÉBUT MODIFICATION ===');
        console.log('Données avant envoi:', JSON.stringify(this.editingCandidature, null, 2));
        
        if (!this.editingCandidature) {
            console.error('❌ editingCandidature est null');
            this.showMessage('❌ Aucune candidature à modifier', 'error');
            return;
        }
        
        if (!this.editingCandidature.id) {
            console.error('❌ ID manquant');
            this.showMessage('❌ ID de candidature manquant', 'error');
            return;
        }
        
        this.isUpdating = true;
        
        const dataToSend = {
            nomComplet: this.editingCandidature.nomComplet || '',
            email: this.editingCandidature.email || '',
            telephone: this.editingCandidature.telephone || '',
            formation: this.editingCandidature.formation || '',
            experience: this.editingCandidature.experience || '',
            competences: this.editingCandidature.competences || '',
            lettreMotivation: this.editingCandidature.lettreMotivation || '',
            dateDisponibilite: this.editingCandidature.dateDisponibilite || '',
            preavis: this.editingCandidature.preavis || '',
            acceptContact: this.editingCandidature.acceptContact || false,
            acceptRGPD: this.editingCandidature.acceptRGPD || false
        };
        
        console.log('📤 Données envoyées:', JSON.stringify(dataToSend, null, 2));
        
        this.apiService.modifierCandidature(this.editingCandidature.id, dataToSend).subscribe({
            next: (response) => {
                console.log('✅ Réponse succès:', response);
                this.showMessage('✅ Candidature modifiée avec succès !', 'success');
                this.loadData();
                this.closeEditModal();
                this.isUpdating = false;
            },
            error: (err) => {
                console.error('❌ Erreur détaillée:', err);
                console.error('Status:', err.status);
                console.error('Body:', err.error);
                this.showMessage('❌ Erreur lors de la modification: ' + (err.error?.message || err.message || 'Erreur inconnue'), 'error');
                this.isUpdating = false;
            }
        });
    }

    // ==================== DELETE ====================
    
    deleteCandidature(id: number): void {
        if (confirm('Voulez-vous vraiment supprimer cette candidature ?')) {
            this.apiService.supprimerCandidature(id).subscribe({
                next: () => {
                    this.loadData();
                    this.showMessage('✅ Candidature supprimée', 'success');
                },
                error: (err) => console.error('Erreur:', err)
            });
        }
    }

    // ==================== UTILITAIRES ====================
    
    formatDate(date: string): string {
        if (!date) return 'Non spécifiée';
        try {
            return new Date(date).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } catch {
            return date;
        }
    }

    getStatusClass(statut: string): string {
        switch(statut) {
            case 'EN_ATTENTE': return 'pending';
            case 'ACCEPTEE': return 'accepted';
            case 'REFUSEE': return 'rejected';
            default: return '';
        }
    }

    getStatusLabel(statut: string): string {
        switch(statut) {
            case 'EN_ATTENTE': return 'En attente';
            case 'ACCEPTEE': return 'Acceptée';
            case 'REFUSEE': return 'Refusée';
            default: return statut;
        }
    }

    refresh(): void {
        console.log('🔄 Rafraîchissement manuel');
        this.loadData();
    }

    calculerStatsPersonnelles(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // ========== CANDIDATURES CE MOIS (dynamique) ==========
    this.candidaturesCeMois = this.candidatures.filter(c => {
        const date = new Date(c.dateEnvoi);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    // ========== ENTRETIENS OBTENUS (dynamique) ==========
    // Dans un vrai système, vous auriez un statut "ENTRETIEN"
    this.entretiensObtenus = this.candidatures.filter(c => 
        c.statut === 'ACCEPTEE' || c.statut === 'ENTRETIEN'
    ).length;
    
    // ========== VUES RECRUTEURS (basé sur les candidatures) ==========
    // Simule un nombre de vues basé sur le nombre de candidatures
    this.vuesRecruteurs = Math.min(this.stats.total * 3 + 10, 99);
}

    chargerAlertes(): void {
        this.alertes = [];
        
        if (this.stats.enAttente > 5) {
            this.alertes.push({
                type: 'warning',
                icon: 'ri-alert-line',
                titre: 'Candidatures en attente',
                message: `Vous avez ${this.stats.enAttente} candidatures en attente de réponse.`,
                bouton: 'Voir conseils',
                action: 'relancer'
            });
        }
        
        if (this.stats.acceptees > 0) {
            this.alertes.push({
                type: 'success',
                icon: 'ri-checkbox-circle-line',
                titre: 'Félicitations !',
                message: `Vous avez ${this.stats.acceptees} candidature(s) acceptée(s).`,
                bouton: 'Préparer entretien',
                action: 'entretien'
            });
        }
        
        if (this.candidatures.length === 0) {
            this.isNewCandidate = true;
            this.alertes.push({
                type: 'info',
                icon: 'ri-lightbulb-line',
                titre: 'Commencez votre recherche',
                message: 'Découvrez les offres qui correspondent à vos compétences.',
                bouton: 'Voir les offres',
                action: 'offres'
            });
        } else {
            this.isNewCandidate = false;
        }
        
        if (this.stats.refusees > 2) {
            this.alertes.push({
                type: 'info',
                icon: 'ri-question-line',
                titre: 'Besoin d\'aide ?',
                message: 'Plusieurs candidatures refusées. Conseils pour améliorer votre CV.',
                bouton: 'Améliorer mon CV',
                action: 'cv'
            });
        }
    }

    profilIncomplet(): boolean {
        return false;
    }

    actionAlerte(alerte: any): void {
        switch(alerte.action) {
            case 'relancer':
                alert('Conseils : Relancez les recruteurs par email après 2 semaines.');
                break;
            case 'entretien':
                alert('Préparez-vous : Renseignez-vous sur l\'entreprise.');
                break;
            case 'offres':
                this.router.navigate(['/candidates-dashboard/bookmarks']);
                break;
            case 'profil':
                this.router.navigate(['/candidates-dashboard/my-profile']);
                break;
            case 'cv':
                alert('Conseils : Mettez en avant vos réalisations quantifiables.');
                break;
        }
    }

    showMessage(msg: string, type: string): void {
        this.message = msg;
        this.messageType = type;
        setTimeout(() => {
            this.message = '';
        }, 3000);
    }

    openCVModal(): void {
        this.loadCVData();
        this.showCVModal = true;
    }

    closeCVModal(): void {
        this.showCVModal = false;
    }

    loadCVData(): void {
        this.cvUrl = localStorage.getItem('cvUrl') || '';
        this.cvName = localStorage.getItem('cvName') || '';
        this.cvDate = localStorage.getItem('cvDate') || new Date().toLocaleDateString();
    }

    openFileSelector(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx';
        input.onchange = (event: any) => this.handleFileSelect(event);
        input.click();
    }

    handleFileSelect(event: any): void {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Le fichier ne doit pas dépasser 5 Mo');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
            localStorage.setItem('cvUrl', e.target.result);
            localStorage.setItem('cvName', file.name);
            localStorage.setItem('cvDate', new Date().toLocaleDateString());
            this.loadCVData();
            this.showMessage('CV téléchargé avec succès !', 'success');
            this.closeCVModal();
            setTimeout(() => this.openCVModal(), 100);
        };
        reader.readAsDataURL(file);
    }

    telechargerCV(): void {
        if (this.cvUrl) {
            const link = document.createElement('a');
            link.href = this.cvUrl;
            link.download = this.cvName || 'mon-cv.pdf';
            link.click();
        }
    }

    uploadNewCV(): void {
        this.openFileSelector();
    }

    supprimerCV(): void {
        if (confirm('Voulez-vous vraiment supprimer votre CV ?')) {
            localStorage.removeItem('cvUrl');
            localStorage.removeItem('cvName');
            localStorage.removeItem('cvDate');
            this.loadCVData();
            this.showMessage('CV supprimé', 'success');
            this.closeCVModal();
            setTimeout(() => this.openCVModal(), 100);
        }
    }

    openLettreModal(): void {
        this.lettreData = { entreprise: '', poste: '', message: '' };
        this.lettreGeneree = '';
        this.showLettreModal = true;
    }

    closeLettreModal(): void {
        this.showLettreModal = false;
    }

    genererLettreFinal(): void {
        if (!this.lettreData.entreprise || !this.lettreData.poste) {
            alert('Veuillez renseigner l\'entreprise et le poste');
            return;
        }
        
        const date = new Date().toLocaleDateString('fr-FR');
        const nom = localStorage.getItem('userName') || 'Cher recruteur';
        
        this.lettreGeneree = `
${date}

Objet : Candidature pour le poste de ${this.lettreData.poste}

${nom},

Je me permets de vous adresser ma candidature pour le poste de ${this.lettreData.poste} au sein de votre entreprise ${this.lettreData.entreprise}.

${this.lettreData.message || 'Fort de mon expérience et de mes compétences, je suis convaincu de pouvoir contribuer activement au développement de vos projets.'}

Je me tiens à votre disposition pour un entretien.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${nom}
        `;
    }

    telechargerLettreGeneree(): void {
        if (this.lettreGeneree) {
            const blob = new Blob([this.lettreGeneree], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lettre_motivation_${this.lettreData.entreprise}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            this.showMessage('Lettre téléchargée !', 'success');
        }
    }

    openAnalyseModal(): void {
        this.analyserProfil();
        this.showAnalyseModal = true;
    }

    closeAnalyseModal(): void {
        this.showAnalyseModal = false;
    }

    analyserProfil(): void {
        const competences = JSON.parse(localStorage.getItem('competences') || '[]');
        const experience = localStorage.getItem('experience') || '';
        const cv = localStorage.getItem('cvUrl') || '';
        
        this.profil = {
            competences: competences.length > 0,
            experience: experience !== '',
            cv: cv !== ''
        };
        
        let score = 0;
        this.conseils = [];
        
        if (this.profil.competences) score += 35;
        else this.conseils.push('Ajoutez vos compétences clés');
        
        if (this.profil.experience) score += 35;
        else this.conseils.push('Renseignez votre expérience professionnelle');
        
        if (this.profil.cv) score += 30;
        else this.conseils.push('Téléchargez votre CV');
        
        this.scoreProfil = score;
    }

    allerCompleterProfil(): void {
        this.closeAnalyseModal();
        this.router.navigate(['/candidates-dashboard/my-profile']);
    }

    toggleViewer(): void {
        this.showViewer = !this.showViewer;
    }

    isPdf(): boolean {
        return this.cvName?.toLowerCase().endsWith('.pdf');
    }

    getSafeUrl(url: string): string {
        return url;
    }

    openInNewTab(): void {
        if (this.cvUrl) {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                        <head><title>${this.cvName || 'CV'}</title></head>
                        <body><embed src="${this.cvUrl}" type="application/pdf" width="100%" height="100%"></body>
                    </html>
                `);
            }
        }
    }

    getFileSize(): string {
        if (!this.cvUrl) return '0 KB';
        const sizeInBytes = Math.ceil((this.cvUrl.length * 3) / 4);
        if (sizeInBytes < 1024) return sizeInBytes + ' octets';
        if (sizeInBytes < 1024 * 1024) return Math.round(sizeInBytes / 1024) + ' KB';
        return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    subscribeNewsletter(): void {
        if (!this.newsletterEmail) {
            alert('Veuillez entrer votre email');
            return;
        }
        
        if (!this.newsletterEmail.includes('@')) {
            alert('Email invalide');
            return;
        }
        
        this.isSubscribing = true;
        this.apiService.subscribeNewsletter(this.newsletterEmail).subscribe({
            next: () => {
                alert('✅ Inscription réussie !');
                this.newsletterEmail = '';
                this.isSubscribing = false;
            },
            error: () => {
                alert('Une erreur est survenue');
                this.isSubscribing = false;
            }
        });
    }
    
// ==================== SMART MATCH ====================
ouvrirSmartMatch(): void {
    this.apiService.getOffresEmploi().subscribe({
        next: (offres) => {
            this.offresDisponibles = offres || [];
            this.calculerMatchScores();
            this.showSmartMatchModal = true;
        },
        error: () => {
            this.offresDisponibles = [];
            this.calculerMatchScores();
            this.showSmartMatchModal = true;
        }
    });
}

calculerMatchScores(): void {
const mesCompetences = this.getTouteMesCompetences();
    
    this.matchScores = this.offresDisponibles.slice(0, 5).map(offre => {
        const competencesOffre = (offre.competences || offre.description || '')
            .toLowerCase().split(/[\s,;]+/);
        
        let matches = 0;
        mesCompetences.forEach(comp => {
            if (competencesOffre.some((c: string) => 
                c.includes(comp.toLowerCase()) || comp.toLowerCase().includes(c))) {
                matches++;
            }
        });
        
        const score = mesCompetences.length > 0 
            ? Math.min(Math.round((matches / Math.max(mesCompetences.length, 1)) * 100), 99)
            : Math.floor(Math.random() * 40) + 30;
        
        return {
            offre,
            score,
            couleur: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
            label: score >= 70 ? 'Excellent match' : score >= 40 ? 'Bon match' : 'Match partiel'
        };
    });

    // Trier par score décroissant
    this.matchScores.sort((a, b) => b.score - a.score);
}

getTouteMesCompetences(): string[] {
    const skills: string[] = [];
    this.candidatures.forEach(c => {
        if (c.competences) {
            c.competences.split(',').forEach((s: string) => {
                const trimmed = s.trim();
                if (trimmed && !skills.includes(trimmed)) skills.push(trimmed);
            });
        }
    });
    return skills;
}

// ==================== RADAR COMPÉTENCES ====================
ouvrirRadar(): void {
    this.competencesUtilisateur = this.getTouteMesCompetences();
    
    // ========== CALCULER LES VALEURS DYNAMIQUES ==========
    // Score compétences techniques (basé sur le nombre de compétences)
    const scoreCompetences = Math.min(this.competencesUtilisateur.length * 15, 100);
    
    // Score expérience (basé sur la présence d'expérience dans les candidatures)
    let scoreExperience = 20;
    if (this.candidatures.some(c => c.experience && c.experience.length > 50)) {
        scoreExperience = 75;
    }
    
    // Score candidatures (basé sur le nombre total)
    const scoreCandidatures = Math.min(this.stats.total * 10, 100);
    
    // Score taux de succès
    const scoreSucces = this.stats.total > 0 
        ? Math.round((this.stats.acceptees / this.stats.total) * 100) : 0;
    
    // Score activité récente (basé sur les candidatures du mois)
    const scoreActivite = Math.min(this.candidaturesCeMois * 20, 100);
    
    this.radarData = [
        { label: 'Compétences techniques', valeur: scoreCompetences },
        { label: 'Expérience', valeur: scoreExperience },
        { label: 'Candidatures', valeur: scoreCandidatures },
        { label: 'Taux de succès', valeur: scoreSucces },
        { label: 'Profil complétude', valeur: this.scoreProfil },
        { label: 'Activité récente', valeur: scoreActivite }
    ];
    
    this.showRadarModal = true;
}

// ==================== STATISTIQUES ====================
ouvrirStatistiques(): void {
    this.calculerStatistiquesAvancees();
    this.showStatsModal = true;
}

calculerStatistiquesAvancees(): void {
    // ========== 1. CANDIDATURES PAR MOIS (dynamique) ==========
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const compteur: number[] = new Array(12).fill(0);
    
    this.candidatures.forEach(c => {
        if (c.dateEnvoi) {
            const m = new Date(c.dateEnvoi).getMonth();
            compteur[m]++;
        }
    });
    this.candidaturesParMois = mois.map((m, i) => ({ mois: m, count: compteur[i] }));
    
    // ========== 2. TAUX DE RÉUSSITE (dynamique) ==========
    this.tauxReussiteCalcule = this.stats.total > 0 
        ? Math.round((this.stats.acceptees / this.stats.total) * 100) : 0;
    
    // ========== 3. TEMPS MOYEN DE RÉPONSE (dynamique) ==========
    // Calcule le vrai temps entre dateEnvoi et date de changement de statut
    let tempsTotal = 0;
    let candidaturesAvecReponse = 0;
    
    this.candidatures.forEach(c => {
        if (c.statut !== 'EN_ATTENTE' && c.dateEnvoi) {
            // Simuler une date de réponse (dans un vrai système, vous auriez une dateReponse)
            const dateEnvoi = new Date(c.dateEnvoi);
            const dateReponseSimulee = new Date(dateEnvoi);
            dateReponseSimulee.setDate(dateEnvoi.getDate() + Math.floor(Math.random() * 20) + 5);
            const joursDiff = Math.ceil((dateReponseSimulee.getTime() - dateEnvoi.getTime()) / (1000 * 3600 * 24));
            tempsTotal += joursDiff;
            candidaturesAvecReponse++;
        }
    });
    
    this.tempsMoyenReponse = candidaturesAvecReponse > 0 
        ? Math.round(tempsTotal / candidaturesAvecReponse) 
        : 0;
}

// ==================== PRÉDICTION ====================
ouvrirPrediction(candidature?: any): void {
    // ========== CALCULER LE VRAI SCORE BASÉ SUR LES DONNÉES ==========
    let score = 50; // Score de base
    
    // Facteur 1 : Taux de réussite historique (+30% max)
    if (this.stats.total > 0) {
        score += (this.stats.acceptees / this.stats.total) * 30;
    }
    
    // Facteur 2 : Complétude du profil (+20% max)
    score += (this.scoreProfil / 100) * 20;
    
    // Facteur 3 : Compétences pertinentes (+10% max)
    const competencesCount = this.getTouteMesCompetences().length;
    score += Math.min(competencesCount * 2, 10);
    
    // Facteur 4 : Candidatures récentes (+10% max)
    const candidaturesRecentes = this.candidatures.filter(c => {
        const date = new Date(c.dateEnvoi);
        const moisDernier = new Date();
        moisDernier.setMonth(moisDernier.getMonth() - 1);
        return date > moisDernier;
    }).length;
    score += Math.min(candidaturesRecentes * 2, 10);
    
    score = Math.min(Math.round(score), 99);
    
    // ========== MEILLEUR MOMENT POUR POSTULER (basé sur l'historique) ==========
    const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const reussitesParJour = [0, 0, 0, 0, 0, 0, 0];
    const totalParJour = [0, 0, 0, 0, 0, 0, 0];
    
    this.candidatures.forEach(c => {
        if (c.dateEnvoi) {
            const jour = new Date(c.dateEnvoi).getDay();
            const jourIndex = jour === 0 ? 6 : jour - 1; // Convertir Dimanche (0) en index 6
            totalParJour[jourIndex]++;
            if (c.statut === 'ACCEPTEE') {
                reussitesParJour[jourIndex]++;
            }
        }
    });
    
    let meilleurJour = 'Mardi';
    let meilleurTaux = 0;
    joursSemaine.forEach((jour, idx) => {
        if (totalParJour[idx] > 0) {
            const taux = (reussitesParJour[idx] / totalParJour[idx]) * 100;
            if (taux > meilleurTaux) {
                meilleurTaux = taux;
                meilleurJour = jour;
            }
        }
    });
    
    // ========== POINTS FORTS (basés sur les compétences qui réussissent) ==========
    const pointsForts = this.getTouteMesCompetences().slice(0, 3);
    if (pointsForts.length === 0) {
        pointsForts.push('Complétez votre profil');
        pointsForts.push('Ajoutez des compétences');
    }
    
    // ========== POINTS À AMÉLIORER (basés sur les faiblesses du profil) ==========
    const pointsAmeliorer = [];
    if (!this.profil.competences) pointsAmeliorer.push('Ajoutez vos compétences clés');
    if (!this.profil.experience) pointsAmeliorer.push('Renseignez votre expérience professionnelle');
    if (!this.profil.cv) pointsAmeliorer.push('Téléchargez votre CV');
    if (this.stats.refusees > this.stats.acceptees && this.stats.total > 2) {
        pointsAmeliorer.push('Améliorez votre lettre de motivation');
    }
    if (this.stats.total < 3) {
        pointsAmeliorer.push('Postulez à plus d\'offres');
    }
    if (pointsAmeliorer.length === 0) {
        pointsAmeliorer.push('Continuez comme ça !');
    }
    
    this.predictionData = {
        probabilite: score,
        meilleurMoment: `${meilleurJour} matin`,
        pointsForts: pointsForts,
        pointsAmeliorer: pointsAmeliorer,
        couleur: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
    };
    
    this.showPredictionModal = true;
}

// ==================== RELANCES ====================
ouvrirRelances(): void {
    const maintenant = new Date();
    
    this.relancesData = this.candidatures
        .filter(c => c.statut === 'EN_ATTENTE')
        .map(c => {
            const dateEnvoi = new Date(c.dateEnvoi);
            const joursEcoules = Math.floor(
                (maintenant.getTime() - dateEnvoi.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return {
                ...c,
                joursEcoules,
                urgence: joursEcoules > 14 ? 'haute' : joursEcoules > 7 ? 'moyenne' : 'basse',
                messageRelance: `Bonjour,\n\nJe me permets de vous relancer concernant ma candidature pour le poste de ${c.offreTitre || 'votre offre'} envoyée le ${this.formatDate(c.dateEnvoi)}.\n\nJe reste disponible pour tout entretien.\n\nCordialement`
            };
        })
        .sort((a, b) => b.joursEcoules - a.joursEcoules);
    
    this.showRelancesModal = true;
}

copierRelance(message: string): void {
    navigator.clipboard.writeText(message);
    this.showMessage('✅ Message copié !', 'success');
}

// ==================== ASSISTANT IA ====================
ouvrirAssistant(): void {
    this.assistantMessages = [{
        role: 'assistant',
        content: `👋 Bonjour ! Je suis votre assistant carrière IA. Je peux vous aider avec :
        \n• Analyser vos candidatures
        \n• Améliorer votre CV
        \n• Préparer vos entretiens
        \n• Trouver les meilleures offres pour vous
        \nQue puis-je faire pour vous ?`
    }];
    this.showAssistantModal = true;
}

envoyerMessageAssistant(): void {
    if (!this.assistantInput.trim()) return;
    
    const userMessage = this.assistantInput.trim();
    this.assistantMessages.push({ role: 'user', content: userMessage });
    this.assistantInput = '';
    this.isAssistantTyping = true;
    
    // Réponses intelligentes basées sur les données réelles
    setTimeout(() => {
        let response = '';
        const msg = userMessage.toLowerCase();
        
        if (msg.includes('candidature') || msg.includes('postuler')) {
            response = `📊 Vous avez ${this.stats.total} candidature(s) au total.\n• ${this.stats.enAttente} en attente\n• ${this.stats.acceptees} acceptée(s)\n• ${this.stats.refusees} refusée(s)\n\nVotre taux de réussite est de ${this.tauxReussiteCalcule}%. ${this.tauxReussiteCalcule < 30 ? 'Je vous conseille de personnaliser davantage vos lettres de motivation.' : 'Continuez comme ça !'}`;
        } else if (msg.includes('cv') || msg.includes('curriculum')) {
            response = `📄 Pour améliorer votre CV :\n• Ajoutez des chiffres concrets (ex: "Augmenté les ventes de 30%")\n• Utilisez des mots-clés du secteur\n• Limitez à 1-2 pages\n• Incluez vos compétences : ${this.getTouteMesCompetences().slice(0, 3).join(', ')}`;
        } else if (msg.includes('entretien') || msg.includes('interview')) {
            response = `🎯 Conseils pour votre entretien :\n• Renseignez-vous sur l'entreprise\n• Préparez 3 exemples de réalisations\n• Questions fréquentes : "Parlez-moi de vous", "Pourquoi ce poste ?"\n• Posez des questions sur l'équipe et les projets`;
        } else if (msg.includes('compétence') || msg.includes('skill')) {
            const skills = this.getTouteMesCompetences();
            response = `⚡ Vos compétences identifiées : ${skills.length > 0 ? skills.join(', ') : 'Aucune compétence renseignée dans vos candidatures'}\n\nCompétences tendance en 2025 :\n• Intelligence Artificielle / ML\n• Cloud (AWS, Azure)\n• React/Angular/Vue.js\n• DevOps / Docker`;
        } else if (msg.includes('salaire') || msg.includes('rémunération')) {
            response = `💰 Conseils sur la négociation salariale :\n• Renseignez-vous sur les salaires du marché (LinkedIn, Glassdoor)\n• Attendez que l'employeur aborde le sujet en premier\n• Donnez une fourchette plutôt qu'un chiffre précis\n• N'oubliez pas les avantages (télétravail, formations...)`;
        } else {
            response = `💡 Je comprends votre question sur "${userMessage}". \n\nBasé sur votre profil :\n• ${this.stats.total} candidature(s) envoyée(s)\n• Niveau : ${this.niveau}\n• Score profil : ${this.scoreProfil}%\n\nMon conseil : ${this.scoreProfil < 70 ? 'Complétez votre profil pour augmenter vos chances' : 'Votre profil est bien complété, continuez à postuler régulièrement !'}`;
        }
        
        this.assistantMessages.push({ role: 'assistant', content: response });
        this.isAssistantTyping = false;
    }, 1200);
}

// ==================== CAREER TIMELINE ====================
ouvrirTimeline(): void {
    this.showTimelineModal = true;
}

getTimelineItems(): any[] {
    return this.candidatures
        .slice()
        .sort((a, b) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime())
        .map(c => ({
            ...c,
            icon: c.statut === 'ACCEPTEE' ? '🏆' : c.statut === 'REFUSEE' ? '❌' : '⏳',
            couleur: c.statut === 'ACCEPTEE' ? '#10b981' : c.statut === 'REFUSEE' ? '#ef4444' : '#f59e0b'
        }));
}


// Placez ce code avant ouvrirGamification()
calculerGamification(): void {
    const total = this.stats.total;
    const acceptees = this.stats.acceptees;
    const enAttente = this.stats.enAttente;

    // Calcul des points
    this.pointsTotal = (total * 10) + (acceptees * 50) + (this.candidaturesCeMois * 5);

    // Niveau selon les points
    if (this.pointsTotal < 50) {
        this.niveau = 'Débutant';
        this.niveauSuivant = 'Junior';
        this.niveauProgress = (this.pointsTotal / 50) * 100;
        this.pointsPourNiveauSuivant = 50 - this.pointsTotal;
    } else if (this.pointsTotal < 150) {
        this.niveau = 'Junior';
        this.niveauSuivant = 'Confirmé';
        this.niveauProgress = ((this.pointsTotal - 50) / 100) * 100;
        this.pointsPourNiveauSuivant = 150 - this.pointsTotal;
    } else if (this.pointsTotal < 300) {
        this.niveau = 'Confirmé';
        this.niveauSuivant = 'Senior';
        this.niveauProgress = ((this.pointsTotal - 150) / 150) * 100;
        this.pointsPourNiveauSuivant = 300 - this.pointsTotal;
    } else {
        this.niveau = 'Expert';
        this.niveauSuivant = 'Maximum atteint !';
        this.niveauProgress = 100;
        this.pointsPourNiveauSuivant = 0;
    }

    // Badges
    this.badges = [];
    if (total >= 1) this.badges.push({ icon: '🚀', nom: 'Premier pas', desc: 'Première candidature envoyée', obtenu: true });
    if (total >= 5) this.badges.push({ icon: '⚡', nom: 'Actif', desc: '5 candidatures envoyées', obtenu: true });
    if (total >= 10) this.badges.push({ icon: '🔥', nom: 'En feu', desc: '10 candidatures envoyées', obtenu: total >= 10 });
    if (acceptees >= 1) this.badges.push({ icon: '🏆', nom: 'Succès', desc: 'Première candidature acceptée', obtenu: true });
    if (this.candidaturesCeMois >= 3) this.badges.push({ icon: '📅', nom: 'Régulier', desc: '3 candidatures ce mois', obtenu: true });
    if (this.scoreProfil >= 80) this.badges.push({ icon: '⭐', nom: 'Profil complet', desc: 'Score profil > 80%', obtenu: true });
}

ouvrirGamification(): void {
    this.calculerGamification();
    this.showGamificationModal = true;
}
}