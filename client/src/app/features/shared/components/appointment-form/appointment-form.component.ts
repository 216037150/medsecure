import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Appointment } from '../../services/appointments.service';
import { DoctorScheduleService } from '../../services/doctor-schedule.service';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="appointment-form-container">
      <h2 class="form-title">{{ isEditMode ? 'Edit Appointment' : 'Create Availability' }}</h2>
      
      <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()">
        <div class="form-group" *ngIf="!isCreatingAvailability">
          <label for="patientName">Patient Name</label>
          <input 
            type="text" 
            id="patientName" 
            formControlName="patientName" 
            class="form-control"
            [attr.disabled]="isCreatingAvailability">
          <div *ngIf="f['patientName'].touched && f['patientName'].errors" class="error-message">
            <span *ngIf="f['patientName'].errors?.['required']">Patient name is required</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="appointmentDate">Date</label>
          <input 
            type="date" 
            id="appointmentDate" 
            formControlName="appointmentDate" 
            class="form-control"
            [min]="minDate">
          <div *ngIf="f['appointmentDate'].touched && f['appointmentDate'].errors" class="error-message">
            <span *ngIf="f['appointmentDate'].errors?.['required']">Date is required</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="appointmentTime">Time</label>
          <div class="time-slots-grid">
            <button 
              *ngFor="let slot of availableTimeSlots" 
              type="button"
              class="time-slot-btn"
              [class.selected]="isSelectedTimeSlot(slot)"
              [class.unavailable]="!isTimeSlotAvailable(slot)"
              [disabled]="!isTimeSlotAvailable(slot) && !isSelectedTimeSlot(slot)"
              (click)="selectTimeSlot(slot)">
              {{ formatTimeForDisplay(slot) }}
            </button>
          </div>
          <div *ngIf="f['appointmentTime'].touched && f['appointmentTime'].errors" class="error-message">
            <span *ngIf="f['appointmentTime'].errors?.['required']">Time slot is required</span>
          </div>
        </div>

        <div class="form-group">
          <label for="durationMinutes">Duration</label>
          <select 
            id="durationMinutes" 
            formControlName="durationMinutes" 
            class="form-control">
            <option [value]="15">15 minutes</option>
            <option [value]="30">30 minutes</option>
            <option [value]="45">45 minutes</option>
            <option [value]="60">60 minutes</option>
          </select>
        </div>
        
        <div class="form-group" *ngIf="!isCreatingAvailability">
          <label for="reasonForVisit">Appointment Type</label>
          <select id="reasonForVisit" formControlName="reasonForVisit" class="form-control">
            <option value="">Select type</option>
            <option value="Consultation">Consultation</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Check-up">Check-up</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Other">Other</option>
          </select>
          <div *ngIf="f['reasonForVisit'].touched && f['reasonForVisit'].errors" class="error-message">
            <span *ngIf="f['reasonForVisit'].errors?.['required']">Appointment type is required</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="doctorNotes">Notes (optional)</label>
          <textarea 
            id="doctorNotes" 
            formControlName="doctorNotes" 
            class="form-control" 
            rows="3">
          </textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="cancel-btn" (click)="onCancel()">Cancel</button>
          <button 
            type="submit" 
            class="submit-btn" 
            [disabled]="appointmentForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .appointment-form-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .form-title {
      margin-top: 0;
      margin-bottom: 24px;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(25, 154, 142, 0.1);
    }
    
    .form-control:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    
    .error-message {
      color: var(--status-cancelled);
      font-size: 12px;
      margin-top: 4px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    .cancel-btn {
      padding: 10px 16px;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-secondary);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .cancel-btn:hover {
      background: var(--bg-light);
      color: var(--text-primary);
    }
    
    .submit-btn {
      padding: 10px 20px;
      background: var(--primary-color);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .submit-btn:hover:not(:disabled) {
      background: var(--primary-color-80);
    }
    
    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .time-slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    
    .time-slot-btn {
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-white);
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      text-align: center;
    }
    
    .time-slot-btn:hover:not(:disabled) {
      border-color: var(--primary-color);
      background: var(--bg-icon-light);
    }
    
    .time-slot-btn.selected {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
    
    .time-slot-btn.unavailable {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .time-slot-btn:disabled {
      cursor: not-allowed;
    }
  `]
})
export class AppointmentFormComponent implements OnInit {
  @Input() appointment: Appointment | null = null;
  @Input() isCreatingAvailability = false;
  @Output() save = new EventEmitter<Appointment>();
  @Output() cancel = new EventEmitter<void>();

  appointmentForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  minDate: string;
  availableTimeSlots: string[] = [];
  
  constructor(
    private formBuilder: FormBuilder,
    private scheduleService: DoctorScheduleService
  ) {
    // Set min date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    // Initialize form
    this.appointmentForm = this.formBuilder.group({
      patientName: ['', this.isCreatingAvailability ? [] : [Validators.required]],
      patientId: [''],
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      durationMinutes: [30, Validators.required],
      reasonForVisit: ['', this.isCreatingAvailability ? [] : [Validators.required]],
      doctorNotes: ['']
    });
  }

  ngOnInit(): void {
    this.availableTimeSlots = this.scheduleService.getAvailableTimeSlots();
    
    // Setup for editing if appointment is provided
    if (this.appointment) {
      this.setupForEditing(this.appointment);
    }
    
    // Listen for date changes to update available time slots
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.updateAvailableTimeSlots(new Date(date));
      }
    });
  }

  setupForEditing(appointment: Appointment): void {
    this.isEditMode = true;
    const dateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    
    this.appointmentForm.patchValue({
      patientName: appointment.patientName || '',
      patientId: appointment.patientId || '',
      appointmentDate: dateStr,
      appointmentTime: appointment.appointmentTime,
      durationMinutes: appointment.durationMinutes,
      reasonForVisit: appointment.reasonForVisit || '',
      doctorNotes: appointment.doctorNotes || ''
    });
    
    this.updateAvailableTimeSlots(new Date(dateStr));
  }

  private updateAvailableTimeSlots(date: Date): void {
    // Get available slots for the selected date
    this.availableTimeSlots = this.scheduleService.getAvailableTimeSlots();
    
    // Filter out past time slots if the date is today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();
      
      this.availableTimeSlots = this.availableTimeSlots.filter(slot => {
        const [hours, minutes] = slot.split(':').map(Number);
        return hours > currentHour || (hours === currentHour && minutes > currentMinutes);
      });
    }

    // When editing, include the current time slot even if it's taken
    if (this.isEditMode) {
      const currentTime = this.appointmentForm.get('appointmentTime')?.value;
      if (currentTime && !this.availableTimeSlots.includes(currentTime)) {
        this.availableTimeSlots = [...this.availableTimeSlots, currentTime].sort();
      }
    }
  }

  isTimeSlotAvailable(timeSlot: string): boolean {
    const dateValue = this.appointmentForm.get('appointmentDate')?.value;
    if (!dateValue) return true;
    
    const date = new Date(dateValue);
    return this.scheduleService.isTimeSlotAvailable(date.getDay(), timeSlot);
  }

  formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  isSelectedTimeSlot(slot: string): boolean {
    return this.appointmentForm.get('appointmentTime')?.value === slot;
  }

  selectTimeSlot(slot: string): void {
    if (this.isTimeSlotAvailable(slot) || this.isSelectedTimeSlot(slot)) {
      this.appointmentForm.patchValue({ appointmentTime: slot });
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) return;
    
    this.isSubmitting = true;
    const formValues = this.appointmentForm.value;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const appointment: Appointment = {
      appointmentId: this.isEditMode && this.appointment ? 
        this.appointment.appointmentId : 
        Date.now().toString(),
      doctorId: userInfo.doctorId || 'doc-123',
      doctorName: userInfo.name || undefined,
      patientId: formValues.patientId || undefined,
      patientName: formValues.patientName || undefined,
      appointmentDate: new Date(formValues.appointmentDate),
      appointmentTime: formValues.appointmentTime,
      durationMinutes: formValues.durationMinutes,
      reasonForVisit: formValues.reasonForVisit || 'Available Time Slot',
      status: this.isCreatingAvailability ? 'Available' : 'Pending',
      doctorNotes: formValues.doctorNotes || '',
      isDoctorAvailabilitySlot: this.isCreatingAvailability
    };
    
    this.save.emit(appointment);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get f() { 
    return this.appointmentForm.controls; 
  }
}