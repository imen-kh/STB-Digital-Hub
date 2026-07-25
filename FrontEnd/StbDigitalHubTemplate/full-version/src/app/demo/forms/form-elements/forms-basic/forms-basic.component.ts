// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// bootstrap import
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-forms-basic',
  imports: [...SHARED_IMPORTS, NgbDropdownModule],
  templateUrl: './forms-basic.component.html',
  styleUrl: './forms-basic.component.scss'
})
export class FormsBasicComponent {}
