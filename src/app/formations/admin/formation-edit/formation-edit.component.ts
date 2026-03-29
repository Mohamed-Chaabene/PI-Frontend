import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormationService } from '../../services/formation.service';

@Component({
  selector: 'app-formation-edit',
  standalone: false,
  templateUrl: './formation-edit.component.html',
  styleUrls: ['./formation-edit.component.scss']
})
export class FormationEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private formationService = inject(FormationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = false;
  loading = false;
  formationId!: number;

  form = this.fb.nonNullable.group({
    titre:      ['', [Validators.required, Validators.minLength(3)]],
    categorie:  ['', Validators.required],
    plateforme: ['', Validators.required],
    statut:     ['Disponible', Validators.required],
    duree:      ['', Validators.required],
    niveau:     ['Débutant', Validators.required]
  });

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.formationService.getFormationById(this.formationId).subscribe({
      next: (f) => {
        this.form.patchValue(f);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.formationService.updateFormation(this.formationId, this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/formations/admin']),
      error: () => { this.saving = false; }
    });
  }

  cancel(): void {
    this.router.navigate(['/formations/admin']);
  }
}