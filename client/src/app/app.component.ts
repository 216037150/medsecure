import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule],
  host: {
    'style': 'display: block; min-height: 100vh; background-color: var(--bg-main);'
  }
})
export class AppComponent {
  title = 'MedSecura';
}
