import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="show" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <i class="bi bi-exclamation-circle"></i>
          <h3>{{ title }}</h3>
          <button class="close-button" (click)="onClose()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="action-button" (click)="onActionClick()" *ngIf="actionText">
            {{ actionText }}
          </button>
          <button class="close-button-text" (click)="onClose()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideIn 0.3s ease-out;
    }

    .modal-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header i.bi-exclamation-circle {
      font-size: 1.5rem;
      color: #dc2626;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #111827;
      flex-grow: 1;
    }

    .close-button {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-button:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-body p {
      margin: 0;
      color: #4b5563;
      line-height: 1.5;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .action-button {
      background: #199a8e;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-button:hover {
      background: #168276;
    }

    .close-button-text {
      background: none;
      border: none;
      padding: 0.5rem 1rem;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-button-text:hover {
      background: #f3f4f6;
      color: #111827;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ErrorModalComponent {
  @Input() show = false;
  @Input() title = 'Error';
  @Input() message = '';
  @Input() actionText = '';
  @Input() onAction: () => void = () => {};
  @Output() showChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.show = false;
    this.showChange.emit(false);
    this.close.emit();
  }

  onActionClick() {
    this.onAction();
    this.onClose();
  }
}
