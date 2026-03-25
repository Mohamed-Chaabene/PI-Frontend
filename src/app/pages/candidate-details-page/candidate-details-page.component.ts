import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { SubscribeComponent } from '../../common/subscribe/subscribe.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgxScrollTopComponent } from 'ngx-scrolltop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './file-upload/file-upload.component';
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
    contactData: any = {
        prenom: ''
    };
    
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

    // Localisation form data
    localisationData: any = {
        latitude: '',
        longitude: '',
        pays: '',
        ville: ''
    };

    // File upload data
    profilePictureUrl = '';
    cvUrl = '';

    // Google Maps properties
    mapZoom = 10;
    mapCenter: google.maps.LatLngLiteral = { lat: 36.8065, lng: 10.1615 }; // Default center (Tunis)
    markerPosition: google.maps.LatLngLiteral | null = null;

    isLoading = false;
    isSaving = false;
    successMessage = '';
    errorMessage = '';
    geocodeTimer: any; // Timer for debouncing geocode calls
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
        
        // Validate Cloudinary configuration
        const configValidation = this.cloudinaryDebugService.validateConfiguration();
        this.cloudinaryConfigValid = configValidation.valid;
        this.cloudinaryConfigMessage = configValidation.message;
        if (!configValidation.valid) {
            console.warn('Cloudinary Configuration Warning:', configValidation);
        } else {
            console.log('Cloudinary Configuration Valid:', configValidation.details);
        }
        
        // Get current user info from localStorage
        const userName = localStorage.getItem('userName');
        this.currentUserName = userName || 'Candidat';
        this.userEmail = userName || '';
        this.userRole = localStorage.getItem('userRole') || 'CANDIDAT';
        this.loadCandidateData();
    }

    loadCandidateData() {
        this.isLoading = true;
        const userName = localStorage.getItem('userName');
        
        // If no userName, stop loading
        if (!userName) {
            this.isLoading = false;
            return;
        }
        
        // Try to load candidate data from API
        this.apiService.getCandidateByEmail(userName).subscribe(
            (data: any) => {
                if (data) {
                    // Merge response data with form
                    this.candidateData = {
                        ...this.candidateData,
                        ...data
                    };
                    
                    // Explicitly ensure critical fields are set from response
                    if (data.id) {
                        this.candidateData.id = data.id;
                    }
                    if (data.email) {
                        this.candidateData.email = data.email;
                    }
                    // IMPORTANT: Explicitly set description from API response
                    if (data.description) {
                        this.candidateData.description = data.description;
                    }
                    
                    console.log('Loaded candidate ID:', this.candidateData.id, 'Full data:', data);
                    
                    // Update current username with actual nom from database
                    if (data.nom) {
                        this.currentUserName = data.nom;
                    }
                    
                    // Load contact data (prenom and telephone)
                    if (data.prenom) {
                        this.contactData.prenom = data.prenom;
                    }
                    if (data.telephone) {
                        this.candidateData.telephone = data.telephone;
                    }
                    
                    // Parse education data from concatenated string
                    // Parse education data from concatenated string with labels
                    if (data.niveauEtude && data.niveauEtude.includes('niveau:')) {
                        // Split by " ;; " to get individual education entries
                        const educationEntries = data.niveauEtude.split(' ;; ');
                        this.educationList = educationEntries.map((edu: string) => {
                            // Extract values using regex for labeled format
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
                    } else if (data.niveauEtude && data.niveauEtude.includes(' / ')) {
                        // OLD FORMAT: Split by " / " for backward compatibility with old data
                        const educationEntries = data.niveauEtude.split(' ;; ');
                        this.educationList = educationEntries.map((edu: string) => {
                            const parts = edu.split(' / ');
                            return {
                                niveauEtude: (parts[0] || '').trim(),
                                domain: (parts[1] || '').trim(),
                                institution: (parts[2] || '').trim(),
                                startDate: (parts[3] || '').trim().split('-')[0],
                                endDate: (parts[3] || '').trim().split('-')[1]
                            };
                        });
                    } else if (data.niveauEtude) {
                        // Single education entry without separators
                        this.educationList = [{ 
                            niveauEtude: data.niveauEtude, 
                            domain: '', 
                            institution: '', 
                            startDate: '', 
                            endDate: '' 
                        }];
                    } else {
                        this.educationList = [{ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' }];
                    }

                    // Parse background data from concatenated string
                    if (data.backgroundExpertise && data.backgroundExpertise.includes('titre:')) {
                        // New labeled format
                        const backgroundEntries = data.backgroundExpertise.split(' ;; ');
                        this.backgroundList = backgroundEntries.map((bg: string) => {
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
                    } else if (data.backgroundExpertise && data.backgroundExpertise.includes(' / ')) {
                        // Old format - backward compatibility
                        const backgroundEntries = data.backgroundExpertise.split(' ;; ');
                        this.backgroundList = backgroundEntries.map((bg: string) => {
                            const parts = bg.split(' / ');
                            return {
                                titre: (parts[0] || '').trim(),
                                company: (parts[1] || '').trim(),
                                startDate: (parts[2] || '').trim().split('-')[0],
                                endDate: (parts[2] || '').trim().split('-')[1]
                            };
                        });
                    } else if (data.backgroundExpertise) {
                        // Single background entry
                        this.backgroundList = [{ 
                            titre: data.backgroundExpertise, 
                            company: '', 
                            startDate: '', 
                            endDate: '' 
                        }];
                    } else {
                        this.backgroundList = [{ titre: '', company: '', startDate: '', endDate: '' }];
                    }

                    // Load passion and goals
                    if (data.passionAndGoals) {
                        this.passionAndGoals = data.passionAndGoals;
                    }
                    
                    // Load localisation data if available
                    if (data.localisation_id) {
                        this.apiService.getLocalisation(data.localisation_id).subscribe({
                            next: (locData: any) => {
                                this.localisationData = locData;
                                
                                // Update map center if coordinates are available
                                if (locData.latitude && locData.longitude) {
                                    this.mapCenter = { lat: locData.latitude, lng: locData.longitude };
                                    this.markerPosition = { lat: locData.latitude, lng: locData.longitude };
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
                }
            },
            (err) => {
                // If 404, candidate doesn't exist - create an empty one first
                if (err.status === 404) {
                    this.successMessage = 'Profil candidat non trouvé. Création d\'un nouveau profil...';
                    this.candidateData.email = userName; // Set email for new candidate
                    
                    // Create a minimal candidate profile with just email and name
                    const minimalCandidate = {
                        email: userName,
                        nom: this.currentUserName || userName.split('@')[0],
                        prenom: '',
                        description: '',
                        telephone: '',
                        cv: '',
                        lienPortfolio: '',
                        niveauEtude: '',
                        competences: []
                    };
                    
                    this.apiService.createCandidate(minimalCandidate).subscribe({
                        next: (response: any) => {
                            // Now we have an ID to work with
                            if (response.id) {
                                this.candidateData.id = response.id;
                                this.candidateData.email = response.email;
                                console.log('Created new candidate with ID:', this.candidateData.id);
                                
                                // Merge the full response into candidateData
                                this.candidateData = {
                                    ...this.candidateData,
                                    ...response
                                };
                                
                                this.successMessage = 'Profil candidat créé. Vous pouvez maintenant éditer vos informations.';
                                this.isLoading = false;
                                setTimeout(() => this.successMessage = '', 4000);
                            }
                        },
                        error: (createErr) => {
                            console.error('Error creating candidate:', createErr);
                            console.error('Error status:', createErr.status);
                            console.error('Error message:', createErr.message);
                            console.error('Error error:', createErr.error);
                            let errorMsg = 'Erreur lors de la création du profil candidat';
                            if (createErr.status === 0) {
                                errorMsg = 'Impossible de se connecter au serveur. Assurez-vous que le backend est en cours d\'exécution sur http://localhost:8080';
                            } else if (createErr.error?.message) {
                                errorMsg = createErr.error.message;
                            }
                            this.errorMessage = errorMsg;
                            this.isLoading = false;
                        }
                    });
                } else {
                    this.errorMessage = 'Erreur lors du chargement du profil candidat.';
                    this.isLoading = false;
                    console.error('Error loading candidate data:', err);
                }
            }
        );
    }

    saveCandidateProfile() {
        if (!this.validateForm()) {
            this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        // First save localisation if it has data
        let localisationId = this.candidateData.localisation_id;
        
        if (this.localisationData.latitude && this.localisationData.longitude) {
            // Create/update localisation first
            const localisationPayload = {
                pays: this.localisationData.pays,
                ville: this.localisationData.ville,
                latitude: this.localisationData.latitude,
                longitude: this.localisationData.longitude
            };
            
            const saveLocalisationObs = localisationId 
                ? this.apiService.updateLocalisation(localisationId, localisationPayload)
                : this.apiService.createLocalisation(localisationPayload);

            saveLocalisationObs.subscribe({
                next: (locResponse: any) => {
                    localisationId = locResponse.id || localisationId;
                    this.saveCandidateToApi(localisationId);
                },
                error: (error) => {
                    this.isSaving = false;
                    this.errorMessage = `Erreur lors de la sauvegarde de la localisation: ${error.message || error.statusText}`;
                    console.error('Localisation save error:', error);
                }
            });
        } else {
            this.saveCandidateToApi(localisationId);
        }
    }

    private saveCandidateToApi(localisationId?: number) {
        // Build payload for the backend - store all data as concatenated strings
        const candidatePayload: any = {
            nom: this.currentUserName || this.candidateData.email?.split('@')[0] || 'Candidat',
            prenom: this.contactData.prenom || '',
            email: this.candidateData.email,
            telephone: this.candidateData.telephone || '',
            description: this.candidateData.description || '',
            cv: this.candidateData.cv || '',
            lienPortfolio: this.candidateData.lien_portfolio || '',
            niveauEtude: this.candidateData.niveau_etude || '',
            passionAndGoals: this.passionAndGoals || '',
            competences: [] // Send empty array
        };

        // Concatenate ALL education entries into ONE string with labels
        if (this.educationList && this.educationList.length > 0) {
            const hasEducationData = this.educationList.some((edu: any) => 
                edu.niveauEtude || edu.domain || edu.institution || edu.startDate || edu.endDate
            );
            if (hasEducationData) {
                const educationStrings = this.educationList.map((edu: any) => {
                    return `niveau: ${edu.niveauEtude || ''}, domaine: ${edu.domain || ''}, institution: ${edu.institution || ''}, debut: ${edu.startDate || ''}, fin: ${edu.endDate || ''}`;
                });
                // Store all educations concatenated in niveauEtude field
                candidatePayload.niveauEtude = educationStrings.join(' ;; ');
            }
        }

        // Concatenate ALL background entries into ONE string with labels
        if (this.backgroundList && this.backgroundList.length > 0) {
            const hasBackgroundData = this.backgroundList.some((bg: any) => 
                bg.titre || bg.company || bg.startDate || bg.endDate
            );
            if (hasBackgroundData) {
                const backgroundStrings = this.backgroundList.map((bg: any) => {
                    return `titre: ${bg.titre || ''}, entreprise: ${bg.company || ''}, debut: ${bg.startDate || ''}, fin: ${bg.endDate || ''}`;
                });
                // Store all backgrounds concatenated in backgroundExpertise field
                candidatePayload.backgroundExpertise = backgroundStrings.join(' ;; ');
            }
        }

        // Only add localisation ID if it exists
        if (localisationId) {
            candidatePayload.localisation_id = localisationId;
        }

        console.log('Saving candidate payload:', candidatePayload);
        console.log('Using ID for update:', this.candidateData.id);

        const saveObs = this.candidateData.id
            ? this.apiService.updateCandidate(this.candidateData.id, candidatePayload)
            : this.apiService.createCandidate(candidatePayload);

        saveObs.subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.successMessage = 'Profil candidat sauvegardé avec succès!';
                // Set ID in case it's a new candidate
                if (response.id && !this.candidateData.id) {
                    this.candidateData.id = response.id;
                }
                if (response.localisation_id) {
                    this.candidateData.localisation_id = response.localisation_id;
                }
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                console.error('Save error:', error);
                this.errorMessage = `Erreur lors de la sauvegarde: ${error.message || error.statusText}`;
            }
        });
    }

    // Education management
    addEducation() {
        this.educationList.push({ niveauEtude: '', domain: '', institution: '', startDate: '', endDate: '' });
    }

    removeEducation(index: number) {
        this.educationList.splice(index, 1);
    }

    // Background management
    addBackground() {
        this.backgroundList.push({ titre: '', company: '', startDate: '', endDate: '' });
    }

    removeBackground(index: number) {
        this.backgroundList.splice(index, 1);
    }

    private validateForm(): boolean {
        // All fields are optional - allow saving without location data
        return true;
    }

    // Map click handler
    onMapClick(event: google.maps.MapMouseEvent) {
        if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            // Update marker position
            this.markerPosition = { lat, lng };
            
            // Update form fields
            this.localisationData.latitude = Math.round(lat * 10000) / 10000;
            this.localisationData.longitude = Math.round(lng * 10000) / 10000;
            
            // Update map center if you want the map to follow
            this.mapCenter = { lat, lng };
        }
    }

    // Geocode location based on country and city
    geocodeLocation() {
        if (!this.localisationData.pays && !this.localisationData.ville) {
            return;
        }

        // Build the search query
        const searchQuery = `${this.localisationData.ville ? this.localisationData.ville + ',' : ''} ${this.localisationData.pays}`;
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: searchQuery.trim() }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                // Update map center
                this.mapCenter = { lat, lng };
                
                // Update marker position
                this.markerPosition = { lat, lng };
                
                // Update form fields with coordinates
                this.localisationData.latitude = Math.round(lat * 10000) / 10000;
                this.localisationData.longitude = Math.round(lng * 10000) / 10000;
            }
        });
    }

    // Watch for changes in pays or ville
    onPaysCityChange() {
        // Clear the previous timer
        if (this.geocodeTimer) {
            clearTimeout(this.geocodeTimer);
        }
        
        // Set a new timer to geocode after user stops typing (500ms delay)
        this.geocodeTimer = setTimeout(() => {
            this.geocodeLocation();
        }, 500);
    }

    // Save description only (for quick saves when editing description)
    saveDescriptionOnly() {
        console.log('saveDescriptionOnly called - candidateData.id:', this.candidateData.id);
        console.log('Full candidateData:', this.candidateData);
        
        if (!this.candidateData.id) {
            this.errorMessage = 'Erreur: Candidat ID non trouvé. Veuillez d\'abord créer votre profil complet.';
            console.error('Cannot save - no ID:', this.candidateData);
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        const descriptionPayload = {
            description: this.candidateData.description || ''
        };

        console.log('Saving description only:', descriptionPayload, 'for ID:', this.candidateData.id);

        this.apiService.updateCandidate(this.candidateData.id, descriptionPayload).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.successMessage = 'Description sauvegardée avec succès!';
                this.isEditingAbout = false;
                // Clear success message after 3 seconds
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde de la description: ${error.message || error.statusText}`;
                console.error('Description save error:', error);
            }
        });
    }

    savePassionAndGoals() {
        console.log('savePassionAndGoals called - candidateData.id:', this.candidateData.id);
        
        if (!this.candidateData.id) {
            this.errorMessage = 'Erreur: Candidat ID non trouvé. Veuillez d\'abord créer votre profil complet.';
            console.error('Cannot save - no ID:', this.candidateData);
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        const passionPayload = {
            passionAndGoals: this.passionAndGoals || ''
        };

        console.log('Saving passion and goals:', passionPayload, 'for ID:', this.candidateData.id);

        this.apiService.updateCandidate(this.candidateData.id, passionPayload).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.successMessage = 'Passions et objectifs sauvegardés avec succès!';
                this.isEditingPassion = false;
                // Clear success message after 3 seconds
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde des passions: ${error.message || error.statusText}`;
                console.error('Passion save error:', error);
            }
        });
    }

    saveContactInfo() {
        console.log('saveContactInfo called - candidateData.id:', this.candidateData.id);
        
        if (!this.candidateData.id) {
            this.errorMessage = 'Erreur: Candidat ID non trouvé. Veuillez d\'abord créer votre profil complet.';
            console.error('Cannot save - no ID:', this.candidateData);
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        const contactPayload = {
            prenom: this.contactData.prenom || '',
            telephone: this.candidateData.telephone || ''
        };

        console.log('Saving contact info:', contactPayload, 'for ID:', this.candidateData.id);

        this.apiService.updateCandidate(this.candidateData.id, contactPayload).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.successMessage = 'Informations de contact sauvegardées avec succès!';
                // Clear success message after 3 seconds
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde des informations: ${error.message || error.statusText}`;
                console.error('Contact info save error:', error);
            }
        });
    }

    saveLocalisationInfo() {
        console.log('saveLocalisationInfo called - candidateData.id:', this.candidateData.id);
        console.log('Current localisation_id:', this.candidateData.localisation_id);
        
        if (!this.candidateData.id) {
            this.errorMessage = 'Erreur: Candidat ID non trouvé. Veuillez d\'abord créer votre profil complet.';
            console.error('Cannot save - no ID:', this.candidateData);
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

        console.log('Saving localisation:', localisationPayload);

        const localisationId = this.candidateData.localisation_id;
        console.log('Localisation ID to use:', localisationId, 'Will', localisationId ? 'UPDATE' : 'CREATE');

        const saveLocalisationObs = localisationId
            ? this.apiService.updateLocalisation(localisationId, localisationPayload)
            : this.apiService.createLocalisation(localisationPayload);

        saveLocalisationObs.subscribe({
            next: (response: any) => {
                // If we created a new localisation, update the candidate with the ID
                if (!localisationId && response.id) {
                    console.log('Created new localisation with ID:', response.id);
                    const candidatePayload = {
                        localisation_id: response.id
                    };
                    this.apiService.updateCandidate(this.candidateData.id, candidatePayload).subscribe({
                        next: () => {
                            this.candidateData.localisation_id = response.id;
                            this.localisationData.id = response.id;
                            console.log('Updated candidate with localisation_id:', response.id);
                            this.isSaving = false;
                            this.successMessage = 'Localisation sauvegardée avec succès!';
                            setTimeout(() => {
                                this.successMessage = '';
                            }, 3000);
                        },
                        error: (error) => {
                            this.isSaving = false;
                            this.errorMessage = `Erreur: ${error.message || error.statusText}`;
                        }
                    });
                } else {
                    console.log('Updated existing localisation');
                    this.isSaving = false;
                    this.successMessage = 'Localisation sauvegardée avec succès!';
                    setTimeout(() => {
                        this.successMessage = '';
                    }, 3000);
                }
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Erreur lors de la sauvegarde de la localisation: ${error.message || error.statusText}`;
                console.error('Localisation save error:', error);
            }
        });
    }

    /**
     * Handle profile picture upload
     */
    onProfilePictureUploaded(event: any): void {
        this.profilePictureUrl = event.url;
        this.saveProfilePictureUrl(event.url);
    }

    /**
     * Trigger profile picture file upload by clicking the file input
     */
    onProfilePictureSelected(event: any): void {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            this.uploadProfilePictureToCloudinary(file);
        }
    }

    /**
     * Upload profile picture to Cloudinary
     */
    uploadProfilePictureToCloudinary(file: File): void {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.errorMessage = 'Please select a valid image file';
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
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
                    this.successMessage = 'Profile picture uploaded successfully!';
                    this.saveProfilePictureUrl(response.secure_url);
                    
                    // Clear success message after 3 seconds
                    setTimeout(() => {
                        this.successMessage = '';
                    }, 3000);
                } else {
                    this.errorMessage = 'Upload response invalid. Missing secure_url.';
                }
            },
            error: (error: any) => {
                this.isUploadingProfilePicture = false;
                console.error('Upload error details:', error);
                
                // Try to extract more detailed error message
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
                console.error('Final error message:', errorMsg);
            }
        });
    }

    /**
     * Handle CV upload
     */
    onCVUploaded(event: any): void {
        this.cvUrl = event.url;
        this.saveCVUrl(event.url);
    }

    /**
     * Save profile picture URL to database
     */
    saveProfilePictureUrl(url: string): void {
        if (!this.candidateData.id) {
            this.errorMessage = 'Candidate ID not found';
            return;
        }

        this.isSaving = true;
        const profilePayload = {
            profile_picture_url: url
        };

        this.apiService.updateCandidate(this.candidateData.id, profilePayload).subscribe({
            next: () => {
                this.isSaving = false;
                this.successMessage = 'Profile picture saved successfully!';
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Error saving profile picture: ${error.message || error.statusText}`;
                console.error('Profile picture save error:', error);
            }
        });
    }

    /**
     * Save CV URL to database
     */
    saveCVUrl(url: string): void {
        if (!this.candidateData.id) {
            this.errorMessage = 'Candidate ID not found';
            return;
        }

        this.isSaving = true;
        const cvPayload = {
            cv_url: url
        };

        this.apiService.updateCandidate(this.candidateData.id, cvPayload).subscribe({
            next: () => {
                this.isSaving = false;
                this.successMessage = 'CV saved successfully!';
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                this.errorMessage = `Error saving CV: ${error.message || error.statusText}`;
                console.error('CV save error:', error);
            }
        });
    }
}
