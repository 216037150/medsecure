import { inject, Injectable } from '@angular/core';
import { AppointmentStatusType, AppointmentType, UserType } from './type';
import { Db } from './db';
import { Storage } from './storage';
import { APPOINTMENT_TABLE } from './constant';

@Injectable({
  providedIn: 'root',
})
export class SecuraService {
  db: Db = inject(Db);
  storage: Storage = inject(Storage);

  findBookingByDoctorId() {}

  findBookingByPatientId() {}

  doctorAppoitments(doctor_id: string): AppointmentType[] {
    return this.db
      .appointmentTable()
      .filter((val) => val.doctor_id == doctor_id);
  }

  viewUserById(user_id: string): UserType | undefined {
    return this.db.userTable().find((user) => user.id == user_id);
  }

  patientAppointments(
    patient_id: string,
    status: AppointmentStatusType
  ): AppointmentType[] {
    return this.db
      .appointmentTable()
      .filter((val) => val.patient_id == patient_id && val.status == status);
  }

  appointmentStatus(
    appointment_id: string,
    status: AppointmentStatusType
  ): void {}
}
