import {
  Component, Input, OnInit, OnDestroy, AfterViewInit, inject
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Formation, YoutubeVideo } from '../models/formation.model';
import { FormationService } from '../services/formation.service';

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

@Component({
  selector: 'app-formation-player',
  standalone: false,
  templateUrl: './formation-player.component.html',
  styleUrls: ['./formation-player.component.scss']
})
export class FormationPlayerComponent
    implements OnInit, OnDestroy, AfterViewInit {

  @Input() formation!:    Formation;
  @Input() inscriptionId: number | null = null;
  @Input() candidatId:    number | null = null;

  private sanitizer        = inject(DomSanitizer);
  private formationService = inject(FormationService);
  private http             = inject(HttpClient);

  safeStackBlitzUrl: SafeResourceUrl | null = null;
  isPlaylist      = false;
  playlistVideos: YoutubeVideo[] = [];
  currentVideoId: string | null  = null;
  currentVideo:   YoutubeVideo | null = null;
  currentIndex    = 0;

  // ── Progression ────────────────────────────────────────────────
  videosVues   = new Set<string>();
  progression  = 0;
  showConfetti = false;

  // ── Quiz final ─────────────────────────────────────────────────
  showQuizFinal    = false;
  quizFinalLoading = false;
  quizFinalQuestions: any[] = [];
  quizFinalAnswers:   number[] = [];
  quizFinalSubmitted = false;
  quizFinalScore     = 0;
  quizFinalReussi    = false;
  quizFinalMessage   = '';
  certificatId:      number | null = null;

  // ── Tentatives (max 2) ─────────────────────────────────────────
  tentativesUtilisees = 0;
  readonly MAX_TENTATIVES = 2;

  private get quizStorageKey(): string {
    return `quiz_tentatives_${this.inscriptionId}`;
  }

  private chargerTentatives(): void {
    const saved = localStorage.getItem(this.quizStorageKey);
    this.tentativesUtilisees = saved ? Number(saved) : 0;
  }

  private sauvegarderTentatives(): void {
    localStorage.setItem(this.quizStorageKey,
      String(this.tentativesUtilisees));
  }

  get tentativesRestantes(): number {
    return this.MAX_TENTATIVES - this.tentativesUtilisees;
  }

  get peutReessayer(): boolean {
    return this.tentativesRestantes > 0;
  }

  get answeredQuestionsCount(): number {
    return this.quizFinalAnswers.filter(a => a !== -1).length;
  }

  // ── YouTube IFrame ─────────────────────────────────────────────
  private ytPlayer:    any = null;
  private playerReady      = false;

  private readonly base = 'http://localhost:8080/api';

  private readonly categoriesAvecEditeur = [
    'Frontend', 'Backend', 'Data', 'IA', 'Développement'
  ];

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
    if (!this.candidatId)
      this.candidatId = Number(localStorage.getItem('candidatId')) || null;
    if (!this.inscriptionId) {
      const s = localStorage.getItem('inscription_' + this.formation?.id);
      this.inscriptionId = s ? Number(s) : null;
    }

    // Charger le nombre de tentatives sauvegardé
    this.chargerTentatives();

    if (this.hasEditor()) {
      const sb = this.formation.stackBlitzUrl
        || this.stackBlitzMap[this.formation.categorie]
        || 'https://stackblitz.com/fork/web?embed=1&hideNavigation=1&theme=dark';
      this.safeStackBlitzUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(sb);
    }

    if (this.formation.playlistId) {
      this.isPlaylist = true;
      this.formationService.getPlaylistVideos(
          this.formation.playlistId).subscribe({
        next: (videos) => {
          this.playlistVideos = videos;
          if (videos.length > 0) this.loadExistingProgression();
        }
      });
    } else if (this.formation.youtubeId) {
      this.loadYouTubeAPI(() => this.initPlayer(this.formation.youtubeId!));
    }
  }

  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.destroyPlayer(); }

  // ══════════════════════════════════════════════════════════════
  // YouTube IFrame API
  // ══════════════════════════════════════════════════════════════
  private loadYouTubeAPI(cb: () => void): void {
    if (window.YT?.Player) { cb(); return; }
    if (document.getElementById('yt-api-script')) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); cb(); };
      return;
    }
    window.onYouTubeIframeAPIReady = cb;
    const s = document.createElement('script');
    s.id  = 'yt-api-script';
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }

  private initPlayer(videoId: string): void {
    if (!document.getElementById('yt-player-div')) return;
    this.destroyPlayer();
    this.playerReady = false;
    this.ytPlayer = new window.YT.Player('yt-player-div', {
      height: '100%', width: '100%', videoId,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady:       () => { this.playerReady = true; },
        onStateChange: (e: any) => { if (e.data === 0) this.onVideoEnded(); }
      }
    });
  }

  private onVideoEnded(): void {
    const video = this.playlistVideos.find(
      v => v.videoId === this.currentVideoId) || this.currentVideo;
    if (!video || this.videosVues.has(video.videoId)) return;
    this.marquerVideoVue(video);
  }

  private destroyPlayer(): void {
    try { this.ytPlayer?.destroy(); } catch (e) {}
    this.ytPlayer = null; this.playerReady = false;
  }

  // ══════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════
  setCurrentVideo(video: YoutubeVideo, index: number): void {
    this.currentVideoId = video.videoId;
    this.currentVideo   = video;
    this.currentIndex   = index;
    this.loadYouTubeAPI(() => {
      setTimeout(() => {
        if (this.ytPlayer && this.playerReady)
          this.ytPlayer.loadVideoById(video.videoId);
        else this.initPlayer(video.videoId);
      }, 100);
    });
  }

  playVideo(v: YoutubeVideo): void {
    this.setCurrentVideo(v,
      this.playlistVideos.findIndex(x => x.videoId === v.videoId));
  }

  nextVideo(): void {
    if (this.currentIndex < this.playlistVideos.length - 1) {
      const next = this.playlistVideos[this.currentIndex + 1];
      this.setCurrentVideo(next, this.currentIndex + 1);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Progression
  // ══════════════════════════════════════════════════════════════
  private loadExistingProgression(): void {
    if (!this.inscriptionId || !this.playlistVideos.length) return;
    this.http.get<any>(
      `${this.base}/video-progression/inscription/${this.inscriptionId}`
      + `?totalVideos=${this.playlistVideos.length}`
    ).subscribe({
      next: (data) => {
        (data.details || []).forEach((vp: any) => {
          if (vp.vuComplete) this.videosVues.add(vp.videoId);
        });
        this.progression = data.progression || 0;
        const first = this.playlistVideos.find(
          v => !this.videosVues.has(v.videoId))
          || this.playlistVideos[0];
        this.setCurrentVideo(first, this.playlistVideos.indexOf(first));
      },
      error: () => this.setCurrentVideo(this.playlistVideos[0], 0)
    });
  }

  private marquerVideoVue(video: YoutubeVideo): void {
    if (!this.inscriptionId || !this.candidatId) {
      this.videosVues.add(video.videoId);
      this.recalculerLocal(); return;
    }

    this.http.post<any>(`${this.base}/video-progression/video-vue`, {
      inscriptionId: this.inscriptionId,
      candidatId:    this.candidatId,
      formationId:   this.formation.id,
      videoId:       video.videoId,
      totalVideos:   this.playlistVideos.length
    }).subscribe({
      next: (resp) => {
        this.videosVues.add(video.videoId);
        this.progression = resp.progression;
        console.log(`✅ ${video.title} terminée — ${this.progression}%`);

        if (resp.formationTerminee || this.progression >= 100) {
          setTimeout(() => this.lancerQuizFinal(), 1500);
        }
      },
      error: () => {
        this.videosVues.add(video.videoId);
        this.recalculerLocal();
      }
    });
  }

  private recalculerLocal(): void {
    const t = this.playlistVideos.length || 1;
    this.progression = Math.round(this.videosVues.size / t * 100);
    if (this.progression >= 100) {
      setTimeout(() => this.lancerQuizFinal(), 1500);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Quiz FINAL
  // ══════════════════════════════════════════════════════════════
  lancerQuizFinal(): void {
    if (!this.inscriptionId) return;

    // Bloquer si toutes les tentatives sont épuisées
    if (this.tentativesUtilisees >= this.MAX_TENTATIVES) {
      alert('Vous avez atteint le nombre maximum de tentatives (2).');
      return;
    }

    this.showQuizFinal      = true;
    this.quizFinalLoading   = true;
    this.quizFinalSubmitted = false;

    this.http.post<any>(
      `${this.base}/video-progression/quiz-final/generer`, {
        inscriptionId:  this.inscriptionId,
        titreFormation: this.formation.titre,
        categorie:      this.formation.categorie,
        playlistId:     this.formation.playlistId || '',
        totalVideos:    this.playlistVideos.length
      }
    ).subscribe({
      next: (data) => {
        this.quizFinalQuestions = data.questions || [];
        this.quizFinalAnswers   =
          new Array(this.quizFinalQuestions.length).fill(-1);
        this.quizFinalLoading   = false;
      },
      error: () => { this.quizFinalLoading = false; }
    });
  }

  selectFinalAnswer(qi: number, ai: number): void {
    if (this.quizFinalSubmitted) return;
    this.quizFinalAnswers = [...this.quizFinalAnswers];
    this.quizFinalAnswers[qi] = ai;
  }

  submitQuizFinal(): void {
    if (this.quizFinalAnswers.some(a => a === -1)) {
      alert('Veuillez répondre à toutes les questions.'); return;
    }
    if (!this.inscriptionId) return;

    // Incrémenter le compteur de tentatives et sauvegarder
    this.tentativesUtilisees++;
    this.sauvegarderTentatives();

    // Calculer le score
    let correct = 0;
    this.quizFinalQuestions.forEach((q: any, i: number) => {
      if (this.quizFinalAnswers[i] === q.correctIndex) correct++;
    });
    const score = Math.round(
      correct / this.quizFinalQuestions.length * 100);
    this.quizFinalScore = score;

    this.http.post<any>(
      `${this.base}/video-progression/quiz-final/soumettre`, {
        inscriptionId: this.inscriptionId,
        score
      }
    ).subscribe({
      next: (resp) => {
        this.quizFinalSubmitted = true;
        this.quizFinalReussi    = resp.reussi;
        this.quizFinalMessage   = resp.message;

        if (resp.reussi && resp.certificatGenere) {
          this.http.post<any>(
            `${this.base}/certificats/generer/${this.inscriptionId}`,
            {}
          ).subscribe({
            next: (cert) => {
              this.certificatId = cert.id;
            }
          });
        }
      }
    });
  }

  telechargerCertificat(): void {
    if (!this.certificatId) return;
    window.open(
      `${this.base}/certificats/${this.certificatId}/telecharger`,
      '_blank'
    );
  }

  fermerQuizFinal(): void {
    // Si réussi → ne pas fermer (laisser l'utilisateur télécharger son certificat)
    if (this.quizFinalReussi) return;

    // Si échoué et encore des tentatives → permettre de réessayer
    if (this.peutReessayer) {
      this.showQuizFinal      = false;
      this.quizFinalSubmitted = false;
      this.quizFinalAnswers   = [];
    } else {
      // Plus de tentatives → fermer définitivement
      this.showQuizFinal = false;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════
  hasEditor(): boolean {
    if (this.formation.hasEditor !== undefined) return this.formation.hasEditor;
    return this.categoriesAvecEditeur.includes(this.formation.categorie);
  }

  getStackBlitzLabel(): string {
    const sb = this.formation.stackBlitzUrl || '';
    if (sb.includes('react'))      return 'React';
    if (sb.includes('angular'))    return 'Angular';
    if (sb.includes('vue'))        return 'Vue.js';
    if (sb.includes('python'))     return 'Python';
    if (sb.includes('node'))       return 'Node.js';
    if (sb.includes('javascript')) return 'JavaScript';
    return this.formation.categorie || 'Code';
  }

  isVideoVue(id: string): boolean { return this.videosVues.has(id); }

  getProgressionLabel(): string {
    return `${this.videosVues.size}/${this.playlistVideos.length || 1} vidéos terminées`;
  }

  getProgressionColor(): string {
    if (this.progression >= 100) return '#16a34a';
    if (this.progression >= 50)  return '#0965A4';
    return '#f59e0b';
  }


}