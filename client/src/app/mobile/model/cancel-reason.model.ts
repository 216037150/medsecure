export interface CancelReason {
    id: number;
    label: string;
    selected: boolean;
  }

  export interface Doctor {
    id: number;
    name: string;
    specialization: string;
    imageUrl: string;
  }
  
  export interface Appointment {
    id: number;
    date: string;
    time: string;
    doctor: Doctor;
    status: 'Confirmed' | 'Pending' | 'Cancelled';
    problem: string;
  }

  export interface Slide {
    title: string;
    description: string;
    image?: string;
    buttonText?: string;
    icon?: any;
  }
  