import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { SafeUrlPipe } from './safe-url.pipe';


declare const require: any;

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
    
    // États des modals
    showCreateModal = false;
    showEditModal = false;
    isCreating = false;
    isUpdating = false;
    
    // Fichiers création
    selectedCVName: string = '';
    selectedLMName: string = '';
    skillInput: string = '';
    
    // Fichiers édition
    editSelectedCVName: string = '';
    editSelectedLMName: string = '';
    editSkillInput: string = '';
    
    tauxReussite: number = 0;
    tempsReponse: number = 0;
scoreEmployabilite: number = 0;


candidaturesCeMois: number = 0;
entretiensObtenus: number = 0;
vuesRecruteurs: number = 0;


    // Données pour création
    newCandidature = {
        entreprise: '',
        poste: '',
        lettreGeneree: '',
        contrat: 'CDI',
        salaireMin: null,
        salaireMax: null,
        devise: '€',
        dateDisponibilite: '',
        preavis: '',
        acceptContact: false,
        acceptRGPD: false,
        competences: [] as string[]
    };
    
    // Données pour édition
    editingCandidature: any = null;
    
    // Erreurs de validation
    createErrors = {
        entreprise: '',
        poste: ''
    };
    
    editErrors = {
        entreprise: '',
        poste: ''
    };
    
    // Statistiques
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

// Données lettre
lettreData = {
    entreprise: '',
    poste: '',
    message: ''
};
lettreGeneree: string = '';

// Données analyse
scoreProfil: number = 0;
profil = {
    competences: false,
    experience: false,
    cv: false
};

showViewer: boolean = false;

conseils: string[] = [];
fileSize: string = '';


