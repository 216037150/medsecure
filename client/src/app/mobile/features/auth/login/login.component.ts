import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent2 {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });

    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          
          // Check if we have a patient ID before navigating
          const patientId = this.authService.getPatientId();
          if (!patientId && response.role === 'PATIENT' && (response.id || response.userId)) {
            // For patients, if no explicit patientId, use the userId/id as patientId
            const userId = response.id || response.userId || '';
            if (userId) {
              // Store the patient ID in both formats for compatibility
              localStorage.setItem('patient_id', userId);
              localStorage.setItem('med_secure_patient_id', userId);
              console.log('Patient ID set from user ID in login component:', userId);
            }
          } else if (patientId) {
            // Ensure we also store the patient ID in the format expected by the medical records service
            localStorage.setItem('med_secure_patient_id', patientId);
            console.log('Patient ID set in med_secure_patient_id:', patientId);
          }
          
          // Verify that user info is saved to localStorage
          const userInfo = localStorage.getItem('user_info');
          if (userInfo) {
            console.log('User info successfully saved to localStorage:', JSON.parse(userInfo));
          } else {
            console.warn('User info not found in localStorage after login');
          }
          
          this.router.navigate(['/mobile/patient-dashboard']);
        },
        error: (error) => {
          console.error('Login failed', error);
          this.errorMessage = typeof error === 'string' ? error : "Incorrect email or password.";
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
      if (this.loginForm.get('email')?.errors) {
        this.errorMessage = this.getEmailErrorMessage();
      } else if (this.loginForm.get('password')?.errors) {
        this.errorMessage = this.getPasswordErrorMessage();
      }
    }
  }

  getEmailErrorMessage() {
    const email = this.loginForm.controls['email'];
    if (email.hasError('required')) return 'Email is required.';
    if (email.hasError('email')) return 'Invalid email format.';
    return '';
  }

  getPasswordErrorMessage() {
    const password = this.loginForm.controls['password'];
    if (password.hasError('required')) return 'Password is required.';
    if (password.hasError('minlength')) return 'Password must be at least 6 characters.';
    return '';
  }
}
