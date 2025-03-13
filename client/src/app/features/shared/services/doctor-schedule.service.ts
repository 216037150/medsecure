import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

export interface TimeSlot {
  time: string;
  durationMinutes: number;
  isAvailable: boolean;
  appointmentId?: string;
}

export interface DoctorSchedule {
  scheduleId?: string; // Make optional since it may not be present in some responses
  id?: number;         // Add id property as it exists in the API response
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  isRecurring: boolean; 
}

@Injectable({
  providedIn: 'root'
})
export class DoctorScheduleService {
  private apiUrl = `${environment.apiUrl}/api/schedules`;
  private schedules = new BehaviorSubject<DoctorSchedule[]>([]);
  private scheduleUpdateError$ = new BehaviorSubject<string>('');
  
  // Default placeholder patient ID for availability slots
  private PLACEHOLDER_PATIENT_ID = '0';
  
  private availableTimeSlots: string[] = [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30'
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadDoctorSchedules().subscribe();
      } else {
        this.schedules.next([]);
      }
    });
  }

  loadDoctorSchedules(): Observable<DoctorSchedule[]> {
    const doctorIdStr = this.getDoctorId();
    console.log('Loading schedules for doctor ID (string):', doctorIdStr);
    
    if (!doctorIdStr) {
      console.error('No doctor ID found - Cannot load schedules');
      return throwError(() => new Error('No doctor ID found - Please ensure you are logged in as a doctor'));
    }
    
    // Convert string ID to number for backend compatibility
    const doctorId = parseInt(doctorIdStr, 10);
    if (isNaN(doctorId)) {
      console.error('Invalid doctor ID format:', doctorIdStr);
      return throwError(() => new Error('Invalid doctor ID format'));
    }
    
    console.log('Loading schedules for doctor ID (number):', doctorId);
    
    return this.http.get<DoctorSchedule[]>(`${this.apiUrl}/doctor/${doctorId}`).pipe(
      tap(schedules => {
        console.log('Loaded schedules:', schedules);
        this.schedules.next(schedules);
      }),
      catchError(error => {
        console.error('Error loading schedules:', error);
        const errorMsg = error.error?.message || 'Failed to load schedules';
        this.scheduleUpdateError$.next(errorMsg);
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  
  private getDoctorId(): string | null {
    // First try to get directly from AuthService's getDoctorId method
    const directDoctorId = this.authService.getDoctorId();
    if (directDoctorId) {
      console.log('Got doctor ID directly from AuthService:', directDoctorId);
      return directDoctorId;
    }
    
    // If no doctor ID is found, show an error
    console.error('No doctor ID found - Cannot proceed with schedule operations');
    this.scheduleUpdateError$.next('No doctor ID found - Please ensure you are logged in as a doctor');
    return null;
  }

  createSchedule(dayOfWeek: number, startTime: string, endTime: string, slotDurationMinutes: number): Observable<DoctorSchedule | null> {
    const doctorIdStr = this.getDoctorId();
    console.log('Doctor ID from auth service (string):', doctorIdStr);
    
    if (!doctorIdStr) {
      console.error('No doctor ID found - Please ensure you are logged in as a doctor');
      return throwError(() => new Error('No doctor ID found - Please ensure you are logged in as a doctor'));
    }

    // Convert string ID to number for backend compatibility
    const doctorId = parseInt(doctorIdStr, 10);
    if (isNaN(doctorId)) {
      console.error('Invalid doctor ID format:', doctorIdStr);
      return throwError(() => new Error('Invalid doctor ID format'));
    }

    console.log('Converted doctor ID to number:', doctorId);

    // Create a modified schedule object with additional properties for availability slots
    const newSchedule = {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes,
      isRecurring: false,
      isActive: true,
      skipPatientValidation: true, // Tell backend to skip patient ID validation
      isAvailabilitySlot: true,    // Explicitly mark as availability slot
      patientRequired: false,      // Explicitly mark that patient is not required
      slotType: 'AVAILABILITY',      // Specify the type of slot being created
      patientId: this.PLACEHOLDER_PATIENT_ID // Add placeholder patient ID
    };

    console.log('Creating schedule with values: ', newSchedule);

    // Make the POST request with the enhanced schedule object
    return this.http.post<DoctorSchedule>(`${this.apiUrl}`, newSchedule).pipe(
      tap(schedule => {
        console.log('Schedule created successfully:', schedule);
        const current = this.schedules.getValue();
        this.schedules.next([...current, schedule]);
      }),
      catchError(error => {
        console.error('Error creating schedule:', error);
        let errorMsg;
        
        // Check if error is the patient_id constraint violation
        if (error.error && error.error.message && 
            error.error.message.includes('patient_id') && 
            error.error.message.includes('null')) {
          errorMsg = 'Backend error: Patient ID cannot be null. Please contact the system administrator.';
        } else {
          errorMsg = error.error?.message || 'Failed to create schedule';
        }
        
        this.scheduleUpdateError$.next(errorMsg);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  updateSchedule(scheduleId: string, updates: Partial<DoctorSchedule>): Observable<DoctorSchedule> {
    return this.http.put<DoctorSchedule>(`${this.apiUrl}/${scheduleId}`, updates).pipe(
      tap(updatedSchedule => {
        const current = this.schedules.getValue();
        this.schedules.next(
          current.map(schedule => 
            schedule.scheduleId === scheduleId ? updatedSchedule : schedule
          )
        );
      }),
      catchError(error => {
        console.error('Error updating schedule:', error);
        return throwError(() => new Error('Failed to update schedule'));
      })
    );
  }

  deactivateSchedule(scheduleId: string): Observable<void> {
    console.log('Deactivating schedule with ID:', scheduleId);
    
    if (!scheduleId) {
      console.error('No schedule ID provided for deactivation');
      return throwError(() => new Error('No schedule ID provided for deactivation'));
    }
    
    // Convert string ID to number for backend compatibility
    const id = parseInt(scheduleId, 10);
    if (isNaN(id)) {
      console.error('Invalid schedule ID format:', scheduleId);
      return throwError(() => new Error('Invalid schedule ID format'));
    }
    
    console.log('Converted schedule ID to number:', id);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('Schedule successfully deactivated:', id);
        const current = this.schedules.getValue();
        // Filter out the deactivated schedule using both id and scheduleId
        this.schedules.next(
          current.filter(schedule => 
            (schedule.id?.toString() !== scheduleId) && (schedule.scheduleId !== scheduleId)
          )
        );
      }),
      catchError(error => {
        console.error('Error deactivating schedule:', error);
        return throwError(() => new Error('Failed to deactivate schedule'));
      })
    );
  }

  getSchedules(): Observable<DoctorSchedule[]> {
    return this.schedules.asObservable();
  }

  getCurrentSchedules(): DoctorSchedule[] {
    return this.schedules.getValue();
  }

  getAvailableTimeSlots(): string[] {
    return this.availableTimeSlots;
  }

  refreshSchedules(): void {
    this.loadDoctorSchedules().subscribe({
      next: (schedules) => {
        console.log('Schedules refreshed successfully:', schedules);
      },
      error: (error) => {
        console.error('Error refreshing schedules:', error);
      }
    });
  }

  validateTimeSlots(startTime: string, endTime: string, duration: number): boolean {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    return start < end && duration > 0 && duration <= (end - start) / (60 * 1000);
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  }

  isTimeSlotAvailable(dayOfWeek: number, timeSlot: string, duration: number = 30): boolean {
    const schedules = this.schedules.getValue();
    const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek && s.isActive);
    
    if (daySchedules.length === 0) return false;
    
    for (const schedule of daySchedules) {
      const slotTime = this.parseTime(timeSlot);
      const startTime = this.parseTime(schedule.startTime);
      const endTime = this.parseTime(schedule.endTime);
      
      if (slotTime >= startTime && (slotTime + duration * 60 * 1000) <= endTime) {
        return true;
      }
    }
    
    return false;
  }

  formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}