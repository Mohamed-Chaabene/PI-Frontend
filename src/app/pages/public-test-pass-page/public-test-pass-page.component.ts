import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';
import { SharedModule } from '../../shared/shared.module';

interface QuestionChoice {
  texte?: string;
  contenu?: string;
  correcte?: boolean;
  correct?: boolean;
}

interface TestQuestion {
  id: number;
  contenu?: string;
  question?: string;
  type?: string;
  points?: number;
  bonneReponse?: string;
  choix?: QuestionChoice[];
}

@Component({
  selector: 'app-public-test-pass-page',
  templateUrl: './public-test-pass-page.component.html',
  styleUrls: ['./public-test-pass-page.component.scss'],
  imports: [SharedModule]
})
export class PublicTestPassPageComponent {
  entretienId = 0;
  questions: TestQuestion[] = [];
  answers: Record<number, any> = {};
  loading = true;
  submitting = false;
  loadError = '';
  resultMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id <= 0) {
      this.loadError = 'ID entretien invalide.';
      this.loading = false;
      return;
    }

    this.entretienId = id;
    this.loadQuestions();
  }

  private loadQuestions(): void {
    this.loading = true;
    this.loadError = '';

    this.apiService.getQuestionsByEntretien(this.entretienId).subscribe({
      next: (data: TestQuestion[]) => {
        this.questions = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Impossible de charger les questions de cet entretien.';
        this.loading = false;
      }
    });
  }

  getQuestionText(question: TestQuestion): string {
    return (question.contenu || question.question || '').trim() || 'Question';
  }

  getChoiceText(choice: QuestionChoice): string {
    return (choice?.texte || choice?.contenu || '').trim();
  }

  isQcm(question: TestQuestion): boolean {
    return (question.type || '').toUpperCase() === 'QCM';
  }

  toggleQcmSelection(questionId: number, choiceIndex: number): void {
    const selected: number[] = Array.isArray(this.answers[questionId]) ? [...this.answers[questionId]] : [];
    const pos = selected.indexOf(choiceIndex);
    if (pos >= 0) {
      selected.splice(pos, 1);
    } else {
      selected.push(choiceIndex);
    }
    this.answers[questionId] = selected;
  }

  isSelectedQcm(questionId: number, choiceIndex: number): boolean {
    const selected: number[] = Array.isArray(this.answers[questionId]) ? this.answers[questionId] : [];
    return selected.includes(choiceIndex);
  }

  submitTest(): void {
    if (this.questions.length === 0 || this.submitting) {
      return;
    }

    this.submitting = true;
    const score = this.computeScorePercent();

    this.apiService.submitEntretienResponses(this.entretienId, score).subscribe({
      next: () => {
        this.resultMessage = `Votre score a ete enregistre: ${score.toFixed(2)}%`;
        this.submitting = false;
      },
      error: () => {
        this.resultMessage = 'Le score local est calcule mais lenregistrement backend a echoue.';
        this.submitting = false;
      }
    });
  }

  private computeScorePercent(): number {
    let total = 0;
    let earned = 0;

    for (const q of this.questions) {
      const pts = q.points && q.points > 0 ? q.points : 1;
      total += pts;
      if (this.isCorrectAnswer(q)) {
        earned += pts;
      }
    }

    if (total <= 0) {
      return 0;
    }
    return (earned / total) * 100;
  }

  private isCorrectAnswer(question: TestQuestion): boolean {
    const qId = question.id;
    const selected = this.answers[qId];
    const choices = Array.isArray(question.choix) ? question.choix : [];

    if (this.isQcm(question)) {
      const correctIndices = choices
        .map((c, i) => (c.correcte === true || c.correct === true ? i : -1))
        .filter(i => i >= 0)
        .sort((a, b) => a - b);

      const selectedIndices = (Array.isArray(selected) ? selected : [])
        .filter((i: number) => Number.isInteger(i))
        .sort((a: number, b: number) => a - b);

      if (correctIndices.length === 0) {
        return false;
      }

      return JSON.stringify(correctIndices) === JSON.stringify(selectedIndices);
    }

    if (typeof selected === 'number' && selected >= 0 && selected < choices.length) {
      const c = choices[selected];
      if (c && (c.correcte === true || c.correct === true)) {
        return true;
      }

      const choiceText = this.getChoiceText(c).toUpperCase();
      const expected = String(question.bonneReponse || '').trim().toUpperCase();
      return expected.length > 0 && choiceText === expected;
    }

    return false;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
