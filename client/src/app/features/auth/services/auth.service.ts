import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Db } from '../../../db';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'doctor' | 'patient' | string;
  specialty?: string;
  medicalLicenseNumber?: string;
}

export interface RegisterResponse {
  userId?: string;
  message: string;
  success: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  message?: string;
  success: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  role: string;
  id?: string;
  doctorId?: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  specialization?: string;
  // Additional properties needed by other components
  profilePicture?: string | null;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  hospitalAffiliations?: string[] | string;
  educationDetails?: string[] | string;
  certifications?: string[] | string;
  qualifications?: string[] | string;
  services?: string[] | string;
  patientCount?: number;
}

export interface ProfileUpdateResponse {
  message: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  services?: string | string[];
  phoneNumber?: string;
  specialization?: string;
  bio?: string;
  address?: string;
  hospitalAffiliations?: string[] | string;
  qualifications?: string[] | string;
  profilePicture?: string | null;
  contactNumber?: string;
  education?: string;
  experience?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_INFO_KEY = 'med_secure_user_info';
  private readonly TOKEN_KEY = 'med_secure_token';
  // BehaviorSubject for authentication state
  private userInfoSubject = new BehaviorSubject<UserInfo | null>(null);
  public isAuthenticated$ = this.userInfoSubject.pipe(map(userInfo => !!userInfo));

  constructor(
    private http: HttpClient,
    private router: Router,
    private db: Db
  ) {
    // Auto login when service is initialized
    this.autoLogin();
  }

  /**
   * Register a new user
   * @param registerData The registration data
   * @returns Observable<RegisterResponse>
   */
  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    // Create a new user in the Db
    const userId = this.db.generateId();
    const newUser = {
      id: userId,
      firstname: registerData.firstName,
      lastname: registerData.lastName,
      email: registerData.email,
      password: registerData.password,
      role: registerData.role.toUpperCase() as 'DOCTOR' | 'PATIENT'
    };

    // Check if email already exists
    const existingUser = this.db.userTable().find(user => user.email === registerData.email);
    if (existingUser) {
      return throwError(() => ({ message: 'Email already exists', success: false }));
    }

    // Register user in Db
    this.db.register(newUser);

    // If user is a doctor, create doctor profile
    if (registerData.role.toUpperCase() === 'DOCTOR') {
      const doctorId = userId; // For doctors, user_id is the same as doctor_id
      const newDoctor = {
        id: doctorId,
        bio: '',
        image: '',
        hospitalname: '',
        qualification: registerData.medicalLicenseNumber || '',
        specialisation: registerData.specialty || '',
        contact: '',
        paymentPlan: '',
        user_id: userId
      };

      // Add doctor to Db
      this.db.addNewDoctor(newDoctor);
    }

