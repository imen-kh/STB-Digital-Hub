import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appToastContainer]',
  exportAs: 'toastContainer'
})
export class ToastContainerDirective {
  private el = inject(ElementRef);

  getContainerElement(): HTMLElement {
    return this.el.nativeElement;
  }
}
