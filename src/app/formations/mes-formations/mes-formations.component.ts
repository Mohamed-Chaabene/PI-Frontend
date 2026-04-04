import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Inscription } from '../models/inscription.model';
import { Certificat } from '../models/certificat.model';
import { FormationService } from '../services/formation.service';

@Component({
  selector: 'app-mes-formations',
  standalone: false,
  templateUrl: './mes-formations.component.html',
  styleUrls: ['./mes-formations.component.scss']
})
export class MesFormationsComponent implements OnInit {
  inscriptions: Inscription[] = [];
  certificats: Certificat[] = [];
  candidatId: number | null = null;
  loading = false;

  get enCours()  { return this.inscriptions.filter(i => i.statut === 'EnCours').length; }
  get terminees(){ return this.inscriptions.filter(i => i.statut === 'Terminé').length; }

  constructor(private formationService: FormationService, private router: Router) {}

  ngOnInit(): void {
    this.resolveCandidatIdAndLoad();
  }

  updateProgression(inscription: Inscription): void {
    if (!this.candidatId) return;
    const candidatId = this.candidatId;

    this.formationService.updateProgression(
      inscription.id, inscription.progression
    ).subscribe({
      next: (updated: Inscription) => {
        const idx = this.inscriptions.findIndex(i => i.id === updated.id);
        if (idx !== -1) this.inscriptions[idx] = updated;
        if (updated.statut === 'Terminé') {
          this.formationService.getMesCertificats(candidatId).subscribe({
            next: (data: Certificat[]) => { this.certificats = data; }
          });
        }
      },
      error: (err) => console.error('Erreur updateProgression:', err)
    });
  }

  voirDetailsFormation(formationId: number): void {
    this.router.navigate(['/formations', formationId]);
  }

  private resolveCandidatIdAndLoad(): void {
    // 1. Cache localStorage
    const cached = Number(localStorage.getItem('candidatId'));
    if (!Number.isNaN(cached) && cached > 0) {
      this.candidatId = cached;
      this.loadData();
      return;
    }

    const role = (localStorage.getItem('userRole') || '')
      .toUpperCase().replace(/^ROLE_/, '');
    if (role !== 'CANDIDAT') return;

    // 2. ✅ Depuis le token JWT directement
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const idFromToken = Number(payload.id);
        if (!Number.isNaN(idFromToken) && idFromToken > 0) {
          this.candidatId = idFromToken;
          localStorage.setItem('candidatId', String(idFromToken));
          this.loadData();
          return;
        }
      } catch (e) {
        console.error('Erreur décodage token:', e);
      }
    }

    // 3. Fallback HTTP
    const email = localStorage.getItem('userName') || '';
    if (!email) return;

    this.formationService.getCandidatByEmail(email).subscribe({
      next: (candidat) => {
        if (candidat?.id) {
          this.candidatId = Number(candidat.id);
          localStorage.setItem('candidatId', String(candidat.id));
          this.loadData();
        }
      },
      error: () => {
        this.inscriptions = [];
        this.certificats = [];
      }
    });
  }

  private loadData(): void {
    if (!this.candidatId) return;
    this.loading = true;

    this.formationService.getMesInscriptions(this.candidatId).subscribe({
      next: (data: Inscription[]) => {
        console.log('Inscriptions reçues:', data); // ← debug
        this.inscriptions = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur getMesInscriptions:', err);
        this.loading = false;
      }
    });

    this.formationService.getMesCertificats(this.candidatId).subscribe({
      next: (data: Certificat[]) => { this.certificats = data; },
      error: (err) => console.error('Erreur getMesCertificats:', err)
    });
  }
telecharger(cert: Certificat): void {
  this.formationService.telechargerCertificat(cert.id).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificat-${cert.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    error: (err) => console.error('Erreur téléchargement:', err)
  });
}
}