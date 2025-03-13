// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { RecurringScheduleService, RecurringSchedule } from '../../services/recurring-schedule.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-recurring-schedule',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   template: `
//     <div class="recurring-schedule-container">
//       <div class="schedule-form">
//         <h3>Create Recurring Schedule</h3>
//         <form [formGroup]="scheduleForm" (ngSubmit)="createSchedule()">
//           <div class="date-range">
//             <div class="form-group">
//               <label for="startDate">Start Date</label>
//               <input type="date" id="startDate" formControlName="startDate" [min]="minDate">
//             </div>
//             <div class="form-group">
//               <label for="endDate">End Date</label>
//               <input type="date" id="endDate" formControlName="endDate" [min]="minDate">
//             </div>
//           </div>

//           <div class="time-range">
//             <div class="form-group">
//               <label for="startTime">Start Time</label>
//               <input type="time" id="startTime" formControlName="startTime">
//             </div>
//             <div class="form-group">
//               <label for="endTime">End Time</label>
//               <input type="time" id="endTime" formControlName="endTime">
//             </div>
//           </div>

//           <div class="weekdays">
//             <label>Select Days</label>
//             <div class="weekday-checkboxes">
//               <div *ngFor="let day of weekDays; let i = index" class="weekday-checkbox">
//                 <input type="checkbox" [id]="'day' + i" [formControlName]="'day' + i">
//                 <label [for]="'day' + i">{{day}}</label>
//               </div>
//             </div>
//           </div>

//           <div class="form-group">
//             <label for="slotDuration">Appointment Duration</label>
//             <select id="slotDuration" formControlName="slotDurationMinutes">
//               <option [value]="15">15 minutes</option>
//               <option [value]="30">30 minutes</option>
//               <option [value]="45">45 minutes</option>
//               <option [value]="60">60 minutes</option>
//             </select>
//           </div>

//           <button type="submit" [disabled]="scheduleForm.invalid || isSaving">
//             {{ isSaving ? 'Creating...' : 'Create Schedule' }}
//           </button>
//         </form>
//       </div>

//       <div class="active-schedules">
//         <h3>Active Recurring Schedules</h3>
//         <div class="schedules-list">
//           <div *ngFor="let schedule of activeSchedules" class="schedule-card">
//             <div class="schedule-info">
//               <div class="dates">
//                 <span>{{schedule.startDate | date}} - {{schedule.endDate | date}}</span>
//               </div>
//               <div class="times">
//                 <span>{{schedule.startTime}} - {{schedule.endTime}}</span>
//               </div>
//               <div class="days">
//                 <span>{{formatDaysOfWeek(schedule.daysOfWeek)}}</span>
//               </div>
//               <div class="duration">
//                 <span>{{schedule.slotDurationMinutes}} min slots</span>
//               </div>
//             </div>
//             <button class="delete-btn" (click)="deleteSchedule(schedule.id)">
//               <i class="bi bi-trash"></i>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .recurring-schedule-container {
//       padding: 20px;
//       max-width: 800px;
//       margin: 0 auto;
//     }

//     .schedule-form {
//       background: white;
//       padding: 24px;
//       border-radius: 12px;
//       box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//       margin-bottom: 24px;
//     }

//     h3 {
//       margin: 0 0 20px;
//       color: #333;
//     }

//     .date-range, .time-range {
//       display: grid;
//       grid-template-columns: 1fr 1fr;
//       gap: 16px;
//       margin-bottom: 20px;
//     }

//     .form-group {
//       margin-bottom: 16px;
//     }

//     label {
//       display: block;
//       margin-bottom: 8px;
//       color: #555;
//     }

//     input[type="date"],
//     input[type="time"],
//     select {
//       width: 100%;
//       padding: 8px 12px;
//       border: 1px solid #ddd;
//       border-radius: 6px;
//       font-size: 14px;
//     }

//     .weekdays {
//       margin-bottom: 20px;
//     }

//     .weekday-checkboxes {
//       display: flex;
//       flex-wrap: wrap;
//       gap: 12px;
//       margin-top: 8px;
//     }

