// Angular import
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appProductComplete]',
  host: { '(click)': 'onToggle($event)' }
})
export class ProductCompleteDirective {
  private elements = inject(ElementRef);

  // public method
  onToggle($event: { preventDefault: () => void }) {
    $event.preventDefault();
    this.elements.nativeElement.classList.toggle('done');
  }
}
