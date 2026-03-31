import { Component, ViewChild, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../api.service";
import {
    ChartComponent,
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexYAxis,
    ApexDataLabels,
    ApexTitleSubtitle,
    ApexStroke,
    ApexGrid,
    NgApexchartsModule
} from "ng-apexcharts";

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    yaxis: ApexYAxis;
    xaxis: ApexXAxis;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    colors: any;
    stroke: ApexStroke;
    title: ApexTitleSubtitle;
};

@Component({
    selector: 'app-c-dashboard',
    standalone: false,
    templateUrl: './c-dashboard.component.html',
    styleUrls: ['./c-dashboard.component.scss']
})
export class CDashboardComponent implements OnInit {

    @ViewChild("chart") chart: ChartComponent | undefined;
    public chartOptions: Partial<ChartOptions>;
    
    // Interview properties
    entretiens: any[] = [];
    currentCandidatId: number | null = null;
    selectedInterview: any = null;
    interviewQuestions: any[] = [];
    answers: { [questionId: number]: any } = {};
    selectedChoices: { [choiceId: number]: boolean } = {};
    latestResult: any = null;

    constructor(
        private apiService: ApiService,
        private route: ActivatedRoute,
    ) {
        this.chartOptions = {
            series: [
                {
                    name: "Views",
                    data: [0, 41, 35, 51, 49, 62, 69, 91, 148]
                }
            ],
            chart: {
                height: 350,
                type: "line",
                zoom: {
                    enabled: false
                },
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: [
                "#1cbe72"
            ],
            stroke: {
                curve: "straight"
            },
            grid: {
                show: true,
                strokeDashArray: 5,
                borderColor: "#e0e6e9",
                row: {
                    colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
                    opacity: 0.5
                }
            },
            xaxis: {
                categories: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep"
                ],
                labels: {
                    style: {
                        colors: "#62646A",
                        fontSize: "15px"
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#62646A",
                        fontSize: "15px"
                    }
                },
                axisBorder: {
                    show: false
                }
            }
        };
    }

    ngOnInit(): void {
        this.getCurrentCandidat();
        this.loadInterviews();
    }

    getCurrentCandidat(): void {
        // Try to get candidat ID from localStorage
        const storedCandidatId = localStorage.getItem('candidatId');
        if (storedCandidatId) {
            const parsedId = Number(storedCandidatId);
            if (!isNaN(parsedId) && parsedId > 0) {
                this.currentCandidatId = parsedId;
                console.log('✅ Candidat ID récupéré depuis localStorage:', this.currentCandidatId);
                return;
            }
        }
        
        // If not found, use a fallback ID or load from API if needed
        console.warn('⚠️ Candidat ID non trouvé dans localStorage');
        this.currentCandidatId = null;
    }

    loadInterviews(): void {
        // Charger tous les entretiens de type TEST (visibles par tous)
        this.apiService.getEntretiens().subscribe({
            next: (allEntretiens: any[]) => {
                const testEntretiens = Array.isArray(allEntretiens) 
                    ? allEntretiens.filter(e => e.type === 'TEST' || e.categorie === 'TEST')
                    : [];
                
                if (!this.currentCandidatId || this.currentCandidatId <= 0) {
                    // Si pas de candidat, afficher uniquement les TEST
                    this.entretiens = testEntretiens;
                    console.log('📋 Entretiens TEST chargés (pas de candidat):', this.entretiens);
                    this.tryOpenTestFromQuery();
                } else {
                    // Charger aussi les entretiens spécifiques au candidat
                    this.apiService.getEntretiensByCandidat(this.currentCandidatId).subscribe({
                        next: (candidatEntretiens: any[]) => {
                            const candidatInterviews = Array.isArray(candidatEntretiens) ? candidatEntretiens : [];
                            // Fusionner et éliminer les doublons par ID
                            const merged = [...candidatInterviews, ...testEntretiens];
                            const uniqueMap = new Map();
                            merged.forEach(e => {
                                if (!uniqueMap.has(e.id)) {
                                    uniqueMap.set(e.id, e);
                                }
                            });
                            this.entretiens = Array.from(uniqueMap.values());
                            console.log('📋 Entretiens candidat + TEST chargés:', this.entretiens);
                            this.tryOpenTestFromQuery();
                        },
                        error: (error) => {
                            console.error('Erreur chargement entretiens candidat', error);
                            // Afficher au moins les TEST
                            this.entretiens = testEntretiens;
                            this.tryOpenTestFromQuery();
                        }
                    });
                }
            },
            error: (error) => {
                console.error('Erreur chargement entretiens', error);
                this.entretiens = [];
            }
        });
    }

