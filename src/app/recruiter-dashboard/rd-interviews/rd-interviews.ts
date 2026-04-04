import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

interface EntretienForm {
  titre: string;
  description: string;
  type: string;
  domaine: string;
  dateEntretien: string;
  candidatId: number | null;
  photo: string;
  seuilReussite: number | null;
}

@Component({
  selector: 'app-rd-interviews',
  imports: [CommonModule, FormsModule],
  templateUrl: './rd-interviews.html',
  styleUrls: ['./rd-interviews.scss'],
})
export class RdInterviews implements OnInit {
  entretiens: any[] = [];
  selectedEntretienDetails: any | null = null;
  showEntretienDetailsModal = false;
  candidats: any[] = [];
  newEntretien: EntretienForm = {
    titre: '',
    description: '',
    type: '',
    domaine: '',
    dateEntretien: '',
    candidatId: null,
    photo: '',
    seuilReussite: 70
  };
  showCreateForm = false;
  editingEntretien: any = null;
  currentUser: any;
  currentUserId: number | null = null;
  typesEntretien = ['TECHNIQUE', 'RH', 'MANAGERIAL', 'FINAL', 'PRESELECTION', 'TEST'];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    if (!this.isRecruteurSession()) {
      alert('Acces refuse. Veuillez vous connecter avec un compte recruteur.');
      this.router.navigate(['/login']);
      return;
    }

