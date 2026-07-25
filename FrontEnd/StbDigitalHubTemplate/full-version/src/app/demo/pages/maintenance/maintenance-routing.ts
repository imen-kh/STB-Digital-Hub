// angular imports
import { Routes } from '@angular/router';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const MaintenanceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'error404',
        loadComponent: () => import('./maintain-error/maintain-error.component').then((c) => c.MaintainErrorComponent),
        title: `Error 404 | ${APP_TITLE}`
      },
      {
        path: 'comingSoon',
        loadChildren: () => import('./coming-soon/coming-soon-routing').then((m) => m.ComingSoonRoutes)
      },
      {
        path: 'constructor',
        loadComponent: () => import('./under-constructor/under-constructor.component').then((c) => c.UnderConstructorComponent),
        title: `Under Construction | ${APP_TITLE}`
      }
    ]
  }
];
