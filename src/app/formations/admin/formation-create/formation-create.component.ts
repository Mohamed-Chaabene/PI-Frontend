import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormationService, FormationCreatePayload } from '../../services/formation.service';

@Component({
  selector: 'app-formation-create',
  standalone: false,
  templateUrl: './formation-create.component.html',
  styleUrls: ['./formation-create.component.scss']
})
export class FormationCreateComponent {
  private fb = inject(FormBuilder);
  private formationService = inject(FormationService);
  private router = inject(Router);

  saving = false;

  form = this.fb.nonNullable.group({
    titre:      ['', [Validators.required, Validators.minLength(3)]],
    categorie:  ['', Validators.required],
    plateforme: ['', Validators.required],
    statut:     ['Disponible', Validators.required],
    duree:      ['', Validators.required],
    niveau:     ['Débutant', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.formationService.createFormation(this.form.getRawValue() as FormationCreatePayload).subscribe({
      next: () => this.router.navigate(['/formations/admin']),
      error: () => { this.saving = false; }
    });
  }

  cancel(): void {
    this.router.navigate(['/formations/admin']);
  }
}