import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface MedicalRecord {
  id?: number;
  patientId: number;
  date: Date;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  nextVisit?: Date;
  doctorName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordsService {
  private apiUrl = 'http://localhost:8080/api';
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) {}

  getMedicalRecords(): Observable<MedicalRecord[]> {
    // Get the patient ID from local storage
    let patientId = localStorage.getItem('med_secure_patient_id');
    
    // For testing purposes, if no patient ID is found, use a default one
    if (!patientId) {
      console.warn('Patient ID not found in local storage, using default ID for testing');
      patientId = '1'; // Use the ID of the patient you added the medical record for in desktop
    }

    return this.http.get<MedicalRecord[]>(
      `${this.apiUrl}/patients/${patientId}/records`,
      { headers: this.headers }
    ).pipe(
      map(records => {
        // Transform the records to match the mobile app's expected format
        return records.map(record => ({
          ...record,
          // Format the date if needed
          date: record.date instanceof Date ? record.date : new Date(record.date)
        }));
      }),
      catchError(error => {
        console.error('Error fetching medical records:', error);
        // For testing purposes, return mock data if the API call fails
        if (!patientId || error.status === 404) {
          return of(this.getMockMedicalRecords());
        }
        return this.handleError<MedicalRecord[]>('getMedicalRecords', [])(error);
      })
    );
  }

  downloadRecord(recordId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/medical-records/${recordId}/download`,
      { responseType: 'blob', headers: this.headers }
    ).pipe(
      catchError(error => {
        console.error('Error downloading record:', error);
        return this.handleError<Blob>('downloadRecord')(error);
      })
    );
  }

  // Mock data for testing purposes
  private getMockMedicalRecords(): MedicalRecord[] {
    return [
      {
        id: 1,
        patientId: 1,
        date: new Date(),
        diagnosis: 'Common Cold',
        treatment: 'Rest and fluids. Take acetaminophen for fever.',
        prescription: 'Acetaminophen 500mg',
        notes: 'Patient should recover within a week',
        nextVisit: new Date(new Date().setDate(new Date().getDate() + 7))
      },
      {
        id: 2,
        patientId: 1,
        date: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        diagnosis: 'Annual Check-up',
        treatment: 'No treatment required. All vitals normal.',
        notes: 'Patient is in good health',
        nextVisit: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      }
    ];
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}