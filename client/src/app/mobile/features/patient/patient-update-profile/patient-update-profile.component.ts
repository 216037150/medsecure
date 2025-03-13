import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { RouterLink } from '@angular/router';
import { PatientProfileService, PatientProfile } from '../services/patient-profile.service';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-update-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BackButtonComponent, RouterLink, HttpClientModule],
  templateUrl: './patient-update-profile.component.html',
  styleUrls: ['./patient-update-profile.component.css']
})
export class PatientUpdateProfileComponent implements OnInit {
  profileImage: string | ArrayBuffer | null = null;
  selectedImage: string | null = null; 
  showSuccessModal: boolean = false;
  isLoading: boolean = false;

  profileData: PatientProfile = {
    fullName: '',
    phoneNumber: '',
    email: ''
  };

  constructor(
    private router: Router,
    private profileService: PatientProfileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load existing profile data if available
    const currentProfile = this.profileService.getCurrentProfile();
    if (currentProfile) {
      this.profileData = { ...currentProfile };
      this.selectedImage = currentProfile.profilePicture || null;
    } else {
      // If no profile data, try to get it from auth service
      this.authService.getCurrentUser().then(user => {
        if (user) {
          const userInfo = this.authService.getUserInfo();
          this.profileData = {
            fullName: user.displayName,
            email: user.email,
            phoneNumber: userInfo?.phoneNumber || '',
            profilePicture: user.profileImage || undefined
          };
          this.selectedImage = user.profileImage;
        }
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.selectedImage = base64Image;
        console.log('Image loaded as base64');
        
        // Update profile data with the new image
        if (this.profileData) {
          this.profileData.profilePicture = base64Image;
          
          // Show loading state
          this.isLoading = true;
          
          // Update profile picture immediately
          this.profileService.updateProfilePicture(base64Image).subscribe({
            next: (updatedProfile) => {
              console.log('Profile picture updated successfully:', updatedProfile);
              // Update auth service data to keep everything in sync
              this.authService.updateUserInfoFromProfile(updatedProfile);
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Failed to update profile picture', error);
              this.isLoading = false;
              alert('Failed to update profile picture. Please try again.');
            }
          });
        }
      };
      reader.onerror = () => {
        alert('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  updateProfile(): void {
    this.isLoading = true;
    
    // Update profile using ProfileService
    this.profileService.updateProfile(this.profileData).subscribe({
      next: (updatedProfile) => {
        console.log('Profile updated successfully:', updatedProfile);
        
        // Also update auth service data to keep everything in sync
        this.authService.updateUserInfoFromProfile(updatedProfile);
        
        this.isLoading = false;
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isLoading = false;
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/mobile/patient-dashboard']);
  }
}