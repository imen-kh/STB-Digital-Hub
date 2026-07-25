// angular imports
import { Routes } from '@angular/router';
import { CalenderComponent } from './calender.component';

// third party
import { provideCalendar, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { provideFlatpickrDefaults } from 'angularx-flatpickr';

export const calenderRoutes: Routes = [
  {
    path: '',
    component: CalenderComponent,
    providers: [
      provideCalendar({
        provide: DateAdapter,
        useFactory: adapterFactory
      }),
      provideFlatpickrDefaults()
    ]
  }
];
