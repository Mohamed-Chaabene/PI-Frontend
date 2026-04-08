import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormationService, FormationCreatePayload }
  from '../../formations/services/formation.service';
import { FormationSuggestion }
  from '../../formations/models/formation.model';

@Component({
  selector: 'app-formation-create',
  standalone: false,
  templateUrl: './formation-create.component.html',
  styleUrls: ['./formation-create.component.scss']
})
export class FormationCreateComponent {
  private fb               = inject(FormBuilder);
  private formationService = inject(FormationService);
  private router           = inject(Router);
  private http             = inject(HttpClient);

  saving             = false;
  loading            = false;
  suggestionSelected = false;
  suggestions: FormationSuggestion[] = [];

  // ✅ Erreurs serveur retournées par le backend
  serverErrors: Record<string, string> = {};
  serverErrorMessage = '';

  private titreSubject = new Subject<string>();

  constructor() {
    this.titreSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(titre => {
        this.loading     = true;
        this.suggestions = [];
        return this.http.get<FormationSuggestion[]>(
          `http://localhost:8080/api/suggestions/formations` +
          `?titre=${encodeURIComponent(titre)}`
        );
      })
    ).subscribe({
      next: (data) => { this.suggestions = data; this.loading = false; },
      error: ()    => { this.suggestions = [];   this.loading = false; }
    });
  }

  form = this.fb.nonNullable.group({
    titre: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(150)
    ]],
    categorie: ['', [
      Validators.required
    ]],
    plateforme: ['YouTube', [
      Validators.required
    ]],
    statut: ['Disponible', [
      Validators.required,
      Validators.pattern('(Disponible|Archivée|Bientôt)')
    ]],
    duree: ['', [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(50)
    ]],
    niveau: ['Débutant', [
      Validators.required,
      Validators.pattern('(Débutant|Intermédiaire|Avancé|Expert)')
    ]],
    lienExterne: ['', [
      Validators.maxLength(500),
      Validators.pattern(
        /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-./?%&=]*)?$|^$/
      )
    ]],
    playlistId: ['', [
      Validators.maxLength(100)
    ]],
    youtubeId: ['', [
      Validators.maxLength(100)
    ]],
    hasEditor:     [false],
    stackBlitzUrl: ['', [Validators.maxLength(500)]],
    writtenUrl:    ['', [Validators.maxLength(500)]]
  }, { validators: this.atLeastOneContentValidator });

  // ✅ Validateur custom : au moins playlistId OU youtubeId OU lienExterne
  atLeastOneContentValidator(group: AbstractControl) {
    const playlist = group.get('playlistId')?.value;
    const youtube  = group.get('youtubeId')?.value;
    const lien     = group.get('lienExterne')?.value;
    if (!playlist && !youtube && !lien) {
      return { noContent: true };
    }
    return null;
  }

  readonly stackBlitzTemplates = [
    { label: '-- Aucun --',    value: '' },
    { label: 'React',
      value: 'https://stackblitz.com/fork/react?embed=1&hideNavigation=1&theme=dark&file=src/App.jsx' },
    { label: 'Angular',
      value: 'https://stackblitz.com/fork/angular?embed=1&hideNavigation=1&theme=dark&file=src/app/app.component.ts' },
    { label: 'JavaScript',
      value: 'https://stackblitz.com/fork/javascript?embed=1&hideNavigation=1&theme=dark&file=index.js' },
    { label: 'HTML / CSS',
      value: 'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark&file=index.html' },
    { label: 'Node.js',
      value: 'https://stackblitz.com/fork/node?embed=1&hideNavigation=1&theme=dark&file=index.js' },
    { label: 'Python',
      value: 'https://stackblitz.com/fork/python?embed=1&hideNavigation=1&theme=dark&file=main.py' },
    { label: 'Vue.js',
      value: 'https://stackblitz.com/fork/vue?embed=1&hideNavigation=1&theme=dark&file=src/App.vue' },
  ];

  // ── Helpers d'accès aux contrôles ─────────────────────────────
  get f() { return this.form.controls; }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(field: string): string {
    // Erreur serveur en priorité
    if (this.serverErrors[field]) return this.serverErrors[field];

    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    const e = ctrl.errors;

    if (e['required'])   return 'Ce champ est obligatoire.';
    if (e['minlength'])  return `Minimum ${e['minlength'].requiredLength} caractères.`;
    if (e['maxlength'])  return `Maximum ${e['maxlength'].requiredLength} caractères.`;
    if (e['pattern'])    return 'Valeur invalide.';
    return 'Valeur invalide.';
  }

  // ── Logique existante ─────────────────────────────────────────
  onTitreChange(value: string): void {
    this.suggestionSelected = false;
    this.serverErrors = {};
    if (value.length < 3) {
      this.suggestions = [];
      this.loading     = false;
      return;
    }
    this.titreSubject.next(value);
  }

  selectSuggestion(s: FormationSuggestion): void {
    this.form.patchValue({
      titre:      s.titre,
      playlistId: s.playlistId,
      youtubeId:  '',
      categorie:  s.categorie,
      niveau:     s.niveau,
      statut:     'Disponible',
      plateforme: 'YouTube',
      hasEditor:  ['Frontend','Backend','Data','IA','Développement']
                    .includes(s.categorie),
      duree:      this.getDureeEstimee(s)
    });
    this.suggestions        = [];
    this.suggestionSelected = true;
  }

  getDureeEstimee(s: FormationSuggestion): string {
    if (s.dureeTotale) return s.dureeTotale;
    if (s.nbVideos > 0) {
      const h = Math.round(s.nbVideos * 10 / 60 * 10) / 10;
      return `${h}h`;
    }
    return '';
  }

  getDureeBadge(s: FormationSuggestion): string {
    return this.getDureeEstimee(s) || 'Durée inconnue';
  }

  clearSuggestion(): void {
    this.suggestionSelected = false;
    this.form.patchValue({
      playlistId: '', youtubeId: '', categorie: '', niveau: ''
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.serverErrors      = {};
    this.serverErrorMessage = '';

    if (this.form.invalid) return;

    this.saving = true;
    this.formationService.createFormation(
      this.form.getRawValue() as FormationCreatePayload
    ).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin-dashboard/formations']);
      },
      error: (err) => {
        this.saving = false;
        // ✅ Récupérer les erreurs de validation du backend
        if (err.status === 400 && err.error?.errors) {
          this.serverErrors = err.error.errors;
          this.serverErrorMessage = 'Veuillez corriger les erreurs ci-dessous.';
        } else {
          this.serverErrorMessage = err.error?.message
            || 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin-dashboard/formations']);
  }

  getSelectedTemplateLabel(): string {
    const url   = this.form.get('stackBlitzUrl')?.value;
    const found = this.stackBlitzTemplates.find(t => t.value === url);
    return found ? found.label : 'Code';
  }
}