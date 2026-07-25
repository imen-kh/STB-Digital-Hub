// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-form-multicolumn',
  imports: [...SHARED_IMPORTS],
  templateUrl: './form-multicolumn.component.html',
  styleUrl: './form-multicolumn.component.scss'
})
export class FormMulticolumnComponent {}
