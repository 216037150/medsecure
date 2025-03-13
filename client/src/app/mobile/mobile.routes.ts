import { Routes } from '@angular/router';
import { SplashPageComponent } from './features/pages/splash-page/splash-page.component';
import { InfoSliderComponent } from './features/pages/info-slider/info-slider.component';
import { InfoPageComponent } from './features/pages/info-page/info-page.component';
import { UpcomingScheduleComponent } from './features/appointments/upcoming-schedule/upcoming-schedule.component';
import { AppointmentScheduleComponent } from './features/appointments/appointment-schedule/appointment-schedule.component';
import { CancelBookingComponent } from './features/appointments/cancel-booking/cancel-booking.component';
import { PatientProfileComponent } from './features/patient/patient-profile/patient-profile.component';
import { PatientUpdateProfileComponent } from './features/patient/patient-update-profile/patient-update-profile.component';
import { PatientDashboardComponent } from './features/patient/patient-dashboard/patient-dashboard.component';
import { MedicalRecordComponent } from './features/patient/medical-record/medical-record.component';
import { AppointmentDetails } from './features/appointments/appointment-details/appointment-details.component';
import { AppointmentBookingComponent } from './features/appointments/appointment-booking/appointment-booking.component';
import { LoginComponent2 } from './features/auth/login/login.component';
import { RegisterComponent2 } from './features/auth/register/register.component';


export const routes: Routes = [
    {
        path: '',
        component: SplashPageComponent
    },
    {
        path: 'splash',
        component: InfoSliderComponent
    },
    {
        path: 'info',
        component: InfoPageComponent
    },
    {
        path: 'login',
        component: LoginComponent2
    },
    {
        path: 'register',
        component: RegisterComponent2
    },
    {
        path: 'upcoming',
        component: UpcomingScheduleComponent
    },

    {
        path: 'schedule',
        component: AppointmentScheduleComponent
    },
    {
        path: 'cancel',
        component: CancelBookingComponent
    },

    {
        path: 'patient-profile',
        component: PatientProfileComponent
    },

    {
        path: 'patient-update-profile',
        component: PatientUpdateProfileComponent
    },

    {
        path: 'patient-dashboard',
        component: PatientDashboardComponent,
    },

    {
        path: 'cancel-booking',
        component: CancelBookingComponent
    },

    {
        path: 'medical-record',
        component: MedicalRecordComponent
    },

    {
        path: 'appointment-details',
        component: AppointmentDetails
    },

    {
        path: 'appointment-booking',
        component: AppointmentBookingComponent
    },
];

