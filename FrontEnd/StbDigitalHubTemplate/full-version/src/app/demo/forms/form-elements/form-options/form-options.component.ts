// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-form-options',
  imports: [...SHARED_IMPORTS],
  templateUrl: './form-options.component.html',
  styleUrl: './form-options.component.scss'
})
export class FormOptionsComponent {
  formInput = [
    { label: 'Simple Input Text', type: 'text', value: 'John Doe', id: 'demo-text-input' },
    { label: 'Number', type: 'number', value: 100, id: 'demo-number-input' },
    { label: 'Telephone', type: 'tel', value: '+918888888888', id: 'demo-tel-input' },
    { label: 'Email', type: 'email', value: 'demo@example.com', id: 'demo-email-input' },
    { label: 'Password', type: 'password', value: 'password123', id: 'demo-password-input' },
    { label: 'URL', type: 'url', value: 'https://validator.w3.org/', id: 'demo-URL-input' },
    {
      label: 'Search',
      type: 'search',
      value: 'Best Admin Template',
      id: 'demo-search-input',
      smallText: 'A search field behaves like a regular text field.'
    }
  ];

  formInputs = [
    { label: 'Date Time Local', type: 'datetime-local', value: '2021-12-31T04:03:20', id: 'demo-datetime-local' },
    { label: 'Date only', type: 'date', value: '2021-12-31', id: 'demo-date-only' },
    { label: 'Time only', type: 'time', value: '04:03:20', id: 'demo-time-only' },
    { label: 'Month only', type: 'month', value: '2021-12', id: 'demo-month-only' },
    { label: 'Week only', type: 'week', value: '2021-W41', id: 'demo-week-only' },
    { label: 'Color', type: 'color', value: '#5052FC', id: 'demo-color-input', style: 'form-control-color-picker' }
  ];
}
