// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const FormsElementsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'basic',
        loadComponent: () => import('./forms-basic/forms-basic.component').then((c) => c.FormsBasicComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Form Basic | ${APP_TITLE}`
      },
      {
        path: 'floating',
        loadComponent: () => import('./form-floating/form-floating.component').then((c) => c.FormFloatingComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Form Floating | ${APP_TITLE}`
      },
      {
        path: 'options',
        loadComponent: () => import('./form-options/form-options.component').then((c) => c.FormOptionsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Form Options | ${APP_TITLE}`
      },
      {
        path: 'input-group',
        loadComponent: () => import('./input-group/input-group.component').then((c) => c.InputGroupComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Input Group | ${APP_TITLE}`
      },
      {
        path: 'checkbox',
        loadComponent: () => import('./checkbox/checkbox.component').then((c) => c.CheckboxComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Checkbox | ${APP_TITLE}`
      },
      {
        path: 'radio',
        loadComponent: () => import('./radio/radio.component').then((c) => c.RadioComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Radio | ${APP_TITLE}`
      },
      {
        path: 'switch',
        loadComponent: () => import('./form-switch/form-switch.component').then((c) => c.FormSwitchComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Switch | ${APP_TITLE}`
      },
      {
        path: 'mega-option',
        loadComponent: () => import('./mega-option/mega-option.component').then((c) => c.MegaOptionComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Mega Option | ${APP_TITLE}`
      }
    ]
  }
];
