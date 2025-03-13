import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash-page',
  imports: [],
  templateUrl: './splash-page.component.html',
  styleUrls: ['./splash-page.component.css']
})
export class SplashPageComponent implements OnInit {
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private minSwipeDistance = 50;
  private navigationTimer: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.navigationTimer = setTimeout(() => {
      this.navigateToInfo();
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const screenWidth = window.innerWidth;
    const clickX = event.clientX;
    
    if (clickX > screenWidth / 2) {
      this.navigateToInfo();
    }
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) >= this.minSwipeDistance) {
      if (swipeDistance < 0) {
        // Swipe left - go to next
        this.navigateToInfo();
      }
    }
  }

  navigateToInfo(): void {
    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
    }
    this.router.navigate(['/mobile/info']);
  }
}