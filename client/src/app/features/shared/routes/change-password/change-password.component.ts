import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { finalize } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="page-container" [@fadeIn]>
      <div class="change-password-container" [@fadeSlideInOut]>
        <div class="header">
          <button class="back-button" (click)="goBack()">
            <i class="bi bi-arrow-left"></i>
            <span>Back to Settings</span>
          </button>
          <h1>Change Password</h1>
          <p class="subtitle">Update your password to keep your account secure</p>
        </div>

        <div class="form-container">
          <form (ngSubmit)="onSubmit()" #passwordForm="ngForm" [@fadeSlideInOut]>
            <div class="form-group" [class.error]="currentPasswordError">
              <label for="currentPassword">
                <i class="bi bi-lock"></i>
                Current Password
              </label>
              <div class="password-input-container">
                <input
                  [type]="showCurrentPassword ? 'text' : 'password'"
                  id="currentPassword"
                  name="currentPassword"
                  [(ngModel)]="currentPassword"
                  required
                  #currentPasswordInput="ngModel"
                  class="form-control"
                  [class.is-invalid]="currentPasswordError"
                  (input)="clearErrors()">
                <button type="button" class="toggle-password" (click)="toggleCurrentPassword()">
                  <i [class]="showCurrentPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div class="error-message" *ngIf="currentPasswordError" [@fadeSlideInOut]>
                {{ currentPasswordError }}
              </div>
            </div>

            <div class="form-group">
              <label for="newPassword">
                <i class="bi bi-shield-lock"></i>
                New Password
              </label>
              <div class="password-input-container">
                <input
                  [type]="showNewPassword ? 'text' : 'password'"
                  id="newPassword"
                  name="newPassword"
                  [(ngModel)]="newPassword"
                  required
                  minlength="8"
                  #newPasswordInput="ngModel"
                  class="form-control"
                  [class.is-invalid]="newPasswordInput.invalid && newPasswordInput.touched"
                  (input)="validatePassword()">
                <button type="button" class="toggle-password" (click)="toggleNewPassword()">
                  <i [class]="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div class="password-strength" *ngIf="newPassword">
                <div class="strength-meter">
                  <div [class]="'strength-level ' + passwordStrength"></div>
                </div>
                <span class="strength-text">Password Strength: {{ passwordStrength | titlecase }}</span>
              </div>
              <div class="error-message" *ngIf="newPasswordInput.invalid && newPasswordInput.touched" [@fadeSlideInOut]>
                Password must be at least 8 characters long
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">
                <i class="bi bi-check-circle"></i>
                Confirm New Password
              </label>
              <div class="password-input-container">
                <input
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  name="confirmPassword"
                  [(ngModel)]="confirmPassword"
                  required
                  #confirmPasswordInput="ngModel"
                  class="form-control"
                  [class.is-invalid]="passwordMismatch && confirmPasswordInput.touched"
                  (input)="validatePassword()">
                <button type="button" class="toggle-password" (click)="toggleConfirmPassword()">
                  <i [class]="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div class="error-message" *ngIf="passwordMismatch && confirmPasswordInput.touched" [@fadeSlideInOut]>
                Passwords do not match
              </div>
            </div>

            <div class="button-container">
              <button
                type="submit"
                [disabled]="!passwordForm.form.valid || passwordMismatch || isLoading"
                class="submit-button"
                [class.loading]="isLoading">
                <span *ngIf="!isLoading">Change Password</span>
                <span *ngIf="isLoading" class="spinner"></span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      padding: 2rem;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .change-password-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      padding: 2.5rem;
      width: 100%;
      max-width: 500px;
      position: relative;
    }

    .header {
      margin-bottom: 2.5rem;
      text-align: center;
    }

    .header h1 {
      margin: 1rem 0 0.5rem;
      color: #2c3e50;
      font-size: 2rem;
      font-weight: 600;
    }

    .subtitle {
      color: #6c757d;
      margin-bottom: 0;
    }

    .back-button {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      background: none;
      border: none;
      color: #199A8E;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .back-button:hover {
      color: #147f75;
    }

    .form-group {
      margin-bottom: 1.5rem;
      position: relative;
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #495057;
      font-weight: 500;
    }

    .password-input-container {
      position: relative;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #199A8E;
      box-shadow: 0 0 0 3px rgba(25, 154, 142, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0.25rem;
    }

    .toggle-password:hover {
      color: #495057;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .password-strength {
      margin-top: 0.75rem;
    }

    .strength-meter {
      height: 4px;
      background: #e9ecef;
      border-radius: 2px;
      margin-bottom: 0.5rem;
    }

    .strength-level {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .strength-level.weak {
      width: 33.33%;
      background: #dc3545;
    }

    .strength-level.medium {
      width: 66.66%;
      background: #ffc107;
    }

    .strength-level.strong {
      width: 100%;
      background: #28a745;
    }

    .strength-text {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .button-container {
      margin-top: 2.5rem;
    }

    .submit-button {
      width: 100%;
      padding: 1rem;
      background-color: #199A8E;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .submit-button:hover:not(:disabled) {
      background-color: #147f75;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(25, 154, 142, 0.2);
    }

    .submit-button:disabled {
      background-color: #e9ecef;
      cursor: not-allowed;
    }

    .submit-button.loading {
      padding-right: 2.5rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spinner 0.8s linear infinite;
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
    }

    @keyframes spinner {
      to {
        transform: translateY(-50%) rotate(360deg);
      }
    }

    @media (max-width: 576px) {
      .page-container {
        padding: 1rem;
      }

      .change-password-container {
        padding: 1.5rem;
      }

      .header h1 {
        font-size: 1.5rem;
      }

      .back-button span {
        display: none;
      }
    }
  `]
})
export class ChangePasswordComponent {
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  currentPasswordError: string = '';
  isLoading: boolean = false;
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';

  constructor(
    private router: Router,
    @Inject(AuthService) private authService: AuthService
  ) {}

  get passwordMismatch(): boolean {
    return this.newPassword !== this.confirmPassword && this.confirmPassword !== '';
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  clearErrors() {
    this.currentPasswordError = '';
  }

  validatePassword() {
    if (!this.newPassword) {
      this.passwordStrength = 'weak';
      return;
    }

    const hasUpperCase = /[A-Z]/.test(this.newPassword);
    const hasLowerCase = /[a-z]/.test(this.newPassword);
    const hasNumbers = /\d/.test(this.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength === 3) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  goBack() {
    this.router.navigate(['/settings']);
  }

  onSubmit() {
    if (this.isLoading || this.passwordMismatch) {
      return;
    }

    this.isLoading = true;
    this.clearErrors();

    this.authService.verifyCurrentPassword(this.currentPassword).subscribe({
      next: () => {
        // Password verified, proceed with change
        this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
          next: () => {
            alert('Password changed successfully!');
            this.router.navigate(['/settings']);
          },
          error: (error: Error) => {
            this.currentPasswordError = error.message || 'Failed to change password. Please try again.';
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      },
      error: (error: Error) => {
        this.currentPasswordError = 'Current password is incorrect';
        this.isLoading = false;
      }
    });
  }
}
