// angular imports
import { Routes } from '@angular/router';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const LayoutsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'vertical',
        loadComponent: () => import('./theme-vertical/theme-vertical.component').then((c) => c.ThemeVerticalComponent),
        title: `Vertical | ${APP_TITLE}`
      },
      {
        path: 'horizontal',
        loadComponent: () => import('./theme-horizontal/theme-horizontal.component').then((c) => c.ThemeHorizontalComponent),
        title: `Horizontal | ${APP_TITLE}`
      },
      {
        path: 'compact',
        loadComponent: () => import('./theme-compact/theme-compact.component').then((c) => c.ThemeCompactComponent),
        title: `Compact | ${APP_TITLE}`
      }
    ]
  }
];
