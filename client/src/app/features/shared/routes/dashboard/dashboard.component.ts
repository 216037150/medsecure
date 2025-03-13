import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import {
  AppointmentsService,
  Appointment,
  Alert,
} from '../../services/appointments.service';
import {
  ProfileUpdateService,
  ProfileUpdate,
} from '../../services/profile-update.service';
import { PatientCountService } from '../../services/patient-count.service';
import { Db } from '../../../../db';

interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingConsultations: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrls: [
    './dashboard.component.css',
    '../../../../shared/styles/sidebar.css',
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  doctorName: string = '';
  doctorInfo: any = {};
  stats: DashboardStats = {
    totalPatients: 0,
    appointmentsToday: 0,
    pendingConsultations: 0,
  };
  appointments: Appointment[] = [];
  alerts: Alert[] = [];
  private baseUrl = 'http://localhost:8080';

  public db: Db = inject(Db);

  private appointmentsSub: Subscription | null = null;
  private alertsSub: Subscription | null = null;
  private profileUpdateSub: Subscription | null = null;
  private patientCountSub: Subscription | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private appointmentsService: AppointmentsService,
    private profileUpdateService: ProfileUpdateService,
    private patientCountService: PatientCountService
  ) {
    // Subscribe to appointments updates
    this.appointmentsSub = this.appointmentsService
      .getAppointments()
      .subscribe((appointments) => {
        this.updateAppointments(appointments);
        this.updateStats();
      });

    // Subscribe to alerts updates
    this.alertsSub = this.appointmentsService
      .getAlerts()
      .subscribe((alerts) => {
        this.alerts = alerts.slice(0, 5); // Show only 5 most recent alerts
      });

    // Subscribe to patient count updates
    this.patientCountSub = this.patientCountService
      .getPatientCount()
      .subscribe((count) => {
        this.stats.totalPatients = count;
      });
  }

  ngOnInit() {
    // // Load initial user info
    // const userInfo = this.authService.getUserInfo();
    // if (userInfo) {
    //   // Extract first and last name from full name
    //   const name = userInfo.name || '';
    //   this.doctorName = name.split(' ').length > 1 ? name : 'Unknown';
    //   // Initialize with local data
    //   this.doctorInfo = {
    //     profilePicture: this.ensureFullUrl(userInfo.profilePicture),
    //     specialization: userInfo.specialization,
    //     phoneNumber: userInfo.phoneNumber,
    //     address: userInfo.address,
    //     email: userInfo.email,
    //     bio: userInfo.bio
    //   };
    //   // Fetch doctor details from backend if this is a doctor
    //   if (userInfo.role && userInfo.role.toLowerCase() === 'doctor') {
    //     const doctorId = this.authService.getDoctorId();
    //     if (doctorId) {
    //       console.log('Fetching doctor details for ID:', doctorId);
    //       this.authService.getDoctor(doctorId).subscribe({
    //         next: (doctorData) => {
    //           console.log('Received doctor data:', doctorData);
    //           // Update doctor info with data from backend
    //           this.doctorName = `${doctorData.firstName} ${doctorData.lastName}`;
    //           this.doctorInfo = {
    //             ...this.doctorInfo,
    //             profilePicture: this.ensureFullUrl(doctorData.profilePicture),
    //             specialization: doctorData.specialization,
    //             phoneNumber: doctorData.phoneNumber,
    //             address: doctorData.address,
    //             email: doctorData.email,
    //             bio: doctorData.bio
    //           };
    //           // Update user info in local storage with the latest data
    //           const updatedUserInfo = {
    //             ...userInfo,
    //             name: this.doctorName,
    //             profilePicture: doctorData.profilePicture,
    //             specialization: doctorData.specialization,
    //             phoneNumber: doctorData.phoneNumber,
    //             address: doctorData.address,
    //             bio: doctorData.bio,
    //             hospitalAffiliations: doctorData.hospitalAffiliations,
    //             educationDetails: doctorData.educationDetails,
    //             certifications: doctorData.certifications
    //           };
    //           this.authService.saveUserInfo(updatedUserInfo);
    //         },
    //         error: (error) => {
    //           console.error('Error fetching doctor details:', error);
    //         }
    //       });
    //     }
    //   }
    // } else {
    //   // Redirect to login if no user info
    //   this.router.navigate(['/login']);
    // }
    // // Subscribe to profile updates
    // this.profileUpdateSub = this.profileUpdateService.profileUpdated$.subscribe(
    //   (updates: ProfileUpdate) => {
    //     console.log('Dashboard received profile update:', updates);
    //     // Update doctor name if provided
    //     if (updates.name) {
    //       this.doctorName = updates.name;
    //     }
    //     // Update profile picture if provided
    //     if (updates.profilePicture) {
    //       this.doctorInfo.profilePicture = this.ensureFullUrl(updates.profilePicture);
    //     }
    //     // Update specialization if provided
    //     if (updates.specialization) {
    //       this.doctorInfo.specialization = updates.specialization;
    //     }
    //     // Update bio if provided
    //     if (updates.bio) {
    //       this.doctorInfo.bio = updates.bio;
    //     }
    //     // Update phone number if provided
    //     if (updates.phoneNumber) {
    //       this.doctorInfo.phoneNumber = updates.phoneNumber;
    //     }
    //     // Update email if provided
    //     if (updates.email) {
    //       this.doctorInfo.email = updates.email;
    //     }
    //   }
    // );
    // this.updateStats();
  }

  private ensureFullUrl(url: string | null | undefined): string {
    if (!url) return '/hospital.svg';
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:image/')
    ) {
      return url;
    }
    return this.baseUrl + url;
  }

  ngOnDestroy() {
    if (this.appointmentsSub) {
      this.appointmentsSub.unsubscribe();
    }
    if (this.alertsSub) {
      this.alertsSub.unsubscribe();
    }
    if (this.profileUpdateSub) {
      this.profileUpdateSub.unsubscribe();
    }
    if (this.patientCountSub) {
      this.patientCountSub.unsubscribe();
    }
  }

  private updateAppointments(appointments: Appointment[]) {
    // Get today's appointments
    const today = new Date();
    this.appointments = appointments
      .filter((app) => {
        const appDate = new Date(app.appointmentDate);
        return (
          appDate.getDate() === today.getDate() &&
          appDate.getMonth() === today.getMonth() &&
          appDate.getFullYear() === today.getFullYear()
        );
      })
      .sort((a, b) => {
        // Convert time strings to comparable values (assume HH:mm format)
        const timeA = a.appointmentTime;
        const timeB = b.appointmentTime;
        return timeA.localeCompare(timeB);
      });
  }

  private updateStats() {
    this.stats = {
      totalPatients: this.stats.totalPatients, // Keep the current value from subscription
      appointmentsToday:
        this.appointmentsService.getTodaysAppointments().length,
      pendingConsultations: this.appointmentsService.getPendingConsultations(),
    };
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.clearUserInfo();
    this.router.navigate(['/']);
  }
}
