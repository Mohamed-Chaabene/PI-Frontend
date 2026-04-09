import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
// Import Observable pour le return type
import { Observable } from 'rxjs';

@Component({
    selector: 'app-cd-documents',
    standalone: false,
    templateUrl: './cd-documents.component.html',
    styleUrls: ['./cd-documents.component.scss']
})
export class CdDocumentsComponent implements OnInit {

    documents: any[] = [];
    isLoading = true;
    errorMessage = '';

    // Modals
    showCreateModal = false;
    showEditModal = false;
    showViewModal = false;
    showPreviewModal: boolean = false;
    showAnalyseCVModal: boolean = false;
    showOptimiseModal: boolean = false;

    // États
    isCreating = false;
    isUpdating = false;
    isAnalysing: boolean = false;
    isOptimising: boolean = false;

    selectedDocument: any = null;
    editingDocument: any = null;

    // Aperçu du document généré
    generatedDocument: {
        nom: string;
        type: string;
        contenu: string;
    } | null = null;

    // Snapshot sauvegardé avant reset
    savedCvData: any = null;
    savedSelectedType: string = 'CV';
    savedLettreData: any = null;
    savedPortfolioData: any = null;
    savedAutreData: any = null;

    // Type de document
    selectedType: string = 'CV';
    types = ['CV', 'LETTRE_DE_MOTIVATION', 'PORTFOLIO', 'AUTRE'];

    // ==================== FORMULAIRE CV ====================
    cvData = {
        nom: '',
        prenom: '',
        titre: '',
        email: '',
        telephone: '',
        adresse: '',
        dateNaissance: '',
        photo: '',
        photoName: '',
        experiences: [] as any[],
        formations: [] as any[],
        competences: [] as string[],
        langues: [] as any[],
        centresInteret: [] as string[],
        profil: ''
    };

    newExperience = { poste: '', entreprise: '', periode: '', description: '' };
    newFormation = { diplome: '', institution: '', annee: '', description: '' };
    newLangue = { langue: '', niveau: '' };

    // ==================== FORMULAIRE LETTRE ====================
    lettreData = {
        entreprise: '',
        poste: '',
        message: '',
        prenom: '',
        nom: ''
    };

    // ==================== FORMULAIRE PORTFOLIO ====================
    portfolioData = {
        titre: '',
        description: '',
        technologies: [] as string[],
        lien: '',
        annee: ''
    };
    newTechnologie = '';

    // ==================== FORMULAIRE AUTRE ====================
    autreData = {
        titre: '',
        contenu: ''
    };

    // ==================== ANALYSE / OPTIMISATION ====================
    analyseResult: any = null;
    optimisationResult: any = null;
    offreEmploiInput: string = '';
    documentEnCours: any = null;

    // URL de l'API ML
    private readonly ML_API_URL = 'http://localhost:8000';

    constructor(private apiService: ApiService) {}

    ngOnInit(): void {
        this.loadDocuments();
    }

 loadDocuments(): void {
    this.isLoading = true;
    this.apiService.getMesDocuments().subscribe({  // ✅ getMesDocuments, pas getAllDocuments
        next: (data) => {
            this.documents = data;
            this.isLoading = false;
        },
        error: (err) => {
            console.error('Erreur chargement documents:', err);
            this.errorMessage = 'Erreur de chargement';
            this.isLoading = false;
        }
    });
}

    // ==================== CHANGEMENT DE TYPE ====================
    onTypeChange(type: string): void {
        this.selectedType = type;
    }

    // ==================== CRUD ====================
    openCreateModal(): void {
        this.selectedType = 'CV';
        this.resetForms();
        this.showCreateModal = true;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.resetForms();
    }

    resetForms(): void {
        this.cvData = {
            nom: '',
            prenom: '',
            titre: '',
            email: '',
            telephone: '',
            adresse: '',
            dateNaissance: '',
            photo: '',
            photoName: '',
            experiences: [],
            formations: [],
            competences: [],
            langues: [],
            centresInteret: [],
            profil: ''
        };
        this.newExperience = { poste: '', entreprise: '', periode: '', description: '' };
        this.newFormation = { diplome: '', institution: '', annee: '', description: '' };
        this.newLangue = { langue: '', niveau: '' };
        this.lettreData = { entreprise: '', poste: '', message: '', prenom: '', nom: '' };
        this.portfolioData = { titre: '', description: '', technologies: [], lien: '', annee: '' };
        this.autreData = { titre: '', contenu: '' };
    }

