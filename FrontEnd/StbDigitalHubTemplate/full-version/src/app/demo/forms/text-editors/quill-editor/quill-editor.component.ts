// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third Party
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-quill-editor',
  imports: [QuillModule, ...SHARED_IMPORTS],
  templateUrl: './quill-editor.component.html',
  styleUrl: './quill-editor.component.scss'
})
export class QuillEditorComponent {}
