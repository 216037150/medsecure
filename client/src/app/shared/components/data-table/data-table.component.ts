import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumn } from '../../models';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-data-table',
  template: `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th *ngFor="let column of columns" 
                [ngClass]="{'sortable': column.sortable}"
                (click)="column.sortable ? sort.emit(column.field) : null">
              {{ column.header }}
              <span *ngIf="column.sortable" class="sort-icon">
                {{ column.field === sortField ? (sortOrder === 'asc' ? '↑' : '↓') : '↕' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of data">
            <td *ngFor="let column of columns">
              {{ column.format ? column.format(item) : item[column.field] }}
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="data.length === 0" class="no-data">
        No data available
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      width: 100%;
      overflow-x: auto;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
    }
    .sortable {
      cursor: pointer;
    }
    .sort-icon {
      margin-left: 0.5rem;
      opacity: 0.5;
    }
    .no-data {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }
  `]
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() sortField: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Output() sort = new EventEmitter<string>();
}
