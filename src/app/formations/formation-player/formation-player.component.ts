import { Component, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Formation, YoutubeVideo } from '../models/formation.model';
import { FormationService } from '../services/formation.service';

@Component({
  selector: 'app-formation-player',
  standalone: false,
  templateUrl: './formation-player.component.html',
  styleUrls: ['./formation-player.component.scss']
})
export class FormationPlayerComponent implements OnInit {
  @Input() formation!: Formation;

  private sanitizer = inject(DomSanitizer);
  private formationService = inject(FormationService);

  safeYoutubeUrl:    SafeResourceUrl | null = null;
  safeStackBlitzUrl: SafeResourceUrl | null = null;
  isPlaylist = false;  // ✅ true si on utilise une playlist
  playlistVideos: YoutubeVideo[] = [];
  currentVideoId: string | null = null;

  // ── Catégories avec éditeur ──────────────────────────────────────────────
  private readonly categoriesAvecEditeur: string[] = [
    'Frontend', 'Backend', 'Data', 'IA', 'Développement'
  ];

  // ── Fallback StackBlitz par catégorie ────────────────────────────────────
  private readonly stackBlitzMap: Record<string, string> = {
    'Frontend':      'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark&file=index.html',
    'Backend':       'https://stackblitz.com/fork/node?embed=1&hideNavigation=1&theme=dark&file=index.js',
    'Data':          'https://stackblitz.com/fork/python?embed=1&hideNavigation=1&theme=dark&file=main.py',
    'IA':            'https://stackblitz.com/fork/python?embed=1&hideNavigation=1&theme=dark&file=main.py',
    'DevOps':        'https://stackblitz.com/fork/node?embed=1&hideNavigation=1&theme=dark&file=index.js',
    'Design':        'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark&file=style.css',
    'Développement': 'https://stackblitz.com/fork/angular?embed=1&hideNavigation=1&theme=dark&file=src/app/app.component.ts',
    'Mobile':        'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark&file=index.html',
  };

  ngOnInit(): void {
    // ✅ Priorité : playlistId > youtubeId (compatibilité ascendante)
    if (this.formation.playlistId) {
      this.isPlaylist = true;
      // Fetch dynamic playlist API pour le menu custom
      this.formationService.getPlaylistVideos(this.formation.playlistId).subscribe({
        next: (videos) => {
          this.playlistVideos = videos;
          if (videos.length > 0) {
            // Lecture automatique de la première vidéo de la playlist sans le paramètre autoplay natif
            this.currentVideoId = videos[0].videoId;
            const url = `https://www.youtube.com/embed/${videos[0].videoId}?rel=0&modestbranding=1`;
            this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          }
        },
        error: (err) => console.error('Erreur API YouTube pour la playlist', err)
      });
    } else if (this.formation.youtubeId) {
      // Fallback : vidéo simple (ancien format)
      const url = `https://www.youtube.com/embed/${this.formation.youtubeId}?rel=0&modestbranding=1`;
      this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.isPlaylist = false;
    }

    // StackBlitz — priorité : BDD → fallback par catégorie
    if (this.hasEditor()) {
      const sbUrl = this.formation.stackBlitzUrl
        || this.stackBlitzMap[this.formation.categorie]
        || 'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark';

      this.safeStackBlitzUrl = this.sanitizer.bypassSecurityTrustResourceUrl(sbUrl);
    }
  }

  hasEditor(): boolean {
    if (this.formation.hasEditor !== undefined) return this.formation.hasEditor;
    return this.categoriesAvecEditeur.includes(this.formation.categorie);
  }

  getStackBlitzLabel(): string {
    const sb    = this.formation.stackBlitzUrl || '';
    if (sb.includes('react'))      return 'React';
    if (sb.includes('angular'))    return 'Angular';
    if (sb.includes('vue'))        return 'Vue.js';
    if (sb.includes('python'))     return 'Python';
    if (sb.includes('node'))       return 'Node.js';
    if (sb.includes('javascript')) return 'JavaScript';
    return this.formation.categorie || 'Code';
  }

  // ✅ Label du player selon type (playlist ou vidéo)
  getPlayerLabel(): string {
    return this.isPlaylist ? 'Playlist complète' : 'Cours vidéo';
  }

  // ✅ Changement de vidéo via le menu de playlist custom
  playVideo(video: YoutubeVideo): void {
    this.currentVideoId = video.videoId;
    // Ajout d'autoplay=1 quand l'utilisateur clique explicitement
    const url = `https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1&autoplay=1`;
    this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}