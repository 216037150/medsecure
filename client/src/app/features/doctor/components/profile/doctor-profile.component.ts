import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService, ProfileUpdateResponse } from "../../../../features/auth/services/auth.service";
import { ProfileUpdateService } from "../../../../features/shared/services/profile-update.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";

@Component({
  selector: "app-doctor-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./doctor-profile.component.html",
  styleUrls: ["./doctor-profile.component.css"],
})
export class DoctorProfileComponent implements OnInit {
  fullName = "";
  email = "";
  phoneNumber = "";
  specialization = "";
  hospitalAffiliations: string[] = [];
  bio = "";
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  qualifications: string[] = [];
  newQualification: string = '';
  newHospitalAffiliation: string = '';
  services: string[] = [];
  newService: string = '';
  showSuccessModal = false;
  isSubmitting = false; // Track form submission attempt
  private baseUrl = environment.apiUrl + '/api';

  constructor(
    private authService: AuthService,
    private router: Router,
    private profileUpdateService: ProfileUpdateService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Get user info from auth service
    const userInfo = this.authService.getUserInfo();
    console.log('User info retrieved in doctor profile:', userInfo);
    
    // Get the doctor ID from local storage
    const doctorId = this.authService.getDoctorId();
    console.log('Doctor ID from local storage:', doctorId);
    
    if (doctorId) {
      // Fetch the doctor's details from the backend
      this.fetchDoctorDetails(doctorId);
    } else if (userInfo) {
      // Fallback to user info if doctor details can't be fetched
      this.initializeFromUserInfo(userInfo);
    } else {
      console.warn('No user info or doctor ID available for doctor profile');
    }
  }
  
  private fetchDoctorDetails(doctorId: string) {
    console.log('Fetching doctor details for ID:', doctorId);
    this.http.get(`${this.baseUrl}/doctors/${doctorId}`).subscribe({
      next: (response: any) => {
        console.log('Doctor details fetched successfully:', response);
        
        // Update the profile with the fetched doctor details
        this.fullName = `${response.firstName || ''} ${response.lastName || ''}`.trim();
        this.email = response.email || '';
        this.phoneNumber = response.phoneNumber || '';
        this.specialization = response.specialization || '';
        
        // Handle hospital affiliations
        if (response.hospitalAffiliations) {
          if (typeof response.hospitalAffiliations === 'string') {
            this.hospitalAffiliations = response.hospitalAffiliations.split(';').map((s: string) => s.trim());
          } else if (Array.isArray(response.hospitalAffiliations)) {
            this.hospitalAffiliations = response.hospitalAffiliations;
          }
        }
        
        // Handle education details as qualifications
        if (response.educationDetails) {
          if (typeof response.educationDetails === 'string') {
            this.qualifications = response.educationDetails.split(';').map((s: string) => s.trim());
          } else if (Array.isArray(response.educationDetails)) {
            this.qualifications = response.educationDetails;
          }
        }
        
        // Handle certifications as services
        if (response.certifications) {
          if (typeof response.certifications === 'string') {
            this.services = response.certifications.split(';').map((s: string) => s.trim());
          } else if (Array.isArray(response.certifications)) {
            this.services = response.certifications;
          }
        }
        
        this.bio = response.bio || '';
        
        // Set profile picture if available
        if (response.profilePicture) {
          this.imagePreview = response.profilePicture;
        }
        
        console.log('Doctor profile initialized with fetched data:', {
          fullName: this.fullName,
          email: this.email,
          phoneNumber: this.phoneNumber,
          specialization: this.specialization,
          hospitalAffiliations: this.hospitalAffiliations,
          qualifications: this.qualifications,
          services: this.services,
          bio: this.bio,
          hasProfilePicture: !!this.imagePreview
        });
      },
      error: (error) => {
        console.error('Error fetching doctor details:', error);
        
        // Fallback to user info if doctor details can't be fetched
        const userInfo = this.authService.getUserInfo();
        if (userInfo) {
          this.initializeFromUserInfo(userInfo);
        }
      }
    });
  }
  
