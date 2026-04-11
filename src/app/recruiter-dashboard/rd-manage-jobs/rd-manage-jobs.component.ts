import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface DecisionRow {
    candidatureId: number | null;
    candidatNom: string;
    candidatureStatut: string;
    competencesOffre: string[];
    competencesCandidat: string[];
    competencesCorrespondantes: string[];
    competencesManquantes: string[];
    tauxCorrespondance: number;
    scoreEntretien: number | null;
    scoreCompetence: number;
    scoreExperience: number;
    scoreFinal: number;
    experienceAnnees: number;
    rang: number;
    decision: string;
}

interface DecisionReport {
    offre: any;
    candidats: DecisionRow[];
    candidatRecommande: DecisionRow | null;
    totalCandidatures: number;
    totalEntretiens: number;
}

@Component({
    selector: 'app-rd-manage-jobs',
    standalone: false,
    templateUrl: './rd-manage-jobs.component.html',
    styleUrls: ['./rd-manage-jobs.component.scss']
})
export class RdManageJobsComponent {
    offres: any[] = [];
    loading = false;
    saving = false;
    decisionLoading = false;
    errorMessage = '';
    successMessage = '';
    offreEditee: any = null;
    decisionError = '';
    decisionReport: DecisionReport | null = null;

    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit(): void { this.chargerOffres(); }

    chargerOffres(): void {
        this.loading = true;
        this.errorMessage = '';
        this.apiService.getMesOffresEmploi().subscribe({
            next: (data) => {
                this.offres = data || [];
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.apiService.getOffresEmploi().subscribe({
                    next: (fallbackData) => {
                        this.offres = fallbackData || [];
                        this.errorMessage = this.offres.length > 0 ? '' : 'Impossible de charger vos offres.';
                        this.loading = false;
                    },
                    error: () => {
                        this.errorMessage = 'Impossible de charger vos offres.';
                        this.loading = false;
                    }
                });
            }
        });
    }

    modifier(offre: any): void {
        this.offreEditee = {
            ...offre,
            deadline: offre?.deadline ? this.toDateInputValue(offre.deadline) : ''
        };
    }

    annuler(): void {
        this.offreEditee = null;
    }

    enregistrer(): void {
        if (!this.offreEditee?.id) { return; }

        this.saving = true;
        const payload = {
            ...this.offreEditee,
            deadline: this.offreEditee.deadline ? new Date(this.offreEditee.deadline) : null,
            competencesRequises: Array.isArray(this.offreEditee.competencesRequises) ? this.offreEditee.competencesRequises : []
        };

        this.apiService.modifierOffreEmploi(this.offreEditee.id, payload).subscribe({
            next: () => {
                this.successMessage = 'Offre mise a jour.';
                this.offreEditee = null;
                this.saving = false;
                this.chargerOffres();
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = 'Erreur lors de la mise a jour.';
                this.saving = false;
            }
        });
    }

    supprimer(offre: any): void {
        if (!offre?.id) { return; }
        if (!confirm(`Supprimer l'offre "${offre.titre}" ?`)) { return; }

        this.apiService.supprimerOffreEmploi(offre.id).subscribe({
            next: () => {
                this.successMessage = 'Offre supprimee.';
                this.chargerOffres();
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = 'Erreur lors de la suppression.';
            }
        });
    }

    ouvrirInterview(offre: any): void {
        if (!offre?.id) {
            return;
        }

        this.router.navigate(['/recruiter-dashboard/interviews'], {
            queryParams: {
                createFromJob: '1',
                offreId: offre.id,
                poste: offre.titre || '',
                description: offre.description || '',
                localisation: offre.location || '',
                contrat: offre.typeContrat || ''
            }
        });
    }

