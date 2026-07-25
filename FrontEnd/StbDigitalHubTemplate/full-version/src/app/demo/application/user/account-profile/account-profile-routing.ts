// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const AccountProfileRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'profileOne',
        loadComponent: () => import('./profile-one/profile-one.component').then((c) => c.ProfileOneComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Profile 1 | ${APP_TITLE}`
      },
      {
        path: 'profileTwo',
        loadComponent: () => import('./profile-two/profile-two.component').then((c) => c.ProfileTwoComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Profile 2 | ${APP_TITLE}`
      },
      {
        path: 'profileThree',
        loadComponent: () => import('./profile-three/profile-three.component').then((c) => c.ProfileThreeComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Profile 3 | ${APP_TITLE}`
      }
    ]
  }
];
