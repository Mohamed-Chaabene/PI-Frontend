import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../api.service';
import { SharedModule } from '../../shared/shared.module';

interface CandidateEntretien {
  id: number;
  titre?: string;
  description?: string;
  type?: string;
  categorie?: string;
  domaine?: string;
  dateEntretien?: string;
  photo?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-candidate-entretiens-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModule],
  templateUrl: './candidate-entretiens-page.component.html',
  styleUrls: ['./candidate-entretiens-page.component.scss']
})
export class CandidateEntretiensPageComponent {
  private readonly attemptStoragePrefix = 'entretienAttempted_';
  entretiens: CandidateEntretien[] = [];
  upcomingEntretiens: CandidateEntretien[] = [];
  loading = true;
  errorMessage = '';
  showCalendar = true;
  currentCalendarDate = new Date();
  calendarWeeks: Array<Array<{ date: Date; inCurrentMonth: boolean; isToday: boolean; hasEntretien: boolean; entretienCount: number }>> = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCandidateEntretiens();
  }

  private loadCandidateEntretiens(): void {
    this.loading = true;
    this.errorMessage = '';

    const email = this.resolveCurrentUserEmail();
    if (!email) {
      this.loading = false;
      this.errorMessage = 'Session invalide. Veuillez vous reconnecter.';
      return;
    }

    this.apiService.getCandidateByEmail(email).subscribe({
      next: (candidate: any) => {
        const candidatId = Number(candidate?.id);
        if (!Number.isFinite(candidatId) || candidatId <= 0) {
          this.loading = false;
          this.errorMessage = 'Profil candidat introuvable.';
          return;
        }

        localStorage.setItem('candidatId', String(candidatId));
        this.fetchEntretiens(candidatId);
      },
      error: () => {
        // Fallback to local/token id resolution for compatibility.
        const fallbackId = this.resolveCandidatId();
        if (!fallbackId) {
          this.loading = false;
          this.errorMessage = 'Impossible de charger votre profil candidat.';
          return;
        }
        this.fetchEntretiens(fallbackId);
      }
    });
  }

  private fetchEntretiens(candidatId: number): void {
    this.apiService.getEntretiensByCandidat(candidatId).subscribe({
      next: (data: CandidateEntretien[]) => {
        const raw = Array.isArray(data) ? data : [];
        this.entretiens = raw.filter((item) => !this.isTestEntretien(item));
        this.upcomingEntretiens = this.entretiens
          .filter((item) => this.isUpcoming(item))
          .sort((left, right) => this.getEntretienTime(left) - this.getEntretienTime(right));
        this.buildCalendar();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos entretiens pour le moment.';
        this.loading = false;
      }
    });
  }

  private resolveCurrentUserEmail(): string {
    const stored = String(localStorage.getItem('userEmail') || '').trim();
    if (stored) {
      return stored;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return '';
    }

    try {
      const decoded: any = jwtDecode(token);
      return String(decoded?.email || decoded?.sub || '').trim();
    } catch {
      return '';
    }
  }

  private resolveCandidatId(): number | null {
    const local = Number(localStorage.getItem('candidatId'));
    if (!isNaN(local) && local > 0) {
      return local;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      const id = Number(decoded?.candidatId || decoded?.id || decoded?.userId || decoded?.sub);
      if (!isNaN(id) && id > 0) {
        localStorage.setItem('candidatId', String(id));
        return id;
      }
    } catch {
      return null;
    }

    return null;
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Date a definir';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleString('fr-FR');
  }

  getPhoto(item: CandidateEntretien): string {
    return (item.photo || '').trim() || 'images/banner/banner1.jpg';
  }

  get currentMonthLabel(): string {
    return this.currentCalendarDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }

  previousMonth(): void {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
  }

  nextMonth(): void {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  buildCalendar(): void {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    const cells: Array<{ date: Date; inCurrentMonth: boolean; isToday: boolean; hasEntretien: boolean; entretienCount: number }> = [];

    for (let index = startOffset; index > 0; index--) {
      const date = new Date(year, month, 1 - index);
      cells.push(this.createCalendarCell(date, false));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      cells.push(this.createCalendarCell(date, true));
    }

    while (cells.length % 7 !== 0) {
      const date = new Date(year, month, daysInMonth + (cells.length - startOffset - daysInMonth) + 1);
      cells.push(this.createCalendarCell(date, false));
    }

    this.calendarWeeks = [];
    for (let index = 0; index < cells.length; index += 7) {
      this.calendarWeeks.push(cells.slice(index, index + 7));
    }
  }

  private createCalendarCell(date: Date, inCurrentMonth: boolean) {
    const entretienCount = this.getEntretiensForDate(date).length;
    return {
      date,
      inCurrentMonth,
      isToday: this.isSameDay(date, new Date()),
      hasEntretien: entretienCount > 0,
      entretienCount
    };
  }

  getEntretiensForDate(date: Date): CandidateEntretien[] {
    return this.entretiens.filter((item) => this.isSameDay(this.parseEntretienDate(item.dateEntretien), date));
  }

  private parseEntretienDate(value?: string): Date {
    if (!value) {
      return new Date('');
    }

    const parsed = new Date(value);
    return parsed;
  }

  private getEntretienTime(item: CandidateEntretien): number {
    const parsed = this.parseEntretienDate(item.dateEntretien);
    return parsed.getTime();
  }

  private isUpcoming(item: CandidateEntretien): boolean {
    const time = this.getEntretienTime(item);
    return Number.isFinite(time) && time >= Date.now();
  }

  private isSameDay(left: Date, right: Date): boolean {
    return left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate();
  }

  private isTestEntretien(item: CandidateEntretien): boolean {
    const type = String(item?.type || '').toUpperCase();
    const categorie = String(item?.categorie || '').toUpperCase();
    return type === 'TEST' || categorie === 'TEST';
  }

  private parseInterviewDateOnly(item: CandidateEntretien): Date | null {
    const parsed = this.parseEntretienDate(item.dateEntretien);
    if (!Number.isFinite(parsed.getTime())) {
      return null;
    }
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private getTodayDateOnly(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  hasAttempted(item: CandidateEntretien): boolean {
    if (!item?.id) {
      return false;
    }
    return localStorage.getItem(`${this.attemptStoragePrefix}${item.id}`) === '1';
  }

  isPassAllowedToday(item: CandidateEntretien): boolean {
    const interviewDay = this.parseInterviewDateOnly(item);
    if (!interviewDay) {
      return false;
    }
    return interviewDay.getTime() === this.getTodayDateOnly().getTime();
  }

  isPassButtonDisabled(item: CandidateEntretien): boolean {
    return !!item.completed || this.hasAttempted(item) || !this.isPassAllowedToday(item);
  }

  getPassButtonLabel(item: CandidateEntretien): string {
    if (item.completed || this.hasAttempted(item)) {
      return 'Entretien deja passe';
    }

    if (!this.isPassAllowedToday(item)) {
      return 'Disponible le jour de l entretien';
    }

    return 'Passer l\'entretien';
  }

  passEntretien(item: CandidateEntretien): void {
    if (this.isPassButtonDisabled(item)) {
      return;
    }
    this.router.navigate(['/entretiens/test', item.id]);
  }

  trackByEntretien(index: number, item: CandidateEntretien): number {
    return item?.id ?? index;
  }
}
