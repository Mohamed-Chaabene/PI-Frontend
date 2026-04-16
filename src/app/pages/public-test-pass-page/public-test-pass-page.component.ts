import { CommonModule } from '@angular/common';
import { Component, HostListener, NgZone } from '@angular/core';
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

interface EntretienDetails {
  id?: number;
  titre?: string;
  description?: string;
  recruteur?: {
    id?: number;
    nom?: string;
    email?: string;
  };
}

@Component({
  selector: 'app-public-test-pass-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule],
  templateUrl: './public-test-pass-page.component.html',
  styleUrls: ['./public-test-pass-page.component.scss']
})
export class PublicTestPassPageComponent {
  private readonly attemptStoragePrefix = 'entretienAttempted_';
  entretienId = 0;
  entretienDetails: EntretienDetails | null = null;
  questions: TestQuestion[] = [];
  answers: Record<number, any> = {};
  loading = true;
  submitting = false;
  loadError = '';
  resultMessage = '';
  showConsent = true;
  examStarted = false;
  violationDetected = false;
  violationReason = '';
  acknowledgingRules = false;
  isObscured = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id <= 0) {
      this.loadError = 'ID entretien invalide.';
      this.loading = false;
      return;
    }

    this.entretienId = id;
    if (this.hasAttemptedLocally()) {
      this.loadError = 'Vous avez deja passe cet entretien. Une seconde tentative nest pas autorisee.';
      this.loading = false;
      return;
    }

    this.loadEntretienDetailsAndGuard();
  }

  private loadEntretienDetailsAndGuard(): void {
    this.apiService.getEntretien(this.entretienId).subscribe({
      next: (data: EntretienDetails) => {
        this.entretienDetails = data || null;
        if (this.isBackendMarkedCompleted(data)) {
          this.markAttemptedLocally();
          this.loadError = 'Vous avez deja passe cet entretien. Une seconde tentative nest pas autorisee.';
          this.loading = false;
          return;
        }

        if (!this.isInterviewToday(data)) {
          this.loadError = 'Cet entretien est accessible uniquement le jour prevu.';
          this.loading = false;
          return;
        }

        this.loadQuestions();
      },
      error: () => {
        this.entretienDetails = null;
        this.loadError = 'Impossible de verifier la date de cet entretien. Veuillez reessayer plus tard.';
        this.loading = false;
      }
    });
  }

  private extractInterviewDate(details: any): Date | null {
    const raw = details?.dateEntretien || details?.date || details?.scheduledAt;
    if (!raw) {
      return null;
    }
    const parsed = new Date(raw);
    if (!Number.isFinite(parsed.getTime())) {
      return null;
    }
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private todayDateOnly(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private isInterviewToday(details: any): boolean {
    const interviewDay = this.extractInterviewDate(details);
    if (!interviewDay) {
      return false;
    }
    return interviewDay.getTime() === this.todayDateOnly().getTime();
  }

  private isBackendMarkedCompleted(details: any): boolean {
    return details?.completed === true || details?.termine === true || details?.status === 'COMPLETED';
  }

  private hasAttemptedLocally(): boolean {
    return localStorage.getItem(`${this.attemptStoragePrefix}${this.entretienId}`) === '1';
  }

  private markAttemptedLocally(): void {
    localStorage.setItem(`${this.attemptStoragePrefix}${this.entretienId}`, '1');
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

  get recruiterEmail(): string {
    return (this.entretienDetails?.recruteur?.email || '').trim();
  }

  get recruiterName(): string {
    return (this.entretienDetails?.recruteur?.nom || 'le recruteur').trim();
  }

  get examTitle(): string {
    return (this.entretienDetails?.titre || 'Entretien test').trim();
  }

  async startExam(): Promise<void> {
    if (this.examStarted || this.submitting || this.violationDetected) {
      return;
    }

    this.acknowledgingRules = true;
    this.showConsent = false;
    this.resultMessage = '';

    try {
      await this.enterFullscreen();
      this.examStarted = true;
    } catch {
      this.showConsent = true;
      this.resultMessage = 'Le plein ecran est obligatoire pour commencer cet entretien.';
    } finally {
      this.acknowledgingRules = false;
    }
  }

  private async enterFullscreen(): Promise<void> {
    const element = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return;
    }

    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      return;
    }

    if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
      return;
    }

    throw new Error('Fullscreen not supported');
  }

  private isShortcutBlocked(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const blockedWithoutModifier = ['f12', 'escape'];

    if (blockedWithoutModifier.includes(key)) {
      return true;
    }

    if (!ctrlOrMeta) {
      return false;
    }

    const blockedWithCtrl = ['c', 'v', 'x', 'u', 's', 'p', 'r'];
    if (event.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 's')) {
      return true;
    }

    return blockedWithCtrl.includes(key);
  }

  private registerViolation(reason: string): void {
    if (!this.examStarted || this.violationDetected || this.submitting) {
      return;
    }

    this.violationDetected = true;
    this.violationReason = reason;
    this.resultMessage = `Comportement suspect detecte: ${reason}. L'entretien est refuse automatiquement.`;
    this.forceExitFullscreen();
    this.submitWithPenalty(reason);
  }

  private submitWithPenalty(reason: string): void {
    this.submitting = true;

    this.apiService.submitEntretienResponses(this.entretienId, 0).subscribe({
      next: () => {
        this.markAttemptedLocally();
        this.resultMessage = `Comportement suspect detecte: ${reason}. Votre entretien a ete refuse automatiquement.`;
        this.notifyRecruiter(reason);
        this.submitting = false;
      },
      error: () => {
        this.resultMessage = `Comportement suspect detecte: ${reason}. L'enregistrement backend a echoue, mais l'entretien est marque comme refuse.`;
        this.notifyRecruiter(reason);
        this.submitting = false;
      }
    });
  }

  private notifyRecruiter(reason: string): void {
    const receiverEmail = this.recruiterEmail;
    if (!receiverEmail) {
      return;
    }

    const subject = `Alerte triche - entretien #${this.entretienId}`;
    const content = [
      `Une triche potentielle a ete detectee pendant ${this.examTitle}.`,
      `Motif: ${reason}.`,
      'L\'entretien a ete refuse automatiquement avec un score de 0%.'
    ].join(' ');

    this.apiService.sendMessage({
      receiverEmail,
      receiverName: this.recruiterName,
      subject,
      contenu: content
    }).subscribe({
      error: () => {
        // Notification best-effort: the refusal has already been recorded.
      }
    });
  }

  private forceExitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
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
    if (this.questions.length === 0 || this.submitting || this.violationDetected) {
      return;
    }

    this.submitting = true;
    const score = this.computeScorePercent();

    this.apiService.submitEntretienResponses(this.entretienId, score).subscribe({
      next: () => {
        this.markAttemptedLocally();
        this.resultMessage = `Votre score a ete enregistre: ${score.toFixed(2)}%`;
        this.examStarted = false;
        this.forceExitFullscreen();
        this.submitting = false;
      },
      error: () => {
        this.resultMessage = 'Le score local est calcule mais lenregistrement backend a echoue.';
        this.submitting = false;
      }
    });
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: Event): void {
    if (!this.examStarted || this.violationDetected) {
      return;
    }

    event.preventDefault();
    this.registerViolation('clic droit bloque');
  }

  @HostListener('document:copy', ['$event'])
  onCopy(event: Event): void {
    if (!this.examStarted || this.violationDetected) {
      return;
    }

    event.preventDefault();
    this.registerViolation('copie bloque');
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: Event): void {
    if (!this.examStarted || this.violationDetected) {
      return;
    }

    event.preventDefault();
    this.registerViolation('collage bloque');
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.examStarted || this.violationDetected) {
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;
    if (event.key === 'PrintScreen' || (ctrl && event.shiftKey && event.key.toLowerCase() === 's') || event.key === 'Meta') {
      this.obscureScreen();
    }

    if (this.isShortcutBlocked(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.registerViolation(`raccourci interdit: ${event.key}`);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyup(event: KeyboardEvent): void {
    if (!this.examStarted || this.violationDetected) {
      return;
    }

    if (event.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
      this.obscureScreen();
      this.registerViolation('capture d\'écran interdite');
    }
  }

  private obscureScreen(): void {
    this.ngZone.run(() => {
      this.isObscured = true;
      setTimeout(() => {
        this.isObscured = false;
      }, 3000);
    });
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    if (this.examStarted && !this.violationDetected) {
      this.registerViolation('changement de fenetre detecte');
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (this.examStarted && !this.violationDetected && document.hidden) {
      this.registerViolation('changement d onglet detecte');
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (this.examStarted && !this.violationDetected && !document.fullscreenElement) {
      this.registerViolation('sortie du plein ecran detectee');
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.examStarted && !this.violationDetected && !this.submitting) {
      event.preventDefault();
      event.returnValue = '';
    }
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
    this.forceExitFullscreen();
    this.router.navigate(['/']);
  }
}
