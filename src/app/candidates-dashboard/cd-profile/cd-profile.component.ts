import { Component, OnInit } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../api.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { ProfileUpdateService } from '../../services/profile-update.service';

@Component({
    selector: 'app-cd-profile',
    standalone: false,
    templateUrl: './cd-profile.component.html',
    styleUrls: ['./cd-profile.component.scss']
})
export class CdProfileComponent implements OnInit {
    currentUserName = 'Candidat';
    candidateData: any = {
        id: null,
        cv: '',
        description: '',
        lien_portfolio: '',
        niveau_etude: '',
        competences: [],
        telephone: '',
        email: '',
        profile_picture_url: '',
        localisation_id: null,
        nom: ''
    };
    localisationData: any = {
        id: null,
        latitude: '',
        longitude: '',
        pays: '',
        ville: ''
    };
    isViewingOtherCandidate = false;
    isEditingAbout = false;
    isEditingEducation = false;
    isEditingBackground = false;
    isEditingPassion = false;
    isDescriptionFormSubmitted = false;
    isEducationFormSubmitted = false;
    isBackgroundFormSubmitted = false;
    isPassionFormSubmitted = false;
    isContactFormSubmitted = false;
    isDescriptionSaved = false;
    isContactInfoSaved = false;
    isPassionSaved = false;
    passionAndGoals = '';
    contactData: any = {
        prenom: ''
    };
    educationList: any[] = [
        { niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }
    ];
    backgroundList: any[] = [
        { titre: '', company: '', startDate: '', endDate: '' }
    ];
    profilePictureUrl = '';
    defaultProfilePictureUrl = '/images/candidates/candidate1.jpg';
    cvUrl = '';
    mapZoom = 10;
    mapCenter = { lat: 36.8065, lng: 10.1615 };
    markerPosition: any = { lat: 36.8065, lng: 10.1615 };
    isLoading = false;
    isSaving = false;
    successMessage = '';
    errorMessage = '';
    geocodeTimer: any;
    isUploadingProfilePicture = false;

    constructor(
        private apiService: ApiService,
        private cloudinaryService: CloudinaryService,
        private profileUpdateService: ProfileUpdateService
    ) {}

    ngOnInit() {
        const storedUserName = localStorage.getItem('userName');
        this.currentUserName = storedUserName || 'Candidat';
        this.loadCandidateData();
    }

    get displayProfilePictureUrl(): string {
        return this.profilePictureUrl || this.candidateData.profile_picture_url || this.candidateData.profilePictureUrl || this.defaultProfilePictureUrl;
    }

    loadCandidateData(): void {
        this.isLoading = true;
        const userEmail = this.resolveCurrentUserEmail();

        if (!userEmail) {
            this.errorMessage = 'Email utilisateur introuvable. Reconnectez-vous puis réessayez.';
            this.isLoading = false;
            return;
        }

        this.apiService.getCandidateByEmail(userEmail).subscribe({
            next: (data: any) => {
                if (data) {
                    this.candidateData = { ...this.candidateData, ...data };
                    this.candidateData.id = data.id || this.candidateData.id;
                    this.candidateData.email = data.email || userEmail;
                    this.candidateData.description = data.description || '';
                    this.profilePictureUrl = data.profile_picture_url || '';
                    this.cvUrl = data.cv_url || '';
                    this.currentUserName = data.nom || this.currentUserName;
                    this.contactData.prenom = data.prenom || '';
                    this.candidateData.telephone = data.telephone || '';
                    this.isContactInfoSaved = !!(data.prenom || data.telephone);
                    this.passionAndGoals = data.passionAndGoals || '';
                    this.isPassionSaved = !!this.passionAndGoals;
                    this.educationList = this.parseEducationString(data.niveauEtude);
                    this.backgroundList = this.parseBackgroundString(data.backgroundExpertise);

                    if (data.localisation_id) {
                        this.apiService.getLocalisation(data.localisation_id).subscribe({
                            next: (locData: any) => {
                                if (locData) {
                                    this.localisationData = { ...this.localisationData, ...locData };
                                    if (locData.latitude && locData.longitude) {
                                        this.mapCenter = { lat: locData.latitude, lng: locData.longitude };
                                        this.markerPosition = { lat: locData.latitude, lng: locData.longitude };
                                    }
                                }
                                this.isLoading = false;
                            },
                            error: () => {
                                this.isLoading = false;
                            }
                        });
                    } else {
                        this.isLoading = false;
                    }
                    return;
                }
                this.isLoading = false;
            },
            error: (err) => {
                if (err?.status === 404) {
                    const minimalCandidate = {
                        email: userEmail,
                        nom: this.currentUserName || userEmail.split('@')[0],
                        prenom: '',
                        description: '',
                        telephone: '',
                        cv: '',
                        lien_portfolio: '',
                        niveauEtude: '',
                        competences: []
                    };
                    this.apiService.createCandidate(minimalCandidate).subscribe({
                        next: (response: any) => {
                            if (response?.id) {
                                this.candidateData = { ...this.candidateData, ...response, email: userEmail };
                                this.currentUserName = response.nom || this.currentUserName;
                                this.isLoading = false;
                            }
                        },
                        error: (createErr) => {
                            this.errorMessage = createErr?.error?.message || 'Erreur lors de la création du profil candidat.';
                            this.isLoading = false;
                        }
                    });
                    return;
                }
                this.errorMessage = 'Erreur lors du chargement des données du candidat.';
                this.isLoading = false;
            }
        });
    }

