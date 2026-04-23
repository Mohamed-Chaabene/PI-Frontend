import { Component, OnInit, OnDestroy } from '@angular/core';
import { FreelanceService, Mission, Candidature } from './services/freelance.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FreelanceWorkspaceService } from './services/freelance-workspace.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: false,
  templateUrl: './client-dashboard.component.html'
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  missions: Mission[] = [];
  candidaturesMission: Candidature[] = [];
  missionSelectionnee?: number;
  loading = true;
  protected math = Math;

  // Edit state
  editingMission: Mission | null = null;
  editForm = { titre: '', description: '', budget: 0, competences: '' };

  private sub!: Subscription;

  constructor(
    private freelanceService: FreelanceService,
    private workspaceService: FreelanceWorkspaceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the BehaviorSubject so the list auto-updates
    this.sub = this.freelanceService.mesMissions$.subscribe(m => {
      this.missions = m;
      this.loading = false;
    });
    // Trigger the initial fetch
    this.freelanceService.refreshMesMissions();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  voirCandidatures(missionId: number): void {
    this.missionSelectionnee = missionId;
    this.freelanceService.candidaturesDeMission(missionId)
      .subscribe(c => this.candidaturesMission = c);
  }

  // ── Edit ────────────────────────────────────────────────────────────

  startEdit(mission: Mission): void {
    this.editingMission = mission;
    this.editForm = {
      titre: mission.titre,
      description: mission.description,
      budget: mission.budget,
      competences: (mission.competences || []).join(', ')
    };
  }

  cancelEdit(): void {
    this.editingMission = null;
  }

  saveEdit(): void {
    if (!this.editingMission) return;
    const payload = {
      titre: this.editForm.titre,
      description: this.editForm.description,
      budget: this.editForm.budget,
      competences: this.editForm.competences.split(',').map(s => s.trim()).filter(s => s)
    };
    this.freelanceService.updateMission(this.editingMission.id, payload).subscribe({
      next: () => this.editingMission = null,
      error: () => alert('Erreur lors de la mise à jour.')
    });
  }

  // ── Delete ──────────────────────────────────────────────────────────

  deleteMission(mission: Mission): void {
    this.freelanceService.deleteMission(mission.id).subscribe({
      error: () => alert('Erreur lors de la suppression.')
    });
  }

  // ── Accept / Reject candidatures ────────────────────────────────────

  accepter(candidature: Candidature): void {
    this.freelanceService.accepterCandidature(candidature.id).subscribe(updated => {
      const idx = this.candidaturesMission.findIndex(c => c.id === updated.id);
      if (idx >= 0) this.candidaturesMission[idx] = updated;
    });
  }

  rejeter(candidature: Candidature): void {
    this.freelanceService.rejeterCandidature(candidature.id).subscribe(updated => {
      const idx = this.candidaturesMission.findIndex(c => c.id === updated.id);
      if (idx >= 0) this.candidaturesMission[idx] = updated;
    });
  }

  isGeneratingContract = false;
  simulatedHash = '0000000000000000';
  private hashInterval: any;

  generateContract(c: Candidature): void {
    if (!this.missionSelectionnee) return;
    const mission = this.missions.find(m => m.id === this.missionSelectionnee);
    if (!mission) return;
    
    this.isGeneratingContract = true;
    
    // Animate the hash
    this.hashInterval = setInterval(() => {
      this.simulatedHash = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
    }, 50);
    
    // Simulate Blockchain Verification before backend call
    setTimeout(() => {
      clearInterval(this.hashInterval);
      this.workspaceService.generateContract(mission.id, c.utilisateurId, mission.budget).subscribe({
        next: (contract) => {
          this.isGeneratingContract = false;
          this.router.navigate(['/freelance/workspace']);
        },
        error: () => {
          this.isGeneratingContract = false;
          alert('Erreur lors de la génération du contrat.');
        }
      });
    }, 2500);
  }
}