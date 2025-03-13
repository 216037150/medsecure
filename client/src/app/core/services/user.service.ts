import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from './auth.service';

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getUserProfile(userId: number): Observable<User> {
    return this.apiService.get<User>(`/users/${userId}`);
  }

  updateUserProfile(userId: number, userData: UpdateUserRequest): Observable<User> {
    return this.apiService.put<User>(`/users/${userId}`, userData);
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<void> {
    return this.apiService.put<void>(`/users/${userId}/password`, {
      currentPassword,
      newPassword
    });
  }

  getDoctors(): Observable<User[]> {
    return this.apiService.get<User[]>('/users/doctors');
  }

  getReceptionists(): Observable<User[]> {
    return this.apiService.get<User[]>('/users/receptionists');
  }
}
