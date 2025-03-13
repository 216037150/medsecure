import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService, MedicalRecord } from '../../../patient/services/patient.service';

interface NotesData {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  physicalFindings?: string;
  chronicConditions?: string;
  previousSurgeries?: string;
  allergies?: string;
  heredityConditions?: string;
  familyMemberAffected?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  exerciseFrequency?: string;
  occupation?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
}

import { Subscription } from 'rxjs';
import { SuccessDialogComponent } from '../../../../shared/components/success-dialog/success-dialog.component';

@Component({
  selector: 'app-add-medical-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SuccessDialogComponent],
  templateUrl: './add-medical-record.component.html',
  styleUrls: ['./add-medical-record.component.css']
})
export class AddMedicalRecordComponent implements OnInit, OnDestroy {
  medicalRecordForm: FormGroup;
  patientId: string = '';
  recordId?: number;
  isEditMode: boolean = false;
  private recordSub?: Subscription;
  showSuccessModal = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private patientService: PatientService
  ) {
    this.medicalRecordForm = this.fb.group({
      fullName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      emergencyName: ['', Validators.required],
      emergencyRelationship: ['', Validators.required],
      emergencyPhone: ['', Validators.required],
      chronicConditions: [''],
      previousSurgeries: [''],
      allergies: [''],
      currentMedications: [''],
      heredityConditions: [''],
      familyMemberAffected: [''],
      smokingStatus: ['Never'],
      alcoholConsumption: ['None'],
      exerciseFrequency: ['None'],
      occupation: [''],
      bloodPressure: [''],
      heartRate: [''],
      temperature: [''],
      physicalFindings: [''],
      diagnoses: ['', Validators.required],
      treatmentPlans: ['', Validators.required],
      followUpDate: [''],
      consentChecked: [false, Validators.requiredTrue],
      patientSignature: ['', Validators.required],
      physicianSignature: ['', Validators.required],
      signatureDate: ['', Validators.required]
    });
  }

  ngOnInit() {}

  // ngOnInit() {
  //   const id = this.route.snapshot.paramMap.get('id');
  //   if (id) {
  //     this.patientId = id;
  //     this.recordId = Number(this.route.snapshot.paramMap.get('recordId'));
  //     this.isEditMode = !!this.recordId;

  //     // Load patient info
  //     this.patientService.getAllPatients().subscribe(patients => {
  //       const patient = patients.find((p) => p.id === this.patientId);
  //       if (patient) {
  //         this.medicalRecordForm.patchValue({
  //           fullName: `${patient.firstName} ${patient.lastName}`,
  //           dateOfBirth: patient.dateOfBirth,
  //           gender: patient.gender,
  //           phone: patient.contactNumber,
  //           email: patient.email,
  //           address: patient.address
  //         });
  //       }
  //     });

  //     // If editing, load record data
  //     if (this.isEditMode && this.recordId) {
  //       this.recordSub = this.patientService.getMedicalRecord(this.recordId).subscribe(record => {
  //         if (record) {
  //           // Extract data from notes
  //           const notesData = this.parseNotes(record.notes);

  //           this.medicalRecordForm.patchValue({
  //             diagnoses: record.diagnosis,
  //             treatmentPlans: record.treatment,
  //             currentMedications: record.prescription,
  //             followUpDate: record.nextVisit?.toISOString().split('T')[0],
  //             ...notesData
  //           });
  //         }
  //       });
  //     }
  //   }
  // }

  ngOnDestroy() {
    // this.recordSub?.unsubscribe();
  }

  private parseNotes(notes: string): NotesData {
    const data: NotesData = {};
    const sections = notes.split('\n\n');

    sections.forEach(section => {
      if (section.includes('Physical Examination:')) {
        const lines = section.split('\n');
        lines.forEach(line => {
          if (line.includes('BP:')) data.bloodPressure = line.split('BP:')[1].trim();
          if (line.includes('HR:')) data.heartRate = line.split('HR:')[1].trim();
          if (line.includes('Temp:')) data.temperature = line.split('Temp:')[1].trim();
          if (line.includes('Findings:')) data.physicalFindings = line.split('Findings:')[1].trim();
        });
      }

      if (section.includes('Medical History:')) {
        const lines = section.split('\n');
        lines.forEach(line => {
          if (line.includes('Chronic Conditions:')) data.chronicConditions = line.split('Chronic Conditions:')[1].trim();
          if (line.includes('Previous Surgeries:')) data.previousSurgeries = line.split('Previous Surgeries:')[1].trim();
          if (line.includes('Allergies:')) data.allergies = line.split('Allergies:')[1].trim();
        });
      }

      if (section.includes('Family History:')) {
        const lines = section.split('\n');
        lines.forEach(line => {
          if (line.includes('Hereditary Conditions:')) data.heredityConditions = line.split('Hereditary Conditions:')[1].trim();
          if (line.includes('Affected Family Members:')) data.familyMemberAffected = line.split('Affected Family Members:')[1].trim();
        });
      }

      if (section.includes('Social History:')) {
        const lines = section.split('\n');
        lines.forEach(line => {
          if (line.includes('Smoking:')) data.smokingStatus = line.split('Smoking:')[1].trim();
          if (line.includes('Alcohol:')) data.alcoholConsumption = line.split('Alcohol:')[1].trim();
          if (line.includes('Exercise:')) data.exerciseFrequency = line.split('Exercise:')[1].trim();
          if (line.includes('Occupation:')) data.occupation = line.split('Occupation:')[1].trim();
        });
      }

      if (section.includes('Emergency Contact:')) {
        const lines = section.split('\n');
        lines.forEach(line => {
          if (line.includes('Name:')) data.emergencyName = line.split('Name:')[1].trim();
          if (line.includes('Relationship:')) data.emergencyRelationship = line.split('Relationship:')[1].trim();
          if (line.includes('Phone:')) data.emergencyPhone = line.split('Phone:')[1].trim();
        });
      }
    });

    return data;
  }

  onSubmit() {
//     if (this.medicalRecordForm.valid && this.patientId) {
//       const formValue = this.medicalRecordForm.value;
//       const record: Omit<MedicalRecord, 'id'> = {
//         patientId: Number(this.patientId), // Convert string ID to number for API
//         date: new Date(),
//         diagnosis: formValue.diagnoses,
//         treatment: formValue.treatmentPlans,
//         prescription: formValue.currentMedications,
//         notes: `
// Physical Examination:
// BP: ${formValue.bloodPressure}
// HR: ${formValue.heartRate}
// Temp: ${formValue.temperature}
// Findings: ${formValue.physicalFindings}

// Medical History:
// Chronic Conditions: ${formValue.chronicConditions}
// Previous Surgeries: ${formValue.previousSurgeries}
// Allergies: ${formValue.allergies}
// Current Medications: ${formValue.currentMedications}

// Family History:
// Hereditary Conditions: ${formValue.heredityConditions}
// Affected Family Members: ${formValue.familyMemberAffected}

// Social History:
// Smoking: ${formValue.smokingStatus}
// Alcohol: ${formValue.alcoholConsumption}
// Exercise: ${formValue.exerciseFrequency}
// Occupation: ${formValue.occupation}

// Emergency Contact:
// Name: ${formValue.emergencyName}
// Relationship: ${formValue.emergencyRelationship}
// Phone: ${formValue.emergencyPhone}
// `,
//         nextVisit: formValue.followUpDate ? new Date(formValue.followUpDate) : undefined
//       };

//       if (this.isEditMode && this.recordId) {
//         this.patientService.updateMedicalRecord(this.recordId, record).subscribe({
//           next: () => {
//             this.showSuccessModal = true;
//             this.successMessage = 'Medical record updated successfully!';
//             setTimeout(() => {
//               this.showSuccessModal = false;
//               this.router.navigate(['/doctor/patients', this.patientId, 'medical-record']);
//             }, 2000);
//           },
//           error: (error) => {
//             console.error('Error updating medical record:', error);
//             alert('Failed to update medical record. Please try again.');
//           }
//         });
//       } else {
//         this.patientService.addMedicalRecord(record).subscribe({
//           next: () => {
//             this.showSuccessModal = true;
//             this.successMessage = 'Medical record added successfully!';
//             setTimeout(() => {
//               this.showSuccessModal = false;
//               this.router.navigate(['/doctor/patients', this.patientId, 'medical-record']);
//             }, 2000);
//           },
//           error: (error) => {
//             console.error('Error adding medical record:', error);
//             alert('Failed to add medical record. Please try again.');
//           }
//         });
//       }
//     } else {
//       this.markFormGroupTouched(this.medicalRecordForm);
//     }
  }

  onCloseSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/doctor/patients']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  saveDraft() {
    // TODO: Implement draft saving functionality
    console.log('Saving draft...');
  }

  cancel() {
    this.router.navigate(['/doctor/patients', this.patientId, 'medical-record']);
  }
}
