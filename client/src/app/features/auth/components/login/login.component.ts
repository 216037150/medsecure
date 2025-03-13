import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { Db } from '../../../../db';
import { Storage } from '../../../../storage';
import { UserType } from '../../../../type';
import { CURRENT_DOCTOR } from '../../../../constant';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private db: Db,
    private storage: Storage
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in
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
        this.router.navigate(['/dashboard']);
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

  onSubmit() {
    // Mark all fields as touched to trigger validation messages
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });

    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      // Use the Db service for login
      const user = this.db.login(email, password);

      if (user) {
        this.loading = false;
        // Login successful
        console.log('Login successful with local DB:', user);

        if (user.role == 'DOCTOR') {
          this.storage.setItem<UserType>(CURRENT_DOCTOR, user);
          this.router.navigate(['/dashboard']);
          return;
        }

        this.loading = false;

        // Create user info object for AuthService
        // const userInfo = {
        //   name: `${user.firstname} ${user.lastname}`,
        //   email: user.email,
        //   role: user.role.toLowerCase(),
        //   id: user.id,
        //   doctorId: user.role === 'DOCTOR' ? user.id : undefined,
        //   firstName: user.firstname,
        //   lastName: user.lastname,
        // };

        // console.log({ email: userInfo.email });

        // // Save user info to localStorage using AuthService
        // this.authService.saveUserInfo(userInfo);

        // // Verify that user info was saved to localStorage
        // const savedUserInfo = localStorage.getItem('med_secure_user_info');
        // console.log('User info saved to localStorage:', savedUserInfo);

        // // Navigate based on role
        // this.redirectBasedOnRole(user.role);
        // this.loading = false;
      } else {
        // Login failed
        console.error('Login failed: Invalid credentials');
        this.errorMessage = 'Invalid email or password. Please try again.';
        this.loading = false;
      }
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
      if (this.loginForm.get('email')?.errors) {
        this.errorMessage = this.getEmailErrorMessage();
      } else if (this.loginForm.get('password')?.errors) {
        this.errorMessage = this.getPasswordErrorMessage();
      }
      this.loading = false;
    }
  }

  getEmailErrorMessage(): string {
    const email = this.loginForm.get('email');
    if (email?.hasError('required')) return 'Email is required';
    if (email?.hasError('email')) return 'Please enter a valid email address';
    return '';
  }

  getPasswordErrorMessage(): string {
    const password = this.loginForm.get('password');
    if (password?.hasError('required')) return 'Password is required';
    if (password?.hasError('minlength'))
      return 'Password must be at least 6 characters';
    return '';
  }
}
