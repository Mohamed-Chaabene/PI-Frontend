import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

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
    
    // États
    isCreating = false;
    isUpdating = false;
    
    selectedDocument: any = null;
    editingDocument: any = null;
    

    // ==================== APERÇU DU DOCUMENT GÉNÉRÉ ====================
showPreviewModal: boolean = false;
generatedDocument: {
    nom: string;
    type: string;
    contenu: string;
} | null = null;

    // Type de document sélectionné pour le formulaire
    selectedType: string = 'CV';
    types = ['CV', 'LETTRE_DE_MOTIVATION', 'PORTFOLIO', 'AUTRE'];
    
    // ==================== FORMULAIRE CV ====================
    // Ajoute ces variables avec les autres dans cvData
cvData = {
    nom: '',
    prenom: '',
    titre: '',
    email: '',
    telephone: '',
    adresse: '',
    dateNaissance: '',
    photo: '',           // contiendra le Base64
    photoName: '',       // nom du fichier (optionnel)
    experiences: [] as any[],
    formations: [] as any[],
    competences: [] as string[],
    langues: [] as any[],
    centresInteret: [] as string[],
    profil: ''
};

// ====================== NOUVELLES MÉTHODES ======================

// Méthode appelée quand l'utilisateur sélectionne une photo
onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
        alert("Veuillez sélectionner une image (JPG, PNG, etc.)");
        return;
    }

    const reader = new FileReader();
    
    reader.onload = (e: any) => {
        // Convertir l'image en Base64
        this.cvData.photo = e.target.result;        // Base64 complet (data:image/...)
        this.cvData.photoName = file.name;
    };

    reader.readAsDataURL(file);
}
    
    // Formulaire expérience
    newExperience = { poste: '', entreprise: '', periode: '', description: '' };
    
    // Formulaire formation
    newFormation = { diplome: '', institution: '', annee: '', description: '' };
    
    // Formulaire langue
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

    constructor(private apiService: ApiService) {}

    ngOnInit(): void {
        this.loadDocuments();
    }

    loadDocuments(): void {
        this.isLoading = true;
        this.apiService.getAllDocuments().subscribe({
            next: (data) => {
                this.documents = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erreur:', err);
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
    // Reset CV
    this.cvData = {
        nom: '',
        prenom: '',
        titre: '',
        email: '',
        telephone: '',
        adresse: '',
        dateNaissance: '',
        photo: '',           // Important : vider l'image Base64
        photoName: '',       // Important : vider le nom du fichier
        experiences: [],
        formations: [],
        competences: [],
        langues: [],
        centresInteret: [],
        profil: ''
    };

    // Reset Lettre
    this.lettreData = { 
        entreprise: '', 
        poste: '', 
        message: '', 
        prenom: '', 
        nom: '' 
    };

    // Reset Portfolio
    this.portfolioData = { 
        titre: '', 
        description: '', 
        technologies: [], 
        lien: '', 
        annee: '' 
    };

    // Reset Autre
    this.autreData = { 
        titre: '', 
        contenu: '' 
    };
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


    // ==================== GÉNÉRATION AVEC IA (SIMULÉE) ====================
    genererAIConstenu(): string {
        switch(this.selectedType) {
            case 'CV':
                return this.genererCV();
            case 'LETTRE_DE_MOTIVATION':
                return this.genererLettre();
            case 'PORTFOLIO':
                return this.genererPortfolio();
            default:
                return this.autreData.contenu;
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
            <p>${exp.description || 'Description de l\'expérience.'}</p>
        </div>
    `).join('');

    const formationsHTML = this.cvData.formations.map(formation => `
        <div class="education">
            <div class="education-header">
                <strong>${formation.diplome}</strong><br>
                <span class="institution">${formation.institution}</span>
            </div>
            <span class="period">${formation.annee || ''}</span>
            <p>${formation.description || ''}</p>
        </div>
    `).join('');

    const competencesHTML = this.cvData.competences.map(skill => 
        `<li>${skill}</li>`
    ).join('');

    const languesHTML = this.cvData.langues.map(l => 
        `<li><strong>${l.langue}</strong> - ${l.niveau}</li>`
    ).join('');

    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>CV - ${fullName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;600;700&display=swap');

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Arial', sans-serif;
                    background: #f4f4f4;
                    padding: 30px;
                    line-height: 1.5;
                }

                .cv {
                    max-width: 950px;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.15);
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    min-height: 1100px;
                }

                /* ==================== COLONNE GAUCHE ==================== */
                .left-column {
                    background: #1e2a44;
                    color: white;
                    padding: 40px 25px;
                }

                .photo {
                    width: 170px;
                    height: 170px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 6px solid #ffffff;
                    margin-bottom: 25px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }

                .left-column h1 {
                    font-size: 26px;
                    margin-bottom: 5px;
                }

                .left-column .title {
                    font-size: 15px;
                    color: #a0c4ff;
                    margin-bottom: 25px;
                }

                .left-column .contact-info {
                    margin-bottom: 35px;
                    font-size: 13.5px;
                }

                .left-column .contact-info p {
                    margin-bottom: 8px;
                }

                .left-column h2 {
                    font-size: 16px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #4a6da7;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                    color: #a0c4ff;
                }

                .skills-list, .languages-list {
                    list-style: none;
                }

                .skills-list li, .languages-list li {
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                /* ==================== COLONNE DROITE ==================== */
                .right-column {
                    padding: 45px 40px;
                    background: white;
                }

                .right-column h2 {
                    font-size: 18px;
                    color: #1e2a44;
                    border-bottom: 3px solid #1e2a44;
                    padding-bottom: 8px;
                    margin-bottom: 20px;
                }

                .summary {
                    font-size: 14.5px;
                    margin-bottom: 35px;
                    color: #333;
                }

                .experience, .education {
                    margin-bottom: 28px;
                }

                .experience-header, .education-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .experience-header strong, .education-header strong {
                    font-size: 16px;
                }

                .company, .institution {
                    color: #1e2a44;
                    font-weight: 600;
                }

                .period {
                    color: #555;
                    font-size: 13.5px;
                }

                .description {
                    font-size: 14px;
                    color: #444;
                    margin-top: 6px;
                }

                @media print {
                    body { background: white; padding: 0; }
                    .cv { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="cv">
                <!-- Colonne Gauche -->
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
                </div>

                <!-- Colonne Droite -->
                <div class="right-column">
                    <h2>Summary</h2>
                    <p class="summary">
                        ${this.cvData.profil || 'Professionnel motivé avec une solide expérience en développement et une forte capacité d\'adaptation.'}
                    </p>

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
                body {
                    font-family: 'Segoe UI', 'Poppins', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px;
                }
                .letter-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .letter {
                    background: white;
                    border-radius: 24px;
                    padding: 48px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }
                .header {
                    text-align: right;
                    margin-bottom: 48px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
                }
                .header .name {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2d3748;
                }
                .header .date {
                    color: #718096;
                    margin-top: 8px;
                }
                .content p {
                    margin-bottom: 20px;
                    line-height: 1.6;
                    color: #4a5568;
                }
                .subject {
                    font-weight: 600;
                    color: #667eea;
                    margin-bottom: 24px;
                    font-size: 18px;
                }
                .signature {
                    margin-top: 48px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .letter { box-shadow: none; padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="letter-container">
                <div class="letter">
                    <div class="header">
                        <div class="name">${nomComplet}</div>
                        <div class="date">${date}</div>
                    </div>
                    <div class="content">
                        <div class="subject">Objet : Candidature pour le poste de ${this.lettreData.poste}</div>
                        <p>Madame, Monsieur,</p>
                        <p>${this.lettreData.message || `Je me permets de vous adresser ma candidature pour le poste de ${this.lettreData.poste} au sein de votre entreprise ${this.lettreData.entreprise}. Passionné par ce domaine, je suis convaincu de pouvoir contribuer activement au développement de vos projets.`}</p>
                        <p>Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail ma motivation et mes compétences.</p>
                        <p>Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
                    </div>
                    <div class="signature">
                        <p>${nomComplet}</p>
                    </div>
                </div>
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
        ? `<a href="${this.portfolioData.lien}" target="_blank" class="project-btn">
             Voir le projet en ligne →
           </a>` 
        : '';

    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portfolio - ${this.portfolioData.titre || 'Mon Projet'}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Inter', system_ui, sans-serif;
                    background: #0f172a;
                    padding: 40px 20px;
                    color: #e2e8f0;
                }

                .portfolio {
                    max-width: 980px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
                }

                /* Header */
                .header {
                    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
                    padding: 90px 70px 70px;
                    text-align: center;
                    color: white;
                }

                .header h1 {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 48px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    letter-spacing: -1px;
                }

                .header .year {
                    font-size: 20px;
                    font-weight: 500;
                    opacity: 0.9;
                }

                /* Content */
                .content {
                    padding: 70px 80px;
                    color: #1e2937;
                }

                .section-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 12px;
                    position: relative;
                }

                .section-title::after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 0;
                    width: 60px;
                    height: 4px;
                    background: #6366f1;
                    border-radius: 4px;
                }

                .description {
                    font-size: 17.5px;
                    line-height: 1.85;
                    color: #334155;
                    margin-bottom: 55px;
                }

                .technologies {
                    margin-bottom: 60px;
                }

                .tech-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 14px;
                }

                .tech-tag {
                    background: #f1f5f9;
                    color: #1e40af;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    font-size: 15.5px;
                    font-weight: 500;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                }

                .project-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    background: #6366f1;
                    color: white;
                    padding: 16px 36px;
                    border-radius: 9999px;
                    font-size: 16.5px;
                    font-weight: 600;
                    text-decoration: none;
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
                    transition: all 0.3s ease;
                }

                .project-btn:hover {
                    background: #4f46e5;
                    transform: translateY(-4px);
                    box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4);
                }

                .footer {
                    text-align: center;
                    padding: 40px 0;
                    color: #64748b;
                    font-size: 14px;
                    border-top: 1px solid #e2e8f0;
                }

                @media (max-width: 768px) {
                    .header { padding: 60px 30px 50px; }
                    .content { padding: 50px 30px; }
                    .header h1 { font-size: 36px; }
                }

                @media print {
                    body { background: white; padding: 0; }
                    .portfolio { box-shadow: none; border-radius: 0; }
                }
            </style>
        </head>
        <body>
            <div class="portfolio">
                <!-- Header -->
                <div class="header">
                    <h1>${this.portfolioData.titre || 'Nom du Projet'}</h1>
                    ${this.portfolioData.annee ? `<div class="year">${this.portfolioData.annee}</div>` : ''}
                </div>

                <!-- Content -->
                <div class="content">
                    <div class="section-title">Description du projet</div>
                    <p class="description">
                        ${this.portfolioData.description || 'Description détaillée du projet non renseignée.'}
                    </p>

                    <div class="technologies">
                        <div class="section-title">Technologies utilisées</div>
                        <div class="tech-tags">
                            ${technologiesHTML || '<p>Aucune technologie renseignée.</p>'}
                        </div>
                    </div>

                    ${projectLink}
                </div>

                <div class="footer">
                    Portfolio généré avec l'application "Mes Documents"
                </div>
            </div>
        </body>
        </html>
    `;
}
    // ==================== CRÉATION ====================
 createDocument(): void {
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

    getWordCount(text: string): number {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    getCharCount(text: string): number {
        if (!text) return 0;
        return text.length;
    }



    saveGeneratedDocument(): void {
    if (!this.generatedDocument) {
        alert("Aucun document à sauvegarder");
        return;
    }

    this.isCreating = true;   // On réutilise isCreating pour le bouton "Sauvegarde..."

    const dataToSend: any = {
        nom: this.generatedDocument.nom,
        type: this.generatedDocument.type,
        contenu: this.generatedDocument.contenu,
        template: this.getTemplateName(),
        compatibleATS: true,
        ajouterPhoto: this.selectedType === 'CV' && !!this.cvData.photo  
    };

    this.apiService.creerDocument(dataToSend).subscribe({
        next: (savedDocument) => {
            console.log('Document sauvegardé avec succès:', savedDocument);
            
            this.closePreviewModal();
            this.loadDocuments();           // Recharger la liste
            this.isCreating = false;
            
            alert('Document sauvegardé avec succès !');
        },
        error: (err) => {
            console.error('Erreur lors de la sauvegarde:', err);
            alert('Erreur lors de la sauvegarde du document. Veuillez réessayer.');
            this.isCreating = false;
        }
    });
}

closePreviewModal(): void {
    this.showPreviewModal = false;
    this.generatedDocument = null;
}


}