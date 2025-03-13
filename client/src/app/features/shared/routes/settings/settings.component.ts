import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LicenseService } from '../../services/license.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  showLicenseModal: boolean = false;
  showUnsubscribeModal: boolean = false;
  licenseKey: string = '';
  daysUntilExpiry: number = 30;
  error: string = '';

  constructor(
    private router: Router,
    private licenseService: LicenseService
  ) {
    // Initialize license data in constructor
    const storedLicenseKey = localStorage.getItem('licenseKey');
    if (storedLicenseKey) {
      this.licenseKey = storedLicenseKey;
      this.licenseService.getLicenseDetails(storedLicenseKey).subscribe({
        next: (license) => {
          this.licenseKey = license.licenseKey;
          const createdAt = new Date(license.createdAt);
          const expiryDate = new Date(createdAt);
          expiryDate.setDate(expiryDate.getDate() + 30);
          const today = new Date();
          const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
          this.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        },
        error: (error) => {
          this.error = 'Failed to fetch license details';
        }
      });
    }
  }

  ngOnInit() {}

  // Profile Settings Methods
  navigateToDoctor() {
    this.router.navigate(['/doctor-information']);
  }

  // Security Methods
  changePassword() {
    this.router.navigate(['/change-password']);
  }

  // License Methods
  viewLicense() {
    this.showLicenseModal = true;
    const storedLicenseKey = localStorage.getItem('licenseKey');
    const storedCreatedAt = localStorage.getItem('licenseCreatedAt');
    
    if (storedLicenseKey && storedCreatedAt) {
      this.licenseKey = storedLicenseKey;
      // Calculate days until expiry (30 days from creation)
      const createdAt = new Date(storedCreatedAt);
      const expiryDate = new Date(createdAt);
      expiryDate.setDate(expiryDate.getDate() + 30);
      const today = new Date();
      const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
      this.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      this.error = 'No active license found. Please subscribe to get a license key.';
      // Add a button to navigate to subscription page
      setTimeout(() => {
        this.closeLicenseModal();
        this.router.navigate(['/subscription']);
      }, 2000);
    }
  }

  closeLicenseModal() {
    this.showLicenseModal = false;
    this.error = '';
  }

  copyLicenseKey() {
    navigator.clipboard.writeText(this.licenseKey);
  }

  renewLicense() {
    this.router.navigate(['/subscription']);
  }

  // Unsubscribe Methods
  showUnsubscribeConfirmation() {
    this.showUnsubscribeModal = true;
  }

  closeUnsubscribeModal() {
    this.showUnsubscribeModal = false;
  }

  confirmUnsubscribe() {
    // TODO: Implement unsubscribe logic
    localStorage.clear(); // Clear all stored data
    this.router.navigate(['/']);
  }

  logout() {
    // TODO: Implement logout logic
    this.router.navigate(['/']);
  }
}
