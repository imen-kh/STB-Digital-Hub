// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const OnlineCoursesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./online-dashboard/online-dashboard.component').then((c) => c.OnlineDashboardComponent),
        data: { roles: [Role.Admin] },
        title: `Online Courses | ${APP_TITLE}`
      },
      {
        path: 'teacher',
        loadChildren: () => import('./teacher/teacher-routing').then((m) => m.TeacherRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Teacher | ${APP_TITLE}`
      },
      {
        path: 'student',
        loadChildren: () => import('./student/student-routing').then((m) => m.StudentRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Student | ${APP_TITLE}`
      },
      {
        path: 'courses',
        loadChildren: () => import('./courses/courses-routing').then((m) => m.CoursesRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Courses | ${APP_TITLE}`
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pricing/pricing.component').then((c) => c.PricingComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Pricing | ${APP_TITLE}`
      },
      {
        path: 'site',
        loadComponent: () => import('./site/site.component').then((c) => c.SiteComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Site | ${APP_TITLE}`
      },
      {
        path: 'setting',
        loadChildren: () => import('./setting/setting-routing').then((m) => m.SettingRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Setting | ${APP_TITLE}`
      }
    ]
  }
];
