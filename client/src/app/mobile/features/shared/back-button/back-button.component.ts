import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.css']
})
export class BackButtonComponent {
  private navigationHistory: string[] = [];  // Stores history of visited routes

  constructor(private location: Location, private router: Router) {
    // Listen for route changes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.navigationHistory.push(event.urlAfterRedirects);  // Track every successful navigation
      }
    });
  }

  // Go back to the previous screen
  goBack() {
    if (this.navigationHistory.length > 1) {
      this.navigationHistory.pop(); // Remove the current route
      const previousRoute = this.navigationHistory[this.navigationHistory.length - 1];  // Get the previous route
      this.router.navigateByUrl(previousRoute);  // Navigate to the previous route
    } else {
      this.router.navigate(['/mobile/dashboard']);  // Default route when history is empty
    }
  }
}
