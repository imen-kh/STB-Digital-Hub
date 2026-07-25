// angular imports
import { Routes } from '@angular/router';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const ComingSoonRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'comingSoon-1',
        loadComponent: () => import('./coming-soon-v1/coming-soon-v1.component').then((c) => c.ComingSoonV1Component),
        title: `Coming Soon 1 | ${APP_TITLE}`
      },
      {
        path: 'comingSoon-2',
        loadComponent: () => import('./coming-soon-v2/coming-soon-v2.component').then((c) => c.ComingSoonV2Component),
        title: `Coming Soon 2 | ${APP_TITLE}`
      }
    ]
  }
];
