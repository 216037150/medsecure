import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';

import { ApiUrlService } from '../../core/services/api-url.service';
import { Db } from '../../../../app/db';
import { UserType, PatientType } from '../../../../app/type';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

interface LoginResponse {
  message: string;
  token: string;
  name: string;
  email: string;
  id?: string; 
  userId?: string;
  patientId?: string;
  profilePicture?: string | null;
  phoneNumber?: string;
  address?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserInfo {
  id?: string;
  patientId?: string;
  full_name: string;
  email: string;
  profilePicture?: string | null;
  phoneNumber?: string;
  address?: string;
  name?: string;
}

interface ProfileUpdateResponse {
  message: string;
  user: UserInfo;
}

interface User {
  displayName: string;
  profileImage: string | null;
  email: string;
  id?: string;
  patientId?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  id?: string;
  userId?: string;
  patientId?: string;
  token?: string;
  name?: string;
  offline?: boolean; // Add offline property for offline registration handling
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly userInfoKey = 'user_info';
  private readonly baseUrl: string;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private userIdKey = 'patient_user_id';
  private patientIdKey = 'patient_id';
  
  // Create an instance of Db directly instead of injecting it
  private db: Db;

  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService
  ) {
    this.baseUrl = this.apiUrlService.getBaseUrl();
    console.log('Auth Service initialized with base URL:', this.baseUrl);
    
    // Initialize the Db instance
    this.db = new Db();
    
    // Auto login when service is initialized
    this.autoLogin();
  }

