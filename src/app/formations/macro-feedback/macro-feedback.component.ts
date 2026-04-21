import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-macro-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="feedback-container">
      <div class="feedback-card">
        <header>
          <div class="badge-container">
            <span class="status-badge">Parcours complet</span>
          </div>
          <h1>Votre expérience globale</h1>
          <p class="subtitle">Quelques questions sur votre parcours complet — requis pour obtenir votre certificat.</p>
          
          <div class="progress-info">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" [style.width.%]="calculateProgress()"></div>
            </div>
            <span class="progress-text">{{ completedSteps() }} / 4</span>
          </div>
        </header>

        <main class="form-body">
          <section class="question-block">
            <label class="center-label">Note globale du parcours</label>
            <div class="stars-centered">
              <span *ngFor="let s of [1,2,3,4,5]" 
                    (click)="formData.noteGlobale = s"
                    [class.active]="formData.noteGlobale >= s">★</span>
            </div>
          </section>

          <section class="question-block">
            <label>La progression entre les niveaux était...</label>
            <div class="chips-grid">
              <button *ngFor="let opt of progressionOptions"
                      [class.active]="formData.progression === opt"
                      (click)="formData.progression = opt">
                {{ opt }}
              </button>
            </div>
          </section>

          <section class="question-block">
            <label>Les quiz de validation étaient...</label>
            <div class="chips-grid">
              <button *ngFor="let opt of quizOptions"
                      [class.active]="formData.experienceQuiz === opt"
                      (click)="formData.experienceQuiz = opt">
                {{ opt }}
              </button>
            </div>
          </section>

          <section class="question-block">
            <label>Recommanderiez-vous ce parcours ?</label>
            <div class="chips-grid">
              <button *ngFor="let opt of recommandationOptions"
                      [class.active]="formData.recommandation === opt"
                      (click)="formData.recommandation = opt">
                {{ opt }}
              </button>
            </div>
          </section>

          <section class="question-block">
            <div class="label-row">
              <label>Commentaire libre</label>
              <span class="optional">Optionnel</span>
            </div>
            <textarea [(ngModel)]="formData.commentaireLibre" 
                      maxlength="500"
                      placeholder="Ce que vous avez le plus apprécié, ce qui pourrait être amélioré, ce que vous aimeriez voir ensuite..."></textarea>
            <div class="char-count">{{ formData.commentaireLibre.length }} / 500</div>
          </section>
        </main>

        <footer>
          <div class="footer-info">
            <p>Requis pour le certificat</p>
          </div>
          <button class="btn-certif" 
                  [disabled]="!isFormValid() || submitting"
                  (click)="submit()">
            {{ submitting ? 'Envoi...' : 'Obtenir mon certificat' }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .feedback-container {
      min-height: 100vh; background: #fafafb; display: flex; align-items: flex-start; justify-content: center; padding: 3rem 1rem;
    }
    .feedback-card {
      background: white; width: 100%; max-width: 600px; padding: 2.5rem; border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.04); font-family: 'Inter', sans-serif;
    }
    
    header { text-align: center; margin-bottom: 2.5rem; }
    .status-badge { 
      background: #e8f5e9; color: #2e7d32; padding: 6px 16px; border-radius: 20px;
      font-size: 0.85rem; font-weight: 600; display: inline-block; margin-bottom: 1rem;
    }
    h1 { margin: 0 0 0.5rem; color: #1a1a1a; font-size: 1.75rem; font-weight: 800; }
    .subtitle { color: #666; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
    
    .progress-info { display: flex; align-items: center; gap: 12px; max-width: 200px; margin: 0 auto; }
    .progress-bar-bg { flex: 1; height: 6px; background: #eee; border-radius: 10px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: #0061ff; transition: width 0.3s ease; }
    .progress-text { font-size: 0.8rem; font-weight: 700; color: #999; }

    .question-block { margin-bottom: 2rem; border-bottom: 1px solid #f0f0f0; padding-bottom: 1.5rem; }
    .question-block:last-child { border-bottom: none; }
    .question-block label { display: block; margin-bottom: 1rem; font-weight: 600; color: #333; font-size: 1rem; }
    .center-label { text-align: center; }

    .stars-centered { display: flex; justify-content: center; gap: 10px; font-size: 2.5rem; color: #e0e0e0; cursor: pointer; margin: 0.5rem 0; }
    .stars-centered span { transition: all 0.2s; }
    .stars-centered span.active { color: #ffc107; transform: scale(1.1); }

    .chips-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .chips-grid button {
      padding: 10px 20px; border: 1px solid #eee; background: white; border-radius: 10px;
      font-size: 0.9rem; font-weight: 500; color: #555; cursor: pointer; transition: all 0.2s;
    }
    .chips-grid button:hover { background: #f8f9fa; border-color: #ddd; }
    .chips-grid button.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }

    .label-row { display: flex; justify-content: space-between; align-items: center; }
    .optional { font-size: 0.8rem; color: #999; }

    textarea {
      width: 100%; min-height: 120px; padding: 1rem; border: 1px solid #eee; border-radius: 16px;
      font-family: inherit; font-size: 0.95rem; line-height: 1.5; resize: none; transition: border-color 0.2s;
    }
    textarea:focus { border-color: #1a1a1a; outline: none; }
    .char-count { text-align: right; font-size: 0.75rem; color: #999; margin-top: 6px; }

    footer { 
      margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .footer-info p { margin: 0; color: #888; font-size: 0.85rem; font-weight: 500; }
    .btn-certif {
      width: 100%; padding: 16px; border: none; border-radius: 16px; background: #0061ff;
      color: white; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(0,97,255,0.2);
    }
    .btn-certif:hover { background: #0056e0; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,97,255,0.3); }
    .btn-certif:disabled { opacity: 0.5; transform: none; box-shadow: none; filter: grayscale(1); cursor: not-allowed; }
  `]
})
export class MacroFeedbackComponent implements OnInit {
  parcoursId!: number;
  submitting = false;

  formData: any = {
    noteGlobale: 0,
    progression: '',
    experienceQuiz: '',
    recommandation: '',
    commentaireLibre: ''
  };

  progressionOptions = ['Très fluide', 'Correcte', 'Parfois abrupte', 'Trop rapide'];
  quizOptions = ['Très pertinents', 'Adaptés', 'Trop faciles', 'Trop difficiles'];
  recommandationOptions = ['Absolument', 'Probablement', 'Pas sûr(e)', 'Non'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.parcoursId = Number(this.route.snapshot.paramMap.get('id'));
  }

  completedSteps(): number {
    let count = 0;
    if (this.formData.noteGlobale > 0) count++;
    if (this.formData.progression !== '') count++;
    if (this.formData.experienceQuiz !== '') count++;
    if (this.formData.recommandation !== '') count++;
    return count;
  }

  calculateProgress(): number {
    return (this.completedSteps() / 4) * 100;
  }

  isFormValid(): boolean {
    return this.completedSteps() === 4;
  }

  submit(): void {
    if (!this.isFormValid()) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const inscription = JSON.parse(localStorage.getItem('currentParcoursInscription') || '{}');

    if (!user.id || !inscription.id) {
       alert("Erreur de session. Veuillez vous reconnecter.");
       return;
    }

    this.submitting = true;
    const payload = {
      ...this.formData,
      candidatId: user.id,
      parcoursId: this.parcoursId,
      inscriptionId: inscription.id
    };

    this.http.post('http://localhost:8080/api/feedbacks/macro', payload)
      .subscribe({
        next: () => {
          alert("Merci ! Votre parcours est validé et votre certificat est prêt.");
          this.router.navigate(['/candidat-dashboard']); 
        },
        error: (err) => {
          console.error(err);
          alert("Une erreur s'est produite lors de l'envoi.");
          this.submitting = false;
        }
      });
  }
}
