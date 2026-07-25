// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-forms-layouts',
  imports: [...SHARED_IMPORTS],
  templateUrl: './forms-layouts.component.html',
  styleUrl: './forms-layouts.component.scss'
})
export class FormsLayoutsComponent {}
