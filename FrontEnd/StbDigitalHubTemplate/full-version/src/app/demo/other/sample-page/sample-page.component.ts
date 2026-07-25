// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-sample-page',
  imports: [...SHARED_IMPORTS],
  templateUrl: './sample-page.component.html',
  styleUrl: './sample-page.component.scss'
})
export class SamplePageComponent {}
