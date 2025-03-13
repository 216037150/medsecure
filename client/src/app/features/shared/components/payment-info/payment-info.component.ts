import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-info',
  templateUrl: './payment-info.component.html',
  styleUrls: ['./payment-info.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PaymentInfoComponent implements OnInit {
  paymentForm: FormGroup;
  subscriptionType: string = 'trial';
  subscriptionPrice: number = 0;
  userCount: number = 5;
  expiryDateError: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.paymentForm = this.fb.group({
      cardNumber: ['', [
        Validators.required,
        Validators.pattern(/^[\d\s]{19}$/)
      ]],
      expiryDate: ['', [
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/),
        this.expiryDateValidator
      ]],
      cvc: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{3}$/)
      ]]
    });
  }

  ngOnInit(): void {
    const practiceData = localStorage.getItem('practiceData');
    if (!practiceData) {
      this.router.navigate(['/payment/practice-info']);
      return;
    }

    this.subscriptionType = localStorage.getItem('subscriptionType') || 'trial';
    if (this.subscriptionType === 'premium') {
      this.subscriptionPrice = Number(localStorage.getItem('subscriptionPrice')) || 0;
      this.userCount = Number(localStorage.getItem('userCount')) || 5;
    }
  }

  // Custom validator for expiry date to ensure it's not expired
  expiryDateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    // Check if the format is valid
    if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(value)) {
      return { invalidFormat: true };
    }

    const [month, yearStr] = value.split('/');
    const year = 2000 + parseInt(yearStr, 10); // Convert YY to YYYY
    
    // Create date objects for validation
    const expiryDate = new Date(year, parseInt(month, 10) - 1, 1); // First day of the month
    const today = new Date();
    const lastDayOfMonth = new Date(year, parseInt(month, 10), 0).getDate();
    
    // Set expiry to last day of the month at 23:59:59
    expiryDate.setDate(lastDayOfMonth);
    expiryDate.setHours(23, 59, 59, 999);
    
    // Check if the card is expired
    if (expiryDate < today) {
      return { expired: true };
    }
    
    return null;
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substr(0, 16);


    const parts = value.match(/.{1,4}/g) || [];
    input.value = parts.join(' ');

    // Update form control
    this.paymentForm.get('cardNumber')?.setValue(input.value, { emitEvent: false });
  }

  formatExpiryDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length >= 2) {
      value = value.substr(0, 2) + '/' + value.substr(2, 2);
    }

    input.value = value;
    this.paymentForm.get('expiryDate')?.setValue(input.value, { emitEvent: false });
    
    // Check for validation errors
    const expiryControl = this.paymentForm.get('expiryDate');
    if (expiryControl?.errors?.['expired']) {
      this.expiryDateError = 'Card has expired. Please use a valid expiry date.';
    } else if (expiryControl?.errors?.['invalidFormat']) {
      this.expiryDateError = 'Invalid format. Use MM/YY format.';
    } else {
      this.expiryDateError = '';
    }
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      const practiceData = JSON.parse(localStorage.getItem('practiceData') || '{}');

      // Combine with payment data and subscription details
      const paymentData = {
        ...practiceData,
        payment: this.paymentForm.value,
        subscription: {
          type: this.subscriptionType,
          price: this.subscriptionPrice,
          userCount: this.userCount
        }
      };

      console.log('Processing payment with data:', paymentData);

      // Store subscription data
      localStorage.setItem('subscriptionData', JSON.stringify({
        type: this.subscriptionType,
        userCount: this.userCount
      }));

      // Store user email for future reference
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        localStorage.setItem('userEmail', userEmail);
      }

      // Navigate directly to dashboard after successful payment
      this.router.navigate(['/dashboard']);
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.paymentForm.controls).forEach(key => {
        this.paymentForm.get(key)?.markAsTouched();
      });
      
      // Check for expiry date errors specifically
      const expiryControl = this.paymentForm.get('expiryDate');
      if (expiryControl?.errors?.['expired']) {
        this.expiryDateError = 'Card has expired. Please use a valid expiry date.';
      }
    }
  }
}
