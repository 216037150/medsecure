import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css']
})
export class MedicalRecordComponent {
  medicalRecordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.medicalRecordForm = this.fb.group({
      // Patient Information
      fullName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],

      // Emergency Contact
      emergencyName: ['', Validators.required],
      emergencyRelationship: ['', Validators.required],
      emergencyPhone: ['', Validators.required],

      // Medical History
      chronicConditions: [''],
      previousSurgeries: [''],
      allergies: [''],
      currentMedications: [''],

      // Family Medical History
      heredityConditions: [''],
      familyMemberAffected: [''],

      // Social History
      smokingStatus: ['Never'],
      alcoholConsumption: ['None'],
      exerciseFrequency: ['None'],
      occupation: [''],

      // Physical Examination
      bloodPressure: [''],
      heartRate: [''],
      temperature: [''],
      physicalFindings: [''],

      // Assessment and Plan
      diagnoses: [''],
      treatmentPlans: [''],
      followUpDate: [''],

      // Consent
      consentChecked: [false, Validators.requiredTrue],
      patientSignature: ['', Validators.required],
      physicianSignature: ['', Validators.required],
      signatureDate: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.medicalRecordForm.valid) {
      console.log('Form submitted:', this.medicalRecordForm.value);
      // Add API call to save medical record
      this.router.navigate(['/patients']);
    } else {
      this.markFormGroupTouched(this.medicalRecordForm);
    }
  }

  saveDraft() {
    console.log('Saving draft:', this.medicalRecordForm.value);
    // Add logic to save draft
  }

  cancel() {
    this.router.navigate(['/patients']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
