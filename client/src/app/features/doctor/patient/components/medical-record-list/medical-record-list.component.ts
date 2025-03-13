import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PatientService, MedicalRecord, Patient } from '../../../patient/services/patient.service';
import { MedicalRecordViewModalComponent } from '../medical-record-view-modal/medical-record-view-modal.component';

@Component({
  selector: 'app-medical-record-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- <div class="records-container"> -->
      <!-- <div class="header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <h2>Medical Records - {{ patient?.firstName }} {{ patient?.lastName }}</h2>
        </div>
        <button class="btn-add" (click)="addNewRecord()">
          <i class="bi bi-plus-lg"></i> Add New Record
        </button>
      </div>

      <div class="no-records" *ngIf="records.length === 0">
        <div class="empty-state">
          <i class="bi bi-clipboard-x empty-icon"></i>
          <p>No medical records found for this patient.</p>
          <button class="btn-add" (click)="addNewRecord()">Add First Record</button>
        </div>
      </div>

      <div class="records-list" *ngIf="records.length > 0">
        <div class="record-card" *ngFor="let record of records">
          <div class="record-header">
            <div class="date">{{ record.date | date:'medium' }}</div>
            <div class="record-actions">
              <button class="btn-view" (click)="viewRecord(record)">
                <i class="bi bi-eye"></i> View
              </button>
            </div>
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
            <div class="record-section" *ngIf="record.nextVisit">
              <h3>Next Visit</h3>
              <p>{{ record.nextVisit | date:'mediumDate' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div> -->

    <!-- Medical Record View Modal -->
    <!-- <app-medical-record-view-modal
      [isOpen]="isModalOpen"
      [record]="selectedRecord"
      [patientId]="patientId"
      [patientDetails]="patient"
      (closed)="closeModal()"
      (editRecord)="handleEditRecord($event)"
    ></app-medical-record-view-modal> -->
  `,
  styles: [`
    .records-container {
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
      font-size: 1.5rem;
      font-weight: 600;
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

    .btn-add {
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
      transition: background-color 0.2s;
    }

    .btn-add:hover {
      background: #168076;
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
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .record-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

    .record-actions {
      display: flex;
      gap: 8px;
    }

    .btn-view {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      background: #E5E7EB;
      color: #4B5563;
      border: none;
    }

    .btn-view:hover {
      background: #D1D5DB;
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
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 500px;
    }

    .empty-icon {
      font-size: 48px;
      color: #9CA3AF;
      margin-bottom: 16px;
    }

    .empty-state p {
      color: #6B7280;
      margin-bottom: 24px;
      font-size: 16px;
    }

    @media (max-width: 640px) {
      .records-container {
        padding: 16px;
        margin: 16px auto;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .header-left {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .btn-add {
        width: 100%;
        justify-content: center;
      }

      .record-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      .record-actions {
        width: 100%;
      }

      .btn-view {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class MedicalRecordListComponent implements OnInit {
  records: MedicalRecord[] = [];
  patientId: string = '';
  patient: Patient | null = null;
  
  // Modal related properties
  isModalOpen = false;
  selectedRecord: MedicalRecord | null = null;

  constructor(
    private patientService: PatientService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // const id = this.route.snapshot.paramMap.get('id');
    // if (id) {
    //   this.patientId = id;
    //   this.loadRecords();
    //   this.loadPatient();
    // }
  }

  // loadRecords() {
  //   this.patientService.getMedicalRecords(Number(this.patientId)).subscribe({
  //     next: (records) => {
  //       this.records = records.sort((a, b) => {
  //         const dateA = a.date instanceof Date ? a.date : new Date(a.date);
  //         const dateB = b.date instanceof Date ? b.date : new Date(b.date);
  //         return dateB.getTime() - dateA.getTime();
  //       });
  //     },
  //     error: (error) => {
  //       console.error('Error loading medical records:', error);
  //       this.showErrorMessage('Unable to load medical records. Please try again later.');
  //     }
  //   });
  // }

  // loadPatient() {
  //   this.patientService.getPatient(Number(this.patientId)).subscribe({
  //     next: (patient) => {
  //       if (patient) {
  //         this.patient = patient;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading patient details:', error);
  //       this.showErrorMessage('Unable to load patient details. Please try again later.');
  //     }
  //   });
  // }

  // addNewRecord() {
  //   this.router.navigate(['/doctor/patients', this.patientId, 'medical-record', 'add']);
  // }

  // viewRecord(record: MedicalRecord) {
  //   // Fetch the latest record data from the backend
  //   if (record.id !== undefined && record.id !== null) {
  //     // First, refresh the patient details
  //     this.patientService.getPatient(Number(this.patientId)).subscribe({
  //       next: (patient) => {
  //         if (patient) {
  //           this.patient = patient;
            
  //           // Then get the latest record data
  //           this.patientService.getMedicalRecord(record.id!).subscribe({
  //             next: (updatedRecord) => {
  //               this.selectedRecord = updatedRecord;
  //               this.isModalOpen = true;
  //             },
  //             error: (error) => {
  //               console.error('Error fetching medical record:', error);
  //               this.showErrorMessage('Unable to fetch medical record details. Please try again later.');
                
  //               // Fallback to using the existing record data
  //               this.selectedRecord = record;
  //               this.isModalOpen = true;
  //             }
  //           });
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error fetching patient details:', error);
  //         this.showErrorMessage('Unable to fetch patient details. Please try again later.');
          
  //         // Fallback to using the existing record data
  //         this.selectedRecord = record;
  //         this.isModalOpen = true;
  //       }
  //     });
  //   } else {
  //     // If no record ID, just use the existing record data
  //     this.selectedRecord = record;
  //     this.isModalOpen = true;
  //   }
  // }

  // closeModal() {
  //   this.isModalOpen = false;
  //   this.selectedRecord = null;
  // }

  // handleEditRecord(recordId: number) {
  //   // Navigate to the AddMedicalRecordComponent with the record ID for editing
  //   this.router.navigate(['/doctor/patients', this.patientId, 'medical-record', 'add'], { 
  //     queryParams: { editId: recordId } 
  //   });
  // }

  // goBack() {
  //   this.router.navigate(['/doctor/patients']);
  // }

  // private showErrorMessage(message: string) {
  //   alert(message);
  // }



}
