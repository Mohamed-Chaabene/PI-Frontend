import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { FormationService } from '../services/formation.service';
import { Formation } from '../models/formation.model';

@Component({
  selector: 'app-formation-ecrite',
  standalone: false,
  templateUrl: './formation-ecrite.component.html',
  styleUrls: ['./formation-ecrite.component.scss']
})
export class FormationEcriteComponent implements OnInit {
  formation!: Formation;
  loading    = true;
  safeHtml: SafeHtml | null = null;
  sourceLabel = '';
  errorMsg    = '';

  private sanitizer        = inject(DomSanitizer);
  private route            = inject(ActivatedRoute);
  private formationService = inject(FormationService);
  private http             = inject(HttpClient);

  private readonly base = 'http://localhost:8080/api/suggestions';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.formationService.getFormationById(id).subscribe({
      next: (f) => { this.formation = f; this.loadContent(f); },
      error: ()  => { this.loading = false; }
    });
  }

  private loadContent(f: Formation): void {
    const w = f.writtenUrl || '';

    if (w.includes('|')) {
      const [id, sourceType] = w.split('|');
      this.loadBySource(id.trim(), sourceType.trim());
    } else {
      // Pas de doc configurée → fallback DevDocs selon catégorie
      this.loadFallback(f.categorie);
    }
  }

  private loadBySource(id: string, sourceType: string): void {
    if (sourceType === 'devdocs') {
      this.loadDevDocs(id);
    } else if (sourceType === 'devto') {
      this.loadDevTo(id);
    } else if (sourceType === 'github') {
      this.loadGithub(id);
    } else {
      this.loadFallback(this.formation?.categorie || 'Développement');
    }
  }

  // ── DevDocs ───────────────────────────────────────────────────────
  private loadDevDocs(slug: string): void {
    this.sourceLabel = 'DevDocs.io';
    this.http.get<any>(
      `${this.base}/docs/devdocs/content?slug=${encodeURIComponent(slug)}`
    ).subscribe({
      next: (data) => {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(
          this.buildDevDocsHtml(data, slug)
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('DevDocs error:', err);
        this.loadFallback(this.formation?.categorie || 'Développement');
      }
    });
  }

  private buildDevDocsHtml(data: any, slug: string): string {
    const name = slug.replace('~', ' ').replace('_', ' ');
    let html = `
      <div class="devdocs-content">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;
                    padding:16px;background:#E6F1FB;border-radius:10px;">
          <i class="ri-book-2-line" style="font-size:24px;color:#0965A4"></i>
          <div>
            <h1 style="margin:0;font-size:1.4rem;color:#0965A4">${name}</h1>
            <p style="margin:4px 0 0;font-size:0.85rem;color:#4b5563">
              Documentation officielle via DevDocs.io
            </p>
          </div>
        </div>`;

    const entries = data?.entries;
    if (entries && Array.isArray(entries) && entries.length > 0) {
      // Grouper par type
      const groups: Record<string, string[]> = {};
      entries.forEach((e: any) => {
        const type = e.type || 'Général';
        if (!groups[type]) groups[type] = [];
        groups[type].push(e.name);
      });

      Object.entries(groups).forEach(([type, names]) => {
        html += `<h2 style="font-size:1rem;font-weight:700;color:#1a1a2e;
                            margin:20px 0 10px;padding-bottom:6px;
                            border-bottom:2px solid #E6F1FB">${type}</h2>
                 <ul style="list-style:none;padding:0;display:grid;
                             grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">`;
        names.forEach(name => {
          html += `<li style="padding:6px 10px;background:#f8fafc;
                               border:1px solid #e5e7eb;border-radius:6px;
                               font-size:0.875rem;color:#374151">
                     <code style="color:#0965A4">${name}</code>
                   </li>`;
        });
        html += `</ul>`;
      });
    } else {
      html += `<p style="color:#6b7280">Chargement du contenu...</p>`;
    }

    html += `
        <div style="margin-top:24px;padding:14px 16px;background:#f0fdf4;
                    border:1px solid #bbf7d0;border-radius:10px;
                    display:flex;align-items:center;gap:10px">
          <i class="ri-external-link-line" style="color:#16a34a;font-size:18px"></i>
          <span style="font-size:0.875rem;color:#166534">
            Voir la documentation complète :
            <a href="https://devdocs.io/${slug}" target="_blank" rel="noopener"
               style="color:#0965A4;font-weight:600">
              devdocs.io/${slug} →
            </a>
          </span>
        </div>
      </div>`;
    return html;
  }

  // ── dev.to ────────────────────────────────────────────────────────
  private loadDevTo(articleId: string): void {
    this.sourceLabel = 'dev.to';
    this.http.get(
      `${this.base}/docs/devto/content?articleId=${articleId}`,
      { responseType: 'text' }
    ).subscribe({
      next: (html) => {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.loading  = false;
      },
      error: () => this.loadFallback(this.formation?.categorie || 'Développement')
    });
  }

  // ── GitHub ────────────────────────────────────────────────────────
  private loadGithub(repo: string): void {
    this.sourceLabel = 'GitHub';
    this.http.get(
      `${this.base}/docs/github/content?repo=${encodeURIComponent(repo)}`,
      { responseType: 'text' }
    ).subscribe({
      next: (html) => {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.loading  = false;
      },
      error: () => this.loadFallback(this.formation?.categorie || 'Développement')
    });
  }

  // ── Fallback par catégorie → DevDocs ──────────────────────────────
  private loadFallback(categorie: string): void {
    const slugMap: Record<string, string> = {
      'Frontend':      'javascript~5',
      'Backend':       'node~18_lts',
      'Data':          'python~3.12',
      'IA':            'python~3.12',
      'DevOps':        'docker~27',
      'Design':        'css',
      'Mobile':        'react_native',
      'Développement': 'javascript~5'
    };
    const slug = slugMap[categorie] || 'javascript~5';
    this.loadDevDocs(slug);
  }
}