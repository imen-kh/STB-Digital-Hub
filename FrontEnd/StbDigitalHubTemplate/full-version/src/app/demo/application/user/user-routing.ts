// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const UserRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'social-profile',
        loadComponent: () => import('./social-profile/social-profile.component').then((c) => c.SocialProfileComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Social Profile | ${APP_TITLE}`
      },
      {
        path: 'accountProfile',
        loadChildren: () => import('./account-profile/account-profile-routing').then((m) => m.AccountProfileRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Account Profile | ${APP_TITLE}`
      },
      {
        path: 'cards',
        loadChildren: () => import('./cards/cards-routing').then((m) => m.UserCardRoutes),
        data: { roles: [Role.Admin] },
        title: `User Card | ${APP_TITLE}`
      },
      {
        path: 'list',
        loadChildren: () => import('./list/list-routing').then((m) => m.UserListRoutes),
        data: { roles: [Role.Admin] },
        title: `User List | ${APP_TITLE}`
      }
    ]
  }
];
