import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-practice-info',
  templateUrl: './practice-info.component.html',
  styleUrls: ['./practice-info.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PracticeInfoComponent implements OnInit {
  practiceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.practiceForm = this.fb.group({
      practiceName: ['', Validators.required],
      doctorName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\+?([0-9\s-]){10,}$/)
      ]],
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.practiceForm.valid) {
      // Store form data in a service or state management solution
      const practiceData = this.practiceForm.value;
      localStorage.setItem('practiceData', JSON.stringify(practiceData));

      // Navigate to payment info component
      this.router.navigate(['/payment/payment-info']);
    }
  }
}
