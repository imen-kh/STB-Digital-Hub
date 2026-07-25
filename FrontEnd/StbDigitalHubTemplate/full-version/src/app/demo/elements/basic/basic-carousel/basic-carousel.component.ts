import { Component, input, viewChild, inject } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { NgbCarouselConfig, NgbCarousel, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-basic-carousel',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-carousel.component.html',
  styleUrl: './basic-carousel.component.scss'
})
export class BasicCarouselComponent {
  // private props
  showNavigationIndicators = input.required<boolean>();
  carousel = viewChild.required<NgbCarousel>('carousel');
  paused = false;
  unpauseOnArrow = false;
  pauseOnIndicator = false;
  pauseOnHover = true;
  pauseOnFocus = true;

  // public props
  configService = inject(ConfigService);

  // Constructor
  constructor() {
    const config = inject(NgbCarouselConfig);

    config.showNavigationArrows = true;
    config.showNavigationIndicators = true;
  }

  // private method
  togglePaused() {
    if (this.paused) {
      this.carousel().cycle();
    } else {
      this.carousel().pause();
    }
    this.paused = !this.paused;
  }

  onSlide(slideEvent: NgbSlideEvent) {
    if (
      this.unpauseOnArrow &&
      slideEvent.paused &&
      (slideEvent.source === NgbSlideEventSource.ARROW_LEFT || slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)
    ) {
      this.togglePaused();
    }
    if (this.pauseOnIndicator && !slideEvent.paused && slideEvent.source === NgbSlideEventSource.INDICATOR) {
      this.togglePaused();
    }
  }
}
