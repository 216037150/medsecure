import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SubscriptionComponent {
  @ViewChild('userInput') userInput!: ElementRef;

  basePrice: number = 500;
  totalPrice: number = this.basePrice;
  userCount: number = 5;
  isEditing: boolean = false;
  tempUserCount: string = '';
  showingBenefits: boolean = false;
  readonly PRICE_INCREMENT = 100;
  readonly USER_INCREMENT = 1;
  readonly MIN_USERS = 5;

  constructor(private router: Router) {}

  showBenefits(): void {
    this.showingBenefits = true;
    document.body.style.overflow = 'hidden';
  }

  hideBenefits(): void {
    this.showingBenefits = false;
    document.body.style.overflow = 'auto';
  }

  incrementPrice(): void {
    this.totalPrice += this.PRICE_INCREMENT;
    this.userCount += this.USER_INCREMENT;
  }

  decrementPrice(): void {
    if (this.totalPrice > this.basePrice) {
      this.totalPrice -= this.PRICE_INCREMENT;
      this.userCount -= this.USER_INCREMENT;
    }
  }

  startEditing(): void {
    this.tempUserCount = this.userCount.toString();
    this.isEditing = true;
    setTimeout(() => {
      if (this.userInput) {
        const input = this.userInput.nativeElement;
        input.focus();
        input.style.width = this.getInputWidth(this.tempUserCount);
      }
    });
  }

  onUserCountBlur(): void {
    this.updateUserCount();
  }

  onUserCountKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onUserCountBlur();
    } else if (event.key === 'Escape') {
      this.isEditing = false;
    }

    // Update input width as user types
    const input = this.userInput.nativeElement;
    input.style.width = this.getInputWidth(input.value);
  }

  private getInputWidth(value: string): string {
    const minWidth = 30;
    const charWidth = 14;
    const contentWidth = Math.max(minWidth, (value.length * charWidth) + 16);
    return `${contentWidth}px`;
  }

  private updateUserCount(): void {
    const newCount = parseInt(this.tempUserCount);
    if (!isNaN(newCount) && newCount >= this.MIN_USERS) {
      this.userCount = newCount;
      this.totalPrice = this.basePrice + (this.userCount - this.MIN_USERS) * this.PRICE_INCREMENT;
    } else {
      this.tempUserCount = this.userCount.toString();
    }
    this.isEditing = false;
  }

  // Handler for the Start Free Trial button
  startFreeTrial(): void {
    localStorage.setItem('subscriptionType', 'trial');
    this.router.navigate(['/payment/practice-info']);
  }

  proceedToCheckout(): void {
    localStorage.setItem('subscriptionType', 'premium');
    localStorage.setItem('userCount', this.userCount.toString());
    localStorage.setItem('subscriptionPrice', this.totalPrice.toString());
    this.router.navigate(['/payment/practice-info']);
  }
}