  /**
   * Auto login user if user info exists in localStorage
   */
  autoLogin(): void {
    const userInfoStr = localStorage.getItem(this.userInfoKey);
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        
        // Add IDs from separate localStorage if missing
        if (!userInfo.id && localStorage.getItem(this.userIdKey)) {
          userInfo.id = localStorage.getItem(this.userIdKey);
        }
        
        if (!userInfo.patientId && localStorage.getItem(this.patientIdKey)) {
          userInfo.patientId = localStorage.getItem(this.patientIdKey);
        }
        
        // Update the BehaviorSubject
        this.currentUserSubject.next({
          displayName: userInfo.full_name,
          profileImage: userInfo.profilePicture || null,
          email: userInfo.email,
          id: userInfo.id,
          patientId: userInfo.patientId
        });
        
        console.log('Auto login successful:', userInfo);
      } catch (error) {
        console.error('Error during auto login:', error);
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const loginData = { email, password };
    const loginEndpoint = this.apiUrlService.getUrl('auth/login');
    
    console.log('Logging in at endpoint:', loginEndpoint);
    
    return this.http.post<LoginResponse>(loginEndpoint, loginData)
      .pipe(
        tap(response => {
          console.log('Login successful:', response);
          
          // Save the token
          if (response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            console.log('Token saved to localStorage');
          } else {
            console.warn('No token received in login response');
          }
          
          // Save user ID if present
          if (response.id) {
            localStorage.setItem(this.userIdKey, response.id);
            console.log('User ID saved:', response.id);
          } else if (response.userId) {
            localStorage.setItem(this.userIdKey, response.userId);
            console.log('User ID saved from userId:', response.userId);
          }

          // Save patient ID if present
          if (response.patientId) {
            localStorage.setItem(this.patientIdKey, response.patientId);
            console.log('Patient ID saved:', response.patientId);
          } else if (response.role === 'PATIENT' && (response.id || response.userId)) {
            // For patients, if no explicit patientId, use the userId/id as patientId
            const userId = response.id || response.userId || '';
            if (userId) {
              localStorage.setItem(this.patientIdKey, userId);
              console.log('Patient ID saved from userId:', userId);
            }
          }

          // Get the latest profile data from the server after login
          this.fetchLatestUserProfile(response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error:', error);
          
          // If there's a network error or the server is unavailable, try to use the local database
          if (error.status === 0) {
            console.log('Network error or server unavailable, trying local database login');
            return this.loginWithLocalDb(email, password);
          }
          
          if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error('Network error occurred'));
          }
          return throwError(() => error.error?.message || 'Login failed');
        })
      );
  }
  
  /**
   * Attempt to login using the local database when the API is not available
   */
  private loginWithLocalDb(email: string, password: string): Observable<LoginResponse> {
    console.log('Attempting login with local database');
    
    // Check if db service is available
    if (!this.db) {
      console.error('Db service not available for offline login');
      return throwError(() => new Error('Offline functionality not available'));
    }
    
    // Try to find the user in the local database
    const user = this.db.login(email, password);
    
    if (user) {
      console.log('Local database login successful:', user);
      
      // Create a response object similar to what the API would return
      const response: LoginResponse = {
        message: 'Login successful',
        token: 'local-auth-token',  // Dummy token for offline mode
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        id: user.id,
        userId: user.id,
        role: user.role,
        firstName: user.firstname,
        lastName: user.lastname
      };
      
      // If the user is a patient, set the patient ID
      if (user.role.toUpperCase() === 'PATIENT') {
        // Find the patient record for this user
        const patient = this.db.patientTable().find((p: any) => p.user_id === user.id);
        if (patient) {
          response.patientId = patient.id;
        } else {
          // For patients, if no explicit patientId, use the userId as patientId
          response.patientId = user.id;
        }
      }
      
      // Save user info to localStorage
      const userInfo: UserInfo = {
        id: user.id,
        patientId: response.patientId,
        full_name: response.name,
        email: user.email,
        profilePicture: null
      };
      
      this.saveUserInfo(userInfo);
      
      // Return the response as an Observable
      return of(response);
    } else {
      console.log('Local database login failed');
      return throwError(() => new Error('Invalid email or password'));
    }
  }

  private fetchLatestUserProfile(loginResponse: LoginResponse) {
    // Get latest profile data from server
    const token = localStorage.getItem(this.tokenKey);
    
    if (!token) {
      console.warn('No auth token available for profile fetch');
      this.handleFallbackUserInfo(loginResponse);
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Fetching profile with token:', token);
    const profileEndpoint = this.apiUrlService.getUrl('patients/profile/info');
    console.log('Request URL:', profileEndpoint);

    this.http.get<any>(profileEndpoint, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching latest profile:', error);
          
          // Specific handling for 404 errors
          if (error.status === 404) {
            console.warn('Patient profile endpoint not found (404). Using fallback user info.');
          } else if (error.status === 0) {
            console.warn('Network error when fetching profile. Backend may be unavailable.');
          } else {
            console.error(`Error ${error.status} when fetching profile: ${error.message}`);
          }
          
          this.handleFallbackUserInfo(loginResponse);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Profile response:', response);
          if (response.success && response.data) {
            // Get saved IDs or use from response
            const userId = response.data.id || localStorage.getItem(this.userIdKey) || undefined;
            const patientId = response.data.patientId || localStorage.getItem(this.patientIdKey) || undefined;
            
            // Save IDs to localStorage
            if (userId) localStorage.setItem(this.userIdKey, userId);
            if (patientId) localStorage.setItem(this.patientIdKey, patientId);
            
            const userInfo: UserInfo = {
              id: userId,
              patientId: patientId,
              full_name: response.data.fullName,
              email: response.data.email,
              profilePicture: response.data.profilePicture || null,
              phoneNumber: response.data.phoneNumber,
              address: loginResponse.address
            };

            this.saveUserInfo(userInfo);
            this.currentUserSubject.next({
              displayName: response.data.fullName,
              profileImage: response.data.profilePicture,
              email: response.data.email,
              id: userId,
              patientId: patientId
            });
          } else {
            this.handleFallbackUserInfo(loginResponse);
          }
        },
        error: (error) => {
          console.error('Error in profile subscription:', error);
          this.handleFallbackUserInfo(loginResponse);
        }
      });
  }

  private handleFallbackUserInfo(loginResponse: LoginResponse) {
    console.log('Using fallback user info from login response');
    
    // Fallback to login response data
    // Get saved IDs or use from login response
    const userId = loginResponse.id || loginResponse.userId || localStorage.getItem(this.userIdKey) || undefined;
    const patientId = loginResponse.patientId || localStorage.getItem(this.patientIdKey) || undefined;
    
    // Save IDs to localStorage
    if (userId) localStorage.setItem(this.userIdKey, userId);
    if (patientId) localStorage.setItem(this.patientIdKey, patientId);
    
    // For patient role, if no explicit patientId, use the userId/id as patientId
    if (loginResponse.role === 'PATIENT' && userId && !patientId) {
      localStorage.setItem(this.patientIdKey, userId);
      console.log('Set patient ID from user ID:', userId);
    }
    
    const userInfo: UserInfo = {
      id: userId,
      patientId: patientId || (loginResponse.role === 'PATIENT' ? userId : undefined),
      full_name: loginResponse.name || `${loginResponse.firstName || ''} ${loginResponse.lastName || ''}`.trim(),
      email: loginResponse.email,
      profilePicture: loginResponse.profilePicture || null,
      phoneNumber: loginResponse.phoneNumber,
      address: loginResponse.address
    };

    this.saveUserInfo(userInfo);
    this.currentUserSubject.next({
      displayName: userInfo.full_name,
      profileImage: userInfo.profilePicture || null,
      email: userInfo.email,
      id: userInfo.id,
      patientId: userInfo.patientId
    });
  }

  async getCurrentUser(): Promise<User | null> {
    const userInfo = this.getUserInfo();
    if (!userInfo) return null;

    return {
      displayName: userInfo.full_name,
      profileImage: userInfo.profilePicture || null,
      email: userInfo.email,
      id: userInfo.id,
      patientId: userInfo.patientId
    };
  }

  getUserInfo(): UserInfo | null {
    // First try to get from localStorage
    const userInfoStr = localStorage.getItem(this.userInfoKey);
    if (userInfoStr) {
      try {
        const parsedUserInfo = JSON.parse(userInfoStr);
        
        // Add IDs from separate localStorage if missing
        if (!parsedUserInfo.id && localStorage.getItem(this.userIdKey)) {
          parsedUserInfo.id = localStorage.getItem(this.userIdKey);
        }
        
        if (!parsedUserInfo.patientId && localStorage.getItem(this.patientIdKey)) {
          parsedUserInfo.patientId = localStorage.getItem(this.patientIdKey);
        }
        
        // Update the BehaviorSubject if not already set
        const currentUser = this.currentUserSubject.getValue();
        if (!currentUser || currentUser.email !== parsedUserInfo.email) {
          this.currentUserSubject.next({
            displayName: parsedUserInfo.full_name,
            profileImage: parsedUserInfo.profilePicture || null,
            email: parsedUserInfo.email,
            id: parsedUserInfo.id,
            patientId: parsedUserInfo.patientId
          });
        }
        
        return parsedUserInfo;
      } catch (error) {
        console.error('Error parsing user info', error);
        return null;
      }
    }
    
    // If not in localStorage, try to get from the BehaviorSubject
    const currentUser = this.currentUserSubject.getValue();
    if (currentUser) {
      return {
        id: currentUser.id,
        patientId: currentUser.patientId,
        full_name: currentUser.displayName,
        email: currentUser.email,
        profilePicture: currentUser.profileImage
      };
    }
    
    return null;
  }

  getUserId(): string | null {
    return localStorage.getItem(this.userIdKey) || this.getUserInfo()?.id || null;
  }

  getPatientId(): string | null {
    return localStorage.getItem(this.patientIdKey) || 
           localStorage.getItem('med_secure_patient_id') || 
           this.getUserInfo()?.patientId || 
           null;
  }

  saveUserInfo(userInfo: UserInfo): void {
    console.log('Saving user info:', userInfo);
    // Save IDs separately for easy access
    if (userInfo.id) {
      localStorage.setItem(this.userIdKey, userInfo.id);
    }
    
    if (userInfo.patientId) {
      localStorage.setItem(this.patientIdKey, userInfo.patientId);
    }
    
    localStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));
    this.currentUserSubject.next({
      displayName: userInfo.full_name,
      profileImage: userInfo.profilePicture || null,
      email: userInfo.email,
      id: userInfo.id,
      patientId: userInfo.patientId
    });
  }

  clearUserInfo(): void {
    localStorage.removeItem(this.userInfoKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.patientIdKey);
    this.currentUserSubject.next(null);
  }

  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    const registerEndpoint = this.apiUrlService.getUrl('auth/register');
    
    console.log('Registering at endpoint:', registerEndpoint);
    
    return this.http.post<RegisterResponse>(registerEndpoint, registerData)
      .pipe(
        tap(response => {
          console.log('Registration response:', response);
          
          // Save the token if provided
          if (response.token) {
            localStorage.setItem(this.tokenKey, response.token);
          }
          
          // Save user ID from the response (could be id or userId)
          const userId = response.userId || response.id;
          if (userId) {
            localStorage.setItem(this.userIdKey, userId);
            console.log('User ID saved:', userId);
          }
          
          // For patient role, the patient ID is the same as the user ID
          if (response.role === 'PATIENT') {
            if (userId) {
              localStorage.setItem(this.patientIdKey, userId);
              console.log('Patient ID saved (from userId):', userId);
            } else if (response.patientId) {
              localStorage.setItem(this.patientIdKey, response.patientId);
              console.log('Patient ID saved (from patientId):', response.patientId);
            }
          }
          
          // Create a basic user info object
          const userInfo: UserInfo = {
            id: userId,
            patientId: response.role === 'PATIENT' ? (response.patientId || userId) : undefined,
            full_name: `${registerData.firstName} ${registerData.lastName}`,
            email: response.email || registerData.email,
            profilePicture: null
          };
          
          // Save the user info
          this.saveUserInfo(userInfo);
          
          // Update the current user subject
          this.currentUserSubject.next({
            displayName: userInfo.full_name,
            profileImage: null,
            email: userInfo.email,
            id: userInfo.id,
            patientId: userInfo.patientId
          });
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Registration error:', error);
          
          // If there's a network error or the server is unavailable, try to use the local database
          if (error.status === 0) {
            console.log('Network error or server unavailable, trying local database registration');
            return this.registerWithLocalDb(registerData);
          }
          
          return this.handleError(error);
        })
      );
  }
  
  /**
   * Attempt to register using the local database when the API is not available
   */
  private registerWithLocalDb(registerData: RegisterRequest): Observable<RegisterResponse> {
    console.log('Attempting registration with local database');
    
    // Check if db service is available
    if (!this.db) {
      console.error('Db service not available for offline registration');
      return throwError(() => new Error('Offline functionality not available'));
    }
    
    // Check if email already exists
    const existingUser = this.db.userTable().find((u: UserType) => u.email === registerData.email);
    if (existingUser) {
      console.log('Email already exists in local database');
      return throwError(() => ({ error: { message: 'Email already exists' } }));
    }
    
    // Generate a new user ID
    const userId = this.db.generateId();
    
    // Create a new user in the local database
    const newUser: UserType = {
      id: userId,
      email: registerData.email,
      password: registerData.password,
      firstname: registerData.firstName,
      lastname: registerData.lastName,
      role: registerData.role.toUpperCase() as 'DOCTOR' | 'PATIENT'
    };
    
    // Add the user to the database
    const updatedUserTable = [...this.db.userTable(), newUser];
    this.db.userTable.set(updatedUserTable);
    this.db.storage.setItem('USER_TABLE', updatedUserTable);
    
    // If the user is a patient, create a patient record
    let patientId = userId;
    if (registerData.role.toUpperCase() === 'PATIENT') {
      patientId = this.db.generateId();
      const newPatient: PatientType = {
        id: patientId,
        user_id: userId,
        image: '',
        contact: ''
      };
      
      const updatedPatientTable = [...this.db.patientTable(), newPatient];
      this.db.patientTable.set(updatedPatientTable);
      this.db.storage.setItem('PATIENT_TABLE', updatedPatientTable);
    }
    
    // Create a response object similar to what the API would return
    const response: RegisterResponse = {
      message: 'Registration successful',
      email: registerData.email,
      id: userId,
      userId: userId,
      patientId: registerData.role.toUpperCase() === 'PATIENT' ? patientId : undefined,
      role: registerData.role.toUpperCase(),
      offline: true
    };
    
    // Save user info to localStorage
    const userInfo: UserInfo = {
      id: userId,
      patientId: registerData.role.toUpperCase() === 'PATIENT' ? patientId : undefined,
      full_name: `${registerData.firstName} ${registerData.lastName}`,
      email: registerData.email,
      profilePicture: null
    };
    
    this.saveUserInfo(userInfo);
    
    // Return the response as an Observable
    return of(response);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    
    if (error.error instanceof ErrorEvent || error.status === 0) {
      console.error('Client-side error:', error.error?.message || 'Network connection error');
      return throwError(() => new Error('Unable to connect to the server. Please check your internet connection and try again.'));
    }
    
    if (error.error && typeof error.error === 'object') {
      if (error.error.message?.toLowerCase().includes('email already exists') || 
          error.error.error?.toLowerCase().includes('email already exists')) {
        return throwError(() => ({ error: { message: 'Email already exists' } }));
      }
      
      return throwError(() => error);
    }
    
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }

  updateProfile(profileData: any): Observable<ProfileUpdateResponse> {
    const userInfo = this.getUserInfo();
    const isPatient = userInfo?.patientId !== undefined;
    const endpoint = isPatient 
      ? this.apiUrlService.getUrl('patients/profile/update') 
      : this.apiUrlService.getUrl('doctors/profile/update');
    
    console.log(`Updating profile for ${isPatient ? 'patient' : 'doctor'} at endpoint: ${endpoint}`);
    
    // Get the auth token
    const token = this.getAuthToken();
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    // For patients, we can send JSON directly
    if (isPatient) {
      return this.http.post<ProfileUpdateResponse>(endpoint, profileData, { headers })
        .pipe(
          tap(response => {
            console.log('Profile update response:', response);
            if (response.user) {
              this.updateUserInfoFromProfile(response.user);
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Profile update error:', error);
            if (error.error instanceof ErrorEvent) {
              return throwError(() => new Error('Network error occurred'));
            }
            return throwError(() => error.error?.message || 'Profile update failed');
          })
        );
    }
    
    // For doctors, we continue to use FormData
    return this.http.post<ProfileUpdateResponse>(endpoint, profileData)
      .pipe(
        tap(response => {
          console.log('Profile update response:', response);
          if (response.user) {
            this.updateUserInfoFromProfile(response.user);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Profile update error:', error);
          if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error('Network error occurred'));
          }
          return throwError(() => error.error?.message || 'Profile update failed');
        })
      );
  }

  // Update user info from profile changes
  updateUserInfoFromProfile(profile: any): void {
    const currentUserInfo = this.getUserInfo();
    
    if (currentUserInfo) {
      // Extract first and last name from full name
      let firstName, lastName;
      
      if (profile.fullName) {
        const names = profile.fullName.split(' ');
        firstName = names[0];
        lastName = names.length > 1 ? names.slice(1).join(' ') : '';
      } else {
        firstName = profile.firstName || currentUserInfo.full_name.split(' ')[0];
        lastName = profile.lastName || (currentUserInfo.full_name.split(' ').length > 1 ? 
                   currentUserInfo.full_name.split(' ').slice(1).join(' ') : '');
      }
      
      const updatedUserInfo: UserInfo = {
        ...currentUserInfo,
        full_name: `${firstName} ${lastName}`,
        profilePicture: profile.profilePicture || currentUserInfo.profilePicture,
        phoneNumber: profile.phoneNumber || currentUserInfo.phoneNumber,
        address: profile.address || currentUserInfo.address
      };
      
      // Save the updated user info
      this.saveUserInfo(updatedUserInfo);
      
      // Update the current user subject
      this.currentUserSubject.next({
        displayName: updatedUserInfo.full_name,
        profileImage: updatedUserInfo.profilePicture || null,
        email: updatedUserInfo.email,
        id: updatedUserInfo.id,
        patientId: updatedUserInfo.patientId
      });
      
      console.log('User info updated from profile:', updatedUserInfo);
    }
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof ErrorEvent) {
          return throwError(() => new Error('Network error occurred'));
        }
        return throwError(() => error.error.message || 'Password change failed');
      })
    );
  }

  verifyCurrentPassword(password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-password`, { password })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error('Network error occurred'));
          }
          return throwError(() => error.error.message || 'Password verification failed');
        })
      );
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  logout(): void {
    this.clearUserInfo();
  }

  // Sync user data with backend
  private syncUserDataWithBackend(
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    profilePicture?: string
  ): void {
    const token = this.getAuthToken();
    
    if (!token) {
      console.error('Cannot sync user data: No auth token. Please log in again.');
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const userData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      profilePicture
    };
    
    // Log the data we're sending for debugging
    console.log('Syncing user data with backend:', userData);
    
    // Use the patients/profile/update endpoint
    const syncEndpoint = this.apiUrlService.getUrl('patients/profile/update');
    console.log('Sync endpoint:', syncEndpoint);
    
    this.http.post(syncEndpoint, userData, { headers })
      .pipe(
        tap(response => console.log('Backend sync response:', response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Failed to sync user data with backend', error);
          return of(null);
        })
      )
      .subscribe();
  }

  getAuthToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Getting auth token:', token ? 'Token exists' : 'No token found');
    return token;
  }

  createPatientRecord(userId: string, firstName: string, lastName: string, email: string): Observable<any> {
    console.log('Creating patient record for user ID:', userId);
    
    const patientData = {
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      email: email
    };
    
    const createPatientEndpoint = this.apiUrlService.getUrl('patients/create');
    console.log('Create patient endpoint:', createPatientEndpoint);
    
    return this.http.post<any>(createPatientEndpoint, patientData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error creating patient record:', error);
          return throwError(() => error.error.message || 'Failed to create patient record');
        })
      );
  }

  fetchPatientIdByUserId(userId: string): Observable<string> {
    console.log('Fetching patient ID for user ID:', userId);
    
    const fetchPatientIdEndpoint = this.apiUrlService.getUrl(`patients/by-user/${userId}`);
    console.log('Fetch patient ID endpoint:', fetchPatientIdEndpoint);
    
    return this.http.get<any>(fetchPatientIdEndpoint)
      .pipe(
        map(response => response.patientId),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching patient ID:', error);
          return throwError(() => error.error.message || 'Failed to fetch patient ID');
        })
      );
  }
}
