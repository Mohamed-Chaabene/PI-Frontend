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
      <div class="modal-content">
        <h3>Votre avis nous intéresse ! 💡</h3>
        <p>Prenez 10 secondes pour nous aider à améliorer ce niveau.</p>

        <div class="question">
          <label>Clarté du contenu :</label>
          <div class="stars">
            <span *ngFor="let s of [1,2,3,4,5]" (click)="clarity = s" [class.active]="clarity >= s">★</span>
          </div>
        </div>

        <div class="question">
          <label>Difficulté (1: Trop facile, 5: Trop complexe) :</label>
          <div class="stars">
            <span *ngFor="let s of [1,2,3,4,5]" (click)="difficulty = s" [class.active]="difficulty >= s">★</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-skip" (click)="onSkip()">Passer</button>
          <button class="btn-submit" [disabled]="submitting" (click)="onSubmit()">
            {{ submitting ? 'Envoi...' : 'Envoyer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-content {
      background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.2);
    }
    h3 { margin-top: 0; color: #0d6efd; }
    .question { margin: 1.5rem 0; }
    .question label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
    .stars { font-size: 1.5rem; color: #ddd; cursor: pointer; }
    .stars span { margin-right: 4px; }
    .stars span.active { color: #ffc107; }
    
    .actions { display: flex; justify-content: space-between; margin-top: 2rem; }
    button { padding: 0.6rem 1.2rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-skip { background: #f8f9fa; color: #6c757d; }
    .btn-submit { background: #0d6efd; color: white; }
    button:disabled { opacity: 0.5; }
  `]
})
export class MicroFeedbackComponent {
  @Input() inscriptionId!: number;
  @Input() parcoursId!: number;
  @Input() niveau!: string;
  @Output() completed = new EventEmitter<void>();

  clarity = 0;
  difficulty = 0;
  submitting = false;

  constructor(private http: HttpClient) {}

  onSkip() {
    this.save(true);
  }

  onSubmit() {
    if (this.clarity === 0 || this.difficulty === 0) {
      alert("Veuillez donner une note ou cliquer sur Passer.");
      return;
    }
    this.save(false);
  }

  private save(skipped: boolean) {
    this.submitting = true;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const payload = {
      inscriptionId: this.inscriptionId,
      parcoursId: this.parcoursId,
      candidatId: user.id,
      niveau: this.niveau,
      clarityScore: skipped ? null : this.clarity,
      difficultyScore: skipped ? null : this.difficulty,
      skipped: skipped
    };

    this.http.post('http://localhost:8080/api/feedbacks/micro', payload)
      .subscribe({
        next: () => this.completed.emit(),
        error: () => this.completed.emit() // On continue même si erreur
      });
  }
}
