import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface QuestionForm {
  contenu: string;
  type: string;
  choix: string[];
  bonneReponse: string;
  bonneReponses: number[]; // pour QCM, plusieurs réponses correctes
  niveau: string;
  points: number;
  ordre: number;
}

interface ValidationErrors {
  contenu?: string[];
  type?: string[];
  niveau?: string[];
  domaine?: string[];
  choix?: string[];
  bonneReponse?: string[];
  points?: string[];
  general?: string[];
}

@Component({
  selector: 'app-rd-add-questions',
  imports: [CommonModule, FormsModule],
  templateUrl: './rd-add-questions.html',
  styleUrls: ['./rd-add-questions.scss'],
})
export class RdAddQuestions implements OnInit {
  entretienId = 0;
  domaines: any[] = [
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
  typesQuestion = ['QCM', 'QCU', 'VRAI_FAUX'];
  niveaux = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT'];
  newQuestion: QuestionForm = {
    contenu: '',
    type: '',
    choix: ['', '', '', ''],
    bonneReponse: '',
    bonneReponses: [],
    niveau: '',
    points: 1,
    ordre: 1
  };
  validationErrors: ValidationErrors = {};
  questions: any[] = [];
  editingQuestion: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.entretienId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDomaines();
    this.loadQuestions();
  }

