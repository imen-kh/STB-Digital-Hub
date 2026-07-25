// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const UserCardRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'styleV1',
        loadComponent: () => import('./card-style-v1/card-style-v1.component').then((c) => c.CardStyleV1Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `Style 1 | ${APP_TITLE}`
      },
      {
        path: 'styleV2',
        loadComponent: () => import('./card-style-v2/card-style-v2.component').then((c) => c.CardStyleV2Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `Style 2 | ${APP_TITLE}`
      },
      {
        path: 'styleV3',
        loadComponent: () => import('./card-style-v3/card-style-v3.component').then((c) => c.CardStyleV3Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `Style 3 | ${APP_TITLE}`
      }
    ]
  }
];
