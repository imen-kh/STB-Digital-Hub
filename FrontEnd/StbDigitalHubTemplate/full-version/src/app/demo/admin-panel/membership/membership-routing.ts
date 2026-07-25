import { Routes } from '@angular/router';
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const MembershipRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./membership-dashboard/membership-dashboard.component').then((c) => c.MembershipDashboardComponent),
        data: {
          role: [Role.Admin]
        },
        title: `Membership Dashboard | ${APP_TITLE}`
      },
      {
        path: 'list',
        loadComponent: () => import('./membership-list/membership-list.component').then((c) => c.MembershipListComponent),
        data: {
          role: [Role.Admin, Role.User]
        },
        title: `Membership List | ${APP_TITLE}`
      },
      {
        path: 'price',
        loadComponent: () => import('./membership-price/membership-price.component').then((c) => c.MembershipPriceComponent),
        data: {
          role: [Role.Admin, Role.User]
        },
        title: `Membership Price | ${APP_TITLE}`
      },
      {
        path: 'setting',
        loadComponent: () => import('./membership-setting/membership-setting.component').then((c) => c.MembershipSettingComponent),
        data: {
          role: [Role.Admin, Role.User]
        },
        title: `Membership Setting | ${APP_TITLE}`
      }
    ]
  }
];
