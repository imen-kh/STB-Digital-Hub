// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const AuthsRoutesV3: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./v3-login/v3-login.component').then((c) => c.V3LoginComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Login 3 | ${APP_TITLE}`
      },
      {
        path: 'register',
        loadComponent: () => import('./v3-register/v3-register.component').then((c) => c.V3RegisterComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Register 3 | ${APP_TITLE}`
      },
      {
        path: 'forgetPassword',
        loadComponent: () => import('./v3-fr-password/v3-fr-password.component').then((c) => c.V3FrPasswordComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Forget Password 3 | ${APP_TITLE}`
      },
      {
        path: 'checkMail',
        loadComponent: () => import('./v3-check-mail/v3-check-mail.component').then((c) => c.V3CheckMailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Check Mail 3 | ${APP_TITLE}`
      },
      {
        path: 'resetpassword',
        loadComponent: () => import('./v3-reset-password/v3-reset-password.component').then((c) => c.V3ResetPasswordComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Reset Password 3 | ${APP_TITLE}`
      },
      {
        path: 'codeVerification',
        loadComponent: () => import('./v3-code-verify/v3-code-verify.component').then((c) => c.V3CodeVerifyComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Code Verification 3 | ${APP_TITLE}`
      }
    ]
  }
];
