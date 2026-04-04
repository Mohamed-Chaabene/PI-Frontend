import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PartenaireService } from '../../services/partenaire.service';

@Component({
  selector: 'app-partenaire-candidat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partenaire-candidat.component.html',
  styleUrls: ['./partenaire-candidat.component.scss']
})
export class PartenaireCandidatComponent implements OnInit {

  partenaires: any[] = [];
  searchTerm: string = '';

  constructor(
    private partenaireService: PartenaireService,
    private router: Router
  ) {}

  ngOnInit() {
    this.partenaireService.getAll().subscribe({
      next: (data: any) => {
        console.log('DATA REÇUE:', data); // ← Regarde F12 Console
        this.partenaires = Array.isArray(data) ? data : data.content ?? [];
      },
      error: (err: any) => console.error(err)
    });
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

  voirOffres(id: number) {
    this.router.navigate(['/candidates-dashboard/partenaires', id, 'offres']);
  }
}
