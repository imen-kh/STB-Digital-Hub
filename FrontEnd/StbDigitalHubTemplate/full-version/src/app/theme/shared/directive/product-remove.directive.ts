// Angular import
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appProductRemove]',
  host: { '(click)': 'onToggle($event)' }
})
export class ProductRemoveDirective {
  private elements = inject(ElementRef);

  // public method
  onToggle($event: { preventDefault: () => void }) {
    $event.preventDefault();
    const parent = this.elements.nativeElement.parentElement.parentElement.parentElement;
    parent.remove();
  }
}
