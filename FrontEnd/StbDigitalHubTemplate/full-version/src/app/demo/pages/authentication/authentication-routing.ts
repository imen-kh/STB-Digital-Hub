// angular imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

export const AuthsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'auth1',
        loadChildren: () => import('./authentication-v1/authentication-v1-routing').then((m) => m.AuthsRoutesV1),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'auth2',
        loadChildren: () => import('./authentication-v2/authentication-v2-routing').then((m) => m.AuthsRoutesV2),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'auth3',
        loadChildren: () => import('./authentication-v3/authentication-v3-routing').then((m) => m.AuthsRoutesV3),
        data: { roles: [Role.Admin, Role.User] }
      }
    ]
  }
];
