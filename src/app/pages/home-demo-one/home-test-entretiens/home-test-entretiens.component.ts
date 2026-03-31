import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../api.service';

export interface TestEntretienPublic {
  id: number;
  titre?: string;
  description?: string;
  domaine?: string;
  domaineLabel?: string;
  dateEntretien?: string;
  photo?: string;
}

@Component({
  selector: 'app-home-test-entretiens',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-test-entretiens.component.html',
  styleUrls: ['./home-test-entretiens.component.scss'],
})
export class HomeTestEntretiensComponent implements OnInit {
  tests: TestEntretienPublic[] = [];
  loading = true;
  error = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getPublicTestEntretiens().subscribe({
      next: (data) => {
        this.tests = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  formatDate(d: string | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  truncate(s: string | undefined, n: number): string {
    if (!s) return '';
    const t = s.trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
  }
}
