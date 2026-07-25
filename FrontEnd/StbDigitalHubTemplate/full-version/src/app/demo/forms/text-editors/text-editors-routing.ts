// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const TextEditorRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'quill-editor',
        loadComponent: () => import('./quill-editor/quill-editor.component').then((c) => c.QuillEditorComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Quill | ${APP_TITLE}`
      },
      {
        path: 'editor',
        loadComponent: () => import('./editor/editor.component').then((c) => c.EditorComponent),
        data: { role: [Role.Admin, Role.User] },
        title: `Classic Editor | ${APP_TITLE}`
      }
    ]
  }
];
