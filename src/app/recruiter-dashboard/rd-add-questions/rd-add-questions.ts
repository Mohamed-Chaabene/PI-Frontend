import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface QuestionForm {
  contenu: string;
  type: string;
  domaineId: number | null;
  domaineTexte: string;
  choix: string[];
  bonneReponse: string;
  niveau: string;
}

@Component({
  selector: 'app-rd-add-questions',
  imports: [CommonModule, FormsModule],
  templateUrl: './rd-add-questions.html',
  styleUrls: ['./rd-add-questions.scss'],
})
export class RdAddQuestions implements OnInit {
  entretienId = 0;
  domaines: any[] = [];
  typesQuestion = ['QCM', 'QCU', 'VRAI_FAUX'];
  niveaux = ['FACILE', 'MOYEN', 'DIFFICILE'];
  newQuestion: QuestionForm = {
    contenu: '',
    type: '',
    domaineId: null,
    domaineTexte: '',
    choix: ['', '', '', ''],
    bonneReponse: '',
    niveau: ''
  };
  questions: any[] = [];

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
    this.apiService.getDomaines().subscribe({
      next: (data) => {
        this.domaines = data && data.length ? data : [
          { id: 1, nom: 'IT' },
          { id: 2, nom: 'Santé' },
          { id: 3, nom: 'Marketing' },
          { id: 4, nom: 'Autre' }
        ];
      },
      error: (error) => {
        console.error('Error loading domaines', error);
        this.domaines = [
          { id: 1, nom: 'IT' },
          { id: 2, nom: 'Santé' },
          { id: 3, nom: 'Marketing' },
          { id: 4, nom: 'Autre' }
        ];
      }
    });
  }

  loadQuestions(): void {
    this.apiService.getQuestionsByEntretien(this.entretienId).subscribe({
      next: (data) => this.questions = data,
      error: (error) => console.error('Error loading questions', error)
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

  createQuestion(): void {
    // Debug: Check if user has token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Vous n\'êtes pas connecté. Veuillez vous connecter avec un compte Recruteur.');
      console.error('No token found');
      return;
    }

    // Debug: Check token role (if jwt-decode available)
    try {
      const jwtDecode = (window as any).jwtDecode;
      if (jwtDecode) {
        const decoded = jwtDecode(token);
        console.log('🔐 Token decoded:', decoded);
        console.log('🎭 Roles in token:', decoded.authorities || decoded.roles || 'No roles found');
        console.log('👤 User ID in token:', decoded.id || decoded.userId || 'No ID found');
      }
    } catch (e) {
      console.log('Could not decode token for inspection');
    }

    const domaineId = this.newQuestion.domaineId;
    const domaineTexte = this.newQuestion.domaineTexte;
    if (!this.newQuestion.contenu || !this.newQuestion.type || !this.newQuestion.niveau || !(domaineId || domaineTexte) || !this.newQuestion.bonneReponse) {
      alert('Veuillez remplir tous les champs du formulaire (type, domaine, niveau, bonne réponse).');
      return;
    }

    const choixElements = this.newQuestion.type !== 'VRAI_FAUX'
      ? this.newQuestion.choix.map((c, i) => ({
          texte: c.trim(),
          correcte: c.trim() === this.newQuestion.bonneReponse,
          ordre: i + 1
        })).filter(c => c.texte)
      : [
          { texte: 'VRAI', correcte: this.newQuestion.bonneReponse === 'VRAI', ordre: 1 },
          { texte: 'FAUX', correcte: this.newQuestion.bonneReponse === 'FAUX', ordre: 2 }
        ];

    // Convert domaineId to number (it comes as string from form)
    const domaineIdNumber = domaineId ? parseInt(domaineId as any, 10) : null;

    let domaineString = null;
    if (domaineIdNumber && domaineIdNumber !== -1) {
      const selectedDomaine = this.domaines.find((d) => d.id === domaineIdNumber);
      domaineString = selectedDomaine ? selectedDomaine.nom : null;
    } else if (domaineTexte) {
      domaineString = domaineTexte;
    }

    const questionOrder = this.questions && this.questions.length ? this.questions.length + 1 : 1;

    const questionData = {
      contenu: this.newQuestion.contenu,
      type: this.newQuestion.type,
      niveau: this.newQuestion.niveau,
      domaine: domaineString, // Send as string (enum name)
      choix: choixElements,
      ordre: questionOrder,
      actif: true,
      entretienId: this.entretienId
    };

    console.log('📤 Sending question data:', questionData);
    console.log('🔑 Token will be added by interceptor:', token?.substring(0, 50) + '...');

    this.apiService.createQuestion(questionData).subscribe({
      next: (response) => {
        alert('✅ Question ajoutée avec succès!');
        this.questions.push(response);
        this.newQuestion = {
          contenu: '',
          type: '',
          domaineId: null,
          domaineTexte: '',
          choix: ['', '', '', ''],
          bonneReponse: '',
          niveau: ''
        };
      },
      error: (error) => {
        console.error('❌ Error creating question', error);
        console.error('🔻 backend error body:', error.error);
        console.error('🔻 status:', error.status, error.statusText);

        // Better error handling for 403
        if (error.status === 403) {
          alert(`❌ Accès refusé (403). Causes possibles:\n\n1. Vous n'êtes pas connecté comme Recruteur\n2. Votre session a expiré\n3. Le serveur a rejeté votre token\n\nVeuillez vous reconnecter en tant que Recruteur.`);
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/';
        } else if (error.status === 401) {
          alert('❌ Non autorisé (401). Token invalide. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          window.location.href = '/';
        } else {
          const backendMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
          alert(`Erreur lors de l'ajout de la question: ${backendMessage || error.message || error.statusText}`);
        }
      }
    });
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
