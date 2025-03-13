import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ApiError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  formatPhoneNumber(phone: string): string {
    // Assuming SA phone number format
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }
    return phone;
  }

  getValidationMessage(error: ValidationErrors): string {
    if (error['required']) {
      return 'This field is required';
    }
    if (error['email']) {
      return 'Please enter a valid email address';
    }
    if (error['minlength']) {
      return `Minimum length is ${error['minlength'].requiredLength} characters`;
    }
    if (error['maxlength']) {
      return `Maximum length is ${error['maxlength'].requiredLength} characters`;
    }
    if (error['pattern']) {
      return 'Please enter a valid value';
    }
    return 'Invalid value';
  }

  handleError(error: any): ApiError {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return {
        message: error.error.message,
        code: 'CLIENT_ERROR'
      };
    }
    // Server-side error
    return {
      message: error.error?.message || 'An error occurred',
      code: error.error?.code || 'SERVER_ERROR',
      details: error.error?.details
    };
  }

  generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number = 30): string[] {
    const slots: string[] = [];
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);

    while (start < end) {
      slots.push(start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
      start.setMinutes(start.getMinutes() + intervalMinutes);
    }

    return slots;
  }

  capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}