    ouvrirDecision(offre: any): void {
        if (!offre?.id) {
            return;
        }

        this.decisionLoading = true;
        this.decisionError = '';
        this.decisionReport = null;

        this.apiService.getCandidaturesByOffre(offre.id).subscribe({
            next: (candidatures) => {
                const candidateRequests = (Array.isArray(candidatures) ? candidatures : []).map((candidature: any) => {
                    const candidateId = Number(candidature?.candidatId ?? candidature?.candidat?.id ?? 0);

                    if (!Number.isFinite(candidateId) || candidateId <= 0) {
                        return of({ key: this.getCandidateKey(candidature), interviews: [] as any[] });
                    }

                    return this.apiService.getEntretiensByCandidat(candidateId).pipe(
                        map((interviews) => ({
                            key: this.getCandidateKey(candidature),
                            interviews: Array.isArray(interviews) ? interviews : []
                        })),
                        catchError((error) => {
                            console.error('Erreur chargement entretiens du candidat:', error);
                            return of({ key: this.getCandidateKey(candidature), interviews: [] as any[] });
                        })
                    );
                });

                if (!candidateRequests.length) {
                    this.finishDecisionReport(offre, [], [], new Map<string, any[]>());
                    return;
                }

                forkJoin(candidateRequests).subscribe({
                    next: (candidateInterviewSets) => {
                        const interviewMap = new Map<string, any[]>();
                        (candidateInterviewSets || []).forEach((entry: any) => {
                            interviewMap.set(String(entry?.key || ''), Array.isArray(entry?.interviews) ? entry.interviews : []);
                        });

                        const recruiterId = Number(localStorage.getItem('recruteurId'));
                        if (!Number.isFinite(recruiterId) || recruiterId <= 0) {
                            this.finishDecisionReport(offre, candidatures || [], [], interviewMap);
                            return;
                        }

                        this.apiService.getEntretiensByRecruteur(recruiterId).subscribe({
                            next: (entretiens) => {
                                this.finishDecisionReport(offre, candidatures || [], entretiens || [], interviewMap);
                            },
                            error: (error) => {
                                console.error('Erreur chargement entretiens pour le rapport de décision:', error);
                                this.finishDecisionReport(offre, candidatures || [], [], interviewMap);
                            }
                        });
                    },
                    error: (error) => {
                        console.error('Erreur chargement des entretiens candidats:', error);
                        this.finishDecisionReport(offre, candidatures || [], [], new Map<string, any[]>());
                    }
                });
            },
            error: (error) => {
                console.error('Erreur chargement candidatures pour le rapport de décision:', error);
                this.decisionError = 'Impossible de charger le rapport de décision.';
                this.decisionLoading = false;
            }
        });
    }

    fermerDecision(): void {
        this.decisionReport = null;
        this.decisionError = '';
        this.decisionLoading = false;
    }

    formatDate(value: any): string {
        if (!value) { return '-'; }
        return new Date(value).toLocaleDateString('fr-FR');
    }

    get requiredSkillsText(): string {
        const skills = this.normalizeSkills(this.getOfferSkillsSource(this.decisionReport?.offre));
        return skills.length ? skills.join(', ') : 'Aucune compétence requise indiquée';
    }

    formatExperienceYears(value: number): string {
        if (!Number.isFinite(value)) {
            return '0';
        }

        return Number.isInteger(value) ? `${value}` : value.toFixed(1);
    }

    private finishDecisionReport(offre: any, candidatures: any[], entretiens: any[], candidateInterviewMap: Map<string, any[]> = new Map<string, any[]>()): void {
        this.decisionReport = this.buildDecisionReport(offre, candidatures, entretiens, candidateInterviewMap);
        this.decisionLoading = false;
    }

