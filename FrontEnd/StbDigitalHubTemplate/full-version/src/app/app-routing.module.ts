// angular imports
import { Routes } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { authGuardChild } from './theme/shared/_helpers/auth.guard';
import { Role } from './theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

// Eager-loaded entry pages (landing, auth, error) for faster initial load
import { LandingComponent } from './demo/pages/landing/landing.component';
import { V1LoginComponent } from './demo/pages/authentication/authentication-v1/v1-login/v1-login.component';
import { V1RegisterComponent } from './demo/pages/authentication/authentication-v1/v1-register/v1-register.component';
import { V1VerifyOtpComponent } from './demo/pages/authentication/authentication-v1/v1-verify-otp/v1-verify-otp.component';
import { V1FrPasswordComponent } from './demo/pages/authentication/authentication-v1/v1-fr-password/v1-fr-password.component';
import { V1ResetPasswordComponent } from './demo/pages/authentication/authentication-v1/v1-reset-password/v1-reset-password.component';

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
        component: LandingComponent,
        title: `Landing | ${APP_TITLE}`
      },
      {
        path: 'login',
        component: V1LoginComponent,
        title: `Connexion | ${APP_TITLE}`
      },
      {
        path: 'register',
        component: V1RegisterComponent,
        title: `Inscription | ${APP_TITLE}`
      },
      {
        path: 'verify-otp',
        component: V1VerifyOtpComponent,
        title: `Vérification OTP | ${APP_TITLE}`
      },
      {
        path: 'forgetPassword',
        component: V1FrPasswordComponent,
        title: `Mot de passe oublié | ${APP_TITLE}`
      },
      {
        path: 'reset-password',
        component: V1ResetPasswordComponent,
        title: `Réinitialisation | ${APP_TITLE}`
      },
      {
        path: 'landing',
        component: LandingComponent,
        title: `Landing | ${APP_TITLE}`
      },
      {
        path: 'maintenance',
        loadChildren: () => import('./demo/pages/maintenance/maintenance-routing').then((m) => m.MaintenanceRoutes)
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./demo/pages/maintenance/unauthorize-error/unauthorize-error.component').then((c) => c.UnauthorizeErrorComponent),
        title: `Unauthorized | ${APP_TITLE}`
      }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    canActivateChild: [authGuardChild],
    children: [
      {
        path: '',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `${APP_TITLE}`
      },
      {
        path: 'default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Accueil | ${APP_TITLE}`
      },
      {
        path: 'profil',
        loadComponent: () => import('./demo/pages/client-profile/client-profile.component').then((c) => c.ClientProfileComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Mon profil | ${APP_TITLE}`
      },
      {
        path: 'digi-carte',
        loadComponent: () => import('./demo/pages/digi-carte/digi-carte.component').then((c) => c.DigiCarteComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `DigiCarte | ${APP_TITLE}`
      },
      {
        path: 'digi-carte/:id',
        loadComponent: () => import('./demo/pages/digi-carte/digi-carte-detail.component').then((c) => c.DigiCarteDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail carte | ${APP_TITLE}`
      },
      {
        path: 'digi-credit',
        loadComponent: () => import('./demo/pages/digi-credit/digi-credit.component').then((c) => c.DigiCreditComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `DigiCrédit | ${APP_TITLE}`
      },
      {
        path: 'digi-credit/:id',
        loadComponent: () => import('./demo/pages/digi-credit/digi-credit-detail.component').then((c) => c.DigiCreditDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail crédit | ${APP_TITLE}`
      },
      {
        path: 'digi-epargne',
        loadComponent: () => import('./demo/pages/digi-epargne/digi-epargne.component').then((c) => c.DigiEpargneComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `DigiÉpargne | ${APP_TITLE}`
      },
      {
        path: 'digi-transfert',
        loadComponent: () => import('./demo/pages/digi-transfert/digi-transfert.component').then((c) => c.DigiTransfertComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `DigiTransfert | ${APP_TITLE}`
      },
      {
        path: 'digi-transfert/:id',
        loadComponent: () =>
          import('./demo/pages/digi-transfert/digi-transfert-detail.component').then((c) => c.DigiTransfertDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail virement | ${APP_TITLE}`
      },
      {
        path: 'comptes',
        loadComponent: () => import('./demo/pages/digi-compte/digi-compte.component').then((c) => c.DigiCompteComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Mes comptes | ${APP_TITLE}`
      },
      {
        path: 'comptes/:id',
        loadComponent: () => import('./demo/pages/digi-compte/digi-compte-detail.component').then((c) => c.DigiCompteDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail compte | ${APP_TITLE}`
      },
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./demo/pages/maintenance/maintain-error/maintain-error.component').then((c) => c.MaintainErrorComponent)
  }
];
