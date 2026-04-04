import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ModeService, UserMode } from '../services/mode.service';

@Component({
  selector: 'app-freelance-layout',
  templateUrl: './freelance-layout.component.html',
  styleUrls: ['./freelance-layout.component.scss'],
  imports: [RouterOutlet]
})
export class FreelanceLayoutComponent implements OnInit {
[x: string]: any;

  currentMode: UserMode = 'freelancer';

  constructor(
    private modeService: ModeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.modeService.currentMode$.subscribe((mode: UserMode) => {
      this.currentMode = mode;
    });
  }

  showNotifications() {
    console.log('Notifications clicked');
    alert('Notifications - coming soon');
  }

  showProfileMenu() {
    console.log('Profile menu clicked');
    alert('Profile menu - coming soon');
  }

  switchToFreelancer() {
    this.modeService.switchMode('freelancer');
    this.router.navigate(['/freelance/dashboard']);
  }

  switchToClient() {
    this.modeService.switchMode('client');
    this.router.navigate(['/freelance/client/my-jobs']);
  }
}