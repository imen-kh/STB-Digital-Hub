// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-checkbox',
  imports: [...SHARED_IMPORTS],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss'
})
export class CheckboxComponent {
  colorTypes = [
    {
      colors: [
        { id: 'customCheck1', checked: true, label: 'primary', type: 'input-primary' },
        { id: 'customCheck2', checked: true, label: 'secondary', type: 'input-secondary' },
        { id: 'customCheck3', checked: true, label: 'success', type: 'input-success' },
        { id: 'customCheck4', checked: true, label: 'danger', type: 'input-danger' },
        { id: 'customCheck5', checked: true, label: 'warning', type: 'input-warning' },
        { id: 'customCheck6', checked: true, label: 'info', type: 'input-info' },
        { id: 'customCheck7', checked: true, label: 'dark', type: 'input-dark' }
      ]
    },
    {
      colors: [
        { id: 'customCheckLight1', checked: true, label: 'primary light', type: 'input-light-primary' },
        { id: 'customCheckLight2', checked: true, label: 'secondary light', type: 'input-light-secondary' },
        { id: 'customCheckLight3', checked: true, label: 'success light', type: 'input-light-success' },
        { id: 'customCheckLight4', checked: true, label: 'danger light', type: 'input-light-danger' },
        { id: 'customCheckLight5', checked: true, label: 'warning light', type: 'input-light-warning' },
        { id: 'customCheckLight6', checked: true, label: 'info light', type: 'input-light-info' },
        { id: 'customCheckLight7', checked: true, label: 'dark light', type: 'input-light-dark' }
      ]
    }
  ];
}