    private buildDecisionReport(offre: any, candidatures: any[], entretiens: any[], candidateInterviewMap: Map<string, any[]>): DecisionReport {
        const rows = (Array.isArray(candidatures) ? candidatures : []).map((candidature: any) => {
            const offreSkills = this.normalizeSkills(this.getOfferSkillsSource(offre));
            const candidatSkills = this.normalizeSkills(candidature?.competences || candidature?.candidat?.competences);
            const matchingSkills = offreSkills.filter((skill) => this.skillMatches(skill, candidatSkills));
            const missingSkills = offreSkills.filter((skill) => !this.skillMatches(skill, candidatSkills));
            const key = this.getCandidateKey(candidature);
            const candidateInterviews = candidateInterviewMap.get(key) || [];
            const interviewScore = this.getBestInterviewScore(offre?.id, candidature, candidateInterviews, entretiens);
            const experienceYears = this.extractExperienceYears(candidature?.experience);
            const tauxCorrespondance = offreSkills.length > 0
                ? Math.round((matchingSkills.length / offreSkills.length) * 100)
                : (candidatSkills.length > 0 ? 100 : 0);
            const scoreCompetence = Math.min(100, Math.max(0, tauxCorrespondance));
            const scoreExperience = this.normalizeExperienceScore(experienceYears);
            const scoreFinal = this.calculateFinalScore(interviewScore, scoreCompetence, scoreExperience);

            return {
                candidatureId: candidature?.id ?? null,
                candidatNom: this.getCandidatLabel(candidature),
                candidatureStatut: String(candidature?.statut || 'EN_ATTENTE'),
                competencesOffre: offreSkills,
                competencesCandidat: candidatSkills,
                competencesCorrespondantes: matchingSkills,
                competencesManquantes: missingSkills,
                tauxCorrespondance,
                scoreEntretien: interviewScore,
                scoreCompetence,
                scoreExperience,
                scoreFinal,
                experienceAnnees: experienceYears,
                rang: 0,
                decision: ''
            } as DecisionRow;
        });

        rows.sort((a, b) => {
            const scoreDiff = b.scoreFinal - a.scoreFinal;
            if (scoreDiff !== 0) { return scoreDiff; }

            const matchDiff = b.tauxCorrespondance - a.tauxCorrespondance;
            if (matchDiff !== 0) { return matchDiff; }

            const scoreA = a.scoreEntretien ?? -1;
            const scoreB = b.scoreEntretien ?? -1;
            if (scoreB !== scoreA) { return scoreB - scoreA; }

            const expDiff = b.experienceAnnees - a.experienceAnnees;
            if (expDiff !== 0) { return expDiff; }

            return a.candidatNom.localeCompare(b.candidatNom, 'fr', { sensitivity: 'base' });
        });

        rows.forEach((row, index) => {
            row.rang = index + 1;
            row.decision = index === 0
                ? 'Choix final recommandé'
                : this.buildDecisionLabel(row);
        });

        return {
            offre,
            candidats: rows,
            candidatRecommande: rows.length > 0 ? rows[0] : null,
            totalCandidatures: rows.length,
            totalEntretiens: entretiens.length
        };
    }

    private buildDecisionLabel(row: DecisionRow): string {
        if (row.scoreFinal >= 80) {
            return 'Choix final recommandé';
        }

        if (row.scoreFinal >= 65) {
            return 'Très bon profil';
        }

        if (row.scoreFinal >= 50) {
            return 'Profil solide';
        }

        return 'À comparer';
    }

    private getCandidatLabel(candidature: any): string {
        return String(
            candidature?.nomComplet ||
            candidature?.candidatNom ||
            candidature?.candidat?.nomComplet ||
            candidature?.candidat?.nom ||
            'Candidat'
        );
    }

    private getBestInterviewScore(offreId: number, candidature: any, candidateInterviews: any[], fallbackEntretiens: any[]): number | null {
        const candidateKeys = this.getCandidateKeys(candidature);
        const scores = [
            ...(Array.isArray(candidateInterviews) ? candidateInterviews : []),
            ...(Array.isArray(fallbackEntretiens) ? fallbackEntretiens : [])
        ]
            .filter((entretien) => this.matchesInterview(entretien, offreId, candidateKeys))
            .map((entretien) => Number(entretien?.score ?? entretien?.resultat?.score ?? 0))
            .filter((score) => Number.isFinite(score));

        if (!scores.length) {
            return null;
        }

        return Math.max(...scores);
    }

    private matchesInterview(entretien: any, offreId: number, candidateKeys: Set<string>): boolean {
        const entretienOffreId = Number(
            entretien?.offreId ?? entretien?.offre?.id ?? entretien?.offreEmploi?.id ?? entretien?.jobOfferId ?? 0
        );

        if (Number.isFinite(offreId) && offreId > 0 && entretienOffreId !== offreId) {
            return false;
        }

        const entretienCandidateKeys = this.getCandidateKeys(entretien);
        for (const key of candidateKeys) {
            if (entretienCandidateKeys.has(key)) {
                return true;
            }
        }

        return false;
    }

    private getCandidateKeys(source: any): Set<string> {
        const keys = new Set<string>();
        const id = Number(source?.candidatId ?? source?.candidat?.id ?? source?.candidat?.candidatId ?? 0);
        if (Number.isFinite(id) && id > 0) {
            keys.add(`id:${id}`);
        }

        const email = this.normalizeText(source?.email ?? source?.candidat?.email ?? '');
        if (email) {
            keys.add(`email:${email}`);
        }

        const label = this.normalizeText(this.getCandidatLabel(source));
        if (label) {
            keys.add(`name:${label}`);
        }

        return keys;
    }

