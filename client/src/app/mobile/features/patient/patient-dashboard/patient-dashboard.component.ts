import { Component, type OnInit, ViewChild, type ElementRef, inject, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { Slide } from "../../../model/cancel-reason.model";
import { HttpClientModule } from '@angular/common/http';
import { AppointmentService, AppointmentPatient } from '../../appointments/service/appointment.service';
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { PatientProfileService } from '../services/patient-profile.service';
import { Subscription } from 'rxjs';

interface DashboardDate {
  day: number;
  weekday: string;
  fullDate: string;
}

@Component({
  selector: "app-patient-dashboard",
  standalone: true,
  imports: [CommonModule, HttpClientModule, NavbarComponent, RouterLink],
  templateUrl: "./patient-dashboard.component.html",
  styleUrls: ["./patient-dashboard.component.css"],
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  @ViewChild("datesContainer") datesContainer!: ElementRef;

  private authService = inject(AuthService);
  userName = "";
  profileImage: string | null = null;
  private profileSubscription: Subscription | undefined;

  currentSlideIndex = 0;
  slides: Slide[] = [
    {
      title: "Book your appointment",
      description: "Convenient, accessible, efficient healthcare scheduling online platform!",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Vc0Pzs3DNZSgP5C6q7kjk8g6nRLyPJ.png",
      buttonText: "Book Now",
    },
    {
      title: "Mental Health Awareness",
      description: "Your Health, Your Wealth Regular Checkups Save Lives!",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Vc0Pzs3DNZSgP5C6q7kjk8g6nRLyPJ.png",
      buttonText: "Book Now",
    },
  ];

  dates: DashboardDate[] = [];
  selectedDate: DashboardDate | null = null;
  currentMonth = "";
  currentAppointment: AppointmentPatient | null = null;
  upcomingAppointments: AppointmentPatient[] = [];
  appointmentsMap: { [key: string]: AppointmentPatient[] } = {};
  allAppointments: AppointmentPatient[] = []; // All booked appointments

  times: string[] = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "13:00 PM", "14:00 PM", "15:00 PM", "16:00 PM","17:00 PM"];

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
    private profileService: PatientProfileService
  ) {
    this.currentMonth = new Date().toLocaleString("default", { month: "long" });
  }

  async loadUserProfile() {
    // First try to get profile from ProfileService
    const profileData = this.profileService.getCurrentProfile();
    if (profileData) {
      this.userName = profileData.fullName;
      this.profileImage = profileData.profilePicture || null;
    } else {
      // If no profile data, try AuthService
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.userName = user.displayName;
        this.profileImage = user.profileImage;
      }
    }
  }

  ngOnInit(): void {
    this.generateDates();
    this.loadAppointments();
    this.startSlideshow();
    this.loadUserProfile();

    this.appointmentService.appointments$.subscribe(() => {
      this.loadAppointments();
    });
    
    this.profileSubscription = this.profileService.currentProfile$.subscribe(profile => {
      if (profile) {
        console.log('Profile updated in dashboard:', profile);
        this.userName = profile.fullName;
        this.profileImage = profile.profilePicture || null;
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  private startSlideshow() {
    setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
  }

  previousSlide() {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
  }

  navigateToBooking() {
    this.router.navigate(['/mobile/appointment-booking']);
  }

  navigateToAppointmentDetails(appointment: AppointmentPatient) {
    this.router.navigate(['/mobile/appointment-details'], { state: { appointment } });
  }

  generateDates() {
    const today = new Date();
    for (let i = -3; i < 4; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      this.dates.push({
        day: newDate.getDate(),
        weekday: newDate.toLocaleString("en-US", { weekday: "short" }),
        fullDate: newDate.toISOString().split("T")[0],
      });
    }
  }

  loadAppointments(): void {
    this.currentAppointment = this.appointmentService.getCurrentAppointment();
    this.upcomingAppointments = this.appointmentService.getUpcomingAppointments();
    
    // Load all appointments for the comprehensive view
    this.allAppointments = this.appointmentService.getAllAppointments();
    
    // Sort allAppointments by date
    this.allAppointments.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Populate and sort appointments map for calendar view
    this.appointmentsMap = {};
    this.dates.forEach((date) => {
      const appointmentsForDate = this.appointmentService.getAppointmentsByDate(new Date(date.fullDate));
      if (appointmentsForDate.length > 0) {
        this.appointmentsMap[date.fullDate] = appointmentsForDate.sort((a, b) => {
          const timeA = this.parseTime(a.appointmentTime).getTime();
          const timeB = this.parseTime(b.appointmentTime).getTime();
          return timeA - timeB;
        });
      }
    });

    if (this.currentAppointment) {
      const appointmentDate = this.currentAppointment.appointmentDate;
      this.selectedDate = this.dates.find((date) => 
        new Date(date.fullDate).getDate() === appointmentDate.getDate()
      ) || null;
    } else {
      this.selectedDate = this.dates.find((date) => 
        new Date(date.fullDate).getDate() === new Date().getDate()
      ) || null;
    }
  }

  getGroupedAppointments(date: string): { time: string; appointments: AppointmentPatient[] }[] {
    const appointments = this.appointmentsMap[date] || [];
    const groupedAppointments = new Map<string, AppointmentPatient[]>();

    appointments.forEach((appointment) => {
      const existingGroup = groupedAppointments.get(appointment.appointmentTime) || [];
      groupedAppointments.set(appointment.appointmentTime, [...existingGroup, appointment]);
    });

    return Array.from(groupedAppointments.entries())
      .map(([time, apps]) => ({
        time,
        appointments: apps,
      }))
      .sort((a, b) => {
        const timeA = this.parseTime(a.time).getTime();
        const timeB = this.parseTime(b.time).getTime();
        return timeA - timeB;
      });
  }

  selectDate(date: DashboardDate) {
    this.selectedDate = date;
  }

  hasAppointmentsForDate(date: string): boolean {
    return !!this.appointmentsMap[date]?.length;
  }

  private parseTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  hasAppointmentAt(time: string): boolean {
    if (!this.selectedDate) return false;
    return this.appointmentsMap[this.selectedDate.fullDate]?.some(
      (appointment) => appointment.appointmentTime === time
    ) || false;
  }

  getAppointmentAt(time: string): AppointmentPatient | null {
    if (!this.selectedDate) return null;
    return this.appointmentsMap[this.selectedDate.fullDate]?.find(
      (appointment) => appointment.appointmentTime === time
    ) || null;
  }

  formatTime(time: string): string {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return '#eab308';
      case 'Approved': return '#22c55e';
      case 'Rejected': return '#ef4444';
      case 'Completed': return '#199a8e';
      case 'Cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  }
  
  getStatusClass(status: string): string {
    status = status?.toLowerCase() || '';
    return status === 'pending' || status === 'approved' || status === 'rejected' || 
           status === 'completed' || status === 'cancelled' ? status : 'pending';
  }
  
  getMonthShort(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleString('default', { month: 'short' });
  }
  
  getDayOfMonth(date: Date): number {
    if (!date) return 0;
    return new Date(date).getDate();
  }
}
