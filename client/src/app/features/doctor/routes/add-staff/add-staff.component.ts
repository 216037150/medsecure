import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { AuthService, RegisterRequest } from '../../../../features/auth/services/auth.service';

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

interface EditInfo {
  staff: Staff;
  index: number;
}

@Component({
  selector: 'app-add-staff',
  templateUrl: './add-staff.component.html',
  styleUrls: ['./add-staff.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent]
})
export class AddStaffComponent implements OnInit {
  staffForm: FormGroup;
  isEditMode = false;
  editInfo: EditInfo | null = null;
  pageTitle = 'Add New Doctor';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.staffForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', Validators.required],
      specialization: ['', Validators.required],
      qualifications: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    const staffToEdit = localStorage.getItem('staffToEdit');
    if (staffToEdit) {
      this.isEditMode = true;
      this.editInfo = JSON.parse(staffToEdit);
      this.pageTitle = 'Edit Doctor';
      
      // Populate form with staff details
      if (this.editInfo && this.editInfo.staff) {
        this.staffForm.patchValue({
          name: this.editInfo.staff.name,
          email: this.editInfo.staff.email,
          password: this.editInfo.staff.password,
          phone: this.editInfo.staff.phone,
          address: this.editInfo.staff.address,
          specialization: this.editInfo.staff.specialization,
          qualifications: this.editInfo.staff.qualifications
        });
      }
    }
  }

  onSubmit(): void {
    if (this.staffForm.valid) {
      const formValues = this.staffForm.value;

      // Create staff member object
      const staffMember: Staff = {
        ...formValues,
        profilePicture: this.isEditMode ? this.editInfo?.staff.profilePicture : null
      };

      if (this.isEditMode && this.editInfo) {
        const existingDoctors = localStorage.getItem('doctors');
        if (existingDoctors) {
          const doctors = JSON.parse(existingDoctors);
          doctors[this.editInfo.index] = staffMember;
          localStorage.setItem('doctors', JSON.stringify(doctors));
        }
        localStorage.removeItem('staffToEdit');
      } else {
        const existingDoctors = localStorage.getItem('doctors');
        const doctors = existingDoctors ? JSON.parse(existingDoctors) : [];
        doctors.push(staffMember);
        localStorage.setItem('doctors', JSON.stringify(doctors));
      }
      
      this.router.navigate(['/doctors']);
    } else {
      Object.keys(this.staffForm.controls).forEach(key => {
        const control = this.staffForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode) {
      localStorage.removeItem('staffToEdit');
    }
    this.router.navigate(['/doctors']);
  }
}
