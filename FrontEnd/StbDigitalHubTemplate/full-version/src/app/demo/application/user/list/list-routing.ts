// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const UserListRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'listStyleV1',
        loadComponent: () => import('./list-style-v1/list-style-v1.component').then((c) => c.ListStyleV1Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `List 1 | ${APP_TITLE}`
      },
      {
        path: 'listStyleV2',
        loadComponent: () => import('./list-style-v2/list-style-v2.component').then((c) => c.ListStyleV2Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `List 2 | ${APP_TITLE}`
      }
    ]
  }
];
