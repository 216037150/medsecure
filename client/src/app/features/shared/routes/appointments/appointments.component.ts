import { Component, OnInit, OnDestroy, inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppointmentFormComponent } from '../../components/appointment-form/appointment-form.component';
import {
  AppointmentsService,
  Appointment,
} from '../../services/appointments.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { Db } from '../../../../db';
import { AppointmentType, AvailabilityType, AppointmentStatusType } from '../../../../type';
import { SecuraService } from '../../../../secura.service';

interface AppointmentGroup {
  date: string;
  appointments: AppointmentType[];
}

interface AvailabilityGroup {
  date: string;
  slots: AvailabilityType[];
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    // AppointmentFormComponent
  ],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  // Data collections
  appointments: Appointment[] = [];
  filteredAppointments: WritableSignal<AppointmentType[]> = signal<AppointmentType[]>([]);
  availableSlots: Appointment[] = [];
  groupedAvailableSlots: { [date: string]: Appointment[] } = {};
  groupedAppointments: WritableSignal<AppointmentGroup[]> = signal<AppointmentGroup[]>([]);
  groupedAvailability: WritableSignal<AvailabilityGroup[]> = signal<AvailabilityGroup[]>([]);
  
  // Track open date groups
  openDateGroups: Set<string> = new Set();
  openAppointmentDateGroups: Set<string> = new Set();

  public db: Db = inject(Db);
  public securaService: SecuraService = inject(SecuraService);
  public appointmentsData: WritableSignal<AppointmentType[]> = signal<AppointmentType[]>([]);
  
  // UI state
  selectedAppointment: Appointment | null = null;
  isEditingAppointment = false;
  isCreatingAppointment = false;
  showAvailableSlotsModal = false;
  isLoading = true;
  error: string | null = null;

  // Filters
  searchTerm = '';
  filter: AppointmentStatusType | 'all' = 'all';
  slotFilterDate: string = '';
  
  // Appointment filters and sorting
  appointmentViewFilter: 'all' | 'today' | 'upcoming' | 'past' = 'all';
  appointmentSortOrder: 'newest' | 'oldest' = 'newest';

  //Set Availability
  startTime = '';
  endTime = '';
  availabilityDate = '';

  // Modal state
  showSetAvailabilityModal = false;
  showViewAvailabilityModal = false;

  // Subscriptions
  private searchSubject = new Subject<string>();
  private appointmentsSub: Subscription | null = null;
  private searchSub: Subscription | null = null;

  constructor(
    private appointmentsService: AppointmentsService,
    private router: Router,
    private authService: AuthService
  ) {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.applyFilters();
      });
  }

  ngOnInit() {
    this.loadAppointments();
    this.loadAvailability();
    
    // Open the first date group by default
    setTimeout(() => {
      const groups = this.groupedAppointments();
      if (groups.length > 0) {
        this.openAppointmentDateGroups.add(groups[0].date);
      }
      
      const availGroups = this.groupedAvailability();
      if (availGroups.length > 0) {
        this.openDateGroups.add(availGroups[0].date);
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.appointmentsSub) {
      this.appointmentsSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  private loadAppointments() {
    const id = this.db.current_doctor()?.id + '';
    this.appointmentsData.set(this.securaService.doctorAppoitments(id));
    this.filterAppointments();
  }
  
  private loadAvailability() {
    this.groupAvailabilityByDate();
  }

  private groupAvailabilityByDate() {
    const availabilityData = this.db.availabilityTable();
    const groupedData: { [key: string]: AvailabilityType[] } = {};
    
    // Group by date
    availabilityData.forEach(slot => {
      if (!groupedData[slot.date]) {
        groupedData[slot.date] = [];
      }
      groupedData[slot.date].push(slot);
    });
    
    // Convert to array format for template
    const result: AvailabilityGroup[] = Object.keys(groupedData)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date,
        slots: groupedData[date].sort((a, b) => a.start_time.localeCompare(b.start_time))
      }));
    
    this.groupedAvailability.set(result);
  }

  private loadAvailableSlots() {
    this.availableSlots = this.appointments.filter(
      (app) => app.status === 'Available' && !app.patientId
    );

    this.groupAvailableSlotsByDate();
  }

  private groupAvailableSlotsByDate() {
    this.groupedAvailableSlots = {};

    this.availableSlots.forEach((slot) => {
      const dateKey = new Date(slot.appointmentDate).toLocaleDateString();

      if (!this.groupedAvailableSlots[dateKey]) {
        this.groupedAvailableSlots[dateKey] = [];
      }

      this.groupedAvailableSlots[dateKey].push(slot);
    });

    // Sort slots by time within each date group
    Object.keys(this.groupedAvailableSlots).forEach((dateKey) => {
      this.groupedAvailableSlots[dateKey].sort((a, b) =>
        a.appointmentTime.localeCompare(b.appointmentTime)
      );
    });
  }

  filterAvailableSlots() {
    if (!this.slotFilterDate) {
      this.loadAvailableSlots();
      return;
    }

    const filterDate = new Date(this.slotFilterDate).toLocaleDateString();
    const filteredSlots: { [date: string]: Appointment[] } = {};

    if (this.groupedAvailableSlots[filterDate]) {
      filteredSlots[filterDate] = this.groupedAvailableSlots[filterDate];
    }

    this.groupedAvailableSlots = filteredSlots;
  }

  onSearch(term: string) {
    this.searchSubject.next(term);
  }

  applyFilters() {
    if (!this.appointments || this.appointments.length === 0) {
      this.filteredAppointments.set([]);
      this.groupAppointmentsByDate();
      return;
    }

    let filtered = [...this.appointments];

    // Apply status filter
    if (this.filter !== 'all') {
      filtered = filtered.filter((app) => app.status === this.filter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.patientName?.toLowerCase().includes(search) ||
          false ||
          app.reasonForVisit?.toLowerCase().includes(search) ||
          false
      );
    }

    // this.filteredAppointments = filtered;
    this.groupAppointmentsByDate();
  }
  
  filterAppointments() {
    const appointments = this.appointmentsData();
    let filtered = [...appointments];
    
    // Apply view filter
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (this.appointmentViewFilter === 'today') {
      filtered = filtered.filter(app => app.date === today);
    } else if (this.appointmentViewFilter === 'upcoming') {
      filtered = filtered.filter(app => app.date >= today);
    } else if (this.appointmentViewFilter === 'past') {
      filtered = filtered.filter(app => app.date < today);
    }
    
    // Apply status filter if set
    if (this.filter !== 'all') {
      filtered = filtered.filter(app => app.status === this.filter);
    }
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.patientName && app.patientName.toLowerCase().includes(search)) || 
        (app.date && app.date.includes(search))
      );
    }
    
    this.filteredAppointments.set(filtered);
    this.groupAppointmentsByDate();
  }
  
  sortAppointments() {
    this.groupAppointmentsByDate();
  }

  private groupAppointmentsByDate() {
    const appointments = this.filteredAppointments();
    const groupedData: { [key: string]: AppointmentType[] } = {};
    
    // Group by date
    appointments.forEach(app => {
      if (!groupedData[app.date]) {
        groupedData[app.date] = [];
      }
      groupedData[app.date].push(app);
    });
    
    // Sort dates based on user preference
    let sortedDates = Object.keys(groupedData);
    if (this.appointmentSortOrder === 'newest') {
      sortedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    } else {
      sortedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }
    
    // Create the final grouped array
    const result: AppointmentGroup[] = sortedDates.map(date => ({
      date,
      appointments: groupedData[date]
    }));
    
    this.groupedAppointments.set(result);
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  openAvailabilityModal() {
    this.showSetAvailabilityModal = true;
  }

  closeSetAvailabilityModal() {
    this.showSetAvailabilityModal = false;
    // Reset form
    this.availabilityDate = '';
    this.startTime = '';
    this.endTime = '';
  }

  openViewAvailabilityModal() {
    this.showViewAvailabilityModal = true;
  }

  closeViewAvailabilityModal() {
    this.showViewAvailabilityModal = false;
  }

  onSetSchedule() {
    if (!this.availabilityDate || !this.startTime || !this.endTime) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if end time is after start time
    if (this.startTime >= this.endTime) {
      alert('End time must be after start time');
      return;
    }
    
    const newAvailability: AvailabilityType = {
      id: Date.now().toString(),
      doctor_id: this.db.current_doctor()?.id + '',
      date: this.availabilityDate,
      start_time: this.startTime,
      end_time: this.endTime
    };
    
    this.db.addAvailability(newAvailability);
    
    // Reset form and close modal
    this.closeSetAvailabilityModal();
    
    // Refresh availability list
    this.loadAvailability();
  }
  
  removeAvailability(id: string) {
    this.db.removeAvailability(id);
    this.loadAvailability();
  }
  
  updateAppointmentStatus(id: string, status: AppointmentStatusType) {
    this.db.updateAppointmentStatus(id, status);
    this.loadAppointments();
  }
  
  // Date group toggle methods
  toggleDateGroup(date: string) {
    if (this.openDateGroups.has(date)) {
      this.openDateGroups.delete(date);
    } else {
      this.openDateGroups.add(date);
    }
  }
  
  isDateGroupOpen(date: string): boolean {
    return this.openDateGroups.has(date);
  }
  
  toggleAppointmentDateGroup(date: string) {
    if (this.openAppointmentDateGroups.has(date)) {
      this.openAppointmentDateGroups.delete(date);
    } else {
      this.openAppointmentDateGroups.add(date);
    }
  }
  
  isAppointmentDateGroupOpen(date: string): boolean {
    return this.openAppointmentDateGroups.has(date);
  }

  setFilter(filter: any) {
    this.filter = filter;
    this.filterAppointments();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Event handlers
  handleSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onSearch(input.value);
  }
}
