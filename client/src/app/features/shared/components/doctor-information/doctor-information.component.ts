import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../auth/services/auth.service";
import { ProfileUpdateService } from "../../services/profile-update.service";
import { trigger, transition, style, animate } from "@angular/animations";
import { SuccessDialogComponent } from "../../components/success-dialog/success-dialog.component";

@Component({
  selector: "app-doctor-information",
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessDialogComponent],
  providers: [AuthService, ProfileUpdateService],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('tagAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <!-- Success Dialog -->
      <app-success-dialog
        *ngIf="showSuccessDialog"
        [title]="'Success!'"
        [message]="'Your profile has been updated successfully.'"
        (closed)="onSuccessDialogClosed()"
      ></app-success-dialog>
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="doctor-info-container" @fadeIn>
          <header class="header" @slideIn>
            <button class="back-button" (click)="goBack()">
              <i class="bi bi-arrow-left"></i> Back to Settings
            </button>
            <h1>Doctor Information</h1>
            <p>Update your personal and professional details</p>
          </header>
          
          <div class="form-content">
            <!-- Profile Photo Section -->
            <div class="photo-section">
              <div class="photo-upload">
                <div class="image-preview" [class.has-image]="imagePreview">
                  <img *ngIf="imagePreview" [src]="imagePreview" alt="Profile preview">
                  <div *ngIf="!imagePreview" class="upload-placeholder">
                    <i class="bi bi-person-fill"></i>
                  </div>
                </div>
                <input 
                  type="file"
                  accept="image/*"
                  (change)="onImageSelected($event)"
                  #fileInput
                  style="display: none"
                >
                <button class="upload-button" (click)="fileInput.click()">
                  {{ imagePreview ? 'Change Photo' : 'Upload Photo' }}
                </button>
              </div>
            </div>
            
            <!-- Form Fields Section -->
            <div class="form-section" @slideIn>
              <div class="grid-container">
                <!-- Basic Information -->
                <div class="input-group">
                  <label for="fullName">Full Name</label>
                  <input 
                    type="text" 
                    id="fullName"
                    [(ngModel)]="fullName" 
                    placeholder="Full Name"
                    autocomplete="name"
                  >
                </div>
                
                <div class="input-group">
                  <label for="email">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    [(ngModel)]="email" 
                    placeholder="Email Address"
                    autocomplete="email"
                  >
                </div>
                
                <div class="input-group">
                  <label for="phoneNumber">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phoneNumber"
                    [(ngModel)]="phoneNumber" 
                    placeholder="Phone Number"
                    autocomplete="tel"
                  >
                </div>
                
                <div class="input-group">
                  <label for="specialization">Specialization</label>
                  <input 
                    type="text" 
                    id="specialization"
                    [(ngModel)]="specialization" 
                    placeholder="Specialization"
                  >
                </div>
                
                <!-- Bio Section - Full Width -->
                <div class="input-group full-width">
                  <label for="bio">Bio</label>
                  <textarea 
                    id="bio"
                    [(ngModel)]="bio" 
                    placeholder="Write a short bio about yourself, your experience, and expertise..."
                    rows="4"
                  ></textarea>
                </div>
                
                <!-- Hospital Affiliations - Full Width -->
                <div class="input-group full-width">
                  <label for="hospitalAffiliation">Hospital Affiliations</label>
                  <div class="tags-container">
                    <div 
                      class="tag" 
                      *ngFor="let affiliation of hospitalAffiliations; let i = index" 
                      @tagAnimation
                    >
                      {{ affiliation }}
                      <i class="bi bi-x" (click)="removeHospitalAffiliation(i)"></i>
                    </div>
                  </div>
                  <div class="add-tag">
                    <input 
                      type="text"
                      id="hospitalAffiliation"
                      [(ngModel)]="newHospitalAffiliation"
                      (keyup.enter)="addHospitalAffiliation()"
                      placeholder="Add hospital affiliation"
                    >
                    <button (click)="addHospitalAffiliation()">Add</button>
                  </div>
                </div>
                
                <!-- Practice Address - Full Width -->
                <div class="input-group full-width">
                  <label for="address">Practice Address</label>
                  <input 
                    type="text" 
                    id="address"
                    [(ngModel)]="address" 
                    placeholder="Practice Address"
                    autocomplete="address-line1"
                  >
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="action-buttons">
              <button class="save-button" (click)="saveChanges()">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./doctor-information.component.css']
})
export class DoctorInformationComponent implements OnInit {
  fullName = "";
  email = "";
  phoneNumber = "";
  specialization = "";
  bio = "";
  address = "";
  hospitalAffiliations: string[] = [];
  newHospitalAffiliation = "";
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  showSuccessDialog = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private profileUpdateService: ProfileUpdateService
  ) {}

  ngOnInit() {
    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      this.fullName = userInfo.name || '';
      this.email = userInfo.email || '';
      this.phoneNumber = userInfo.phoneNumber || '';
      this.specialization = userInfo.specialization || '';
      this.imagePreview = userInfo.profilePicture || null;
      this.bio = userInfo.bio || '';
      this.address = userInfo.address || '';
      
      // Handle hospitalAffiliations which can be string or string[]
      if (userInfo.hospitalAffiliations) {
        if (Array.isArray(userInfo.hospitalAffiliations)) {
          this.hospitalAffiliations = userInfo.hospitalAffiliations;
        } else if (typeof userInfo.hospitalAffiliations === 'string') {
          this.hospitalAffiliations = userInfo.hospitalAffiliations.split(',').map((s: string) => s.trim());
        } else {
          this.hospitalAffiliations = [];
        }
      } else {
        this.hospitalAffiliations = [];
      }
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  addHospitalAffiliation() {
    if (this.newHospitalAffiliation.trim()) {
      this.hospitalAffiliations.push(this.newHospitalAffiliation.trim());
      this.newHospitalAffiliation = '';
    }
  }

  removeHospitalAffiliation(index: number) {
    this.hospitalAffiliations.splice(index, 1);
  }

  async saveChanges() {
    try {
      // Get the doctor ID from auth service
      const doctorId = this.authService.getDoctorId();
      if (!doctorId) {
        console.error('Doctor ID not found');
        return;
      }
      
      // Create profile data object that matches the backend DTO
      const profileData = {
        firstName: this.fullName.split(' ')[0],
        lastName: this.fullName.split(' ').slice(1).join(' '),
        specialization: this.specialization,
        contactNumber: this.phoneNumber,
        bio: this.bio || '',
        officeAddress: this.address || '',
        officeHours: '',
        education: '',
        experience: this.hospitalAffiliations.join(', '),
        awards: ''
      };
      
      console.log('Sending profile data:', profileData);
      
      // First update the profile data
      this.authService.updateProfile(profileData).subscribe({
        next: (response) => {
          console.log('Profile updated successfully:', response);
          
          // Then update profile picture if we have a new one
          if (this.selectedImage && this.imagePreview) {
            this.updateProfilePicture(response);
          } else {
            this.completeProfileUpdate(response);
          }
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          // Handle error appropriately
          alert('Failed to update profile: ' + error.message);
        }
      });
    } catch (error) {
      console.error('Error in saveChanges:', error);
      alert('An unexpected error occurred');
    }
  }
  
  // Helper method to update profile picture
  private updateProfilePicture(profileResponse: any) {
    this.authService.updateProfilePicture(this.imagePreview!).subscribe({
      next: (pictureResponse) => {
        console.log('Profile picture updated successfully:', pictureResponse);
        this.completeProfileUpdate(profileResponse);
      },
      error: (pictureError) => {
        console.error('Error updating profile picture:', pictureError);
        // Still complete the profile update even if picture update fails
        this.completeProfileUpdate(profileResponse);
      }
    });
  }
  
  // Helper method to complete the profile update process
  private completeProfileUpdate(response: any) {
    // Notify profile update service about the changes
    this.profileUpdateService.notifyProfileUpdate({
      name: this.fullName,
      profilePicture: this.imagePreview
    });
    
    this.showSuccessDialog = true;
  }

  onSuccessDialogClosed() {
    this.showSuccessDialog = false;
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.clearUserInfo();
    this.router.navigate(['/login']);
  }

  goBack() {
    this.router.navigate(['/settings']);
  }
}
