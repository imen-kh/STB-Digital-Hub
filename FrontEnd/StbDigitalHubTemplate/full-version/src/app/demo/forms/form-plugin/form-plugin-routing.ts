// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const FormsPluginsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'date-picker',
        loadComponent: () => import('./date-picker/date-picker.component').then((c) => c.DatePickerComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Date Picker | ${APP_TITLE}`
      },
      {
        path: 'input-select',
        loadComponent: () => import('./input-select/input-select.component').then((c) => c.InputSelectComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Select | ${APP_TITLE}`
      },
      {
        path: 'gRecaptcha',
        loadComponent: () => import('./re-captcha/re-captcha.component').then((c) => c.ReCaptchaComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `ReCaptcha | ${APP_TITLE}`
      },
      {
        path: 'input-mask',
        loadComponent: () => import('./input-mask/input-mask.component').then((c) => c.InputMaskComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Input Mask | ${APP_TITLE}`
      },
      {
        path: 'clipboard',
        loadComponent: () => import('./clipboard/clipboard.component').then((c) => c.ClipboardComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Clipboard | ${APP_TITLE}`
      },
      {
        path: 'typeAhead',
        loadComponent: () => import('./form-typeahead/form-typeahead.component').then((c) => c.FormTypeaheadComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `TypeAhead | ${APP_TITLE}`
      }
    ]
  }
];
