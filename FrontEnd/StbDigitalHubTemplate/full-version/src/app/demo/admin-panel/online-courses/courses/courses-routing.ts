import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const CoursesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'view',
        loadComponent: () => import('./courses-view/courses-view.component').then((c) => c.CoursesViewComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Courses View | ${APP_TITLE}`
      },
      {
        path: 'add',
        loadComponent: () => import('./courses-add/courses-add.component').then((c) => c.CoursesAddComponent),
        data: { role: [Role.Admin] },
        title: `Add Courses | ${APP_TITLE}`
      }
    ]
  }
];
