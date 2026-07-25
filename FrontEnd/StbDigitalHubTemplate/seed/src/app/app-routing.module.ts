// Angular Imports
import { Routes } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { authGuardChild } from './theme/shared/_helpers/auth.guard';
import { Role } from './theme/shared/_helpers/role';

export const appRoutes: Routes = [
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: '',
        loadComponent: () =>
          import('./demo/pages/authentication/authentication-v1/v1-login/v1-login.component').then((c) => c.V1LoginComponent)
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./demo/pages/authentication/authentication-v1/v1-login/v1-login.component').then((c) => c.V1LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/authentication-v1/v1-register/v1-register.component').then((c) => c.V1RegisterComponent)
      },
      {
        path: 'forgetPassword',
        loadComponent: () =>
          import('./demo/pages/authentication/authentication-v1/v1-fr-password/v1-fr-password.component').then(
            (c) => c.V1FrPasswordComponent
          ),
        data: { roles: [Role.Admin, Role.User] }
      }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    canActivateChild: [authGuardChild],
    children: [
      {
        path: 'samplePage',
        loadComponent: () => import('./demo/other/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      }
    ]
  }
];