    // ==================== PHOTO ====================
    onPhotoSelected(event: any): void {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert("Veuillez sélectionner une image (JPG, PNG, etc.)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.cvData.photo = e.target.result;
            this.cvData.photoName = file.name;
        };
        reader.readAsDataURL(file);
    }

    // ==================== GESTION CV ====================
    addExperience(): void {
        if (this.newExperience.poste && this.newExperience.entreprise) {
            this.cvData.experiences.push({ ...this.newExperience });
            this.newExperience = { poste: '', entreprise: '', periode: '', description: '' };
        }
    }

    removeExperience(index: number): void {
        this.cvData.experiences.splice(index, 1);
    }

    addFormation(): void {
        if (this.newFormation.diplome && this.newFormation.institution) {
            this.cvData.formations.push({ ...this.newFormation });
            this.newFormation = { diplome: '', institution: '', annee: '', description: '' };
        }
    }

    removeFormation(index: number): void {
        this.cvData.formations.splice(index, 1);
    }

    addCompetence(competence: string): void {
        if (competence && competence.trim()) {
            this.cvData.competences.push(competence.trim());
        }
    }

    removeCompetence(index: number): void {
        this.cvData.competences.splice(index, 1);
    }

    addLangue(): void {
        if (this.newLangue.langue && this.newLangue.niveau) {
            this.cvData.langues.push({ ...this.newLangue });
            this.newLangue = { langue: '', niveau: '' };
        }
    }

    removeLangue(index: number): void {
        this.cvData.langues.splice(index, 1);
    }

    addCentreInteret(centre: string): void {
        if (centre && centre.trim()) {
            this.cvData.centresInteret.push(centre.trim());
        }
    }

    removeCentreInteret(index: number): void {
        this.cvData.centresInteret.splice(index, 1);
    }

    // ==================== GESTION PORTFOLIO ====================
    addTechnologie(tech: string): void {
        if (tech && tech.trim()) {
            this.portfolioData.technologies.push(tech.trim());
        }
    }

    removeTechnologie(index: number): void {
        this.portfolioData.technologies.splice(index, 1);
    }

    // ==================== CRÉATION ====================
    createDocument(): void {
        // Auto-save champs en cours si non encore ajoutés
        if (this.selectedType === 'CV') {
            if (this.newExperience.poste && this.newExperience.entreprise) {
                this.addExperience();
            }
            if (this.newFormation.diplome && this.newFormation.institution) {
                this.addFormation();
            }
            if (this.newLangue.langue && this.newLangue.niveau) {
                this.addLangue();
            }
        }

        // Snapshot COMPLET de toutes les données avant reset
        this.savedCvData = JSON.parse(JSON.stringify(this.cvData));
        this.savedSelectedType = this.selectedType;
        this.savedLettreData = JSON.parse(JSON.stringify(this.lettreData));
        this.savedPortfolioData = JSON.parse(JSON.stringify(this.portfolioData));
        this.savedAutreData = JSON.parse(JSON.stringify(this.autreData));

        const contenu = this.genererAIConstenu();
        const nom = this.getNomDocument();

        if (!nom) {
            alert('Veuillez remplir les informations nécessaires');
            return;
        }

        this.generatedDocument = {
            nom: nom,
            type: this.selectedType,
            contenu: contenu
        };

        this.closeCreateModal();
        this.showPreviewModal = true;
    }

