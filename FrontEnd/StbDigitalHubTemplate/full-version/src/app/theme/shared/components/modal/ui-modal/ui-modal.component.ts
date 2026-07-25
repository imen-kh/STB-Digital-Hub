// Angular import
import { Component, ViewEncapsulation, input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

@Component({
  selector: 'app-ui-modal',
  imports: [NgClass, NgStyle],
  templateUrl: './ui-modal.component.html',
  styleUrl: './ui-modal.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class UiModalComponent {
  // public props
  dialogClass = input.required<string>();
  hideHeader = input(false);
  hideFooter = input(false);
  containerClick = input(true);
  visible = false;
  visibleAnimate = false;

  // public method
  show(): void {
    this.visible = true;
    setTimeout(() => (this.visibleAnimate = true), 100);
    (document.querySelector('body') as HTMLBodyElement).classList.add('modal-open');
  }

  hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => (this.visible = false), 300);
    (document.querySelector('body') as HTMLBodyElement).classList.remove('modal-open');
  }

  onContainerClicked(event: MouseEvent): void {
    if ((<HTMLElement>event.target).classList.contains('modal') && this.containerClick() === true) {
      this.hide();
    }
  }
}
