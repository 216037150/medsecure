import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="success-dialog" [@fadeIn]>
      <div class="dialog-content">
        <div class="success-icon">✓</div>
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <button (click)="onClose()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .dialog-content {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    .success-icon {
      font-size: 3rem;
      color: #4CAF50;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0 0 1rem;
      color: #333;
    }

    p {
      margin: 0 0 1.5rem;
      color: #666;
    }

    button {
      padding: 0.5rem 1.5rem;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background-color: #45a049;
    }
  `]
})
export class SuccessDialogComponent {
  @Input() title: string = 'Success!';
  @Input() message: string = 'Operation completed successfully.';
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }
}
