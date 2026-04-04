import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OffrePartenaireService } from '../../services/offre-partenaire.service';
import { PartenaireService } from '../../services/partenaire.service';

@Component({
  selector: 'app-offre-candidat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offre-candidat.component.html',
  styleUrls: ['./offre-candidat.component.scss']
})
export class OffreCandidatComponent implements OnInit {

  offres: any[] = [];
  partenaire: any = null;
  partenaireNom: string = '';
  typeFilter: string = '';

  isPostulerOpen = false;
  offreSelectionnee: any = null;
  message: string = '';
  submitted: boolean = false;

  private partenaireId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offreService: OffrePartenaireService,
    private partenaireService: PartenaireService
  ) {}

  ngOnInit() {
    this.partenaireId = +this.route.snapshot.paramMap.get('id')!;
    this.loadPartenaire();
    this.loadOffres();
  }

  loadPartenaire() {
    this.partenaireService.getById(this.partenaireId).subscribe({
      next: (data: any) => {
        this.partenaire = data;
        this.partenaireNom = data.nom;
      },
      error: (err: any) => console.error(err)
    });
  }

  loadOffres() {
    this.offreService.getByPartenaire(this.partenaireId).subscribe({
      next: (data: any[]) => this.offres = data,
      error: (err: any) => console.error(err)
    });
  }

  get filteredOffres(): any[] {
    if (!this.typeFilter) return this.offres;
    return this.offres.filter((o: any) => o.type === this.typeFilter);
  }

  ouvrirPostuler(offre: any) {
    this.offreSelectionnee = offre;
    this.message = '';
    this.submitted = false;
    this.isPostulerOpen = true;
  }

  fermerPostuler() {
    this.isPostulerOpen = false;
    this.offreSelectionnee = null;
  }

  envoyerCandidature() {
    this.submitted = true;
    if (!this.message.trim()) return;
    alert('✅ Candidature envoyée avec succès !');
    this.fermerPostuler();
  }

  retour() {
    this.router.navigate(['/candidates-dashboard/partenaires']);
  }
}