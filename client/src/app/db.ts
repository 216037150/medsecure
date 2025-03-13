import { inject, Injectable, signal } from '@angular/core';
import {
  AppointmentType,
  AvailabilityType,
  DoctorPatient,
  DoctorType,
  MedicalRecordType,
  PatientType,
  UserType,
  AppointmentStatusType,
} from './type';
import {
  APPOINTMENT_TABLE,
  AVAILABILITY_TABLE,
  CURRENT_DOCTOR,
  CURRENT_PATIENT,
  DOCTOR_TABLE,
  DOCTORPATIENT_TABLE,
  MEDICALRECORD_TABLE,
  PATIENT_TABLE,
  USER_TABLE,
} from './constant';
import { Storage } from './storage';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Db {
  storage: Storage = inject(Storage);
  router: Router = inject(Router);

  public userTable = signal<UserType[]>([]);
  public doctorTable = signal<DoctorType[]>([]);
  public patientTable = signal<PatientType[]>([]);
  public avalaibityTable = signal<AvailabilityType[]>([]);
  public doctorPatientTable = signal<DoctorPatient[]>([]);
  public availabilityTable = signal<AvailabilityType[]>([]);
  public medicalRecordTable = signal<MedicalRecordType[]>([]);
  public appointmentTable = signal<AppointmentType[]>([]);

  public current_doctor = signal<UserType | null>(null);
  public current_patient = signal<UserType | null>(null);

  constructor() {
    // Load all tables from localStorage when the application starts
    this.loadAllTable();
  }

  generateId(): string {
    return Date.now() + '';
  }

  // ======================================================> USER SECTION

  // login user
  login(email: string, password: string): UserType | null {
    const user: UserType | undefined = this.userTable().find(
      (val) => val.email == email
    );

    if (user && user.password == password) {
      return user;
    }

    return null;
  }

  // register user
  register(user: UserType) {
    console.log(user);
    this.userTable.update((val) => [...val, user]);

    this.storage.setItem<UserType[]>(USER_TABLE, this.userTable());

    if (user.role == 'DOCTOR') {
      this.storage.setItem<UserType>(CURRENT_DOCTOR, user);
      this.router.navigate(['/doctors-profile']);
      return;
    }

    if (user.role == 'PATIENT') {
      this.storage.setItem<UserType>(CURRENT_PATIENT, user);
      this.router.navigate(['/mobile/patient-dashboard']);
      return;
    }
  }

  setCurrentDoctor(user: UserType) {
    this.current_doctor.set(user);
  }

  setCurrentPatient(user: UserType) {
    this.current_patient.set(user);
  }

  loadAllTable() {
    // Load user table
    const users = this.storage.getItem<UserType[]>(USER_TABLE);
    if (users) {
      this.userTable.set(users);
    }

    // load users
    const doctor = this.storage.getItem<UserType>(CURRENT_DOCTOR);
    if (doctor) {
      this.setCurrentDoctor(doctor);
    }

    const patient = this.storage.getItem<UserType>(CURRENT_PATIENT);
    if (patient) {
      this.setCurrentPatient(patient);
    }

    // Load doctor table
    const doctors = this.storage.getItem<DoctorType[]>(DOCTOR_TABLE);
    if (doctors) {
      this.doctorTable.set(doctors);
    }

    // Load patient table
    const patients = this.storage.getItem<PatientType[]>(PATIENT_TABLE);
    if (patients) {
      this.patientTable.set(patients);
    }

    // Load doctor-patient table
    const doctorPatients =
      this.storage.getItem<DoctorPatient[]>(DOCTORPATIENT_TABLE);
    if (doctorPatients) {
      this.doctorPatientTable.set(doctorPatients);
    }

    // Load availability table
    const availabilities =
      this.storage.getItem<AvailabilityType[]>(AVAILABILITY_TABLE);
    if (availabilities) {
      this.availabilityTable.set(availabilities);
    }

    // Load medical record table
    const medicalRecords =
      this.storage.getItem<MedicalRecordType[]>(MEDICALRECORD_TABLE);
    if (medicalRecords) {
      this.medicalRecordTable.set(medicalRecords);
    }

    // Load appointment table
    const appointments =
      this.storage.getItem<AppointmentType[]>(APPOINTMENT_TABLE);
    if (appointments) {
      this.appointmentTable.set(appointments);
    }
  }

  // Initialize with sample data if tables are empty
  initializeWithSampleData() {
    // This method has been intentionally emptied
    // No sample data will be initialized
    console.log('Sample data initialization is disabled');
  }

  // add new doctor
  addNewDoctor(doctor: DoctorType) {
    this.doctorTable.update((val) => [...val, doctor]);
    this.storage.setItem<DoctorType[]>(DOCTOR_TABLE, this.doctorTable());
  }

  // add new patient
  addNewPatient(patient: PatientType) {
    this.patientTable.update((val) => [...val, patient]);
    this.storage.setItem<PatientType[]>(PATIENT_TABLE, this.patientTable());
  }

  // add new doctor patient
  addDoctorPatient(data: DoctorPatient) {
    this.doctorPatientTable.update((val) => [...val, data]);
    this.storage.setItem<DoctorPatient[]>(
      DOCTORPATIENT_TABLE,
      this.doctorPatientTable()
    );
  }

  // add availability
  addAvailability(data: AvailabilityType) {
    this.availabilityTable.update((val) => [...val, data]);
    this.storage.setItem<AvailabilityType[]>(
      AVAILABILITY_TABLE,
      this.availabilityTable()
    );
  }

  // remove availability
  removeAvailability(id: string) {
    this.availabilityTable.update((val) => 
      val.filter((availability) => availability.id !== id)
    );
    this.storage.setItem<AvailabilityType[]>(
      AVAILABILITY_TABLE,
      this.availabilityTable()
    );
  }

  // update appointment status
  updateAppointmentStatus(id: string, status: AppointmentStatusType) {
    this.appointmentTable.update((val) => 
      val.map((appointment) => 
        appointment.id === id 
          ? { ...appointment, status } 
          : appointment
      )
    );
    this.storage.setItem<AppointmentType[]>(
      APPOINTMENT_TABLE,
      this.appointmentTable()
    );
  }

  // add medical Record
  addMedicalRecord(data: MedicalRecordType) {
    this.medicalRecordTable.update((val) => [...val, data]);
    this.storage.setItem<MedicalRecordType[]>(
      MEDICALRECORD_TABLE,
      this.medicalRecordTable()
    );
  }

  // add appointment
  addAppointment(data: AppointmentType) {
    this.appointmentTable.update((val) => [...val, data]);
    this.storage.setItem<AppointmentType[]>(
      APPOINTMENT_TABLE,
      this.appointmentTable()
    );
  }

  // remove doctor patient relationship
  removeDoctorPatient(doctorPatientId: string) {
    this.doctorPatientTable.update((val) => 
      val.filter((dp) => dp.id !== doctorPatientId)
    );
    this.storage.setItem<DoctorPatient[]>(
      DOCTORPATIENT_TABLE,
      this.doctorPatientTable()
    );
  }

  // Save all tables to localStorage
  saveToLocalStorage() {
    this.storage.setItem<UserType[]>(USER_TABLE, this.userTable());
    this.storage.setItem<DoctorType[]>(DOCTOR_TABLE, this.doctorTable());
    this.storage.setItem<PatientType[]>(PATIENT_TABLE, this.patientTable());
    this.storage.setItem<DoctorPatient[]>(DOCTORPATIENT_TABLE, this.doctorPatientTable());
    this.storage.setItem<AvailabilityType[]>(AVAILABILITY_TABLE, this.availabilityTable());
    this.storage.setItem<MedicalRecordType[]>(MEDICALRECORD_TABLE, this.medicalRecordTable());
    this.storage.setItem<AppointmentType[]>(APPOINTMENT_TABLE, this.appointmentTable());
  }
}
