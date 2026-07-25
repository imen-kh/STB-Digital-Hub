import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-card-1',
  imports: [NgClass],
  template: `
    <div class="card" [ngClass]="customClass()" aria-hidden="true">
      <p class="card-text placeholder-glow">
        <span class="placeholder w-100 rounded" style="height: {{ height() }}px;"></span>
      </p>
    </div>
  `
})
export class PlaceholderCard1Component {
  height = input<number>();
  customClass = input<string>();
}
