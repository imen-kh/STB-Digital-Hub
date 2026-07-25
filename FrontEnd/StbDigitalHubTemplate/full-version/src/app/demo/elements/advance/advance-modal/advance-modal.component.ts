// Angular import
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AnimationModalComponent } from 'src/app/theme/shared/components/modal/animation-modal/animation-modal.component';

@Component({
  selector: 'app-advance-modal',
  imports: [...SHARED_IMPORTS, AnimationModalComponent],
  templateUrl: './advance-modal.component.html',
  styleUrl: './advance-modal.component.scss'
})
export class AdvanceModalComponent {
  // private Method
  openMyModal(event: string) {
    document.querySelector('#' + event)?.classList.add('md-show');
  }

  closeMyModal(event: {
    target: { parentElement: { parentElement: { parentElement: { classList: { remove: (arg0: string) => void } } } } };
  }) {
    event.target.parentElement.parentElement.parentElement.classList.remove('md-show');
  }
}
