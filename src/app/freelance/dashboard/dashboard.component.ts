import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModeService } from '../services/mode.service';
import { FreelanceApiService } from '../services/freelance-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  unitsBalance: number = 0;   // Will be loaded from backend

  constructor(
    private router: Router,
    private modeService: ModeService,
    private apiService: FreelanceApiService   // ← Added
  ) {}

  ngOnInit() {
    this.loadUnitsBalance();
  }

  // Load real units balance from Spring Boot
  loadUnitsBalance() {
    this.apiService.getUnitsBalance().subscribe({
      next: (balance: number) => {
        this.unitsBalance = balance;
      },
      error: (err) => {
        console.error('Failed to load units balance from backend', err);
        this.unitsBalance = 41; // fallback value
      }
    });
  }

  browseJobs() {
    this.router.navigate(['/freelance/jobs']);
  }

  goToUnits() {
    this.router.navigate(['/freelance/units']);
  }

  switchToClient() {
    this.modeService.switchMode('client');
    this.router.navigate(['/freelance/client/my-jobs']);
  }
}