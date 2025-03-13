import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { LicenseService } from '../../shared/services/license.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-subscription-confirmation',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './subscription-confirmation.component.html',
  styleUrls: ['./subscription-confirmation.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class SubscriptionConfirmationComponent implements OnInit {
  licenseKey: string = '';
  totalUsers: number = 0;
  remainingUsers: number = 0;
  copied: boolean = false;
  loading: boolean = true;
  error: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private licenseService: LicenseService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const userCount = params['userCount'];
      if (userCount) {
        this.generateLicense(parseInt(userCount));
      } else {
        this.error = 'User count not provided';
        this.loading = false;
      }
    });
  }

  generateLicense(userCount: number) {
    this.loading = true;
    this.error = '';
    
    // Get email from practice data
    const practiceData = JSON.parse(localStorage.getItem('practiceData') || '{}');
    const email = practiceData.email;
    
    // Get subscription type from subscription data
    const subscriptionData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
    const subscriptionType = subscriptionData.type || 'trial';

    if (!email) {
      this.error = 'Practice information not found';
      this.loading = false;
      return;
    }

    this.licenseService.generateLicense(userCount, email, subscriptionType).subscribe({
      next: (response) => {
        this.licenseKey = response.licenseKey;
        this.totalUsers = response.totalUsers;
        this.remainingUsers = response.totalUsers - response.usedUsers;
        localStorage.setItem('licenseKey', response.licenseKey);
        localStorage.setItem('licenseCreatedAt', response.createdAt.toString());
        this.loading = false;
      },
      error: (error) => {
        console.error('License generation error:', error);
        this.error = 'Failed to generate license key. Please try again.';
        this.loading = false;
      }
    });
  }

  copyLicenseKey() {
    if (this.licenseKey) {
      navigator.clipboard.writeText(this.licenseKey);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }
  }

  retryGeneration() {
    if (this.totalUsers > 0) {
      this.generateLicense(this.totalUsers);
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
