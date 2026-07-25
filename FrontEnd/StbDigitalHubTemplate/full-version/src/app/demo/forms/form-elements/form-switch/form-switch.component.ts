import { Component } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-form-switch',
  imports: [...SHARED_IMPORTS],
  templateUrl: './form-switch.component.html',
  styleUrl: './form-switch.component.scss'
})
export class FormSwitchComponent {
  switches = [
    { label: 'primary', class: 'input-primary' },
    { label: 'secondary', class: 'input-secondary' },
    { label: 'success', class: 'input-success' },
    { label: 'danger', class: 'input-danger' },
    { label: 'warning', class: 'input-warning' },
    { label: 'info', class: 'input-info' },
    { label: 'dark', class: 'input-dark' }
  ];
  switches_light = [
    { label: 'primary', class: 'input-light-primary' },
    { label: 'secondary', class: 'input-light-secondary' },
    { label: 'success', class: 'input-light-success' },
    { label: 'danger', class: 'input-light-danger' },
    { label: 'warning', class: 'input-light-warning' },
    { label: 'info', class: 'input-light-info' },
    { label: 'dark', class: 'input-light-dark' }
  ];
}
