// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const FileUploadRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dropzone',
        loadComponent: () => import('./file-dropzone/file-dropzone.component').then((c) => c.FileDropzoneComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Dropzone | ${APP_TITLE}`
      }
    ]
  }
];
