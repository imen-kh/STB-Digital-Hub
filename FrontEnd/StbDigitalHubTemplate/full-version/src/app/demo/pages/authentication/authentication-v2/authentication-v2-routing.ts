// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const AuthsRoutesV2: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./v2-login/v2-login.component').then((c) => c.V2LoginComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Login 2 | ${APP_TITLE}`
      },
      {
        path: 'register',
        loadComponent: () => import('./v2-register/v2-register.component').then((c) => c.V2RegisterComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Register 2 | ${APP_TITLE}`
      },
      {
        path: 'forgetPassword',
        loadComponent: () => import('./v2-fr-password/v2-fr-password.component').then((c) => c.V2FrPasswordComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Forget Password 2 | ${APP_TITLE}`
      },
      {
        path: 'checkMail',
        loadComponent: () => import('./v2-check-mail/v2-check-mail.component').then((c) => c.V2CheckMailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Check Mail 2 | ${APP_TITLE}`
      },
      {
        path: 'resetpassword',
        loadComponent: () => import('./v2-reset-password/v2-reset-password.component').then((c) => c.V2ResetPasswordComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Reset Password 2 | ${APP_TITLE}`
      },
      {
        path: 'codeVerification',
        loadComponent: () => import('./v2-code-verify/v2-code-verify.component').then((c) => c.V2CodeVerifyComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Code Verification 2 | ${APP_TITLE}`
      }
    ]
  }
];
