export type UserType = {
    id: string
    firstname: string
    lastname: string
    email: string
    password: string
    role: 'DOCTOR' | 'PATIENT'
}

export type UserRoleType = 'PATIENT' | 'DOCTOR'
export type AppointmentStatusType = 'Pending' | 'Approved' | 'Completed' | 'Cancelled'

export type DoctorType = {
    id: string
    bio: string
    image: string
    hospitalname: string
    qualification: string
    specialisation: string
    contact: string
    paymentPlan: string
    user_id: string
}

export type PatientType = {
    id: string
    image: string
    contact: string
    user_id: string
}

export type DoctorPatient = {
    id: string
    doctor_id: string
    patient_id: string
}

export type AvailabilityType = {
    id: string
    doctor_id: string
    date: string
    start_time: string
    end_time: string
}

export type MedicalRecordType = {
    id: string
    appointment_id: string
    created_date: string
    note: string
}

export type AppointmentType = {
    id: string
    doctor_id: string
    patient_id: string
    status: AppointmentStatusType
    date: string
    time: string
    patientName?: string
}
