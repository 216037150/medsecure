import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

export interface RecurringSchedule {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RecurringScheduleService {
  private apiUrl = `${environment.apiUrl}/api/recurring-schedules`;
  private schedules = new BehaviorSubject<RecurringSchedule[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadDoctorSchedules();
      } else {
        this.schedules.next([]);
      }
    });
  }

  private getDoctorId(): string | null {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo) {
      console.error('No user info found');
      return null;
    }
    return userInfo.doctorId || userInfo.id || null;
  }

  private loadDoctorSchedules(): void {
    const doctorId = this.getDoctorId();
    if (!doctorId) return;

    this.http.get<RecurringSchedule[]>(`${this.apiUrl}/doctor/${doctorId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading recurring schedules:', error);
        return throwError(() => new Error('Failed to load recurring schedules'));
      })
    ).subscribe({
      next: (schedules) => this.schedules.next(schedules),
      error: (error) => console.error('Failed to load schedules:', error)
    });
  }

  createSchedule(schedule: {
    startDate: string;
    endDate: string;
    daysOfWeek: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
  }): Observable<RecurringSchedule> {
    const doctorId = this.getDoctorId();
    if (!doctorId) {
      return throwError(() => new Error('No doctor ID found'));
    }

    return this.http.post<RecurringSchedule>(
      `${this.apiUrl}/doctor/${doctorId}`,
      null,
      {
        params: {
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          daysOfWeek: schedule.daysOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDurationMinutes: schedule.slotDurationMinutes.toString()
        }
      }
    ).pipe(
      tap(newSchedule => {
        const current = this.schedules.getValue();
        this.schedules.next([...current, newSchedule]);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating recurring schedule:', error);
        return throwError(() => new Error('Failed to create recurring schedule'));
      })
    );
  }

  getSchedules(): Observable<RecurringSchedule[]> {
    return this.schedules.asObservable();
  }

  getCurrentSchedules(): RecurringSchedule[] {
    return this.schedules.getValue();
  }

  deactivateSchedule(scheduleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${scheduleId}`).pipe(
      tap(() => {
        const current = this.schedules.getValue();
        this.schedules.next(current.filter(s => s.id !== scheduleId));
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deactivating schedule:', error);
        return throwError(() => new Error('Failed to deactivate schedule'));
      })
    );
  }
}