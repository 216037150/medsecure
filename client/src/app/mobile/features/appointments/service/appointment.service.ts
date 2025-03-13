import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { Db } from '../../../../../app/db';
import { SecuraService } from '../../../../../app/secura.service';
import { AppointmentType, DoctorType, UserType } from '../../../../../app/type';

export interface AppointmentPatient {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  specialization?: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  reasonForVisit: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled' | 'Available';
  doctorNotes?: string;
}

export interface Doctor {
  doctorId: string;
  name: string;
  specialization: string;
  profilePicture?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
}

export interface DoctorSchedule {
  id: number;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isRecurring: boolean;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = "";
  private currentAppointmentSubject = new BehaviorSubject<AppointmentPatient | null>(null);
  private appointmentsSubject = new BehaviorSubject<AppointmentPatient[]>([]);
  private availableSlotsSubject = new BehaviorSubject<AppointmentPatient[]>([]);
  private doctorSchedulesSubject = new BehaviorSubject<DoctorSchedule[]>([]);
  private selectedDoctorSubject = new BehaviorSubject<Doctor | null>(null);

  private db = inject(Db);
  private securaService = inject(SecuraService);
  private authService = inject(AuthService);

  // Expose as observables
  public currentAppointment$ = this.currentAppointmentSubject.asObservable();
  public appointments$ = this.appointmentsSubject.asObservable();
  public availableSlots$ = this.availableSlotsSubject.asObservable();
  public doctorSchedules$ = this.doctorSchedulesSubject.asObservable();
  public selectedDoctor$ = this.selectedDoctorSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loadAppointmentsForCurrentUser();
    this.loadAvailableSlots();
  }

  loadAppointmentsForCurrentUser() {
    console.log('Attempting to load appointments for current user');
    
    // Get patient ID from auth service
    const patientId = this.authService.getPatientId();
    
    if (patientId) {
      console.log('Patient ID found, loading appointments:', patientId);
      this.loadAppointments();
    } else {
      console.warn('No patient ID available, trying to get from user info');
      
      // Try to get from user info
      const userInfo = this.authService.getUserInfo();
      if (userInfo && (userInfo.patientId || userInfo.id)) {
        const id = userInfo.patientId || userInfo.id;
        console.log('Using ID from user info:', id);
        if (id) {
          localStorage.setItem('patient_id', id);
          this.loadAppointments();
        } else {
          console.error('ID is undefined, cannot set in localStorage');
          this.appointmentsSubject.next([]);
        }
      } else {
        console.error('No patient ID available in user info either, cannot load appointments');
        this.appointmentsSubject.next([]);
      }
    }
  }

  private loadAppointments() {
    // Get patient ID from auth service
    const patientId = this.authService.getPatientId();

    if (!patientId) {
      console.warn('No patient ID available, skipping appointment loading');
      this.appointmentsSubject.next([]);
      return;
    }

    console.log('Loading appointments for patient ID:', patientId);

    // Load appointments from API with the patient ID
    this.http.get<AppointmentPatient[]>(`${this.apiUrl}/appointments/patient/${patientId}`)
      .pipe(
        map(appointments => {
          console.log('Appointments loaded:', appointments);
          return appointments.map(app => ({

            ...app,
            appointmentDate: new Date(app.appointmentDate)
          }));
        }),
        catchError(error => {
          console.error('Error loading appointments:', error);
          return of([]);
        })
      )
      .subscribe(appointments => {
        this.appointmentsSubject.next(appointments);
      });
  }

  private fetchPatientIdFromProfile() {
    // Get the auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token available, cannot fetch profile');
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Fetch the patient profile to get the ID
    this.http.get<any>(`${this.apiUrl}/patients/profile/info`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching patient profile:', error);
        return of(null);
      })
    ).subscribe(response => {
      if (response && response.success && response.data) {
        const patientId = response.data.id || response.data.patientId;
        if (patientId) {
          console.log('Retrieved patient ID from profile:', patientId);
          // Save the patient ID
          localStorage.setItem('patient_id', patientId);
          // Now load appointments with the retrieved ID
          this.loadAppointments();
        }
      }
    });
  }

  private loadAvailableSlots() {
    const doctorInfo = this.getCurrentDoctor();

    if (!doctorInfo || !doctorInfo.doctorId) {
      console.debug('No doctor selected yet, skipping available slots loading');
      this.availableSlotsSubject.next([]);
      return of([]); // Return empty observable
    }

    return this.http.get<AppointmentPatient[]>(`${this.apiUrl}/appointments/doctor/${doctorInfo.doctorId}/availability`).pipe(
      map(slots => slots.map(slot => ({

        ...slot,
        appointmentDate: new Date(slot.appointmentDate)
      }))),

      tap(slots => {
        this.availableSlotsSubject.next(slots);
      }),

      catchError(error => {
        console.error('Error loading available slots:', error);
        this.availableSlotsSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  private getCurrentDoctor(): Doctor | null {
    return this.selectedDoctorSubject.getValue();
  }

  public getDoctorDetails(doctorId: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${doctorId}`).pipe(
      tap(doctor => {
        // Store the doctor details in the subject
        this.selectedDoctorSubject.next(doctor);
        // Also store in localStorage for persistence
        localStorage.setItem('currentDoctor', JSON.stringify(doctor));
      }),
      catchError(error => {
        console.error('Error loading doctor details:', error);
        return throwError(() => new Error('Failed to load doctor details'));
      })
    );
  }

  public setCurrentDoctor(doctor: Doctor) {
    this.selectedDoctorSubject.next(doctor);
    localStorage.setItem('currentDoctor', JSON.stringify(doctor));
    // Load doctor's schedules when setting current doctor
    this.loadAvailableSlots();
  }

  public getAppointmentsByDate(date: Date): AppointmentPatient[] {
    const appointments = this.appointmentsSubject.getValue();
    const availableSlots = this.availableSlotsSubject.getValue();
    
    const combinedAppointments = [...appointments, ...availableSlots];
    
    return combinedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.toDateString() === date.toDateString();
    });
  }

  public getAvailableSlotsByDate(date: Date): AppointmentPatient[] {
    const availableSlots = this.availableSlotsSubject.getValue();
    
    return availableSlots.filter(slot => {
      const slotDate = new Date(slot.appointmentDate);
      return slotDate.toDateString() === date.toDateString();
    });
  }

  public getAvailableSlotsByDoctorAndDate(doctorId: string, date: Date): AppointmentPatient[] {
    const availableSlots = this.availableSlotsSubject.getValue();
    
    return availableSlots.filter(slot => {
      const slotDate = new Date(slot.appointmentDate);
      return slot.doctorId === doctorId && slotDate.toDateString() === date.toDateString();
    });
  }

  public bookAppointment(slot: AppointmentPatient, reason: string): Observable<AppointmentPatient> {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    // Create the appointment in the database
    const appointmentData: AppointmentType = {
      id: slot.appointmentId,
      doctor_id: slot.doctorId,
      patient_id: userInfo.id || '',
      date: new Date(slot.appointmentDate).toISOString().split('T')[0],
      time: slot.appointmentTime,
      status: 'Pending'
    };

    // Add to appointments table
    this.db.appointmentTable().push(appointmentData);
    this.db.saveToLocalStorage();

    // Update local state
    const appointments = this.appointmentsSubject.getValue();
    const newAppointment: AppointmentPatient = {
      ...slot,
      reasonForVisit: reason,
      status: 'Pending'
    };
    this.appointmentsSubject.next([...appointments, newAppointment]);
    this.currentAppointmentSubject.next(newAppointment);

    return of(newAppointment);
  }

  public cancelAppointment(appointmentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/appointments/${appointmentId}/cancel`, { reason }).pipe(
      tap(() => {
        const appointments = this.appointmentsSubject.getValue();
        const updatedAppointments = appointments.map(app => 
          app.appointmentId === appointmentId 
            ? { ...app, status: 'Cancelled' as const }
            : app
        );
        this.appointmentsSubject.next(updatedAppointments);
      }),
      catchError(error => {
        console.error('Error cancelling appointment:', error);
        return throwError(() => new Error('Failed to cancel appointment'));
      })
    );
  }

  public getCurrentAppointment(): AppointmentPatient | null {
    return this.currentAppointmentSubject.getValue();
  }

  public setCurrentAppointment(appointment: AppointmentPatient | null): void {
    this.currentAppointmentSubject.next(appointment);
  }

  public getUpcomingAppointments(): AppointmentPatient[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.appointmentsSubject.getValue()
      .filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= today && ['Pending', 'Approved'].includes(appointment.status);
      })
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        return a.appointmentTime.localeCompare(b.appointmentTime);
      });
  }

  public getAllAppointments(): AppointmentPatient[] {
    console.log('Getting all appointments including approved, completed, and cancelled');
    
    // Get all appointments from the local database
    const allAppointments = this.db.appointmentTable();
    const currentPatientId = this.authService.getPatientId() || this.db.current_patient()?.id;
    
    if (!currentPatientId) {
      console.warn('No patient ID available, returning empty appointments list');
      return [];
    }
    
    // Filter only the appointments for the current patient
    const patientAppointments = allAppointments.filter(appointment => 
      appointment.patient_id === currentPatientId
    );
    
    console.log('Patient appointments found:', patientAppointments);
    console.log('Approved appointments:', patientAppointments.filter(app => app.status === 'Approved').length);
    console.log('Completed appointments:', patientAppointments.filter(app => app.status === 'Completed').length);
    console.log('Cancelled appointments:', patientAppointments.filter(app => ['Cancelled', 'Rejected'].includes(app.status)).length);
    
    // Check for approved appointments
    if (!patientAppointments.some(app => app.status === 'Approved')) {
      console.log('No approved appointments found, adding from securaService');
      this.addAppointmentsFromSecura(currentPatientId, 'Approved');
    }
    
    // Check for completed appointments
    if (!patientAppointments.some(app => app.status === 'Completed')) {
      console.log('No completed appointments found, adding from securaService');
      this.addAppointmentsFromSecura(currentPatientId, 'Completed');
    }
    
    // Check for cancelled appointments
    if (!patientAppointments.some(app => app.status === 'Cancelled')) {
      console.log('No cancelled appointments found, adding from securaService');
      this.addAppointmentsFromSecura(currentPatientId, 'Cancelled');
    }
    
    // Get the updated list after changes
    const updatedAppointments = this.db.appointmentTable().filter(
      appointment => appointment.patient_id === currentPatientId
    );
    
    // Map database appointment format to AppointmentPatient format
    return updatedAppointments.map(appointment => {
      // Find doctor info for this appointment
      const doctor: UserType | undefined = this.db.userTable().find(user => user.id === appointment.doctor_id);
      // Find doctor details for specialization
      const doctorDetails: DoctorType | undefined = this.db.doctorTable().find(d => d.user_id === doctor?.id);
      
      return {
        appointmentId: appointment.id,
        doctorId: appointment.doctor_id,
        doctorName: doctor ? `${doctor.firstname} ${doctor.lastname}` : 'Unknown Doctor',
        specialization: doctorDetails?.specialisation || '',
        appointmentDate: new Date(appointment.date),
        appointmentTime: appointment.time,
        durationMinutes: 30, // Default duration if not specified
        reasonForVisit: 'Consultation', // Default reason since we don't have this in AppointmentType
        status: appointment.status as any || 'Pending',
        doctorNotes: '' // Default empty notes since we don't have this in AppointmentType
      };
    });
  }
  
  private addAppointmentsFromSecura(patientId: string, status: 'Approved' | 'Completed' | 'Cancelled'): void {
    // Get appointments from SecuraService with the specified status
    const securaAppointments = this.securaService.patientAppointments(patientId, status);
    
    // Update local database with appointments of the specified status
    securaAppointments.forEach((app) => {
      if (app.status === status && app.patient_id === patientId) {
        const existingApp = this.db.appointmentTable().find(a => a.id === app.id);
        if (existingApp) {
          existingApp.status = status;
          this.db.saveToLocalStorage();
        } else {
          this.db.addAppointment(app);
        }
      }
    });
  }

  public refreshAppointments(): void {
    this.loadAppointmentsForCurrentUser();
  }

  public getDoctorSchedules(doctorId: string): Observable<DoctorSchedule[]> {
    return this.http.get<DoctorSchedule[]>(`${this.apiUrl}/api/schedules/doctor/${doctorId}`).pipe(
      map(schedules => schedules.filter(s => s.isActive)),
      tap(schedules => {
        this.doctorSchedulesSubject.next(schedules);
      }),
      catchError(error => {
        console.error('Error loading doctor schedules:', error);
        return of([]);
      })
    );
  }

  public formatTimeForDisplay(time: string): string {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  public getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || '';
  }

  public getCompletedAppointments(): AppointmentPatient[] {
    return this.appointmentsSubject.getValue()
      .filter(appointment => appointment.status === 'Completed')
      .sort((a, b) => {
        // Sort completed appointments by date (most recent first)
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
        return dateB - dateA; // Reverse order for completed appointments
      });
  }

  public getCancelledAppointments(): AppointmentPatient[] {
    return this.appointmentsSubject.getValue()
      .filter(appointment => ['Cancelled', 'Rejected'].includes(appointment.status))
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
        return dateB - dateA; // Most recently cancelled first
      });
  }
}