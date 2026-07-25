import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const HelpdeskRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./helpdesk-dashboard/helpdesk-dashboard.component').then((c) => c.HelpdeskDashboardComponent),
        data: { roles: [Role.Admin] },
        title: `Helpdesk Dashboard | ${APP_TITLE}`
      },
      {
        path: 'ticket',
        loadChildren: () => import('./helpdesk-ticket/helpdesk-ticket-routing').then((m) => m.HelpdeskTicketRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Helpdesk Ticket | ${APP_TITLE}`
      },
      {
        path: 'customer',
        loadComponent: () => import('./helpdesk-customer/helpdesk-customer.component').then((c) => c.HelpdeskCustomerComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Helpdesk Customer | ${APP_TITLE}`
      }
    ]
  }
];