    // Return success response
    return of({
      userId: userId,
      message: 'Registration successful',
      success: true
    });
  }

  /**
   * Login a user
   * @param loginData The login data
   * @returns Observable<LoginResponse>
   */
  login(email: string, password: string): Observable<LoginResponse> {
    // Use the Db service for login
    const user = this.db.login(email, password);
    
    if (user) {
      // Login successful
      const response: LoginResponse = {
        userId: user.id,
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role.toLowerCase(),
        success: true
      };

      // Save user info to localStorage
      const userInfo: UserInfo = {
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role.toLowerCase(),
        id: user.id,
        doctorId: user.role === 'DOCTOR' ? user.id : undefined,
        firstName: user.firstname,
        lastName: user.lastname
      };
      
      this.saveUserInfo(userInfo);
      
      return of(response);
    } else {
      // Login failed
      return throwError(() => ({ message: 'Invalid email or password', success: false }));
    }
  }

  /**
   * Save user info to localStorage
   * @param userInfo The user info to save
   */
  saveUserInfo(userInfo: UserInfo): void {
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
    
    // If there's a token, save it separately
    if (userInfo.token) {
      localStorage.setItem(this.TOKEN_KEY, userInfo.token);
    }
    
    // Update the BehaviorSubject
    this.userInfoSubject.next(userInfo);
    
    console.log('User info saved to localStorage:', userInfo);
  }

  /**
   * Get user info from localStorage
   * @returns UserInfo | null
   */
  getUserInfo(): UserInfo | null {
    // First try to get from localStorage
    const userInfoStr = localStorage.getItem(this.USER_INFO_KEY);
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr) as UserInfo;
        // Update the BehaviorSubject if not already set
        if (!this.userInfoSubject.getValue()) {
          this.userInfoSubject.next(userInfo);
        }
        return userInfo;
      } catch (error) {
        console.error('Error parsing user info:', error);
        return null;
      }
    }
    
    // If not in localStorage, try to get from the BehaviorSubject
    const userInfo = this.userInfoSubject.getValue();
    return userInfo;
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return !!this.getUserInfo();
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    // Update the BehaviorSubject
    this.userInfoSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Auto login user if user info exists in localStorage
   */
  autoLogin(): void {
    const userInfoStr = localStorage.getItem(this.USER_INFO_KEY);
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr) as UserInfo;
        // Update the BehaviorSubject
        this.userInfoSubject.next(userInfo);
        console.log('Auto login successful:', userInfo);
      } catch (error) {
        console.error('Error during auto login:', error);
      }
    }
  }

  /**
   * Update user info in localStorage
   * @param updates Partial<UserInfo>
   */
  updateUserInfo(updates: Partial<UserInfo>): void {
    const currentUserInfo = this.getUserInfo();
    if (currentUserInfo) {
      const updatedUserInfo = { ...currentUserInfo, ...updates };
      this.saveUserInfo(updatedUserInfo);
    }
  }

  /**
   * Get doctor ID from user info
   * @returns string | null
   */
  getDoctorId(): string | null {
    const userInfo = this.getUserInfo();
    if (!userInfo) {
      return null;
    }

    // For doctor role, use doctorId or id
    if (userInfo.role && userInfo.role.toLowerCase() === 'doctor') {
      return userInfo.doctorId || userInfo.id || null;
    }

    // For non-doctor roles, use doctorId if available
    return userInfo.doctorId || null;
  }

  /**
   * Update doctor profile
   * @param profileData Profile data to update
   * @returns Observable<ProfileUpdateResponse>
   */
  updateProfile(profileData: any): Observable<ProfileUpdateResponse> {
    const doctorId = this.getDoctorId();
    if (!doctorId) {
      return throwError(() => new Error('Doctor ID not found'));
    }

    // Find the doctor in the database
    const doctor = this.db.doctorTable().find(d => d.id === doctorId);
    if (!doctor) {
      return throwError(() => new Error('Doctor profile not found'));
    }

    // Update doctor profile in database
    const updatedDoctor = { ...doctor };
    
    if (profileData.bio) updatedDoctor.bio = profileData.bio;
    if (profileData.hospitalname) updatedDoctor.hospitalname = profileData.hospitalname;
    if (profileData.specialisation) updatedDoctor.specialisation = profileData.specialisation;
    if (profileData.contact) updatedDoctor.contact = profileData.contact;
    
    // Update doctor in database
    this.db.doctorTable.update(doctors => 
      doctors.map(d => d.id === doctorId ? updatedDoctor : d)
    );
    
    // Save to localStorage
    this.db.storage.setItem('DOCTOR_TABLE', this.db.doctorTable());

    // Update user info in localStorage
    const userInfo = this.getUserInfo();
    if (userInfo) {
      const updatedUserInfo = { 
        ...userInfo,
        specialization: profileData.specialisation,
        bio: profileData.bio,
        phoneNumber: profileData.contact,
        hospitalAffiliations: profileData.hospitalname
      };
      this.saveUserInfo(updatedUserInfo);
    }

    // Return success response
    return of({
      message: 'Profile updated successfully',
      id: doctorId,
      bio: profileData.bio,
      specialization: profileData.specialisation,
      phoneNumber: profileData.contact,
      hospitalAffiliations: profileData.hospitalname
    });
  }

  /**
   * Update profile picture
   * @param base64Image Base64 encoded image
   * @returns Observable<any>
   */
  updateProfilePicture(base64Image: string): Observable<any> {
    const doctorId = this.getDoctorId();
    if (!doctorId) {
      return throwError(() => new Error('Doctor ID not found'));
    }

    // Find the doctor in the database
    const doctor = this.db.doctorTable().find(d => d.id === doctorId);
    if (!doctor) {
      return throwError(() => new Error('Doctor profile not found'));
    }

    // Update doctor profile picture in database
    const updatedDoctor = { ...doctor, image: base64Image };
    
    // Update doctor in database
    this.db.doctorTable.update(doctors => 
      doctors.map(d => d.id === doctorId ? updatedDoctor : d)
    );
    
    // Save to localStorage
    this.db.storage.setItem('DOCTOR_TABLE', this.db.doctorTable());

    // Update user info in localStorage
    const userInfo = this.getUserInfo();
    if (userInfo) {
      const updatedUserInfo = { ...userInfo, profilePicture: base64Image };
      this.saveUserInfo(updatedUserInfo);
    }

    // Return success response
    return of({
      message: 'Profile picture updated successfully',
      profilePicture: base64Image
    });
  }

  /**
   * Get doctor information
   * @param doctorId Doctor ID
   * @returns Observable<any>
   */
  getDoctor(doctorId: string): Observable<any> {
    // Find the doctor in the database
    const doctor = this.db.doctorTable().find(d => d.id === doctorId);
    if (!doctor) {
      return throwError(() => new Error('Doctor not found'));
    }

    // Find the user associated with the doctor
    const user = this.db.userTable().find(u => u.id === doctor.user_id);
    if (!user) {
      return throwError(() => new Error('User not found for doctor'));
    }

    // Return doctor information
    return of({
      id: doctor.id,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      bio: doctor.bio,
      specialization: doctor.specialisation,
      phoneNumber: doctor.contact,
      hospitalAffiliations: doctor.hospitalname,
      profilePicture: doctor.image
    });
  }

  /**
   * Clear user info from localStorage
   */
  clearUserInfo(): void {
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    // Update the BehaviorSubject
    this.userInfoSubject.next(null);
  }

  /**
   * Verify current password
   * @param password Current password
   * @returns Observable<any>
   */
  verifyCurrentPassword(password: string): Observable<any> {
    const userInfo = this.getUserInfo();
    if (!userInfo || !userInfo.email) {
      return throwError(() => new Error('User not logged in'));
    }

    // Find the user in the database
    const user = this.db.userTable().find(u => u.email === userInfo.email);
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    // Verify password
    if (user.password === password) {
      return of({ verified: true });
    } else {
      return throwError(() => new Error('Current password is incorrect'));
    }
  }

  /**
   * Change password
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Observable<any>
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const userInfo = this.getUserInfo();
    if (!userInfo || !userInfo.email) {
      return throwError(() => new Error('User not logged in'));
    }

    // Find the user in the database
    const user = this.db.userTable().find(u => u.email === userInfo.email);
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return throwError(() => new Error('Current password is incorrect'));
    }

    // Update password
    const updatedUser = { ...user, password: newPassword };
    
    // Update user in database
    this.db.userTable.update(users => 
      users.map(u => u.id === user.id ? updatedUser : u)
    );
    
    // Save to localStorage
    this.db.storage.setItem('USER_TABLE', this.db.userTable());

    // Return success response
    return of({
      message: 'Password changed successfully'
    });
  }
}
