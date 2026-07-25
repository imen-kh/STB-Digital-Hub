// Angular Imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'auth1',
        loadChildren: () => import('./authentication-v1/authentication-v1.module').then((m) => m.routes),
        data: { roles: [Role.Admin, Role.User] }
      }
    ]
  }
];
