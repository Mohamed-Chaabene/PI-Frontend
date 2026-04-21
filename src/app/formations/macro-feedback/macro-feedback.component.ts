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
          <h1>Félicitations ! 🎓</h1>
          <p>Vous avez terminé tout le parcours. Dernière étape avant votre certificat.</p>
        </header>

        <section class="questions">
          <div class="question-block" *ngFor="let q of questions">
            <label>{{ q.label }}</label>
            <div class="rating">
              <span *ngFor="let star of [1,2,3,4,5]" 
                    (click)="formData[q.key] = star"
                    [class.active]="formData[q.key] >= star">
                ★
              </span>
            </div>
          </div>

          <div class="question-block nps">
            <label>Quelle est la probabilité que vous recommandiez ce parcours ? (0-10)</label>
            <div class="nps-grid">
              <button *ngFor="let n of [0,1,2,3,4,5,6,7,8,9,10]" 
                      (click)="formData.npsScore = n"
                      [class.active]="formData.npsScore === n">
                {{ n }}
              </button>
            </div>
          </div>

          <div class="question-block">
            <label>Votre commentaire libre (optionnel)</label>
            <textarea [(ngModel)]="formData.freeComment" placeholder="Dites-nous ce que vous en avez pensé..."></textarea>
          </div>
        </section>

        <footer>
          <button class="btn-submit" 
                  [disabled]="!isFormValid() || submitting"
                  (click)="submit()">
            <span *ngIf="!submitting">Finaliser & Obtenir mon certificat</span>
            <span *ngIf="submitting">Envoi en cours...</span>
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .feedback-container {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f8f9fa;
    }
    .feedback-card {
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      max-width: 650px;
      width: 100%;
    }
    header { text-align: center; margin-bottom: 2rem; }
    header h1 { color: #0d6efd; margin-bottom: 0.5rem; }
    
    .question-block { margin-bottom: 1.5rem; }
    .question-block label { display: block; font-weight: 600; margin-bottom: 0.8rem; color: #344767; }
    
    .rating { font-size: 1.8rem; color: #ddd; cursor: pointer; }
    .rating span { margin-right: 5px; transition: color 0.2s; }
    .rating span.active { color: #ffc107; }
    
    .nps-grid { display: flex; gap: 4px; justify-content: space-between; flex-wrap: wrap; }
    .nps-grid button { 
      width: 40px; height: 40px; border: 1px solid #ddd; background: white; 
      border-radius: 4px; cursor: pointer; transition: all 0.2s;
    }
    .nps-grid button.active { background: #0d6efd; color: white; border-color: #0d6efd; }
    
    textarea { width: 100%; min-height: 80px; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; }
    
    .btn-submit {
      width: 100%; padding: 1rem; border: none; border-radius: 8px;
      background: #0d6efd; color: white; font-weight: 600; font-size: 1.1rem;
      cursor: pointer; transition: opacity 0.2s;
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class MacroFeedbackComponent implements OnInit {
  parcoursId!: number;
  submitting = false;

  questions = [
    { label: 'Qualité globale du contenu', key: 'globalQualityScore' },
    { label: 'Clarté des explications', key: 'explanationScore' },
    { label: 'Pertinence des quiz', key: 'quizRelevanceScore' },
    { label: 'Facilité de navigation', key: 'navigationScore' },
    { label: 'Note globale du parcours', key: 'overallRating' }
  ];

  formData: any = {
    globalQualityScore: 0,
    explanationScore: 0,
    quizRelevanceScore: 0,
    navigationScore: 0,
    npsScore: -1,
    overallRating: 0,
    freeComment: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.parcoursId = Number(this.route.snapshot.paramMap.get('id'));
    // En production on récupérerait l'inscriptionId lié
  }

  isFormValid(): boolean {
    return this.formData.globalQualityScore > 0 &&
           this.formData.explanationScore > 0 &&
           this.formData.quizRelevanceScore > 0 &&
           this.formData.navigationScore > 0 &&
           this.formData.npsScore >= 0 &&
           this.formData.overallRating > 0;
  }

  submit(): void {
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
          alert("Merci ! Votre parcours est validé et votre certificat est en cours de préparation.");
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
