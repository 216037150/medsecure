import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../features/auth/services/auth.service';
import { map } from 'rxjs/operators';

export interface Doctor {
  id?: number;
  name: string;
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/api/doctors`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  addDoctor(doctor: Doctor): Observable<any> {
    // Split the name into first and last name
    const names = doctor.name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');

    // Transform Doctor to RegisterRequest format
    const registerRequest = {
      firstName: firstName,
      lastName: lastName,
      email: doctor.email,
      password: doctor.password!,
      role: 'doctor'
    };

    // Register the doctor directly through the auth service
    return this.authService.register(registerRequest);
  }

  updateDoctor(id: number, doctor: Doctor): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, doctor);
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}`);
  }

  deleteDoctor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}