    // ==================== SAUVEGARDE ====================
    saveGeneratedDocument(): void {
        if (!this.generatedDocument) {
            alert("Aucun document à sauvegarder");
            return;
        }

        this.isCreating = true;

        const cv = this.savedCvData || this.cvData;
        const type = this.savedSelectedType || this.selectedType;

        let dataToSend: any = {
            nom: this.generatedDocument.nom,
            type: this.generatedDocument.type,
            contenu: this.generatedDocument.contenu,
            template: this.getTemplateName(),
            compatibleATS: true,
            ajouterPhoto: type === 'CV' && !!cv.photo,
        };

        if (type === 'CV') {
            dataToSend = {
                ...dataToSend,
                prenom: cv.prenom || null,
                titre: cv.titre || null,
                email: cv.email || null,
                telephone: cv.telephone || null,
                adresse: cv.adresse || null,
                profil: cv.profil || null,
                photoName: cv.photoName || null,
                competences: JSON.stringify(cv.competences || []),
                langues: JSON.stringify(cv.langues || []),
                centresInteret: JSON.stringify(cv.centresInteret || []),
                experiences: JSON.stringify(cv.experiences || []),
                formations: JSON.stringify(cv.formations || []),
            };
        }

        console.log('Data envoyée au backend:', dataToSend);

        this.apiService.creerDocument(dataToSend).subscribe({
            next: (savedDocument) => {
                console.log('Document sauvegardé:', savedDocument);
                this.closePreviewModal();
                this.loadDocuments();
                this.isCreating = false;
                this.savedCvData = null;
                this.savedLettreData = null;
                this.savedPortfolioData = null;
                this.savedAutreData = null;
                alert('Document sauvegardé avec succès !');
            },
            error: (err) => {
                console.error('Erreur lors de la sauvegarde:', err);
                alert('Erreur lors de la sauvegarde du document.');
                this.isCreating = false;
            }
        });
    }

    closePreviewModal(): void {
        this.showPreviewModal = false;
        this.generatedDocument = null;
        this.savedCvData = null;
        this.savedLettreData = null;
        this.savedPortfolioData = null;
        this.savedAutreData = null;
    }

    getNomDocument(): string {
        switch(this.selectedType) {
            case 'CV':
                return `${this.cvData.prenom}_${this.cvData.nom}_CV` || 'Mon_CV';
            case 'LETTRE_DE_MOTIVATION':
                return `Lettre_${this.lettreData.entreprise}` || 'Lettre_motivation';
            case 'PORTFOLIO':
                return this.portfolioData.titre || 'Mon_Portfolio';
            default:
                return this.autreData.titre || 'Document';
        }
    }

    getTemplateName(): string {
        switch(this.selectedType) {
            case 'CV': return 'CV_Professionnel';
            case 'LETTRE_DE_MOTIVATION': return 'Lettre_Standard';
            case 'PORTFOLIO': return 'Portfolio_Moderne';
            default: return 'Standard';
        }
    }

    // ==================== GÉNÉRATION HTML ====================
    genererAIConstenu(): string {
        switch(this.selectedType) {
            case 'CV': return this.genererCV();
            case 'LETTRE_DE_MOTIVATION': return this.genererLettre();
            case 'PORTFOLIO': return this.genererPortfolio();
            default: return this.autreData.contenu;
        }
    }

