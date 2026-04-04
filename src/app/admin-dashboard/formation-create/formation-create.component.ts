import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormationService, FormationCreatePayload } from '../../formations/services/formation.service';
import { FormationSuggestion, DocSuggestion } from '../../formations/models/formation.model';

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
  loadingDoc         = false;
  suggestionSelected = false;
  docSelected        = false;

  suggestions:    FormationSuggestion[] = [];
  docSuggestions: DocSuggestion[]       = [];

  activeDocSource: 'devdocs' | 'devto' | 'github' = 'devdocs';

  private titreSubject = new Subject<string>();

  constructor() {
    this.titreSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(titre => {
        this.loading     = true;
        this.suggestions = [];
        return this.http.get<FormationSuggestion[]>(
          `http://localhost:8080/api/suggestions/formations?titre=${encodeURIComponent(titre)}`
        );
      })
    ).subscribe({
      next: (data) => { this.suggestions = data; this.loading = false; },
      error: ()    => { this.suggestions = [];   this.loading = false; }
    });
  }

  form = this.fb.nonNullable.group({
    titre:         ['', [Validators.required, Validators.minLength(3)]],
    categorie:     ['', Validators.required],
    plateforme:    ['YouTube', Validators.required],
    statut:        ['Disponible', Validators.required],
    duree:         ['', Validators.required],
    niveau:        ['Débutant', Validators.required],
    lienExterne:   [''],
    playlistId:    [''],
    youtubeId:     [''],
    hasEditor:     [false],
    stackBlitzUrl: [''],
    writtenUrl:    [''],
    docSourceType: ['devdocs']
  });

  readonly stackBlitzTemplates = [
    { label: '-- Aucun --',    value: '' },
    { label: 'React',          value: 'https://stackblitz.com/fork/react?embed=1&hideNavigation=1&theme=dark&file=src/App.jsx' },
    { label: 'Angular',        value: 'https://stackblitz.com/fork/angular?embed=1&hideNavigation=1&theme=dark&file=src/app/app.component.ts' },
    { label: 'JavaScript',     value: 'https://stackblitz.com/fork/javascript?embed=1&hideNavigation=1&theme=dark&file=index.js' },
    { label: 'HTML / CSS',     value: 'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark&file=index.html' },
    { label: 'Node.js',        value: 'https://stackblitz.com/fork/node?embed=1&hideNavigation=1&theme=dark&file=index.js' },
    { label: 'Python',         value: 'https://stackblitz.com/fork/python?embed=1&hideNavigation=1&theme=dark&file=main.py' },
    { label: 'Vue.js',         value: 'https://stackblitz.com/fork/vue?embed=1&hideNavigation=1&theme=dark&file=src/App.vue' },
  ];

  // ── Type explicite sur key ← correction erreur TS2345 ─────
  readonly docSources: { key: 'devdocs' | 'devto' | 'github'; label: string; icon: string; desc: string }[] = [
    { key: 'devdocs', label: 'DevDocs.io', icon: 'ri-book-2-line',  desc: 'Docs techniques officielles' },
    { key: 'devto',   label: 'dev.to',     icon: 'ri-article-line', desc: 'Articles tech gratuits'      },
    { key: 'github',  label: 'GitHub',     icon: 'ri-github-line',  desc: 'Cours open source'           },
  ];

  selectDocSource(source: 'devdocs' | 'devto' | 'github'): void {
    this.activeDocSource = source;
    this.docSuggestions  = [];
    this.docSelected     = false;
    this.form.patchValue({ docSourceType: source, writtenUrl: '' });
    const titre = this.form.get('titre')?.value;
    if (titre && titre.length >= 3) {
      this.searchDocSuggestions(titre, source);
    }
  }

  searchDocSuggestions(titre: string, source: string): void {
    this.loadingDoc     = true;
    this.docSuggestions = [];
    const url = `http://localhost:8080/api/suggestions/docs/${source}?titre=${encodeURIComponent(titre)}`;
    this.http.get<DocSuggestion[]>(url).subscribe({
      next: (data) => { this.docSuggestions = data; this.loadingDoc = false; },
      error: ()    => { this.docSuggestions = [];   this.loadingDoc = false; }
    });
  }

  selectDoc(doc: DocSuggestion): void {
    this.form.patchValue({
      writtenUrl:    doc.id + '|' + doc.sourceType,
      docSourceType: doc.sourceType
    });
    this.docSelected    = true;
    this.docSuggestions = [];
  }

  onTitreChange(value: string): void {
    this.suggestionSelected = false;
    this.docSelected        = false;
    if (value.length < 3) {
      this.suggestions    = [];
      this.docSuggestions = [];
      this.loading        = false;
      return;
    }
    this.titreSubject.next(value);
    this.searchDocSuggestions(value, this.activeDocSource);
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
      hasEditor:  ['Frontend','Backend','Data','IA','Développement'].includes(s.categorie),
      duree:      this.getDureeEstimee(s)
    });
    this.suggestions        = [];
    this.suggestionSelected = true;
  }

  getDureeEstimee(s: FormationSuggestion): string {
    if (s.dureeTotale) return s.dureeTotale;
    if (s.nbVideos > 0) {
      const heures = Math.round(s.nbVideos * 10 / 60 * 10) / 10;
      return `${heures}h`;
    }
    return '';
  }

  getDureeBadge(s: FormationSuggestion): string {
    return this.getDureeEstimee(s) || 'Durée inconnue';
  }

  clearSuggestion(): void {
    this.suggestionSelected = false;
    this.form.patchValue({ playlistId: '', youtubeId: '', categorie: '', niveau: '' });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.formationService.createFormation(
      this.form.getRawValue() as FormationCreatePayload
    ).subscribe({
      next:  () => this.router.navigate(['/admin-dashboard/formations']),
      error: () => { this.saving = false; }
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

  getWrittenUrlLabel(): string {
    const val = this.form.get('writtenUrl')?.value;
    if (!val) return 'Aucune';
    const type = this.form.get('docSourceType')?.value;
    const src  = this.docSources.find(s => s.key === type);
    return src ? src.label : 'Doc sélectionnée';
  }
}