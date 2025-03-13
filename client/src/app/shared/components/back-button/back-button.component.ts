import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="back-button" (click)="goBack()">
      <i class="fas fa-arrow-left"></i>
      <span>{{ text || 'Back' }}</span>
    </button>
  `,
  styles: [`
    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 8px;
    }
    .back-button i {
      font-size: 14px;
    }
  `]
})
export class BackButtonComponent {
  @Input() text: string = '';
  @Input() route: string | null = null;

  constructor(private router: Router) {}

  goBack() {
    if (this.route) {
      this.router.navigate([this.route]);
    } else {
      window.history.back();
    }
  }
}
