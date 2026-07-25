// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const AuthsRoutesV1: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./v1-login/v1-login.component').then((c) => c.V1LoginComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Login 1 | ${APP_TITLE}`
      },
      {
        path: 'register',
        loadComponent: () => import('./v1-register/v1-register.component').then((c) => c.V1RegisterComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Register 1 | ${APP_TITLE}`
      },
      {
        path: 'forgetPassword',
        loadComponent: () => import('./v1-fr-password/v1-fr-password.component').then((c) => c.V1FrPasswordComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Forget Password 1 | ${APP_TITLE}`
      },
      {
        path: 'checkMail',
        loadComponent: () => import('./v1-check-mail/v1-check-mail.component').then((c) => c.V1CheckMailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Check Mail 1 | ${APP_TITLE}`
      },
      {
        path: 'resetpassword',
        loadComponent: () => import('./v1-reset-password/v1-reset-password.component').then((c) => c.V1ResetPasswordComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Reset Password 1 | ${APP_TITLE}`
      },
      {
        path: 'codeVerification',
        loadComponent: () => import('./v1-code-verify/v1-code-verify.component').then((c) => c.V1CodeVerifyComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Code Verification 1 | ${APP_TITLE}`
      }
    ]
  }
];
