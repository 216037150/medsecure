// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
// import { AppointmentFormComponent } from '../appointment-form/appointment-form.component';
// import { DoctorScheduleService, DoctorSchedule } from '../../services/doctor-schedule.service';
// import { AppointmentsService, Appointment } from '../../services/appointments.service';
// import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
// import { Subscription, firstValueFrom } from 'rxjs';

// interface CalendarDay {
//   date: Date;
//   isOtherMonth: boolean;
//   isToday: boolean;
//   hasAppointments: boolean;
//   appointments: Appointment[];
//   availableSlots: number;
//   bookedSlots: number;
// }

// @Component({
//   selector: 'app-schedule-management',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, AppointmentFormComponent, ConfirmModalComponent],
//   templateUrl: './schedule-management.component.html',
//   styleUrls: ['./schedule-management.component.css']
// })
// export class ScheduleManagementComponent implements OnInit, OnDestroy {
//   weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
//   calendarDays: CalendarDay[] = [];
//   currentDate = new Date();
//   selectedDate: Date | null = null;
//   selectedDateAppointments: Appointment[] = [];
//   showAppointmentForm = false;
//   isSaving = false;
//   saveSuccess = false;
//   saveError: string | null = null;
//   minDate: string;
//   lastUpdateDate = new Date();
  
//   scheduleForm: FormGroup;
//   availableStartTimes: string[] = [];
//   availableEndTimes: string[] = [];
//   activeSchedules: DoctorSchedule[] = [];
  
//   validationError: string | null = null;
  
//   private subscriptions: Subscription[] = [];
//   hasWeekdayError = false;

//   showDeleteModal = false;
//   scheduleToDelete: DoctorSchedule | null = null;
//   appointmentToDelete: Appointment | null = null;

//   constructor(
//     private formBuilder: FormBuilder,
//     private scheduleService: DoctorScheduleService,
//     private appointmentsService: AppointmentsService
//   ) {
//     const today = new Date();
//     this.minDate = today.toISOString().split('T')[0];
    
//     // Initialize form with default values and validators - now with multiple day selection
//     this.scheduleForm = this.formBuilder.group({
//       selectedDays: this.formBuilder.group({
//         day0: [false], // Sunday
//         day1: [false],
//         day2: [false],
//         day3: [false],
//         day4: [false],
//         day5: [false],
//         day6: [false]  // Saturday
//       }),
//       startTime: ['09:00', [Validators.required]],
//       endTime: ['17:00', [Validators.required]],
//       slotDurationMinutes: [30, [Validators.required, Validators.min(15), Validators.max(60)]]
//     });
//   }

//   ngOnInit() {
//     this.loadSchedules();
//     this.generateCalendar();
//     this.initializeTimeSlots();

//     // Subscribe to appointments for calendar view
//     this.subscriptions.push(
//       this.appointmentsService.getAppointments().subscribe({
//         next: (appointments) => {
//           this.updateCalendarWithAppointments(appointments);
//           if (this.selectedDate) {
//             this.updateSelectedDateAppointments(appointments);
//           }
//         },
//         error: (error) => {
//           console.error('Error loading appointments:', error);
//           this.showError('Failed to load appointments');
//         }
//       })
//     );
//   }

//   ngOnDestroy() {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   // Helper method to create an initial appointment with the selected date
//   createInitialAppointment(): Appointment {
//     if (!this.selectedDate) return {} as Appointment;
    
//     const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
//     // Format date to ISO string for the date input (YYYY-MM-DD)
//     const dateString = this.selectedDate.toISOString().split('T')[0];
    
//     return {
//       appointmentId: Date.now().toString(),
//       doctorId: userInfo.doctorId || 'doc-123',
//       doctorName: userInfo.name || undefined,
//       patientId: undefined,
//       patientName: undefined,
//       appointmentDate: this.selectedDate,
//       appointmentTime: '09:00', // Default time
//       durationMinutes: 30, // Default duration
//       reasonForVisit: 'Available Time Slot',
//       status: 'Available',
//       doctorNotes: '',
//       isDoctorAvailabilitySlot: true
//     };
//   }

//   private loadSchedules() {
//     console.log('Loading doctor schedules...');
//     this.subscriptions.push(
//       this.scheduleService.loadDoctorSchedules().subscribe({
//         next: (schedules) => {
//           console.log('Received schedules:', schedules);
//           this.activeSchedules = schedules.filter(s => s.isActive);
//           console.log('Active schedules:', this.activeSchedules);
          
//           // Also load appointments to update calendar
//           this.appointmentsService.loadAppointments().subscribe({
//             next: (appointments) => {
//               console.log('Loaded appointments after schedule update:', appointments);
//               this.updateCalendarWithAppointments(appointments);
//             },
//             error: (err) => console.error('Error loading appointments after schedule update:', err)
//           });
//         },
//         error: (error) => {
//           console.error('Error loading schedules:', error);
//           this.showError('Failed to load schedules');
//         }
//       })
//     );
//   }

