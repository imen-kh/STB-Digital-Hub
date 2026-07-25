// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const CoreChartRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'apex-chart',
        loadComponent: () => import('./apex-chart/apex-chart.component').then((c) => c.ApexChartComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Apex chart | ${APP_TITLE}`
      }
    ]
  }
];
