// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-badges',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-badges.component.html',
  styleUrl: './basic-badges.component.scss'
})
export class BasicBadgesComponent {}
