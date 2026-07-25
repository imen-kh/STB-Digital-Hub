// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-theme-compact',
  imports: [...SHARED_IMPORTS],
  templateUrl: './theme-compact.component.html',
  styleUrl: './theme-compact.component.scss'
})
export class ThemeCompactComponent {}