    this.getCurrentUser();
    this.loadEntretiens();
    this.loadCandidats();
    this.loadDomaines();
  }

  private isRecruteurSession(): boolean {
    const token = localStorage.getItem('token');
    const role = (localStorage.getItem('userRole') || '').toUpperCase().replace(/^ROLE_/, '');
    return !!token && role === 'RECRUTEUR';
  }

  getCurrentUser(): void {
    // 1. Valeur locale temporaire (sera verifiee/rafraichie via API)
    const storedRecruteurId = localStorage.getItem('recruteurId');
    if (storedRecruteurId) {
      const parsedId = Number(storedRecruteurId);
      if (!isNaN(parsedId) && parsedId > 0) {
        this.currentUserId = parsedId;
      }
    }

    // 2. Recuperer via API (source de verite)
    this.apiService.getCurrentRecruteur().subscribe({
      next: (recruteur: any) => {
        if (recruteur && recruteur.id) {
          this.currentUserId = recruteur.id;
          localStorage.setItem('recruteurId', String(this.currentUserId));
        } else {
          this.fallbackFromToken();
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur recuperation recruteur via API:', error);
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem('recruteurId');
        }
        this.fallbackFromToken();
      }
    });
  }

  private fallbackFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.currentUser = jwtDecode(token);
        const tokenId = this.currentUser?.id ||
                       this.currentUser?.sub ||
                       this.currentUser?.userId ||
                       this.currentUser?.recruteurId;

        if (tokenId) {
          const parsedTokenId = Number(tokenId);
          if (!isNaN(parsedTokenId) && parsedTokenId > 0) {
            this.currentUserId = parsedTokenId;
            localStorage.setItem('recruteurId', String(this.currentUserId));
            return;
          }
        }
      } catch (error) {
        console.error('❌ Erreur token fallback:', error);
      }
    }

    this.currentUserId = null;
  }

  loadCandidats(): void {
    this.apiService.getCandidats().subscribe({
      next: (data) => {
        // Si c'est un object avec un tableau à l'intérieur, l'extraire
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Chercher un tableau dans l'objet
          const arrayValue = Object.values(data).find((v: any) => Array.isArray(v));
          if (arrayValue) {
            this.candidats = arrayValue as any[];
            return;
          }
        }
        
        this.candidats = Array.isArray(data) ? data : [];
      },
      error: (error: any) => {
        console.error('❌ Erreur chargement candidats:', error);
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('recruteurId');
          alert('Session expirée. Veuillez vous reconnecter.');
          this.router.navigate(['/login']);
          return;
        }
        this.candidats = [];
      }
    });
  }

  loadEntretiens(): void {
    this.apiService.getEntretiens().subscribe({
      next: (data: any[]) => {
        this.entretiens = Array.isArray(data) ? data : [];
      },
      error: (error: any) => {
        console.error('Erreur chargement entretiens', error);
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('recruteurId');
          alert('Session expirée. Veuillez vous reconnecter.');
          this.router.navigate(['/login']);
          return;
        }
        this.entretiens = [];
      }
    });
  }

  private loadDemoEntretiens(): void {
    // Charger des données de démo pour démonstration
    this.entretiens = [
      {
        id: 1,
        titre: 'Entretien Développeur Angular',
        description: 'Entretien technique pour poste développeur Angular',
        type: 'TECHNIQUE',
        dateEntretien: new Date().toISOString(),
        completed: false
      },
      {
        id: 2,
        titre: 'Entretien RH',
        description: 'Entretien RH de présentation',
        type: 'RH',
        dateEntretien: new Date().toISOString(),
        completed: false
      }
    ];
  }

  createEntretien(): void {
    // Validation côté frontend
    if (!this.validateEntretienForm()) {
      return;
    }

    const isTest = this.newEntretien.type === 'TEST';

    const payload: any = {
      titre: this.newEntretien.titre,
      description: this.newEntretien.description,
      domaine: this.newEntretien.domaine,
      categorie: this.newEntretien.type,
      type: this.newEntretien.type,
      dateEntretien: this.newEntretien.dateEntretien,
      photo: this.newEntretien.photo || null,
    };
    if (isTest) {
      payload.seuilReussite = null;
    } else {
      payload.seuilReussite = this.newEntretien.seuilReussite ?? 70;
    }

    if (this.newEntretien.candidatId !== null && this.newEntretien.candidatId !== undefined) {
      payload.candidatId = this.newEntretien.candidatId;
    }

    const recruteurId = this.currentUserId;

    if (!recruteurId || isNaN(recruteurId) || recruteurId <= 0) {
      console.error('❌ ID Recruteur invalide:', recruteurId);
      alert('Erreur : ID du recruteur manquant ou invalide. Veuillez vous reconnecter.');
      return;
    }

    this.submitCreateEntretien(payload, recruteurId, false);
  }

  private submitCreateEntretien(payload: any, recruteurId: number, hasRetried: boolean): void {
    this.apiService.createEntretien(payload, recruteurId).subscribe({
      next: (response) => {
        alert('Entretien créé avec succès! Redirection vers l\'ajout de questions...');
        this.entretiens.push(response);
        this.resetForm();
        this.showCreateForm = false;
        this.router.navigate(['/recruiter-dashboard/interviews/add-questions', response.id]);
      },
      error: (error) => {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Headers:', error.headers);
        console.error('❌ Error body:', error.error);

        const backendMessage = typeof error?.error === 'string'
          ? error.error
          : (error?.error?.message || error?.message || '');
        const isRecruteurNotFound = /Recruteur non trouv/i.test(String(backendMessage));

        if (!hasRetried && (error?.status === 404 || error?.status === 400) && isRecruteurNotFound) {
          localStorage.removeItem('recruteurId');

          this.apiService.getCurrentRecruteur().subscribe({
            next: (recruteur: any) => {
              const refreshedId = Number(recruteur?.id);
              if (!isNaN(refreshedId) && refreshedId > 0) {
                this.currentUserId = refreshedId;
                localStorage.setItem('recruteurId', String(refreshedId));
                this.submitCreateEntretien(payload, refreshedId, true);
                return;
              }
              alert('Erreur : impossible de récupérer un ID recruteur valide. Veuillez vous reconnecter.');
            },
            error: (refreshError: any) => {
              if (refreshError?.status === 401 || refreshError?.status === 403) {
                alert('Acces refuse au profil recruteur (401/403). Connectez-vous avec un compte recruteur.');
                return;
              }
              alert('Erreur : session invalide. Veuillez vous reconnecter.');
            }
          });
          return;
        }

        alert(`Erreur lors de la création de l'entretien (${error.status}): ${backendMessage || error.statusText}`);
      }
    });
  }

  private resetForm(): void {
    this.newEntretien = {
      titre: '',
      description: '',
      type: '',
      domaine: '',
      dateEntretien: '',
      candidatId: null,
      photo: '',
      seuilReussite: 70
    };
  }

  completeEntretien(id: number): void {
    this.apiService.completeEntretien(id).subscribe({
      next: () => {
        const entretien = this.entretiens.find(e => e.id === id);
        if (entretien) entretien.completed = true;
      },
      error: (error) => console.error('Error completing entretien', error)
    });
  }

  viewResult(id: number): void {
    this.apiService.getResultat(id).subscribe({
      next: (result: any) => {
        alert(`Score: ${result.score}%, Decision: ${result.decision}`);
      },
      error: (error: any) => console.error('Error getting result', error)
    });
  }

  openEntretienDetails(entretien: any): void {
    this.selectedEntretienDetails = entretien;
    this.showEntretienDetailsModal = true;
  }

  closeEntretienDetails(): void {
    this.showEntretienDetailsModal = false;
    this.selectedEntretienDetails = null;
  }

  getStatusLabel(entretien: any): string {
    return entretien?.completed ? 'Termine' : 'En cours';
  }

  getStatusClass(entretien: any): string {
    return entretien?.completed ? 'status-completed' : 'status-pending';
  }

  getEntretienDescriptionPreview(description: string | null | undefined): string {
    const value = (description || '').trim();
    if (!value) {
      return '-';
    }
    return value.length > 85 ? `${value.slice(0, 85)}...` : value;
  }

  getTotalEntretiensCount(): number {
    return this.entretiens.length;
  }

  getCompletedEntretiensCount(): number {
    return this.entretiens.filter(e => !!e.completed).length;
  }

  getActiveEntretiensCount(): number {
    return this.entretiens.filter(e => !e.completed).length;
  }

  formatEntretienDate(dateValue: string | null | undefined): string {
    if (!dateValue) {
      return 'Non planifiee';
    }
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleString('fr-FR');
  }

  goToAddQuestions(entretienId: number): void {
    this.loadQuestions(entretienId);
  }

  editEntretien(entretien: any): void {
    this.editingEntretien = { ...entretien };
    // Convertir la date pour l'input datetime-local
    if (this.editingEntretien.dateEntretien) {
      this.editingEntretien.dateEntretien = this.formatDateForInput(this.editingEntretien.dateEntretien);
    }
    this.showCreateForm = false; // Masquer le formulaire de création si ouvert
  }

  // Méthodes CRUD supplémentaires
  updateEntretien(entretien: any): void {
    if (!this.currentUserId) {
      alert('Erreur : ID du recruteur manquant.');
      return;
    }

    localStorage.setItem('recruteurId', String(this.currentUserId));

    if (!this.validateEntretienUpdate(entretien)) {
      return;
    }

    const isTestUpdate = (entretien.type || '').toUpperCase() === 'TEST';
    const updatedData: any = {
      titre: entretien.titre,
      description: entretien.description,
      domaine: entretien.domaine,
      type: entretien.type?.toUpperCase(),
      categorie: entretien.type?.toUpperCase(),
      dateEntretien: entretien.dateEntretien,
      photo: entretien.photo || null,
    };
    updatedData.seuilReussite = isTestUpdate ? null : (entretien.seuilReussite ?? 70);

    if (entretien.candidatId) {
      updatedData.candidatId = entretien.candidatId;
    }

    console.log('📤 updateEntretien payload:', updatedData);

    this.apiService.updateEntretien(entretien.id, updatedData).subscribe({
      next: (response) => {
        alert('Entretien mis à jour avec succès!');
        this.editingEntretien = null;
        this.loadEntretiens();
      },
      error: (error: any) => {
        console.error('Erreur mise à jour entretien:', error);
        console.error('🔻 body:', error.error);
        console.error('🔻 status:', error.status, error.statusText);
        alert(`Erreur mise à jour entretien: ${error.error?.message || error.message || '500 interne'}`);
      }
    });
  }

  deleteEntretien(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet entretien ? Cette action est irréversible.')) {
      if (!this.currentUserId) {
        alert('Erreur : ID du recruteur manquant.');
        return;
      }

      localStorage.setItem('recruteurId', String(this.currentUserId));

      this.apiService.deleteEntretien(id).subscribe({
        next: () => {
          alert('Entretien supprimé avec succès!');
          this.entretiens = this.entretiens.filter(e => e.id !== id);
        },
        error: (error) => {
          console.error('Erreur suppression entretien:', error);
          alert(`Erreur lors de la suppression: ${error.error?.message || error.message}`);
        }
      });
    }
  }

  // Méthodes de validation
  validateEntretienForm(): boolean {
    if (!this.newEntretien.description || this.newEntretien.description.trim().length < 10) {
      alert('La description doit contenir au moins 10 caractères.');
      return false;
    }

    if (this.newEntretien.description.length > 1000) {
      alert('La description ne peut pas dépasser 1000 caractères.');
      return false;
    }

    if (this.newEntretien.domaine == null || this.newEntretien.domaine.trim() === '') {
      alert('Le domaine est obligatoire.');
      return false;
    }

    if (this.newEntretien.type !== 'TEST') {
      const s = this.newEntretien.seuilReussite;
      if (s == null || s < 0 || s > 100) {
        alert('Le seuil de réussite doit être entre 0 et 100.');
        return false;
      }
    }

    return true;
  }

  validateEntretienUpdate(entretien: any): boolean {
    if (!entretien.description || entretien.description.trim().length < 10) {
      alert('La description doit contenir au moins 10 caractères.');
      return false;
    }

    if (entretien.description.length > 1000) {
      alert('La description ne peut pas dépasser 1000 caractères.');
      return false;
    }

    if (!entretien.type) {
      alert('Le type d\'entretien est requis.');
      return false;
    }

    if (!entretien.dateEntretien) {
      alert('La date/heure est requise.');
      return false;
    }

    const selectedDate = new Date(entretien.dateEntretien);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (selectedDate <= oneHourFromNow) {
      alert('La date de l\'entretien doit être au moins 1 heure dans le futur.');
      return false;
    }

    if (!entretien.domaine || entretien.domaine.trim() === '') {
      alert('Le domaine est obligatoire.');
      return false;
    }

    if (entretien.type !== 'TEST' && !entretien.candidatId) {
      alert('Un candidat doit être sélectionné pour ce type d\'entretien.');
      return false;
    }

    if (entretien.type !== 'TEST') {
      const s = entretien.seuilReussite;
      if (s == null || s < 0 || s > 100) {
        alert('Le seuil de réussite doit être entre 0 et 100.');
        return false;
      }
    }

    return true;
  }

  // Méthode utilitaire pour formater les dates
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:MM
  }

  // Méthode pour obtenir le nom du candidat
  getCandidateName(candidatId: number): string {
    const candidat = this.candidats.find(c => c.id === candidatId);
    return candidat ? `${candidat.nom} ${candidat.prenom}` : 'Candidat inconnu';
  }

  // Méthodes pour la gestion des questions
  questions: any[] = [];
  selectedEntretienId: number | null = null;
  showQuestionsForm = false;
  newQuestion = {
    question: '',
    type: 'QCM',
    options: ['', '', '', ''],
    bonneReponse: '',
    bonneReponses: [] as number[],
    points: 1,
    domaineId: null
  };
  editingQuestion: any = null;
  domaines: any[] = [];
  typesQuestion = ['QCM', 'VRAI_FAUX', 'LIBRE', 'CODE'];

  trackByIndex(index: number, item: any): number {
    return index;
  }

  toggleCorrectChoice(index: number): void {
    const pos = this.newQuestion.bonneReponses.indexOf(index);
    if (pos > -1) {
      this.newQuestion.bonneReponses.splice(pos, 1);
    } else {
      this.newQuestion.bonneReponses.push(index);
    }
  }

  onQuestionTypeChange(): void {
    if (this.newQuestion.type !== 'QCM') {
      this.newQuestion.bonneReponses = [];
      this.newQuestion.bonneReponse = '';
    }
    if (this.newQuestion.type === 'VRAI_FAUX') {
      this.newQuestion.options = [];
    } else if (this.newQuestion.type !== 'VRAI_FAUX' && this.newQuestion.options.length < 2) {
      this.newQuestion.options = ['', '', '', ''];
    }
  }

  loadQuestions(entretienId: number): void {
    this.selectedEntretienId = entretienId;
    this.apiService.getQuestionsByEntretien(entretienId).subscribe({
      next: (data: any[]) => {
        this.questions = Array.isArray(data) ? data : [];
        this.showQuestionsForm = true;
      },
      error: (error) => {
        console.error('Erreur chargement questions', error);
        this.questions = [];
      }
    });
  }

  private getFallbackDomaines(): any[] {
    return [
      { id: 1, nom: 'INFORMATIQUE' },
      { id: 2, nom: 'BUSINESS' },
      { id: 3, nom: 'SANTÉ' },
      { id: 4, nom: 'INGÉNIERIE' },
      { id: 5, nom: 'ÉDUCATION' },
      { id: 6, nom: 'DESIGN' },
      { id: 7, nom: 'COMMUNICATION' },
      { id: 8, nom: 'INDUSTRIE' },
      { id: 9, nom: 'COMMERCE' },
      { id: 10, nom: 'AUTRE' }
    ];
  }

  loadDomaines(): void {
    this.apiService.getDomaines().subscribe({
      next: (data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0] === 'string') {
            this.domaines = data.map((nom: string, index: number) => ({ id: index + 1, nom }));
          } else if (data[0] && (data[0].nom !== undefined || data[0].name !== undefined)) {
            this.domaines = data.map((item: any, index: number) => ({
              id: item.id ?? index + 1,
              nom: item.nom ?? item.name ?? item.label ?? `Domaine ${index + 1}`
            }));
          } else {
            this.domaines = this.getFallbackDomaines();
          }
        } else {
          console.warn('Aucun domaine reçu du backend, fallback appliqué');
          this.domaines = this.getFallbackDomaines();
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur chargement domaines', error);
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('recruteurId');
          alert('Session expirée. Veuillez vous reconnecter.');
          this.router.navigate(['/login']);
          return;
        }
        // Faites tomber 500 ou autre sur fallback pour éviter select vide
        this.domaines = this.getFallbackDomaines();
      }
    });
  }

  createQuestion(): void {
    if (!this.validateQuestionForm()) {
      return;
    }

    if (!this.selectedEntretienId) {
      alert('Erreur : Aucun entretien sélectionné.');
      return;
    }

    const payload: any = {
      question: this.newQuestion.question,
      type: this.newQuestion.type,
      options: this.newQuestion.type === 'QCM' ? this.newQuestion.options : null,
      points: this.newQuestion.points,
      domaineId: this.newQuestion.domaineId,
      entretienId: this.selectedEntretienId
    };

    if (this.newQuestion.type === 'QCM') {
      payload.bonneReponses = this.newQuestion.bonneReponses;
      // Pour compatibilité descendante
      payload.bonneReponse = this.newQuestion.bonneReponses.length > 0
        ? this.newQuestion.options[this.newQuestion.bonneReponses[0]]
        : '';
    } else {
      payload.bonneReponse = this.newQuestion.bonneReponse;
    }


    this.apiService.createQuestion(payload).subscribe({
      next: (response) => {
        alert('Question créée avec succès!');
        this.questions.push(response);
        this.resetQuestionForm();
      },
      error: (error) => {
        console.error('Erreur création question:', error);
        alert(`Erreur lors de la création: ${error.error?.message || error.message}`);
      }
    });
  }

  updateQuestion(question: any): void {
    const updatedData: any = {
      question: question.question,
      type: question.type,
      options: question.type === 'QCM' ? question.options : null,
      points: question.points,
      domaineId: question.domaineId
    };

    if (question.type === 'QCM') {
      updatedData.bonneReponses = question.bonneReponses || [];
      updatedData.bonneReponse = updatedData.bonneReponses.length > 0
        ? question.options[updatedData.bonneReponses[0]]
        : '';
    } else {
      updatedData.bonneReponse = question.bonneReponse;
    }

    this.apiService.updateQuestion(question.id, updatedData).subscribe({
      next: (response) => {
        alert('Question mise à jour avec succès!');
        this.loadQuestions(this.selectedEntretienId!);
      },
      error: (error) => {
        console.error('Erreur mise à jour question:', error);
        alert(`Erreur lors de la mise à jour: ${error.error?.message || error.message}`);
      }
    });
  }

  deleteQuestion(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      this.apiService.deleteQuestion(id).subscribe({
        next: () => {
          alert('Question supprimée avec succès!');
          this.questions = this.questions.filter(q => q.id !== id);
        },
        error: (error) => {
          console.error('Erreur suppression question:', error);
          alert(`Erreur lors de la suppression: ${error.error?.message || error.message}`);
        }
      });
    }
  }

  editQuestion(question: any): void {
    this.editingQuestion = { ...question };
  }

  cancelEdit(): void {
    this.editingQuestion = null;
  }

  viewQuestionDetails(question: any): void {
    let details = `
Détails de la question:

ID: ${question.id}
Question: ${question.question}
Type: ${question.type}
Points: ${question.points}
Domaine: ${question.domaineId ? 'ID: ' + question.domaineId : 'Non spécifié'}
`;

    if (question.type === 'QCM' && question.options && question.options.length > 0) {
      details += '\nOptions:\n';
      question.options.forEach((option: string, index: number) => {
        const marker = question.bonneReponses && question.bonneReponses.includes(index) ? ' ✓' : '';
        details += `${index + 1}. ${option}${marker}\n`;
      });
    }

    if (question.type === 'QCM') {
      const corrects = Array.isArray(question.bonneReponses)
        ? question.bonneReponses.map((i: number) => question.options?.[i] || '').filter((o: string) => o)
        : [question.bonneReponse];
      details += `\nBonne(s) réponse(s): ${corrects.join(', ')}`;
    } else {
      details += `\nBonne réponse: ${question.bonneReponse}`;
    }

    alert(details);
  }

  private resetQuestionForm(): void {
    this.newQuestion = {
      question: '',
      type: 'QCM',
      options: ['', '', '', ''],
      bonneReponse: '',
      bonneReponses: [],
      points: 1,
      domaineId: null
    };
  }

  validateQuestionForm(): boolean {
    if (!this.newQuestion.question || this.newQuestion.question.trim().length < 5) {
      alert('La question doit contenir au moins 5 caractères.');
      return false;
    }

    if (this.newQuestion.question.length > 500) {
      alert('La question ne peut pas dépasser 500 caractères.');
      return false;
    }

    if (!this.newQuestion.type) {
      alert('Veuillez sélectionner un type de question.');
      return false;
    }

    if (this.newQuestion.type === 'QCM') {
      const validOptions = this.newQuestion.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        alert('Une question QCM doit avoir au moins 2 options.');
        return false;
      }
      if (!this.newQuestion.bonneReponses || this.newQuestion.bonneReponses.length === 0) {
        alert('Une question QCM doit avoir au moins une réponse correcte.');
        return false;
      }
      const allSelectedValid = this.newQuestion.bonneReponses.every(index => index >= 0 && index < this.newQuestion.options.length && this.newQuestion.options[index].trim() !== '');
      if (!allSelectedValid) {
        alert('Toutes les réponses correctes doivent correspondre à des options valides.');
        return false;
      }
    }

    if (this.newQuestion.points < 1 || this.newQuestion.points > 10) {
      alert('Les points doivent être entre 1 et 10.');
      return false;
    }

    return true;
  }

  addOption(): void {
    if (this.newQuestion.options.length < 6) {
      this.newQuestion.options.push('');
    }
  }

  removeOption(index: number): void {
    if (this.newQuestion.options.length > 2) {
      this.newQuestion.options.splice(index, 1);
    }
  }
}
