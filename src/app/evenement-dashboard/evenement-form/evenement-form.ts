import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EvenementService } from '../../services/evenement-service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-evenement-form',
    standalone: false,
    templateUrl: './evenement-form.component.html',
    styleUrls: ['./evenement-form.component.scss']
})
export class EvenementFormComponent implements OnInit {

    form!: FormGroup;
    success = false;
    error = false;

    constructor(
        private fb: FormBuilder,
        private service: EvenementService
    ) {}

    ngOnInit() {
        // ✅ Contraintes ici
        this.form = this.fb.group({
            titre:          ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            date:           ['', [Validators.required]],
            lieu:           ['', [Validators.required, Validators.minLength(2)]],
            type:           ['', [Validators.required]],
            organisateurId: [null]
        });

        // ✅ Récupère l'ID depuis le token
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            console.log('Token décodé:', decoded);
            this.form.patchValue({ organisateurId: decoded?.id });
            console.log('organisateurId:', decoded?.id);
        }
    }

    // ✅ Getters
    get titre() { return this.form.get('titre'); }
    get date()  { return this.form.get('date'); }
    get lieu()  { return this.form.get('lieu'); }
    get type()  { return this.form.get('type'); }

    publier() {
        console.log('Form valid:', this.form.valid);
        console.log('Form values:', this.form.value);

        if (this.form.valid) {
            this.service.publier(this.form.value).subscribe({
                next: (res) => {
                    console.log('Événement publié ✅', res);
                    this.success = true;
                    this.error = false;
                    const organisateurId = this.form.value.organisateurId;
                    this.form.reset();
                    this.form.patchValue({ organisateurId });
                    setTimeout(() => this.success = false, 3000);
                },
                error: (err) => {
                    console.error('Erreur ❌', err);
                    this.error = true;
                    this.success = false;
                }
            });
        } else {
            this.form.markAllAsTouched(); // ✅ affiche toutes les erreurs
        }
    }

    annuler() {
        const organisateurId = this.form.value.organisateurId;
        this.form.reset();
        this.form.patchValue({ organisateurId });
        this.success = false;
        this.error = false;
    }
}