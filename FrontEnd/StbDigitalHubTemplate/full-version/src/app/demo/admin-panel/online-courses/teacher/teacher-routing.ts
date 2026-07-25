// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const TeacherRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        loadComponent: () => import('./teacher-list/teacher-list.component').then((c) => c.TeacherListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Teacher List | ${APP_TITLE}`
      },
      {
        path: 'apply',
        loadComponent: () => import('./teacher-apply/teacher-apply.component').then((c) => c.TeacherApplyComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Teacher Apply | ${APP_TITLE}`
      },
      {
        path: 'add',
        loadComponent: () => import('./teacher-add/teacher-add.component').then((c) => c.TeacherAddComponent),
        data: { roles: [Role.Admin] },
        title: `Teacher Add | ${APP_TITLE}`
      }
    ]
  }
];