  private initializeFromUserInfo(userInfo: any) {
    // Handle full name - ensure it's properly formatted
    this.fullName = userInfo.name || '';
    
    // If name is empty but we have firstName and lastName in the response, use those
    if (!this.fullName && userInfo.firstName && userInfo.lastName) {
      this.fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    }
    
    this.email = userInfo.email || '';
    this.phoneNumber = userInfo.phoneNumber || '';
    this.specialization = userInfo.specialization || '';
    
    // Ensure arrays are properly initialized
    if (Array.isArray(userInfo.hospitalAffiliations)) {
      this.hospitalAffiliations = userInfo.hospitalAffiliations;
    } else if (typeof userInfo.hospitalAffiliations === 'string') {
      this.hospitalAffiliations = userInfo.hospitalAffiliations.split(',').map((s: string) => s.trim());
    } else {
      this.hospitalAffiliations = [];
    }
    
    if (Array.isArray(userInfo.qualifications)) {
      this.qualifications = userInfo.qualifications;
    } else if (typeof userInfo.qualifications === 'string') {
      this.qualifications = userInfo.qualifications.split(',').map((s: string) => s.trim());
    } else {
      this.qualifications = [];
    }
    
    if (Array.isArray(userInfo.services)) {
      this.services = userInfo.services;
    } else if (typeof userInfo.services === 'string') {
      this.services = userInfo.services.split(',').map((s: string) => s.trim());
    } else {
      this.services = [];
    }
    
    this.bio = userInfo.bio || '';
    
    // Set profile picture if available
    if (userInfo.profilePicture) {
      this.imagePreview = userInfo.profilePicture;
    }
    
    console.log('Doctor profile initialized with user info data:', {
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      specialization: this.specialization,
      hospitalAffiliations: this.hospitalAffiliations,
      qualifications: this.qualifications,
      services: this.services,
      bio: this.bio,
      hasProfilePicture: !!this.imagePreview
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image is too large. Maximum size is 2MB.');
        return;
      }
      
      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        alert('Only image files (JPEG, PNG, GIF) are allowed.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        console.log('Image loaded as base64');
        
        // Automatically update profile picture when selected
        this.updateProfilePicture();
      };
      reader.readAsDataURL(file);
    }
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  addQualification() {
    if (this.newQualification.trim()) {
      this.qualifications.push(this.newQualification.trim());
      this.newQualification = '';
      this.updateUserInfo();
    }
  }

  removeQualification(index: number) {
    this.qualifications.splice(index, 1);
    this.updateUserInfo();
  }

  addHospitalAffiliation() {
    if (this.newHospitalAffiliation.trim()) {
      this.hospitalAffiliations.push(this.newHospitalAffiliation.trim());
      this.newHospitalAffiliation = '';
      this.updateUserInfo();
    }
  }

  removeHospitalAffiliation(index: number) {
    this.hospitalAffiliations.splice(index, 1);
    this.updateUserInfo();
  }

  addService() {
    if (this.newService.trim()) {
      this.services.push(this.newService.trim());
      this.newService = '';
      this.updateUserInfo();
    }
  }

  removeService(index: number) {
    this.services.splice(index, 1);
    this.updateUserInfo();
  }

  private updateUserInfo() {
    const currentUserInfo = this.authService.getUserInfo();
    if (!currentUserInfo) {
      console.error('No existing user info found');
      return;
    }

    const userInfo = {
      ...currentUserInfo, // Preserve all existing fields
      name: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      specialization: this.specialization,
      profilePicture: this.imagePreview,
      hospitalAffiliations: this.hospitalAffiliations,
      qualifications: this.qualifications,
      bio: this.bio,
      services: this.services
    };

    console.log('Updating local user info:', userInfo);
    this.authService.saveUserInfo(userInfo);
  }

  updateProfilePicture() {
    if (!this.imagePreview) {
      console.error('No image selected');
      return;
    }
    
    console.log('Updating profile picture with base64 data:', this.imagePreview.substring(0, 50) + '...');
    
    this.authService.updateProfilePicture(this.imagePreview).subscribe({
      next: (response) => {
        console.log('Profile picture updated successfully:', response);
        
        // Update local user info with the new profile picture
        const currentUserInfo = this.authService.getUserInfo();
        if (currentUserInfo) {
          const updatedUserInfo = {
            ...currentUserInfo,
            profilePicture: this.imagePreview
          };
          this.authService.saveUserInfo(updatedUserInfo);
        }
        
        // Notify other components about the profile picture update
        this.profileUpdateService.notifyProfileUpdate({ profilePicture: this.imagePreview });
      },
      error: (error) => {
        console.error('Error updating profile picture:', error);
        alert(`Error updating profile picture: ${error.message}`);
      }
    });
  }

  proceedToSubscription() {
    // Mark form as submitting to trigger validation UI
    this.isSubmitting = true;
    
    // Check if required fields are filled
    if (!this.fullName || !this.email || !this.phoneNumber || !this.specialization) {
      console.error('Required fields are missing');
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Update all user info before proceeding
    this.updateUserInfo();
    
    // Get current user info to preserve role and other important fields
    const currentUserInfo = this.authService.getUserInfo();
    if (!currentUserInfo) {
      console.error('No existing user info found');
      return;
    }
    
    // Debug doctor ID
    const doctorId = this.authService.getDoctorId();
    console.log('Doctor ID from auth service:', doctorId);
    console.log('Current user info:', currentUserInfo);
    
    if (!doctorId) {
      console.error('Doctor ID not found, cannot update profile');
      return;
    }
    
    // Create profile data object as JSON that matches DoctorProfileDTO
    const profileData = {
      firstName: this.fullName.split(' ')[0],
      lastName: this.fullName.split(' ').slice(1).join(' '),
      specialization: this.specialization,
      contactNumber: this.phoneNumber,
      bio: this.bio || '',
      education: this.qualifications.join(', '),
      experience: this.hospitalAffiliations.join(', '),
      awards: '',
      officeAddress: '',
      officeHours: '',
      services: this.services.join(', ') // Add services to the profile data
    };
    
    console.log('Sending profile data to backend:', profileData);
    
    // First update the profile data
    this.authService.updateProfile(profileData).subscribe({
      next: (response: ProfileUpdateResponse) => {
        console.log('Profile updated successfully:', response);
        
        // Then update the profile picture if it exists
        if (this.imagePreview) {
          this.authService.updateProfilePicture(this.imagePreview).subscribe({
            next: (pictureResponse) => {
              console.log('Profile picture updated successfully:', pictureResponse);
              this.completeProfileUpdate(currentUserInfo, response);
              
              // Immediately update the dashboard without waiting for navigation
              this.refreshDashboard();
            },
            error: (error) => {
              console.error('Error updating profile picture:', error);
              // Still complete the profile update even if picture update fails
              this.completeProfileUpdate(currentUserInfo, response);
              
              // Immediately update the dashboard without waiting for navigation
              this.refreshDashboard();
            }
          });
        } else {
          this.completeProfileUpdate(currentUserInfo, response);
          
          // Immediately update the dashboard without waiting for navigation
          this.refreshDashboard();
        }
      },
      error: (error: Error) => {
        console.error('Error updating profile:', error);
        // Show detailed error message to user
        alert(`Error updating profile: ${error.message}. Proceeding to subscription anyway.`);
        // Still navigate to subscription even if update fails
        this.router.navigate(['/subscription']);
      }
    });
  }
  
  // Helper method to complete the profile update process
  private completeProfileUpdate(currentUserInfo: any, response: ProfileUpdateResponse) {
    // Parse services from string to array if it exists in the response
    let servicesArray = this.services; // Default to component's services
    if (response.services) {
      if (typeof response.services === 'string') {
        servicesArray = response.services.split(',').map((s: string) => s.trim());
      } else if (Array.isArray(response.services)) {
        servicesArray = response.services;
      }
    }
    
    const updatedUserInfo = {
      ...currentUserInfo,
      name: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      specialization: this.specialization,
      profilePicture: this.imagePreview,
      hospitalAffiliations: this.hospitalAffiliations,
      qualifications: this.qualifications,
      bio: this.bio,
      services: servicesArray
    };
    this.authService.saveUserInfo(updatedUserInfo);
    
    // Notify other components about the profile update with comprehensive data
    this.profileUpdateService.notifyProfileUpdate({
      profilePicture: this.imagePreview,
      name: this.fullName,
      specialization: this.specialization,
      bio: this.bio
    });
    
    // Show success modal
    this.showSuccessModal = true;
  }

  // New method to refresh the dashboard
  private refreshDashboard() {
    // Trigger a comprehensive dashboard update with all profile data
    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      this.profileUpdateService.notifyProfileUpdate({
        profilePicture: this.imagePreview,
        name: this.fullName,
        specialization: this.specialization,
        bio: this.bio
      });
    }
  }

  // Reset validation state when input changes
  onInputChange() {
    if (this.isSubmitting) {
      this.isSubmitting = false;
    }
  }

  closeModalAndProceed() {
    this.showSuccessModal = false;
    this.router.navigate(['/subscription']);
  }
}