newsletterEmail: string = '';
isSubscribing: boolean = false;
nombreCandidatsActifs: number = 12453;
offresNouvelles: number = 347;
    constructor(private apiService: ApiService,    private router: Router) {}

    ngOnInit(): void {
        this.loadData();
    }

    // ==================== VALIDATION ====================
    
    validateCreateForm(): boolean {
        let isValid = true;
        
        this.createErrors = { entreprise: '', poste: '' };
        
        if (!this.newCandidature.entreprise.trim()) {
            this.createErrors.entreprise = 'L\'entreprise est requise';
            isValid = false;
        } else if (this.newCandidature.entreprise.length < 2) {
            this.createErrors.entreprise = 'L\'entreprise doit contenir au moins 2 caractères';
            isValid = false;
        } else if (this.newCandidature.entreprise.length > 100) {
            this.createErrors.entreprise = 'L\'entreprise ne peut pas dépasser 100 caractères';
            isValid = false;
        }
        
        if (!this.newCandidature.poste.trim()) {
            this.createErrors.poste = 'Le poste est requis';
            isValid = false;
        } else if (this.newCandidature.poste.length < 2) {
            this.createErrors.poste = 'Le poste doit contenir au moins 2 caractères';
            isValid = false;
        } else if (this.newCandidature.poste.length > 100) {
            this.createErrors.poste = 'Le poste ne peut pas dépasser 100 caractères';
            isValid = false;
        }
        
        // Validation RGPD
        if (!this.newCandidature.acceptRGPD) {
            alert('Vous devez accepter les conditions RGPD');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateEditForm(): boolean {
        let isValid = true;
        this.editErrors = { entreprise: '', poste: '' };
        
        if (!this.editingCandidature) return false;
        
        if (!this.editingCandidature.entreprise?.trim()) {
            this.editErrors.entreprise = 'L\'entreprise est requise';
            isValid = false;
        } else if (this.editingCandidature.entreprise.length < 2) {
            this.editErrors.entreprise = 'L\'entreprise doit contenir au moins 2 caractères';
            isValid = false;
        } else if (this.editingCandidature.entreprise.length > 100) {
            this.editErrors.entreprise = 'L\'entreprise ne peut pas dépasser 100 caractères';
            isValid = false;
        }
        
        if (!this.editingCandidature.poste?.trim()) {
            this.editErrors.poste = 'Le poste est requis';
            isValid = false;
        } else if (this.editingCandidature.poste.length < 2) {
            this.editErrors.poste = 'Le poste doit contenir au moins 2 caractères';
            isValid = false;
        } else if (this.editingCandidature.poste.length > 100) {
            this.editErrors.poste = 'Le poste ne peut pas dépasser 100 caractères';
            isValid = false;
        }
        
        return isValid;
    }

    // ==================== GESTION COMPÉTENCES ====================
    
    addSkill(): void {
        if (this.skillInput && this.skillInput.trim()) {
            this.newCandidature.competences.push(this.skillInput.trim());
            this.skillInput = '';
        }
    }
    
    removeSkill(skill: string): void {
        this.newCandidature.competences = this.newCandidature.competences.filter(s => s !== skill);
    }
    
    addEditSkill(): void {
        if (this.editSkillInput && this.editSkillInput.trim()) {
            if (!this.editingCandidature.competences) {
                this.editingCandidature.competences = [];
            }
            this.editingCandidature.competences.push(this.editSkillInput.trim());
            this.editSkillInput = '';
        }
    }
    
    removeEditSkill(skill: string): void {
        if (this.editingCandidature) {
            this.editingCandidature.competences = this.editingCandidature.competences.filter((s: string) => s !== skill);
        }
    }
    
    // ==================== GESTION FICHIERS ====================
    
    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.selectedCVName = file.name;
        }
    }
    
    onLMFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            this.selectedLMName = file.name;
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
                this.candidatures = Array.isArray(data) ? data : (data ? [data] : []);
                this.isLoading = false;
                this.calculateStats();
                this.calculerStatsPersonnelles();
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
            entreprise: '',
            poste: '',
            lettreGeneree: '',
            contrat: 'CDI',
            salaireMin: null,
            salaireMax: null,
            devise: '€',
            dateDisponibilite: '',
            preavis: '',
            acceptContact: false,
            acceptRGPD: false,
            competences: []
        };
        this.selectedCVName = '';
        this.selectedLMName = '';
        this.skillInput = '';
        this.createErrors = { entreprise: '', poste: '' };
        this.showCreateModal = true;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.createErrors = { entreprise: '', poste: '' };
    }

    createCandidature(): void {
        if (!this.validateCreateForm()) {
            return;
        }
        
        this.isCreating = true;
        
        const dataToSend = {
            entreprise: this.newCandidature.entreprise.trim(),
            poste: this.newCandidature.poste.trim(),
            lettreGeneree: this.newCandidature.lettreGeneree?.trim() || '',
            contrat: this.newCandidature.contrat,
            salaireMin: this.newCandidature.salaireMin,
            salaireMax: this.newCandidature.salaireMax,
            devise: this.newCandidature.devise,
            dateDisponibilite: this.newCandidature.dateDisponibilite,
            preavis: this.newCandidature.preavis,
            acceptContact: this.newCandidature.acceptContact,
            competences: this.newCandidature.competences
        };
        
        this.apiService.creerCandidature(dataToSend).subscribe({
            next: () => {
                this.closeCreateModal();
                this.loadData();
                this.isCreating = false;
                alert('Candidature envoyée avec succès !');
            },
            error: (err) => {
                console.error('Erreur:', err);
                alert('Erreur lors de la création');
                this.isCreating = false;
            }
        });
    }

    // ==================== UPDATE ====================
    
    openEditModal(candidature: any): void {
        this.editingCandidature = { ...candidature };
        
        // Initialiser les champs supplémentaires s'ils n'existent pas
        this.editingCandidature.contrat = this.editingCandidature.contrat || 'CDI';
        this.editingCandidature.salaireMin = this.editingCandidature.salaireMin || null;
        this.editingCandidature.salaireMax = this.editingCandidature.salaireMax || null;
        this.editingCandidature.devise = this.editingCandidature.devise || '€';
        this.editingCandidature.dateDisponibilite = this.editingCandidature.dateDisponibilite || '';
        this.editingCandidature.preavis = this.editingCandidature.preavis || '';
        this.editingCandidature.acceptContact = this.editingCandidature.acceptContact || false;
        this.editingCandidature.competences = this.editingCandidature.competences || [];
        
        this.editSelectedCVName = '';
        this.editSelectedLMName = '';
        this.editSkillInput = '';
        this.editErrors = { entreprise: '', poste: '' };
        this.showEditModal = true;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingCandidature = null;
        this.editErrors = { entreprise: '', poste: '' };
    }

    updateCandidature(): void {
        if (!this.validateEditForm()) {
            return;
        }
        
        this.isUpdating = true;
        
        const dataToSend = {
            entreprise: this.editingCandidature.entreprise.trim(),
            poste: this.editingCandidature.poste.trim(),
            lettreGeneree: this.editingCandidature.lettreGeneree?.trim() || '',
            contrat: this.editingCandidature.contrat,
            salaireMin: this.editingCandidature.salaireMin,
            salaireMax: this.editingCandidature.salaireMax,
            devise: this.editingCandidature.devise,
            dateDisponibilite: this.editingCandidature.dateDisponibilite,
            preavis: this.editingCandidature.preavis,
            acceptContact: this.editingCandidature.acceptContact,
            competences: this.editingCandidature.competences
        };
        
        this.apiService.modifierCandidature(this.editingCandidature.id, dataToSend).subscribe({
            next: () => {
                this.closeEditModal();
                this.loadData();
                this.isUpdating = false;
                alert('Candidature modifiée avec succès !');
            },
            error: (err) => {
                console.error('Erreur:', err);
                alert('Erreur lors de la modification');
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
                    alert('Candidature supprimée');
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



// Ajouter cette méthode
calculerStatsPersonnelles(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Candidatures du mois
    this.candidaturesCeMois = this.candidatures.filter(c => {
        const date = new Date(c.dateEnvoi);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    // Entretiens obtenus
    this.entretiensObtenus = this.candidatures.filter(c => c.statut === 'ENTRETIEN').length;
    
    // Vues par recruteurs (simulé pour l'instant)
    this.vuesRecruteurs = Math.floor(Math.random() * 50) + 10;
}

chargerAlertes(): void {
    this.alertes = [];
    
    // Alerte 1: Si beaucoup de candidatures en attente
    if (this.stats.enAttente > 5) {
        this.alertes.push({
            type: 'warning',
            icon: 'ri-alert-line',
            titre: 'Candidatures en attente',
            message: `Vous avez ${this.stats.enAttente} candidatures en attente de réponse. Pensez à relancer les recruteurs après 2 semaines.`,
            bouton: 'Voir conseils',
            action: 'relancer'
        });
    }
    
    // Alerte 2: Si des candidatures acceptées
    if (this.stats.acceptees > 0) {
        this.alertes.push({
            type: 'success',
            icon: 'ri-checkbox-circle-line',
            titre: 'Félicitations !',
            message: `Vous avez ${this.stats.acceptees} candidature(s) acceptée(s). Préparez-vous pour la prochaine étape.`,
            bouton: 'Préparer entretien',
            action: 'entretien'
        });
    }
    
    // Alerte 3: Si aucune candidature
    if (this.candidatures.length === 0) {
        this.isNewCandidate = true;
        this.alertes.push({
            type: 'info',
            icon: 'ri-lightbulb-line',
            titre: 'Commencez votre recherche',
            message: 'Votre profil est prêt ! Découvrez les offres qui correspondent à vos compétences.',
            bouton: 'Voir les offres',
            action: 'offres'
        });
    }
    
    // Alerte 4: Si le profil est incomplet
    if (this.profilIncomplet()) {
        this.alertes.push({
            type: 'warning',
            icon: 'ri-user-settings-line',
            titre: 'Profil incomplet',
            message: 'Complétez votre profil pour augmenter vos chances d\'être contacté par les recruteurs.',
            bouton: 'Compléter profil',
            action: 'profil'
        });
    }
    
    // Alerte 5: Conseil personnalisé
    if (this.stats.refusees > 2) {
        this.alertes.push({
            type: 'info',
            icon: 'ri-question-line',
            titre: 'Besoin d\'aide ?',
            message: 'Plusieurs de vos candidatures ont été refusées. Souhaitez-vous des conseils pour améliorer votre CV ?',
            bouton: 'Améliorer mon CV',
            action: 'cv'
        });
    }
}

profilIncomplet(): boolean {
    // Vérifier si le profil est incomplet
    // À adapter selon votre logique
    return false;
}

actionAlerte(alerte: any): void {
    switch(alerte.action) {
        case 'relancer':
            alert('Conseils : Relancez les recruteurs par email ou téléphone après 2 semaines.');
            break;
        case 'entretien':
            alert('Préparez-vous : Renseignez-vous sur l\'entreprise, préparez vos questions.');
            break;
        case 'offres':
            this.router.navigate(['/candidates-dashboard/bookmarks']);
            break;
        case 'profil':
            this.router.navigate(['/candidates-dashboard/my-profile']);
            break;
        case 'cv':
            alert('Conseils : Mettez en avant vos réalisations quantifiables, utilisez des mots-clés du secteur.');
            break;
        default:
            break;
    }
}

// ==================== ACTIONS RAPIDES CANDIDAT ====================
/*
// Télécharger le CV
telechargerMonCV(): void {
    // Vérifier si un CV existe
    const cvUrl = localStorage.getItem('cvUrl');
    const cvName = localStorage.getItem('cvName');
    
    if (cvUrl) {
        // Si CV existe, le télécharger
        const link = document.createElement('a');
        link.href = cvUrl;
        link.download = cvName || 'mon-cv.pdf';
        link.click();
        this.showMessage('Téléchargement du CV en cours...', 'success');
    } else {
        // Si pas de CV, proposer d'en uploader un
        if (confirm('Vous n\'avez pas encore de CV. Voulez-vous en uploader un maintenant ?')) {
            this.uploaderCV();
        }
    }
}

// Uploader un CV
uploaderCV(): void {
    // Créer un input file invisible
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    
    input.onchange = (event: any) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 5 Mo');
                return;
            }
            
            // Simuler l'upload (à remplacer par appel API)
            const reader = new FileReader();
            reader.onload = (e: any) => {
                localStorage.setItem('cvUrl', e.target.result);
                localStorage.setItem('cvName', file.name);
                this.showMessage(`CV "${file.name}" téléchargé avec succès !`, 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Générer une lettre de motivation
genererLettre(): void {
    // Ouvrir un modal ou un formulaire pour générer la lettre
    const entreprise = prompt('Pour quelle entreprise souhaitez-vous générer une lettre ?');
    const poste = prompt('Pour quel poste ?');
    
    if (entreprise && poste) {
        const lettre = this.genererContenuLettre(entreprise, poste);
        
        // Sauvegarder la lettre
        localStorage.setItem('lettreGeneree', lettre);
        
        // Afficher la lettre dans un modal ou télécharger
        if (confirm('Lettre générée ! Voulez-vous la télécharger ?')) {
            this.telechargerLettre(lettre, entreprise, poste);
        } else {
            // Copier dans le presse-papier
            navigator.clipboard.writeText(lettre);
            this.showMessage('Lettre copiée dans le presse-papier !', 'success');
        }
    }
}

// Générer le contenu de la lettre
genererContenuLettre(entreprise: string, poste: string): string {
    const date = new Date().toLocaleDateString('fr-FR');
    const nom = localStorage.getItem('userName') || 'Cher recruteur';
    
    return `
${date}

Objet : Candidature pour le poste de ${poste}

${nom},

Je me permets de vous adresser ma candidature pour le poste de ${poste} au sein de votre entreprise ${entreprise}.

Fort de mon expérience et de mes compétences, je suis convaincu de pouvoir contribuer activement au développement de vos projets. Passionné par ce domaine, je serais ravi de mettre mes compétences au service de votre entreprise.

Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail ma motivation et mes qualifications.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${nom}
    `;
}

// Télécharger la lettre
telechargerLettre(contenu: string, entreprise: string, poste: string): void {
    const blob = new Blob([contenu], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lettre_motivation_${entreprise}_${poste}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    this.showMessage('Lettre téléchargée !', 'success');
}

// Analyser le profil
analyserProfil(): void {
    // Récupérer les données du profil
    const competences = JSON.parse(localStorage.getItem('competences') || '[]');
    const experience = localStorage.getItem('experience') || '0';
    const niveauEtude = localStorage.getItem('niveauEtude') || 'Non renseigné';
    
    // Calculer le score
    let score = 0;
    let conseils = [];
    
    // Score par compétences
    if (competences.length >= 3) {
        score += 30;
    } else {
        conseils.push(`Ajoutez ${3 - competences.length} compétence(s) à votre profil pour augmenter votre visibilité.`);
    }
    
    // Score par expérience
    const experienceAnnee = parseInt(experience);
    if (experienceAnnee >= 3) {
        score += 40;
    } else if (experienceAnnee >= 1) {
        score += 25;
        conseils.push('Ajoutez des détails sur vos réalisations professionnelles.');
    } else {
        conseils.push('Mettez en avant vos stages et projets personnels.');
    }
    
    // Score par niveau d'étude
    if (niveauEtude !== 'Non renseigné') {
        score += 30;
    } else {
        conseils.push('Complétez votre niveau d\'étude.');
    }
    
    // Afficher les résultats
    this.afficherAnalyseProfil(score, conseils);
}

// Afficher l'analyse du profil
afficherAnalyseProfil(score: number, conseils: string[]): void {
    let message = `📊 Analyse de votre profil\n\n`;
    message += `Score global: ${score}/100\n\n`;
    
    if (score >= 80) {
        message += `✅ Excellent profil ! Vous êtes prêt(e) à postuler.`;
    } else if (score >= 50) {
        message += `⚠️ Bon profil, voici quelques conseils pour l'améliorer :\n`;
        conseils.forEach(c => message += `\n• ${c}`);
    } else {
        message += `📝 Votre profil mérite d'être enrichi :\n`;
        conseils.forEach(c => message += `\n• ${c}`);
        message += `\n\n💡 Complétez votre profil pour augmenter vos chances de 40% !`;
    }
    
    alert(message);
    
    // Proposer d'aller compléter le profil
    if (score < 80) {
        if (confirm('Voulez-vous compléter votre profil maintenant ?')) {
            this.router.navigate(['/candidates-dashboard/my-profile']);
        }
    }
}            */

// Montrer un message temporaire
showMessage(msg: string, type: string): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
        this.message = '';
    }, 3000);
}


// Ouvrir le modal
openCVModal(): void {
    this.loadCVData();
    this.showCVModal = true;
}

// Fermer le modal
closeCVModal(): void {
    this.showCVModal = false;
}

// Charger les données du CV
loadCVData(): void {
    this.cvUrl = localStorage.getItem('cvUrl') || '';
    this.cvName = localStorage.getItem('cvName') || '';
    this.cvDate = localStorage.getItem('cvDate') || new Date().toLocaleDateString();
    console.log('CV chargé:', { url: !!this.cvUrl, name: this.cvName });
}

// Ouvrir le sélecteur de fichier
openFileSelector(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = (event: any) => this.handleFileSelect(event);
    input.click();
}

// Gérer la sélection de fichier
handleFileSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Fichier sélectionné:', file.name, file.size);
    
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
        // Fermer le modal pour forcer le rechargement
        this.closeCVModal();
        setTimeout(() => this.openCVModal(), 100);
    };
    reader.onerror = () => {
        alert('Erreur lors du téléchargement du fichier');
    };
    reader.readAsDataURL(file);
}

// Télécharger le CV
telechargerCV(): void {
    if (this.cvUrl) {
        const link = document.createElement('a');
        link.href = this.cvUrl;
        link.download = this.cvName || 'mon-cv.pdf';
        link.click();
        this.showMessage('Téléchargement du CV...', 'success');
    }
}

// Remplacer le CV
uploadNewCV(): void {
    this.openFileSelector();
}

// Supprimer le CV
supprimerCV(): void {
    if (confirm('Voulez-vous vraiment supprimer votre CV ?')) {
        localStorage.removeItem('cvUrl');
        localStorage.removeItem('cvName');
        localStorage.removeItem('cvDate');
        this.loadCVData();
        this.showMessage('CV supprimé avec succès', 'success');
        // Fermer le modal pour forcer le rechargement
        this.closeCVModal();
        setTimeout(() => this.openCVModal(), 100);
    }
}

// ==================== MÉTHODES LETTRE ====================
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

Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail ma motivation et mes qualifications.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${nom}
    `;
}

telechargerLettreGeneree(): void {
    if (this.lettreGeneree) {
        const blob = new Blob([this.lettreGeneree], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lettre_motivation_${this.lettreData.entreprise}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        this.showMessage('Lettre téléchargée !', 'success');
    }
}

// ==================== MÉTHODES ANALYSE ====================
openAnalyseModal(): void {
    this.analyserProfil();
    this.showAnalyseModal = true;
}

closeAnalyseModal(): void {
    this.showAnalyseModal = false;
}

analyserProfil(): void {
    // Récupérer les données du profil
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
    console.log('🔍 showViewer =', this.showViewer);
    console.log('🔍 cvUrl =', this.cvUrl ? 'Présent' : 'Absent');
    console.log('🔍 isPdf =', this.isPdf());
}

isPdf(): boolean {
    const result = this.cvName?.toLowerCase().endsWith('.pdf');
    console.log('isPdf() =', result, 'cvName =', this.cvName);
    return result;
}

getSafeUrl(url: string): string {
    return url;
}






// Ouvrir le PDF dans un nouvel onglet
openInNewTab(): void {
    if (this.cvUrl) {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`
                <html>
                    <head>
                        <title>${this.cvName || 'CV'}</title>
                        <style>
                            body { margin: 0; padding: 0; }
                            embed, iframe { width: 100%; height: 100vh; border: none; }
                        </style>
                    </head>
                    <body>
                        <embed src="${this.cvUrl}" type="application/pdf" width="100%" height="100%">
                    </body>
                </html>
            `);
        }
    }
}

// Calculer la taille approximative du fichier
getFileSize(): string {
    if (!this.cvUrl) return '0 KB';
    // Estimer la taille à partir de la longueur de l'URL base64
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
    
    // Appel API (à remplacer par ton endpoint)
    this.apiService.subscribeNewsletter(this.newsletterEmail).subscribe({
        next: () => {
            alert('✅ Inscription réussie ! Vous recevrez nos alertes');
            this.newsletterEmail = '';
            this.isSubscribing = false;
        },
        error: (err) => {
            console.error('Erreur inscription:', err);
            alert('Une erreur est survenue');
            this.isSubscribing = false;
        }
    });
}


}