//   async createSchedule() {
//     if (this.scheduleForm.invalid) {
//       Object.keys(this.scheduleForm.controls).forEach(key => {
//         const control = this.scheduleForm.get(key);
//         control?.markAsTouched();
//       });
      
//       this.showError('Please fill in all required fields');
//       return;
//     }

//     const formValue = this.scheduleForm.value;
//     const selectedDaysGroup = formValue.selectedDays;
    
//     // Get selected days indices
//     const selectedDayIndices = Object.keys(selectedDaysGroup)
//       .filter(key => selectedDaysGroup[key])
//       .map(key => parseInt(key.replace('day', '')));
    
//     if (selectedDayIndices.length === 0) {
//       this.hasWeekdayError = true;
//       this.showError('Please select at least one day of the week');
//       return;
//     }
//     this.hasWeekdayError = false;

//     // Validate time slots
//     if (!this.scheduleService.validateTimeSlots(formValue.startTime, formValue.endTime, formValue.slotDurationMinutes)) {
//       this.showError('Invalid time slot configuration');
//       return;
//     }

//     this.isSaving = true;
//     console.log('Creating schedules for days:', selectedDayIndices);
    
//     try {
//       // Create schedules one by one and store the created schedules
//       const createdSchedules: DoctorSchedule[] = [];
      
//       for (const dayIndex of selectedDayIndices) {
//         console.log('Creating schedule for day:', dayIndex);
//         try {
//           const createdSchedule = await firstValueFrom(this.scheduleService.createSchedule(
//             dayIndex,
//             formValue.startTime,
//             formValue.endTime, 
//             formValue.slotDurationMinutes
//           ));
          
//           if (createdSchedule) {
//             createdSchedules.push(createdSchedule);
//             console.log('Schedule created successfully for day', dayIndex, createdSchedule);
//           }
//         } catch (err) {
//           console.error(`Error creating schedule for day ${dayIndex}:`, err);
//           // Continue with other days even if one fails
//         }
//       }
      
//       console.log('All schedules created successfully:', createdSchedules);
      
//       if (createdSchedules.length > 0) {
//         this.showSuccess();
//         this.lastUpdateDate = new Date();
        
//         // Immediately update the activeSchedules directly with the newly created ones
//         this.activeSchedules = [...this.activeSchedules, ...createdSchedules.filter(s => s.isActive)];
        
//         // Reset the form's day selections after successful creation
//         const dayControls = (this.scheduleForm.get('selectedDays') as FormGroup).controls;
//         Object.keys(dayControls).forEach(key => {
//           dayControls[key].setValue(false);
//         });
//       } else {
//         this.showError('Failed to create any schedules');
//       }
      
//       // Refresh schedules from the backend to ensure we have the latest data
//       const schedules = await firstValueFrom(this.scheduleService.loadDoctorSchedules());
//       this.activeSchedules = schedules.filter(s => s.isActive);
//       console.log('Updated active schedules from backend:', this.activeSchedules);
      
//       // Update calendar with appointments
//       const appointments = await firstValueFrom(this.appointmentsService.loadAppointments());
//       console.log('Appointments loaded after creating schedules:', appointments);
//       this.updateCalendarWithAppointments(appointments);
      
//     } catch (error: any) {
//       console.error('Error in schedule creation process:', error);
//       this.showError(error.message || 'Failed to create schedules');
//     } finally {
//       this.isSaving = false;
//     }
//   }

//   closeTimeSlots() {
//     this.selectedDate = null;
//     this.showAppointmentForm = false;
//     this.saveError = null;
//     this.validationError = null;
//   }

//   showDeleteConfirmation(schedule: DoctorSchedule) {
//     this.scheduleToDelete = schedule;
//     this.showDeleteModal = true;
//   }

//   onDeleteConfirmed() {
//     if (this.scheduleToDelete) {
//       const scheduleId = this.scheduleToDelete.id?.toString() || this.scheduleToDelete.scheduleId || '';
//       this.deleteSchedule(scheduleId);
//     } else if (this.appointmentToDelete) {
//       this.appointmentsService.deleteAppointmentSlot(this.appointmentToDelete.appointmentId)
//         .subscribe({
//           next: () => {
//             this.loadAppointments();
//             this.lastUpdateDate = new Date();
//             this.showSuccess();
//           },
//           error: (error) => {
//             console.error('Error deleting appointment:', error);
//             this.showError('Failed to delete appointment');
//           }
//         });
//     }
//     this.resetDeleteModal();
//   }

//   onDeleteCancelled() {
//     this.resetDeleteModal();
//   }

