// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-theme-vertical',
  imports: [...SHARED_IMPORTS],
  templateUrl: './theme-vertical.component.html',
  styleUrl: './theme-vertical.component.scss'
})
export class ThemeVerticalComponent {}
