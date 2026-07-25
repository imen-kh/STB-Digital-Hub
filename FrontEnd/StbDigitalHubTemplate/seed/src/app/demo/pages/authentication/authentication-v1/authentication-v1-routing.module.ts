// Angular Imports
import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./v1-login/v1-login.component').then((c) => c.V1LoginComponent),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'register',
        loadComponent: () => import('./v1-register/v1-register.component').then((c) => c.V1RegisterComponent),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'forgetPassword',
        loadComponent: () => import('./v1-fr-password/v1-fr-password.component').then((c) => c.V1FrPasswordComponent),
        data: { roles: [Role.Admin, Role.User] }
      }
    ]
  }
];
