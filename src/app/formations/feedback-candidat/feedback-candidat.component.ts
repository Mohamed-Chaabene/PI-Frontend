import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Feedback, FeedbackCreatePayload } from '../models/feedback.model';
import { FeedbackService } from '../services/feedback.service';
import { FormationService } from '../services/formation.service';
import { Inscription } from '../models/inscription.model';

@Component({
  selector: 'app-feedback-candidat',
  standalone: false,
  templateUrl: './feedback-candidat.component.html',
  styleUrls: ['./feedback-candidat.component.scss']
})
export class FeedbackCandidatComponent implements OnInit {

  @Input() formationId!: number;

  feedbacks:    Feedback[]   = [];
  myFeedback:   Feedback | null = null;
  candidatId:   number | null = null;
  loading       = false;
  saving        = false;
  deletingId:   number | null = null;
  editing       = false;
  showForm      = false;
  errorMsg      = '';
  successMsg    = '';

  // ✅ Indique si le candidat a terminé cette formation
  aTermine      = false;
  checkingTermine = false;

  form: FormGroup;
  stars = [1, 2, 3, 4, 5];
  hoveredStar = 0;

  constructor(
    private fb:              FormBuilder,
    private feedbackService: FeedbackService,
    private formationService: FormationService
  ) {
    this.form = this.fb.group({
      note:        [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      commentaire: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.resolveCandidatId();
  }

  // ── Résolution candidatId ─────────────────────────────────────────────────
  private resolveCandidatId(): void {
    const cached = Number(localStorage.getItem('candidatId'));
    if (!Number.isNaN(cached) && cached > 0) {
      this.candidatId = cached;
      this.loadData();
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = Number(payload.id);
        if (!Number.isNaN(id) && id > 0) {
          this.candidatId = id;
          localStorage.setItem('candidatId', String(id));
          this.loadData();
          return;
        }
      } catch {}
    }
    // Pas de candidatId → charger seulement les feedbacks publics
    this.loadFeedbacksPublics();
  }

  private loadData(): void {
    this.loading = true;
    this.checkingTermine = true;

    // 1. Charger les feedbacks de la formation
    this.feedbackService.getByFormation(this.formationId).subscribe({
      next: (data) => {
        this.feedbacks   = data;
        this.myFeedback  = this.candidatId
          ? data.find(f => f.candidat?.id === this.candidatId) || null
          : null;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // ✅ 2. Vérifier si le candidat a une inscription "Terminé" pour cette formation
    if (this.candidatId) {
      this.formationService.getMesInscriptions(this.candidatId).subscribe({
        next: (inscriptions: Inscription[]) => {
          this.aTermine = inscriptions.some(
            i => i.formation?.id === this.formationId && i.statut === 'Terminé'
          );
          this.checkingTermine = false;
        },
        error: () => { this.checkingTermine = false; }
      });
    } else {
      this.checkingTermine = false;
    }
  }

  private loadFeedbacksPublics(): void {
    this.loading = true;
    this.feedbackService.getByFormation(this.formationId).subscribe({
      next: (data) => { this.feedbacks = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  // ── Étoiles interactives ──────────────────────────────────────────────────
  setNote(note: number): void { this.form.patchValue({ note }); }
  hoverStar(star: number): void { this.hoveredStar = star; }
  leaveStar(): void { this.hoveredStar = 0; }

  getStarClass(star: number): string {
    const active = this.hoveredStar > 0 ? this.hoveredStar : this.form.value.note;
    return star <= active ? 'star active' : 'star';
  }

  getDisplayStarClass(note: number, star: number): string {
    return star <= note ? 'star active' : 'star';
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editing  = false;
    this.showForm = true;
    this.errorMsg = '';
    this.form.reset({ note: 0, commentaire: '' });
  }

  openEdit(): void {
    if (!this.myFeedback) return;
    this.editing  = true;
    this.showForm = true;
    this.errorMsg = '';
    this.form.patchValue({
      note:        this.myFeedback.note,
      commentaire: this.myFeedback.commentaire
    });
  }

  cancelForm(): void { this.showForm = false; this.errorMsg = ''; }

  submit(): void {
    if (this.form.invalid || this.form.value.note < 1) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Veuillez sélectionner une note et écrire un commentaire.';
      return;
    }
    this.saving   = true;
    this.errorMsg = '';

    if (this.editing && this.myFeedback) {
      this.feedbackService.update(this.myFeedback.id, this.form.value).subscribe({
        next: () => {
          this.saving   = false;
          this.showForm = false;
          this.successMsg = 'Feedback modifié avec succès !';
          this.loadData();
          setTimeout(() => this.successMsg = '', 3000);
        },
        error: () => { this.saving = false; this.errorMsg = 'Erreur lors de la modification.'; }
      });
    } else {
      const payload: FeedbackCreatePayload = {
        note:        this.form.value.note,
        commentaire: this.form.value.commentaire,
        formation:   { id: this.formationId },
        candidat:    { id: this.candidatId! }
      };
      this.feedbackService.create(payload).subscribe({
        next: () => {
          this.saving   = false;
          this.showForm = false;
          this.successMsg = 'Feedback ajouté avec succès !';
          this.loadData();
          setTimeout(() => this.successMsg = '', 3000);
        },
        error: (err) => {
          this.saving   = false;
          this.errorMsg = err?.error?.message || 'Erreur lors de l\'ajout du feedback.';
        }
      });
    }
  }

  delete(): void {
    if (!this.myFeedback || !confirm('Supprimer votre feedback ?')) return;
    this.deletingId = this.myFeedback.id;
    this.feedbackService.delete(this.myFeedback.id).subscribe({
      next: () => {
        this.deletingId  = null;
        this.myFeedback  = null;
        this.successMsg  = 'Feedback supprimé.';
        this.loadData();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.deletingId = null; }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get noteLabel(): string {
    const labels: Record<number, string> = {
      1: 'Très mauvais', 2: 'Mauvais', 3: 'Correct', 4: 'Bien', 5: 'Excellent'
    };
    return labels[this.form.value.note] || 'Sélectionnez une note';
  }

  get averageNote(): number {
    if (!this.feedbacks.length) return 0;
    return Math.round(
      this.feedbacks.reduce((s, f) => s + f.note, 0) / this.feedbacks.length * 10
    ) / 10;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  get isCandidat(): boolean {
    const role = (localStorage.getItem('userRole') || '').toUpperCase().replace('ROLE_', '');
    return role === 'CANDIDAT';
  }

  // ✅ Le candidat peut laisser un feedback seulement si :
  // - il est connecté en tant que candidat
  // - il a terminé la formation (statut = 'Terminé')
  // - il n'a pas encore de feedback
  get peutDonnerFeedback(): boolean {
    return this.isCandidat && this.aTermine && !this.myFeedback;
  }
}