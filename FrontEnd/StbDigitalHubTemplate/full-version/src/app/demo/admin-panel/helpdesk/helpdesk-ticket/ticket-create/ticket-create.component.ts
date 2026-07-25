// angular import
import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { QuillModule } from 'ngx-quill';
import { FileUploadModule, FileUploadValidators } from '@iplab/ngx-file-upload';

@Component({
  selector: 'app-ticket-create',
  imports: [...SHARED_IMPORTS, QuillModule, FileUploadModule],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.scss'
})
export class TicketCreateComponent {
  private filesControl = new FormControl<File[]>(null!, FileUploadValidators.filesLimit(2));
  demoForm = new FormGroup({
    files: this.filesControl
  });
}
