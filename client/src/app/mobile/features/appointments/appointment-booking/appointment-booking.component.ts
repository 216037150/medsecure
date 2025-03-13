import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  WritableSignal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import {
  AppointmentService,
  AppointmentPatient,
  Doctor,
  DoctorSchedule,
} from '../service/appointment.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AppointmentType,
  AvailabilityType,
  DoctorPatient,
  DoctorType,
  UserType,
} from '../../../../type';
import { Db } from '../../../../db';

// Interface for slots grouped by date
interface DateGroup {
  date: string;
  slots: AvailabilityType[];
}

interface DaySchedule {
  hasSlots: boolean;
  startTime: string;
  endTime: string;
  availableSlots: number;
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  templateUrl: './appointment-booking.component.html',
  styleUrls: ['./appointment-booking.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BackButtonComponent,
    NavbarComponent,
  ],
})
export class AppointmentBookingComponent implements OnInit, OnDestroy {
  // Properties for doctor selection
  selectedDoctorId: string | null = null;
  showTableView = false;
  isFirstLoad = true;
  
  // Properties for date groups and dropdowns
  groupedAvailability: DateGroup[] = [];
  openDateGroups: boolean[] = [];
  isLoading = false;
  
  // Existing properties
  selectedDoctor: Doctor | null = null;
  selectedDate: Date = new Date();
  selectedSlot: AppointmentPatient | null = null;
  availableSlots: AppointmentPatient[] = [];
  datePickerOpen = false;
  calendarDates: Date[] = [];
  viewMonth: Date = new Date();
  showModal = false;
  medicalConcern = '';
  bookingSuccess = false;
  bookingError = '';

  // Weekly schedule section
  showWeeklySchedule = false;
  weeklySchedule: DaySchedule[] = [];
  doctorSchedules: DoctorSchedule[] = [];
  fetchingSchedules = false;

  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  dateLabels: { date: Date; day: string; dateNum: number }[] = [];

  private destroy$ = new Subject<void>();

  //================>

  myDoctors: WritableSignal<UserType[]> = signal<UserType[]>([]);
  db: Db = inject(Db);
  doctorAvailability: WritableSignal<AvailabilityType[]> = signal<
    AvailabilityType[]
  >([]);

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.findMyDoctors();
    this.isFirstLoad = true;
  }

  toggleDoctorAvailability(doctor_id: string): void {
    this.isFirstLoad = false;
    
    // If clicking the same doctor, close the availability view
    if (this.selectedDoctorId === doctor_id) {
      this.selectedDoctorId = null;
      this.groupedAvailability = [];
      this.doctorAvailability.set([]);
      return;
    }
    
    // Otherwise, fetch and show the availability
    this.onViewDoctorAvailability(doctor_id);
  }

  onViewDoctorAvailability(doctor_id: string): void {
    this.isLoading = true;
    this.selectedDoctorId = doctor_id;
    this.isFirstLoad = false;
    
    console.log(`Fetching availability for doctor ID: ${doctor_id}`);
    
    // Get all availability data
    const allAvailability = this.db.availabilityTable();
    
    // Filter availability by doctor ID
    let availability: AvailabilityType[] = allAvailability
      .filter((val) => val.doctor_id === doctor_id);
    
    // Sort availability by date and time
    availability.sort((a, b) => {
      // First compare dates
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are the same, compare start times
      return a.start_time.localeCompare(b.start_time);
    });
    
    // Group availability by date
    this.groupAvailabilityByDate(availability);
    
    // Set the selected doctor information
    const doctorInfo = this.db.userTable().find(user => user.id === doctor_id);
    if (doctorInfo) {
      console.log(`Viewing availability for Dr. ${doctorInfo.firstname} ${doctorInfo.lastname}`);
    }
    
    // Update the availability signal
    this.doctorAvailability.set(availability);
    this.isLoading = false;
  }

  // Group availability slots by date
  groupAvailabilityByDate(slots: AvailabilityType[]): void {
    const grouped: { [date: string]: AvailabilityType[] } = {};
    
    // Group slots by date
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    
    // Convert to array format for template
    this.groupedAvailability = Object.keys(grouped).map(date => ({
      date,
      slots: grouped[date]
    }));
    
    // Initialize open state for each date group
    this.openDateGroups = this.groupedAvailability.map((_, index) => index === 0); // Open first group by default
  }

  // Toggle date group dropdown
  toggleDateGroup(index: number): void {
    this.openDateGroups[index] = !this.openDateGroups[index];
  }

  // Format date for header display
  formatDateHeader(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Format time for display (e.g., "2:30 PM")
  formatTime(timeString: string): string {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  isTimeSlotAvailable(doctorId: string, date: string, startTime: string): boolean {
    // Check if there's already an appointment for this doctor, date, and time
    const existingAppointment = this.db.appointmentTable().find(
      app => app.doctor_id === doctorId && 
             app.date === date && 
             app.time === startTime
    );
    
    return !existingAppointment;
  }

  findMyDoctors() {
    let doctorPatients: DoctorPatient[] = this.db
      .doctorPatientTable()
      .filter((val) => val.patient_id == this.db.current_patient()?.id);

    let myDoctors: UserType[] = [];

    for (let i = 0; i < doctorPatients.length; i++) {
      for (let x = 0; x < this.db.userTable().length; x++) {
        if (doctorPatients[i].doctor_id == this.db.userTable()[x].id) {
          myDoctors.push(this.db.userTable()[x]);
        }
      }
    }

    let d: UserType[] = [...new Set(myDoctors)];
    this.myDoctors.set(d);
  }

  bookAppointment(val: AvailabilityType) {
    let appointment: AppointmentType = {
      id: this.db.generateId(),
      date: val.date,
      time: val.start_time,
      doctor_id: val.doctor_id,
      patient_id: this.db.current_patient()?.id || '',
      status: 'Pending',
      patientName: `${this.db.current_patient()?.firstname} ${this.db.current_patient()?.lastname}`
    };

    let existing: AppointmentType | undefined = this.db
      .appointmentTable()
      .find(
        (app) =>
          app.doctor_id == appointment.doctor_id &&
          appointment.patient_id &&
          app.date == appointment.date &&
          app.time == appointment.time
      );

    if (!existing) {
      this.db.addAppointment(appointment);
      // Show success message or notification
      this.bookingSuccess = true;
      // Update availability display
      this.onViewDoctorAvailability(val.doctor_id);
      
      // Reset success message after delay
      setTimeout(() => {
        this.bookingSuccess = false;
      }, 3000);
      
      return;
    }
    
    this.bookingError = 'You already have an appointment at this time.';
    setTimeout(() => {
      this.bookingError = '';
    }, 3000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
