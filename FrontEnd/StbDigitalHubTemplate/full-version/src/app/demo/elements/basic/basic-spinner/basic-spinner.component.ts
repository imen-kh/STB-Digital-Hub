// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-spinner',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-spinner.component.html',
  styleUrl: './basic-spinner.component.scss'
})
export class BasicSpinnerComponent {}
