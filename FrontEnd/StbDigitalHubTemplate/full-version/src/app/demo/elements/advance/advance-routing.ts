// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const AdvanceComponentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'sweetAlert',
        loadComponent: () => import('./sweet-alert/sweet-alert.component').then((c) => c.SweetAlertComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Sweet Alert | ${APP_TITLE}`
      },
      {
        path: 'datepicker',
        loadChildren: () => import('./datepicker/datepicker-routing').then((m) => m.DatepickerRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Date Picker | ${APP_TITLE}`
      },
      {
        path: 'lightbox',
        loadComponent: () => import('./adv-lightbox/adv-lightbox.component').then((c) => c.AdvLightboxComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Light Box | ${APP_TITLE}`
      },
      {
        path: 'modal',
        loadComponent: () => import('./advance-modal/advance-modal.component').then((c) => c.AdvanceModalComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Modal | ${APP_TITLE}`
      },
      {
        path: 'notification',
        loadChildren: () => import('./adv-notification/adv-notification-routing.module').then((e) => e.AdvNotificationRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Notification | ${APP_TITLE}`
      },
      {
        path: 'rangeSlider',
        loadComponent: () => import('./adv-range-slider/adv-range-slider.component').then((c) => c.AdvRangeSliderComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Range Slider | ${APP_TITLE}`
      },
      {
        path: 'treeView',
        loadComponent: () => import('./tree-view/tree-view.component'),
        data: { roles: [Role.Admin, Role.User] },
        title: `Tree View | ${APP_TITLE}`
      }
    ]
  }
];
