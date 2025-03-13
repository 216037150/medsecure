import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { ApiUrlService } from '../../../core/services/api-url.service';

export interface PatientProfile {
  id?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  profilePicture?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: PatientProfile;
}

@Injectable({
  providedIn: 'root'
})
export class PatientProfileService {
  private profileSubject = new BehaviorSubject<PatientProfile | null>(null);
  currentProfile$ = this.profileSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiUrlService: ApiUrlService
  ) {
    this.loadProfileFromStorage();
  }
  
  private loadProfileFromStorage(): void {
    const storedProfile = localStorage.getItem('patient_profile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        this.profileSubject.next(profile);
        // Verify with server on load
        this.verifyProfileWithServer(profile);
      } catch (e) {
        console.error('Error parsing stored profile', e);
      }
    }
  }
  
  private verifyProfileWithServer(localProfile: PatientProfile): void {
    const token = this.authService.getAuthToken();
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Use the ApiUrlService to construct the URL
    const profileEndpoint = this.apiUrlService.getUrl('patients/profile/info');
    console.log('Verifying profile with server at:', profileEndpoint);

    this.http.get<any>(profileEndpoint, { headers })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Update local storage if server data is different
            if (JSON.stringify(response.data) !== JSON.stringify(localProfile)) {
              this.saveProfileToStorage(response.data);
              this.profileSubject.next(response.data);
            }
          }
        },
        error: (error) => console.error('Error verifying profile with server:', error)
      });
  }
  
  private saveProfileToStorage(profile: PatientProfile): void {
    localStorage.setItem('patient_profile', JSON.stringify(profile));
    localStorage.setItem('user_info', JSON.stringify({
      full_name: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      profilePicture: profile.profilePicture
    }));
  }
  
  getCurrentProfile(): PatientProfile | null {
    return this.profileSubject.value;
  }
  
  fetchLatestProfile(): Observable<PatientProfile> {
    const token = this.authService.getAuthToken();
    if (!token) {
      console.error('No auth token found');
      return of(this.getCurrentProfile() || {} as PatientProfile);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Use the ApiUrlService to construct the URL
    const profileEndpoint = this.apiUrlService.getUrl('patients/profile/info');
    console.log('Fetching profile from server at:', profileEndpoint);

    return this.http.get<any>(profileEndpoint, { headers })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const profile = response.data;
            this.profileSubject.next(profile);
            this.saveProfileToStorage(profile);
            return profile;
          }
          throw new Error('Failed to fetch latest profile');
        }),
        catchError(error => {
          console.error('Error fetching latest profile:', error);
          return of(this.getCurrentProfile() || {} as PatientProfile);
        })
      );
  }
  
  updateProfile(profile: PatientProfile): Observable<PatientProfile> {
    const token = this.authService.getAuthToken();
    
    if (!token) {
      console.error('No auth token found');
      // Try to redirect to login or handle missing token appropriately
      return of(profile);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const userData = {
      firstName: profile.fullName.split(' ')[0],
      lastName: profile.fullName.split(' ').slice(1).join(' '),
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      profilePicture: profile.profilePicture
    };

    console.log('Updating profile with data:', userData);

    // Use the ApiUrlService to construct the URL
    const updateEndpoint = this.apiUrlService.getUrl('patients/profile/update');
    console.log('Update profile endpoint:', updateEndpoint);

    return this.http.post<ApiResponse>(updateEndpoint, userData, { headers })
      .pipe(
        tap(response => console.log('Server response:', response)),
        map((response: ApiResponse) => {
          if (response.success && response.data) {
            const updatedProfile = response.data;
            this.profileSubject.next(updatedProfile);
            this.saveProfileToStorage(updatedProfile);
            return updatedProfile;
          } else {
            throw new Error('Server did not return success response');
          }
        }),
        catchError(error => {
          console.error('Error updating profile:', error);
          return of(profile);
        }),
        // Verify the update was successful by fetching latest data
        switchMap(() => this.fetchLatestProfile())
      );
  }
  
  updateProfilePicture(profilePicture: string): Observable<PatientProfile> {
    console.log('Updating profile picture with base64 data');
    
    const currentProfile = this.getCurrentProfile();
    if (!currentProfile) {
      console.error('No profile exists to update picture');
      return throwError(() => new Error('No profile exists to update picture'));
    }
    
    const token = this.authService.getAuthToken();
    if (!token) {
      console.error('No auth token found');
      return throwError(() => new Error('Authentication token not found'));
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    // Prepare the data with just the profile picture
    const updateData = {
      profilePicture: profilePicture
    };
    
    console.log('Sending profile picture update request');
    
    // Use the ApiUrlService to construct the URL
    const updatePictureEndpoint = this.apiUrlService.getUrl('patients/profile/update');
    console.log('Update picture endpoint:', updatePictureEndpoint);
    
    return this.http.post<ApiResponse>(updatePictureEndpoint, updateData, { headers })
      .pipe(
        tap(response => console.log('Profile picture update response:', response)),
        map((response: ApiResponse) => {
          if (response.success && response.data) {
            const updatedProfile = response.data;
            
            // Update the profile in memory and storage
            this.profileSubject.next(updatedProfile);
            this.saveProfileToStorage(updatedProfile);
            
            // Also update the user info in auth service
            this.authService.updateUserInfoFromProfile(updatedProfile);
            
            return updatedProfile;
          } else {
            throw new Error('Server did not return success response');
          }
        }),
        catchError(error => {
          console.error('Error updating profile picture:', error);
          return throwError(() => error);
        })
      );
  }
}