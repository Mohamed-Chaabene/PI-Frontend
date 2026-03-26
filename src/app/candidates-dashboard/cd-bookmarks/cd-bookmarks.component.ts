import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-cd-bookmarks',
    standalone: false,
    templateUrl: './cd-bookmarks.component.html',
    styleUrls: ['./cd-bookmarks.component.scss']
})
export class CdBookmarksComponent implements OnInit {

    offres: any[] = [];
    isLoading = true;
    message = '';
    messageType = '';

    // Données statiques pour l'affichage
    offresData = [
        { 
            id: 1, image: 'company11.png', location: 'Chicago', salary: '$2K - $3K', 
            created: 'Oct 21, 2025', deadline: 'Nov 12, 2025', entreprise: 'Techstar', 
            typeContrat: 'Full Time', titre: 'Senior Project Manager', statut: 'ACTIVE'
        },
        { 
            id: 2, image: 'company12.png', location: 'Seoul', salary: '$11K - $23K', 
            created: 'Oct 21, 2025', deadline: 'Nov 13, 2025', entreprise: 'Mund', 
            typeContrat: 'Full Time', titre: 'Assistant Manager', statut: 'CLOSED'
        },
        { 
            id: 3, image: 'company13.png', location: 'Hong Kong', salary: '$50 - $100', 
            created: 'Oct 21, 2025', deadline: 'Nov 14, 2025', entreprise: 'Finix', 
            typeContrat: 'Hourly', titre: 'Junior Banker', statut: 'ACTIVE'
        },
        { 
            id: 4, image: 'company14.png', location: 'Toronto', salary: '$10K - $33K', 
            created: 'Oct 21, 2025', deadline: 'Nov 15, 2025', entreprise: 'Aoriv', 
            typeContrat: 'Full Time', titre: 'Founder Associate', statut: 'ACTIVE'
        },
        { 
            id: 5, image: 'company8.png', location: 'London', salary: '$1K - $3K', 
            created: 'Oct 21, 2025', deadline: 'Oct 30, 2025', entreprise: 'Topoint', 
            typeContrat: 'Full Time', titre: 'Mechanical Engineer', statut: 'ACTIVE'
        },
        { 
            id: 6, image: 'company9.png', location: 'Barcelona', salary: '$10 - $50', 
            created: 'Oct 21, 2025', deadline: 'Nov 10, 2025', entreprise: 'Zayper', 
            typeContrat: 'Part Time', titre: 'Senior Support Engineer', statut: 'CLOSED'
        },
        { 
            id: 7, image: 'company10.png', location: 'São Paulo', salary: '$6K - $7K', 
            created: 'Oct 21, 2025', deadline: 'Nov 11, 2025', entreprise: 'Doca', 
            typeContrat: 'Full Time', titre: 'Senior C# / .NET Developer', statut: 'ACTIVE'
        },
        { 
            id: 8, image: 'company15.png', location: 'Beijing', salary: '$3K - $5K', 
            created: 'Oct 21, 2025', deadline: 'Nov 16, 2025', entreprise: 'Dking', 
            typeContrat: 'Full Time', titre: 'Marketing Executive', statut: 'ACTIVE'
        },
        { 
            id: 9, image: 'company16.png', location: 'New York', salary: '$2K - $2.5K', 
            created: 'Oct 21, 2025', deadline: 'Nov 17, 2025', entreprise: 'Oxygen', 
            typeContrat: 'Full Time', titre: 'Digital Marketing Manager', statut: 'ACTIVE'
        },
        { 
            id: 10, image: 'company17.png', location: 'Tokyo', salary: '$15 - $25', 
            created: 'Oct 21, 2025', deadline: 'Nov 18, 2025', entreprise: 'Affort', 
            typeContrat: 'Hourly', titre: 'Technical SEO Manager', statut: 'ACTIVE'
        }
    ];

    constructor(private apiService: ApiService) {}

    ngOnInit(): void {
        this.loadOffres();
    }

    loadOffres(): void {
        this.isLoading = true;
        
        this.apiService.getOffresEmploi().subscribe({
            next: (data) => {
                if (data && data.length > 0) {
                    this.offres = data.map((offre: any, index: number) => {
                        const staticData = this.offresData[index % this.offresData.length];
                        return {
                            ...offre,
                            ...staticData,
                            entreprise: offre.entreprise || staticData.entreprise,
                            statut: offre.statut || staticData.statut
                        };
                    });
                } else {
                    this.offres = this.offresData;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erreur API, utilisation des données statiques', err);
                this.offres = this.offresData;
                this.isLoading = false;
            }
        });
    }

    postuler(offre: any): void {
        if (offre.statut === 'CLOSED') {
            this.showMessage('Cette offre est déjà clôturée', 'error');
            return;
        }
        
        if (confirm(`Postuler à l'offre "${offre.titre}" chez ${offre.entreprise} ?`)) {
            const candidatureData = {
                offreId: offre.id,
                entreprise: offre.entreprise,
                poste: offre.titre,
                lettreGeneree: `Candidature pour le poste de ${offre.titre} chez ${offre.entreprise}`
            };
            
            this.apiService.creerCandidature(candidatureData).subscribe({
                next: () => {
                    this.showMessage(`✅ Candidature envoyée avec succès pour "${offre.titre}" !`, 'success');
                },
                error: (err) => {
                    console.error('Erreur:', err);
                    this.showMessage(`❌ Erreur lors de la candidature pour "${offre.titre}"`, 'error');
                }
            });
        }
    }

    showMessage(msg: string, type: string): void {
        this.message = msg;
        this.messageType = type;
        setTimeout(() => {
            this.message = '';
        }, 3000);
    }
}