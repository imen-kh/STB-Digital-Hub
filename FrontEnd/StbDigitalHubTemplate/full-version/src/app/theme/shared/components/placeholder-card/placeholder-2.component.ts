import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-card-2',
  imports: [],
  template: `
    <div>
      @if (showH1() === true) {
        <h1 class="placeholder-glow">
          <span class="placeholder w-100 col-12"></span>
        </h1>
      }
      <p class="placeholder-glow">
        @for (item of lines; track item) {
          <span class="placeholder w-100 col-12 mb-2" style="height: {{ height() }}px;"></span>
        }
      </p>
    </div>
  `
})
export class PlaceholderCard2Component {
  height = input<number>();
  showH1 = input<boolean>(false);
  ShowLine = input<number>(0);

  get lines(): number[] {
    return Array.from({ length: this.ShowLine() }, (_, index) => index);
  }
}
