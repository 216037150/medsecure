import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { ErrorModalComponent } from '../../../../shared/components/error-modal/error-modal.component';
import { DoctorService } from '../../../doctor/services/doctor.service';
import { Db } from '../../../../db';
import { DoctorType, UserType } from '../../../../type';

interface UserInfo {
  name: string;
  email: string;
  role: string;
  id?: string;
  doctorId?: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HttpClientModule,
    ErrorModalComponent
  ],
  providers: [AuthService, DoctorService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  showErrorModal = false;
  errorModalTitle = '';
  errorModalMessage = '';
  errorModalAction = '';
  selectedRole = 'doctor'; // Desktop app is always for doctors
  emailTouched = false;
  emailErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private doctorService: DoctorService,
    private db: Db
  ) {
    this.registerForm = this.fb.group({
      fullname: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z]+ [a-zA-Z]+/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.validEmailDomainValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
      ]],
      confirmPassword: ['', Validators.required],
      specialty: [''],
      medicalLicenseNumber: ['']
    }, {
      validators: this.passwordMatchValidator
    });

    // Reset error states when email changes
    this.registerForm.get('email')?.valueChanges.subscribe(() => {
      this.errorMessage = '';
      this.showErrorModal = false;
      if (this.emailTouched) {
        this.updateEmailErrorMessage();
      }
    });
  }

  ngOnInit(): void {
    // // Check if user is already logged in
    // if (this.authService.isAuthenticated()) {
    //   const userInfo = this.authService.getUserInfo();
    //   if (userInfo) {
    //     console.log('User already logged in:', userInfo);
    //     this.redirectBasedOnRole(userInfo.role);
    //   }
    // }
  }

  redirectBasedOnRole(role: string): void {
    // Navigate based on role
    switch (role.toLowerCase()) {
      case 'doctor':
        // For doctors, check if they're newly registered or already have a profile
        const userInfo = this.authService.getUserInfo();
        if (userInfo && userInfo.specialization) {
          // If they already have a specialization set, they've completed their profile
          this.router.navigate(['/dashboard']);
        } else {
          // If they're newly registered, redirect to complete their profile
          this.router.navigate(['/doctors-profile']);
        }
        break;
      case 'patient':
        this.router.navigate(['/patient-dashboard']);
        break;
      case 'receptionist':
        this.router.navigate(['/receptionist']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        console.error('Unknown role:', role);
        this.errorMessage = 'Invalid user role';
    }
  }

  validEmailDomainValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value;
      if (!email) {
        return null;
      }

      // Basic email pattern check
      const basicEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!basicEmailPattern.test(email)) {
        return { invalidEmailFormat: true };
      }

      // Check for common domain extensions
      const domainPart = email.split('@')[1];
      if (!domainPart) {
        return { invalidDomain: true };
      }

      // Check if TLD has valid format (2-63 characters)
      const tld = domainPart.split('.').pop();
      if (!tld || tld.length < 2 || tld.length > 63) {
        return { invalidTLD: true };
      }

      // Check for common invalid TLDs that users might make up
      const invalidTLDPatterns = [
        /com[a-z]{1,}$/,     // catches commmm, commss, etc.
        /co[a-z]{3,}$/,      // catches coooom, cooooza, etc.
        /org[a-z]{1,}$/,     // catches orggg, etc.
        /net[a-z]{1,}$/      // catches nettt, etc.
      ];

      for (const pattern of invalidTLDPatterns) {
        if (pattern.test(tld)) {
          return { invalidTLD: true };
        }
      }

      return null;
    };
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  showDuplicateEmailError() {
    this.errorModalTitle = 'Email Already Registered';
    this.errorModalMessage = 'An account with this email already exists. Would you like to login instead?';
    this.errorModalAction = 'Go to Login';
    this.showErrorModal = true;
  }

  onEmailBlur() {
    this.emailTouched = true;
    this.updateEmailErrorMessage();
  }

  updateEmailErrorMessage() {
    const emailControl = this.registerForm.get('email');
    if (emailControl && emailControl.errors && this.emailTouched) {
      if (emailControl.errors['required']) {
        this.emailErrorMessage = 'Email is required';
      } else if (emailControl.errors['email']) {
        this.emailErrorMessage = 'Please enter a valid email address';
      } else if (emailControl.errors['invalidEmailFormat']) {
        this.emailErrorMessage = 'Please enter a valid email address';
      } else if (emailControl.errors['invalidDomain']) {
        this.emailErrorMessage = 'Invalid email domain';
      } else if (emailControl.errors['invalidTLD']) {
        this.emailErrorMessage = 'The email extension you entered appears to be invalid. Please use a valid email address (e.g., user@example.com)';
      } else {
        this.emailErrorMessage = 'Please enter a valid email address';
      }
    } else {
      this.emailErrorMessage = '';
    }
  }

  onModalClose() {
    this.showErrorModal = false;
    this.errorMessage = '';
    // Reset the email field to force user to enter a different email
    this.registerForm.patchValue({ email: '' });
    this.registerForm.get('email')?.markAsUntouched();
    this.emailTouched = false;
    this.emailErrorMessage = '';
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  onSubmit() {
    if (this.showErrorModal) {
      return; // Don't proceed if error modal is showing
    }

    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
    this.emailTouched = true;
    this.updateEmailErrorMessage();

    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = this.registerForm.value;
      const names = formValue.fullname.split(' ');

      // Extract first and last name properly
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      // Check if email already exists
      const existingUser = this.db.userTable().find(user => user.email === formValue.email);
      if (existingUser) {
        this.loading = false;
        this.showDuplicateEmailError();
        return;
      }

      // Create user object for Db
      const userId = this.db.generateId();
      const newUser: UserType = {
        id: userId,
        firstname: firstName,
        lastname: lastName,
        email: formValue.email,
        password: formValue.password,
        role: 'DOCTOR' // Always set to DOCTOR for desktop app
      };

      // Register user in Db
      this.db.register(newUser);

      // Create doctor profile
      const doctorId = userId; // For doctors, user_id is the same as doctor_id
      const newDoctor: DoctorType = {
        id: doctorId,
        bio: '',
        image: '',
        hospitalname: '',
        qualification: formValue.medicalLicenseNumber || '',
        specialisation: formValue.specialty || '',
        contact: '',
        paymentPlan: '',
        user_id: userId
      };

      // Add doctor to Db
      this.db.addNewDoctor(newDoctor);

      console.log('Registration successful with local DB:', newUser);

      // Create user info object for AuthService
      const userInfo: UserInfo = {
        name: formValue.fullname,
        email: formValue.email,
        role: 'doctor', // Always set to doctor for desktop app
        id: userId,
        doctorId: doctorId,
        firstName: firstName,
        lastName: lastName
      };

      // Save user info to localStorage using the AuthService
      this.authService.saveUserInfo(userInfo);

      // Verify that user info was saved to localStorage
      const savedUserInfo = localStorage.getItem('med_secure_user_info');
      console.log('User info saved to localStorage:', savedUserInfo);

      // Navigate to doctor profile page
      this.router.navigate(['/doctors-profile']);
      this.loading = false;
    } else {
      const controls = this.registerForm.controls;
      if (controls['fullname'].errors) {
        this.errorMessage = controls['fullname'].errors['pattern'] ?
          'Please enter both your first and last name' : 'Full name is required';
      } else if (controls['email'].errors) {
        // Email errors are now handled by the updateEmailErrorMessage method
        this.updateEmailErrorMessage();
      } else if (controls['password'].errors) {
        this.errorMessage = controls['password'].errors['required'] ?
          'Password is required' : 'Password must be at least 6 characters long';
      } else if (controls['confirmPassword'].errors) {
        this.errorMessage = controls['confirmPassword'].errors['passwordMismatch'] ?
          'Passwords do not match' : 'Please confirm your password';
      } else {
        this.errorMessage = 'Please fill in all required fields correctly';
      }
    }
  }
}
