import { Component, OnInit } from '@angular/core';
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

    constructor(private apiService: ApiService) {}

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
}