    genererCV(): string {
        const fullName = `${this.cvData.prenom || ''} ${this.cvData.nom || ''}`.trim() || 'Votre Nom';
        const titre = this.cvData.titre || 'Ingénieur Informatique';
        const email = this.cvData.email || '';
        const telephone = this.cvData.telephone || '';
        const adresse = this.cvData.adresse || '';

        const experiencesHTML = this.cvData.experiences.map(exp => `
            <div class="experience">
                <div class="experience-header">
                    <div>
                        <strong>${exp.poste}</strong><br>
                        <span class="company">${exp.entreprise}</span>
                    </div>
                    <span class="period">${exp.periode || ''}</span>
                </div>
                <p>${exp.description || ''}</p>
            </div>
        `).join('');

        const formationsHTML = this.cvData.formations.map(formation => `
            <div class="education">
                <div class="education-header">
                    <div>
                        <strong>${formation.diplome}</strong><br>
                        <span class="institution">${formation.institution}</span>
                    </div>
                    <span class="period">${formation.annee || ''}</span>
                </div>
                <p>${formation.description || ''}</p>
            </div>
        `).join('');

        const competencesHTML = this.cvData.competences.map(skill =>
            `<li>${skill}</li>`
        ).join('');

        const languesHTML = this.cvData.langues.map(l =>
            `<li><strong>${l.langue}</strong> - ${l.niveau}</li>`
        ).join('');

        const centresHTML = this.cvData.centresInteret.map(c =>
            `<li>${c}</li>`
        ).join('');

        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>CV - ${fullName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px; line-height: 1.5; }
                    .cv { max-width: 950px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.15); display: grid; grid-template-columns: 280px 1fr; min-height: 1100px; }
                    .left-column { background: #1e2a44; color: white; padding: 40px 25px; }
                    .photo { width: 170px; height: 170px; border-radius: 50%; object-fit: cover; border: 6px solid #ffffff; margin-bottom: 25px; }
                    .left-column h1 { font-size: 26px; margin-bottom: 5px; }
                    .left-column .title { font-size: 15px; color: #a0c4ff; margin-bottom: 25px; }
                    .left-column .contact-info { margin-bottom: 35px; font-size: 13.5px; }
                    .left-column .contact-info p { margin-bottom: 8px; }
                    .left-column h2 { font-size: 16px; text-transform: uppercase; border-bottom: 2px solid #4a6da7; padding-bottom: 8px; margin-bottom: 15px; color: #a0c4ff; }
                    .skills-list, .languages-list, .interests-list { list-style: none; }
                    .skills-list li, .languages-list li, .interests-list li { margin-bottom: 10px; font-size: 14px; }
                    .right-column { padding: 45px 40px; background: white; }
                    .right-column h2 { font-size: 18px; color: #1e2a44; border-bottom: 3px solid #1e2a44; padding-bottom: 8px; margin-bottom: 20px; }
                    .summary { font-size: 14.5px; margin-bottom: 35px; color: #333; }
                    .experience, .education { margin-bottom: 28px; }
                    .experience-header, .education-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .company, .institution { color: #1e2a44; font-weight: 600; }
                    .period { color: #555; font-size: 13.5px; }
                    @media print { body { background: white; padding: 0; } .cv { box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="cv">
                    <div class="left-column">
                        ${this.cvData.photo ?
                            `<img src="${this.cvData.photo}" alt="Photo" class="photo">` :
                            `<div style="width:170px;height:170px;background:#334466;border-radius:50%;margin-bottom:25px;"></div>`
                        }
                        <h1>${fullName}</h1>
                        <div class="title">${titre}</div>
                        <div class="contact-info">
                            ${email ? `<p>✉️ ${email}</p>` : ''}
                            ${telephone ? `<p>📱 ${telephone}</p>` : ''}
                            ${adresse ? `<p>📍 ${adresse}</p>` : ''}
                        </div>
                        <h2>Compétences</h2>
                        <ul class="skills-list">
                            ${competencesHTML || '<li>Aucune compétence ajoutée</li>'}
                        </ul>
                        <h2>Langues</h2>
                        <ul class="languages-list">
                            ${languesHTML || '<li>Aucune langue renseignée</li>'}
                        </ul>
                        ${centresHTML ? `<h2>Centres d'intérêt</h2><ul class="interests-list">${centresHTML}</ul>` : ''}
                    </div>
                    <div class="right-column">
                        <h2>Profil</h2>
                        <p class="summary">${this.cvData.profil || 'Professionnel motivé avec une solide expérience en développement et une forte capacité d\'adaptation.'}</p>
                        <h2>Expérience Professionnelle</h2>
                        ${experiencesHTML || '<p>Aucune expérience renseignée.</p>'}
                        <h2>Formation</h2>
                        ${formationsHTML || '<p>Aucune formation renseignée.</p>'}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    genererLettre(): string {
        const date = new Date().toLocaleDateString('fr-FR');
        const nomComplet = `${this.lettreData.prenom} ${this.lettreData.nom}`.trim() || 'Candidat';
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Lettre de motivation - ${this.lettreData.entreprise}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; }
                    .letter { max-width: 800px; margin: 0 auto; background: white; border-radius: 24px; padding: 48px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
                    .header { text-align: right; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
                    .header .name { font-size: 20px; font-weight: 600; color: #2d3748; }
                    .header .date { color: #718096; margin-top: 8px; }
                    .content p { margin-bottom: 20px; line-height: 1.6; color: #4a5568; }
                    .subject { font-weight: 600; color: #667eea; margin-bottom: 24px; font-size: 18px; }
                    .signature { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
                    @media print { body { background: white; padding: 0; } .letter { box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="letter">
                    <div class="header">
                        <div class="name">${nomComplet}</div>
                        <div class="date">${date}</div>
                    </div>
                    <div class="content">
                        <div class="subject">Objet : Candidature pour le poste de ${this.lettreData.poste}</div>
                        <p>Madame, Monsieur,</p>
                        <p>${this.lettreData.message || `Je me permets de vous adresser ma candidature pour le poste de ${this.lettreData.poste} au sein de votre entreprise ${this.lettreData.entreprise}.`}</p>
                        <p>Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail ma motivation et mes compétences.</p>
                        <p>Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
                    </div>
                    <div class="signature"><p>${nomComplet}</p></div>
                </div>
            </body>
            </html>
        `;
    }

    genererPortfolio(): string {
        const technologiesHTML = this.portfolioData.technologies.map(tech =>
            `<span class="tech-tag">${tech}</span>`
        ).join('');
        const projectLink = this.portfolioData.lien
            ? `<a href="${this.portfolioData.lien}" target="_blank" class="project-btn">Voir le projet en ligne →</a>`
            : '';
        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>Portfolio - ${this.portfolioData.titre || 'Mon Projet'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; background: #0f172a; padding: 40px 20px; }
                    .portfolio { max-width: 980px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.25); }
                    .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 90px 70px 70px; text-align: center; color: white; }
                    .header h1 { font-size: 48px; font-weight: 700; margin-bottom: 12px; }
                    .content { padding: 70px 80px; color: #1e2937; }
                    .section-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: #0f172a; }
                    .description { font-size: 17px; line-height: 1.85; color: #334155; margin-bottom: 55px; }
                    .tech-tags { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 40px; }
                    .tech-tag { background: #f1f5f9; color: #1e40af; padding: 12px 24px; border-radius: 9999px; font-size: 15px; font-weight: 500; }
                    .project-btn { display: inline-block; background: #6366f1; color: white; padding: 16px 36px; border-radius: 9999px; font-size: 16px; font-weight: 600; text-decoration: none; }
                    @media print { body { background: white; padding: 0; } .portfolio { box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="portfolio">
                    <div class="header">
                        <h1>${this.portfolioData.titre || 'Mon Projet'}</h1>
                        ${this.portfolioData.annee ? `<div style="font-size:20px;opacity:0.9;">${this.portfolioData.annee}</div>` : ''}
                    </div>
                    <div class="content">
                        <div class="section-title">Description du projet</div>
                        <p class="description">${this.portfolioData.description || 'Description non renseignée.'}</p>
                        <div class="section-title">Technologies utilisées</div>
                        <div class="tech-tags">${technologiesHTML || '<p>Aucune technologie renseignée.</p>'}</div>
                        ${projectLink}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ==================== READ ====================
    viewDocument(doc: any): void {
        this.selectedDocument = doc;
        this.showViewModal = true;
    }

    closeViewModal(): void {
        this.showViewModal = false;
        this.selectedDocument = null;
    }

    // ==================== UPDATE ====================
    openEditModal(doc: any): void {
        this.editingDocument = { ...doc };
        this.showEditModal = true;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingDocument = null;
    }

    updateDocument(): void {
        if (!this.editingDocument.nom || !this.editingDocument.contenu) {
            alert('Veuillez remplir les informations');
            return;
        }
        this.isUpdating = true;
        this.apiService.modifierDocument(this.editingDocument.id, this.editingDocument).subscribe({
            next: () => {
                this.closeEditModal();
                this.loadDocuments();
                this.isUpdating = false;
                alert('Document modifié !');
            },
            error: (err) => {
                console.error('Erreur:', err);
                alert('Erreur lors de la modification');
                this.isUpdating = false;
            }
        });
    }

    // ==================== DELETE ====================
    deleteDocument(id: number): void {
        if (confirm('Supprimer ce document ?')) {
            this.apiService.supprimerDocument(id).subscribe({
                next: () => {
                    this.loadDocuments();
                    alert('Document supprimé');
                },
                error: (err) => console.error('Erreur:', err)
            });
        }
    }

    // ==================== TÉLÉCHARGEMENT ====================
    telechargerDocument(doc: any): void {
        if (doc && doc.contenu) {
            const blob = new Blob([doc.contenu], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.nom || doc.type}.html`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    // ==================== ANALYSE CV (API ML) ====================
    ouvrirAnalyseCV(doc: any): void {
        if (doc.type !== 'CV') {
            alert('L\'analyse est disponible uniquement pour les CVs');
            return;
        }
        
        this.documentEnCours = doc;
        this.analyseResult = null;
        this.isAnalysing = true;
        this.showAnalyseCVModal = true;

        // Appel direct à l'API ML Python
        this.analyserAvecML(doc.contenu).subscribe({
            next: (data) => {
                this.analyseResult = data;
                this.isAnalysing = false;
                console.log('Résultat ML:', data);
            },
            error: (err) => {
                console.error('Erreur API ML:', err);
                this.isAnalysing = false;
                
                // Fallback: utiliser l'ancienne méthode Spring Boot
                this.apiService.analyserCV(doc.id).subscribe({
                    next: (data) => {
                        this.analyseResult = data;
                        this.isAnalysing = false;
                    },
                    error: (err2) => {
                        console.error('Erreur fallback:', err2);
                        alert('Erreur lors de l\'analyse du CV');
                        this.isAnalysing = false;
                    }
                });
            }
        });
    }

    analyserAvecML(cvContent: string) {
        // Utiliser fetch directement pour appeler l'API Python
        return new Observable<any>(observer => {
            fetch(`${this.ML_API_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cv_content: cvContent })
            })
            .then(response => response.json())
            .then(data => {
                observer.next(data);
                observer.complete();
            })
            .catch(error => observer.error(error));
        });
    }

    optimiserAvecML(cvContent: string, jobOffer: string) {
        return new Observable<any>(observer => {
            fetch(`${this.ML_API_URL}/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    cv_content: cvContent,
                    job_offer: jobOffer 
                })
            })
            .then(response => response.json())
            .then(data => {
                observer.next(data);
                observer.complete();
            })
            .catch(error => observer.error(error));
        });
    }

    ouvrirOptimisation(doc: any): void {
        if (doc.type !== 'CV') {
            alert('L\'optimisation est disponible uniquement pour les CVs');
            return;
        }
        
        this.documentEnCours = doc;
        this.optimisationResult = null;
        this.offreEmploiInput = '';
        this.showOptimiseModal = true;
    }

    lancerOptimisation(): void {
        if (!this.offreEmploiInput.trim()) {
            alert('Veuillez coller une offre d\'emploi');
            return;
        }
        
        this.isOptimising = true;
        
        // Appel direct à l'API ML Python
        this.optimiserAvecML(this.documentEnCours.contenu, this.offreEmploiInput).subscribe({
            next: (data) => {
                this.optimisationResult = data;
                this.isOptimising = false;
                console.log('Résultat optimisation ML:', data);
            },
            error: (err) => {
                console.error('Erreur API ML:', err);
                this.isOptimising = false;
                
                // Fallback: utiliser l'ancienne méthode Spring Boot
                this.apiService.optimiserCV(this.documentEnCours.id, this.offreEmploiInput).subscribe({
                    next: (data) => {
                        this.optimisationResult = data;
                        this.isOptimising = false;
                    },
                    error: (err2) => {
                        console.error('Erreur fallback:', err2);
                        alert('Erreur lors de l\'optimisation');
                        this.isOptimising = false;
                    }
                });
            }
        });
    }

    // ==================== UTILITAIRES ====================
    getTypeLabel(type: string): string {
        switch(type) {
            case 'CV': return 'CV';
            case 'LETTRE_DE_MOTIVATION': return 'Lettre de motivation';
            case 'PORTFOLIO': return 'Portfolio';
            default: return type;
        }
    }

    getTypeIcon(type: string): string {
        switch(type) {
            case 'CV': return 'ri-file-pdf-line';
            case 'LETTRE_DE_MOTIVATION': return 'ri-mail-line';
            case 'PORTFOLIO': return 'ri-folder-image-line';
            default: return 'ri-file-line';
        }
    }

    getTypeColor(type: string): string {
        switch(type) {
            case 'CV': return '#e74c3c';
            case 'LETTRE_DE_MOTIVATION': return '#3498db';
            case 'PORTFOLIO': return '#9b59b6';
            default: return '#95a5a6';
        }
    }

    getScoreColor(score: number): string {
        if (score >= 70) return '#10b981';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    }

    getScoreLabel(score: number): string {
        if (score >= 70) return 'Excellent';
        if (score >= 40) return 'Moyen';
        return 'À améliorer';
    }

    getWordCount(text: string): number {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    getCharCount(text: string): number {
        if (!text) return 0;
        return text.length;
    }


    
}

