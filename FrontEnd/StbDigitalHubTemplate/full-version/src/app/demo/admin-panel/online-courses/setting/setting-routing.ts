import { Routes } from '@angular/router';

// project import
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const SettingRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'payment',
        loadComponent: () => import('./setting-payment/setting-payment.component').then((c) => c.SettingPaymentComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Setting Payment | ${APP_TITLE}`
      },
      {
        path: 'price',
        loadComponent: () => import('./setting-pricing/setting-pricing.component').then((c) => c.SettingPricingComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Setting Pricing | ${APP_TITLE}`
      },
      {
        path: 'notification',
        loadComponent: () => import('./setting-notification/setting-notification.component').then((c) => c.SettingNotificationComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Setting Notification  | ${APP_TITLE}`
      }
    ]
  }
];
