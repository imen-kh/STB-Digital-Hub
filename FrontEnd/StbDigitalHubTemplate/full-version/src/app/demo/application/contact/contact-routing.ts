// angular imports
import { Routes } from '@angular/router';

// project imports
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const ContactRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'cards',
        loadComponent: () => import('./cards/cards.component').then((c) => c.CardsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Contact Card | ${APP_TITLE}`
      },
      {
        path: 'list',
        loadComponent: () => import('./contact-list/contact-list.component').then((c) => c.ContactListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Contact List | ${APP_TITLE}`
      }
    ]
  }
];
