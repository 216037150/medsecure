import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-backdrop" (click)="close()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <div class="success-icon">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="actions">
          <button (click)="close()">Got it!</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .dialog-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      animation: scaleIn 0.3s ease-out;
    }

    .success-icon {
      font-size: 3rem;
      color: #48bb78;
      margin-bottom: 1rem;
    }

    .success-icon i {
      animation: scaleIn 0.3s ease-out;
    }

    h2 {
      color: #2d3748;
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    p {
      color: #64748b;
      margin: 0 0 1.5rem;
    }

    .actions button {
      background: #199A8E;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .actions button:hover {
      background: #158276;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(25, 154, 142, 0.2);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `]
})
export class SuccessDialogComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
