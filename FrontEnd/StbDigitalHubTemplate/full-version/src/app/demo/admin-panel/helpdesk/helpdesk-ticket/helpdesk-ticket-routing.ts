import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const HelpdeskTicketRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'create',
        loadComponent: () => import('./ticket-create/ticket-create.component').then((c) => c.TicketCreateComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Ticket Create | ${APP_TITLE}`
      },
      {
        path: 'list',
        loadComponent: () => import('./ticket-list/ticket-list.component').then((c) => c.TicketListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Ticket List | ${APP_TITLE}`
      },
      {
        path: 'details',
        loadComponent: () => import('./ticket-details/ticket-details.component').then((c) => c.TicketDetailsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Ticket Details | ${APP_TITLE}`
      }
    ]
  }
];
