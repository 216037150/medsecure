import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  email: string;
  role: 'doctor' | 'patient' | 'receptionist' | 'admin';
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  name: string;
  email: string;
  profilePicture?: string | null;
  specialization?: string;
  phoneNumber?: string;
  address?: string;
  affiliatedInstitution?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  role: User['role'];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Optionally, clear the invalid data from localStorage
        localStorage.removeItem('user');
      }
    } else {
      this.currentUserSubject.next(null);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/login', credentials).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/register', userData).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.token);

    // Create user object from response
    const email = response.email;
    const isDoctor = email.includes('@doctor') || email.includes('@doctor.gmail.com');
    const isPatient = email.includes('@patient');
    const isReceptionist = email.includes('@receptionist');
    const isAdmin = email.includes('@admin');

    let role;
    if (isDoctor) role = 'doctor';
    else if (isPatient) role = 'patient';
    else if (isReceptionist) role = 'receptionist';
    else if (isAdmin) role = 'admin';
    else role = 'unknown';

    const user: User = {
      id: 0,
      email: response.email,
      role: role as User['role'],
      firstName: response.name?.split(' ')[0] || '',
      lastName: response.name?.split(' ')[1] || ''
    };

    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  hasRole(role: User['role']): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
