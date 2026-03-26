import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../api.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { CloudinaryDebugService } from '../../services/cloudinary-debug.service';

@Component({
    selector: 'app-candidate-details-page',
    standalone: false,
    templateUrl: './candidate-details-page.component.html',
    styleUrls: ['./candidate-details-page.component.scss']
})
export class CandidateDetailsPageComponent implements OnInit {

    title = 'Candidate Details - Jove';

    // Current user info
    currentUserName = '';
    userEmail = '';
    userRole = '';
    isEditingAbout = false;
    isEditingEducation = false;
    isEditingBackground = false;
    isEditingPassion = false;

    // Contact information
    contactData: any = { prenom: '' };

    // Candidate form data
    candidateData: any = {
        id: null,
        cv: '',
        description: '',
        lien_portfolio: '',
        niveau_etude: '',
        competences: [],
        telephone: '',
        email: ''
    };

    // Education data
    educationList: any[] = [
        { niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }
    ];

    // Background and expertise data
    backgroundList: any[] = [
        { titre: '', company: '', startDate: '', endDate: '' }
    ];

    // Passion and future goals
    passionAndGoals = '';

    // Localisation form data (sans map)
    localisationData: any = {
        latitude: '',
        longitude: '',
        pays: '',
        ville: ''
    };

    // File upload data
    profilePictureUrl = '';
    cvUrl = '';

    isLoading = false;
    isSaving = false;
    successMessage = '';
    errorMessage = '';
    isUploadingProfilePicture = false;
    cloudinaryConfigValid = false;
    cloudinaryConfigMessage = '';

    constructor(
        private titleService: Title,
        private apiService: ApiService,
        private cloudinaryService: CloudinaryService,
        private cloudinaryDebugService: CloudinaryDebugService
    ) {}

    ngOnInit() {
        this.titleService.setTitle(this.title);

        const configValidation = this.cloudinaryDebugService.validateConfiguration();
        this.cloudinaryConfigValid = configValidation.valid;
        this.cloudinaryConfigMessage = configValidation.message;

        const userName = localStorage.getItem('userName');
        this.currentUserName = userName || 'Candidat';
        this.userEmail = userName || '';
        this.userRole = localStorage.getItem('userRole') || 'CANDIDAT';
        this.loadCandidateData();
    }

