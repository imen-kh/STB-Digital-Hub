// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const FormsLayoutsComponentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'layout',
        loadComponent: () => import('./forms-layouts/forms-layouts.component').then((c) => c.FormsLayoutsComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Form Layouts | ${APP_TITLE}`
      },
      {
        path: 'actionBars',
        loadComponent: () => import('./form-actionbars/form-actionbars.component').then((c) => c.FormActionbarsComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Form Actionbars | ${APP_TITLE}`
      },
      {
        path: 'multiColumn',
        loadComponent: () => import('./form-multicolumn/form-multicolumn.component').then((c) => c.FormMulticolumnComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Form MultiColumn | ${APP_TITLE}`
      },
      {
        path: 'stickyBar',
        loadComponent: () => import('./sticky-actionbar/sticky-actionbar.component').then((c) => c.StickyActionbarComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Sticky Actionbar | ${APP_TITLE}`
      }
    ]
  }
];
