import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FreelanceService, FreelanceEvent, Mission } from './services/freelance.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: FreelanceEvent[];
}

@Component({
  selector: 'app-freelance-scheduler',
  standalone: false,
  templateUrl: './freelance-scheduler.component.html'
})
export class FreelanceSchedulerComponent implements OnInit {

  // ── Calendar state ──────────────────────────────────────────────────
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  allEvents: FreelanceEvent[] = [];
  missions: Mission[] = [];

  // ── Selected day & detail panel ─────────────────────────────────────
  selectedDay: CalendarDay | null = null;
  selectedEvent: FreelanceEvent | null = null;

  // ── Create/Edit form ────────────────────────────────────────────────
  showForm = false;
  editingEvent: FreelanceEvent | null = null;
  formData = {
    title: '',
    description: '',
    type: 'MEETING' as string,
    startDate: '',
    endDate: '',
    missionId: null as number | null,
    participantId: null as number | null
  };

  eventTypes = [
    { value: 'INTERVIEW', label: '🎙️ Entretien', color: '#8b5cf6' },
    { value: 'DEADLINE', label: '⏰ Deadline', color: '#ef4444' },
    { value: 'MEETING', label: '🤝 Réunion', color: '#3b82f6' },
    { value: 'REVIEW', label: '📋 Revue', color: '#f59e0b' },
    { value: 'MILESTONE', label: '🏁 Jalon', color: '#10b981' }
  ];

  constructor(
    private freelanceService: FreelanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadMissions();
    this.buildCalendar();
  }

  // ── Data loading ────────────────────────────────────────────────────
  loadEvents(): void {
    this.freelanceService.getMyEvents().subscribe({
      next: events => {
        this.allEvents = events;
        this.buildCalendar();
      },
      error: () => this.allEvents = []
    });
  }

  loadMissions(): void {
    this.freelanceService.getMissions().subscribe({
      next: m => this.missions = m,
      error: () => this.missions = []
    });
  }

  // ── Calendar building ───────────────────────────────────────────────
  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based week: getDay() returns 0=Sun, we want 0=Mon
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalendarDay[] = [];
    const today = new Date();

    // Previous month filler days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.makeDay(d, false, today));
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.makeDay(date, true, today));
    }

    // Next month filler days (fill to 42 = 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push(this.makeDay(date, false, today));
    }

    this.calendarDays = days;
  }

  private makeDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    const dayStr = this.toDateStr(date);
    const events = this.allEvents.filter(e => {
      const eStart = e.startDate ? e.startDate.substring(0, 10) : '';
      return eStart === dayStr;
    });

    return { date, dayNumber: date.getDate(), isCurrentMonth, isToday, events };
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ── Navigation ──────────────────────────────────────────────────────
  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.buildCalendar();
  }

  get monthLabel(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // ── Day selection ───────────────────────────────────────────────────
  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
    this.selectedEvent = null;
  }

  selectEvent(event: FreelanceEvent): void {
    this.selectedEvent = event;
  }

  // ── Create/Edit form ────────────────────────────────────────────────
  openCreateForm(day?: CalendarDay): void {
    this.editingEvent = null;
    const dateStr = day ? this.toDateStr(day.date) : this.toDateStr(new Date());
    this.formData = {
      title: '',
      description: '',
      type: 'MEETING',
      startDate: dateStr + 'T09:00',
      endDate: dateStr + 'T10:00',
      missionId: null,
      participantId: null
    };
    this.showForm = true;
  }

  openEditForm(event: FreelanceEvent): void {
    this.editingEvent = event;
    this.formData = {
      title: event.title,
      description: event.description || '',
      type: event.type,
      startDate: event.startDate ? event.startDate.substring(0, 16) : '',
      endDate: event.endDate ? event.endDate.substring(0, 16) : '',
      missionId: event.missionId || null,
      participantId: event.participantId || null
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingEvent = null;
  }

  submitForm(): void {
    if (!this.formData.title || !this.formData.startDate || !this.formData.endDate) return;

    const payload: any = {
      title: this.formData.title,
      description: this.formData.description,
      type: this.formData.type,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      missionId: this.formData.missionId,
      participantId: this.formData.participantId
    };

    if (this.editingEvent) {
      this.freelanceService.updateEvent(this.editingEvent.id, payload).subscribe({
        next: () => { this.closeForm(); this.loadEvents(); },
        error: () => alert('Erreur lors de la mise à jour.')
      });
    } else {
      this.freelanceService.createEvent(payload).subscribe({
        next: () => { this.closeForm(); this.loadEvents(); },
        error: () => alert('Erreur lors de la création.')
      });
    }
  }

  // ── Status & Delete ─────────────────────────────────────────────────
  changeStatus(event: FreelanceEvent, status: string): void {
    this.freelanceService.updateEventStatus(event.id, status).subscribe({
      next: updated => {
        this.selectedEvent = updated;
        this.loadEvents();
      }
    });
  }

  deleteEvent(event: FreelanceEvent): void {
    this.freelanceService.deleteEvent(event.id).subscribe({
      next: () => {
        this.selectedEvent = null;
        this.loadEvents();
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  getEventColor(type: string): string {
    const t = this.eventTypes.find(et => et.value === type);
    return t ? t.color : '#6b7280';
  }

  getEventLabel(type: string): string {
    const t = this.eventTypes.find(et => et.value === type);
    return t ? t.label : type;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'SCHEDULED': '📅 Planifié',
      'CONFIRMED': '✅ Confirmé',
      'CANCELLED': '❌ Annulé',
      'COMPLETED': '🏆 Terminé'
    };
    return map[status] || status;
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  goBack(): void {
    this.router.navigate(['/freelance']);
  }
}
