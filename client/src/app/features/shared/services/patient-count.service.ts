import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PatientService } from '../../doctor/patient/services/patient.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PatientCountService {
  private patientCount = new BehaviorSubject<number>(0);
  
  constructor(
    private patientService: PatientService,
    private authService: AuthService
  ) {
    this.initializePatientCount();
  }
  
  getPatientCount(): Observable<number> {
    return this.patientCount.asObservable();
  }
  
  initializePatientCount(): void {
    // First check if we have patient count from login
    const userInfo = this.authService.getUserInfo();
    if (userInfo && userInfo.patientCount !== undefined) {
      this.patientCount.next(userInfo.patientCount);
    } else {
      // Fallback to API call if no count in user info
      this.refreshPatientCount();
    }
  }
  
  refreshPatientCount(): void {
    // const userInfo = this.authService.getUserInfo();
    // if (!userInfo?.id) {
    //   console.error('User ID not found');
    //   return;
    // }

    // this.patientService.getPatientCount(userInfo.id).subscribe({
    //   next: (count) => {
    //     this.patientCount.next(count);
        
    //     // Also update the stored user info with this count
    //     if (userInfo) {
    //       userInfo.patientCount = count;
    //       this.authService.saveUserInfo(userInfo);
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error fetching patient count:', error);
    //   }
    // });
  }
  
  updatePatientCount(count: number): void {
    this.patientCount.next(count);
    
    // Also update the stored user info with this count
    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      userInfo.patientCount = count;
      this.authService.saveUserInfo(userInfo);
    }
  }
}
