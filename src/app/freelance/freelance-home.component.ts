import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FreelanceViewMode, RoleSwitchService } from './services/role-switch.service';
import { FreelanceService, FreelanceStats, MatchResult } from './services/freelance.service';

@Component({
  selector: 'app-freelance-home',
  standalone: false,
  templateUrl: './freelance-home.component.html'
})
export class FreelanceHomeComponent implements OnInit, OnDestroy {
  mode: FreelanceViewMode = 'FREELANCER';
  jwtRole: string | null = null;
  canSwitchToClient = false;
  private sub!: Subscription;

  // ── Stats ──────────────────────────────────────────────────────────
  freelancerStats: FreelanceStats | null = null;
  clientStats: FreelanceStats | null = null;

  // ── AI Matching ────────────────────────────────────────────────────
  showMatchPanel = false;
  matchResults: MatchResult[] = [];
  matchLoading = false;
  matchPanelTitle = '';

  // ── Scheduler ───────────────────────────────────────────────────────
  upcomingEvents: any[] = []; // Type: FreelanceEvent[]

  constructor(
    public roleSwitchService: RoleSwitchService,
    private freelanceService: FreelanceService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.checkRole();
    this.sub = this.roleSwitchService.mode$.subscribe(m => {
      this.mode = m;
      this.showMatchPanel = false;
      this.loadStats();
    });
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Mode switching ─────────────────────────────────────────────────
  checkRole(): void {
    const raw = this.roleSwitchService.getJwtRole();
    this.jwtRole = raw ? raw.toUpperCase().replace(/^ROLE_/, '') : null;
    // Both actual clients and candidates can switch to Client interface for recruitment
    this.canSwitchToClient = this.jwtRole === 'CLIENT_FREELANCE' || this.jwtRole === 'CANDIDAT';
  }

  switchToFreelancerMode(): void {
    console.log('Switching to Freelancer mode');
    this.roleSwitchService.switchMode('FREELANCER');
  }

  switchToClientMode(): void {
    console.log('Switching to Client mode, checking permits...');
    if (!this.canSwitchToClient) {
      alert('Accès réservé aux clients et candidats.');
      return;
    }
    this.roleSwitchService.switchMode('CLIENT_FREELANCE');
  }

  goToClientMissions(): void {
    console.log('Navigating to client missions...');
    this.router.navigate(['/freelance/client']);
  }

  goBackToCandidate(): void {
    this.router.navigate(['/candidates-dashboard']);
  }

  // ── Load Stats ─────────────────────────────────────────────────────
  loadStats(): void {
    // Always try freelancer stats (both roles can access)
    this.freelanceService.getFreelancerStats().subscribe({
      next: s => this.freelancerStats = s,
      error: () => this.freelancerStats = null
    });

    // Client stats only if applicable
    if (this.jwtRole === 'CLIENT_FREELANCE') {
      this.freelanceService.getClientStats().subscribe({
        next: s => this.clientStats = s,
        error: () => this.clientStats = null
      });
    }

    // Load upcoming events
    this.freelanceService.getMyEvents().subscribe({
      next: events => {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        this.upcomingEvents = events
          .filter(e => {
            const startDate = new Date(e.startDate);
            return startDate >= now && startDate <= nextWeek;
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 3); // Show top 3
      },
      error: () => this.upcomingEvents = []
    });
  }

  // ── AI Matching Actions ────────────────────────────────────────────
  openSmartMatching(): void {
    this.showMatchPanel = true;
    this.matchLoading = true;
    this.matchPanelTitle = '🎯 Missions recommandées par l\'IA';
    this.freelanceService.getAIMatchedMissions().subscribe({
      next: results => {
        this.matchResults = results;
        this.matchLoading = false;
      },
      error: () => {
        this.matchResults = [];
        this.matchLoading = false;
      }
    });
  }

  openTalentRecommendations(): void {
    // Get the first mission from client stats to recommend talents for
    this.freelanceService.mesMissions().subscribe({
      next: missions => {
        if (missions.length === 0) {
          alert('Publiez une mission d\'abord pour recevoir des recommandations.');
          return;
        }
        this.showMatchPanel = true;
        this.matchLoading = true;
        this.matchPanelTitle = '🤖 Talents recommandés pour: ' + missions[0].titre;
        this.freelanceService.getAIMatchedTalents(missions[0].id).subscribe({
          next: results => {
            this.matchResults = results;
            this.matchLoading = false;
          },
          error: () => {
            this.matchResults = [];
            this.matchLoading = false;
          }
        });
      }
    });
  }

  closeMatchPanel(): void {
    this.showMatchPanel = false;
    this.matchResults = [];
  }

  selectEventFromDash(event: any): void {
    // Navigate to full scheduler for management
    this.router.navigate(['/freelance/scheduler']);
  }

  navigateToMission(id: number): void {
    this.router.navigate(['/freelance/projects', id]);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  getEventTimeLabel(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  getEventTypeIcon(type: string): string {
    const map: any = {
      'INTERVIEW': '🎙️',
      'DEADLINE': '⏰',
      'MEETING': '🤝',
      'REVIEW': '📋',
      'MILESTONE': '🏁'
    };
    return map[type] || '📅';
  }
}