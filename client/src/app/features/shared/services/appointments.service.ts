import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

// Updated to match our backend AppointmentDTO
export interface Appointment {
  appointmentId: string; // Changed from 'id' to match backend
  doctorId: string;
  doctorName?: string;
  patientId?: string;
  patientName?: string;
  appointmentDate: Date; // Changed from 'date' to match backend
  appointmentTime: string; // Changed from 'startTime' to match backend
  durationMinutes: number; // Changed from endTime to match backend's duration concept
  reasonForVisit?: string; // From backend
  status: 'Available' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled'; // Updated to match backend enum
  doctorNotes?: string; // Changed from 'notes' to match backend
  isDoctorAvailabilitySlot: boolean; // New property from backend
}

export interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  time: string;
}

interface RecurringSchedule {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  slotDuration: number;
  weekdays: boolean[];
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = `${environment.apiUrl}/api/appointments`;
  private appointments = new BehaviorSubject<Appointment[]>([]);
  private alerts = new BehaviorSubject<Alert[]>([]);
  private appointmentError$ = new BehaviorSubject<string>('');

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadAppointments();
      } else {
        this.appointments.next([]);
        this.alerts.next([]);
      }
    });
  }

  private getDoctorId(): string | null {
    return this.authService.getDoctorId();
  }

  loadAppointments(): Observable<Appointment[]> {
    const doctorId = this.getDoctorId();
    if (!doctorId) {
      console.warn('No doctor ID found - Please ensure you are logged in as a doctor');
      this.appointmentError$.next('No doctor ID found - Please ensure you are logged in as a doctor');
      this.appointments.next([]);
      return of([]);
    }
    
    // Convert string ID to number for backend compatibility
    const doctorIdNum = parseInt(doctorId, 10);
    if (isNaN(doctorIdNum)) {
      console.error('Invalid doctor ID format:', doctorId);
      this.appointmentError$.next('Invalid doctor ID format');
      return of([]);
    }
    
    console.log('Loading appointments for doctor ID:', doctorIdNum);
    
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorIdNum}`).pipe(
      map(appointments => {
        const processedAppointments = appointments.map(app => ({
          ...app,
          appointmentDate: new Date(app.appointmentDate)
        }));
        
        console.log('Loaded appointments:', processedAppointments);
        this.appointments.next(processedAppointments);
        return processedAppointments;
      }),
      catchError(error => {
        console.error('Error loading appointments:', error);
        const errorMsg = error.error?.message || 'Failed to load appointments';
        this.appointmentError$.next(errorMsg);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointments.asObservable();
  }

  getAppointmentsByDateRange(doctorId: string, startDate: Date, endDate: Date): Observable<Appointment[]> {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
      .pipe(
        map(appointments => appointments.map(app => ({
          ...app,
          appointmentDate: new Date(app.appointmentDate)
        }))),
        tap(appointments => {
          this.appointments.next(appointments);
        }),
        catchError(error => {
          console.error('Error loading appointments by date range:', error);
          return of([]);
        })
      );
  }

  getAppointment(appointmentId: string): Observable<Appointment | undefined> {
    return this.http.get<Appointment>(`${this.apiUrl}/${appointmentId}`).pipe(
      map(appointment => ({
        ...appointment,
        appointmentDate: new Date(appointment.appointmentDate)
      })),
      catchError(error => {
        console.error('Error fetching appointment by id:', error);
        const appointment = this.appointments.getValue().find(app => app.appointmentId === appointmentId);
        return of(appointment);
      })
    );
  }

  createDoctorAvailabilitySlot(doctorId: string, date: Date, time: string, durationMinutes: number): Observable<Appointment> {
    const effectiveDoctorId = doctorId || this.getDoctorId();
    if (!effectiveDoctorId) {
      return throwError(() => new Error('No doctor ID found'));
    }
    
    const formattedDate = date.toISOString().split('T')[0];
    
    return this.http.post<Appointment>(
      `${this.apiUrl}/doctor/${effectiveDoctorId}/availability`, 
      {}, 
      { params: { date: formattedDate, startTime: time, durationMinutes: durationMinutes.toString() } }
    ).pipe(
      map(response => ({
        ...response,
        appointmentDate: new Date(response.appointmentDate)
      })),
      tap(newAppointment => {
        const current = this.appointments.getValue();
        this.appointments.next([...current, newAppointment]);
        
        this.addAlert({
          id: Date.now().toString(),
          message: 'New availability slot created successfully',
          type: 'info',
          time: 'just now'
        });
      }),
      catchError(error => {
        console.error('Error creating availability slot:', error);
        return throwError(() => new Error('Failed to create availability slot'));
      })
    );
  }

  createDoctorAvailabilityBatch(doctorId: string, dates: Date[], times: string[], durationMinutes: number): Observable<Appointment[]> {
    const formattedDates = dates.map(date => date.toISOString().split('T')[0]);
    
    return this.http.post<Appointment[]>(
      `${this.apiUrl}/doctor/${doctorId}/availability/batch`, 
      {},
      { params: { dates: formattedDates, startTimes: times, durationMinutes: durationMinutes.toString() } }
    ).pipe(
      map(appointments => appointments.map(app => ({
        ...app,
        appointmentDate: new Date(app.appointmentDate)
      }))),
      tap(newAppointments => {
        const current = this.appointments.getValue();
        this.appointments.next([...current, ...newAppointments]);
        
        this.addAlert({
          id: Date.now().toString(),
          message: `Created ${newAppointments.length} availability slots successfully`,
          type: 'info',
          time: 'just now'
        });
      }),
      catchError(error => {
        console.error('Error adding batch availability slots:', error);
        return throwError(() => new Error('Failed to create availability slots'));
      })
    );
  }

  createRecurringAvailability(schedule: RecurringSchedule): Observable<Appointment[]> {
    const doctorId = this.getDoctorId();
    if (!doctorId) {
      return throwError(() => new Error('No doctor ID found'));
    }
    
    const selectedDays = schedule.weekdays
      .map((selected, index) => selected ? index : -1)
      .filter(index => index !== -1);
    
    const formattedStartDate = schedule.startDate.toISOString().split('T')[0];
    const formattedEndDate = schedule.endDate.toISOString().split('T')[0];
    
    return this.http.post<Appointment[]>(
      `${this.apiUrl}/doctor/${doctorId}/availability/recurring`, 
      {}, 
      { 
        params: { 
          startDate: formattedStartDate, 
          endDate: formattedEndDate,
          daysOfWeek: selectedDays, 
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDuration: schedule.slotDuration.toString()
        } 
      }
    ).pipe(
      map(appointments => appointments.map(app => ({
        ...app,
        appointmentDate: new Date(app.appointmentDate)
      }))),
      tap(newAppointments => {
        const current = this.appointments.getValue();
        this.appointments.next([...current, ...newAppointments]);
        
        this.addAlert({
          id: Date.now().toString(),
          message: `Created ${newAppointments.length} recurring availability slots`,
          type: 'info',
          time: 'just now'
        });
      }),
      catchError(error => {
        console.error('Error creating recurring availability:', error);
        return throwError(() => new Error('Failed to create recurring availability slots'));
      })
    );
  }

  updateAppointment(updatedAppointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${updatedAppointment.appointmentId}`, updatedAppointment).pipe(
      tap(appointment => {
        this.updateAppointmentInList(appointment);
      }),
      catchError(error => {
        console.error('Error updating appointment:', error);
        return throwError(() => new Error('Failed to update appointment'));
      })
    );
  }

  private updateAppointmentInList(updatedAppointment: Appointment) {
    const current = this.appointments.getValue();
    const updated = current.map(appointment => 
      appointment.appointmentId === updatedAppointment.appointmentId ? {
        ...updatedAppointment,
        appointmentDate: new Date(updatedAppointment.appointmentDate)
      } : appointment
    );
    this.appointments.next(updated);
  }

  deleteAppointmentSlot(appointmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${appointmentId}/availability`).pipe(
      tap(() => {
        const current = this.appointments.getValue();
        this.appointments.next(current.filter(appointment => appointment.appointmentId !== appointmentId));
        
        this.addAlert({
          id: Date.now().toString(),
          message: `Availability slot was deleted`,
          type: 'info',
          time: 'just now'
        });
      }),
      catchError(error => {
        console.error('Error deleting availability slot:', error);
        return throwError(() => new Error('Failed to delete availability slot'));
      })
    );
  }

  getDoctorAvailabilitySlots(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}/availability`).pipe(
      map(appointments => appointments.map(app => ({
        ...app,
        appointmentDate: new Date(app.appointmentDate)
      }))),
      tap(slots => {
        const currentAppointments = this.appointments.getValue();
        const currentIds = new Set(currentAppointments.map(a => a.appointmentId));
        
        const newSlots = slots.filter(s => !currentIds.has(s.appointmentId));
        if (newSlots.length > 0) {
          this.appointments.next([...currentAppointments, ...newSlots]);
        }
      }),
      catchError(error => {
        console.error('Error fetching doctor availability slots:', error);
        return of([]);
      })
    );
  }

  getDoctorUpcomingAppointments(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}/upcoming`).pipe(
      map(appointments => appointments.map(app => ({
        ...app,
        appointmentDate: new Date(app.appointmentDate)
      }))),
      tap(appointments => {
        this.appointments.next(appointments);
      }),
      catchError(error => {
        console.error('Error fetching doctor upcoming appointments:', error);
        return of([]);
      })
    );
  }

  getDoctorPendingAppointments(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}/pending`).pipe(
      map(appointments => appointments.map(app => ({
        ...app,
        appointmentDate: new Date(app.appointmentDate)
      }))),
      catchError(error => {
        console.error('Error fetching pending appointments:', error);
        return of([]);
      })
    );
  }

  approveAppointment(appointmentId: string, doctorNotes?: string): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.apiUrl}/${appointmentId}/approve`, 
      {}, 
      { params: { doctorNotes: doctorNotes || '' } }
    ).pipe(
      tap(updatedAppointment => {
        this.updateAppointmentInList(updatedAppointment);
        
        this.addAlert({
          id: Date.now().toString(),
          message: `Appointment with ${updatedAppointment.patientName} approved`,
          type: 'info',
          time: 'just now'
        });
      }),
      catchError(error => {
        console.error('Error approving appointment:', error);
        return throwError(() => new Error('Failed to approve appointment'));
      })
    );
  }

  rejectAppointment(appointmentId: string, doctorNotes?: string): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.apiUrl}/${appointmentId}/reject`, 
      {}, 
      { params: { doctorNotes: doctorNotes || '' } }
    ).pipe(
      tap(updatedAppointment => {
        this.updateAppointmentInList(updatedAppointment);
        
        this.addAlert({
          id: Date.now().toString(),
          message: `Appointment with ${updatedAppointment.patientName} rejected`,
          type: 'error',
          time: 'just now'
        });
      }),
      catchError(error => {
        console.error('Error rejecting appointment:', error);
        return throwError(() => new Error('Failed to reject appointment'));
      })
    );
  }

  getAlerts(): Observable<Alert[]> {
    return this.alerts.asObservable();
  }

  getCurrentAppointments(): Appointment[] {
    return this.appointments.getValue();
  }

  getCurrentAlerts(): Alert[] {
    return this.alerts.getValue();
  }

  getTodaysAppointments(): Appointment[] {
    const today = new Date();
    return this.appointments.getValue().filter(app => {
      const appDate = new Date(app.appointmentDate);
      return appDate.getDate() === today.getDate() &&
             appDate.getMonth() === today.getMonth() &&
             appDate.getFullYear() === today.getFullYear();
    });
  }

  getPendingConsultations(): number {
    return this.appointments.getValue().filter(app => app.status === 'Pending').length;
  }

  getTotalPatients(): number {
    const uniquePatients = new Set(
      this.appointments.getValue()
        .filter(app => app.patientId)
        .map(app => app.patientId)
    );
    return uniquePatients.size;
  }

  private generateAlerts(appointments: Appointment[]) {
    const alerts: Alert[] = [];
    const now = new Date();
    
    // Generate alerts for pending appointments
    const pendingAppointments = appointments.filter(app => app.status === 'Pending');
    if (pendingAppointments.length > 0) {
      alerts.push({
        id: 'pending-alert',
        type: 'info',
        message: `You have ${pendingAppointments.length} pending appointment requests`,
        time: now.toLocaleTimeString()
      });
    }

    // Generate alerts for today's appointments
    const todayAppointments = this.getTodaysAppointments();
    if (todayAppointments.length > 0) {
      alerts.push({
        id: 'today-alert',
        type: 'warning',
        message: `You have ${todayAppointments.length} appointments scheduled for today`,
        time: now.toLocaleTimeString()
      });
    }
    this.alerts.next(alerts);
  }

  getAppointmentErrors(): Observable<string> {
    return this.appointmentError$.asObservable();
  }

  clearAppointmentErrors(): void {
    this.appointmentError$.next('');
  }

  refreshAppointments(): void {
    this.loadAppointments();
  }

  private addAlert(alert: Alert) {
    const current = this.alerts.getValue();
    this.alerts.next([alert, ...current]);
  }
}
