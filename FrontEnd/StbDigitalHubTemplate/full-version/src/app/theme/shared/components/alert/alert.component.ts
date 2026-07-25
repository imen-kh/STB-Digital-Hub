// angular import
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
export class AlertComponent {
  // public props
  type = input.required<string>();
  dismiss = input.required<string>();

  // public method
  dismissAlert(element: { remove: () => void }) {
    element.remove();
  }
}
