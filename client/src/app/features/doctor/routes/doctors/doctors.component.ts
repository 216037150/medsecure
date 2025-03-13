import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Staff {
  name: string;
  email: string;
  phone: string;
  address: string;
  qualifications: string;
  password: string;
  specialization: string;
  profilePicture?: string | null;
}

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class DoctorsComponent implements OnInit {
  doctors: Staff[] = [];
  currentEditStaff: Staff | null = null;
  currentEditIndex: number = -1;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadStaffData();
  }

  loadStaffData(): void {
    const savedDoctors = localStorage.getItem('doctors');
    if (savedDoctors) {
      this.doctors = JSON.parse(savedDoctors);
    }
  }

  addNewDoctor(): void {
    this.router.navigate(['/doctors/add']);
  }

  editStaff(staff: Staff, index: number): void {
    const editInfo = {
      staff: {...staff},
      index: index
    };
    
    localStorage.setItem('staffToEdit', JSON.stringify(editInfo));
    this.router.navigate(['/doctors/add']);
  }

  deleteStaff(index: number): void {
    if (confirm('Are you sure you want to delete this doctor?')) {
      this.doctors.splice(index, 1);
      localStorage.setItem('doctors', JSON.stringify(this.doctors));
    }
  }

  logout() {
    this.router.navigate(['/']);
  }
}
