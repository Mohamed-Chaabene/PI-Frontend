import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PartenaireService } from '../../services/partenaire.service';
import { OffrePartenaireService } from '../../services/offre-partenaire.service'; 

@Component({
  selector: 'app-partenaire-candidat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partenaire-candidat.component.html',
  styleUrls: ['./partenaire-candidat.component.scss']
})
export class PartenaireCandidatComponent implements OnInit {

  partenaires: any[] = [];
  topPartenaires: any[] = [];
  searchTerm: string = '';
  isFocused: boolean = false;
  activityRates: { [id: number]: number } = {};

  
  comparaisonMode: boolean = false;
  partenaireSelectionne1: any = null;
  partenaireSelectionne2: any = null;
  resultatComparaison: any = null;

  
  predictions: { [id: number]: any } = {};
  vues: { [id: number]: number } = {};

  constructor(
    private partenaireService: PartenaireService,
    private router: Router,
    private offrePartenaireService: OffrePartenaireService 
  ) {}

  ngOnInit() {
    this.loadPartenaires();
    this.loadTopPartenaires();
  }

  loadPartenaires() {
    this.partenaireService.getAll().subscribe({
      next: (data: any) => {
        this.partenaires = Array.isArray(data) ? data : data.content ?? [];
        this.partenaires.forEach(p => {
          this.loadActivityRate(p.id);
          this.loadPrediction(p.id);
          this.loadVues(p.id); 
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  loadTopPartenaires() {
    this.partenaireService.getTopPartenaires(3).subscribe({
      next: (data: any[]) => this.topPartenaires = data,
      error: (err: any) => console.error(err)
    });
  }

  loadActivityRate(id: number) {
    this.partenaireService.getActivityRate(id).subscribe({
      next: (rate: number) => this.activityRates[id] = rate,
      error: () => this.activityRates[id] = 0
    });
  }

  
  loadPrediction(id: number) {
  this.offrePartenaireService.predictML(id).subscribe({
    next: (pred: any) => this.predictions[id] = pred,
    error: () => this.predictions[id] = {
      type: 'EMPLOI',
      probability: 50,
      confidence: 'LOW',
      probaStage: 50,
      probaEmploi: 50
    }
  });
}

  
  getPredictionColor(pred: string): string {
    if (!pred) return '#6366f1';
    return pred.includes('EMPLOI') ? '#1d4ed8' : '#92400e';
  }

  
  getPredictionIcon(pred: string): string {
    if (!pred) return 'ri-question-line';
    return pred.includes('EMPLOI')
      ? 'ri-briefcase-line'
      : 'ri-graduation-cap-line';
  }

  getActivityLabel(rate: number): string {
    if (rate >= 2) return 'Très actif';
    if (rate >= 1) return 'Actif';
    if (rate > 0)  return 'Peu actif';
    return 'Inactif';
  }

  getActivityColor(rate: number): string {
    if (rate >= 2) return '#16a34a';
    if (rate >= 1) return '#f59e0b';
    if (rate > 0)  return '#f97316';
    return '#ef4444';
  }

  selectionnerPourComparaison(p: any) {
    if (!this.partenaireSelectionne1) {
      this.partenaireSelectionne1 = p;
    } else if (!this.partenaireSelectionne2
               && p.id !== this.partenaireSelectionne1.id) {
      this.partenaireSelectionne2 = p;
      this.lancerComparaison();
    }
  }

  lancerComparaison() {
    if (!this.partenaireSelectionne1
        || !this.partenaireSelectionne2) return;

    this.partenaireService.comparerPartenaires(
      this.partenaireSelectionne1.id,
      this.partenaireSelectionne2.id
    ).subscribe({
      next: (data: any) => {
        this.resultatComparaison = data;
      },
      error: (err: any) => console.error(err)
    });
  }

  resetComparaison() {
    this.comparaisonMode = false;
    this.partenaireSelectionne1 = null;
    this.partenaireSelectionne2 = null;
    this.resultatComparaison = null;
  }

  get filteredPartenaires(): any[] {
    if (!this.searchTerm.trim()) return this.partenaires;
    const term = this.searchTerm.toLowerCase().trim();
    return this.partenaires.filter(p =>
      p.nom?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.type?.toLowerCase().includes(term)
    );
  }

  getCount(type: string): number {
    return this.partenaires.filter(p => p.type === type).length;
  }

  voirOffres(id: number) {
    this.router.navigate([
      '/candidates-dashboard/partenaires', id, 'offres']);
  }
  loadVues(id: number) {
  this.partenaireService.getNombreVues(id).subscribe({next: (v: number) => this.vues[id] = v,error: () => this.vues[id] = 0});
  }

  
}