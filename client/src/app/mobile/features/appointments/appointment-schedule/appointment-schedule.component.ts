import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Location } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { RouterLink } from '@angular/router';
import { AppointmentPatient, AppointmentService } from '../service/appointment.service';

type TabType = 'upcoming' | 'completed' | 'cancelled';

@Component({
  selector: 'app-appointment-schedule',
  standalone: true,
  imports: [NgFor, NgIf, NavbarComponent, BackButtonComponent, RouterLink],
  templateUrl: './appointment-schedule.component.html',
  styleUrls: ['./appointment-schedule.component.css']
})
export class AppointmentScheduleComponent implements OnInit {
  activeTab: TabType = 'upcoming';
  private tabHistory: TabType[] = ['upcoming'];
  appointments: AppointmentPatient[] = [];
  upcomingAppointments: AppointmentPatient[] = [];
  completedAppointments: AppointmentPatient[] = [];
  cancelledAppointments: AppointmentPatient[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private location: Location,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.error = null;
    
    // Get all appointments from db first for immediate display
    const localAppointments = this.appointmentService.getAllAppointments();
    console.log('Local appointments loaded:', localAppointments);
    console.log('Approved appointments count:', localAppointments.filter(a => a.status === 'Approved').length);
    console.log('Completed appointments count:', localAppointments.filter(a => a.status === 'Completed').length);
    console.log('Cancelled appointments count:', localAppointments.filter(a => ['Cancelled', 'Rejected'].includes(a.status)).length);
    
    if (localAppointments.length > 0) {
      this.appointments = localAppointments;
      this.categorizeAppointments();
      this.isLoading = false;
    }
    
    // Then subscribe to the appointments observable for any remote updates
    this.appointmentService.appointments$.subscribe({
      next: (appointments) => {
        console.log('Remote appointments loaded:', appointments);
        
        // Create a merged list that includes all appointment types
        const mergedAppointments = [...appointments];
        
        // Add any local appointments that might not be in remote data
        localAppointments.forEach(localApp => {
          if (!mergedAppointments.some(app => app.appointmentId === localApp.appointmentId)) {
            mergedAppointments.push(localApp);
          }
        });
        
        this.appointments = mergedAppointments;
        this.categorizeAppointments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.error = 'Failed to load appointments';
        this.isLoading = false;
      }
    });

    // Force a refresh to ensure we have the latest data
    this.appointmentService.refreshAppointments();
  }

  categorizeAppointments() {
    // Only show Approved in upcoming tab
    this.upcomingAppointments = this.appointments.filter(app => 
      app.status === 'Approved'
    ).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    
    // Only show Completed in completed tab
    this.completedAppointments = this.appointments.filter(app => 
      app.status === 'Completed'
    ).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    
    // Only show Cancelled and Rejected in cancelled tab (not Pending)
    this.cancelledAppointments = this.appointments.filter(app => 
      ['Cancelled', 'Rejected'].includes(app.status)
    ).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    
    console.log('Upcoming appointments (Approved only):', this.upcomingAppointments.length);
    console.log('Completed appointments:', this.completedAppointments.length);
    console.log('Cancelled appointments:', this.cancelledAppointments.length);
  }

  goBack(): void {
    if (this.tabHistory.length > 1) {
      this.tabHistory.pop();
      this.activeTab = this.tabHistory[this.tabHistory.length - 1];
    }
  }

  setActiveTab(tab: TabType): void {
    if (this.tabHistory[this.tabHistory.length - 1] !== tab) {
      this.tabHistory.push(tab);
    }
    this.activeTab = tab;
  }

  get filteredAppointments(): AppointmentPatient[] {
    switch (this.activeTab) {
      case 'upcoming':
        return this.upcomingAppointments;
      case 'completed':
        return this.completedAppointments;
      case 'cancelled':
        return this.cancelledAppointments;
      default:
        return [];
    }
  }

  get hasUpcomingAppointments(): boolean {
    return this.upcomingAppointments.length > 0;
  }

  get hasApprovedAppointments(): boolean {
    return this.upcomingAppointments.length > 0; // Same as hasUpcomingAppointments since we only show Approved now
  }

  get hasCompletedAppointments(): boolean {
    return this.completedAppointments.length > 0;
  }

  get hasCancelledAppointments(): boolean {
    return this.cancelledAppointments.length > 0;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return '#eab308';
      case 'Approved': return '#22c55e';
      case 'Rejected': return '#ef4444';
      case 'Completed': return '#199a8e';
      case 'Cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  }

  cancelAppointment(appointment: AppointmentPatient) {
    if (!appointment) return;

    this.isLoading = true;
    this.appointmentService.cancelAppointment(
      appointment.appointmentId,
      'Cancelled by patient'
    ).subscribe({
      next: () => {
        this.loadAppointments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        this.error = 'Failed to cancel appointment';
        this.isLoading = false;
      }
    });
  }
}

