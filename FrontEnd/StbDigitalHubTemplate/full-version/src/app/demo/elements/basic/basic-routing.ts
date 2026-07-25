// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const BasicComponentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'alert',
        pathMatch: 'full'
      },
      {
        path: 'alert',
        loadComponent: () => import('./basic-alert/basic-alert.component').then((c) => c.BasicAlertComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Alert | ${APP_TITLE}`
      },
      {
        path: 'button',
        loadComponent: () => import('./basic-button/basic-button.component').then((c) => c.BasicButtonComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Button | ${APP_TITLE}`
      },
      {
        path: 'badges',
        loadComponent: () => import('./basic-badges/basic-badges.component').then((c) => c.BasicBadgesComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Badges | ${APP_TITLE}`
      },
      {
        path: 'breadcrumb',
        loadComponent: () => import('./basic-breadcrumb/basic-breadcrumb.component').then((c) => c.BasicBreadcrumbComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Breadcrumb | ${APP_TITLE}`
      },
      {
        path: 'cards',
        loadComponent: () => import('./basic-cards/basic-cards.component').then((c) => c.BasicCardsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Cards | ${APP_TITLE}`
      },
      {
        path: 'carousel',
        loadComponent: () => import('./basic-carousel/basic-carousel.component').then((c) => c.BasicCarouselComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Carousel | ${APP_TITLE}`
      },
      {
        path: 'collapse',
        loadComponent: () => import('./basic-collapse/basic-collapse.component').then((c) => c.BasicCollapseComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Collapse | ${APP_TITLE}`
      },
      {
        path: 'dropdowns',
        loadComponent: () => import('./basic-dropdowns/basic-dropdowns.component').then((c) => c.BasicDropdownsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Dropdowns | ${APP_TITLE}`
      },
      {
        path: 'offcanvas',
        loadComponent: () => import('./basic-offcanvas/basic-offcanvas.component').then((c) => c.BasicOffcanvasComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Offcanvas | ${APP_TITLE}`
      },
      {
        path: 'placeholder',
        loadComponent: () => import('./placeholder/placeholder.component').then((c) => c.PlaceholderComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Placeholder | ${APP_TITLE}`
      },
      {
        path: 'progress',
        loadComponent: () => import('./basic-progress/basic-progress.component').then((c) => c.BasicProgressComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Progress | ${APP_TITLE}`
      },
      {
        path: 'listGroup',
        loadComponent: () => import('./basic-list-group/basic-list-group.component').then((c) => c.BasicListGroupComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `List Group | ${APP_TITLE}`
      },
      {
        path: 'modal',
        loadComponent: () => import('./basic-modal/basic-modal.component').then((c) => c.BasicModalComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Modal | ${APP_TITLE}`
      },
      {
        path: 'spinner',
        loadComponent: () => import('./basic-spinner/basic-spinner.component').then((c) => c.BasicSpinnerComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Spinner | ${APP_TITLE}`
      },
      {
        path: 'tabs-pills',
        loadComponent: () => import('./basic-tabs-pills/basic-tabs-pills.component').then((c) => c.BasicTabsPillsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Tabs & Pills | ${APP_TITLE}`
      },
      {
        path: 'toasts',
        loadComponent: () => import('./toasts/toasts.component').then((c) => c.ToastsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Toasts | ${APP_TITLE}`
      },
      {
        path: 'other',
        loadComponent: () => import('./basic-other/basic-other.component').then((c) => c.BasicOtherComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Other | ${APP_TITLE}`
      }
    ]
  }
];