//     .weekday-checkbox {
//       display: flex;
//       align-items: center;
//       gap: 4px;
//     }

//     button {
//       width: 100%;
//       padding: 12px;
//       background: #007bff;
//       color: white;
//       border: none;
//       border-radius: 6px;
//       cursor: pointer;
//       font-size: 16px;
//       transition: background 0.3s;
//     }

//     button:hover:not(:disabled) {
//       background: #0056b3;
//     }

//     button:disabled {
//       background: #ccc;
//       cursor: not-allowed;
//     }

//     .active-schedules {
//       background: white;
//       padding: 24px;
//       border-radius: 12px;
//       box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//     }

//     .schedules-list {
//       display: flex;
//       flex-direction: column;
//       gap: 16px;
//     }

//     .schedule-card {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 16px;
//       background: #f8f9fa;
//       border-radius: 8px;
//       border-left: 4px solid #007bff;
//     }

//     .schedule-info {
//       display: flex;
//       flex-direction: column;
//       gap: 4px;
//     }

//     .delete-btn {
//       width: auto;
//       padding: 8px;
//       background: transparent;
//       color: #dc3545;
//     }

//     .delete-btn:hover {
//       background: #fee;
//     }
//   `]
// })
// export class RecurringScheduleComponent implements OnInit, OnDestroy {
//   weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//   scheduleForm: FormGroup;
//   activeSchedules: RecurringSchedule[] = [];
//   isSaving = false;
//   minDate: string;
//   private subscriptions: Subscription[] = [];

//   constructor(
//     private formBuilder: FormBuilder,
//     private scheduleService: RecurringScheduleService
//   ) {
//     const today = new Date();
//     this.minDate = today.toISOString().split('T')[0];

//     this.scheduleForm = this.formBuilder.group({
//       startDate: ['', Validators.required],
//       endDate: ['', Validators.required],
//       startTime: ['09:00', Validators.required],
//       endTime: ['17:00', Validators.required],
//       slotDurationMinutes: [30, [Validators.required, Validators.min(15), Validators.max(60)]],
//       day0: [false],
//       day1: [false],
//       day2: [false],
//       day3: [false],
//       day4: [false],
//       day5: [false],
//       day6: [false]
//     });
//   }

//   ngOnInit() {
//     this.subscriptions.push(
//       this.scheduleService.getSchedules().subscribe(schedules => {
//         this.activeSchedules = schedules;
//       })
//     );
//   }

//   ngOnDestroy() {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   createSchedule() {
//     if (this.scheduleForm.invalid) return;

//     const formValue = this.scheduleForm.value;
//     const selectedDays = this.weekDays
//       .map((_, i) => formValue[`day${i}`] ? i : -1)
//       .filter(i => i !== -1)
//       .join(',');

//     if (!selectedDays) {
//       alert('Please select at least one day of the week');
//       return;
//     }

//     this.isSaving = true;
//     this.scheduleService.createSchedule({
//       startDate: formValue.startDate,
//       endDate: formValue.endDate,
//       daysOfWeek: selectedDays,
//       startTime: formValue.startTime,
//       endTime: formValue.endTime,
//       slotDurationMinutes: formValue.slotDurationMinutes
//     }).subscribe({
//       next: () => {
//         this.isSaving = false;
//         this.scheduleForm.reset({
//           startTime: '09:00',
//           endTime: '17:00',
//           slotDurationMinutes: 30
//         });
//       },
//       error: (error) => {
//         this.isSaving = false;
//         alert(error.message || 'Failed to create schedule');
//       }
//     });
//   }

//   deleteSchedule(scheduleId: string) {
//     if (confirm('Are you sure you want to delete this recurring schedule?')) {
//       this.scheduleService.deactivateSchedule(scheduleId).subscribe({
//         error: (error) => alert(error.message || 'Failed to delete schedule')
//       });
//     }
//   }

//   formatDaysOfWeek(daysOfWeek: string): string {
//     return daysOfWeek.split(',')
//       .map(d => this.weekDays[parseInt(d, 10)])
//       .join(', ');
//   }
// }