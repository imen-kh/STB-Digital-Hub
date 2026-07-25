// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const PriceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'price-1',
        loadComponent: () => import('./price-v1/price-v1.component').then((c) => c.PriceV1Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `Price 1 | ${APP_TITLE}`
      },
      {
        path: 'price-2',
        loadComponent: () => import('./price-v2/price-v2.component').then((c) => c.PriceV2Component),
        data: { roles: [Role.Admin, Role.User] },
        title: `Price 2 | ${APP_TITLE}`
      }
    ]
  }
];
