import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { LicenseService, License } from '../../../shared/services/license.service';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-subscription-confirmation',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [
    {
      provide: LicenseService,
      useFactory: () => new LicenseService(inject(HttpClient))
    }
  ],
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

  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly licenseService: LicenseService = inject(LicenseService);

  constructor() {}

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

    // Get user info from local storage
    const email = localStorage.getItem('userEmail');
    const subscriptionType = localStorage.getItem('subscriptionType') || 'standard';

    // Validate required data
    if (!email) {
      this.error = 'User email not found. Please try logging in again.';
      this.loading = false;
      return;
    }

    // Validate user count
    if (isNaN(userCount) || userCount <= 0) {
      this.error = 'Invalid user count. Please select a valid number of users.';
      this.loading = false;
      return;
    }
    
    // Call the license generation API
    this.licenseService.generateLicense(userCount, email, subscriptionType).subscribe({
      next: (response: License) => {
        if (!response.licenseKey) {
          this.error = 'Invalid license response from server';
          this.loading = false;
          return;
        }

        this.licenseKey = response.licenseKey;
        this.totalUsers = response.totalUsers;
        this.remainingUsers = response.totalUsers - response.usedUsers;
        
        // Store license info
        localStorage.setItem('licenseKey', response.licenseKey);
        localStorage.setItem('licenseCreatedAt', response.createdAt.toString());
        
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('License generation error:', error);
        
        // Handle specific error cases
        if (error.status === 400) {
          this.error = 'Invalid request. Please check your input and try again.';
        } else if (error.status === 401) {
          this.error = 'Authentication required. Please log in again.';
        } else if (error.status === 403) {
          this.error = 'You do not have permission to generate a license.';
        } else {
          this.error = 'Failed to generate license key. Please try again.';
        }
        
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
