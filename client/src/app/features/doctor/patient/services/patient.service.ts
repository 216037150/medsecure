import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { map, catchError } from 'rxjs/operators';

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  lastVisit: Date;
  status: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  age?: number;
  hasMedicalRecord?: boolean;
}

export interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface MedicalRecord {
  id?: number;
  patientId: number;
  date: Date;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  notes: string;
  nextVisit?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/api`;
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse, operation = 'operation') {
    console.error(`Error in ${operation}:`, error);
    if (error.status === 404) {
      return throwError(() => new Error('Resource not found'));
    } else if (error.status === 401) {
      return throwError(() => new Error('Unauthorized access'));
    } else if (error.status === 403) {
      return throwError(() => new Error('Forbidden access'));
    }
    return throwError(() => new Error('An error occurred. Please try again later.'));
  }

  getAllPatients(){
    // return this.http.get<Patient[]>(`${this.apiUrl}/patient/all`, { headers: this.headers }).pipe(
    //   catchError(error => {
    //     console.error('Error loading patients:', error);
    //     return of([]);
    //   })
    // );
  }

  getPatient(id: string | number) {
    // Changed from GET to POST to resolve the 405 Method Not Allowed error
    // return this.http.post<Patient>(`${this.apiUrl}/doctor/patient/${id}`, {}, { headers: this.headers }).pipe(
    //   map(patient => patient || null),
    //   catchError(error => {
    //     this.handleError(error, 'getPatient');
    //     return of(null);
    //   })
    // );
  }

  removePatient(id: string){
    // const doctorId = localStorage.getItem('med_secure_doctor_id');

    // return this.http.delete<boolean>(
    //   `${this.apiUrl}/doctor/patient/${id}?doctorId=${doctorId}`,
    //   { headers: this.headers, withCredentials: true }
    // ).pipe(
    //   catchError(error => this.handleError(error, 'removePatient'))
    // );
  }

  findPatientByEmail(email: string){
    // return this.http.get<any>(
    //   `${this.apiUrl}/patient/email/${email}`,
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(error => this.handleError(error, 'findPatientByEmail')),
    //   map(response => {
    //     if (!response.exists) {
    //       throw new Error('Patient not found');
    //     }
    //     return {
    //       id: response.id,
    //       email: response.email,
    //       role: 'PATIENT',
    //       firstName: response.firstName,
    //       lastName: response.lastName
    //     };
    //   })
    // );
  }

  addPatientToDoctor(patientId: string) {
    // const doctorId = localStorage.getItem('med_secure_doctor_id');
    // if (!doctorId) {
    //   return throwError(() => new Error('Doctor ID not found'));
    // }

    // // Convert string IDs to numbers since backend expects Long
    // const numericPatientId = parseInt(patientId, 10);
    // const numericDoctorId = parseInt(doctorId, 10);

    // if (isNaN(numericPatientId) || isNaN(numericDoctorId)) {
    //   return throwError(() => new Error('Invalid ID format'));
    // }

    // return this.http.post<any>(
    //   `${this.apiUrl}/patient/add-to-doctor/${numericPatientId}?doctorId=${numericDoctorId}`,
    //   {},
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(error => {
    //     if (error.status === 409) {
    //       return throwError(() => new Error('Patient is already added'));
    //     }
    //     return this.handleError(error, 'addPatientToDoctor');
    //   })
    // );
  }

  getPatientCount(doctorId: string) {
    // return this.http.get<any>(
    //   `${this.apiUrl}/doctor/${doctorId}/patient-count`,
    //   { headers: this.headers }
    // ).pipe(
    //   map(response => response.count || 0),
    //   catchError(error => {
    //     console.error('Error getting patient count:', error);
    //     return of(0);
    //   })
    // );
  }

  getMedicalRecords(patientId: number) {
    // return this.http.get<MedicalRecord[]>(
    //   `${this.apiUrl}/medical-records/patient/${patientId}`,
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(error => this.handleError(error, 'getMedicalRecords'))
    // );
  }

  getMedicalRecord(recordId: number) {
    // return this.http.get<MedicalRecord>(
    //   `${this.apiUrl}/medical-records/${recordId}`,
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(error => this.handleError(error, 'getMedicalRecord'))
    // );
  }

  addMedicalRecord(record: Omit<MedicalRecord, 'id'>) {
    // return this.http.post<MedicalRecord>(
    //   `${this.apiUrl}/medical-records`,
    //   record,
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(error => this.handleError(error, 'addMedicalRecord'))
    // );
  }

  updateMedicalRecord(recordId: number, record: Omit<MedicalRecord, 'id'>) {
    // return this.http.put<MedicalRecord>(
    //   `${this.apiUrl}/medical-records/${recordId}`,
    //   record,
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(error => this.handleError(error, 'updateMedicalRecord'))
    // );
  }
}