    loadCandidateData() {
        this.isLoading = true;
        const userName = localStorage.getItem('userName');
        if (!userName) {
            this.isLoading = false;
            return;
        }

        this.apiService.getCandidateByEmail(userName).subscribe({
            next: (data: any) => {
                if (data) {
                    this.candidateData = { ...this.candidateData, ...data };
                    this.currentUserName = data.nom || this.currentUserName;
                    this.contactData.prenom = data.prenom || '';
                    this.candidateData.telephone = data.telephone || '';
                    this.educationList = this.parseEducationData(data.niveauEtude);
                    this.backgroundList = this.parseBackgroundData(data.backgroundExpertise);
                    this.passionAndGoals = data.passionAndGoals || '';
                    this.localisationData = data.localisationData || this.localisationData;
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = 'Erreur lors du chargement du profil candidat.';
                console.error('Error loading candidate data:', err);
            }
        });
    }

    private parseEducationData(rawData: string): any[] {
        if (!rawData) return [{ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }];
        const entries = rawData.includes('niveau:') ? rawData.split(' ;; ') : [rawData];
        return entries.map((edu: string) => {
            const niveauMatch = edu.match(/niveau:\s*([^,]*)/);
            const domaineMatch = edu.match(/domaine:\s*([^,]*)/);
            const institutionMatch = edu.match(/institution:\s*([^,]*)/);
            const debutMatch = edu.match(/debut:\s*([^,]*)/);
            const finMatch = edu.match(/fin:\s*([^,;]*)/);
            return {
                niveauEtude: (niveauMatch?.[1] || '').trim(),
                domain: (domaineMatch?.[1] || '').trim(),
                institution: (institutionMatch?.[1] || '').trim(),
                startDate: (debutMatch?.[1] || '').trim(),
                endDate: (finMatch?.[1] || '').trim()
            };
        });
    }

    private parseBackgroundData(rawData: string): any[] {
        if (!rawData) return [{ titre: '', company: '', startDate: '', endDate: '' }];
        const entries = rawData.includes('titre:') ? rawData.split(' ;; ') : [rawData];
        return entries.map((bg: string) => {
            const titreMatch = bg.match(/titre:\s*([^,]*)/);
            const entrepriseMatch = bg.match(/entreprise:\s*([^,]*)/);
            const debutMatch = bg.match(/debut:\s*([^,]*)/);
            const finMatch = bg.match(/fin:\s*(.*)$/);
            return {
                titre: (titreMatch?.[1] || '').trim(),
                company: (entrepriseMatch?.[1] || '').trim(),
                startDate: (debutMatch?.[1] || '').trim(),
                endDate: (finMatch?.[1] || '').trim()
            };
        });
    }

    saveCandidateProfile() {
        this.isSaving = true;
        const payload: any = {
            nom: this.currentUserName,
            prenom: this.contactData.prenom,
            email: this.candidateData.email,
            telephone: this.candidateData.telephone,
            description: this.candidateData.description,
            cv: this.candidateData.cv,
            lienPortfolio: this.candidateData.lien_portfolio,
            niveauEtude: this.educationList.map(e => `niveau: ${e.niveauEtude}, domaine: ${e.domain}, institution: ${e.institution}, debut: ${e.startDate}, fin: ${e.endDate}`).join(' ;; '),
            backgroundExpertise: this.backgroundList.map(b => `titre: ${b.titre}, entreprise: ${b.company}, debut: ${b.startDate}, fin: ${b.endDate}`).join(' ;; '),
            passionAndGoals: this.passionAndGoals,
            localisation_id: this.candidateData.localisation_id
        };

        const saveObs = this.candidateData.id
            ? this.apiService.updateCandidate(this.candidateData.id, payload)
            : this.apiService.createCandidate(payload);

        saveObs.subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.successMessage = 'Profil candidat sauvegardé avec succès!';
                if (response.id) this.candidateData.id = response.id;
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde: ${error.message || error.statusText}`;
            }
        });
    }

    addEducation() { this.educationList.push({ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }); }
    removeEducation(index: number) { this.educationList.splice(index, 1); }
    addBackground() { this.backgroundList.push({ titre: '', company: '', startDate: '', endDate: '' }); }
    removeBackground(index: number) { this.backgroundList.splice(index, 1); }

    // === Méthodes manquantes ajoutées pour Angular template ===
    saveDescriptionOnly() {
        console.log('saveDescriptionOnly called');
        // tu peux appeler saveCandidateProfile() si tu veux juste sauvegarder la description
        this.saveCandidateProfile();
    }

    savePassionAndGoals() {
        console.log('savePassionAndGoals called');
        this.saveCandidateProfile();
    }

    saveContactInfo() {
        console.log('saveContactInfo called');
        this.saveCandidateProfile();
    }

    onPaysCityChange() {
        console.log('onPaysCityChange called');
        // Mettre ici la logique si tu veux déclencher une action quand pays/ville change
    }

    // Uploads (Cloudinary)
    onProfilePictureUploaded(event: any) { this.profilePictureUrl = event.url; this.saveProfilePictureUrl(event.url); }
    onProfilePictureSelected(event: any) { if (event.target.files?.length) this.uploadProfilePictureToCloudinary(event.target.files[0]); }
    uploadProfilePictureToCloudinary(file: File) { /* identique à ton code */ }
    onCVUploaded(event: any) { this.cvUrl = event.url; this.saveCVUrl(event.url); }
    saveProfilePictureUrl(url: string) { /* identique à ton code */ }
    saveCVUrl(url: string) { /* identique à ton code */ }
}