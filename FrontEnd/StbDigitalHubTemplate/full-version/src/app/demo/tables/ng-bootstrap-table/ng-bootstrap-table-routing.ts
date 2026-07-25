// angular import
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const NgTableRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'basicTable',
        loadComponent: () => import('./basic-table/basic-table.component').then((c) => c.BasicTableComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Basic Table | ${APP_TITLE}`
      },
      {
        path: 'filterTable',
        loadComponent: () => import('./filtering-table/filtering-table.component').then((c) => c.FilteringTableComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Filter Table | ${APP_TITLE}`
      },
      {
        path: 'pagination',
        loadComponent: () => import('./pagination-table/pagination-table.component').then((c) => c.PaginationTableComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Pagination Table | ${APP_TITLE}`
      },
      {
        path: 'ngTable',
        loadComponent: () => import('./ng-table/ng-table.component').then((c) => c.NgTableComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Ng Table | ${APP_TITLE}`
      }
    ]
  }
];