    private normalizeSkills(value: any): string[] {
        if (!value) {
            return [];
        }

        const rawValues = Array.isArray(value)
            ? value
            : String(value).split(/[,;\n|\/]+/);

        return rawValues
            .map((item) => this.normalizeText(item))
            .filter((item) => !!item);
    }

    private skillMatches(requiredSkill: string, candidateSkills: string[]): boolean {
        const normalizedRequired = this.normalizeText(requiredSkill);
        return candidateSkills.some((skill) => {
            return skill === normalizedRequired || skill.includes(normalizedRequired) || normalizedRequired.includes(skill);
        });
    }

    private extractExperienceYears(value: any): number {
        if (!value) {
            return 0;
        }

        const segments = String(value)
            .split(/\n\s*\n|\r\n\s*\r\n/)
            .map((segment) => segment.trim())
            .filter((segment) => !!segment);

        const totalYears = segments.reduce((total, segment) => total + this.extractExperienceYearsFromSegment(segment), 0);
        return Math.max(0, Number(totalYears.toFixed(1)));
    }

    private extractExperienceYearsFromSegment(segment: string): number {
        const periodText = this.extractPeriodText(segment);
        if (!periodText) {
            return 0;
        }

        const normalized = periodText.toLowerCase().replace(/\s+/g, ' ').trim();

        const monthsMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:mois|months?)/i);
        if (monthsMatch?.[1]) {
            return Number.parseFloat(monthsMatch[1].replace(',', '.')) / 12;
        }

        const yearsMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:ans?|an|years?|yrs?)/i);
        if (yearsMatch?.[1]) {
            return Number.parseFloat(yearsMatch[1].replace(',', '.'));
        }

        const rangeMatch = normalized.match(/(?:de\s*)?(\d{4})(?:\/(\d{1,2}))?\s*(?:-|to|à|a|\/|jusqu['’]a)\s*(\d{4})(?:\/(\d{1,2}))?/i);
        if (rangeMatch?.[1] && rangeMatch?.[3]) {
            const startYear = Number(rangeMatch[1]);
            const endYear = Number(rangeMatch[3]);
            const startMonth = Number(rangeMatch[2] || 1) - 1;
            const endMonth = Number(rangeMatch[4] || 12) - 1;
            const startDate = new Date(startYear, startMonth, 1);
            const endDate = new Date(endYear, endMonth, 1);
            const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
            return Math.max(0, diffMonths / 12);
        }

        return 0;
    }

    private extractPeriodText(segment: string): string {
        const parenthesisMatch = segment.match(/\(([^)]+)\)/);
        if (parenthesisMatch?.[1]) {
            return parenthesisMatch[1].trim();
        }

        return segment;
    }

    private getOfferSkillsSource(offre: any): any {
        return offre?.competencesRequises || offre?.competences || offre?.skills || '';
    }

    private getCandidateKey(source: any): string {
        const id = Number(source?.candidatId ?? source?.candidat?.id ?? 0);
        if (Number.isFinite(id) && id > 0) {
            return `id:${id}`;
        }

        const email = this.normalizeText(source?.email ?? source?.candidat?.email ?? '');
        if (email) {
            return `email:${email}`;
        }

        return `name:${this.normalizeText(this.getCandidatLabel(source))}`;
    }

    private normalizeExperienceScore(experienceYears: number): number {
        const normalizedYears = Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0;
        return Math.min(100, Math.round((normalizedYears / 10) * 100));
    }

    private calculateFinalScore(scoreEntretien: number | null, scoreCompetence: number, scoreExperience: number): number {
        const interview = Number.isFinite(scoreEntretien ?? NaN) ? Number(scoreEntretien) : 0;
        return Math.round((interview * 0.5) + (scoreCompetence * 0.3) + (scoreExperience * 0.2));
    }

    private normalizeText(value: any): string {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private toDateInputValue(value: any): string {
        const d = new Date(value);
        if (isNaN(d.getTime())) { return ''; }
        const month = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }
}
