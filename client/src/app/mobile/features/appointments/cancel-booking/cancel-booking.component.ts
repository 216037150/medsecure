import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CancelReason } from '../../../model/cancel-reason.model'; 

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-cancel-booking',
  imports: [CommonModule, FormsModule,  NavbarComponent, BackButtonComponent, RouterLink],
  templateUrl: './cancel-booking.component.html',
  styleUrls: ['./cancel-booking.component.css']
})
export class CancelBookingComponent {
  
 
  cancelReasons: CancelReason[] = [
    { id: 1, label: 'Rescheduling', selected: false },
    { id: 2, label: 'Weather Conditions', selected: false },
    { id: 3, label: 'Unexpected Work', selected: false },
    { id: 4, label: 'Others', selected: false }
  ];

  selectedReason: number | null = null;
  additionalReason: string = '';


  onReasonSelect(reason: CancelReason): void {
    this.cancelReasons.forEach(r => r.selected = r.id === reason.id);
  }

  onCancelAppointment(): void {
    if (!this.selectedReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    console.log('Appointment cancelled with reason:', {
      reasonId: this.selectedReason,
      additionalReason: this.additionalReason
    });
  }}
