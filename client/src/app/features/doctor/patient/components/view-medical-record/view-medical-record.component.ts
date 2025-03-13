import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PatientService, Patient, MedicalRecord } from '../../../patient/services/patient.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-view-medical-record',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="record-container">
      <div class="header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <h2>Medical Records - {{ patient?.firstName }} {{ patient?.lastName }}</h2>
        </div>
      </div>

      <div class="records-list" *ngIf="medicalRecords.length > 0">
        <div class="record-card" *ngFor="let record of medicalRecords">
          <div class="record-header">
            <div class="date">{{ record.date | date:'medium' }}</div>
            <button class="btn-edit" (click)="editRecord(record.id)">
              <i class="bi bi-pencil"></i> Edit
            </button>
          </div>

          <div class="record-content">
            <div class="record-section">
              <h3>Diagnosis</h3>
              <p>{{ record.diagnosis }}</p>
            </div>

            <div class="record-section">
              <h3>Treatment Plan</h3>
              <p>{{ record.treatment }}</p>
            </div>

            <div class="record-section" *ngIf="record.prescription">
              <h3>Prescription</h3>
              <p>{{ record.prescription }}</p>
            </div>

            <div class="record-section" *ngIf="record.notes">
              <h3>Additional Notes</h3>
              <p>{{ record.notes }}</p>
            </div>

            <div class="record-section" *ngIf="record.nextVisit">
              <h3>Next Visit</h3>
              <p>{{ record.nextVisit | date:'mediumDate' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="no-records" *ngIf="medicalRecords.length === 0">
        <p>No medical records found for this patient.</p>
        <button class="btn-add" (click)="addNewRecord()">Add First Record</button>
      </div>
    </div>
  `,
  styles: [`
    .record-container {
      max-width: 1000px;
      margin: 32px auto;
      padding: 0 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    h2 {
      color: #199A8E;
      margin: 0;
    }

    .btn-back {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #6B7280;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn-back:hover {
      background: #4B5563;
    }

    .btn-add, .btn-edit {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #199A8E;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-edit {
      background: #4B5563;
    }

    .btn-add:hover {
      background: #168076;
    }

    .btn-edit:hover {
      background: #374151;
    }

    .records-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .record-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .record-header {
      padding: 16px;
      background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .date {
      color: #4B5563;
      font-size: 14px;
      font-weight: 500;
    }

    .record-content {
      padding: 20px;
    }

    .record-section {
      margin-bottom: 20px;
    }

    .record-section:last-child {
      margin-bottom: 0;
    }

    .record-section h3 {
      color: #374151;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .record-section p {
      color: #4B5563;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
      white-space: pre-line;
    }

    .no-records {
      text-align: center;
      padding: 48px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .no-records p {
      color: #6B7280;
      margin-bottom: 16px;
    }

    @media (max-width: 640px) {
      .record-container {
        padding: 16px;
      }

      .record-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      .btn-edit {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ViewMedicalRecordComponent implements OnInit, OnDestroy {
  patientId: number = 0;
  patient: Patient | null = null;
  medicalRecords: MedicalRecord[] = [];
  private patientSub?: Subscription;
  private recordsSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private patientService: PatientService
  ) {}

  ngOnInit() {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));

    this.patientSub = this.patientService.getPatients().subscribe(patients => {
      this.patient = patients.find(p => p.id === this.patientId) || null;
    });

    this.recordsSub = this.patientService.getMedicalRecords(this.patientId).subscribe(records => {
      this.medicalRecords = records.sort((a, b) => b.date.getTime() - a.date.getTime());
    });
  }

  ngOnDestroy() {
    this.patientSub?.unsubscribe();
    this.recordsSub?.unsubscribe();
  }

  addNewRecord() {
    this.router.navigate(['/patients', this.patientId, 'medical-record', 'add']);
  }

  editRecord(recordId: number) {
    this.router.navigate(['/patients', this.patientId, 'medical-record', recordId, 'edit']);
  }

  goBack() {
    this.router.navigate(['/patients']);
  }
}
