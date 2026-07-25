// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-other',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-other.component.html',
  styleUrl: './basic-other.component.scss'
})
export class BasicOtherComponent {}
