// Angular import
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appTodoCardComplete]',
  host: { '(click)': 'onToggle($event)' }
})
export class TodoCardCompleteDirective {
  private elements = inject(ElementRef);

  // public method
  onToggle($event: { preventDefault: () => void }) {
    $event.preventDefault();
    this.elements.nativeElement.classList.toggle('complete');
  }
}