//   private resetDeleteModal() {
//     this.showDeleteModal = false;
//     this.scheduleToDelete = null;
//     this.appointmentToDelete = null;
//   }

//   deleteSchedule(scheduleId: string) {
//     console.log('Attempting to delete schedule with ID:', scheduleId);
    
//     if (!scheduleId) {
//       this.showError('Cannot delete schedule: No valid schedule ID provided');
//       return;
//     }
    
//     const scheduleToDelete = this.activeSchedules.find(s => 
//       (s.id?.toString() === scheduleId) || (s.scheduleId === scheduleId)
//     );
    
//     console.log('Full schedule object to delete:', scheduleToDelete);
    
//     if (!scheduleToDelete) {
//       this.showError('Cannot delete schedule: Schedule not found');
//       return;
//     }
    
//     this.isSaving = true; // Show loading indicator
    
//     this.scheduleService.deactivateSchedule(scheduleId).subscribe({
//       next: () => {
//         console.log('Successfully deleted schedule with ID:', scheduleId);
//         // Immediately update the UI by removing the deleted schedule
//         this.activeSchedules = this.activeSchedules.filter(schedule => 
//           (schedule.id?.toString() !== scheduleId) && (schedule.scheduleId !== scheduleId)
//         );
        
//         this.showSuccess();
//         this.lastUpdateDate = new Date();
        
//         // Also refresh schedules from the backend
//         this.scheduleService.loadDoctorSchedules().subscribe({
//           next: (schedules) => {
//             console.log('Schedules refreshed after deletion:', schedules);
//             // Update local state with the most recent data
//             this.activeSchedules = schedules.filter(s => s.isActive);
//           },
//           error: (err) => console.error('Error refreshing schedules after deletion:', err)
//         });
        
//         // Refresh appointments to update the calendar
//         this.appointmentsService.loadAppointments().subscribe({
//           next: (appointments) => {
//             console.log('Appointments loaded after deleting schedule:', appointments);
//             this.updateCalendarWithAppointments(appointments);
//           },
//           error: (err) => console.error('Error loading appointments after deleting schedule:', err)
//         });
//       },
//       error: (error) => {
//         console.error('Error deleting schedule:', error);
//         this.showError(error.message || 'Failed to delete schedule');
//       },
//       complete: () => {
//         this.isSaving = false; // Hide loading indicator
//       }
//     });
//   }

//   updateSchedule(schedule: DoctorSchedule) {
//     const scheduleId = schedule.id?.toString() || schedule.scheduleId;
    
//     if (!scheduleId) {
//       this.showError('Cannot update schedule: No valid schedule ID found');
//       return;
//     }
    
//     const updates: Partial<DoctorSchedule> = {
//       startTime: schedule.startTime,
//       endTime: schedule.endTime,
//       slotDurationMinutes: schedule.slotDurationMinutes
//     };

//     console.log(`Updating schedule with ID: ${scheduleId}`, updates);
    
//     this.isSaving = true;
//     this.scheduleService.updateSchedule(scheduleId, updates).subscribe({
//       next: (updatedSchedule) => {
//         console.log('Schedule updated successfully:', updatedSchedule);
        
//         // Immediately update the UI by replacing the updated schedule in the array
//         this.activeSchedules = this.activeSchedules.map(s => {
//           // Match by either id or scheduleId
//           if ((s.id?.toString() === scheduleId) || (s.scheduleId === scheduleId)) {
//             return updatedSchedule;
//           }
//           return s;
//         });
        
//         this.showSuccess();
//         this.lastUpdateDate = new Date();
        
//         // Also refresh data from backend to ensure we have the most up-to-date state
//         this.scheduleService.loadDoctorSchedules().subscribe({
//           next: (schedules) => {
//             console.log('Schedules refreshed after update:', schedules);
//             this.activeSchedules = schedules.filter(s => s.isActive);
//           },
//           error: (err) => console.error('Error refreshing schedules after update:', err)
//         });
        
//         // Refresh appointments for calendar view
//         this.appointmentsService.loadAppointments().subscribe({
//           next: (appointments) => {
//             console.log('Appointments loaded after updating schedule:', appointments);
//             this.updateCalendarWithAppointments(appointments);
//           },
//           error: (err) => console.error('Error loading appointments after update:', err)
//         });
//       },
//       error: (error) => {
//         console.error('Error updating schedule:', error);
//         this.showError('Failed to update schedule');
//       },
//       complete: () => {
//         this.isSaving = false;
//       }
//     });
//   }

//   private generateCalendar() {
//     const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
//     const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    
//     // Get the first Sunday before or on the first day of the month
//     const startDate = new Date(firstDay);
//     startDate.setDate(startDate.getDate() - startDate.getDay());
    
