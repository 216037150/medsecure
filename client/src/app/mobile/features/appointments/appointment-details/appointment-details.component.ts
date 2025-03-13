import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentPatient, AppointmentService } from '../service/appointment.service';
import { BackButtonComponent } from "../../shared/back-button/back-button.component";
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, RouterLink, NavbarComponent],
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.css']
})
export class AppointmentDetails implements OnInit {
  appointment: AppointmentPatient | null = null;
  doctorImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Mask%20group-ADQ5qIcUBxrq7579C7xyRng7wHXK2p.png';
  isLoading = false;
  error: string | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAppointment();
  }

  public loadAppointment() {
    this.appointment = this.appointmentService.getCurrentAppointment();
    if (!this.appointment) {
      this.router.navigate(['/appointment-booking']);
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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
      case 'Cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  }

  cancelAppointment() {
    if (!this.appointment) return;

    this.isLoading = true;
    this.appointmentService.cancelAppointment(
      this.appointment.appointmentId,
      'Cancelled by patient'
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/schedule']);
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        this.error = 'Failed to cancel appointment. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
