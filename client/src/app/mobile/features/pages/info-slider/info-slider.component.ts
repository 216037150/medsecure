import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';

@Component({
  selector: 'app-info-slider',
  imports: [],
  templateUrl: './info-slider.component.html',
  styleUrl: './info-slider.component.css'
})
export class InfoSliderComponent {
  @Input() infoImg!: string;
  @Input() heading!: string;
  @Input() description!: string;
  @Output() nextPage = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<void>();

  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private minSwipeDistance = 50;

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
      this.nextPage.emit();
    } else {
      this.previousPage.emit();
    }
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) >= this.minSwipeDistance) {
      if (swipeDistance > 0) {
        this.previousPage.emit();
      } else {
        this.nextPage.emit();
      }
    }
  }
}
