import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-micro-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-content animate-in">
        <div class="badge-container">
          <span class="level-badge">{{ niveau === 'EXPERT' ? 'Expert' : (niveau === 'AVANCE' ? 'Avancé' : 'Intermédiaire') }} validé</span>
        </div>

        <h3>Comment s'est passé ce niveau ?</h3>
        <p class="subtitle">30 secondes pour partager votre ressenti — cela aide les prochains candidats.</p>

        <div class="question-section">
          <label class="main-label">Votre note globale sur ce niveau</label>
          <div class="stars">
            <span *ngFor="let s of [1,2,3,4,5]" (click)="note = s" [class.active]="note >= s">★</span>
          </div>
        </div>

        <div class="question-section">
          <label>Le contenu était...</label>
          <div class="chips">
            <button *ngFor="let option of contentOptions" 
                    [class.active]="clarite === option"
                    (click)="clarite = option">
              {{ option }}
            </button>
          </div>
        </div>

        <div class="question-section">
          <label>La difficulté était...</label>
          <div class="chips">
            <button *ngFor="let option of difficultyOptions" 
                    [class.active]="difficulte === option"
                    (click)="difficulte = option">
              {{ option }}
            </button>
          </div>
        </div>

        <div class="question-section">
          <div class="label-row">
            <label>Un commentaire ?</label>
            <span class="optional">Optionnel</span>
          </div>
          <textarea [(ngModel)]="commentaire" 
                    placeholder="Ce qui vous a aidé, ce qui pourrait être amélioré..."
                    maxlength="200"></textarea>
          <div class="char-count">{{ commentaire.length }} / 200</div>
        </div>

        <div class="actions">
          <button class="btn-skip" (click)="onSkip()">Passer</button>
          <button class="btn-submit" [disabled]="submitting || !isFormValid()" (click)="onSubmit()">
            {{ submitting ? 'Envoi...' : 'Envoyer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 2000;
    }
    .modal-content {
      background: white; padding: 2rem; border-radius: 20px; width: 95%; max-width: 480px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      font-family: 'Inter', sans-serif;
    }
    .animate-in { animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .badge-container { margin-bottom: 1rem; }
    .level-badge { 
      background: #f0f4ff; color: #5c67f2; padding: 4px 12px; border-radius: 20px;
      font-size: 0.8rem; font-weight: 600;
    }

    h3 { margin: 0 0 0.5rem; color: #1a1a1a; font-size: 1.4rem; font-weight: 700; }
    .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.4; }

    .question-section { margin-bottom: 1.5rem; }
    .question-section label { display: block; margin-bottom: 0.75rem; font-weight: 600; font-size: 0.95rem; color: #333; }
    .main-label { text-align: center; color: #444; }

    .stars { font-size: 2rem; color: #e0e0e0; cursor: pointer; display: flex; justify-content: center; gap: 8px; margin: 0.5rem 0 1rem; }
    .stars span { transition: all 0.2s; }
    .stars span.active { color: #ffc107; transform: scale(1.1); }
    
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips button { 
      padding: 8px 16px; border: 1px solid #eee; background: white; border-radius: 8px;
      font-size: 0.85rem; color: #555; cursor: pointer; transition: all 0.2s;
    }
    .chips button:hover { background: #f8f9fa; border-color: #ddd; }
    .chips button.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }

    .label-row { display: flex; justify-content: space-between; align-items: center; }
    .optional { font-size: 0.75rem; color: #999; font-weight: 400; }
    
    textarea { 
      width: 100%; min-height: 80px; padding: 0.8rem; border: 1px solid #eee; border-radius: 12px;
      font-family: inherit; font-size: 0.9rem; transition: border-color 0.2s; resize: none;
    }
    textarea:focus { border-color: #1a1a1a; outline: none; }
    .char-count { text-align: right; font-size: 0.7rem; color: #999; margin-top: 4px; }

    .actions { display: flex; gap: 12px; margin-top: 1rem; }
    button { flex: 1; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; }
    .btn-skip { background: #f8f9fa; color: #666; }
    .btn-skip:hover { background: #f0f0f0; }
    .btn-submit { background: #0061ff; color: white; }
    .btn-submit:hover { background: #0056e0; box-shadow: 0 4px 12px rgba(0,97,255,0.3); }
    button:disabled { opacity: 0.5; filter: grayscale(1); }
  `]
})
export class MicroFeedbackComponent {
  @Input() inscriptionId!: number;
  @Input() parcoursId!: number;
  @Input() niveau!: string;
  @Output() completed = new EventEmitter<void>();

  note = 0;
  clarite = '';
  difficulte = '';
  commentaire = '';
  submitting = false;

  contentOptions = ['Très clair', 'Assez clair', 'Parfois confus', 'Difficile à suivre'];
  difficultyOptions = ['Trop facile', 'Bien adaptée', 'Un peu difficile', 'Trop difficile'];

  constructor(private http: HttpClient) {}

  isFormValid() {
    return this.note > 0 && this.clarite !== '' && this.difficulte !== '';
  }

  onSkip() {
    this.completed.emit();
  }

  onSubmit() {
    if (!this.isFormValid()) return;
    this.save();
  }

  private save() {
    this.submitting = true;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const payload = {
      inscriptionId: this.inscriptionId,
      parcoursId: this.parcoursId,
      candidatId: user.id,
      niveau: this.niveau,
      note: this.note,
      clarite: this.clarite,
      difficulte: this.difficulte,
      commentaire: this.commentaire
    };

    this.http.post('http://localhost:8080/api/feedbacks/micro', payload)
      .subscribe({
        next: () => this.completed.emit(),
        error: () => this.completed.emit() 
      });
  }
}
