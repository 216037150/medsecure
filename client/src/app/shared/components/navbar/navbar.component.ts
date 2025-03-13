import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="title">{{ title }}</div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      padding: 0 16px;
      background-color: var(--bg-white);
      border-bottom: 1px solid var(--border-color);
    }
    .title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  `]
})
export class NavbarComponent {
  @Input() title: string = '';
}