    private tryOpenTestFromQuery(): void {
        const raw = this.route.snapshot.queryParamMap.get('testId');
        if (!raw) {
            return;
        }
        const id = Number(raw);
        if (isNaN(id) || id <= 0) {
            return;
        }
        const ent = this.entretiens.find((e) => e.id === id);
        if (ent) {
            this.startInterview(ent);
        }
    }

    startInterview(entretien: any): void {
        // Commence l'entretien et affiche les questions.
        this.viewQuestions(entretien);
    }

    viewQuestions(entretien: any): void {
        this.selectedInterview = entretien;
        this.interviewQuestions = [];
        this.answers = {};
        this.selectedChoices = {};

        // Charger les questions liées à l'entretien
        this.apiService.getQuestionsByEntretien(entretien.id).subscribe({
            next: (questions: any[]) => {
                this.interviewQuestions = Array.isArray(questions) ? questions : [];
                console.log('📋 Questions chargées:', this.interviewQuestions);
            },
            error: (error) => {
                console.error('Erreur chargement questions', error);
                alert('Erreur lors du chargement des questions');
                this.selectedInterview = null;
            }
        });
    }

    closeInterview(): void {
        this.selectedInterview = null;
        this.interviewQuestions = [];
        this.answers = {};
        this.selectedChoices = {};
    }

    submitAnswers(): void {
        if (!this.selectedInterview) return;

        // Préparer les réponses
        const userResponses: any[] = [];
        
        for (const question of this.interviewQuestions) {
            if (question.type === 'QCU') {
                const selectedChoice = this.answers[question.id];
                if (selectedChoice) {
                    userResponses.push({
                        questionId: question.id,
                        choixId: selectedChoice,
                        candidatId: this.currentCandidatId,
                        entretienId: this.selectedInterview?.id
                    });
                }
            } else if (question.type === 'QCM') {
                const selectedChoiceIds = Object.keys(this.selectedChoices)
                    .filter(choiceId => this.selectedChoices[choiceId as any])
                    .map(Number);
                if (selectedChoiceIds.length > 0) {
                    selectedChoiceIds.forEach(choiceId => {
                        userResponses.push({
                            questionId: question.id,
                            choixId: choiceId,
                            candidatId: this.currentCandidatId,
                            entretienId: this.selectedInterview?.id
                        });
                    });
                }
            } else if (question.type === 'VRAI_FAUX') {
                const answer = this.answers[question.id];
                if (answer !== undefined) {
                    userResponses.push({
                        questionId: question.id,
                        reponse: answer,
                        candidatId: this.currentCandidatId,
                        entretienId: this.selectedInterview?.id
                    });
                }
            }
        }

        if (!this.currentCandidatId) {
            alert('Identifiant du candidat manquant. Merci de vous reconnecter.');
            return;
        }

        // Soumettre les réponses
        this.apiService.submitEntretienReposes(this.selectedInterview.id, userResponses).subscribe({
            next: (result: any) => {
                this.latestResult = result;
                alert(`Entretien soumis avec succès! Score: ${result.score?.toFixed(2)}%, décision: ${result.decision}`);
                console.log('Résultat:', result);
                this.closeInterview();
                this.loadInterviews();
            },
            error: (error) => {
                console.error('Erreur soumission entretien', error);
                alert('Erreur lors de la soumission de l\'entretien');
            }
        });
    }

}

