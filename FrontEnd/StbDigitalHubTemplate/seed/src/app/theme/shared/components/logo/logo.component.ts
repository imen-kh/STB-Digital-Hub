import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss'
})
export class Logo {
  isIconOnly = input<boolean>(false);
  primary = 'var(--bs-primary)';
  secondary = 'var(--bs-secondary)';
}
