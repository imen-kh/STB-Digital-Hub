// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const CoreMapRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'googleMap',
        loadChildren: () => import('./google-map/google-map.module').then((m) => m.routes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Google Map | ${APP_TITLE}`
      }
    ]
  }
];