//     // Get the last Saturday after or on the last day of the month
//     const endDate = new Date(lastDay);
//     endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
//     const days: CalendarDay[] = [];
//     const today = new Date();
//     let currentDate = new Date(startDate);
    
//     while (currentDate <= endDate) {
//       days.push({
//         date: new Date(currentDate),
//         isOtherMonth: currentDate.getMonth() !== this.currentDate.getMonth(),
//         isToday: currentDate.toDateString() === today.toDateString(),
//         hasAppointments: false,
//         appointments: [],
//         availableSlots: 0,
//         bookedSlots: 0
//       });
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
    
//     this.calendarDays = days;
//   }

//   private updateCalendarWithAppointments(appointments: Appointment[]) {
//     this.calendarDays = this.calendarDays.map(day => {
//       const dayAppointments = appointments.filter(app => 
//         new Date(app.appointmentDate).toDateString() === day.date.toDateString()
//       );
      
//       return {
//         ...day,
//         hasAppointments: dayAppointments.length > 0,
//         appointments: dayAppointments,
//         availableSlots: dayAppointments.filter(app => app.status === 'Available').length,
//         bookedSlots: dayAppointments.filter(app => app.status !== 'Available').length
//       };
//     });
//   }

//   private updateSelectedDateAppointments(appointments: Appointment[]) {
//     if (!this.selectedDate) return;
    
//     this.selectedDateAppointments = appointments
//       .filter(app => new Date(app.appointmentDate).toDateString() === this.selectedDate?.toDateString())
//       .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
//   }

//   private loadAppointments() {
//     this.subscriptions.push(
//       this.appointmentsService.getAppointments().subscribe({
//         next: (appointments) => {
//           this.updateCalendarWithAppointments(appointments);
//           if (this.selectedDate) {
//             this.updateSelectedDateAppointments(appointments);
//           }
//         },
//         error: (error) => {
//           console.error('Error loading appointments:', error);
//           this.showError('Failed to load appointments');
//         }
//       })
//     );
//   }

//   previousMonth() {
//     this.currentDate = new Date(
//       this.currentDate.getFullYear(),
//       this.currentDate.getMonth() - 1,
//       1
//     );
//     this.generateCalendar();
//     this.loadAppointments();
//   }

//   nextMonth() {
//     this.currentDate = new Date(
//       this.currentDate.getFullYear(),
//       this.currentDate.getMonth() + 1,
//       1
//     );
//     this.generateCalendar();
//     this.loadAppointments();
//   }

//   selectDate(date: Date) {
//     this.selectedDate = date;
//     this.showAppointmentForm = true;
//     this.updateSelectedDateAppointments(
//       this.appointmentsService.getCurrentAppointments()
//     );
//   }

//   isSelectedDate(date: Date): boolean {
//     return this.selectedDate?.toDateString() === date.toDateString();
//   }

//   private initializeTimeSlots() {
//     const timeSlots = this.scheduleService.getAvailableTimeSlots();
//     this.availableStartTimes = timeSlots;
//     this.availableEndTimes = timeSlots;
//   }

//   formatTime(time: string): string {
//     return this.scheduleService.formatTimeForDisplay(time);
//   }

//   saveAppointment(appointment: Appointment) {
//     this.isSaving = true;
//     this.appointmentsService.createDoctorAvailabilitySlot(
//       appointment.doctorId,
//       appointment.appointmentDate,
//       appointment.appointmentTime,
//       appointment.durationMinutes
//     ).subscribe({
//       next: () => {
//         this.showSuccess();
//         this.lastUpdateDate = new Date(); // Update the last update date
//         this.loadAppointments();
//         this.showAppointmentForm = false;
//       },
//       error: (error) => {
//         console.error('Error saving appointment:', error);
//         this.showError('Failed to save appointment');
//       },
//       complete: () => {
//         this.isSaving = false;
//       }
//     });
//   }

//   deleteAppointment(appointment: Appointment) {
//     this.appointmentToDelete = appointment;
//     this.showDeleteModal = true;
//   }

//   cancelAppointmentForm() {
//     this.showAppointmentForm = false;
//   }

//   private showSuccess() {
//     this.saveSuccess = true;
//     this.saveError = null;
//     setTimeout(() => {
//       this.saveSuccess = false;
//     }, 3000);
//   }

//   private showError(message: string) {
//     this.saveError = message;
//     this.saveSuccess = false;
//     setTimeout(() => {
//       this.saveError = null;
//     }, 3000);
//   }

//   validateSchedule(formValue: any): boolean {
//     const date = new Date(formValue.date);
//     const schedules = this.scheduleService.getCurrentSchedules();
//     return this.scheduleService.isTimeSlotAvailable(date.getDay(), formValue.startTime);
//   }

//   // Helper method to format date in readable format
//   formatDate(date: Date): string {
//     return date.toLocaleString('en-US', { 
//       month: 'short', 
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   }
// }