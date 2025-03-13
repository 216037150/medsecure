import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MedicalRecordsService, MedicalRecord } from '../service/medical-records.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NavbarComponent],
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css'],
  providers: [MedicalRecordsService]
})
export class MedicalRecordComponent implements OnInit {
  currentFilter: 'newest' | 'oldest' = 'newest';
  records: MedicalRecord[] = [];
  loading: boolean = true;
  error: string | null = null;
 
  constructor(private medicalRecordsService: MedicalRecordsService) {}

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    this.loading = true;
    this.error = null;
    
    this.medicalRecordsService.getMedicalRecords().subscribe(
      (data: MedicalRecord[]) => {
        this.records = data;
        this.loading = false;
      },
      (error: any) => {
        console.error('Error fetching medical records:', error);
        this.error = 'Failed to load medical records. Please try again later.';
        this.loading = false;
      }
    );
  }

  get filteredRecords() {
    return [...this.records].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return this.currentFilter === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }

  setFilter(filter: 'newest' | 'oldest') {
    this.currentFilter = filter;
  }

  downloadRecord(recordId: number) {
    if (!recordId) {
      console.error('Record ID is required for download');
      return;
    }
    
    this.medicalRecordsService.downloadRecord(recordId).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical_record_${recordId}.pdf`; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      },
      (error: any) => {
        console.error('Error downloading file:', error);
      }
    );
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