  loadDomaines(): void {
    console.log('🔄 Chargement des domaines depuis le backend...');
    this.apiService.getDomaines().subscribe({
      next: (data: any) => {
        console.log('📥 Réponse brute du backend:', data);
        console.log('📥 Type de data:', typeof data);
        console.log('📥 Est un array?', Array.isArray(data));
        console.log('📥 Longueur:', data?.length);
        
        // Si le backend retourne un array d'objets avec id et nom
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('📍 Premier élément:', data[0]);
          console.log('📍 Type du premier élément:', typeof data[0]);
          console.log('📍 Keys du premier élément:', Object.keys(data[0] || {}));
          
          if (data[0].nom !== undefined) {
            console.log('✅ Format correct détecté (avec propriété "nom")');
            this.domaines = data;
          } else if (typeof data[0] === 'string') {
            console.log('✅ Array de strings détecté, conversion en cours...');
            this.domaines = data.map((nom: string, id: number) => ({ id: id + 1, nom }));
          } else {
            console.warn('⚠️ Format non reconnu, utilisation du fallback');
            this.useFallbackDomaines();
          }
        } else {
          console.warn('⚠️ Data vide ou non-array, utilisation du fallback');
          this.useFallbackDomaines();
        }
        
        console.log('✅ Domaines finaux pour le select:', this.domaines);
        console.log('✅ Nombre de domaines:', this.domaines.length);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des domaines:', error);
        console.error('📍 Status:', error.status);
        console.error('📍 Message:', error.message);
        console.error('📍 Error object:', error);
        this.useFallbackDomaines();
      }
    });
  }

  private useFallbackDomaines(): void {
    console.log('🔧 Utilisation des domaines par défaut (fallback)');
    this.domaines = [
      { id: 1, nom: 'INFORMATIQUE' },
      { id: 2, nom: 'BUSINESS' },
      { id: 3, nom: 'SANTÉ' },
      { id: 4, nom: 'INGÉNIERIE' },
      { id: 5, nom: 'ÉDUCATION' },
      { id: 6, nom: 'DESIGN' },
      { id: 7, nom: 'COMMUNICATION' },
      { id: 8, nom: 'INDUSTRIE' },
      { id: 9, nom: 'COMMERCE' },
      { id: 10, nom: 'Autre' }
    ];
    console.log('✅ Fallback domaines chargés:', this.domaines);
  }

  loadQuestions(): void {
    this.apiService.getQuestionsByEntretien(this.entretienId).subscribe({
      next: (data) => this.questions = data,
      error: (error) => console.error('Error loading questions', error)
    });
  }

  getCorrectAnswers(question: any): string {
    if (Array.isArray(question.choix)) {
      const correctChoices = question.choix
        .filter((c: any) => c.correcte === true || c.correct === true || c.isCorrecte === true)
        .map((c: any) => c.texte || c.contenu || c);
      if (correctChoices.length > 0) {
        return correctChoices.join(', ');
      }
    }

    if (question.type === 'QCU' || question.type === 'VRAI_FAUX') {
      // Cas QCU / Vrai-Faux où la cible est dans question.bonneReponse.
      if (question.bonneReponse) {
        return question.bonneReponse;
      }
      // si question.choix contient bools, retourne l'option correcte
      if (Array.isArray(question.choix)) {
        const firstCorrect = question.choix.find((c: any) => c.correcte === true || c.correct === true || c.isCorrecte === true);
        if (firstCorrect) {
          return firstCorrect.texte || firstCorrect.contenu || firstCorrect;
        }
      }
    }

    // Utilise fallback de la propriété ancienne si présente
    if (question.bonneReponse) {
      return question.bonneReponse;
    }

    return '-';
  }

  getChoiceText(choice: any): string {
    if (choice == null) {
      return '';
    }
    if (typeof choice === 'string') {
      return choice;
    }
    return choice.texte || choice.contenu || JSON.stringify(choice);
  }

  editQuestion(question: any): void {
    this.editingQuestion = question;
    this.newQuestion.contenu = question.contenu || question.question || '';
    this.newQuestion.type = question.type || 'QCM';
    this.newQuestion.niveau = question.niveau || '';
    this.newQuestion.choix = (Array.isArray(question.choix) ? question.choix.map((c: any) => c.texte || c.contenu || c) : ['', '', '', '']).slice();
    this.newQuestion.bonneReponse = question.bonneReponse || '';
    this.newQuestion.points = question.points || 1;
    this.newQuestion.ordre = question.ordre || 1;

    this.newQuestion.bonneReponses = (Array.isArray(question.choix)
      ? question.choix.map((c: any, i: number) => c.correcte || c.correct === true || c.isCorrecte === true ? i : -1).filter((i: number) => i >= 0)
      : []);
  }

  deleteQuestion(questionId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return;
    }
    this.apiService.deleteQuestion(questionId).subscribe({
      next: () => {
        this.questions = this.questions.filter(q => q.id !== questionId);
        alert('Question supprimée.');
      },
      error: error => {
        console.error('Error deleting question', error);
        alert('Erreur lors de la suppression de la question.');
      }
    });
  }

  private buildQuestionDto(): any {
    // Récupérer le domaine correctement
    let domaine = '';
    
    console.log('🏗️ buildQuestionDto() - Building payload');
    
    // Domaine est défini par l'entretien parent. ne pas envoyer domaine dans question.

    let choixDTO: any[] = [];

    if (this.newQuestion.type === 'VRAI_FAUX') {
      choixDTO = [
        { texte: 'VRAI', correcte: this.newQuestion.bonneReponse === 'VRAI', ordre: 1 },
        { texte: 'FAUX', correcte: this.newQuestion.bonneReponse === 'FAUX', ordre: 2 }
      ];
    } else {
      choixDTO = this.newQuestion.choix
        .map((texte, i) => ({
          texte: texte.trim(),
          correcte: this.newQuestion.type === 'QCM'
            ? this.newQuestion.bonneReponses.includes(i)
            : this.newQuestion.bonneReponse.trim() !== '' && this.newQuestion.bonneReponse.trim() === texte.trim(),
          ordre: i + 1
        }))
        .filter(c => c.texte);
    }

    const payload: any = {
      contenu: this.newQuestion.contenu.trim(),
      type: this.newQuestion.type,
      niveau: this.newQuestion.niveau,
      ordre: this.newQuestion.ordre || 1,
      actif: true,
      points: this.newQuestion.points,
      choix: choixDTO
    };

    console.log('📤 Payload finalisé:', payload);
    console.log('   Domaine field in payload:', payload.domaine);
    console.log('   Payload JSON:', JSON.stringify(payload));

    if (this.newQuestion.type === 'QCM') {
      payload.bonneReponses = this.newQuestion.bonneReponses;
      if (!payload.bonneReponse && this.newQuestion.bonneReponses.length > 0 && choixDTO.length > 0) {
        payload.bonneReponse = choixDTO[this.newQuestion.bonneReponses[0]]?.texte;
      }

      // Harmonisation des choix QCM : au moins 1 correcte est déjà garantis côté backend
      if (!payload.bonneReponse && choixDTO.length > 0 && choixDTO.some(c => c.correcte)) {
        payload.bonneReponse = choixDTO.find(c => c.correcte)!.texte;
      }
    } else {
      payload.bonneReponse = this.newQuestion.bonneReponse;
    }

    return payload;
  }

  cancelEdit(): void {
    this.editingQuestion = null;
    this.resetQuestionForm();
    this.validationErrors = {};
  }

  /**
   * Valide tous les champs du formulaire
   * @returns true si la validation réussit, false sinon
   */
  private validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validation du contenu
    const contenuTrimmed = this.newQuestion.contenu.trim();
    if (!contenuTrimmed) {
      this.validationErrors.contenu = ['Le contenu est obligatoire'];
      isValid = false;
    } else if (contenuTrimmed.length < 10) {
      this.validationErrors.contenu = ['Le contenu doit contenir au minimum 10 caractères'];
      isValid = false;
    } else if (contenuTrimmed.length > 1000) {
      this.validationErrors.contenu = ['Le contenu doit contenir au maximum 1000 caractères'];
      isValid = false;
    }

    // Validation du type
    if (!this.newQuestion.type) {
      this.validationErrors.type = ['Le type de question est obligatoire'];
      isValid = false;
    }

    // Validation du niveau
    if (!this.newQuestion.niveau) {
      this.validationErrors.niveau = ['Le niveau est obligatoire'];
      isValid = false;
    }

    // Validation des points
    if (!this.newQuestion.points || this.newQuestion.points < 1 || this.newQuestion.points > 100) {
      this.validationErrors.points = ['Les points doivent être entre 1 et 100'];
      isValid = false;
    }

    // Domaine géré par l'entretien parent, on ignore la validation sur la question.

    // Validation des réponses
    if (this.newQuestion.type === 'QCM') {
      if (this.newQuestion.bonneReponses.length === 0) {
        this.validationErrors.bonneReponse = ['Sélectionnez au moins une réponse correcte pour QCM'];
        isValid = false;
      }
      // Vérifier qu'il y a au moins 2 choix et que sont non-vides
      const validChoices = this.newQuestion.choix.filter((c: string) => c.trim());
      if (validChoices.length < 2) {
        this.validationErrors.choix = ['QCM doit avoir au moins 2 réponses'];
        isValid = false;
      }
    } else if (this.newQuestion.type === 'QCU') {
      if (!this.newQuestion.bonneReponse) {
        this.validationErrors.bonneReponse = ['Sélectionnez la bonne réponse pour QCU'];
        isValid = false;
      }
      const validChoices = this.newQuestion.choix.filter((c: string) => c.trim());
      if (validChoices.length < 2) {
        this.validationErrors.choix = ['QCU doit avoir au moins 2 réponses'];
        isValid = false;
      }
    } else if (this.newQuestion.type === 'VRAI_FAUX') {
      if (!this.newQuestion.bonneReponse) {
        this.validationErrors.bonneReponse = ['Sélectionnez Vrai ou Faux'];
        isValid = false;
      }
    }

    if (!isValid) {
      this.scrollToFirstError();
    }

    return isValid;
  }

  /**
   * Scroll vers le premier champ avec erreur
   */
  private scrollToFirstError(): void {
    const firstErrorKey = Object.keys(this.validationErrors)[0];
    if (firstErrorKey) {
      const element = document.querySelector(`[data-validation-field="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /**
   * Retourne les erreurs pour un champ spécifique
   */
  getFieldErrors(fieldName: keyof ValidationErrors): string[] {
    return this.validationErrors[fieldName] || [];
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasFieldError(fieldName: keyof ValidationErrors): boolean {
    return (this.validationErrors[fieldName] || []).length > 0;
  }

  saveQuestion(): void {
    // STEP 1: Log form state before validation
    console.log('🔍 STEP 1 - Form validation started');

    // Valider le formulaire en premier
    if (!this.validateForm()) {
      console.warn('❌ Validation failed:', this.validationErrors);
      return;
    }

    console.log('✅ STEP 2 - Form validation passed');

    if (this.editingQuestion) {
      const payload = this.buildQuestionDto();
      console.log('🔍 STEP 3 - Final payload ready (UPDATE):', payload);
      console.log('  Payload.domaine:', payload.domaine, '(type:', typeof payload.domaine + ')');
      this.apiService.updateQuestion(this.editingQuestion.id, payload).subscribe({
        next: (res) => {
          console.log('✅ Question updated successfully');
          this.loadQuestions();
          this.editingQuestion = null;
          this.resetQuestionForm();
          this.validationErrors = {};
          alert('Question modifiée avec succès !');
        },
        error: (error) => {
          console.error('❌ Error updating question', error);
          console.error('🔻 backend error body:', JSON.stringify(error.error));
          console.error('🔻 status:', error.status, error.statusText);

          if (error.status === 403) {
            alert(`❌ Accès refusé (403). Veuillez vous reconnecter en tant que Recruteur.`);
            localStorage.removeItem('token');
            window.location.href = '/';
          } else if (error.status === 401) {
            alert('❌ Non autorisé (401). Token invalide. Veuillez vous reconnecter.');
            localStorage.removeItem('token');
            window.location.href = '/';
          } else if (error.status === 500) {
            const backendMsg = error.error?.message || error.error?.msg || 'Erreur serveur';
            console.error('💥 Backend validation error:', backendMsg);
            alert(`❌ Erreur serveur (500): ${backendMsg}\n\nVérifiez la console pour plus de détails.`);
          } else {
            const backendMessage = typeof error.error === 'string' ? error.error : (error.error?.message || JSON.stringify(error.error));
            alert(`Erreur lors de la mise à jour: ${backendMessage || error.message || error.statusText}`);
          }
        }
      });
      return;
    }

    // Création d'une nouvelle question
    const createDto = this.buildQuestionDto();
    console.log('🔍 STEP 3 - Final payload ready (CREATE):', createDto);
    console.log('  Payload.domaine:', createDto.domaine, '(type:', typeof createDto.domaine + ')');
    console.log('  Payload keys:', Object.keys(createDto));
    this.apiService.createQuestion(this.entretienId, createDto).subscribe({
      next: (response) => {
        alert('✅ Question ajoutée avec succès!');
        this.questions.push(response);
        this.resetQuestionForm();
        this.validationErrors = {};
      },
      error: (error) => {
        console.error('❌ Error creating question', error);
        console.error('🔻 backend error body:', JSON.stringify(error.error));
        console.error('🔻 status:', error.status, error.statusText);

        if (error.status === 403) {
          alert(`❌ Accès refusé (403). Veuillez vous reconnecter en tant que Recruteur.`);
          localStorage.removeItem('token');
          window.location.href = '/';
        } else if (error.status === 401) {
          alert('❌ Non autorisé (401). Token invalide. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          window.location.href = '/';
        } else if (error.status === 500) {
          const backendMsg = error.error?.message || error.error?.msg || 'Erreur serveur';
          console.error('💥 Backend validation error:', backendMsg);
          alert(`❌ Erreur serveur (500): ${backendMsg}\n\nVérifiez la console pour plus de détails.`);
        } else {
          const backendMessage = typeof error.error === 'string' ? error.error : (error.error?.message || JSON.stringify(error.error));
          alert(`Erreur lors de la création de la question: ${backendMessage || error.message || error.statusText}`);
        }
      }
    });
  }

  addChoice(): void {
    if (this.newQuestion.type === 'VRAI_FAUX') {
      return;
    }
    this.newQuestion.choix.push('');
  }

  removeChoice(index: number): void {
    if (this.newQuestion.choix.length > 2) {
      this.newQuestion.choix.splice(index, 1);
    }
  }

  private resetQuestionForm(): void {
    this.newQuestion = {
      contenu: '',
      type: '',
      choix: ['', '', '', ''],
      bonneReponse: '',
      bonneReponses: [],
      niveau: '',
      points: 1,
      ordre: 1
    };
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByDomaine(index: number, domaine: any): any {
    return domaine?.id;
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
    }
    if (this.newQuestion.type === 'VRAI_FAUX') {
      this.newQuestion.choix = [];
    } else if (this.newQuestion.type !== 'VRAI_FAUX' && this.newQuestion.choix.length < 2) {
      this.newQuestion.choix = ['', '', '', ''];
    }
  }

  goBack(): void {
    this.router.navigate(['/recruiter-dashboard/interviews']);
  }

  testAuth(): void {
    console.log('🔍 Testing authentication...');
    this.apiService.testAuth().subscribe({
      next: (response) => {
        console.log('✅ Auth test successful:', response);
        alert(`Authentification valide:\n- Authentifié: ${response.authenticated}\n- Autorités: ${response.authorities}\n- Nom: ${response.name}`);
      },
      error: (error) => {
        console.error('❌ Auth test failed:', error);
        alert(`Erreur d'authentification:\nStatus: ${error.status}\nMessage: ${error.error || error.message}`);
      }
    });
  }
}
