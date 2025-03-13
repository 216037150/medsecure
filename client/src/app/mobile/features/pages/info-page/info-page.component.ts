import { Component, Input, HostListener } from '@angular/core';
import { InfoSliderComponent } from '../info-slider/info-slider.component';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-info-page',
  imports: [InfoSliderComponent, NgIf, NgClass, RouterLink],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.css'
})
export class InfoPageComponent {
  @Input() color!: string;
  @Input() description: string = '';
  index: number = 0;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private minSwipeDistance = 50;
  private totalSlides = 3; // Update this based on your total number of slides
  private isGetStartedScreen = false;

  constructor(private router: Router) {}

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
    
    // Only allow right-side tap if not on Get Started screen
    if (clickX > screenWidth / 2 && !this.isGetStartedScreen) {
      this.nextSlide();
    } else if (clickX <= screenWidth / 2) {
      this.previousSlide();
    }
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) >= this.minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous
        this.previousSlide();
      } else {
        // Swipe left - go to next if not on Get Started screen
        if (!this.isGetStartedScreen) {
          this.nextSlide();
        }
      }
    }
  }

  nextSlide() {
    if (this.index < this.totalSlides - 1) {
      this.switch(this.index + 1);
    } else {
      // Navigate to the next page/route when reaching the last slide
      this.router.navigate(['/mobile/login']);
    }
  }

  previousSlide() {
    if (this.index > 0) {
      this.switch(this.index - 1);
    }
  }

  switch(index: number) {
    if (index >= 0 && index < this.totalSlides) {
      this.index = index;
      // Check if this is the Get Started screen (last slide)
      this.isGetStartedScreen = (index === this.totalSlides - 1);
    }
  }
}
