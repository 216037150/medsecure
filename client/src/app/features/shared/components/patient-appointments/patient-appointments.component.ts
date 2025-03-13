import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { Observable, of } from 'rxjs';

interface PendingAppointment extends Appointment {
  isRejecting?: boolean;
  rejectionReason?: string;
}

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="patient-appointments-container">
      <div class="section-header">
        <h3>Appointment Requests</h3>
        <div class="filters">
          <button 
            class="filter-chip" 
            [class.active]="currentFilter === 'pending'" 
            (click)="setFilter('pending')">
            Pending
          </button>
          <button 
            class="filter-chip" 
            [class.active]="currentFilter === 'approved'" 
            (click)="setFilter('approved')">
            Approved
          </button>
          <button 
            class="filter-chip" 
            [class.active]="currentFilter === 'rejected'" 
            (click)="setFilter('rejected')">
            Rejected
          </button>
        </div>
      </div>

      <div class="appointments-list">
        <ng-container *ngIf="pendingAppointments.length > 0; else noAppointments">
          <div class="appointment-card" *ngFor="let appointment of filteredAppointments">
            <div class="card-header">
              <div class="patient-info">
                <h4>{{ appointment.patientName }}</h4>
                <span class="appointment-type">{{ appointment.reasonForVisit }}</span>
              </div>
              <div class="status-badge" [ngClass]="{
                'pending': appointment.status === 'Pending',
                'approved': appointment.status === 'Approved',
                'rejected': appointment.status === 'Rejected'
              }">
                {{ getStatusLabel(appointment) }}
              </div>
            </div>

            <div class="card-body">
              <div class="appointment-details">
                <div class="detail-item">
                  <i class="bi bi-calendar-event"></i>
                  <span>{{ formatDate(appointment.appointmentDate) }}</span>
                </div>
                <div class="detail-item">
                  <i class="bi bi-clock"></i>
                  <span>{{ appointment.appointmentTime }} ({{ appointment.durationMinutes }} min)</span>
                </div>
                <div class="detail-item" *ngIf="appointment.doctorNotes">
                  <i class="bi bi-chat-left-text"></i>
                  <span>{{ appointment.doctorNotes }}</span>
                </div>
              </div>

              <div class="rejection-form" *ngIf="appointment.isRejecting">
                <label for="rejection-reason">Rejection reason:</label>
                <textarea 
                  id="rejection-reason" 
                  class="rejection-input" 
                  rows="3"
                  [(ngModel)]="appointment.rejectionReason"
                  placeholder="Please provide a reason for rejecting this appointment...">
                </textarea>
                <div class="form-actions">
                  <button class="cancel-btn" (click)="cancelRejection(appointment)">Cancel</button>
                  <button 
                    class="confirm-btn" 
                    [disabled]="!appointment.rejectionReason?.trim()"
                    (click)="confirmRejection(appointment)">
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>

            <div class="card-actions" *ngIf="appointment.status === 'Pending'">
              <button class="approve-btn" (click)="approveAppointment(appointment)">
                <i class="bi bi-check-circle"></i> Approve
              </button>
              <button class="reject-btn" (click)="initiateRejection(appointment)">
                <i class="bi bi-x-circle"></i> Reject
              </button>
            </div>
          </div>
        </ng-container>

        <ng-template #noAppointments>
          <div class="no-appointments">
            <i class="bi bi-calendar-x empty-icon"></i>
            <h4>No {{ currentFilter }} appointment requests</h4>
            <p *ngIf="currentFilter === 'pending'">
              When patients request appointments, they'll appear here for your approval.
            </p>
            <p *ngIf="currentFilter === 'approved'">
              You haven't approved any patient appointment requests yet.
            </p>
            <p *ngIf="currentFilter === 'rejected'">
              You haven't rejected any patient appointment requests yet.
            </p>
          </div>
        </ng-template>
      </div>

      <!-- Pagination (if needed) -->
      <div class="pagination-controls" *ngIf="pendingAppointments.length > itemsPerPage">
        <button 
          class="pagination-btn" 
          [disabled]="currentPage === 1"
          (click)="previousPage()">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          class="pagination-btn" 
          [disabled]="currentPage === totalPages"
          (click)="nextPage()">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .patient-appointments-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .filters {
      display: flex;
      gap: 8px;
    }

    .filter-chip {
      padding: 6px 12px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      background: var(--bg-white);
      color: var(--text-secondary);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-chip:hover {
      background: var(--bg-light);
    }

    .filter-chip.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .appointment-card {
      background: var(--bg-white);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .appointment-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .patient-info h4 {
      margin: 0 0 4px;
      font-weight: 600;
      font-size: 16px;
      color: var(--text-primary);
    }

    .appointment-type {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .status-badge {
      padding: 6px 12px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 16px;
    }

    .status-badge.pending {
      background: #FEF9C3;
      color: #A16207;
    }

    .status-badge.approved {
      background: #DCFCE7;
      color: #166534;
    }

    .status-badge.rejected {
      background: #FEE2E2;
      color: #B91C1C;
    }

    .card-body {
      padding: 16px;
    }

    .appointment-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .detail-item i {
      font-size: 16px;
      color: var(--text-secondary);
      margin-top: 3px;
    }

    .rejection-form {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .rejection-form label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .rejection-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      resize: none;
      margin-bottom: 12px;
      transition: border-color 0.2s ease;
    }

    .rejection-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(25, 154, 142, 0.1);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .card-actions {
      display: flex;
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      gap: 8px;
    }

    .approve-btn,
    .reject-btn,
    .confirm-btn,
    .cancel-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .approve-btn {
      background: var(--primary-color);
      color: white;
      flex: 1;
    }

    .approve-btn:hover {
      background: var(--primary-color-80);
    }

    .reject-btn {
      background: #FEF2F2;
      color: #B91C1C;
      flex: 1;
    }

    .reject-btn:hover {
      background: #FECACA;
    }

    .cancel-btn {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .cancel-btn:hover {
      background: var(--bg-light);
    }

    .confirm-btn {
      background: #B91C1C;
      color: white;
    }

    .confirm-btn:hover:not(:disabled) {
      background: #991B1B;
    }

    .confirm-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-appointments {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      opacity: 0.7;
    }

    .no-appointments h4 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .no-appointments p {
      color: var(--text-secondary);
      max-width: 400px;
      margin: 0;
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
    }

    .pagination-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-white);
      color: var(--text-primary);
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: var(--bg-light);
      color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 14px;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .status-badge {
        align-self: flex-start;
      }

      .card-actions {
        flex-direction: column;
      }

      .filter-chip {
        padding: 4px 10px;
        font-size: 13px;
      }
    }
  `]
})
export class PatientAppointmentsComponent implements OnInit {
  @Output() approve = new EventEmitter<Appointment>();
  @Output() reject = new EventEmitter<{appointment: Appointment, reason: string}>();

  pendingAppointments: PendingAppointment[] = [];
  filteredAppointments: PendingAppointment[] = [];
  currentFilter: 'pending' | 'approved' | 'rejected' = 'pending';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  constructor(private appointmentsService: AppointmentsService) {}

  ngOnInit() {
    this.loadPendingAppointments();
  }

  private loadPendingAppointments() {
    this.appointmentsService.getAppointments().subscribe({
      next: (appointments) => {
        this.pendingAppointments = appointments.filter(app => !app.isDoctorAvailabilitySlot);
        this.filterAppointments();
        this.updatePagination();
      },
      error: (error) => {
        console.error('Error loading pending appointments:', error);
        this.pendingAppointments = [];
        this.filteredAppointments = [];
      }
    });
  }

  filterAppointments() {
    switch (this.currentFilter) {
      case 'pending':
        this.filteredAppointments = this.pendingAppointments.filter(app => app.status === 'Pending');
        break;
      case 'approved':
        this.filteredAppointments = this.pendingAppointments.filter(app => app.status === 'Approved');
        break;
      case 'rejected':
        this.filteredAppointments = this.pendingAppointments.filter(app => app.status === 'Rejected');
        break;
    }

    // Pagination
    this.currentPage = 1;
    this.updatePagination();
  }

  setFilter(filter: 'pending' | 'approved' | 'rejected') {
    this.currentFilter = filter;
    this.filterAppointments();
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredAppointments.length / this.itemsPerPage));
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredAppointments.length);
    this.filteredAppointments = this.filteredAppointments.slice(0, this.filteredAppointments.length);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  approveAppointment(appointment: PendingAppointment) {
    // Use the AppointmentService to update the status
    this.appointmentsService.approveAppointment(
      appointment.appointmentId, 
      'Approved by doctor'
    ).subscribe({
      next: (updatedAppointment) => {
        // Update local state with the server response
        const index = this.pendingAppointments.findIndex(
          app => app.appointmentId === appointment.appointmentId
        );
        if (index !== -1) {
          this.pendingAppointments[index] = {
            ...updatedAppointment,
            isRejecting: false,
            rejectionReason: undefined
          };
        }
        this.filterAppointments();
      },
      error: (error) => {
        console.error('Error approving appointment:', error);
      }
    });
  }

  initiateRejection(appointment: PendingAppointment) {
    appointment.isRejecting = true;
    appointment.rejectionReason = '';
  }

  cancelRejection(appointment: PendingAppointment) {
    appointment.isRejecting = false;
    appointment.rejectionReason = undefined;
  }

  confirmRejection(appointment: PendingAppointment) {
    if (!appointment.rejectionReason?.trim()) return;
    
    // Use the AppointmentService to update the status
    this.appointmentsService.rejectAppointment(
      appointment.appointmentId, 
      appointment.rejectionReason
    ).subscribe({
      next: (updatedAppointment) => {
        // Update local state with the server response
        const index = this.pendingAppointments.findIndex(
          app => app.appointmentId === appointment.appointmentId
        );
        if (index !== -1) {
          this.pendingAppointments[index] = {
            ...updatedAppointment,
            isRejecting: false,
            rejectionReason: undefined
          };
        }
        this.filterAppointments();
      },
      error: (error) => {
        console.error('Error rejecting appointment:', error);
      }
    });
  }

  getStatusLabel(appointment: Appointment): string {
    switch (appointment.status) {
      case 'Pending': return 'Pending';
      case 'Approved': return 'Approved';
      case 'Rejected': return 'Rejected';
      default: return appointment.status;
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}