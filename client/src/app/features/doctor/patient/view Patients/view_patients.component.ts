import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { PatientService, Patient } from '../services/patient.service';
import { PatientCountService } from '../../../shared/services/patient-count.service';
import { Db } from '../../../../db';
import { DoctorPatient, UserType } from '../../../../type';

@Component({
  selector: 'app-view-patients',
  templateUrl: './view_patients.component.html',
  styleUrls: ['./view_patients.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  providers: [PatientService],
})
export class ViewPatientsComponent implements OnInit {
  searchQuery: string = '';
  isLoading: boolean = true;
  showAddPatientModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedPatient: UserType | null = null;
  newPatientEmail: string = '';
  addingPatient: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  sidebarCollapsed: boolean = false;
  isMobileView: boolean = false;
  doctorName: string = '';
  private patientSubscription: Subscription | undefined;

  db: Db = inject(Db);
  myPatients: WritableSignal<UserType[]> = signal<UserType[]>([]);
  filteredPatients: WritableSignal<UserType[]> = signal<UserType[]>([]);

  constructor(
    private router: Router,
    private patientService: PatientService,
    private patientCountService: PatientCountService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 768;
    this.sidebarCollapsed = this.isMobileView;
  }

  ngOnInit(): void {
    this.loadDoctorPatient();
  }

  ngOnDestroy(): void {
    if (this.patientSubscription) {
      this.patientSubscription.unsubscribe();
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  filterPatients(): void {
    if (!this.searchQuery) {
      this.filteredPatients.set(this.myPatients());
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const filtered = this.myPatients().filter((patient) => {
      const fullName = `${patient.firstname} ${patient.lastname}`.toLowerCase();
      const email = (patient.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
    
    this.filteredPatients.set(filtered);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterPatients();
  }

  openAddPatientModal(): void {
    this.showAddPatientModal = true;
    this.newPatientEmail = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeAddPatientModal(): void {
    this.showAddPatientModal = false;
    this.newPatientEmail = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  showDeleteConfirmation(patient: UserType): void {
    this.selectedPatient = patient;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.selectedPatient = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (this.selectedPatient && this.selectedPatient.id) {
      // Find and remove the doctor-patient relationship
      const doctorPatients = this.db.doctorPatientTable().filter(
        dp => dp.doctor_id === this.db.current_doctor()?.id && 
              dp.patient_id === this.selectedPatient?.id
      );
      
      if (doctorPatients.length > 0) {
        // Remove the relationship from the database
        this.db.removeDoctorPatient(doctorPatients[0].id);
        
        // Refresh the patient list
        this.loadDoctorPatient();
      }
      
      // Close the modal
      this.showDeleteModal = false;
      this.selectedPatient = null;
    }
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  loadDoctorPatient(): void {
    const doctorPatients: DoctorPatient[] = this.db
      .doctorPatientTable()
      .filter((val) => val.doctor_id == this.db.current_doctor()?.id);

    let patients: UserType[] = [];

    for (let i = 0; i < doctorPatients.length; i++) {
      for (let x = 0; x < this.db.userTable().length; x++) {
        if (doctorPatients[i].patient_id === this.db.userTable()[x].id) {
          patients.push(this.db.userTable()[x]);
        }
      }
    }

    this.myPatients.set(patients);
    this.filteredPatients.set(patients);
    console.log({ data: this.myPatients() });
  }

  addPatient(): void {
    let patient: UserType | null =
      this.db.userTable().find((user) => user.email == this.newPatientEmail) ||
      null;

    if (patient) {
      let doctorPatient: DoctorPatient = {
        id: this.db.generateId(),
        doctor_id: this.db.current_doctor()?.id || '',
        patient_id: patient.id || '',
      };

      this.db.addDoctorPatient(doctorPatient);
      this.loadDoctorPatient();
      this.closeAddPatientModal();
      return;
    }

    console.log('Patient doesnt exists');
    this.errorMessage = 'Patient with this email does not exist';
    setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }
}
