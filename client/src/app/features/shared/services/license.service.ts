import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface License {
  licenseKey: string;
  totalUsers: number;
  usedUsers: number;
  createdAt: Date;
  email: string;
  expiryDate: Date;
  subscriptionType: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {
  private apiUrl = `${environment.apiUrl}/api/licenses`;

  constructor(private http: HttpClient) {}

  generateLicense(userCount: number, email: string, subscriptionType: string): Observable<License> {
    // Ensure userCount is a number
    const totalUsers = Number(userCount);
    if (isNaN(totalUsers) || totalUsers <= 0) {
      throw new Error('Invalid user count');
    }

    // Validate email and subscription type
    if (!email?.trim() || !subscriptionType?.trim()) {
      throw new Error('Email and subscription type are required');
    }

    return this.http.post<License>(this.apiUrl, { 
      totalUsers,
      email: email.trim(),
      subscriptionType: subscriptionType.trim()
    });
  }

  getLicenseDetails(licenseKey: string): Observable<License> {
    console.log('Getting license details for:', licenseKey); // Debug log
    return this.http.get<License>(`${this.apiUrl}/${licenseKey}`);
  }
}