    private resolveCurrentUserEmail(): string {
        const storedEmail = String(localStorage.getItem('userEmail') || '').trim();
        if (storedEmail.includes('@')) {
            return storedEmail;
        }

        const userName = String(localStorage.getItem('userName') || '').trim();
        if (userName.includes('@')) {
            return userName;
        }

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const tokenEmail = String(decoded?.email || decoded?.sub || '').trim();
                if (tokenEmail.includes('@')) {
                    return tokenEmail;
                }
            } catch {
                // ignore invalid token
            }
        }
        return '';
    }

    private ensureCandidateId(onReady: () => void): void {
        if (this.candidateData?.id) {
            onReady();
            return;
        }

        const userEmail = this.resolveCurrentUserEmail();
        if (!userEmail) {
            this.errorMessage = 'Impossible de sauvegarder: email utilisateur introuvable. Reconnectez-vous.';
            return;
        }

        this.isSaving = true;
        this.apiService.getCandidateByEmail(userEmail).subscribe({
            next: (data: any) => {
                if (data?.id) {
                    this.candidateData = { ...this.candidateData, ...data, id: data.id, email: data.email || userEmail };
                    this.isSaving = false;
                    onReady();
                    return;
                }
                this.isSaving = false;
                this.errorMessage = 'Profil trouvé mais ID invalide. Rechargez la page.';
            },
            error: (err) => {
                if (err?.status !== 404) {
                    this.isSaving = false;
                    this.errorMessage = 'Erreur lors de la récupération du profil candidat.';
                    return;
                }
                const minimalCandidate = {
                    email: userEmail,
                    nom: this.currentUserName || userEmail.split('@')[0],
                    prenom: '',
                    description: this.candidateData.description || '',
                    telephone: this.candidateData.telephone || '',
                    cv: '',
                    lien_portfolio: '',
                    niveauEtude: '',
                    competences: []
                };
                this.apiService.createCandidate(minimalCandidate).subscribe({
                    next: (created: any) => {
                        if (created?.id) {
                            this.candidateData = { ...this.candidateData, ...created, id: created.id, email: created.email || userEmail };
                            this.isSaving = false;
                            onReady();
                            return;
                        }
                        this.isSaving = false;
                        this.errorMessage = 'Création du profil échouée: ID manquant dans la réponse.';
                    },
                    error: () => {
                        this.isSaving = false;
                        this.errorMessage = 'Erreur lors de la création automatique du profil candidat.';
                    }
                });
            }
        });
    }

    onProfilePictureSelected(event: any): void {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file: File = files[0];
            this.uploadProfilePictureToCloudinary(file);
        }
    }

    uploadProfilePictureToCloudinary(file: File): void {
        if (!file.type.startsWith('image/')) {
            this.errorMessage = 'Please select a valid image file';
            return;
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.errorMessage = 'File size must be less than 10MB';
            return;
        }

        this.isUploadingProfilePicture = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.cloudinaryService.uploadFile(file).subscribe({
            next: (response: any) => {
                this.isUploadingProfilePicture = false;
                if (response && response.secure_url) {
                    this.profilePictureUrl = response.secure_url;
                    this.saveProfilePictureUrl(response.secure_url);
                    this.successMessage = 'Profile picture uploaded successfully!';
                    setTimeout(() => this.successMessage = '', 3000);
                } else {
                    this.errorMessage = 'Upload response invalid. Missing secure_url.';
                }
            },
            error: (error: any) => {
                this.isUploadingProfilePicture = false;
                let errorMsg = 'Upload failed. Please try again.';
                if (error.status === 401) {
                    errorMsg = 'Upload preset authentication failed. Check your Cloudinary credentials.';
                } else if (error.status === 400) {
                    errorMsg = 'Invalid upload parameters. Check file format and size.';
                } else if (error.status === 403) {
                    errorMsg = 'Upload forbidden. Check your upload preset configuration.';
                } else if (error.error && error.error.error) {
                    errorMsg = `Upload error: ${error.error.error.message || error.error.error}`;
                } else if (error.message) {
                    errorMsg = `Upload failed: ${error.message}`;
                }
                this.errorMessage = errorMsg;
            }
        });
    }

    onCVUploaded(event: any): void {
        if (event?.url) {
            this.cvUrl = event.url;
            this.saveCVUrl(event.url);
        }
    }

    saveProfilePictureUrl(url: string): void {
        this.ensureCandidateId(() => {
            if (!this.candidateData.id) {
                this.errorMessage = 'Candidate ID not found';
                return;
            }
            this.isSaving = true;
            this.apiService.updateCandidate(this.candidateData.id, { profile_picture_url: url }).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.profileUpdateService.notifyProfilePictureUpdate(url);
                    this.successMessage = 'Profile picture saved successfully!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Error saving profile picture: ${error.message || error.statusText}`;
                }
            });
        });
    }

    saveCVUrl(url: string): void {
        this.ensureCandidateId(() => {
            if (!this.candidateData.id) {
                this.errorMessage = 'Candidate ID not found';
                return;
            }
            this.isSaving = true;
            this.apiService.updateCandidate(this.candidateData.id, { cv_url: url }).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.successMessage = 'CV saved successfully!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Error saving CV: ${error.message || error.statusText}`;
                }
            });
        });
    }

    saveDescriptionOnly(): void {
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            const descriptionPayload = { description: this.candidateData.description || '' };
            this.apiService.updateCandidate(this.candidateData.id, descriptionPayload).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.isDescriptionSaved = true;
                    this.successMessage = 'Description sauvegardée avec succès!';
                    this.isEditingAbout = false;
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la sauvegarde de la description: ${error.message || error.statusText}`;
                }
            });
        });
    }

    savePassionAndGoals(): void {
        if (!this.isPassionValid()) {
            this.errorMessage = 'Veuillez renseigner vos passions et objectifs (max 200 caractères).';
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            const passionPayload = { passionAndGoals: this.passionAndGoals || '' };
            this.apiService.updateCandidate(this.candidateData.id, passionPayload).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.isPassionSaved = true;
                    this.successMessage = 'Passions et objectifs sauvegardés avec succès!';
                    this.isEditingPassion = false;
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la sauvegarde des passions: ${error.message || error.statusText}`;
                }
            });
        });
    }

    deleteDescription(): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer votre description?')) {
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            this.apiService.updateCandidate(this.candidateData.id, { description: '' }).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.isDescriptionSaved = false;
                    this.candidateData.description = '';
                    this.successMessage = 'Description supprimée avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la suppression de la description: ${error.message || error.statusText}`;
                }
            });
        });
    }

    deleteAllEducation(): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer toute votre éducation?')) {
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            this.apiService.updateCandidate(this.candidateData.id, { niveauEtude: '' }).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.educationList = [{ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }];
                    this.successMessage = 'Éducation supprimée avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la suppression de l'éducation: ${error.message || error.statusText}`;
                }
            });
        });
    }

    deleteAllBackground(): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer tout votre historique professionnel?')) {
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            this.apiService.updateCandidate(this.candidateData.id, { backgroundExpertise: '' }).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.backgroundList = [{ titre: '', company: '', startDate: '', endDate: '' }];
                    this.successMessage = 'Historique professionnel supprimé avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la suppression de l'historique professionnel: ${error.message || error.statusText}`;
                }
            });
        });
    }

    deletePassionAndGoals(): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer vos passions et objectifs futurs?')) {
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            this.apiService.updateCandidate(this.candidateData.id, { passionAndGoals: '' }).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.isPassionSaved = false;
                    this.passionAndGoals = '';
                    this.successMessage = 'Passions et objectifs supprimés avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la suppression des passions: ${error.message || error.statusText}`;
                }
            });
        });
    }

    isDescriptionValid(): boolean {
        const value = (this.candidateData.description || '').trim();
        return value.length > 0 && value.length <= 60;
    }

    onDescriptionChange(): void {
        if ((this.candidateData.description || '').length > 60) {
            this.candidateData.description = (this.candidateData.description || '').substring(0, 60);
        }
    }

    isPrenomValid(): boolean {
        const value = (this.contactData.prenom || '').trim();
        return value.length > 0 && value.length <= 20;
    }

    onPrenomChange(): void {
        if ((this.contactData.prenom || '').length > 20) {
            this.contactData.prenom = (this.contactData.prenom || '').substring(0, 20);
        }
        this.isContactInfoSaved = false;
    }

    isTelephoneValid(): boolean {
        const value = (this.candidateData.telephone || '').trim();
        if (value.length === 0) {
            return false;
        }
        const phoneRegex = /^[0-9+\-\s()]*$/;
        return phoneRegex.test(value);
    }

    onTelephoneChange(): void {
        if (this.candidateData.telephone) {
            this.candidateData.telephone = this.candidateData.telephone.replace(/[^0-9+\-\s()]/g, '');
        }
        this.isContactInfoSaved = false;
    }

    saveContactInfo(): void {
        if (!this.isPrenomValid()) {
            this.errorMessage = 'Le prénom ne doit pas dépasser 20 caractères.';
            return;
        }
        if (!this.isTelephoneValid()) {
            this.errorMessage = 'Le téléphone doit contenir uniquement des chiffres et caractères spéciaux (+, -, espaces).';
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            const contactPayload = {
                prenom: this.contactData.prenom || '',
                telephone: this.candidateData.telephone || ''
            };
            this.apiService.updateCandidate(this.candidateData.id, contactPayload).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.isContactInfoSaved = true;
                    this.successMessage = 'Informations de contact sauvegardées avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la sauvegarde des informations: ${error.message || error.statusText}`;
                }
            });
        });
    }

    deleteContactInfo(): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer vos informations de contact?')) {
            return;
        }
        this.ensureCandidateId(() => {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';
            const contactPayload = {
                prenom: '',
                telephone: ''
            };
            this.apiService.updateCandidate(this.candidateData.id, contactPayload).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.isContactInfoSaved = false;
                    this.contactData.prenom = '';
                    this.candidateData.telephone = '';
                    this.successMessage = 'Informations de contact supprimées avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la suppression des informations: ${error.message || error.statusText}`;
                }
            });
        });
    }

    onPaysCityChange(): void {
        if (this.geocodeTimer) {
            clearTimeout(this.geocodeTimer);
        }
        this.geocodeTimer = setTimeout(() => {
            // Optional: place geocoding logic here if needed
        }, 500);
    }

    saveLocalisationInfo(): void {
        if (!this.candidateData.id) {
            this.errorMessage = 'Erreur: Candidat ID non trouvé. Veuillez d\'abord créer votre profil complet.';
            return;
        }
        if (!this.localisationData.latitude || !this.localisationData.longitude) {
            this.errorMessage = 'Erreur: Veuillez fournir les coordonnées (latitude et longitude).';
            return;
        }
        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';
        const localisationPayload = {
            pays: this.localisationData.pays || '',
            ville: this.localisationData.ville || '',
            latitude: this.localisationData.latitude,
            longitude: this.localisationData.longitude
        };
        const localisationId = this.candidateData.localisation_id;
        const saveLocalisationObs = localisationId
            ? this.apiService.updateLocalisation(localisationId, localisationPayload)
            : this.apiService.createLocalisation(localisationPayload);
        saveLocalisationObs.subscribe({
            next: (response: any) => {
                if (!localisationId && response?.id) {
                    this.apiService.updateCandidate(this.candidateData.id, { localisation_id: response.id }).subscribe({
                        next: () => {
                            this.candidateData.localisation_id = response.id;
                            this.localisationData.id = response.id;
                            this.isSaving = false;
                            this.successMessage = 'Localisation sauvegardée avec succès!';
                            setTimeout(() => this.successMessage = '', 3000);
                        },
                        error: (error) => {
                            this.isSaving = false;
                            this.errorMessage = `Erreur: ${error.message || error.statusText}`;
                        }
                    });
                } else {
                    this.isSaving = false;
                    this.successMessage = 'Localisation sauvegardée avec succès!';
                    setTimeout(() => this.successMessage = '', 3000);
                }
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde de la localisation: ${error.message || error.statusText}`;
            }
        });
    }

    deleteLocalisationInfo(): void {
        const localisationId = this.candidateData.localisation_id;
        if (!localisationId) {
            this.errorMessage = 'Aucune localisation à supprimer.';
            return;
        }
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette localisation?')) {
            return;
        }
        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.apiService.deleteLocalisation(localisationId).subscribe({
            next: () => {
                this.apiService.updateCandidate(this.candidateData.id, { localisation_id: null }).subscribe({
                    next: () => {
                        this.candidateData.localisation_id = null;
                        this.localisationData = { id: null, latitude: '', longitude: '', pays: '', ville: '' };
                        this.markerPosition = null;
                        this.isSaving = false;
                        this.successMessage = 'Localisation supprimée avec succès!';
                        setTimeout(() => this.successMessage = '', 3000);
                    },
                    error: (error) => {
                        this.isSaving = false;
                        this.errorMessage = `Erreur: ${error.message || error.statusText}`;
                    }
                });
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la suppression de la localisation: ${error.message || error.statusText}`;
            }
        });
    }

    saveCandidateProfile(): void {
        if (!this.candidateData.id) {
            this.errorMessage = 'Candidat introuvable. Veuillez actualiser pour créer un profil.';
            return;
        }
        const payload: any = {
            description: this.candidateData.description || '',
            passionAndGoals: this.passionAndGoals || '',
            niveauEtude: this.serializeEducation(this.educationList),
            backgroundExpertise: this.serializeBackground(this.backgroundList),
            prenom: this.contactData.prenom || '',
            telephone: this.candidateData.telephone || ''
        };
        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.apiService.updateCandidate(this.candidateData.id, payload).subscribe({
            next: () => {
                this.isSaving = false;
                this.successMessage = 'Profil candidat sauvegardé avec succès!';
                this.isEditingEducation = false;
                this.isEditingBackground = false;
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde du profil: ${error.message || error.statusText}`;
            }
        });
    }

    private parseEducationString(niveauEtude: string): any[] {
        if (!niveauEtude) {
            return [{ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }];
        }
        if (niveauEtude.includes('niveau:')) {
            return niveauEtude.split(' ;; ').map((edu: string) => {
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
        if (niveauEtude.includes(' / ')) {
            return niveauEtude.split(' ;; ').map((edu: string) => {
                const parts = edu.split(' / ');
                return {
                    niveauEtude: (parts[0] || '').trim(),
                    domain: (parts[1] || '').trim(),
                    institution: (parts[2] || '').trim(),
                    startDate: (parts[3] || '').trim().split('-')[0],
                    endDate: (parts[3] || '').trim().split('-')[1]
                };
            });
        }
        return [{ niveauEtude: niveauEtude, domain: '', institution: '', startDate: '', endDate: '' }];
    }

    private parseBackgroundString(backgroundExpertise: string): any[] {
        if (!backgroundExpertise) {
            return [{ titre: '', company: '', startDate: '', endDate: '' }];
        }
        if (backgroundExpertise.includes('titre:')) {
            return backgroundExpertise.split(' ;; ').map((bg: string) => {
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
        if (backgroundExpertise.includes(' / ')) {
            return backgroundExpertise.split(' ;; ').map((bg: string) => {
                const parts = bg.split(' / ');
                return {
                    titre: (parts[0] || '').trim(),
                    company: (parts[1] || '').trim(),
                    startDate: (parts[2] || '').trim().split('-')[0],
                    endDate: (parts[2] || '').trim().split('-')[1]
                };
            });
        }
        return [{ titre: backgroundExpertise, company: '', startDate: '', endDate: '' }];
    }

    private serializeEducation(list: any[]): string {
        const entries = list
            .filter((edu) => edu.niveauEtude || edu.domain || edu.institution || edu.startDate || edu.endDate)
            .map((edu) => {
                return `niveau:${edu.niveauEtude || ''}, domaine:${edu.domain || ''}, institution:${edu.institution || ''}, debut:${edu.startDate || ''}, fin:${edu.endDate || ''}`;
            });
        return entries.join(' ;; ');
    }

    private serializeBackground(list: any[]): string {
        const entries = list
            .filter((bg) => bg.titre || bg.company || bg.startDate || bg.endDate)
            .map((bg) => {
                return `titre:${bg.titre || ''}, entreprise:${bg.company || ''}, debut:${bg.startDate || ''}, fin:${bg.endDate || ''}`;
            });
        return entries.join(' ;; ');
    }

    onEducationFieldChange(edu: any, field: string): void {
        if (field === 'niveauEtude' && (edu.niveauEtude || '').length > 20) {
            edu.niveauEtude = (edu.niveauEtude || '').substring(0, 20);
        } else if (field === 'domain' && (edu.domain || '').length > 20) {
            edu.domain = (edu.domain || '').substring(0, 20);
        } else if (field === 'institution' && (edu.institution || '').length > 20) {
            edu.institution = (edu.institution || '').substring(0, 20);
        }
    }

    onEducationYearChange(edu: any): void {
        if (edu.startDate) {
            edu.startDate = String(edu.startDate).replace(/[^0-9]/g, '');
        }
        if (edu.endDate) {
            edu.endDate = String(edu.endDate).replace(/[^0-9]/g, '');
        }
    }

    isEducationYearsValid(edu: any): boolean {
        if (!edu.startDate || !edu.endDate) {
            return true;
        }
        return Number(edu.endDate) >= Number(edu.startDate);
    }

    isEducationListValid(): boolean {
        return this.educationList.every((edu: any) => {
            const isEmpty = !edu.niveauEtude && !edu.domain && !edu.institution && !edu.startDate && !edu.endDate;
            if (isEmpty) {
                return true;
            }
            if (!edu.niveauEtude || edu.niveauEtude.trim().length === 0 || edu.niveauEtude.length > 20) {
                return false;
            }
            if (!edu.domain || edu.domain.trim().length === 0 || edu.domain.length > 20) {
                return false;
            }
            if (!edu.institution || edu.institution.trim().length === 0 || edu.institution.length > 20) {
                return false;
            }
            if (!edu.startDate || !edu.endDate) {
                return false;
            }
            return this.isEducationYearsValid(edu);
        });
    }

    getEducationValidationError(): string {
        for (let i = 0; i < this.educationList.length; i++) {
            const edu = this.educationList[i];
            const isEmpty = !edu.niveauEtude && !edu.domain && !edu.institution && !edu.startDate && !edu.endDate;
            if (isEmpty) {
                continue;
            }
            if (!edu.niveauEtude || edu.niveauEtude.trim().length === 0) {
                return `Éducation ${i + 1}: Niveau d'Étude est requis`;
            }
            if (edu.niveauEtude.length > 20) {
                return `Éducation ${i + 1}: Niveau d'Étude dépasse 20 caractères`;
            }
            if (!edu.domain || edu.domain.trim().length === 0) {
                return `Éducation ${i + 1}: Domaine d'Étude est requis`;
            }
            if (edu.domain.length > 20) {
                return `Éducation ${i + 1}: Domaine d'Étude dépasse 20 caractères`;
            }
            if (!edu.institution || edu.institution.trim().length === 0) {
                return `Éducation ${i + 1}: Institution / Université est requis`;
            }
            if (edu.institution.length > 20) {
                return `Éducation ${i + 1}: Institution dépasse 20 caractères`;
            }
            if (!edu.startDate) {
                return `Éducation ${i + 1}: Année de Début est requis`;
            }
            if (!edu.endDate) {
                return `Éducation ${i + 1}: Année de Fin est requis`;
            }
            if (!this.isEducationYearsValid(edu)) {
                return `Éducation ${i + 1}: L'année de fin doit être supérieure ou égale à l'année de début`;
            }
        }
        return '';
    }

    addEducation(): void {
        this.educationList.push({ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' });
    }

    removeEducation(index: number): void {
        if (this.educationList.length > 1) {
            this.educationList.splice(index, 1);
        }
    }

    onBackgroundFieldChange(bg: any, field: string): void {
        if (field === 'titre' && (bg.titre || '').length > 20) {
            bg.titre = (bg.titre || '').substring(0, 20);
        } else if (field === 'company' && (bg.company || '').length > 20) {
            bg.company = (bg.company || '').substring(0, 20);
        }
    }

    onBackgroundYearChange(bg: any): void {
        if (bg.startDate) {
            bg.startDate = String(bg.startDate).replace(/[^0-9]/g, '');
        }
        if (bg.endDate) {
            bg.endDate = String(bg.endDate).replace(/[^0-9]/g, '');
        }
    }

    isBackgroundYearsValid(bg: any): boolean {
        if (!bg.startDate || !bg.endDate) {
            return true;
        }
        return Number(bg.endDate) >= Number(bg.startDate);
    }

    isBackgroundListValid(): boolean {
        return this.backgroundList.every((bg: any) => {
            const isEmpty = !bg.titre && !bg.company && !bg.startDate && !bg.endDate;
            if (isEmpty) {
                return true;
            }
            if (!bg.titre || bg.titre.trim().length === 0 || bg.titre.length > 20) {
                return false;
            }
            if (!bg.company || bg.company.trim().length === 0 || bg.company.length > 20) {
                return false;
            }
            if (!bg.startDate || !bg.endDate) {
                return false;
            }
            return this.isBackgroundYearsValid(bg);
        });
    }

    getBackgroundValidationError(): string {
        for (let i = 0; i < this.backgroundList.length; i++) {
            const bg = this.backgroundList[i];
            const isEmpty = !bg.titre && !bg.company && !bg.startDate && !bg.endDate;
            if (isEmpty) {
                continue;
            }
            if (!bg.titre || bg.titre.trim().length === 0) {
                return `Expérience ${i + 1}: Titre du Poste est requis`;
            }
            if (bg.titre.length > 20) {
                return `Expérience ${i + 1}: Titre du Poste dépasse 20 caractères`;
            }
            if (!bg.company || bg.company.trim().length === 0) {
                return `Expérience ${i + 1}: Entreprise est requis`;
            }
            if (bg.company.length > 20) {
                return `Expérience ${i + 1}: Entreprise dépasse 20 caractères`;
            }
            if (!bg.startDate) {
                return `Expérience ${i + 1}: Année de Début est requis`;
            }
            if (!bg.endDate) {
                return `Expérience ${i + 1}: Année de Fin est requis`;
            }
            if (!this.isBackgroundYearsValid(bg)) {
                return `Expérience ${i + 1}: L'année de fin doit être supérieure ou égale à l'année de début`;
            }
        }
        return '';
    }

    addBackground(): void {
        this.backgroundList.push({ titre: '', company: '', startDate: '', endDate: '' });
    }

    removeBackground(index: number): void {
        if (this.backgroundList.length > 1) {
            this.backgroundList.splice(index, 1);
        }
    }

    isPassionValid(): boolean {
        const value = (this.passionAndGoals || '').trim();
        return value.length > 0 && value.length <= 200;
    }

    onPassionChange(): void {
        if ((this.passionAndGoals || '').length > 200) {
            this.passionAndGoals = (this.passionAndGoals || '').substring(0, 200);
        }
    }

    saveCandidateProfileGeneric(): void {
        this.saveCandidateProfile();
    }

    onMapClick(event: any): void {
        const coords = event?.latLng;
        if (coords) {
            const lat = coords.lat();
            const lng = coords.lng();
            this.markerPosition = { lat, lng };
            this.localisationData.latitude = lat;
            this.localisationData.longitude = lng;
            this.mapCenter = { lat, lng };
        }
    }

    downloadCV(): void {
        if (this.cvUrl) {
            window.open(this.cvUrl, '_blank');
        }
    }
}


