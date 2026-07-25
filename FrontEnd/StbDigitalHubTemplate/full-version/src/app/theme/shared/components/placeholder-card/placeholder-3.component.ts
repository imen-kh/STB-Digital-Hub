import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-card-3',
  imports: [],
  template: `
    <div class="card" aria-hidden="true">
      <svg class="bd-placeholder-img card-img-top" style="height: {{ imgHeight() }}px;">
        <rect width="100%" height="100%" fill="#868e96"></rect>
      </svg>
      <div class="card-body">
        @if (showTitle()) {
          <h5 class="card-title placeholder-glow">
            <span class="placeholder col-6"></span>
          </h5>
        }
        <p class="card-text placeholder-glow">
          @for (item of lines; track item) {
            <span class="placeholder col-12 mb-2" style="height: {{ height() }}px;"></span>
          }
        </p>
      </div>
    </div>
  `
})
export class PlaceholderCard3Component {
  height = input<number>();
  imgHeight = input<number>();
  showH1 = input<boolean>(false);
  showTitle = input<boolean>(false);
  ShowLine = input<number>(0);

  get lines(): number[] {
    return Array.from({ length: this.ShowLine() }, (_, index) => index);
  }
}
