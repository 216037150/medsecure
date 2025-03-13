import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core'; 
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { PatientProfileService } from '../services/patient-profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})

export class PatientProfileComponent implements OnInit, OnDestroy {
  selectedImage: string | null = null;
  showLogoutModal = false;
  activeTab: string = 'profile';
  private router = inject(Router);
  fullName: string = '';
  isLoading: boolean = false;
  private profileSubscription: Subscription | null = null;

  constructor(private profileService: PatientProfileService) {}
  
  ngOnInit(): void {
    // Subscribe to profile changes
    this.profileSubscription = this.profileService.currentProfile$.subscribe(profile => {
      if (profile) {
        this.fullName = profile.fullName;
        this.selectedImage = profile.profilePicture || null;
        console.log('Profile updated in component:', profile);
      }
    });
    
    // Load profile data if available
    const currentProfile = this.profileService.getCurrentProfile();
    if (currentProfile) {
      this.fullName = currentProfile.fullName;
      this.selectedImage = currentProfile.profilePicture || null;
    } else {
      // Fetch from server if not in local state
      this.fetchProfileFromServer();
    }
  }
  
  ngOnDestroy(): void {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }
  
  fetchProfileFromServer(): void {
    this.isLoading = true;
    this.profileService.fetchLatestProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        console.log('Fetched profile from server:', profile);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching profile:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  async logout(): Promise<void> {
    localStorage.clear();
    this.router.navigate(['/mobile/login']);
  }
}
