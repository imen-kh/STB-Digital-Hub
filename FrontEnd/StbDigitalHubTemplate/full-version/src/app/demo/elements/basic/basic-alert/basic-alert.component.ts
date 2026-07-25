// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-alert',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-alert.component.html',
  styleUrl: './basic-alert.component.scss'
})
export class BasicAlertComponent {}
