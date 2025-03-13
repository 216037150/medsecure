import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { DashboardComponent } from './features/shared/routes/dashboard/dashboard.component';
import { AppointmentsComponent } from './features/shared/routes/appointments/appointments.component';
import { SettingsComponent } from './features/shared/routes/settings/settings.component';
import { PracticeInfoComponent } from './features/shared/components/practice-info/practice-info.component';
import { PaymentInfoComponent } from './features/shared/components/payment-info/payment-info.component';
import { SubscriptionComponent } from './features/home/components/subscription/subscription.component';
import { BenefitsComponent } from './features/home/components/benefits/benefits.component';
import { AboutComponent } from './features/home/components/about/about.component';
import { LandingComponent } from './features/home/components/landing/landing.component';
import { DoctorProfileComponent } from './features/doctor/components/profile/doctor-profile.component';
import { ChangePasswordComponent } from './features/shared/routes/change-password/change-password.component';
import { DoctorInformationComponent } from './features/shared/components/doctor-information/doctor-information.component';
import { SubscriptionConfirmationComponent } from './features/home/components/subscription-confirmation/subscription-confirmation.component';
import { ViewPatientsComponent } from './features/doctor/patient/view Patients/view_patients.component';
import { DoctorsComponent } from './features/doctor/routes/doctors/doctors.component';
import { AddStaffComponent } from './features/doctor/routes/add-staff/add-staff.component';
import { AddMedicalRecordComponent } from './features/doctor/patient/components/add-medical-record/add-medical-record.component';
import { MedicalRecordListComponent } from './features/doctor/patient/components/medical-record-list/medical-record-list.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'doctors-patient', component: ViewPatientsComponent },
  { path: 'doctors', component: DoctorsComponent },
  { path: 'doctors/add', component: AddStaffComponent },
  { path: 'doctors-profile', component: DoctorProfileComponent },
  { path: 'medical-record/list', component: MedicalRecordListComponent },
  { path: 'medical-record/add/:id', component: AddMedicalRecordComponent },
  {
    path: 'appointments',
    loadComponent: () => import('./features/shared/routes/appointments/appointments.component')
      .then(m => m.AppointmentsComponent)
  },

  { path: 'settings', component: SettingsComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'doctor-information', component: DoctorInformationComponent },
  { path: 'subscription', component: SubscriptionComponent },
  { path: 'subscription-confirmation', component: SubscriptionConfirmationComponent },
  {
    path: 'payment',
    children: [
      { path: 'practice-info', component: PracticeInfoComponent },
      { path: 'payment-info', component: PaymentInfoComponent },
      { path: '', component: LandingComponent },
      { path: 'about', component: AboutComponent },
      { path: 'benefits', component: BenefitsComponent },
      { path: '', redirectTo: 'practice-info', pathMatch: 'full' }
    ]
  },
  {path: 'mobile', loadChildren: () => import("./mobile/mobile.routes").then(m => m.routes)}
];
