import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FreelanceService } from './services/freelance.service';

@Component({
  selector: 'app-post-mission',
  standalone: false,
  templateUrl: './post-mission.component.html'
})
export class PostMissionComponent {
  form: FormGroup;
  soumis = false;
  erreur = '';

  constructor(
    private fb: FormBuilder,
    private freelanceService: FreelanceService,
    private router: Router
  ) {
    this.form = this.fb.group({
      titre:       ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      budget:      [null, [Validators.required, Validators.min(1)]],
      competences: ['', Validators.required]
    });
  }

  soumettre(): void {
    if (this.form.invalid) return;
    const payload = {
      ...this.form.value,
      competences: this.form.value.competences
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    };
    this.freelanceService.publierMission(payload).subscribe({
      next: () => {
        this.soumis = true;
        setTimeout(() => this.router.navigate(['/freelance/client']), 1800);
      },
      error: () => { this.erreur = 'Erreur lors de la publication.'; }
    });
  }
}