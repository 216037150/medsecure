import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// Extended interface for profile updates
export interface ProfileUpdate {
  profilePicture?: string | null;
  name?: string;
  specialization?: string;
  bio?: string;
  phoneNumber?: string;
  email?: string;
  qualifications?: string[];
  hospitalAffiliations?: string[];
  services?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileUpdateService {
  private profileUpdateSource = new Subject<ProfileUpdate>();

  profileUpdated$ = this.profileUpdateSource.asObservable();

  notifyProfileUpdate(updates: ProfileUpdate) {
    console.log('Profile update notification sent:', updates);
    this.profileUpdateSource.next(updates);
  }
}
