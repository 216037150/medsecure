export interface Appointment {
    id: number;
    doctorName: string;
    specialization: string;
    date: string;
    time: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    image: string;
  }
  