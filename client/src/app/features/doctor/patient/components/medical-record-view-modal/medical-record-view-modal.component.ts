import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MedicalRecord } from '../../../patient/services/patient.service';

@Component({
  selector: 'app-medical-record-view-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" [class.active]="isOpen" (click)="onOverlayClick($event)">
      <div class="modal-content" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>Medical Record Details</h3>
          <button class="close-btn" (click)="close()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body" *ngIf="recordForm">
          <form [formGroup]="recordForm">
            <!-- Patient Information Section -->
            <div class="form-section">
              <h4 class="section-title">Patient Information</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" class="form-control" formControlName="fullName" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" class="form-control" formControlName="dateOfBirth" readonly>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <input type="text" class="form-control" formControlName="gender" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input type="tel" class="form-control" formControlName="phone" readonly>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" formControlName="email" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Address</label>
                <textarea class="form-control" formControlName="address" readonly></textarea>
              </div>
            </div>

            <!-- Diagnosis and Treatment Section -->
            <div class="form-section">
              <h4 class="section-title">Diagnosis and Treatment</h4>
              <div class="form-group">
                <label class="form-label">Diagnosis</label>
                <textarea class="form-control" formControlName="diagnosis" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Treatment Plan</label>
                <textarea class="form-control" formControlName="treatment" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Prescription</label>
                <textarea class="form-control" formControlName="prescription" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Next Visit</label>
                <input type="date" class="form-control" formControlName="nextVisit" readonly>
              </div>
            </div>

            <!-- Physical Examination Section -->
            <div class="form-section">
              <h4 class="section-title">Physical Examination</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Blood Pressure</label>
                  <input type="text" class="form-control" formControlName="bloodPressure" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Heart Rate</label>
                  <input type="text" class="form-control" formControlName="heartRate" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Temperature</label>
                  <input type="text" class="form-control" formControlName="temperature" readonly>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Physical Findings</label>
                <textarea class="form-control" formControlName="physicalFindings" readonly></textarea>
              </div>
            </div>

            <!-- Medical History Section -->
            <div class="form-section">
              <h4 class="section-title">Medical History</h4>
              <div class="form-group">
                <label class="form-label">Chronic Conditions</label>
                <textarea class="form-control" formControlName="chronicConditions" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Previous Surgeries</label>
                <textarea class="form-control" formControlName="previousSurgeries" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Allergies</label>
                <textarea class="form-control" formControlName="allergies" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Current Medications</label>
                <textarea class="form-control" formControlName="currentMedications" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Hereditary Conditions</label>
                <textarea class="form-control" formControlName="heredityConditions" readonly></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Family Member Affected</label>
                <textarea class="form-control" formControlName="familyMemberAffected" readonly></textarea>
              </div>
            </div>

            <!-- Social History Section -->
            <div class="form-section">
              <h4 class="section-title">Social History</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Smoking Status</label>
                  <input type="text" class="form-control" formControlName="smokingStatus" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Alcohol Consumption</label>
                  <input type="text" class="form-control" formControlName="alcoholConsumption" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Exercise Frequency</label>
                  <input type="text" class="form-control" formControlName="exerciseFrequency" readonly>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input type="text" class="form-control" formControlName="occupation" readonly>
              </div>
            </div>

            <!-- Emergency Contact Section -->
            <div class="form-section">
              <h4 class="section-title">Emergency Contact</h4>
              <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" formControlName="emergencyName" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Relationship</label>
                <input type="text" class="form-control" formControlName="emergencyRelationship" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="tel" class="form-control" formControlName="emergencyPhone" readonly>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-close" (click)="close()">Close</button>
          <button class="btn-edit" (click)="edit()">Edit Record</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateY(-20px);
      transition: transform 0.3s ease;
    }

    .modal-overlay.active .modal-content {
      transform: translateY(0);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #199A8E;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f3f4f6;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 24px;
    }

    .form-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
      margin-left: 12px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      flex: 1;
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
      background-color: #f9fafb;
    }

    textarea.form-control {
      min-height: 80px;
      resize: vertical;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      position: sticky;
      bottom: 0;
      background: white;
      z-index: 10;
    }

    .btn-close, .btn-edit {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close {
      background: #f3f4f6;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }

    .btn-close:hover {
      background: #e5e7eb;
    }

    .btn-edit {
      background: #199A8E;
      color: white;
      border: none;
    }

    .btn-edit:hover {
      background: #168076;
    }

    @media (max-width: 640px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .modal-content {
        width: 95%;
      }
    }
  `]
})
export class MedicalRecordViewModalComponent {
  @Input() isOpen = false;
  @Input() record: MedicalRecord | null = null;
  @Input() patientId: string = '';
  @Input() patientDetails: any = null;

  @Output() closed = new EventEmitter<void>();
  @Output() editRecord = new EventEmitter<number>();

  recordForm: FormGroup | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnChanges() {
    // Reset the form when modal is closed
    if (!this.isOpen) {
      this.recordForm = null;
      return;
    }
    
    // Initialize the form when record and patient details are available
    if (this.record && this.patientDetails) {
      this.initForm();
    }
  }

  private initForm() {
    if (!this.record || !this.patientDetails) {
      console.error('Cannot initialize form: missing record or patient details');
      return;
    }
    
    console.log('Initializing form with record:', this.record);
    console.log('Patient details:', this.patientDetails);
    
    // Parse notes to extract additional data
    const notesData = this.parseNotes(this.record.notes || '');
    
    // Format date values
    const formatDate = (dateString: string | Date | undefined): string => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch (e) {
        console.error('Error formatting date:', e);
        return '';
      }
    };
    
    this.recordForm = this.fb.group({
      // Patient Information
      fullName: [`${this.patientDetails.firstName || ''} ${this.patientDetails.lastName || ''}`],
      dateOfBirth: [formatDate(this.patientDetails.dateOfBirth)],
      gender: [this.patientDetails.gender || ''],
      phone: [this.patientDetails.contactNumber || ''],
      email: [this.patientDetails.email || ''],
      address: [this.patientDetails.address || ''],
      
      // Diagnosis and Treatment
      diagnosis: [this.record.diagnosis || ''],
      treatment: [this.record.treatment || ''],
      prescription: [this.record.prescription || ''],
      nextVisit: [formatDate(this.record.nextVisit)],
      
      // Physical Examination
      bloodPressure: [notesData.bloodPressure || ''],
      heartRate: [notesData.heartRate || ''],
      temperature: [notesData.temperature || ''],
      physicalFindings: [notesData.physicalFindings || ''],
      
      // Medical History
      chronicConditions: [notesData.chronicConditions || ''],
      previousSurgeries: [notesData.previousSurgeries || ''],
      allergies: [notesData.allergies || ''],
      currentMedications: [notesData.currentMedications || ''],
      heredityConditions: [notesData.heredityConditions || ''],
      familyMemberAffected: [notesData.familyMemberAffected || ''],
      
      // Social History
      smokingStatus: [notesData.smokingStatus || ''],
      alcoholConsumption: [notesData.alcoholConsumption || ''],
      exerciseFrequency: [notesData.exerciseFrequency || ''],
      occupation: [notesData.occupation || ''],
      
      // Emergency Contact
      emergencyName: [notesData.emergencyName || this.patientDetails.emergencyName || ''],
      emergencyRelationship: [notesData.emergencyRelationship || this.patientDetails.emergencyRelationship || ''],
      emergencyPhone: [notesData.emergencyPhone || this.patientDetails.emergencyPhone || '']
    });
    
    console.log('Form initialized with values:', this.recordForm.value);
  }

  private parseNotes(notes: string): any {
    if (!notes) return {};
    
    const data: any = {};
    try {
      // Try to parse as JSON first (in case notes are stored in JSON format)
      try {
        const jsonData = JSON.parse(notes);
        return {
          bloodPressure: jsonData.bloodPressure || '',
          heartRate: jsonData.heartRate || '',
          temperature: jsonData.temperature || '',
          physicalFindings: jsonData.physicalFindings || '',
          chronicConditions: jsonData.chronicConditions || '',
          previousSurgeries: jsonData.previousSurgeries || '',
          allergies: jsonData.allergies || '',
          smokingStatus: jsonData.smokingStatus || '',
          alcoholConsumption: jsonData.alcoholConsumption || '',
          exerciseFrequency: jsonData.exerciseFrequency || '',
          occupation: jsonData.occupation || '',
          emergencyName: jsonData.emergencyName || '',
          emergencyRelationship: jsonData.emergencyRelationship || '',
          emergencyPhone: jsonData.emergencyPhone || ''
        };
      } catch (e) {
        // Not JSON, continue with text parsing
      }
      
      // Split by sections if not JSON
      const sections = notes.split('\n\n');
      
      sections.forEach(section => {
        // Physical Examination section
        if (section.includes('Physical Examination:')) {
          const lines = section.split('\n');
          lines.forEach(line => {
            if (line.includes('BP:')) data.bloodPressure = line.split('BP:')[1]?.trim();
            if (line.includes('HR:')) data.heartRate = line.split('HR:')[1]?.trim();
            if (line.includes('Temp:')) data.temperature = line.split('Temp:')[1]?.trim();
            if (line.includes('Findings:')) data.physicalFindings = line.split('Findings:')[1]?.trim();
          });
        }
        
        // Medical History section
        if (section.includes('Medical History:')) {
          const lines = section.split('\n');
          lines.forEach(line => {
            if (line.includes('Chronic Conditions:')) data.chronicConditions = line.split('Chronic Conditions:')[1]?.trim();
            if (line.includes('Previous Surgeries:')) data.previousSurgeries = line.split('Previous Surgeries:')[1]?.trim();
            if (line.includes('Allergies:')) data.allergies = line.split('Allergies:')[1]?.trim();
            if (line.includes('Current Medications:')) data.currentMedications = line.split('Current Medications:')[1]?.trim();
            if (line.includes('Hereditary Conditions:')) data.heredityConditions = line.split('Hereditary Conditions:')[1]?.trim();
            if (line.includes('Family Member Affected:')) data.familyMemberAffected = line.split('Family Member Affected:')[1]?.trim();
          });
        }
        
        // Social History section
        if (section.includes('Social History:')) {
          const lines = section.split('\n');
          lines.forEach(line => {
            if (line.includes('Smoking:')) data.smokingStatus = line.split('Smoking:')[1]?.trim();
            if (line.includes('Alcohol:')) data.alcoholConsumption = line.split('Alcohol:')[1]?.trim();
            if (line.includes('Exercise:')) data.exerciseFrequency = line.split('Exercise:')[1]?.trim();
            if (line.includes('Occupation:')) data.occupation = line.split('Occupation:')[1]?.trim();
          });
        }
        
        // Emergency Contact section
        if (section.includes('Emergency Contact:')) {
          const lines = section.split('\n');
          lines.forEach(line => {
            if (line.includes('Name:')) data.emergencyName = line.split('Name:')[1]?.trim();
            if (line.includes('Relationship:')) data.emergencyRelationship = line.split('Relationship:')[1]?.trim();
            if (line.includes('Phone:')) data.emergencyPhone = line.split('Phone:')[1]?.trim();
          });
        }
      });
      
      // Also try to extract data from key-value pairs in the entire notes
      const allLines = notes.split('\n');
      allLines.forEach(line => {
        const keyValuePair = line.split(':');
        if (keyValuePair.length === 2) {
          const key = keyValuePair[0].trim();
          const value = keyValuePair[1].trim();
          
          if (key === 'Blood Pressure' || key === 'BP') data.bloodPressure = value;
          if (key === 'Heart Rate' || key === 'HR') data.heartRate = value;
          if (key === 'Temperature' || key === 'Temp') data.temperature = value;
          if (key === 'Physical Findings' || key === 'Findings') data.physicalFindings = value;
          if (key === 'Chronic Conditions') data.chronicConditions = value;
          if (key === 'Previous Surgeries') data.previousSurgeries = value;
          if (key === 'Allergies') data.allergies = value;
          if (key === 'Smoking' || key === 'Smoking Status') data.smokingStatus = value;
          if (key === 'Alcohol' || key === 'Alcohol Consumption') data.alcoholConsumption = value;
          if (key === 'Exercise' || key === 'Exercise Frequency') data.exerciseFrequency = value;
          if (key === 'Occupation') data.occupation = value;
        }
      });
    } catch (error) {
      console.error('Error parsing medical record notes:', error);
    }
    
    return data;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    this.closed.emit();
  }

  edit() {
    if (this.record && this.record.id) {
      this.editRecord.emit(this.record.id);
    }
  }
}
