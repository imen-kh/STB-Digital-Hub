// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-horizontal',
  imports: [...SHARED_IMPORTS],
  templateUrl: './theme-horizontal.component.html',
  styleUrl: './theme-horizontal.component.scss'
})
export class ThemeHorizontalComponent {}
