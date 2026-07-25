import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const InvoiceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./invoice-dashboard/invoice-dashboard.component').then((c) => c.InvoiceDashboardComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Invoice Dashboard | ${APP_TITLE}`
      },
      {
        path: 'create',
        loadComponent: () => import('./invoice-create/invoice-create.component').then((c) => c.InvoiceCreateComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Invoice Create | ${APP_TITLE}`
      },
      {
        path: 'details',
        loadComponent: () => import('./invoice-details/invoice-details.component').then((c) => c.InvoiceDetailsComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Invoice Details | ${APP_TITLE}`
      },
      {
        path: 'list',
        loadComponent: () => import('./invoice-list/invoice-list.component').then((c) => c.InvoiceListComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Invoice List | ${APP_TITLE}`
      },
      {
        path: 'edit',
        loadComponent: () => import('./invoice-edit/invoice-edit.component').then((c) => c.InvoiceEditComponent),
        data: { role: [Role.Admin] },
        title: `Invoice Edit | ${APP_TITLE}`
      }
    ]
  }
];
