import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorScheduleService } from '../../services/doctor-schedule.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    DoctorScheduleService
  ]
})
export class ScheduleManagementModule { }