import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [NgIf, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  activeTab: string = '';

  constructor(private router: Router) {
    // Listen to route changes and update the active tab accordingly
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActiveTabFromRoute(event.url);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setActiveTabFromRoute(url: string): void {
    if (url.includes('/patient-dashboard')) {
      this.activeTab = 'home';
    } else if (url.includes('/schedule')) {
      this.activeTab = 'appointments';
    } else if (url.includes('/appointment-booking')) {
      this.activeTab = 'calendar';
    } else if (url.includes('/patient-profile')) {
      this.activeTab = 'profile';
    }else if (url.includes('/patient-update-profile')) {
      this.activeTab = 'profile';
    }
  }
}
