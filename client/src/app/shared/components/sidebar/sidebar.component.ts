import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent {
  menuItems = [
    { path: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
    { path: '/doctors-patient', icon: 'bi-people-fill', label: 'Patients' },
    { path: '/doctors', icon: 'bi-person-badge-fill', label: 'Doctors' },
    { path: '/appointments', icon: 'bi-calendar2-week-fill', label: 'Appointments' },
    { path: '/settings', icon: 'bi-gear-fill', label: 'Settings' }
  ];

  logout(): void {
    // Implement logout logic
    console.log('Logout clicked');
  }
}