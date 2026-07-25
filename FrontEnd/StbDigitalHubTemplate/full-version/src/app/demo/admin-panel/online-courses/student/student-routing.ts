import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

export const StudentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        loadComponent: () => import('./student-list/student-list.component').then((c) => c.StudentListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Student List | ${APP_TITLE}`
      },
      {
        path: 'apply',
        loadComponent: () => import('./student-apply/student-apply.component').then((c) => c.StudentApplyComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Student Apply | ${APP_TITLE}`
      },
      {
        path: 'add',
        loadComponent: () => import('./student-add/student-add.component').then((c) => c.StudentAddComponent),
        data: { roles: [Role.Admin] },
        title: `Student Add | ${APP_TITLE}`
      }
    ]
  }
];
