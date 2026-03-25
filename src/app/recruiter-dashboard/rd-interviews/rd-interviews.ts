import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

interface EntretienForm {
  titre: string;
  description: string;
  type: string;
  dateEntretien: string;
  candidatId: number | null;
}

@Component({
  selector: 'app-rd-interviews',
  imports: [CommonModule, FormsModule],
  templateUrl: './rd-interviews.html',
  styleUrls: ['./rd-interviews.scss'],
})
export class RdInterviews implements OnInit {
  entretiens: any[] = [];
  candidats: any[] = [];
  newEntretien: EntretienForm = {
    titre: '',
    description: '',
    type: '',
    dateEntretien: '',
    candidatId: null
  };
  showCreateForm = false;
  currentUser: any;
  currentUserId: number | null = null;
  typesEntretien = ['TECHNIQUE', 'RH', 'MANAGERIAL', 'FINAL', 'PRESELECTION', 'TEST'];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadEntretiens();
    this.loadCandidats();
  }

  getCurrentUser(): void {
    // 1. Essayer de récupérer depuis localStorage
    const storedRecruteurId = localStorage.getItem('recruteurId');
    if (storedRecruteurId) {
      const parsedId = Number(storedRecruteurId);
      if (!isNaN(parsedId) && parsedId > 0) {
        this.currentUserId = parsedId;
        console.log('✅ ID Recruteur récupéré depuis localStorage:', this.currentUserId);
        return;
      }
    }

    // 2. Récupérer via API (recommandé)
    console.log('🔍 Tentative de récupération de l\'ID via API...');
    this.apiService.getCurrentRecruteur().subscribe({
      next: (recruteur: any) => {
        if (recruteur && recruteur.id) {
          this.currentUserId = recruteur.id;
          localStorage.setItem('recruteurId', String(this.currentUserId));
          console.log('✅ ID Recruteur récupéré via API:', this.currentUserId);
        } else {
          console.warn('⚠️ Réponse API sans ID recruteur:', recruteur);
          this.fallbackFromToken();
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la récupération du recruteur via API:', error);
        this.fallbackFromToken();
      }
    });
  }

  private fallbackFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.currentUser = jwtDecode(token);
        console.log('🔍 Token décodé (fallback):', this.currentUser);
        const tokenId = this.currentUser?.id ||
                       this.currentUser?.sub ||
                       this.currentUser?.userId ||
                       this.currentUser?.recruteurId;

        if (tokenId) {
          const parsedTokenId = Number(tokenId);
          if (!isNaN(parsedTokenId) && parsedTokenId > 0) {
            this.currentUserId = parsedTokenId;
            localStorage.setItem('recruteurId', String(this.currentUserId));
            console.log('✅ ID Recruteur depuis token (fallback):', this.currentUserId);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Erreur token fallback:', error);
      }
    }

    console.log('⚠️ Impossible de récupérer l\'ID Recruteur');
    this.currentUserId = null;
  }

  loadCandidats(): void {
    this.apiService.getCandidats().subscribe({
      next: (data) => {
        this.candidats = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        console.error('Erreur chargement candidats', error);
        this.candidats = [];
      }
    });
  }

  loadEntretiens(): void {
    this.apiService.getEntretiens().subscribe({
      next: (data: any[]) => {
        this.entretiens = Array.isArray(data) ? data : [];
      },
      error: (error: any) => {
        console.error('Erreur chargement entretiens', error);
        this.entretiens = [];
      }
    });
  }

  private loadDemoEntretiens(): void {
    // Charger des données de démo pour démonstration
    this.entretiens = [
      {
        id: 1,
        titre: 'Entretien Développeur Angular',
        description: 'Entretien technique pour poste développeur Angular',
        type: 'TECHNIQUE',
        dateEntretien: new Date().toISOString(),
        completed: false
      },
      {
        id: 2,
        titre: 'Entretien RH',
        description: 'Entretien RH de présentation',
        type: 'RH',
        dateEntretien: new Date().toISOString(),
        completed: false
      }
    ];
    console.log('ℹ️ Données de démonstration chargées:', this.entretiens);
  }

  createEntretien(): void {
    const isTest = this.newEntretien.type === 'TEST';
    const candidateRequired = !isTest;

    if (this.newEntretien.description && this.newEntretien.type && this.newEntretien.dateEntretien && (!candidateRequired || this.newEntretien.candidatId)) {
      const payload: any = {
        titre: this.newEntretien.titre,
        description: this.newEntretien.description,
        categorie: this.newEntretien.type,
        type: this.newEntretien.type,
        dateEntretien: this.newEntretien.dateEntretien
      };

      if (this.newEntretien.candidatId !== null && this.newEntretien.candidatId !== undefined) {
        payload.candidatId = this.newEntretien.candidatId;
      }

      const recruteurId = this.currentUserId;
      console.log('🔍 Debug - ID Recruteur actuel:', this.currentUserId);
      console.log('🔍 Debug - Payload:', payload);
      console.log('🔍 Debug - Token présent:', !!localStorage.getItem('token'));

      if (candidateRequired && !this.newEntretien.candidatId) {
        alert('Veuillez sélectionner un candidat pour ce type d\'entretien.');
        return;
      }

      if (!recruteurId || isNaN(recruteurId) || recruteurId <= 0) {
        console.error('❌ ID Recruteur invalide:', recruteurId);
        alert('Erreur : ID du recruteur manquant ou invalide. Veuillez vous reconnecter.');
        return;
      }

      console.log('✅ Envoi de la requête avec Recruteur-ID:', recruteurId);
      this.apiService.createEntretien(payload, recruteurId).subscribe({
        next: (response) => {
          console.log('✅ Success:', response);
          alert('Entretien créé avec succès! Redirection vers l\'ajout de questions...');
          this.entretiens.push(response);
          this.newEntretien = {
            titre: '',
            description: '',
            type: '',
            dateEntretien: '',
            candidatId: null
          };
          this.showCreateForm = false;
          this.router.navigate(['/recruiter-dashboard/interviews/add-questions', response.id]);
        },
        error: (error) => {
          console.error('❌ Erreur complète:', error);
          console.error('❌ Status:', error.status);
          console.error('❌ Headers:', error.headers);
          console.error('❌ Error body:', error.error);
          alert(`Erreur lors de la création de l'entretien (${error.status}): ${error.error?.message || error.statusText}`);
        }
      });
    } else {
      alert('Veuillez remplir tous les champs obligatoires.');
    }
  }

  completeEntretien(id: number): void {
    this.apiService.completeEntretien(id).subscribe({
      next: () => {
        const entretien = this.entretiens.find(e => e.id === id);
        if (entretien) entretien.completed = true;
      },
      error: (error) => console.error('Error completing entretien', error)
    });
  }

  viewResult(id: number): void {
    this.apiService.getResultat(id).subscribe({
      next: (result) => {
        alert(`Score: ${result.score}%, Decision: ${result.decision}`);
      },
      error: (error) => console.error('Error getting result', error)
    });
  }

  goToAddQuestions(entretienId: number): void {
    this.router.navigate(['/recruiter-dashboard/interviews/add-questions', entretienId]);
  }
}
